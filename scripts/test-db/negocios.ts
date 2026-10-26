import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { db, connection, actorFor, checked, rollback } from './fixture.ts';
import { negociosResumenShape } from './shapes.ts';
import * as tables from '../../src/infrastructure/db/schema.ts';
import { VOLUMES } from '../seed/catalog.ts';
import { lecturaPipeline } from '../../src/infrastructure/db/repos/pipeline-lectura.ts';
import { consultarCatalogosNegocios, consultarFichaNegocio, consultarListaNegocios, consultarVentasHistoricasSinUnidad, resumirNegocios } from '../../src/application/pipeline/consultas.ts';
import type { Actor } from '../../src/domain/rbac.ts';
import type { FiltrosNegocios, OrdenNegocios } from '../../src/application/pipeline/puertos.ts';

const [admin, broker, assistant] = await Promise.all(['admin', 'broker', 'assistant'].map(actorFor));
after(async () => { await connection.end({ timeout: 5 }); });
const check = (name: string, fn: () => Promise<unknown>) => test(`DB negocios ${name}`, { concurrency: false }, async () => { await checked(fn); });
check('S-303-H legado: anti-venta, alcance, paginación y DTO por rol', async () => rollback(async tx => {
  const [base] = await tx.select().from(tables.deals).limit(1);
  const [won] = await tx.select().from(tables.pipelineStages).where(eq(tables.pipelineStages.kind, 'won')).limit(1);
  const [unit] = await tx.select().from(tables.units).limit(1);
  assert.ok(base && won && unit);
  const ids = [910101,910102,910103,910104,910105];
  await tx.insert(tables.deals).values(ids.map((id, i) => ({ ...base, id, stageId: won.id,
    brokerId: i === 3 ? admin!.userId : broker!.userId, operationType: i === 2 ? 'rent' as const : 'sale' as const,
    deletedAt: i === 4 ? new Date() : null, lossReasonId: null, lossComment: null })));
  await tx.insert(tables.unitSales).values({ dealId: ids[1]!, unitId: unit.id, projectId: unit.projectId,
    unitCodeNormalized: 'QA-LEGACY-REGISTERED', createdBy: admin!.userId });
  const repo = lecturaPipeline(tx);
  async function leer(actor: Actor) {
    const encontrados: number[] = []; let cursor = null;
    do {
      const page = await consultarVentasHistoricasSinUnidad(repo, actor, cursor, 3);
      encontrados.push(...page.filas.map(n => n.id)); cursor = page.siguiente;
    } while (cursor);
    return encontrados.filter(id => ids.includes(id));
  }
  assert.deepEqual(await leer(admin!), [910101,910104]);
  assert.deepEqual(await leer(broker!), [910101]);
  assert.deepEqual(await leer({ ...broker!, permissions: [] }), []);
  const page = await consultarVentasHistoricasSinUnidad(repo, assistant!);
  assert.ok(page.filas.every(n => !('amountCents' in n) && !('commissionBasisPoints' in n) && !('totalCommissionCents' in n)));
}));
type Ejecutor = Parameters<typeof lecturaPipeline>[0];
/** Control independiente: IN semijoin y columnas SQL, sin reutilizar predicados del adaptador. */
async function control(ejecutor: Ejecutor, actor: Actor, f: FiltrosNegocios) {
  const scope = actor.permissions.find(p => p.resource === 'deals' && p.action === 'view')?.scope ?? 'none';
  const fecha = f.campoFecha === 'expectedCloseDate' ? sql`d.expected_close_date`
    : f.campoFecha === 'closedAt' ? sql`(d.closed_at at time zone 'America/Santo_Domingo')::date`
    : sql`(d.created_at at time zone 'America/Santo_Domingo')::date`;
  const where = and(sql`d.deleted_at is null`, scope === 'all' ? sql`true` : scope === 'none' ? sql`false` : sql`d.broker_id = ${actor.userId}`,
    f.projectId === undefined ? undefined : sql`d.id in (select deal_id from deal_properties where project_id = ${f.projectId})`,
    f.brokerId === undefined ? undefined : sql`d.broker_id = ${f.brokerId}`,
    f.stageId === undefined ? undefined : sql`d.stage_id = ${f.stageId}`,
    f.resultado === undefined ? undefined : sql`s.kind = ${f.resultado}`,
    f.moneda === undefined ? undefined : sql`d.currency = ${f.moneda}`,
    f.montoMin === undefined ? undefined : sql`d.amount_cents >= ${f.montoMin}`,
    f.montoMax === undefined ? undefined : sql`d.amount_cents <= ${f.montoMax}`,
    f.desde === undefined ? undefined : sql`${fecha} >= ${f.desde}::date`,
    f.hasta === undefined ? undefined : sql`${fecha} <= ${f.hasta}::date`);
  const result = await ejecutor.execute(sql`select d.stage_id as "stageId", s.kind, d.currency,
    count(*)::int as count, coalesce(sum(d.amount_cents),0)::text as "amountCents"
    from deals d join pipeline_stages s on s.id=d.stage_id join contacts c on c.id=d.contact_id
    where ${where} group by d.stage_id,s.kind,d.currency order by d.stage_id,d.currency`);
  return result.map(r => ({ stageId: Number(r.stageId), kind: r.kind, currency: r.currency, count: Number(r.count), amountCents: Number(r.amountCents) }));
}
async function comparar(ejecutor: Ejecutor, actor: Actor, f: FiltrosNegocios) {
  const repo = lecturaPipeline(ejecutor);
  const expected = await control(ejecutor, actor, f);
  const resumen = await resumirNegocios(repo, actor, f);
  assert.ok(negociosResumenShape.safeParse(resumen).success, 'contrato resumen');
  assert.deepEqual(resumen, expected, 'resumen por etapa/divisa coincide con control independiente');
  const ids: number[] = []; let cursor = null;
  const acumulado = new Map<string, { stageId: number; kind: string; currency: string; count: number; amountCents: number }>();
  do {
    const page = await consultarListaNegocios(repo, actor, f, { campo: 'id', direccion: 'asc' }, cursor, 37);
    assert.deepEqual(page.resumen, expected, 'totales completos no dependen de página');
    ids.push(...page.filas.map(n => n.id)); cursor = page.siguiente;
    for (const n of page.filas) {
      const clave = `${n.stageId}:${n.currency}`;
      const total = acumulado.get(clave) ?? { stageId: n.stageId, kind: n.stageKind, currency: n.currency, count: 0, amountCents: 0 };
      total.count++; total.amountCents += n.amountCents ?? 0;
      acumulado.set(clave, total);
    }
    assert.ok(ids.length <= expected.reduce((s, n) => s + n.count, 0), 'paginación sin inflación');
  } while (cursor);
  assert.equal(ids.length, expected.reduce((s, n) => s + n.count, 0), 'lista y control: mismo número');
  assert.equal(new Set(ids).size, ids.length, 'IDs sin duplicación N:M');
}
for (const actor of [admin!, broker!]) {
  check(`control seed / ${actor.roleSlug}`, async () => {
    const [row] = await db.select().from(tables.deals).where(eq(tables.deals.brokerId, broker!.userId)).limit(1);
    assert.ok(row);
    const [prop] = await db.select().from(tables.dealProperties).where(eq(tables.dealProperties.dealId, row.id)).limit(1);
    assert.ok(prop);
    for (const filters of [{}, { projectId: prop.projectId }, { brokerId: broker!.userId }, { stageId: row.stageId },
      { resultado: 'open' as const }, { moneda: row.currency, montoMin: 0, montoMax: row.amountCents ?? 0 },
      { desde: '2026-01-01', hasta: '2026-10-13' }, { campoFecha: 'closedAt' as const, desde: '2026-01-01' },
      { campoFecha: 'expectedCloseDate' as const, hasta: '2026-12-31' }, { projectId: 2147483647 }]) await comparar(db, actor, filters);
    if (actor === admin) assert.equal((await resumirNegocios(lecturaPipeline(db), actor)).reduce((s, n) => s + n.count, 0), VOLUMES.deals);
  });
}
check('184 negocios (176 seed + 8 sintéticos rollback): N:M, USD/DOP y bordes inclusivos', async () => rollback(async tx => {
  const [base] = await tx.select().from(tables.deals).limit(1);
  const [project] = await tx.select().from(tables.projects).limit(1);
  assert.ok(base && project);
  const unidades = await tx.select().from(tables.units).where(eq(tables.units.projectId, project.id)).limit(2);
  assert.equal(unidades.length, 2);
  const ids = Array.from({ length: 8 }, (_, i) => 900101 + i);
  await tx.insert(tables.deals).values(ids.map((id, i) => ({ ...base, id, brokerId: broker!.userId,
    amountCents: 100 + i, currency: i % 2 ? 'DOP' : 'USD', closedAt: null,
    createdAt: new Date(i < 4 ? '2026-10-13T04:00:00Z' : '2026-10-14T03:59:59.999Z'),
    expectedCloseDate: '2026-10-13', commissionBasisPoints: 9876, deletedAt: null })));
  await tx.insert(tables.dealProperties).values(ids.flatMap(dealId => unidades.map((unit, i) => ({ dealId, projectId: project.id, unitId: unit.id, isPrimary: i === 0 }))));
  const [total] = await tx.execute(sql`select count(*)::int as count from deals`);
  assert.equal(total!.count, 184, 'dataset requerido de 184 negocios');
  await comparar(tx, admin!, {});
  await comparar(tx, admin!, { projectId: project.id });
  await comparar(tx, broker!, { projectId: project.id, desde: '2026-10-13', hasta: '2026-10-13' });
  const rows = await consultarListaNegocios(lecturaPipeline(tx), broker!, { projectId: project.id, desde: '2026-10-13', hasta: '2026-10-13' });
  assert.ok(ids.every(id => rows.filas.some(n => n.id === id)), 'ambos bordes incluidos');
}));
check('SELECT y DTO por rol: centinelas, own/none, ID ajeno, catálogos y orden', async () => {
  const queries: string[] = [];
  const observada = drizzle(connection, { schema: tables, logger: { logQuery(query) { queries.push(query); } } });
  const repo = lecturaPipeline(observada);
  const [own] = await db.select().from(tables.deals).where(eq(tables.deals.brokerId, broker!.userId)).limit(1);
  const [foreign] = await db.select().from(tables.deals).where(sql`${tables.deals.brokerId} <> ${broker!.userId}`).limit(1);
  assert.ok(own && foreign);
  const dto = await consultarFichaNegocio(repo, broker!, own.id);
  await consultarVentasHistoricasSinUnidad(repo, broker!);
  assert.ok(!('commissionBasisPoints' in dto.negocio)); assert.ok(!('totalCommissionCents' in dto.negocio));
  assert.ok(dto.propiedades.every(p => !('realPriceCents' in p)));
  assert.ok(queries.every(q => !/real_price_cents|commission_basis_points|total_commission_cents|\bcommissions\b/i.test(q)), 'restricciones fuera del SELECT broker');
  assert.equal(dto.negocio.amountCents, own.amountCents);
  await assert.rejects(consultarFichaNegocio(repo, broker!, foreign.id), { name: 'NotFoundError' });
  const none: Actor = { ...broker!, permissions: [] }; queries.length = 0;
  assert.equal((await consultarListaNegocios(repo, none)).filas.length, 0);
  assert.equal((await consultarVentasHistoricasSinUnidad(repo, none)).filas.length, 0);
  await assert.rejects(consultarFichaNegocio(repo, none, own.id), { name: 'NotFoundError' });
  assert.equal(queries.length, 0, 'none no toca datos');
  queries.length = 0;
  const assistantDto = await consultarListaNegocios(repo, assistant!);
  await consultarVentasHistoricasSinUnidad(repo, assistant!);
  assert.ok(assistantDto.filas.every(n => !('amountCents' in n)));
  assert.ok(assistantDto.resumen.every(n => !('amountCents' in n)));
  assert.ok(queries.every(q => !/amount_cents|real_price_cents|commission_basis_points/i.test(q)), 'asistente sin SELECT financiero');
  const catalogs = await consultarCatalogosNegocios(repo, admin!);
  assert.ok(catalogs.etapas.length > 0); assert.ok(catalogs.etapas.every(n => typeof n.position === 'number'));
  for (const campo of ['createdAt', 'amountCents', 'id'] as const) for (const direccion of ['asc', 'desc'] as const) {
    const orden: OrdenNegocios = { campo, direccion };
    const first = await consultarListaNegocios(repo, broker!, {}, orden, null, 1);
    assert.ok(first.siguiente);
    const second = await consultarListaNegocios(repo, broker!, {}, orden, first.siguiente, 1);
    assert.notEqual(first.filas[0]!.id, second.filas[0]!.id);
  }
});
check('centinelas persistidos: admin recibe precio/comisión y broker no los lee', async () => rollback(async tx => {
  const [own] = await tx.select().from(tables.deals).where(eq(tables.deals.brokerId, broker!.userId)).limit(1);
  assert.ok(own);
  const [prop] = await tx.select().from(tables.dealProperties).where(eq(tables.dealProperties.dealId, own.id)).limit(1);
  assert.ok(prop?.unitId);
  await tx.update(tables.deals).set({ commissionBasisPoints: 9876, amountCents: 222222 }).where(eq(tables.deals.id, own.id));
  await tx.update(tables.units).set({ realPriceCents: 123456789 }).where(eq(tables.units.id, prop.unitId));
  const adminDto = await consultarFichaNegocio(lecturaPipeline(tx), admin!, own.id);
  assert.equal(adminDto.negocio.commissionBasisPoints, 9876);
  assert.ok(adminDto.propiedades.some(p => p.realPriceCents === 123456789));
  const brokerDto = await consultarFichaNegocio(lecturaPipeline(tx), broker!, own.id);
  assert.equal(brokerDto.negocio.amountCents, 222222);
  assert.ok(!JSON.stringify(brokerDto).includes('123456789')); assert.ok(!JSON.stringify(brokerDto).includes('9876'));
}));
