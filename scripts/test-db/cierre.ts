import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
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
      const testIds = [910001, 910002, 910010, 910011, 910020, 910021, 910030, 910031];
      const projectIds = [910001, 910010, 910020, 910030];
      await tx.execute(sql`set session_replication_role = 'replica'`);
      await tx.delete(t.outbox).where(inArray(t.outbox.aggregateId, testIds));
      await tx.delete(t.auditLog).where(sql`${t.auditLog.entityType} = 'deal' and ${t.auditLog.entityId} in (910001,910002,910010,910011,910020,910021,910030,910031)`);
      await tx.delete(t.inventoryCommitments).where(inArray(t.inventoryCommitments.projectId, projectIds));
      await tx.delete(t.holdUnits).where(inArray(t.holdUnits.projectId, projectIds));
      await tx.delete(t.holds).where(inArray(t.holds.dealId, testIds));
      await tx.delete(t.reservationUnits).where(inArray(t.reservationUnits.projectId, projectIds));
      await tx.delete(t.reservations).where(inArray(t.reservations.dealId, testIds));
      await tx.delete(t.unitSales).where(inArray(t.unitSales.dealId, testIds));
      await tx.delete(t.commissions).where(inArray(t.commissions.dealId, testIds));
      await tx.delete(t.dealStageHistory).where(inArray(t.dealStageHistory.dealId, testIds));
      await tx.delete(t.dealProperties).where(inArray(t.dealProperties.dealId, testIds));
      await tx.delete(t.deals).where(inArray(t.deals.id, testIds));
      await tx.delete(t.units).where(inArray(t.units.projectId, projectIds));
      await tx.delete(t.projects).where(inArray(t.projects.id, projectIds));
      await tx.delete(t.goals);
      if (originalGoals.length) await tx.insert(t.goals).values(originalGoals);
      for (const profile of originalProfiles) await tx.update(t.brokerProfiles).set({ annualSalesCents: profile.annualSalesCents, level: profile.level }).where(eq(t.brokerProfiles.userId, profile.userId));
      await tx.execute(sql`set session_replication_role = 'origin'`);
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
  const commitments = await db.select().from(t.inventoryCommitments).where(eq(t.inventoryCommitments.unitId, ids[0]!));
  assert.equal(commitments.length, 1);
  assert.equal(commitments[0]!.kind, "sale");
  assert.equal(commitments[0]!.status, "active");
  assert.equal(commitments[0]!.unitSaleId, sales[0]!.id);
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
    await tx.execute(sql`set local session_replication_role = 'replica'`);
    await tx.update(t.units).set({ deletedAt: new Date() }).where(eq(t.units.id, 920001));
    await tx.execute(sql`set local session_replication_role = 'origin'`);
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
    await tx.execute(sql`set local session_replication_role = 'replica'`);
    await tx.update(t.units).set({ deletedAt: new Date() }).where(eq(t.units.id, 920010));
    await tx.execute(sql`set local session_replication_role = 'origin'`);
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

check("S-303-N paridad exacta SQL normalizar_codigo_unidad ↔ dominio normalizarCodigoUnidad", async () => {
  const vectors: { input: string; valid: boolean }[] = [
    { input: " a 101 ", valid: true },
    { input: "a_101", valid: true },
    { input: "A–101", valid: true },
    { input: "áéíóú", valid: true },
    { input: "ÁÉÍÓÚ", valid: true },
    { input: "Torre   ñ  01", valid: true },
    { input: "a\u0301", valid: true },
    { input: "e\u0301", valid: true },
    { input: "Ａ１０１", valid: true },
    { input: "ａ_１０１", valid: true },
    { input: "\ta\t101\t", valid: true },
    { input: "  \t  a  \t  101  \t  ", valid: true },
    { input: "\n\ra 101\r\n", valid: true },
    { input: "A-‐-‑-–-—−101", valid: true },
    { input: "Casa_101   Piso_2", valid: true },
    { input: "Torre__A--B", valid: true },
    { input: "", valid: false },
    { input: "   ", valid: false },
    { input: "\t\n", valid: false },
    { input: "\u0301", valid: false },
  ];

  for (const { input, valid } of vectors) {
    if (valid) {
      const jsExpected = normalizarCodigoUnidad(input);
      const [row] = await db.execute(sql`select normalizar_codigo_unidad(${input}) as code`);
      assert.equal(row!.code, jsExpected, `paridad para vector ${JSON.stringify(input)}`);
    } else {
      assert.throws(() => normalizarCodigoUnidad(input), { name: "ValidationError" });
      await assert.rejects(
        db.execute(sql`select normalizar_codigo_unidad(${input}) as code`),
        (err: unknown) => err instanceof Error && "cause" in err && (err.cause as { message?: string })?.message?.includes("blanco")
      );
    }
  }
});

