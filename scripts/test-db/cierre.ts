import assert from "node:assert/strict";
import { after, test } from "node:test";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, connection, actorFor, checked, rollback } from "./fixture.ts";
import * as t from "../../src/infrastructure/db/schema.ts";
import { reposPipeline } from "../../src/infrastructure/db/repos/pipeline.ts";
import { cambiarEtapaDeNegocio } from "../../src/application/pipeline/casos-de-uso.ts";
import { ConflictError } from "../../src/domain/errors.ts";
import { errorResponse } from "../../src/infrastructure/http.ts";
import { dtoMutacionNegocio } from "../../src/application/pipeline/dto.ts";
import type { ReposPipeline } from "../../src/application/pipeline/puertos.ts";
import { normalizarCodigoUnidad } from "../../src/domain/unidades.ts";

const actor = await actorFor("broker");
const admin = await actorFor("admin");
const originalGoals = await db.select().from(t.goals);
const originalProfiles = await db.select().from(t.brokerProfiles);
after(async () => {
  try {
    await db.transaction(async tx => {
      const testIds = [910001, 910002, 910010, 910011, 910020, 910021];
      await tx.delete(t.outbox).where(inArray(t.outbox.aggregateId, testIds));
      await tx.delete(t.auditLog).where(sql`${t.auditLog.entityType} = 'deal' and ${t.auditLog.entityId} in (910001,910002,910010,910011,910020,910021)`);
      await tx.delete(t.unitSales).where(inArray(t.unitSales.dealId, testIds));
      await tx.delete(t.commissions).where(inArray(t.commissions.dealId, testIds));
      await tx.delete(t.dealStageHistory).where(inArray(t.dealStageHistory.dealId, testIds));
      await tx.delete(t.dealProperties).where(inArray(t.dealProperties.dealId, testIds));
      await tx.delete(t.deals).where(inArray(t.deals.id, testIds));
      await tx.delete(t.units).where(inArray(t.units.projectId, [910001, 910010, 910020]));
      await tx.delete(t.projects).where(inArray(t.projects.id, [910001, 910010, 910020]));
      await tx.delete(t.goals);
      if (originalGoals.length) await tx.insert(t.goals).values(originalGoals);
      for (const profile of originalProfiles) await tx.update(t.brokerProfiles).set({ annualSalesCents: profile.annualSalesCents, level: profile.level }).where(eq(t.brokerProfiles.userId, profile.userId));
    });
  } finally { await connection.end({ timeout: 5 }); }
});
const check = (name: string, fn: () => Promise<unknown>) => test(`DB cierre ${name}`, { concurrency: false }, async () => { await checked(fn); });
const [open] = await db.select().from(t.pipelineStages).where(sql`${t.pipelineStages.kind} = 'open'`).orderBy(t.pipelineStages.position).limit(1);
const [won] = await db.select().from(t.pipelineStages).where(eq(t.pipelineStages.kind, "won")).limit(1);
const [lost] = await db.select().from(t.pipelineStages).where(eq(t.pipelineStages.kind, "lost")).limit(1);
const [contact] = await db.select().from(t.contacts).limit(1);
assert.ok(open && won && lost && contact);
const ids = [910001, 910002];
async function fixture(tx: typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0], start: number) {
  await tx.insert(t.projects).values({ id: start, name: "QA cierre", slug: `qa-cierre-${start}`, brokerId: actor.userId });
  await tx.insert(t.units).values({ id: start, projectId: start, code: `QA-${start}`, brokerId: actor.userId, realPriceCents: 123456789 });
  await tx.insert(t.deals).values([start, start + 1].map(id => ({ id, contactId: contact!.id, brokerId: actor.userId,
    stageId: open!.id, amountCents: 10000, probability: 80, commissionBasisPoints: 9876, expectedCloseDate: "2026-12-01" })));
  await tx.insert(t.dealProperties).values([start, start + 1].map(dealId => ({ dealId, projectId: start, unitId: start, isPrimary: true })));
}
check("carrera real: dos conexiones y negocios, una venta y un 409 sin efectos perdedores", async () => {
  await db.transaction(tx => fixture(tx, ids[0]!));
  const beforeGoals = await db.select().from(t.goals);
  const totals = (rows: typeof beforeGoals) => rows.reduce((sum, r) => sum + r.achievedDeals, 0);
  let arrived = 0; let release!: () => void;
  const barrier = new Promise<void>(resolve => { release = resolve; });
  const pids: number[] = [];
  const deps = { unidad: { ejecutar: <T>(fn: (repos: ReposPipeline) => Promise<T>) => db.transaction(async tx => {
    const [pid] = await tx.execute(sql`select pg_backend_pid()::int as id`); pids.push(Number(pid!.id));
    const repos = reposPipeline(tx); const original = repos.pipeline.bloquearUnidad;
    repos.pipeline.bloquearUnidad = async (...args) => { if (++arrived === 2) release(); await barrier; return original(...args); };
    return fn(repos);
  }) } };
  const results = await Promise.allSettled(ids.map(id => cambiarEtapaDeNegocio(deps, actor, "own", id, { stageId: won!.id })));
  assert.equal(new Set(pids).size, 2, "dos backends PostgreSQL distintos sincronizados");
  assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  const failure = results.find(r => r.status === "rejected"); assert.ok(failure?.status === "rejected");
  assert.ok(failure.reason instanceof ConflictError); const response = errorResponse(failure.reason);
  assert.equal(response.status, 409); assert.ok(!JSON.stringify(await response.json()).includes("unit_sales"));
  const sales = await db.select().from(t.unitSales).where(eq(t.unitSales.unitId, ids[0]!)); assert.equal(sales.length, 1);
  const deals = await db.select().from(t.deals).where(inArray(t.deals.id, ids));
  assert.equal(deals.filter(d => d.stageId === won!.id).length, 1); assert.equal(deals.filter(d => d.stageId === open!.id).length, 1);
  assert.equal((await db.select().from(t.commissions).where(inArray(t.commissions.dealId, ids))).length, 1);
  assert.equal(totals(await db.select().from(t.goals)) - totals(beforeGoals), 2, "un incremento broker y un incremento compania");
  assert.equal((await db.select().from(t.dealStageHistory).where(inArray(t.dealStageHistory.dealId, ids))).length, 1);
  const events = await db.select().from(t.outbox).where(inArray(t.outbox.aggregateId, ids)); assert.equal(events.length, 1);
  assert.deepEqual(events[0]!.payload, { id: sales[0]!.dealId, stageId: won!.id });
  assert.equal((await db.select().from(t.auditLog).where(sql`${t.auditLog.entityType} = 'deal' and ${t.auditLog.entityId} in (${ids[0]},${ids[1]})`)).length, 1);
  const winner = deals.find(d => d.stageId === won!.id)!;
  assert.ok(!JSON.stringify(dtoMutacionNegocio(actor, winner)).includes("9876"));
  await cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => db.transaction(tx => fn(reposPipeline(tx))) } }, actor, "own", winner.id, { stageId: won!.id });
  assert.equal((await db.select().from(t.outbox).where(inArray(t.outbox.aggregateId, ids))).length, 1, "repetir cierre sin duplicacion");
});
check("UNIQUE unitId durable rechaza INSERT directo aunque el negocio se archive (CA-29)", async () => {
  const [sale] = await db.select().from(t.unitSales).where(eq(t.unitSales.unitId, ids[0]!)); assert.ok(sale);
  const other = ids.find(id => id !== sale.dealId)!;
  await rollback(async tx => {
    await tx.update(t.deals).set({ deletedAt: new Date() }).where(eq(t.deals.id, sale.dealId));
    // Identidad distinta para aislar UNIQUE(unit_id) de la otra restricción redundante.
    await assert.rejects(tx.insert(t.unitSales).values({ unitId: sale.unitId, dealId: other, projectId: sale.projectId, unitCodeNormalized: "QA-MUTATION", createdBy: actor.userId }),
      (error: unknown) => error instanceof Error && "cause" in error && (error.cause as { code?: string })?.code === "23505");
  });
});
check("outbox falla: rollback de unidad, venta, comision, metas, historial y auditoria", async () => {
  await db.transaction(tx => fixture(tx, 910010));
  const before = await db.select().from(t.goals);
  const deps = { unidad: { ejecutar: <T>(fn: (repos: ReposPipeline) => Promise<T>) => db.transaction(async tx => {
    const repos = reposPipeline(tx);
    repos.outbox = { emitir: async () => { await tx.execute(sql`select 1 / 0`); } };
    return fn(repos);
  }) } };
  await assert.rejects(cambiarEtapaDeNegocio(deps, actor, "own", 910010, { stageId: won!.id }));
  const [unit] = await db.select().from(t.units).where(eq(t.units.id, 910010)); assert.equal(unit!.status, "available");
  const [deal] = await db.select().from(t.deals).where(eq(t.deals.id, 910010)); assert.equal(deal!.stageId, open!.id);
  for (const table of [t.unitSales, t.commissions, t.dealStageHistory]) assert.equal((await db.select().from(table).where(eq(table.dealId, 910010))).length, 0);
  assert.deepEqual(await db.select().from(t.goals), before);
  assert.equal((await db.select().from(t.outbox).where(eq(t.outbox.aggregateId, 910010))).length, 0);
  assert.equal((await db.select().from(t.auditLog).where(sql`${t.auditLog.entityType} = 'deal' and ${t.auditLog.entityId} = 910010`)).length, 0);
});
check("RLS habilitada y FK restrictiva en ventas; unidad/proyecto ajeno rechazados", async () => {
  const [row] = await db.execute(sql`select relrowsecurity from pg_class where oid = 'unit_sales'::regclass`); assert.equal(row!.relrowsecurity, true);
  const fks = await db.execute(sql`select confdeltype from pg_constraint where conrelid = 'unit_sales'::regclass and contype = 'f'`);
  assert.equal(fks.length, 4); assert.ok(fks.every(f => f.confdeltype === "r"));
  await assert.rejects(cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => db.transaction(tx => fn(reposPipeline(tx))) } }, { ...actor, userId: admin.userId }, "own", ids[1]!, { stageId: won!.id }), { name: "NotFoundError" });
});

