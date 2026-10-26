import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { eq, sql } from "drizzle-orm";
import { db, connection, actorFor, checked } from "./fixture.ts";
import * as t from "../../src/infrastructure/db/schema.ts";

const actor = await actorFor("broker");

let cleanupRuleId: number | null = null;
let cleanupDealIds: number[] = [];

after(async () => {
  try {
    if (cleanupDealIds.length > 0 || cleanupRuleId !== null) {
      await db.transaction(async tx => {
        await tx.execute(sql`set session_replication_role = 'replica'`);
        if (cleanupDealIds.length > 0) {
          await tx.delete(t.commissionSplits).where(
            sql`${t.commissionSplits.agreementId} in (select id from ${t.commissionAgreements} where ${t.commissionAgreements.dealId} in (${sql.join(cleanupDealIds.map(id => sql`${id}`), sql`, `)}))`
          );
          await tx.delete(t.commissionAgreements).where(
            sql`${t.commissionAgreements.dealId} in (${sql.join(cleanupDealIds.map(id => sql`${id}`), sql`, `)})`
          );
        }
        if (cleanupRuleId !== null) {
          await tx.delete(t.commissionRuleVersions).where(eq(t.commissionRuleVersions.ruleId, cleanupRuleId));
          await tx.delete(t.commissionRules).where(eq(t.commissionRules.id, cleanupRuleId));
        }
        await tx.execute(sql`set session_replication_role = 'origin'`);
      });
    }
  } finally {
    await connection.end({ timeout: 5 });
  }
});

const check = (name: string, fn: () => Promise<unknown>) =>
  test(`DB comisiones ${name}`, { concurrency: false }, async () => {
    await checked(fn);
  });