check("M40 b1i3c: hold ajeno vigente conserva paquete y rechaza cierre con 409", async () => {
  await rollback(async tx => {
    const start = 940000;
    await fixture(tx, start);
    const [reloj] = await tx.execute<{ ahora: Date }>(sql`select clock_timestamp() as ahora`);
    const ahora = new Date(reloj!.ahora);
    const createdAt = new Date(ahora.getTime() - 10000);
    const expiresAt = new Date(ahora.getTime() + 60000);
    const authorship = { createdAt, updatedAt: createdAt, createdBy: actor.userId, updatedBy: actor.userId,
      correlationId: randomUUID(), source: "qa-m40-b1i3c" };
    const [hold] = await tx.insert(t.holds).values({ dealId: start + 1,
      holderId: actor.userId, expiresAt, policyVersion: 1, reason: "QA exclusividad ajeno", ...authorship }).returning();
    assert.ok(hold);
    await tx.insert(t.holdUnits).values({ holdId: hold.id, unitId: start, projectId: start,
      unitCodeNormalized: `QA-${start}`, priceVersion: 1, priceCents: 10000n, currency: "USD",
      componentRole: "principal", createdAt, createdBy: actor.userId });
    const [commitment] = await tx.insert(t.inventoryCommitments).values({ unitId: start, projectId: start,
      unitCodeNormalized: `QA-${start}`, kind: "hold", holdId: hold.id, expiresAt, ...authorship }).returning();
    assert.ok(commitment);
    await tx.execute(sql`set constraints all immediate`);
    const metas = await tx.select().from(t.goals);
    const perfiles = await tx.select().from(t.brokerProfiles);
    await assert.rejects(cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor,
      "own", start, { stageId: won!.id }), error => error instanceof ConflictError && errorResponse(error).status === 409);
    const currentHolds = await tx.select().from(t.holds).where(eq(t.holds.id, hold.id));
    assert.equal(currentHolds.length, 1);
    assert.equal(currentHolds[0]!.status, "activo");
    const currentCommitments = await tx.select().from(t.inventoryCommitments).where(eq(t.inventoryCommitments.id, commitment.id));
    assert.equal(currentCommitments.length, 1);
    assert.equal(currentCommitments[0]!.status, "active");
    assert.equal((await tx.select().from(t.units).where(eq(t.units.id, start)))[0]!.status, "available");
    assert.equal((await tx.select().from(t.deals).where(eq(t.deals.id, start)))[0]!.stageId, open!.id);
    for (const table of [t.unitSales, t.commissions, t.dealStageHistory]) assert.equal((await tx.select().from(table).where(eq(table.dealId, start))).length, 0);
    assert.equal((await tx.select().from(t.outbox).where(eq(t.outbox.aggregateId, start))).length, 0);
    assert.equal((await tx.select().from(t.auditLog).where(and(eq(t.auditLog.entityType, "deal"), eq(t.auditLog.entityId, start)))).length, 0);
    assert.deepEqual(await tx.select().from(t.goals), metas);
    assert.deepEqual(await tx.select().from(t.brokerProfiles), perfiles);
  });
});

