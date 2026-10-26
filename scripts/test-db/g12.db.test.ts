import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { after, test } from 'node:test';
import { getTableName } from 'drizzle-orm';
import * as schema from '../../src/infrastructure/db/schema.ts';
import { BASE_ID, CLEAN_ORDER } from '../seed/catalog.ts';
import { cleanSeed } from '../seed/limpiar.ts';
import { connection, checked } from './fixture.ts';
import { inventory, assertOriginalsPreserved, assertG12Tables } from './inventario.ts';

after(() => connection.end({ timeout: 5 }));
const A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
test('G12 SQL: catálogo migrado inventaría las 42 tablas, columnas, unicidades y todos los pares FK', () => checked(async () => {
  const [current] = await connection`select current_schema() as name`;
  const snapshot = await inventory(connection, current!.name);
  assertG12Tables(snapshot.manifest);
  assert.ok(snapshot.uniques.length >= 42);
  assert.ok(snapshot.foreignKeys.length > 0);
  for (const fk of snapshot.foreignKeys) {
    assert.ok(fk.sourceColumns.length > 0);
    assert.equal(fk.sourceColumns.length, fk.targetColumns.length);
    assert.ok(fk.validated);
  }
  for (const [table, columns] of Object.entries(snapshot.manifest)) {
    assert.ok(columns.length > 0);
    assert.match(snapshot.rows[table]!.originalHash, /^[a-f0-9]{32}$/);
    assert.match(snapshot.rows[table]!.fullHash, /^[a-f0-9]{32}$/);
    assert.match(snapshot.rows[table]!.count, /^\d+$/);
  }
}));
async function fixture(expanded: boolean, run: (namespace: string) => Promise<void>) {
  const namespace = `quisqueyahome_crm_test_${randomBytes(10).toString('hex')}`;
  assert.match(namespace, /^quisqueyahome_crm_test_[a-f0-9]{20}$/);
  await connection`create schema ${connection(namespace)}`;
  try {
    for (const key of CLEAN_ORDER) {
      const name = getTableName(schema[key]);
      const pk = key === 'brokerProfiles' ? 'user_id' : 'id';
      const company = expanded && key !== 'users';
      await connection.unsafe(`create table "${namespace}"."${name}" (${company ? 'tenant_id uuid not null,' : ''} "${pk}" integer not null, marker integer not null default 0, project_id integer, unit_id integer, broker_id integer, primary key (${company ? 'tenant_id,' : ''}"${pk}"))`);
    }
    if (expanded) {
      await connection`alter table ${connection(namespace)}.units add unique(tenant_id,project_id,id), add foreign key(tenant_id,project_id) references ${connection(namespace)}.projects(tenant_id,id) on delete cascade`;
      await connection`alter table ${connection(namespace)}.deal_properties add foreign key(tenant_id,project_id,unit_id) references ${connection(namespace)}.units(tenant_id,project_id,id) on delete cascade`;
      for (const tenant of [A,B]) {
        await connection`insert into ${connection(namespace)}.projects(tenant_id,id) values(${tenant},${BASE_ID})`;
        await connection`insert into ${connection(namespace)}.units(tenant_id,id,project_id) values(${tenant},${BASE_ID},${BASE_ID})`;
        await connection`insert into ${connection(namespace)}.deal_properties(tenant_id,id,project_id,unit_id) values(${tenant},${BASE_ID},${BASE_ID},${BASE_ID})`;
      }
    } else {
      await connection`alter table ${connection(namespace)}.units add foreign key(project_id) references ${connection(namespace)}.projects(id) on delete cascade`;
      await connection`alter table ${connection(namespace)}.deal_properties add foreign key(unit_id) references ${connection(namespace)}.units(id) on delete cascade`;
      await connection`insert into ${connection(namespace)}.projects(id) values(${BASE_ID}),(42)`;
      await connection`insert into ${connection(namespace)}.units(id,project_id) values(${BASE_ID},${BASE_ID}),(42,42)`;
      await connection`insert into ${connection(namespace)}.deal_properties(id,unit_id) values(${BASE_ID},${BASE_ID}),(42,42)`;
    }
    await run(namespace);
  } finally { await connection`drop schema ${connection(namespace)} cascade`; }
}
async function unchanged(namespace: string, operation: () => Promise<unknown>, pattern: RegExp) {
  const before = await inventory(connection, namespace);
  await assert.rejects(operation, pattern);
  const after = await inventory(connection, namespace, before.manifest);
  assertOriginalsPreserved(before, after);
  assert.deepEqual(after.rows, before.rows);
}

