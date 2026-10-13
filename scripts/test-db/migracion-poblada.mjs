import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { lecturaPipeline } from '../../src/infrastructure/db/repos/pipeline-lectura.ts';
import { consultarVentasHistoricasSinUnidad } from '../../src/application/pipeline/consultas.ts';

// Dependencias de cierre y sus FK; excluye sesiones, secretos, auditoría y objetos externos.
const tables = ['roles', 'pipeline_stages', 'lead_sources', 'loss_reasons', 'zones', 'agencies', 'payment_methods', 'unit_inventory_states',
  'users', 'permissions', 'broker_profiles', 'marketing_campaigns', 'campaign_spend', 'projects', 'units', 'contacts', 'leads', 'deals',
  'deal_properties', 'deal_stage_history', 'activities', 'commissions', 'goals'];
const structuralText = new Set(['slug','code','kind','scope','resource','action','currency','operation_type','status','legacy_status','activity_type','priority','level','country_code','buyer_type','property_type','payment_frequency']);
const excluded = new Set(['password_hash','auth_user_id']);
const digest = rows => createHash('sha256').update(JSON.stringify(rows.map(row => JSON.stringify(row)).sort())).digest('hex');

export async function conMigracionesHasta(index, fn) {
  const folder = await mkdtemp(join(tmpdir(), 'qh-b2-migrations-'));
  try {
    await mkdir(join(folder, 'meta'));
    const journal = JSON.parse(await readFile('drizzle/meta/_journal.json', 'utf8'));
    journal.entries = journal.entries.filter(e => e.idx <= index);
    await writeFile(join(folder, 'meta/_journal.json'), JSON.stringify(journal));
    for (const e of journal.entries) await copyFile(`drizzle/${e.tag}.sql`, join(folder, `${e.tag}.sql`));
    return await fn(folder);
  } finally {
    assert.ok(resolve(folder).startsWith(resolve(tmpdir()) + '\\qh-b2-migrations-') || resolve(folder).startsWith(resolve(tmpdir()) + '/qh-b2-migrations-'));
    await rm(folder, { recursive: true, force: true });
  }
}

/** Fuente en READ ONLY, destino aleatorio aislado ya validado por run.mjs.
 * Retiene distribución, PK/FK, códigos, dinero/fechas; anonimiza texto personal en memoria.
 */