check("M40 b1i3c: hold vencido se resuelve bajo lock y completa el cierre de venta", async () => {
  await rollback(async tx => {
    const start = 940000;
    await fixture(tx, start);
    const [reloj] = await tx.execute<{ ahora: Date }>(sql`select clock_timestamp() as ahora`);
    const ahora = new Date(reloj!.ahora);
    const createdAt = new Date(ahora.getTime() - 20000);
    const expiresAt = new Date(ahora.getTime() - 5000);
    const authorship = { createdAt, updatedAt: createdAt, createdBy: actor.userId, updatedBy: actor.userId,
      correlationId: randomUUID(), source: "qa-m40-b1i3c" };
    const [hold] = await tx.insert(t.holds).values({ dealId: start + 1,
      holderId: actor.userId, expiresAt, policyVersion: 1, reason: "QA hold vencido", ...authorship }).returning();
    assert.ok(hold);
    await tx.insert(t.holdUnits).values({ holdId: hold.id, unitId: start, projectId: start,
      unitCodeNormalized: `QA-${start}`, priceVersion: 1, priceCents: 10000n, currency: "USD",
      componentRole: "principal", createdAt, createdBy: actor.userId });
    const [commitment] = await tx.insert(t.inventoryCommitments).values({ unitId: start, projectId: start,
      unitCodeNormalized: `QA-${start}`, kind: "hold", holdId: hold.id, expiresAt, ...authorship }).returning();
    assert.ok(commitment);
    await tx.execute(sql`set constraints all immediate`);

    await cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor, "own", start, { stageId: won!.id });

    const [updatedHold] = await tx.select().from(t.holds).where(eq(t.holds.id, hold.id));
    assert.ok(updatedHold);
    assert.equal(updatedHold.status, "expirado");
    assert.ok(updatedHold.resolvedAt);

    const [oldCommitment] = await tx.select().from(t.inventoryCommitments).where(eq(t.inventoryCommitments.id, commitment.id));
    assert.ok(oldCommitment);
    assert.equal(oldCommitment.status, "resolved");
    assert.equal(oldCommitment.resolutionReason, "expirado");
    assert.ok(oldCommitment.resolvedAt);

    const saleCommitments = await tx.select().from(t.inventoryCommitments).where(and(
      eq(t.inventoryCommitments.unitId, start),
      eq(t.inventoryCommitments.kind, "sale"),
      eq(t.inventoryCommitments.status, "active"),
    ));
    assert.equal(saleCommitments.length, 1);

    const [unit] = await tx.select().from(t.units).where(eq(t.units.id, start));
    assert.ok(unit);
    assert.equal(unit.status, "sold");

    const [deal] = await tx.select().from(t.deals).where(eq(t.deals.id, start));
    assert.ok(deal);
    assert.equal(deal.stageId, won!.id);
  });
});

check("M40 b1i3c: hold propio vigente se acepta, se consume y completa el cierre de venta", async () => {
  await rollback(async tx => {
    const start = 940000;
    await fixture(tx, start);
    const [reloj] = await tx.execute<{ ahora: Date }>(sql`select clock_timestamp() as ahora`);
    const ahora = new Date(reloj!.ahora);
    const createdAt = new Date(ahora.getTime() - 10000);
    const expiresAt = new Date(ahora.getTime() + 60000);
    const authorship = { createdAt, updatedAt: createdAt, createdBy: actor.userId, updatedBy: actor.userId,
      correlationId: randomUUID(), source: "qa-m40-b1i3c" };
    const [hold] = await tx.insert(t.holds).values({ dealId: start,
      holderId: actor.userId, expiresAt, policyVersion: 1, reason: "QA hold propio", ...authorship }).returning();
    assert.ok(hold);
    await tx.insert(t.holdUnits).values({ holdId: hold.id, unitId: start, projectId: start,
      unitCodeNormalized: `QA-${start}`, priceVersion: 1, priceCents: 10000n, currency: "USD",
      componentRole: "principal", createdAt, createdBy: actor.userId });
    const [commitment] = await tx.insert(t.inventoryCommitments).values({ unitId: start, projectId: start,
      unitCodeNormalized: `QA-${start}`, kind: "hold", holdId: hold.id, expiresAt, ...authorship }).returning();
    assert.ok(commitment);
    await tx.execute(sql`set constraints all immediate`);

    await cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor, "own", start, { stageId: won!.id });

    const [updatedHold] = await tx.select().from(t.holds).where(eq(t.holds.id, hold.id));
    assert.ok(updatedHold);
    assert.equal(updatedHold.status, "cancelado");
    assert.ok(updatedHold.resolvedAt);

    const [oldCommitment] = await tx.select().from(t.inventoryCommitments).where(eq(t.inventoryCommitments.id, commitment.id));
    assert.ok(oldCommitment);
    assert.equal(oldCommitment.status, "resolved");
    assert.equal(oldCommitment.resolutionReason, "venta");
    assert.ok(oldCommitment.resolvedAt);

    const saleCommitments = await tx.select().from(t.inventoryCommitments).where(and(
      eq(t.inventoryCommitments.unitId, start),
      eq(t.inventoryCommitments.kind, "sale"),
      eq(t.inventoryCommitments.status, "active"),
    ));
    assert.equal(saleCommitments.length, 1);

    const [unit] = await tx.select().from(t.units).where(eq(t.units.id, start));
    assert.ok(unit);
    assert.equal(unit.status, "sold");

    const [deal] = await tx.select().from(t.deals).where(eq(t.deals.id, start));
    assert.ok(deal);
    assert.equal(deal.stageId, won!.id);
  });
});

