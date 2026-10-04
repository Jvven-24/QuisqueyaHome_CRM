import assert from 'node:assert/strict';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, gte, lt, sql, getTableColumns, getTableName } from 'drizzle-orm';
import type { PgTable, AnyPgColumn } from 'drizzle-orm/pg-core';
import * as schema from '../../src/infrastructure/db/schema.ts';
import { BASE_ID, CATALOG_KEYS, INSERT_ORDER, SEED } from './catalog.ts';
import { assertCatalogInsertSafe } from './catalog-guards.ts';
import { generateDataset, validateDataset, type Dataset } from './generator.ts';
import { localDatabaseUrl, safeFailure } from './local.ts';

/** Orden topológico; no TRUNCATE, DELETE ni UPDATE de datos existentes. */
const normal = (value: unknown): unknown => value instanceof Date ? value.toISOString() : value;
function checkStoredRows(expected: Record<string, unknown>[], actual: Record<string, unknown>[], primaryKey: string, label: string) {
  assert.equal(actual.length, expected.length, `conteo fixture ${label}`);
  const stored = new Map(actual.map(row => [row[primaryKey], row]));
  for (const row of expected) for (const [key, value] of Object.entries(row)) {
    if (value === undefined) continue;
    // Mensaje sin valor esperado/real: pueden ser datos personales.
    if (JSON.stringify(normal(stored.get(row[primaryKey])?.[key])) !== JSON.stringify(normal(value))) throw new Error(`Conflicto fixture ${label}.${key}`);
  }
}
async function main() {
  const connection = postgres(localDatabaseUrl(), { prepare: false, max: 1, connect_timeout: 5 });
  try {
    const db = drizzle(connection);
    const [identity] = await connection`select current_database() as name, inet_server_addr()::text as host, current_setting('server_version_num')::int as version`;
    assert.equal(identity!.name, 'quisqueyahome_crm'); assert.ok(['127.0.0.1', '::1'].includes(String(identity!.host).split('/')[0]!));
    console.log(`Destino local verificado; PostgreSQL ${identity!.version}.`);
    if (process.argv.includes('--counts')) {
      const counts: Record<string, number> = {};
      for (const key of INSERT_ORDER) { const rows = await db.select({ count: sql<number>`count(*)::int` }).from(schema[key]); counts[getTableName(schema[key])] = rows[0]!.count; }
      console.log(JSON.stringify({ tableCounts: counts }, null, 2)); return;
    }
    const counts = await db.transaction(async tx => {
      // Serializa semillas simultáneas, con timeout; cualquier fallo revierte inserts.
      await tx.execute(sql`set local lock_timeout = '5s'`);
      await tx.execute(sql`set local statement_timeout = '60s'`);
      await tx.execute(sql`select pg_advisory_xact_lock(20261004)`);
      // Evita una carrera de nombres con otros escritores de catálogos.
      for (const key of [...CATALOG_KEYS].sort()) await tx.execute(sql`lock table ${schema[key]} in share row exclusive mode`);
      const [brokerRole] = await tx.select().from(schema.roles).where(sql`${schema.roles.slug} = 'broker' and ${schema.roles.isActive} = true`);
      if (!brokerRole) throw new Error('Falta catálogo de rol broker; no se modifican permisos');
      const dataset = generateDataset({ brokerRoleId: brokerRole.id, pipelineStages: await tx.select().from(schema.pipelineStages), leadSources: await tx.select().from(schema.leadSources), lossReasons: await tx.select().from(schema.lossReasons) }, SEED);
      if (process.argv.includes('--dry-run')) return { dryRun: true, fixtureCounts: Object.fromEntries(INSERT_ORDER.map(key => [key, dataset[key].length])) };
      const persisted: Dataset = structuredClone(dataset);
      const summary: Record<string, number> = {};
      const inserted: Record<string, number> = {};
      for (const key of INSERT_ORDER) {
        const table: PgTable = schema[key];
        const rows: Record<string, unknown>[] = dataset[key];
        const pkName = key === 'brokerProfiles' ? 'userId' : 'id';
        const pk: AnyPgColumn = getTableColumns(table)[pkName]!;
        const existing = await tx.select().from(table).where(and(gte(pk, BASE_ID), lt(pk, BASE_ID + rows.length)));
        const storedIds = new Set(existing.map(row => row[pkName]));
        const expectedExisting = rows.filter(row => storedIds.has(row[pkName]));
        checkStoredRows(expectedExisting, existing, pkName, getTableName(table));
        const pending = rows.filter(row => !storedIds.has(row[pkName]));
        if (['zones', 'agencies', 'paymentMethods', 'unitInventoryStates'].includes(key)) {
          const catalogRows = await tx.select({ slug: getTableColumns(table).slug!, name: getTableColumns(table).name! }).from(table);
          assertCatalogInsertSafe(pending as { slug: string; name: string }[], catalogRows.map(row => ({ slug: String(row.slug), name: String(row.name) })));
        }
        inserted[getTableName(table)] = 0;
        for (let offset = 0; offset < pending.length; offset += 200) {
          const added = await tx.insert(table).values(pending.slice(offset, offset + 200)).returning({ pk });
          inserted[getTableName(table)]! += added.length;
        }
        const actual = await tx.select().from(table).where(and(gte(pk, BASE_ID), lt(pk, BASE_ID + rows.length)));
        checkStoredRows(rows, actual, pkName, getTableName(table));
        // Tipos del schema son iguales; se verificaron claves y valores arriba.
        Object.assign(persisted, { [key]: actual });
        summary[getTableName(table)] = actual.length;
      }
      validateDataset(persisted);
      for (const key of CATALOG_KEYS) {
        const table = schema[key];
        const duplicates = await tx.execute(sql`select lower(btrim(${table.name})) as name, count(*) from ${table} group by lower(btrim(${table.name})) having count(*) > 1`);
        if (duplicates.length) throw new Error(`Nombres duplicados en catálogo ${getTableName(table)}`);
      }
      // Relectura e invariantes antes de COMMIT. Solo secuencias, no datos ajenos.
      // setval no es transaccional: una interrupción puede dejar huecos seguros.
      for (const key of INSERT_ORDER) if (key !== 'brokerProfiles') {
        const table = schema[key]; const name = getTableName(table);
        if (!inserted[name]) continue;
        await tx.execute(sql`select setval(pg_get_serial_sequence(${name}, 'id'), greatest((select coalesce(max(${table.id}), 1) from ${table}), (select last_value from ${sql.identifier(`${name}_id_seq`)})), true)`);
      }
      return { fixtureCounts: summary, insertedCounts: inserted, insertedTotal: Object.values(inserted).reduce((sum, n) => sum + n, 0), duplicateCatalogNames: 0 };
    });
    console.log(JSON.stringify({ seed: SEED, invariants: process.argv.includes('--dry-run') ? 'PASS (memoria, sin escrituras)' : 'PASS (filas persistidas, antes de COMMIT)', ...counts }, null, 2));
  } finally { await connection.end({ timeout: 5 }); }
}
await main().catch(safeFailure);