check("S-303-N identidad durable rechaza segunda fila/código equivalente tras archivar", async () => {
  await rollback(async tx => {
    await fixture(tx, 920001);
    await tx.update(t.units).set({ code: "a 101" }).where(eq(t.units.id, 920001));
    const deps = { unidad: { ejecutar: <T>(fn: (repos: ReposPipeline) => Promise<T>) => fn(reposPipeline(tx)) } };
    await cambiarEtapaDeNegocio(deps, actor, "own", 920001, { stageId: won!.id });
    await tx.update(t.units).set({ deletedAt: new Date() }).where(eq(t.units.id, 920001));
    const [replacement] = await tx.insert(t.units).values({ projectId: 920001, code: "A-101" }).returning({ id: t.units.id });
    // Transacción hija = savepoint; la operación rechazada no invalida las comprobaciones.
    await assert.rejects(tx.transaction(async nested => {
      await cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(nested)) } }, actor, "own", 920002, { stageId: won!.id, unitId: replacement!.id });
    }), ConflictError);
    assert.equal((await tx.select().from(t.unitSales).where(eq(t.unitSales.projectId, 920001))).length, 1);
    assert.equal((await tx.select().from(t.commissions).where(eq(t.commissions.dealId, 920002))).length, 0);
    await assert.rejects(tx.transaction(async nested => {
      await nested.insert(t.unitSales).values({ unitId: replacement!.id, dealId: 920002, projectId: 920001,
        unitCodeNormalized: normalizarCodigoUnidad("A–101"), createdBy: actor.userId });
    }), (e: unknown) => e instanceof Error && "cause" in e && (e.cause as {code?: string}).code === "23505");
  });
});

