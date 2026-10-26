import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateSeedForeignKey, type SeedForeignKey } from './limpiar.ts';
const fk: SeedForeignKey = { source: 'units', sourceSchema: 'public', target: 'projects', sourceColumns: ['project_id'], targetColumns: ['id'], uniqueTarget: true };
test('G12 limpieza: FK simples y compuestas de dos/tres pares autorizados', () => {
  validateSeedForeignKey(fk, 'id', 'public');
  validateSeedForeignKey({ ...fk, sourceColumns: ['tenant_id','project_id'], targetColumns: ['tenant_id','id'] }, 'id', 'public');
  validateSeedForeignKey({ ...fk, source: 'deal_properties', target: 'units', sourceColumns: ['tenant_id','project_id','unit_id'], targetColumns: ['tenant_id','project_id','id'] }, 'id', 'public');
  validateSeedForeignKey({ ...fk, source: 'outbox_dead', target: 'outbox', sourceColumns: ['tenant_id','event_id'], targetColumns: ['tenant_id','event_id'] }, 'event_id', 'public');
  validateSeedForeignKey({ ...fk, source: 'broker_profiles', target: 'users', sourceColumns: ['user_id'], targetColumns: ['id'] }, 'id', 'public');
});
test('G12 limpieza: aborta FK desconocida, incompleta, invertida, sin clave única o externa', () => {
  for (const invalid of [
    { ...fk, sourceColumns: ['unknown'] },
    { ...fk, sourceColumns: ['tenant_id','project_id'], targetColumns: ['tenant_id'] },
    { ...fk, sourceColumns: ['project_id','tenant_id'], targetColumns: ['id','tenant_id'] },
    { ...fk, uniqueTarget: false }, { ...fk, sourceSchema: 'outside' },
    { ...fk, sourceColumns: ['project_id','marker'], targetColumns: ['id','marker'] },
    { ...fk, source: 'deal_properties', target: 'units', sourceColumns: ['tenant_id','unit_id','project_id'], targetColumns: ['tenant_id','project_id','id'] },
  ]) assert.throws(() => validateSeedForeignKey(invalid, 'id', 'public'), /FK no soportada/);
});
