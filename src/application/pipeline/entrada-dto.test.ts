import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { editarNegocioSchema, cambiarEtapaSchema, asociarPropiedadSchema } from "./entrada.ts";
import { dtoMutacionNegocio, dtoMutacionPropiedad } from "./dto.ts";
import type { Negocio } from "./puertos.ts";
import type { Actor } from "../../domain/rbac.ts";

test("b2: Zod rechaza fecha imposible, dinero inseguro, booleano textual y claves restringidas", () => {
  for (const input of [{ expectedCloseDate: "2026-02-30" }, { amountCents: Number.MAX_SAFE_INTEGER + 1 }, { amountCents: -1 }, { probability: 101 }, { amountCents: "100" }, { realPriceCents: 999 }]) {
    assert.equal(editarNegocioSchema.safeParse(input).success, false);
  }
  assert.equal(asociarPropiedadSchema.safeParse({ projectId: 1, isPrimary: "false" }).success, false);
  assert.equal(cambiarEtapaSchema.safeParse({ stageId: 2147483648 }).success, false);
});
test("b2: centinelas de mutacion ausentes del DTO broker/asistente, admin autorizado", () => {
  const broker: Actor = { userId: 5, roleSlug: "broker", permissions: [{ resource: "commissions", action: "view", scope: "all" }] };
  const admin: Actor = { ...broker, roleSlug: "admin" };
  const n: Negocio & { realPriceCents: number; totalCommissionCents: number } = {
    id: 1, contactId: 1, leadId: null, title: null, stageId: 1, sourceId: null, brokerId: 5,
    operationType: "sale", currency: "USD", amountCents: 123, probability: 50, commissionBasisPoints: 9876,
    expectedCloseDate: "2026-12-01", nextActivityId: null, stageChangedAt: null, closedAt: null,
    lossReasonId: null, lossComment: null, notes: null, createdAt: new Date(), updatedAt: new Date(),
    createdBy: 5, updatedBy: 5, deletedAt: null, realPriceCents: 123456789, totalCommissionCents: 999999999,
  };
  const dto = dtoMutacionNegocio(broker, n);
  assert.equal(dto.amountCents, 123);
  for (const role of [broker, { ...broker, roleSlug: "assistant" }]) {
    const json = JSON.stringify(dtoMutacionNegocio(role, n));
    for (const sentinel of ["9876", "123456789", "999999999"]) assert.ok(!json.includes(sentinel));
  }
  assert.equal(dtoMutacionNegocio(admin, n).commissionBasisPoints, 9876);
  const p = { id: 1, dealId: 1, projectId: 2, unitId: 3, isPrimary: true, createdAt: new Date(), createdBy: 5, realPriceCents: 123456789 };
  assert.deepEqual(dtoMutacionPropiedad(broker, p), { id: 1, projectId: 2, unitId: 3, isPrimary: true });
});
test("b2: las rutas de mutacion usan la whitelist de salida", () => {
  for (const [file, projector, field] of [
    ["[id]/route.ts", "dtoMutacionNegocio", "negocio"],
    ["[id]/etapa/route.ts", "dtoMutacionNegocio", "deal"],
    ["[id]/propiedades/route.ts", "dtoMutacionPropiedad", "propiedad"],
    ["[id]/propiedades/[propId]/route.ts", "dtoMutacionPropiedad", "propiedad"],
  ]) {
    const source = readFileSync(new URL(`../../app/api/pipeline/${file}`, import.meta.url), "utf8");
    assert.ok(source.includes(`${field}: ${projector}(actor, ${field})`));
    assert.ok(!source.includes(`Response.json({ ok: true, ${field} })`));
  }
});
