import assert from 'node:assert/strict';
import { randomBytes, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { localDatabaseUrl, assertLocalDestination } from '../seed/local.ts';
import { conMigracionesHasta } from './migracion-poblada.mjs';
import { inventory, assertOriginalsPreserved } from './inventario.ts';

const root = new URL('../../', import.meta.url);
const migration = new URL('drizzle/0010_m40_backfill_legado.sql', root);
const namePattern = /^quisqueyahome_crm_test_[a-f0-9]{20}$/;
const options = { max: 1, prepare: false, connect_timeout: 5, onnotice: () => {},
  connection: { statement_timeout: 60000, lock_timeout: 5000, timezone: 'UTC' } };
const copyTables = ['roles', 'pipeline_stages', 'lead_sources', 'loss_reasons', 'zones', 'agencies',
  'payment_methods', 'unit_inventory_states', 'users', 'permissions', 'broker_profiles',
  'marketing_campaigns', 'campaign_spend', 'projects', 'units', 'contacts', 'leads', 'deals',
  'deal_properties', 'deal_stage_history', 'activities', 'commissions', 'goals', 'unit_sales'];
const structuralText = new Set(['slug', 'code', 'kind', 'scope', 'resource', 'action', 'currency',
  'operation_type', 'status', 'legacy_status', 'activity_type', 'priority', 'level', 'country_code',
  'buyer_type', 'property_type', 'payment_frequency', 'unit_code_normalized']);
const excluded = new Set(['password_hash', 'auth_user_id']);

// SQL errors must never reach node:test (it serializes query/parameters/cause).
export async function safe(operation) {
  try { return await operation(); }
  catch (error) {
    if (error instanceof assert.AssertionError) throw error; // synthetic hashes/counts only
    const code = error?.cause?.code ?? error?.code;
    throw new Error(`M40 b1h abortado (${typeof code === 'string' && /^[A-Z0-9_]{1,40}$/.test(code) ? code : 'CONFIGURATION'}); detalles omitidos.`);
  }
}

async function assertTarget(connection) {
  const [row] = await connection`select current_database() as db, current_schema() as schema,
    inet_server_addr()::text as host, inet_server_port() as port`;
  assert.ok(namePattern.test(row.db), 'solo base aleatoria de pruebas');
  assert.equal(row.schema, 'public');
  assert.ok(['127.0.0.1', '::1'].includes(String(row.host).split('/')[0]));
  assert.equal(row.port, 5432);
}

/** Exact SQL as in the official migrator, additionally replayable for TX-32.
 * The caller owns the transaction; never accepts a development destination. */
export async function replayBackfill(tx) {
  assert.equal(typeof tx.savepoint, 'function', 'el replay requiere una transacción explícita');
  await assertTarget(tx);
  const source = await readFile(migration, 'utf8');
  for (const statement of source.split('--> statement-breakpoint')) await tx.unsafe(statement);
}

/** The fixed projection is also the provenance snapshot, without PII/bank data.
 * Money is explicitly SQL text; no Number conversion, even above MAX_SAFE_INTEGER.
 * This is not evidence of accrual, eligibility, payment or reconciliation. */
export async function legacyManifest(connection) {
  const commissions = await connection`select id, deal_id, broker_id, currency, status,
    sale_amount_cents::text, total_commission_cents::text,
    broker_amount_cents::text, agency_amount_cents::text,
    commission_basis_points, broker_share_basis_points, agency_share_basis_points,
    closed_date::text, approved_by, approved_at::text, paid_at::text,
    created_by, created_at::text, updated_by, updated_at::text
    from commissions order by id`;
  const anomalies = { currency: 0, negative: 0, overflow: 0, split: 0, status: 0 };
  for (const row of commissions) {
    if (!['USD', 'DOP'].includes(row.currency)) anomalies.currency++;
    if (!['pending', 'approved', 'paid', 'void'].includes(row.status)) anomalies.status++;
    for (const key of ['sale_amount_cents', 'total_commission_cents', 'broker_amount_cents', 'agency_amount_cents']) {
      const cents = BigInt(row[key]);
      if (cents < 0n) anomalies.negative++;
      if (cents < -9223372036854775808n || cents > 9223372036854775807n) anomalies.overflow++;
    }
    if (BigInt(row.broker_amount_cents) + BigInt(row.agency_amount_cents) !== BigInt(row.total_commission_cents)) anomalies.split++;
  }
  const [legacy] = await connection`select count(*)::int as n from deals d
    join pipeline_stages s on s.id=d.stage_id where s.kind='won' and d.operation_type='sale'
    and not exists (select 1 from unit_sales us where us.deal_id=d.id)`;
  return { version: 1, financialEvidence: 'no_verificada', commissions, anomalies,
    wonWithoutDurableSale: legacy.n,
    sha256: createHash('sha256').update(JSON.stringify(commissions)).digest('hex') };
}

/** Read-only source; copy only inside a fresh, verified random DB. */
async function copyPopulated(source, target) {
  // 0004 deliberately grandfathered historical missing loss comments with NOT
  // VALID. Loading that same history after 0004 would recheck INSERTs. Recreate
  // the identical NOT VALID constraint only in the empty random destination.
  await target`alter table deals drop constraint deals_loss_comment_required`;
  await source.begin('isolation level repeatable read read only', async src => {
    for (const table of copyTables) {
      console.log(`M40 COPY TABLE: ${table}`);
      const columns = await target`select column_name, data_type from information_schema.columns
        where table_schema='public' and table_name=${table} order by ordinal_position`;
      const names = columns.map(c => c.column_name).filter(c => !excluded.has(c));
      const available = await src`select column_name from information_schema.columns where table_schema='public' and table_name=${table}`;
      const missing = names.filter(name => !available.some(column => column.column_name === name));
      assert.deepEqual(missing, [], `copia requiere columnas de origen: ${table}`);
      // Read dates as SQL text too: JS Date would silently truncate microseconds.
      const projection = columns.filter(c => names.includes(c.column_name)).map(c => {
        const quoted = `"${c.column_name.replaceAll('"', '""')}"`;
        return /^(timestamp|date|time)/.test(c.data_type) ? `${quoted}::text as ${quoted}` : quoted;
      }).join(',');
      const rows = await src`select ${src.unsafe(projection)} from ${src('public')}.${src(table)}`;
      for (const [i, row] of rows.entries()) for (const column of columns) {
        const key = column.column_name;
        if (row[key] == null) continue;
        if (column.data_type === 'jsonb' || column.data_type === 'json') row[key] = '{}';
        else if (column.data_type === 'text' && !structuralText.has(key)) {
          row[key] = key.includes('email') ? `qa-${table}-${i}@example.invalid`
            : key.includes('phone') ? `+1809${String(i).padStart(7, '0')}` : `QA-${table}-${i}`;
        } else if (row[key] instanceof Date) row[key] = row[key].toISOString();
        else if (['number', 'boolean', 'bigint'].includes(typeof row[key])) row[key] = String(row[key]);
      }
      for (let offset = 0; offset < rows.length; offset += 100)
        await target`insert into ${target(table)} ${target(rows.slice(offset, offset + 100), ...names)}`;
      // Existing IDs must not collide with new synthetic inserts or audit rows.
      if (names.includes('id')) {
        const [sequence] = await target`select pg_get_serial_sequence(${table}, 'id') as name`;
        if (sequence.name) await target`select setval(${sequence.name}::regclass,
          greatest(coalesce((select max(id) from ${target(table)}), 0), 1),
          exists(select 1 from ${target(table)}))`;
      }
    }
    assert.equal((await legacyManifest(target)).sha256, (await legacyManifest(src)).sha256,
      'copia conserva exactamente la proyección original de comisiones, incluidos centavos y fechas');
  });
  await target`alter table deals add constraint deals_loss_comment_required check
    (loss_reason_id is null or length(btrim(loss_comment)) > 0 and loss_comment is not null) not valid`;
}

/** No exported function can choose a write destination other than a test DB. */
export async function createBackfillHarness() {
  const parsed = new URL(process.env.DATABASE_URL ?? localDatabaseUrl());
  parsed.pathname = '/quisqueyahome_crm';
  const url = parsed.href;
  assertLocalDestination(url);
  const source = postgres(url, { ...options, connection: { ...options.connection, default_transaction_read_only: 'on' } });
  const control = postgres(url, options);
  const name = `quisqueyahome_crm_test_${randomBytes(10).toString('hex')}`;
  let connection;
  let created = false;
  let before;
  async function close() {
    try {
      await connection?.end({ timeout: 5 });
      if (created) {
        assert.match(name, namePattern);
        await control`drop database ${control(name)} with (force)`;
        console.log('M40 CLEANUP PASS: base temporal eliminada.');
      }
      if (before) {
        const after = await inventory(source);
        assertOriginalsPreserved(before, after);
        assert.deepEqual(after, before, 'M40 desarrollo conserva conteos y huellas');
        console.log('M40 DEV HASHES PASS: todas las tablas/columnas public intactas.');
      }
    } finally { await Promise.all([source.end({ timeout: 5 }), control.end({ timeout: 5 })]); }
  }
  try {
    before = await inventory(source);
    console.log(`M40 INVENTORY: ${Object.keys(before.manifest).length} tablas; deals=${before.rows.deals.count}; unit_sales=${before.rows.unit_sales.count}; commissions=${before.rows.commissions.count}.`);
    await control`create database ${control(name)} template template0`;
    created = true;
    const destination = new URL(url); destination.pathname = `/${name}`;
    connection = postgres(destination.href, options);
    await assertTarget(connection);
    const db = drizzle(connection);
    await conMigracionesHasta(9, folder => migrate(db, { migrationsFolder: folder }));
    console.log('M40 BASELINE PASS: migrador oficial hasta 0009.');
    await copyPopulated(source, connection);
    assert.equal((await inventory(connection)).rows.unit_sales.fullHash, before.rows.unit_sales.fullHash,
      'copia conserva todas las columnas originales de ventas durables');
    console.log('M40 COPY PASS: 24 tablas anonimizadas, incluidas las ventas durables reales; migrador oficial hasta 0009.');
    return { connection, db, close };
  } catch (error) { await close(); throw error; }
}

// The shared runner does not discover scripts/test-db/*.db.test.ts. Keep it
// untouched (out of dispatch); this command runs the additional exact test file.
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = spawnSync(process.execPath, ['--import', './scripts/test-db/loader.mjs', '--test',
    '--test-concurrency=1', '--test-reporter=tap', 'scripts/test-db/m40-backfill.db.test.ts'],
  { cwd: root, env: process.env, stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
}