export async function ensayarMigracionPoblada(source, target, db) {
  const baseline = {};
  const started = performance.now();
  await source.begin('isolation level repeatable read read only', async src => {
    for (const table of tables) {
      console.log(`POPULATED COPY: ${table}`);
      const columns = await target`select column_name, data_type from information_schema.columns where table_schema=current_schema() and table_name=${table} order by ordinal_position`;
      const names = columns.map(c => c.column_name).filter(c => !excluded.has(c));
      // Lista explícita de columnas: password/auth nunca se leen.
      const rows = await src`select ${src(names)} from ${src('public')}.${src(table)}`;
      console.log(`POPULATED READ: ${table} (${rows.length})`);
      for (const [i, row] of rows.entries()) for (const c of columns) {
        if (row[c.column_name] == null) continue;
        if (c.data_type === 'jsonb' || c.data_type === 'json') row[c.column_name] = '{}';
        else if (c.data_type === 'text' && !structuralText.has(c.column_name)) {
          row[c.column_name] = c.column_name.includes('email') ? `qa-${table}-${i}@example.invalid`
            : c.column_name.includes('phone') ? `+1809${String(i).padStart(7, '0')}` : `QA-${table}-${i}`;
        }
        else if (row[c.column_name] instanceof Date) row[c.column_name] = row[c.column_name].toISOString();
        else if (['number','boolean','bigint'].includes(typeof row[c.column_name])) row[c.column_name] = String(row[c.column_name]);
      }
      for (let offset = 0; offset < rows.length; offset += 100) await target`insert into ${target(table)} ${target(rows.slice(offset, offset + 100), ...names)}`;
      console.log(`POPULATED INSERTED: ${table}`);
      baseline[table] = { names, count: rows.length, hash: digest(await target`select ${target(names)} from ${target(table)}`) };
    }
  });
  assert.equal(baseline.deals.count, 184, 'fuente poblada esperada; variación exige actualizar evidencia');
  console.log(`POPULATED BEFORE ${JSON.stringify(Object.fromEntries(Object.entries(baseline).map(([table,b]) => [table,b.count])))}`);
  const historicas = await target`select d.id from deals d join pipeline_stages s on s.id=d.stage_id
    where s.kind='won' and d.operation_type='sale' and not exists
    (select 1 from deal_properties p where p.deal_id=d.id and p.is_primary and p.unit_id is not null) order by d.id`;
  const idsHistoricos = Array.from({ length: 15 }, (_, i) => 1000000 + i);
  assert.deepEqual(historicas.map(r => r.id), idsHistoricos, 'legado real autorizado S-303-H');
  await migrate(db, { migrationsFolder: 'drizzle' });
  const cols = await target`select column_name, is_nullable from information_schema.columns where table_schema=current_schema() and table_name='unit_sales' and column_name in ('project_id', 'unit_code_normalized') order by column_name`;
  assert.equal(cols.length, 2);
  assert.ok(cols.every(c => c.is_nullable === 'NO'), 'poblada: project_id y unit_code_normalized son NOT NULL');
  const [unq] = await target`select count(*)::int as n from pg_indexes where schemaname=current_schema() and tablename='unit_sales' and indexname='unit_sales_identity_unq'`;
  assert.equal(unq.n, 1, 'poblada: indice unit_sales_identity_unq existe');
  const [legadosEnVentas] = await target`select count(*)::int as n from unit_sales where deal_id = any(${idsHistoricos})`;
  assert.equal(legadosEnVentas.n, 0, '15 legados sin fila en unit_sales');
  for (const [table,b] of Object.entries(baseline)) {
    const rows = await target`select ${target(b.names)} from ${target(table)}`;
    assert.equal(rows.length, b.count, `conteos ${table}`);
    assert.equal(digest(rows), b.hash, `contenido original ${table}`);
  }
  const expectedSales = await target`select d.id as deal_id,p.unit_id from deals d join pipeline_stages s on s.id=d.stage_id
    join deal_properties p on p.deal_id=d.id and p.is_primary and p.unit_id is not null
    where s.kind='won' and d.operation_type='sale' order by d.id`;
  const sales = await target`select deal_id,unit_id from unit_sales order by deal_id`;
  assert.deepEqual([...sales], [...expectedSales], 'backfill exactamente ganados con unidad concreta');
  const [actual] = await target`select count(*)::int as n from unit_sales where project_id is not null and unit_code_normalized is not null`;
  assert.equal(actual.n, expectedSales.length);
  const actor = { userId: 1, roleSlug: 'admin', permissions: [{ resource: 'deals', action: 'view', scope: 'all' }] };
  const repo = lecturaPipeline(db);
  const ids = []; let cursor = null;
  do {
    const page = await consultarVentasHistoricasSinUnidad(repo, actor, cursor, 4);
    ids.push(...page.filas.map(n => n.id)); cursor = page.siguiente;
  } while (cursor);
  assert.deepEqual(ids, idsHistoricos, 'consulta real devuelve exactamente los 15 IDs, paginados');
  await migrate(db, { migrationsFolder: 'drizzle' });
  assert.deepEqual([...(await target`select deal_id,unit_id from unit_sales order by deal_id`)], [...sales], 'migrate repetida no duplica');
  console.log(`POPULATED LEGACY PASS: ${JSON.stringify(ids)}; conservados ganados sin inventar unidades.`);
  console.log(`POPULATED MIGRATION PASS: 184 negocios; ${tables.length} tablas conservan conteos y SHA256 de todas las columnas originales; ${actual.n} ventas con unidad concreta; migrador oficial; ${Math.round(performance.now()-started)}ms.`);
  return true;
}

/** Control positivo independiente, SOLO filas sintéticas explícitas del ensayo.
 * No concilia ni cambia los 184 negocios de la copia real.
 */