check("S-303-N crea/reutiliza unidad mínima sin precio y outbox revierte alta", async () => {
  await rollback(async tx => {
    await fixture(tx, 920010);
    await tx.update(t.dealProperties).set({ unitId: null }).where(inArray(t.dealProperties.dealId, [920010, 920011]));
    await tx.update(t.units).set({ code: "á 101" }).where(eq(t.units.id, 920010));
    await cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor, "own", 920010, { stageId: won!.id, unitCode: "A–101" });
    assert.equal((await tx.select().from(t.units).where(eq(t.units.projectId, 920010))).length, 1, "coincidencia activa reutilizada");
    await tx.update(t.units).set({ deletedAt: new Date() }).where(eq(t.units.id, 920010));
    await assert.rejects(tx.transaction(async nested => {
      await cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(nested)) } }, actor, "own", 920011, { stageId: won!.id, unitCode: "a_101" });
    }), /archivada/);
    await assert.rejects(tx.transaction(async nested => {
      const repos = reposPipeline(nested); repos.outbox = { emitir: async () => { await nested.execute(sql`select 1 / 0`); } };
      await cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(repos) } }, actor, "own", 920011, { stageId: won!.id, unitCode: "B—202" });
    }));
    assert.equal((await tx.select().from(t.units).where(eq(t.units.projectId, 920010))).length, 1, "alta fallida revertida");
    const [interest] = await tx.select().from(t.dealProperties).where(eq(t.dealProperties.dealId, 920011)); assert.equal(interest!.unitId, null);
    await cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor, "own", 920011, { stageId: won!.id, unitCode: "B_202" });
    const [minimal] = await tx.select().from(t.units).where(and(eq(t.units.projectId, 920010), eq(t.units.code, "B-202")));
    assert.ok(minimal); assert.equal(minimal.realPriceCents, null);
  });
});

