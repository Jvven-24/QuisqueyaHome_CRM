import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';
import { sql, getTableName } from 'drizzle-orm';
import * as schema from '../../src/infrastructure/db/schema.ts';
import { localDatabaseUrl } from '../seed/local.ts';
import { generateDataset } from '../seed/generator.ts';
import { INSERT_ORDER, SEED } from '../seed/catalog.ts';
import { conMigracionesHasta, ensayarMigracionPoblada, ensayarBackfillSintetico } from './migracion-poblada.mjs';
import { inventory, assertG12Tables, assertOriginalsPreserved } from './inventario.ts';

const root = new URL('../../', import.meta.url);
const namePattern = /^quisqueyahome_crm_test_[a-f0-9]{20}$/;
const args = process.argv.slice(2);
const envFile = args.find(arg => arg.startsWith('--env-file='));
if (envFile) process.loadEnvFile(envFile.slice('--env-file='.length));
const mutation = args.includes('--mutation=alias') ? 'alias' : args.includes('--mutation=boolean') ? 'boolean' : args.includes('--mutation=negocios-join') ? 'negocios-join' : args.includes('--mutation=venta-unica') ? 'venta-unica' : null;
const forceSchema = args.includes('--schema');
const options = { prepare: false, max: 1, connect_timeout: 5, idle_timeout: 10, onnotice: notice => {
  if (/^S-303-H: \d+ ventas historicas sin unidad; conservadas sin fila en unit_sales$/.test(notice.message ?? '')) console.log(`MIGRATION NOTICE: ${notice.message}`);
}, connection: { statement_timeout: 60000, lock_timeout: 5000 } };
let child;
let interrupted = false;
const stop = () => { interrupted = true; child?.kill('SIGTERM'); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

// Nunca emitir Error/cause/query/parameters: el driver puede llevar secretos.
function safeCode(error) {
  const code = error?.cause?.code ?? error?.code;
  return typeof code === 'string' && /^[A-Z0-9_]{1,40}$/.test(code) ? code : 'CONFIGURATION_OR_ASSERTION';
}
async function identity(connection, expectedDatabase, expectedSchema) {
  const [row] = await connection`select current_database() as db, current_schema() as schema, inet_server_addr()::text as host, inet_server_port() as port`;
  console.log(`SERVER IDENTITY ${JSON.stringify(row)}`);
  assert.equal(row.db, expectedDatabase);
  assert.ok(['127.0.0.1', '::1'].includes(String(row.host).split('/')[0]));
  assert.equal(row.port, 5432);
  if (expectedSchema) assert.equal(row.schema, expectedSchema);
}
async function seed(db, connection) {
  // Reutiliza el catálogo canónico; la parte Storage no pertenece a estos tests.
  const catalog = readFileSync(new URL('db/seed.sql', root), 'utf8').split('/* ---------------------------------------------- Storage')[0];
  assert.ok(!catalog.includes('storage.buckets'));
  await connection.unsafe(`${catalog}\nCOMMIT;`);
  const [role] = await db.select().from(schema.roles).where(sql`${schema.roles.slug} = 'broker'`);
  const dataset = generateDataset({ brokerRoleId: role.id, pipelineStages: await db.select().from(schema.pipelineStages), leadSources: await db.select().from(schema.leadSources), lossReasons: await db.select().from(schema.lossReasons) }, SEED);
  // Fixtures representativas del nuevo contrato; no altera el generador comercial.
  for (const deal of dataset.deals) if (deal.lossReasonId != null) deal.lossComment = 'QA motivo documentado';
  await db.transaction(async tx => {
    for (const key of INSERT_ORDER) for (let offset = 0; offset < dataset[key].length; offset += 200) {
      await tx.insert(schema[key]).values(dataset[key].slice(offset, offset + 200));
    }
    // Identidades sintéticas: el broker de evaluación es el primero del seed.
    for (const slug of ['admin', 'assistant']) {
      const [r] = await tx.select().from(schema.roles).where(sql`${schema.roles.slug} = ${slug}`);
      await tx.insert(schema.users).values({ id: slug === 'admin' ? 900001 : 900002, roleId: r.id, fullName: `QA ${slug}`, email: `${slug}@qa.example.invalid`, isActive: true });
    }
    // Rama no vacía de avances y fotos (el generador comercial no los incluye).
    await tx.insert(schema.constructionPhases).values({ id: 900001, projectId: dataset.projects[0].id, position: 1, title: 'QA fase', progressPercent: 20 });
    await tx.insert(schema.files).values({ id: 900001, entityType: 'construction_phase', entityId: 900001, fileType: 'image', name: 'QA foto', url: 'https://example.invalid/qa.png' });
  });
  for (const key of INSERT_ORDER) {
    const [row] = await db.select({ count: sql`count(*)::int` }).from(schema[key]);
    assert.equal(row.count, dataset[key].length + (key === 'users' ? 2 : 0), `seed ${getTableName(schema[key])}`);
  }
  console.log(`SEED PASS: semilla ${SEED}; 640 leads, 176 negocios, 450 contactos, 400 unidades.`);
}
async function runTests(url, namespace, mode) {
  const files = readdirSync(new URL('src/', root), { recursive: true }).filter(file => file.endsWith('.db.test.ts')).map(file => `src/${file.replaceAll('\\', '/')}`);
  assert.ok(files.length > 0);
  files.push('scripts/test-db/inventario.test.ts', 'scripts/test-db/g12.db.test.ts', 'scripts/seed/limpiar.test.ts');
  const context = { name: namespace, mode, mutation };
  const bootstrap = `data:text/javascript,${encodeURIComponent(`globalThis[Symbol.for('qh.test-db')]=${JSON.stringify(context)};`)}`;
  return new Promise((resolve, reject) => {
    child = spawn(process.execPath, ['--import', bootstrap, '--import', './scripts/test-db/loader.mjs', '--test', '--test-concurrency=1', '--test-reporter=tap', ...files], {
      cwd: root, env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', code => { child = undefined; resolve(code ?? 1); });
  });
}
async function main() {
  const original = localDatabaseUrl();
  const namespace = `quisqueyahome_crm_test_${randomBytes(10).toString('hex')}`;
  assert.match(namespace, namePattern);
  const dev = postgres(original, { ...options, connection: { ...options.connection, default_transaction_read_only: 'on' } });
  const control = postgres(original, options);
  let connection;
  let mode;
  let before;

  let populatedPassed = false;
  try {
    await identity(dev, 'quisqueyahome_crm');
    before = await inventory(dev);
    assertG12Tables(before.manifest);

    console.log(`G12 INVENTORY PASS: ${Object.keys(before.manifest).length} tablas; columnas, tipos, unicidades, FK, conteos y huellas en servidor.`);
    console.log(`DEV BEFORE ${JSON.stringify(Object.fromEntries(Object.entries(before.rows).map(([table, row]) => [table, row.count])))}`);
    if (!forceSchema) {
      try { await control`create database ${control(namespace)} template template0`; mode = 'database'; }
      catch (error) { if (error.code !== '42501') throw error; }
    }
    const url = new URL(original);
    if (!mode) {
      await control`create schema ${control(namespace)}`;
      mode = 'schema';
      console.log('LIMITACIÓN: esquema temporal; misma base física; search_path sin public y FK redirigidas al esquema.');
    } else url.pathname = `/${namespace}`;
    connection = postgres(url.href, { ...options, connection: { ...options.connection, search_path: mode === 'schema' ? `${namespace},pg_catalog` : 'public,pg_catalog' } });
    await identity(connection, mode === 'schema' ? 'quisqueyahome_crm' : namespace, mode === 'schema' ? namespace : 'public');
    console.log(`ISOLATION PASS: ${mode} ${namespace}; loopback:5432.`);
    const db = drizzle(connection, { schema });
    if (mode === 'database') {
      await conMigracionesHasta(3, folder => migrate(db, { migrationsFolder: folder }));
      populatedPassed = await ensayarMigracionPoblada(dev, connection, db);
      // Solo destino aleatorio validado; no se toca el esquema de desarrollo.
      await identity(connection, namespace, 'public');
      assert.match(namespace, namePattern);
      await connection`drop schema public cascade`;
      await connection`drop schema drizzle cascade`;
      await connection`create schema public`;
      await ensayarBackfillSintetico(connection, db);
      await identity(connection, namespace, 'public');
      assert.match(namespace, namePattern);
      await connection`drop schema public cascade`;
      await connection`drop schema drizzle cascade`;
      await connection`create schema public`;
    } else console.log('POPULATED MIGRATION UNKNOWN: requiere permiso CREATE DATABASE para ensayo aislado.');
    if (mode === 'database') await migrate(db, { migrationsFolder: 'drizzle' });
    else {
      // Las migraciones canónicas califican FK con public; search_path solo no basta.
      const migrations = readMigrationFiles({ migrationsFolder: 'drizzle' });
      await connection.begin(async tx => {
        for (const migration of migrations) for (const statement of migration.sql) {
          await tx.unsafe(statement.replaceAll('"public".', `"${namespace}".`));
        }
      });
    }
    const emptyCols = await connection`select column_name, is_nullable from information_schema.columns where table_schema=current_schema() and table_name='unit_sales' and column_name in ('project_id', 'unit_code_normalized') order by column_name`;
    assert.equal(emptyCols.length, 2, 'base vacia: project_id y unit_code_normalized existen');
    assert.ok(emptyCols.every(c => c.is_nullable === 'NO'), 'base vacia: project_id y unit_code_normalized son NOT NULL');
    const [emptySales] = await connection`select count(*)::int as n from unit_sales`;
    assert.equal(emptySales.n, 0, 'base vacia: 0 ventas');
    console.log('MIGRATIONS PASS: drizzle/ aplicado solo al destino temporal.');
    await seed(db, connection);
    // Mutación DDL solo en destino temporal ya validado; se destruye al terminar.
    if (mutation === 'venta-unica') {
      await connection`drop index unit_sales_unit_unq`;
      console.log('MUTATION venta-unica: UNIQUE(unit_id) retirado solo en destino temporal.');
    }
    if (interrupted) throw new Error('Interrupted');
    const code = await runTests(url.href, namespace, mode);
    process.exitCode = interrupted ? 130 : (populatedPassed ? code : 1);
    if (!populatedPassed) console.log('TEST-DB BLOCKED: migración poblada no acreditada; fixtures verificadas por separado.');
  } finally {
    try {
      await connection?.end({ timeout: 5 });
      if (mode === 'database') await control`drop database ${control(namespace)} with (force)`;
      if (mode === 'schema') await control`drop schema ${control(namespace)} cascade`;
      if (mode) console.log(`CLEANUP PASS: ${mode} temporal eliminado.`);
    } finally {
      try {
        if (before) {
          const after = await inventory(dev, 'public', before.manifest);
          console.log(`DEV AFTER ${JSON.stringify(Object.fromEntries(Object.entries(after.rows).map(([table, row]) => [table, row.count])))}`);
          assertOriginalsPreserved(before, after);
          assert.deepEqual(after, before, 'esquema o contenido completo de desarrollo cambió');
          console.log('DEV COUNTS PASS: todas las tablas public idénticas antes/después.');
          console.log('G12 ORIGINAL HASHES PASS: proyección cerrada de columnas originales idéntica antes/después.');

          console.log('DEV HASHES PASS: todas las columnas de todas las tablas public idénticas antes/después (huellas calculadas en servidor).');
        }
      } finally { await Promise.all([dev.end({ timeout: 5 }), control.end({ timeout: 5 })]); }
    }
  }
}
await main().catch(error => { console.error(`TEST-DB FAIL (${safeCode(error)}); detalles del driver omitidos.`); console.error(error?.stack?.split('\n').filter(line => /^\s+at /.test(line)).slice(0, 8).join('\n')); process.exitCode = 1; });
