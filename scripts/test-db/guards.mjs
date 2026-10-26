import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { assertLocalDestination } from '../seed/local.ts';
import { mutate } from './loader.mjs';

test('destino: reutiliza la guarda local y rechaza cloud, query, puerto y base distintos', () => {
  assertLocalDestination('postgresql://127.0.0.1:5432/quisqueyahome_crm');
  for (const url of ['postgresql://example.invalid:5432/quisqueyahome_crm', 'postgresql://127.0.0.1:5433/quisqueyahome_crm', 'postgresql://127.0.0.1:5432/postgres', 'postgresql://127.0.0.1:5432/quisqueyahome_crm?host=example.invalid', 'postgresql://127.0.0.1:5432/quisqueyahome_crm#option']) {
    assert.throws(() => assertLocalDestination(url));
  }
});
test('mutación alias: cambia solo JOIN/SELECT de contacto, conserva visibleRows', () => {
  const source = readFileSync(new URL('../../src/infrastructure/db/repos/dashboard.ts', import.meta.url), 'utf8');
  const changed = mutate(source, 'alias');
  assert.ok(changed.includes('left join contacts c on c.id = l.contact_id and ${cs'));
  assert.ok(changed.includes('coalesce(c.full_name,'));
  assert.ok(changed.includes('visibleRows(actor, contactScope, contacts.brokerId, contacts.deletedAt)'));
  assert.throws(() => mutate(changed, 'alias'));
});
test('mutación booleano: retira fragmentos SQL, conserva where interpolado', () => {
  const source = readFileSync(new URL('../../src/infrastructure/db/repos/reportes.ts', import.meta.url), 'utf8');
  const changed = mutate(source, 'boolean');
  assert.ok(changed.includes('const attributableSpend = scope === "all" && q.brokerId === undefined && q.projectId === undefined;'));
  assert.ok(changed.includes('where ${attributableSpend}'));
  assert.throws(() => mutate(changed, 'boolean'));
});


test('mutación negocios: EXISTS pasa a JOIN multiplicador; sitio único, sin tocar fuente', () => {
  const source = readFileSync(new URL('../../src/infrastructure/db/repos/pipeline-lectura.ts', import.meta.url), 'utf8');
  const changed = mutate(source, 'negocios-join');
  assert.ok(changed.includes('const PROJECT_FILTER_MODE: string = "join";'));
  assert.ok(changed.includes('visibleRows(actor, scope, deals.brokerId, deals.deletedAt)'));
  assert.throws(() => mutate(changed, 'negocios-join'));
});
