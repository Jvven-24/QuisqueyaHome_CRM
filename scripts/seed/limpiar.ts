import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, gte, lt, sql, getTableColumns, getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import * as schema from '../../src/infrastructure/db/schema.ts';
import { BASE_ID, CLEAN_ORDER, SEED_RANGES } from './catalog.ts';
import { localDatabaseUrl, safeFailure } from './local.ts';

async function main() {
  const connection = postgres(localDatabaseUrl(), { prepare: false, max: 1, connect_timeout: 5 });
  try {
    const [identity] = await connection`select current_database() as name, inet_server_addr()::text as host`;
    if (identity?.name !== 'quisqueyahome_crm' || !['127.0.0.1', '::1'].includes(String(identity?.host).split('/')[0]!)) throw new Error('Destino no autorizado');
    const db = drizzle(connection);
    const deletedCounts = await db.transaction(async tx => {
      await tx.execute(sql`set local lock_timeout = '5s'`);
      await tx.execute(sql`set local statement_timeout = '60s'`);
      await tx.execute(sql`select pg_advisory_xact_lock(20261004)`);
      const ranges = new Map<string, { key: keyof typeof SEED_RANGES; count: number; pk: string }>(CLEAN_ORDER.map(key => [getTableName(schema[key]), { key, count: SEED_RANGES[key], pk: key === 'brokerProfiles' ? 'user_id' : 'id' }]));
      // Detecta también CASCADE: una FK no puede borrar filas ajenas indirectamente.
      const foreignKeys = await tx.execute<{
        source: string; sourceSchema: string; target: string; columns: number;
        sourceColumn: string; targetColumn: string;
      }>(sql`select s.relname as source, ns.nspname as "sourceSchema", t.relname as target,
          array_length(c.conkey, 1) as columns, a.attname as "sourceColumn", b.attname as "targetColumn"
        from pg_constraint c join pg_class s on s.oid=c.conrelid join pg_namespace ns on ns.oid=s.relnamespace
        join pg_class t on t.oid=c.confrelid join pg_namespace nt on nt.oid=t.relnamespace
        join pg_attribute a on a.attrelid=s.oid and a.attnum=c.conkey[1]
        join pg_attribute b on b.attrelid=t.oid and b.attnum=c.confkey[1]
        where c.contype='f' and nt.nspname='public'`);
      const inbound = foreignKeys.filter(fk => ranges.has(fk.target));
      const lockedTables = new Set([...ranges.keys()].map(name => `public.${name}`));
      inbound.forEach(fk => lockedTables.add(`${fk.sourceSchema}.${fk.source}`));
      for (const qualified of [...lockedTables].sort()) {
        const [namespace, name] = qualified.split('.');
        await tx.execute(sql`lock table ${sql.identifier(namespace!)}.${sql.identifier(name!)} in share row exclusive mode`);
      }
      for (const fk of inbound) {
        const target = ranges.get(fk.target)!;
        if (fk.columns !== 1 || fk.targetColumn !== target.pk) throw new Error('FK no soportada; limpieza abortada sin borrar');
        const source = fk.sourceSchema === 'public' ? ranges.get(fk.source) : undefined;
        const eligible = source ? sql`s.${sql.identifier(source.pk)} >= ${BASE_ID} and s.${sql.identifier(source.pk)} < ${BASE_ID + source.count}` : sql`false`;
        const outsiders = await tx.execute(sql`select 1 from ${sql.identifier(fk.sourceSchema)}.${sql.identifier(fk.source)} s
          join ${sql.identifier('public')}.${sql.identifier(fk.target)} t on s.${sql.identifier(fk.sourceColumn)} = t.${sql.identifier(fk.targetColumn)}
          where t.${sql.identifier(target.pk)} >= ${BASE_ID} and t.${sql.identifier(target.pk)} < ${BASE_ID + target.count}
          and not (${eligible}) limit 1`);
        if (outsiders.length) throw new Error(`Referencias ajenas al seed en ${fk.source}; limpieza abortada sin borrar`);
      }
      // Hashes solo en memoria: no se imprimen filas ni datos personales.
      const outsideFingerprint = async (key: keyof typeof SEED_RANGES) => {
        const table: PgTable = schema[key];
        const pk = getTableColumns(table)[key === 'brokerProfiles' ? 'userId' : 'id']!;
        const column = sql` t.${sql.identifier(pk.name)}`;
        const [result] = await tx.execute(sql`select count(*)::int as count,
          md5(coalesce(string_agg(md5(row_to_json(t)::text), '' order by ${column}), '')) as digest
          from ${table} t where not (${column} >= ${BASE_ID} and ${column} < ${BASE_ID + SEED_RANGES[key]})`);
        return JSON.stringify(result);
      };
      const before = new Map<keyof typeof SEED_RANGES, string>();
      for (const key of CLEAN_ORDER) before.set(key, await outsideFingerprint(key));
      const summary: Record<string, number> = {};
      for (const key of CLEAN_ORDER) {
        const table: PgTable = schema[key];
        const pk = getTableColumns(table)[key === 'brokerProfiles' ? 'userId' : 'id']!;
        const deleted = await tx.delete(table).where(and(gte(pk, BASE_ID), lt(pk, BASE_ID + SEED_RANGES[key]))).returning({ pk });
        summary[getTableName(table)] = deleted.length;
      }
      for (const key of CLEAN_ORDER) if (before.get(key) !== await outsideFingerprint(key)) throw new Error('Cambió una fila ajena al seed; transacción revertida');
      return summary;
    });
    console.log(JSON.stringify({ localDestination: 'PASS', outsideRowsUnchanged: true, deletedCounts }, null, 2));
  } finally { await connection.end({ timeout: 5 }); }
}
await main().catch(safeFailure);
