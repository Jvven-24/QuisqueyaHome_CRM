import postgres from 'postgres';
import { getTableName, is } from 'drizzle-orm';
import { PgTable, getTableConfig } from 'drizzle-orm/pg-core';
import { pathToFileURL } from 'node:url';
import * as schema from '../../src/infrastructure/db/schema.ts';
import { BASE_ID, CLEAN_ORDER, SEED_RANGES } from './catalog.ts';
import { localDatabaseUrl, safeFailure } from './local.ts';

type Range = { table: string; pk: string; count: number };
export type SeedForeignKey = { source: string; sourceSchema: string; target: string; sourceColumns: string[]; targetColumns: string[]; uniqueTarget: boolean };
const ranges: Range[] = CLEAN_ORDER.map(key => ({ table: getTableName(schema[key]), count: SEED_RANGES[key], pk: key === 'brokerProfiles' ? 'user_id' : 'id' }));
// Manifiesto autorizado: relaciones actuales y expansión G12 de esas relaciones.
const edges = new Set(Object.values(schema).filter(value => is(value, PgTable)).flatMap(table =>
  getTableConfig(table).foreignKeys.flatMap(fk => {
    const r = fk.reference();
    const pairs = r.columns.map((column, i) => ({ source: column.name, target: r.foreignColumns[i]!.name }))
      .filter(pair => !(pair.source === 'tenant_id' && pair.target === 'tenant_id'));
    return pairs.length === 1 ? [`${getTableName(table)}:${pairs[0]!.source}:${getTableName(r.foreignTable)}:${pairs[0]!.target}`] : [];
  })));

export function validateSeedForeignKey(fk: SeedForeignKey, pk: string, namespace: string) {
  const s = fk.sourceColumns;
  const t = fk.targetColumns;
  const simple = s.length === 1 && t.length === 1 && t[0] === pk;
  const pair = s.length === 2 && t.length === 2 && s[0] === 'tenant_id' && t[0] === 'tenant_id' && t[1] === pk;
  const triple = s.length === 3 && t.length === 3 && fk.target === 'units'
    && ['deal_properties', 'unit_sales'].includes(fk.source)
    && s.join(',') === 'tenant_id,project_id,unit_id' && t.join(',') === 'tenant_id,project_id,id';
  const offset = pair ? 1 : 0;
  const known = triple || edges.has(`${fk.source}:${s[offset]}:${fk.target}:${t[offset]}`);
  if (fk.sourceSchema !== namespace || !fk.uniqueTarget || !(simple || pair || triple) || !known) {
    throw new Error('FK no soportada; limpieza abortada sin borrar');
  }
}