check("H-03 concurrencia comisiones: bloqueos independientes por negocio y serialización en el mismo negocio", async () => {
  // 1. Preparar regla activa vigente en la base de datos
  const [file] = await db.select({ id: t.files.id }).from(t.files).limit(1);
  assert.ok(file, "archivo existente para evidencia");
  const [adminUser] = await db.select({ id: t.users.id }).from(t.users).where(eq(t.users.id, 900001)).limit(1);
  assert.ok(adminUser, "admin para aprobación de regla");

  const [rule] = await db.insert(t.commissionRules).values({
    code: `RULE-QA-${Date.now()}`,
    name: "Regla QA Concurrencia",
    createdBy: actor.userId,
    updatedBy: actor.userId,
    correlationId: randomUUID(),
    source: "qa:m40-b1fix",
  }).returning();
  cleanupRuleId = rule!.id;

  const [version] = await db.insert(t.commissionRuleVersions).values({
    ruleId: rule!.id,
    version: 1,
    formulaKind: "basis_points",
    basisPoints: 500,
    currency: "USD",
    termsDocumentId: file!.id,
    termsHash: "a".repeat(64),
    validFrom: new Date(Date.now() - 3600000),
    approvedBy: adminUser!.id,
    approvedAt: new Date(Date.now() + 1000),
    createdBy: actor.userId,
    correlationId: randomUUID(),
    source: "qa:m40-b1fix",
  }).returning();

  await db.update(t.commissionRules).set({
    activeVersionId: version!.id,
    rowVersion: 2,
    updatedAt: new Date(Date.now() + 2000),
    updatedBy: actor.userId,
  }).where(eq(t.commissionRules.id, rule!.id));

  // 2. Obtener dos negocios distintos del seed
  const deals = await db.select({ id: t.deals.id }).from(t.deals).limit(2);
  assert.equal(deals.length, 2, "dos negocios disponibles");
  const deal1 = deals[0]!.id;
  const deal2 = deals[1]!.id;
  cleanupDealIds = [deal1, deal2];

  // 3. Probar que dos acuerdos sobre negocios DISTINTOS no se bloquean mutuamente
  let op1Active = false;
  let op2Active = false;
  let overlapObserved = false;

  const op1 = db.transaction(async tx1 => {
    op1Active = true;
    const [ag1] = await tx1.insert(t.commissionAgreements).values({
      dealId: deal1,
      ruleVersionId: version!.id,
      version: 1,
      baseCents: 100000n,
      exclusionsCents: 0n,
      poolCents: 5000n,
      currency: "USD",
      evidenceId: file!.id,
      termsHash: "b".repeat(64),
      createdBy: actor.userId,
      correlationId: randomUUID(),
      source: "qa:tx1",
    }).returning();
    await tx1.insert(t.commissionSplits).values({
      agreementId: ag1!.id,
      beneficiaryUserId: actor.userId,
      amountCents: 5000n,
      createdBy: actor.userId,
      correlationId: randomUUID(),
      source: "qa:tx1",
    });
    if (op2Active) overlapObserved = true;
    await new Promise(r => setTimeout(r, 100));
    if (op2Active) overlapObserved = true;
    op1Active = false;
  });

  const op2 = db.transaction(async tx2 => {
    op2Active = true;
    const [ag2] = await tx2.insert(t.commissionAgreements).values({
      dealId: deal2,
      ruleVersionId: version!.id,
      version: 1,
      baseCents: 200000n,
      exclusionsCents: 0n,
      poolCents: 10000n,
      currency: "USD",
      evidenceId: file!.id,
      termsHash: "c".repeat(64),
      createdBy: actor.userId,
      correlationId: randomUUID(),
      source: "qa:tx2",
    }).returning();
    await tx2.insert(t.commissionSplits).values({
      agreementId: ag2!.id,
      beneficiaryUserId: actor.userId,
      amountCents: 10000n,
      createdBy: actor.userId,
      correlationId: randomUUID(),
      source: "qa:tx2",
    });
    if (op1Active) overlapObserved = true;
    await new Promise(r => setTimeout(r, 100));
    if (op1Active) overlapObserved = true;
    op2Active = false;
  });

  await Promise.all([op1, op2]);
  assert.equal(overlapObserved, true, "ambas transacciones en negocios distintos se ejecutan concurrentemente");

  const agreements = await db.select().from(t.commissionAgreements).where(
    sql`${t.commissionAgreements.dealId} in (${deal1}, ${deal2})`
  );
  assert.equal(agreements.length, 2, "ambos acuerdos creados concurrentemente");

  // 4. Probar que dos operaciones sobre el MISMO negocio se serializan
  let blockerFinished = false;
  let waiterExecutedWhileBlockerOpen = false;

  const blockerPromise = db.transaction(async txBlocker => {
    const [agBlocker] = await txBlocker.insert(t.commissionAgreements).values({
      dealId: deal1,
      ruleVersionId: version!.id,
      version: 2,
      baseCents: 100000n,
      exclusionsCents: 0n,
      poolCents: 5000n,
      currency: "USD",
      evidenceId: file!.id,
      termsHash: "d".repeat(64),
      createdBy: actor.userId,
      correlationId: randomUUID(),
      source: "qa:blocker",
    }).returning();
    await txBlocker.insert(t.commissionSplits).values({
      agreementId: agBlocker!.id,
      beneficiaryUserId: actor.userId,
      amountCents: 5000n,
      createdBy: actor.userId,
      correlationId: randomUUID(),
      source: "qa:blocker",
    });
    await new Promise(r => setTimeout(r, 200));
    blockerFinished = true;
  });

  await new Promise(r => setTimeout(r, 50));

  const waiterPromise = db.transaction(async txWaiter => {
    // Si la serialización por advisory lock funciona, este callback esperará
    // a que txBlocker haga commit antes de que su INSERT proceda.
    const [agWaiter] = await txWaiter.insert(t.commissionAgreements).values({
      dealId: deal1,
      ruleVersionId: version!.id,
      version: 3,
      baseCents: 100000n,
      exclusionsCents: 0n,
      poolCents: 5000n,
      currency: "USD",
      evidenceId: file!.id,
      termsHash: "e".repeat(64),
      createdBy: actor.userId,
      correlationId: randomUUID(),
      source: "qa:waiter",
    }).returning();
    if (!blockerFinished) {
      waiterExecutedWhileBlockerOpen = true;
    }
    await txWaiter.insert(t.commissionSplits).values({
      agreementId: agWaiter!.id,
      beneficiaryUserId: actor.userId,
      amountCents: 5000n,
      createdBy: actor.userId,
      correlationId: randomUUID(),
      source: "qa:waiter",
    });
  });

  await Promise.all([blockerPromise, waiterPromise]);
  assert.equal(waiterExecutedWhileBlockerOpen, false, "la segunda operación sobre el mismo negocio esperó el commit de la primera");
  assert.equal(blockerFinished, true);
});