check("M40 b1i3c: reservas ajena (409), vencida (resuelta) y propia (consumida en venta)", async () => {
  const [file] = await db.select({ id: t.files.id }).from(t.files).limit(1);
  assert.ok(file, "archivo existente para evidence");

  for (const caso of ["ajena", "vencida", "propia"] as const) {
    await rollback(async tx => {
      const start = 940000;
      await fixture(tx, start);
      const [reloj] = await tx.execute<{ ahora: Date }>(sql`select clock_timestamp() as ahora`);
      const ahora = new Date(reloj!.ahora);
      const createdAt = new Date(ahora.getTime() - 20000);
      const expiresAt = new Date(ahora.getTime() + (caso === "vencida" ? -5000 : 60000));
      const authorship = { createdAt, updatedAt: createdAt, createdBy: actor.userId, updatedBy: actor.userId,
        correlationId: randomUUID(), source: "qa-m40-b1i3c-res" };

      const [res] = await tx.insert(t.reservations).values({
        dealId: caso === "ajena" ? start + 1 : start,
        status: "pendiente_pago",
        currency: "USD",
        totalCents: 10000n,
        depositRequiredCents: 1000n,
        conditionsVersion: 1,
        conditionsDocumentId: file.id,
        conditionsHash: "a".repeat(64),
        reason: "QA reserva " + caso,
        expiresAt,
        ...authorship,
      }).returning();
      assert.ok(res);

      await tx.insert(t.reservationParties).values({
        reservationId: res.id,
        contactId: contact!.id,
        role: "titular",
        createdBy: actor.userId,
        createdAt,
      });

      const [resUnit] = await tx.insert(t.reservationUnits).values({
        reservationId: res.id,
        unitId: start,
        projectId: start,
        unitCodeNormalized: `QA-${start}`,
        priceCents: 10000n,
        currency: "USD",
        componentRole: "principal",
        createdAt,
        createdBy: actor.userId,
      }).returning();
      assert.ok(resUnit);

      const [commitment] = await tx.insert(t.inventoryCommitments).values({
        unitId: start,
        projectId: start,
        unitCodeNormalized: `QA-${start}`,
        kind: "reservation",
        reservationUnitId: resUnit.id,
        expiresAt,
        ...authorship,
      }).returning();
      assert.ok(commitment);

      await tx.execute(sql`set constraints all immediate`);

      if (caso === "ajena") {
        await assert.rejects(
          cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor, "own", start, { stageId: won!.id }),
          error => error instanceof ConflictError && errorResponse(error).status === 409
        );
        const [currRes] = await tx.select().from(t.reservations).where(eq(t.reservations.id, res.id));
        assert.ok(currRes);
        assert.equal(currRes.status, "pendiente_pago");
        const [currCommitment] = await tx.select().from(t.inventoryCommitments).where(eq(t.inventoryCommitments.id, commitment.id));
        assert.ok(currCommitment);
        assert.equal(currCommitment.status, "active");
      } else {
        await cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor, "own", start, { stageId: won!.id });

        const [currRes] = await tx.select().from(t.reservations).where(eq(t.reservations.id, res.id));
        assert.ok(currRes);
        assert.equal(currRes.status, "expirada");

        const [currResUnit] = await tx.select().from(t.reservationUnits).where(eq(t.reservationUnits.id, resUnit.id));
        assert.ok(currResUnit);
        assert.ok(currResUnit.releasedAt);
        assert.equal(currResUnit.releaseReason, caso === "vencida" ? "expirada" : "venta");

        const [currCommitment] = await tx.select().from(t.inventoryCommitments).where(eq(t.inventoryCommitments.id, commitment.id));
        assert.ok(currCommitment);
        assert.equal(currCommitment.status, "resolved");
        assert.equal(currCommitment.resolutionReason, caso === "vencida" ? "expirada" : "venta");

        const [unit] = await tx.select().from(t.units).where(eq(t.units.id, start));
        assert.ok(unit);
        assert.equal(unit.status, "sold");
      }
    });
  }
});