/** El CLI verifica destino; las pruebas usan exclusivamente un esquema temporal validado. */
export async function cleanSeed(connection: postgres.Sql, tenantId?: string, namespace = 'public') {
  if (namespace !== 'public' && !/^quisqueyahome_crm_test_[a-f0-9]{20}$/.test(namespace)) throw new Error('Esquema no autorizado');
  if (tenantId !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenantId)) throw new Error('Empresa inválida');
  return connection.begin(async tx => {
    await tx`set local lock_timeout = '5s'`;
    await tx`set local statement_timeout = '60s'`;
    await tx`select pg_advisory_xact_lock(20261004)`;
    const tables = await tx<{ table: string }[]>`select tablename as table from pg_tables where schemaname=${namespace} order by tablename`;
    // Conserva también tablas no limpiables ante cascadas y escrituras concurrentes.
    for (const { table } of tables) await tx`lock table ${tx(namespace)}.${tx(table)} in share row exclusive mode`;
    const columns = await tx<{ table: string; column: string }[]>`select table_name as table,column_name as column from information_schema.columns where table_schema=${namespace}`;
    const has = (table: string, column: string) => columns.some(c => c.table === table && c.column === column);
    for (const r of ranges) if (!has(r.table, r.pk)) throw new Error('Tabla o identidad de semilla ausente');
    const expanded = columns.some(c => c.column === 'tenant_id');
    if (expanded && !tenantId) throw new Error('Empresa explícita obligatoria para limpiar esquema multiempresa');
    if (expanded && ranges.some(r => r.table !== 'users' && !has(r.table, 'tenant_id'))) throw new Error('Expansión empresarial incompleta; limpieza abortada sin borrar');
    const eligible = (table: string, alias: string) => {
      const r = ranges.find(r => r.table === table);
      if (!r) return tx`false`;
      const pk = tx(`${alias}.${r.pk}`);
      const company = has(table, 'tenant_id') ? tx`${tx(`${alias}.tenant_id`)} = ${tenantId!}::uuid` : tx`true`;
      return tx`${pk} >= ${BASE_ID} and ${pk} < ${BASE_ID + r.count} and ${company}`;
    };
    const foreignKeys = await tx<SeedForeignKey[]>`select s.relname as source, ns.nspname as "sourceSchema", t.relname as target,
      array(select a.attname::text from unnest(c.conkey) with ordinality k(num,pos)
        join pg_attribute a on a.attrelid=s.oid and a.attnum=k.num order by k.pos) as "sourceColumns",
      array(select a.attname::text from unnest(c.confkey) with ordinality k(num,pos)
        join pg_attribute a on a.attrelid=t.oid and a.attnum=k.num order by k.pos) as "targetColumns",
      exists(select 1 from pg_index i where i.indexrelid=c.conindid and i.indisunique and i.indisvalid and i.indpred is null) as "uniqueTarget"
      from pg_constraint c join pg_class s on s.oid=c.conrelid join pg_namespace ns on ns.oid=s.relnamespace
      join pg_class t on t.oid=c.confrelid join pg_namespace nt on nt.oid=t.relnamespace
      where c.contype='f' and nt.nspname=${namespace} order by ns.nspname,s.relname,c.conname`;
    const inbound = foreignKeys.filter(fk => ranges.some(r => r.table === fk.target));
    for (const fk of inbound) {
      validateSeedForeignKey(fk, ranges.find(r => r.table === fk.target)!.pk, namespace);
      const joins = fk.sourceColumns.map((column, i) => tx`${tx(`s.${column}`)} = ${tx(`t.${fk.targetColumns[i]!}`)}`);
      const outsiders = await tx`select 1 from ${tx(fk.sourceSchema)}.${tx(fk.source)} s
        join ${tx(namespace)}.${tx(fk.target)} t on ${joins.reduce((a,b) => tx`${a} and ${b}`)}
        where (${eligible(fk.target, 't')}) is true and (${eligible(fk.source, 's')}) is not true limit 1`;
      if (outsiders.length) throw new Error(`Referencias ajenas al seed en ${fk.source}; limpieza abortada sin borrar`);
    }
    const outsideFingerprint = async (table: string) => {
      const [result] = await tx`select count(*)::text as count,
        md5(coalesce(string_agg(h, ',' order by h collate "C"), '')) as digest from
        (select md5(row_to_json(t)::text) as h from ${tx(namespace)}.${tx(table)} t where (${eligible(table, 't')}) is not true) hashes`;
      return JSON.stringify(result);
    };
    const before = new Map<string, string>();
    for (const { table } of tables) before.set(table, await outsideFingerprint(table));
    const summary: Record<string, number> = {};
    for (const r of ranges) {
      const deleted = await tx`delete from ${tx(namespace)}.${tx(r.table)} t where (${eligible(r.table, 't')}) is true returning 1`;
      summary[r.table] = deleted.length;
    }
    for (const { table } of tables) if (before.get(table) !== await outsideFingerprint(table)) throw new Error('Cambió una fila ajena al seed; transacción revertida');
    return summary;
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || args.some(arg => !arg.startsWith('--tenant-id='))) throw new Error('Usa --tenant-id=<uuid> para un esquema multiempresa');
  const tenantId = args[0]?.slice('--tenant-id='.length);
  const connection = postgres(localDatabaseUrl(), { prepare: false, max: 1, connect_timeout: 5 });
  try {
    const [identity] = await connection`select current_database() as name, inet_server_addr()::text as host,inet_server_port() as port`;
    if (identity?.name !== 'quisqueyahome_crm' || identity.port !== 5432 || !['127.0.0.1', '::1'].includes(String(identity?.host).split('/')[0]!)) throw new Error('Destino no autorizado');
    const deletedCounts = await cleanSeed(connection, tenantId);
    console.log(JSON.stringify({ localDestination: 'PASS', outsideRowsUnchanged: true, deletedCounts }, null, 2));
  } finally { await connection.end({ timeout: 5 }); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main().catch(safeFailure);