test('G12 SQL: inventario y huella original sobreviven tenant, detectan alteración y columna ausente', () => checked(() => fixture(false, async ns => {
  const before = await inventory(connection, ns);
  assert.ok(before.uniques.some(u => u.table === 'units' && u.primary));
  assert.deepEqual(before.foreignKeys.find(f => f.table === 'units')?.sourceColumns, ['project_id']);
  await connection`alter table ${connection(ns)}.projects add column tenant_id uuid default ${connection.unsafe(`'${A}'::uuid`)} not null`;
  const expanded = await inventory(connection, ns, before.manifest);
  assertOriginalsPreserved(before, expanded);
  assert.notEqual(expanded.rows.projects!.fullHash, before.rows.projects!.fullHash);
  await connection`update ${connection(ns)}.projects set marker=1 where id=${BASE_ID}`;
  const mutated = await inventory(connection, ns, before.manifest);
  assert.throws(() => assertOriginalsPreserved(before, mutated), /contenido original cambió/);
  await connection`alter table ${connection(ns)}.projects drop column marker`;
  await assert.rejects(() => inventory(connection, ns, before.manifest), /columna original ausente/);
})));

test('G12 SQL: limpieza legacy con FK simples conserva filas ajenas', () => checked(() => fixture(false, async ns => {
  const summary = await cleanSeed(connection, undefined, ns);
  assert.equal(summary.projects, 1); assert.equal(summary.units, 1); assert.equal(summary.deal_properties, 1);
  const [row] = await connection`select count(*)::int as n from ${connection(ns)}.projects where id=42`;
  assert.equal(row!.n, 1);
})));

test('G12 SQL: limpieza multiempresa con FK de dos/tres pares y CASCADE conserva B con IDs iguales', () => checked(() => fixture(true, async ns => {
  const bHash = async () => {
    const result: Record<string, unknown> = {};
    for (const key of CLEAN_ORDER.filter(k => k !== 'users')) {
      const table = getTableName(schema[key]);
      const [row] = await connection`select count(*)::text as n,md5(coalesce(string_agg(h,',' order by h collate "C"),'')) as h from
        (select md5(row_to_json(t)::text) as h from ${connection(ns)}.${connection(table)} t where tenant_id=${B}) hashes`;
      result[table] = row;
    }
    return result;
  };
  const before = await inventory(connection, ns);
  const beforeB = await bHash();
  const summary = await cleanSeed(connection, A, ns);
  assert.equal(summary.projects, 1); assert.equal(summary.units, 1); assert.equal(summary.deal_properties, 1);
  const after = await inventory(connection, ns, before.manifest);
  for (const table of ['projects','units','deal_properties']) assert.equal(after.rows[table]!.count, '1');
  assert.deepEqual(await bHash(), beforeB);
  assert.deepEqual(after.rows.users, before.rows.users);
})));

test('G12 SQL: sin tenant/tenant inválido aborta íntegro', () => checked(() => fixture(true, async ns => {
  await unchanged(ns, () => cleanSeed(connection, undefined, ns), /Empresa explícita/);
  await unchanged(ns, () => cleanSeed(connection, 'invalid', ns), /Empresa inválida/);
})));