check("M40 b1i3c TX-04: reloj clock_timestamp tras lock resuelve compromiso vencido durante la espera", async () => {
  const start = 910030;
  await db.transaction(async tx => {
    await fixture(tx, start);
    const [reloj] = await tx.execute<{ ahora: Date }>(sql`select clock_timestamp() as ahora`);
    const ahora = new Date(reloj!.ahora);
    const createdAt = new Date(ahora.getTime() - 10000);
    const expiresAt = new Date(ahora.getTime() + 150);
    const authorship = { createdAt, updatedAt: createdAt, createdBy: actor.userId, updatedBy: actor.userId,
      correlationId: randomUUID(), source: "qa-m40-tx04" };

    const [hold] = await tx.insert(t.holds).values({
      dealId: start + 1,
      holderId: actor.userId,
      expiresAt,
      policyVersion: 1,
      reason: "QA TX-04 espera",
      ...authorship,
    }).returning();
    assert.ok(hold);

    await tx.insert(t.holdUnits).values({
      holdId: hold.id,
      unitId: start,
      projectId: start,
      unitCodeNormalized: `QA-${start}`,
      priceVersion: 1,
      priceCents: 10000n,
      currency: "USD",
      componentRole: "principal",
      createdAt,
      createdBy: actor.userId,
    });

    await tx.insert(t.inventoryCommitments).values({
      unitId: start,
      projectId: start,
      unitCodeNormalized: `QA-${start}`,
      kind: "hold",
      holdId: hold.id,
      expiresAt,
      ...authorship,
    });
  });

  try {
    let waitingPid = 0;
    let anunciarEspera!: () => void;
    const espera = new Promise<void>(resolve => { anunciarEspera = resolve; });
    let resultado!: Promise<Awaited<ReturnType<typeof cambiarEtapaDeNegocio>>>;
    let falloEspera: unknown;

    await db.transaction(async blocker => {
      const [blockerPid] = await blocker.execute<{ id: number }>(sql`select pg_backend_pid() as id`);
      await blocker.select({ id: t.units.id }).from(t.units).where(eq(t.units.id, start)).for("update");

      resultado = cambiarEtapaDeNegocio({
        unidad: {
          ejecutar: fn => db.transaction(async tx => {
            const [pid] = await tx.execute<{ id: number }>(sql`select pg_backend_pid() as id`);
            waitingPid = Number(pid!.id);
            const repos = reposPipeline(tx);
            const bloquear = repos.pipeline.bloquearUnidad;
            repos.pipeline.bloquearUnidad = async (...args) => {
              anunciarEspera();
              return bloquear(...args);
            };
            return fn(repos);
          }),
        },
      }, actor, "own", start, { stageId: won!.id });

      void resultado.catch(error => { falloEspera = error; anunciarEspera(); });
      await espera;
      assert.equal(falloEspera, undefined);
      assert.notEqual(waitingPid, Number(blockerPid!.id));

      let bloqueada = false;
      for (let intento = 0; intento < 100; intento++) {
        const [estado] = await blocker.execute<{ esperando: boolean }>(
          sql`select ${Number(blockerPid!.id)} = any(pg_blocking_pids(${waitingPid})) as esperando`
        );
        if (estado!.esperando) { bloqueada = true; break; }
        await blocker.execute(sql`select pg_sleep(0.01)`);
      }
      assert.equal(bloqueada, true, "segunda conexión observada esperando la unidad");

      await blocker.execute(sql`select pg_sleep(0.2)`);
    });

    const cerrado = await resultado;
    assert.ok(cerrado);

    const [holdFinal] = await db.select().from(t.holds).where(eq(t.holds.dealId, start + 1));
    assert.ok(holdFinal);
    assert.equal(holdFinal.status, "expirado");

    const [unitFinal] = await db.select().from(t.units).where(eq(t.units.id, start));
    assert.ok(unitFinal);
    assert.equal(unitFinal.status, "sold");
  } finally {
    await db.transaction(async tx => {
      await tx.execute(sql`set session_replication_role = 'replica'`);
      const testIds = [start, start + 1];
      await tx.delete(t.outbox).where(inArray(t.outbox.aggregateId, testIds));
      await tx.delete(t.auditLog).where(sql`${t.auditLog.entityType} = 'deal' and ${t.auditLog.entityId} in (${start}, ${start + 1})`);
      await tx.delete(t.inventoryCommitments).where(inArray(t.inventoryCommitments.projectId, [start]));
      await tx.delete(t.holdUnits).where(inArray(t.holdUnits.projectId, [start]));
      await tx.delete(t.holds).where(inArray(t.holds.dealId, testIds));
      await tx.delete(t.unitSales).where(inArray(t.unitSales.dealId, testIds));
      await tx.delete(t.commissions).where(inArray(t.commissions.dealId, testIds));
      await tx.delete(t.dealStageHistory).where(inArray(t.dealStageHistory.dealId, testIds));
      await tx.delete(t.dealProperties).where(inArray(t.dealProperties.dealId, testIds));
      await tx.delete(t.deals).where(inArray(t.deals.id, testIds));
      await tx.delete(t.units).where(inArray(t.units.projectId, [start]));
      await tx.delete(t.projects).where(inArray(t.projects.id, [start]));
      await tx.execute(sql`set session_replication_role = 'origin'`);
    });
  }
});

