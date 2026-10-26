import assert from 'node:assert/strict';
import { test } from 'node:test';
import { G12_TABLES, assertG12Tables, validateProjection, assertOriginalsPreserved, type Inventory } from './inventario.ts';
const columns = [{ name: 'id', type: 'integer', nullable: false }, { name: 'value', type: 'text', nullable: true }];
test('G12 inventario: las 42 tablas siguen existiendo; una faltante se rechaza y las nuevas se admiten', () => {
  const manifest = Object.fromEntries(G12_TABLES.map(table => [table, columns]));
  assert.equal(new Set(G12_TABLES).size, 42);
  assertG12Tables(manifest);
  const missing = { ...manifest }; delete missing.users;
  assert.throws(() => assertG12Tables(missing));
  assertG12Tables({ ...manifest, inventory_commitments: columns }); // tablas de fichas posteriores (M40) no rompen
});
test('G12 proyección cerrada: admite tenant; rechaza columna ausente/tipo cambiado/manifiesto vacío', () => {
  const before = { sample: columns };
  validateProjection(before, { sample: [...columns, { name: 'tenant_id', type: 'uuid', nullable: false }] });
  assert.throws(() => validateProjection(before, { sample: columns.slice(0,1) }));
  assert.throws(() => validateProjection(before, { sample: [{ ...columns[0]!, type: 'text' }, columns[1]!] }));
  assert.throws(() => validateProjection({}, before));
  assert.throws(() => validateProjection({ sample: [columns[0]!, columns[0]!] }, before));
});
test('G12 conservación: cambios de conteo o contenido original fallan', () => {
  const before: Inventory = { manifest: { sample: columns }, uniques: [], foreignKeys: [], rows: { sample: { count: '2', originalHash: 'original', fullHash: 'full' } } };
  const after = structuredClone(before); after.rows.sample!.fullHash = 'tenant-added';
  assertOriginalsPreserved(before, after);
  after.rows.sample!.originalHash = 'mutated';
  assert.throws(() => assertOriginalsPreserved(before, after));
  after.rows.sample!.originalHash = 'original'; after.rows.sample!.count = '1';
  assert.throws(() => assertOriginalsPreserved(before, after));
});