test('G12 SQL: expansión parcial no interpreta tablas empresariales como globales', () => checked(() => fixture(false, async ns => {
  await connection`alter table ${connection(ns)}.projects add tenant_id uuid`;
  await unchanged(ns, () => cleanSeed(connection, A, ns), /Expansión empresarial incompleta/);
})));

test('G12 SQL: referencia ajena con CASCADE aborta antes de borrar', () => checked(() => fixture(true, async ns => {
  await connection`insert into ${connection(ns)}.units(tenant_id,id,project_id) values(${A},42,${BASE_ID})`;
  await unchanged(ns, () => cleanSeed(connection, A, ns), /Referencias ajenas/);
})));

test('G12 SQL: el tercer par distingue unidades del mismo proyecto sin falsos ajenos', () => checked(() => fixture(true, async ns => {
  await connection`delete from ${connection(ns)}.deal_properties where tenant_id=${A}`;
  await connection`insert into ${connection(ns)}.projects(tenant_id,id) values(${A},42)`;
  await connection`update ${connection(ns)}.units set project_id=42 where tenant_id=${A}`;
  await connection`insert into ${connection(ns)}.units(tenant_id,id,project_id) values(${A},42,42)`;
  await connection`insert into ${connection(ns)}.deal_properties(tenant_id,id,project_id,unit_id) values(${A},${BASE_ID},42,${BASE_ID}),(${A},42,42,42)`;
  const summary = await cleanSeed(connection, A, ns);
  assert.equal(summary.units, 1);
  const [outside] = await connection`select count(*)::int as n from ${connection(ns)}.deal_properties where tenant_id=${A} and id=42`;
  assert.equal(outside!.n, 1);
})));

test('G12 SQL: tabla no limpiable con FK triple bloquea cascada hacia ventas', () => checked(() => fixture(true, async ns => {
  await connection`create table ${connection(ns)}.unit_sales(tenant_id uuid not null,project_id integer not null,unit_id integer not null,
    foreign key(tenant_id,project_id,unit_id) references ${connection(ns)}.units(tenant_id,project_id,id) on delete cascade)`;
  await connection`insert into ${connection(ns)}.unit_sales values(${A},${BASE_ID},${BASE_ID})`;
  await unchanged(ns, () => cleanSeed(connection, A, ns), /Referencias ajenas/);
})));

test('G12 SQL: identidad global compartida con B impide limpiar users', () => checked(() => fixture(true, async ns => {
  await connection`insert into ${connection(ns)}.users(id) values(${BASE_ID})`;
  await connection`alter table ${connection(ns)}.contacts add foreign key(broker_id) references ${connection(ns)}.users(id) on delete cascade`;
  await connection`insert into ${connection(ns)}.contacts(tenant_id,id,broker_id) values(${B},${BASE_ID},${BASE_ID})`;
  await unchanged(ns, () => cleanSeed(connection, A, ns), /Referencias ajenas/);
})));

test('G12 SQL: forma FK desconocida aborta íntegro', () => checked(() => fixture(false, async ns => {
  await connection`alter table ${connection(ns)}.projects add unique(id,marker)`;
  await connection`alter table ${connection(ns)}.units add foreign key(project_id,marker) references ${connection(ns)}.projects(id,marker)`;
  await unchanged(ns, () => cleanSeed(connection, undefined, ns), /FK no soportada/);
})));

test('G12 SQL: modificación indirecta de fila ajena revierte toda la limpieza', () => checked(() => fixture(false, async ns => {
  await connection`insert into ${connection(ns)}.contacts(id) values(42)`;
  await connection.unsafe(`create function "${ns}".qa_touch() returns trigger language plpgsql as $$ begin update "${ns}".contacts set marker=marker+1 where id=42; return old; end $$`);
  await connection`create trigger qa_touch after delete on ${connection(ns)}.projects for each row execute function ${connection(ns)}.qa_touch()`;
  await unchanged(ns, () => cleanSeed(connection, undefined, ns), /Cambió una fila ajena/);
})));
