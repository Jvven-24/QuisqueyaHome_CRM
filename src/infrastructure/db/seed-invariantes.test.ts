import assert from 'node:assert/strict';
import { test } from 'node:test';
import { generateDataset, validateDataset, allocate, id, prng } from '../../../scripts/seed/generator.ts';
import { STAGES, SOURCE_SLUGS, LOSS_SLUGS, INSERT_ORDER, BASE_ID, SEED_RANGES, CLEAN_ORDER } from '../../../scripts/seed/catalog.ts';
import { assertCatalogInsertSafe, resolveCatalogs, type CatalogReferences } from '../../../scripts/seed/catalog-guards.ts';
import { assertLocalDestination } from '../../../scripts/seed/local.ts';
import { readFileSync } from 'node:fs';
import { FINANCIAL_PERMISSION_DEFAULTS } from '../../../scripts/seed/catalog.ts';
import { AUDIT_ACTIONS, ENTITY_TYPES, FINANCIAL_PERMISSION_RESOURCES, PERMISSION_ACTIONS, PERMISSION_RESOURCES } from '../../domain/catalogs.ts';
import { scopeFor } from '../../domain/rbac.ts';
import { TIPOS_EVENTO_CRM } from '../../application/compartido/crm.ts';
import { ESQUEMA_EVENTO_FINANCIERO, REGISTRO_EVENTOS_FINANCIEROS, TIPOS_EVENTO_FINANCIERO } from '../../application/compartido/eventos-financieros.ts';
import { registroPorDefecto } from '../integraciones/outbox/consumidores.ts';
import { getTableConfig, PgDialect } from 'drizzle-orm/pg-core';
import { outbox } from './schema.ts';

test('M40: cada transición emisora de §4.1/4.2 tiene contrato, auditoría y versión', () => {
  const spec = readFileSync(new URL('../../../.viltrum/vre-os/spec/modulos/M40-transaccion.md', import.meta.url), 'utf8');
  const operations = spec.split('### 4.1 Contrato por operación')[1]!.split('## 5. Datos')[0]!;
  const expected = new Set(operations.split('\n').filter(line => line.startsWith('|')).flatMap(line =>
    (line.split('|').at(-2) ?? '').match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g) ?? [],
  ));
  assert.equal(expected.size, 39, 'oráculo de la ficha cambió: revisar el contrato');
  assert.deepEqual(new Set(TIPOS_EVENTO_FINANCIERO), expected);
  assert.equal(TIPOS_EVENTO_CRM.length, expected.size + 3);
  for (const values of [PERMISSION_RESOURCES, ENTITY_TYPES, AUDIT_ACTIONS, TIPOS_EVENTO_CRM]) {
    assert.equal(values.length, new Set(values).size, 'catálogo duplicado');
  }
  for (const event of REGISTRO_EVENTOS_FINANCIEROS) {
    assert.ok(ENTITY_TYPES.includes(event.entidad));
    assert.ok(AUDIT_ACTIONS.includes(event.accion));
    assert.equal(event.version, 1);
    assert.equal(event.consumidor, null, 'no hay consumidor financiero aprobado en b1f');
    assert.equal(registroPorDefecto.manejadorDe(event.tipo), undefined);
  }
  assert.deepEqual([...registroPorDefecto.tipos()].sort(), ['ActividadRegistrada', 'LeadCreado', 'NegocioCambioEtapa']);
});

test('M40: payload v1 admite solo referencias y rechaza PII, cuentas y versiones inválidas', () => {
  const payload = {
    publicId: 'e4a1eafd-bef8-49b0-a4c7-82895ced3650', aggregateVersion: 1,
    commandId: '42e2a352-39d1-44b4-a0b1-63413d57373e',
    correlationId: 'fb218daa-1fdb-4c6a-a7a1-af285cccd851',
  };
  for (const tipo of TIPOS_EVENTO_FINANCIERO) {
    assert.ok(ESQUEMA_EVENTO_FINANCIERO.safeParse({ tipo, aggregateId: 1, payload }).success);
  }
  for (const invalid of [
    { tipo: 'EventoDesconocido', aggregateId: 1, payload },
    { tipo: 'PagoConfirmado', aggregateId: 0, payload },
    { tipo: 'PagoConfirmado', aggregateId: 2_147_483_648, payload },
    { tipo: 'PagoConfirmado', aggregateId: 1, payload: { ...payload, aggregateVersion: 0 } },
    { tipo: 'PagoConfirmado', aggregateId: 1, payload: { ...payload, publicId: '1' } },
    { tipo: 'PagoConfirmado', aggregateId: 1, payload: { ...payload, account: 'QA cuenta sintética' } },
    { tipo: 'PagoConfirmado', aggregateId: 1, payload: { ...payload, email: 'qa@example.invalid' } },
    { tipo: 'PagoConfirmado', aggregateId: 1, payload, version: 2 },
  ]) assert.equal(ESQUEMA_EVENTO_FINANCIERO.safeParse(invalid).success, false);
});