check("S-303-N carrera de alta mínima con códigos equivalentes: una unidad, una venta", async () => {
  await db.transaction(async tx => {
    await fixture(tx, 910020);
    await tx.update(t.dealProperties).set({ unitId: null }).where(inArray(t.dealProperties.dealId, [910020, 910021]));
  });
  let arrived = 0; let release!: () => void;
  const barrier = new Promise<void>(resolve => { release = resolve; });
  const pids: number[] = [];
  const deps = { unidad: { ejecutar: <T>(fn: (repos: ReposPipeline) => Promise<T>) => db.transaction(async tx => {
    const [pid] = await tx.execute(sql`select pg_backend_pid()::int as id`); pids.push(Number(pid!.id));
    const repos = reposPipeline(tx); const original = repos.pipeline.resolverUnidadDeCierre;
    repos.pipeline.resolverUnidadDeCierre = async params => { if (++arrived === 2) release(); await barrier; return original(params); };
    return fn(repos);
  }) } };
  const results = await Promise.allSettled([" á 101 ", "A–101"].map((unitCode,i) => cambiarEtapaDeNegocio(deps, actor, "own", 910020+i, { stageId: won!.id, unitCode })));
  assert.equal(new Set(pids).size, 2); assert.equal(results.filter(r => r.status === "fulfilled").length, 1);
  const rejected = results.find(r => r.status === "rejected"); assert.ok(rejected?.status === "rejected" && rejected.reason instanceof ConflictError);
  assert.equal(errorResponse(rejected.reason).status, 409);
  const units = await db.select().from(t.units).where(and(eq(t.units.projectId, 910020), eq(t.units.code, "A-101")));
  assert.equal(units.length, 1); assert.equal(units[0]!.realPriceCents, null);
  const dealIds = [910020,910021];
  for (const table of [t.unitSales,t.commissions,t.dealStageHistory]) assert.equal((await db.select().from(table).where(inArray(table.dealId, dealIds))).length, 1);
  assert.equal((await db.select().from(t.outbox).where(inArray(t.outbox.aggregateId, dealIds))).length, 1);
  const interests = await db.select().from(t.dealProperties).where(inArray(t.dealProperties.dealId, dealIds));
  assert.equal(interests.filter(p => p.unitId != null).length, 1, "asignación del perdedor revierte");
});