check("M40 b1i: venta durable impide cerrar aunque status siga available", async () => {
  await rollback(async tx => {
    await fixture(tx, 940010);
    await tx.insert(t.unitSales).values({ unitId: 940010, dealId: 940011, projectId: 940010,
      unitCodeNormalized: "QA-940010", createdBy: actor.userId });
    await assert.rejects(cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor,
      "own", 940010, { stageId: won!.id }), ConflictError);
    assert.equal((await tx.select().from(t.deals).where(eq(t.deals.id, 940010)))[0]!.stageId, open!.id);
    assert.equal((await tx.select().from(t.unitSales).where(eq(t.unitSales.unitId, 940010))).length, 1);
    assert.equal((await tx.select().from(t.commissions).where(eq(t.commissions.dealId, 940010))).length, 0);
  });
});

check("M40 b1i: reloj SQL de cierre se toma después de una espera de lock real", async () => {
  let waitingPid = 0;
  let anunciarEspera!: () => void;
  const espera = new Promise<void>(resolve => { anunciarEspera = resolve; });
  let resultado!: Promise<Awaited<ReturnType<typeof cambiarEtapaDeNegocio>>>;
  let liberado: Date | undefined;
  let falloEspera: unknown;
  await db.transaction(async blocker => {
    const [blockerPid] = await blocker.execute<{ id: number }>(sql`select pg_backend_pid() as id`);
    await blocker.select({ id: t.units.id }).from(t.units).where(eq(t.units.id, 910010)).for("update");
    resultado = cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => db.transaction(async tx => {
      const [pid] = await tx.execute<{ id: number }>(sql`select pg_backend_pid() as id`);
      waitingPid = Number(pid!.id);
      const repos = reposPipeline(tx);
      const bloquear = repos.pipeline.bloquearUnidad;
      repos.pipeline.bloquearUnidad = async (...args) => { anunciarEspera(); return bloquear(...args); };
      return fn(repos);
    }) } }, actor, "own", 910010, { stageId: won!.id });
    // Adjuntar el rechazo desde el principio evita una promesa huérfana si falla.
    void resultado.catch(error => { falloEspera = error; anunciarEspera(); });
    await espera;
    assert.equal(falloEspera, undefined);
    assert.notEqual(waitingPid, Number(blockerPid!.id));
    let bloqueada = false;
    for (let intento = 0; intento < 100; intento++) {
      const [estado] = await blocker.execute<{ esperando: boolean }>(sql`select ${Number(blockerPid!.id)} = any(pg_blocking_pids(${waitingPid})) as esperando`);
      if (estado!.esperando) { bloqueada = true; break; }
      await blocker.execute(sql`select pg_sleep(0.01)`);
    }
    assert.equal(bloqueada, true, "segunda conexión observada esperando la unidad");
    const [reloj] = await blocker.execute<{ ahora: Date }>(sql`select clock_timestamp() as ahora`);
    liberado = new Date(reloj!.ahora);
  });
  const cerrado = await resultado;
  assert.ok(cerrado.closedAt && liberado && cerrado.closedAt.getTime() >= liberado.getTime());
});