test('M40: CHECK SQL admite exactamente el contrato conjunto y conserva los tres tipos históricos', () => {
  const check = getTableConfig(outbox).checks.find(c => c.name === 'outbox_type_check');
  assert.ok(check);
  const query = new PgDialect().sqlToQuery(check.value);
  assert.deepEqual(query.params, []);
  const admitted = [...query.sql.matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(admitted, [...TIPOS_EVENTO_CRM]);
  assert.deepEqual(admitted.slice(0, 3), ['LeadCreado', 'NegocioCambioEtapa', 'ActividadRegistrada']);
});

test('M40: catálogo de permisos completo, sin concesión financiera implícita para ningún rol', () => {
  assert.equal(FINANCIAL_PERMISSION_RESOURCES.length, 12);
  assert.equal(FINANCIAL_PERMISSION_DEFAULTS.length, 12 * PERMISSION_ACTIONS.length);
  for (const roleSlug of ['admin', 'broker', 'assistant', 'financial_jobs']) {
    for (const permission of FINANCIAL_PERMISSION_DEFAULTS) {
      assert.ok(PERMISSION_RESOURCES.includes(permission.resource));
      assert.equal(permission.scope, 'none');
      assert.equal(scopeFor({ userId: 1, roleSlug, permissions: [] }, permission.resource, permission.action), 'none');
      assert.equal(scopeFor({ userId: 1, roleSlug, permissions: [permission] }, permission.resource, permission.action), 'none');
    }
  }
});

// IDs deliberadamente no consecutivos: jam?s asumir BASE_ID para cat?logos existentes.
const references: CatalogReferences = {
  brokerRoleId: 91,
  pipelineStages: STAGES.map((stage, i) => ({ id: 100 + i * 17, slug: stage.slug, name: stage.name, kind: stage.kind, position: i, isActive: true, defaultProbability: i === 5 ? 100 : i === 6 ? 0 : 10 + i * 15 })),
  leadSources: [...new Set(SOURCE_SLUGS)].map((slug, i) => ({ id: 250 + i * 19, slug, name: slug, position: i, isActive: slug !== 'meta_lead_ads' })),
  lossReasons: LOSS_SLUGS.map((slug, i) => ({ id: 450 + i * 23, slug, name: slug, position: i, isActive: true })),
};
const stageId = (step: number) => references.pipelineStages[step]!.id;
const fixture = generateDataset(references);
test('seed determinista: misma semilla produce todas las filas idénticas', () => {
  assert.deepEqual(generateDataset(references), fixture);
  assert.notDeepEqual(generateDataset(references, 20261005), fixture);
});
test('reparto conserva cada fila incluso con residuos y pesos desiguales', () => {
  assert.deepEqual(allocate(7, [1, 1, 1]), [3, 2, 2]);
  assert.equal(allocate(640, [22,17,13,11,9,7,6,5,4,3,2,1]).reduce((a,b) => a+b), 640);
  assert.throws(() => allocate(10, [0])); assert.throws(() => prng(0));
});
test('todos los volúmenes, fechas, precios, países, FK e invariantes cumplen el contrato', () => validateDataset(fixture));
test('un lead con presupuesto invertido se rechaza', () => {
  const d = structuredClone(fixture); d.leads[0]!.budgetMinCents = d.leads[0]!.budgetMaxCents! + 1;
  assert.throws(() => validateDataset(d), /presupuesto/);
});
test('un perdido sin motivo válido no puede falsear el reporte', () => {
  const d = structuredClone(fixture); d.deals.find(deal => deal.stageId === stageId(6))!.lossReasonId = null;
  assert.throws(() => validateDataset(d), /suma motivos/);
});
test('SOLD sin exactamente un ganado se rechaza', () => {
  const d = structuredClone(fixture); const unit = d.units.find(u => u.status === 'available')!;
  unit.status = 'sold'; unit.inventoryStateId = id(3);
  assert.throws(() => validateDataset(d), /SOLD/);
});
test('dos ganados sobre la misma unidad se rechazan', () => {
  const d = structuredClone(fixture); const wins = d.deals.filter(deal => deal.stageId === stageId(5));
  const first = d.dealProperties.find(dp => dp.dealId === wins[0]!.id)!;
  const second = d.dealProperties.find(dp => dp.dealId === wins[1]!.id)!;
  second.unitId = first.unitId; second.projectId = first.projectId;
  assert.throws(() => validateDataset(d), /SOLD/);
});
test('el embudo se calcula por historial, no solo etapa actual', () => {
  const d = structuredClone(fixture); const history = d.dealStageHistory.find(h => h.toStageId === stageId(4))!;
  history.toStageId = stageId(3); assert.throws(() => validateDataset(d));
});
test('una actividad previa al lead se rechaza (regresión octubre parcial)', () => {
  const d = structuredClone(fixture); d.activities[0]!.startsAt = new Date('2025-01-01T00:00:00Z');
  assert.throws(() => validateDataset(d));
});
test('comisión y meta divergentes del cierre se rechazan', () => {
  const commission = structuredClone(fixture); commission.commissions[0]!.agencyAmountCents!++;
  assert.throws(() => validateDataset(commission));
  const goal = structuredClone(fixture); goal.goals[0]!.achievedDeals!++;
  assert.throws(() => validateDataset(goal));
});
test('el seed falla cerrado en destinos remotos, otra base, puerto u opciones', () => {
  assert.doesNotThrow(() => assertLocalDestination('postgresql://127.0.0.1:5432/quisqueyahome_crm'));
  for (const url of ['postgresql://db.example.invalid:5432/quisqueyahome_crm', 'postgresql://127.0.0.1:5432/other', 'postgresql://localhost:6543/quisqueyahome_crm', 'postgresql://localhost:5432/quisqueyahome_crm?host=remote']) assert.throws(() => assertLocalDestination(url), /rechazado|autorizadas/);
});

test('el generador usa IDs y probabilidades canónicos sin insertar catálogos antiguos', () => {
  assert.ok(!INSERT_ORDER.some(key => ['roles', 'pipelineStages', 'leadSources', 'lossReasons'].includes(key)));
  for (const deal of fixture.deals) {
    const stage = references.pipelineStages.find(s => s.id === deal.stageId)!;
    assert.ok(stage); assert.equal(deal.probability, stage.defaultProbability);
  }
  assert.ok(fixture.users.every(user => user.roleId === references.brokerRoleId));
  assert.ok(fixture.leads.every(lead => references.leadSources.some(s => s.id === lead.sourceId)));
  assert.ok(fixture.dealStageHistory.every(h => references.pipelineStages.some(s => s.id === h.toStageId)));
});
test('un catálogo canónico ausente o incompatible aborta sin inventar IDs', () => {
  const missing = structuredClone(references); missing.pipelineStages.splice(2, 1);
  assert.throws(() => generateDataset(missing), /ausente/);
  const invalid = structuredClone(references); invalid.pipelineStages[5]!.kind = 'open';
  assert.throws(() => resolveCatalogs(invalid), /incompatible/);
  const duplicate = structuredClone(references); duplicate.leadSources.push(duplicate.leadSources[0]!);
  assert.throws(() => resolveCatalogs(duplicate), /ambiguo/);
});
test('guarda de INSERT rechaza slug o nombre visible repetido, incluso entre pendientes', () => {
  const existing = [{ slug: 'viejo', name: 'Bávaro' }];
  assert.throws(() => assertCatalogInsertSafe([{ slug: 'viejo', name: 'Otro' }], existing), /duplicado/);
  assert.throws(() => assertCatalogInsertSafe([{ slug: 'nuevo', name: '  BÁVARO  ' }], existing), /duplicado/);
  assert.throws(() => assertCatalogInsertSafe([{ slug: 'a', name: 'Igual' }, { slug: 'b', name: 'Igual' }], []), /duplicado/);
  assert.doesNotThrow(() => assertCatalogInsertSafe([{ slug: 'nuevo', name: 'Otra zona' }], existing));
  assert.doesNotThrow(() => assertCatalogInsertSafe([], existing));
});
test('los rangos de limpieza cubren exactamente la semilla y los catálogos v1', () => {
  assert.equal(new Set(CLEAN_ORDER).size, Object.keys(SEED_RANGES).length);
  for (const key of INSERT_ORDER) {
    assert.equal(fixture[key].length, SEED_RANGES[key]);
    const ids = fixture[key].map(row => 'id' in row ? row.id : 'userId' in row ? row.userId : undefined);
    assert.ok(ids.every(id => id !== undefined && id >= BASE_ID && id < BASE_ID + SEED_RANGES[key]));
  }
  assert.equal(SEED_RANGES.pipelineStages, 7); assert.equal(SEED_RANGES.leadSources, 8); assert.equal(SEED_RANGES.lossReasons, 5);
});