export async function ensayarBackfillSintetico(target, db) {
  await conMigracionesHasta(3, folder => migrate(db, { migrationsFolder: folder }));
  await target`insert into roles(id,slug,name) values(800001,'qa-backfill','QA')`;
  await target`insert into users(id,role_id,full_name,email) values(800001,800001,'QA','qa-backfill@example.invalid')`;
  await target`insert into pipeline_stages(id,slug,name,position,kind) values(800001,'qa-ganado','QA',1,'won')`;
  await target`insert into projects(id,name,slug) values(800001,'QA','qa-backfill')`;
  await target`insert into contacts(id,full_name) values(800001,'QA')`;
  for (const [i,code] of ['a 101','A–101','c_303'].entries()) {
    const id = 800001+i;
    await target`insert into units(id,project_id,code,deleted_at) values(${id},800001,${code},${i===0 ? '2026-10-01T00:00:00Z' : null})`;
    await target`insert into deals(id,contact_id,stage_id,created_by,deleted_at) values(${id},800001,800001,800001,${i===0 ? '2026-10-01T00:00:00Z' : null})`;
    await target`insert into deal_properties(deal_id,project_id,unit_id,is_primary,created_by) values(${id},800001,${id},true,800001)`;
  }
  await target`insert into deals(id,contact_id,stage_id,created_by) values(800004,800001,800001,800001)`;
  await target`insert into deal_properties(deal_id,project_id,is_primary,created_by) values(800004,800001,true,800001)`;
  await conMigracionesHasta(4, folder => migrate(db, { migrationsFolder: folder }));
  assert.deepEqual([...(await target`select deal_id from unit_sales order by deal_id`)].map(r => r.deal_id), [800001,800002,800003]);
  console.log('SYNTHETIC S-303-H PASS: 3 ganados concretos backfilled (incluido archivado); 1 legado preservado sin venta.');
  await assert.rejects(migrate(db, { migrationsFolder: 'drizzle' }), e => (e.cause?.code ?? e.code)==='23505');
  const [aborted] = await target`select count(*)::int as n from unit_sales`; assert.equal(aborted.n,3);
  const [columns] = await target`select count(*)::int as n from information_schema.columns where table_schema=current_schema() and table_name='unit_sales' and column_name='project_id'`; assert.equal(columns.n,0);
  // Corregir SOLO el vector sintético conflictivo creado arriba.
  await target`update units set code='b_202' where id=800002`;
  await migrate(db, { migrationsFolder: 'drizzle' });
  const synCols = await target`select column_name, is_nullable from information_schema.columns where table_schema=current_schema() and table_name='unit_sales' and column_name in ('project_id', 'unit_code_normalized') order by column_name`;
  assert.equal(synCols.length, 2);
  assert.ok(synCols.every(c => c.is_nullable === 'NO'), 'sintetico: project_id y unit_code_normalized son NOT NULL');
  const [synUnq] = await target`select count(*)::int as n from pg_indexes where schemaname=current_schema() and tablename='unit_sales' and indexname='unit_sales_identity_unq'`;
  assert.equal(synUnq.n, 1, 'sintetico: indice unit_sales_identity_unq existe');
  const [synLegacy] = await target`select count(*)::int as n from unit_sales where deal_id = 800004`;
  assert.equal(synLegacy.n, 0, 'sintetico: legado 800004 sin fila en unit_sales');
  const rows = await target`select unit_id,project_id,unit_code_normalized from unit_sales order by unit_id`;
  assert.deepEqual(rows.map(r=>r.unit_code_normalized),['A-101','B-202','C-303']);
  assert.ok(rows.every(r=>r.project_id===800001));
  await migrate(db, { migrationsFolder: 'drizzle' });
  const [again] = await target`select count(*)::int as n from unit_sales`; assert.equal(again.n,3);
  console.log('SYNTHETIC BACKFILL PASS: duplicado aborta sin pérdida; migrador oficial exit 0 tras resolver conflicto; 3 ventas preservadas, incluida archivada; legado sin fila; reejecución idempotente.');
}