check("M40 b1fix H-01: cerrarVenta registra compromiso activo y no admite hold ni segunda venta", async () => {
  await rollback(async tx => {
    const start = 940020;
    await fixture(tx, start);
    // 1. Cierre de venta mediante el caso de uso y repo transaccional
    await cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor, "own", start, { stageId: won!.id });

    // 2. Verificar que se insertó el compromiso activo en inventory_commitments
    const commitments = await tx.select().from(t.inventoryCommitments).where(eq(t.inventoryCommitments.unitId, start));
    assert.equal(commitments.length, 1, "un compromiso activo registrado");
    const commitment = commitments[0]!;
    assert.equal(commitment.kind, "sale");
    assert.equal(commitment.status, "active");
    assert.equal(commitment.projectId, start);
    assert.equal(commitment.unitCodeNormalized, `QA-${start}`);
    assert.ok(commitment.unitSaleId, "unitSaleId poblado");
    assert.equal(commitment.expiresAt, null);

    // 3. Prueba: una unidad vendida no admite hold posterior (trigger de BD m40_guard_package / restricción única)
    const [reloj] = await tx.execute<{ ahora: Date }>(sql`select clock_timestamp() as ahora`);
    const expiresAt = new Date(new Date(reloj!.ahora).getTime() + 60000);
    const authorship = { createdAt: new Date(), updatedAt: new Date(), createdBy: actor.userId, updatedBy: actor.userId,
      correlationId: randomUUID(), source: "qa-m40-b1fix" };
    const [hold] = await tx.insert(t.holds).values({ dealId: start + 1, holderId: actor.userId,
      expiresAt, policyVersion: 1, reason: "QA intento hold en vendida", ...authorship }).returning();
    await tx.insert(t.holdUnits).values({ holdId: hold!.id, unitId: start, projectId: start,
      unitCodeNormalized: `QA-${start}`, priceVersion: 1, priceCents: 10000n, currency: "USD",
      componentRole: "principal", createdAt: new Date(), createdBy: actor.userId });

    // Intentar insertar hold activo en inventory_commitments debe fallar por restricción única o trigger
    await assert.rejects(tx.transaction(async nested => {
      await nested.insert(t.inventoryCommitments).values({
        unitId: start, projectId: start, unitCodeNormalized: `QA-${start}`,
        kind: "hold", holdId: hold!.id, expiresAt, ...authorship,
      });
    }), (err: unknown) => {
      const code = (err as { cause?: { code?: string } })?.cause?.code ?? (err as { code?: string })?.code;
      return code === "23505" || code === "23514";
    });

    // 4. Prueba: una unidad vendida no admite segunda venta (cerrarVenta sobre el otro negocio que comparte la unidad)
    await assert.rejects(
      cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor, "own", start + 1, { stageId: won!.id }),
      ConflictError
    );

    // 5. Prueba: trigger m40_guard_unit_mutation protege a la unidad vendida contra mutaciones y borrado
    await assert.rejects(tx.transaction(async nested => {
      await nested.update(t.units).set({ code: "MUTADA" }).where(eq(t.units.id, start));
    }), (err: unknown) => (err as { cause?: { code?: string } })?.cause?.code === "23514");

    await assert.rejects(tx.transaction(async nested => {
      await nested.delete(t.units).where(eq(t.units.id, start));
    }), (err: unknown) => (err as { cause?: { code?: string } })?.cause?.code === "23514");
  });
});

check("M40 b1i3e: cierre de alquiler delega en CompromisosPort, marca reserved sin registrar unit_sales", async () => {
  await rollback(async tx => {
    const start = 940030;
    await fixture(tx, start);
    await tx.update(t.deals).set({ operationType: "rent" }).where(eq(t.deals.id, start));

    await cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor, "own", start, { stageId: won!.id });

    const [deal] = await tx.select().from(t.deals).where(eq(t.deals.id, start));
    assert.ok(deal);
    assert.equal(deal.stageId, won!.id);
    assert.ok(deal.closedAt);

    const [unit] = await tx.select().from(t.units).where(eq(t.units.id, start));
    assert.ok(unit);
    assert.equal(unit.status, "reserved", "el alquiler deja la unidad en reserved");

    const sales = await tx.select().from(t.unitSales).where(eq(t.unitSales.unitId, start));
    assert.equal(sales.length, 0, "el alquiler nunca registra en unit_sales");

    const comisiones = await tx.select().from(t.commissions).where(eq(t.commissions.dealId, start));
    assert.equal(comisiones.length, 1, "comisión registrada");

    const events = await tx.select().from(t.outbox).where(eq(t.outbox.aggregateId, start));
    assert.equal(events.length, 1, "evento outbox emitido");
  });
});

check("M40 b1i3e: cierre de alquiler consume hold propio y resuelve compromiso como alquiler", async () => {
  await rollback(async tx => {
    const start = 940040;
    await fixture(tx, start);
    await tx.update(t.deals).set({ operationType: "rent" }).where(eq(t.deals.id, start));

    const [reloj] = await tx.execute<{ ahora: Date }>(sql`select clock_timestamp() as ahora`);
    const createdAt = new Date(reloj!.ahora);
    const expiresAt = new Date(createdAt.getTime() + 60000);
    const authorship = {
      createdAt,
      updatedAt: createdAt,
      createdBy: actor.userId,
      updatedBy: actor.userId,
      correlationId: randomUUID(),
      source: "qa-m40-b1i3e-rent-hold",
    };

    const [hold] = await tx.insert(t.holds).values({
      dealId: start,
      holderId: actor.userId,
      expiresAt,
      policyVersion: 1,
      reason: "QA hold propio alquiler",
      ...authorship,
    }).returning();
    assert.ok(hold);

    await tx.insert(t.holdUnits).values({
      holdId: hold.id,
      unitId: start,
      projectId: start,
      unitCodeNormalized: `QA-${start}`,
      priceVersion: 1,
      priceCents: 10000n,
      currency: "USD",
      componentRole: "principal",
      createdAt,
      createdBy: actor.userId,
    });

    const [commitment] = await tx.insert(t.inventoryCommitments).values({
      unitId: start,
      projectId: start,
      unitCodeNormalized: `QA-${start}`,
      kind: "hold",
      holdId: hold.id,
      expiresAt,
      ...authorship,
    }).returning();
    assert.ok(commitment);

    await cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor, "own", start, { stageId: won!.id });

    const [updatedHold] = await tx.select().from(t.holds).where(eq(t.holds.id, hold.id));
    assert.ok(updatedHold);
    assert.equal(updatedHold.status, "cancelado");
    assert.ok(updatedHold.resolvedAt);

    const [resolvedCommitment] = await tx.select().from(t.inventoryCommitments).where(eq(t.inventoryCommitments.id, commitment.id));
    assert.ok(resolvedCommitment);
    assert.equal(resolvedCommitment.status, "resolved");
    assert.equal(resolvedCommitment.resolutionReason, "alquiler");

    const [unit] = await tx.select().from(t.units).where(eq(t.units.id, start));
    assert.ok(unit);
    assert.equal(unit.status, "reserved");

    const sales = await tx.select().from(t.unitSales).where(eq(t.unitSales.unitId, start));
    assert.equal(sales.length, 0);
  });
});

check("M40 b1i3e: cierre de alquiler rechaza si la unidad ya está vendida o tiene compromiso ajeno", async () => {
  await rollback(async tx => {
    const start = 940050;
    await fixture(tx, start);
    await tx.update(t.deals).set({ operationType: "rent" }).where(eq(t.deals.id, start));

    // 1. Unidad ya vendida en unit_sales bloquea alquiler con ConflictError
    await tx.insert(t.unitSales).values({
      unitId: start,
      dealId: start + 1,
      projectId: start,
      unitCodeNormalized: `QA-${start}`,
      createdBy: actor.userId,
    });

    await assert.rejects(
      cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor, "own", start, { stageId: won!.id }),
      ConflictError,
    );

    // 2. Limpiar venta y probar hold ajeno activo
    await tx.delete(t.unitSales).where(eq(t.unitSales.unitId, start));

    const [reloj] = await tx.execute<{ ahora: Date }>(sql`select clock_timestamp() as ahora`);
    const createdAt = new Date(reloj!.ahora);
    const expiresAt = new Date(createdAt.getTime() + 60000);
    const authorship = {
      createdAt,
      updatedAt: createdAt,
      createdBy: actor.userId,
      updatedBy: actor.userId,
      correlationId: randomUUID(),
      source: "qa-m40-b1i3e-foreign-hold",
    };

    const [foreignHold] = await tx.insert(t.holds).values({
      dealId: start + 1,
      holderId: actor.userId,
      expiresAt,
      policyVersion: 1,
      reason: "QA hold ajeno",
      ...authorship,
    }).returning();
    assert.ok(foreignHold);

    await tx.insert(t.holdUnits).values({
      holdId: foreignHold.id,
      unitId: start,
      projectId: start,
      unitCodeNormalized: `QA-${start}`,
      priceVersion: 1,
      priceCents: 10000n,
      currency: "USD",
      componentRole: "principal",
      createdAt,
      createdBy: actor.userId,
    });

    await tx.insert(t.inventoryCommitments).values({
      unitId: start,
      projectId: start,
      unitCodeNormalized: `QA-${start}`,
      kind: "hold",
      holdId: foreignHold.id,
      expiresAt,
      ...authorship,
    });

    await assert.rejects(
      cambiarEtapaDeNegocio({ unidad: { ejecutar: fn => fn(reposPipeline(tx)) } }, actor, "own", start, { stageId: won!.id }),
      ConflictError,
    );
  });
});



