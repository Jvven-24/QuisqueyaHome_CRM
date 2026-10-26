import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { ConflictError, NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { cancelarHold, crearHold, extenderHold } from "./casos-de-uso.ts";
import { CompromisosEnMemoria } from "./en-memoria.ts";
import { CupoExcedidoError } from "./puertos.ts";

const actorAdmin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };

function crearHarness() {
  const repo = new CompromisosEnMemoria();
  repo.deals.push({ id: 10, brokerId: 1, deletedAt: null });
  repo.deals.push({ id: 20, brokerId: 2, deletedAt: null });
  repo.units.push({ id: 101, projectId: 1, code: "A-101", status: "available" });
  repo.units.push({ id: 102, projectId: 1, code: "A-102", status: "available" });
  repo.units.push({ id: 103, projectId: 1, code: "A-103", status: "available" });
  repo.units.push({ id: 104, projectId: 1, code: "A-104", status: "available" });
  repo.units.push({ id: 105, projectId: 1, code: "A-105", status: "available" });

  const uow = unidadDeTrabajoEnMemoria({ compromisos: repo }, [repo]);
  return { repo, deps: { unidad: uow } };
}

test("crearHold: adquiere hold activo con unidades y metadatos", async () => {
  const { deps, repo } = crearHarness();
  const idempotencyKey = randomUUID();
  const correlationId = randomUUID();

  const hold = await crearHold(deps, actorAdmin, "all", {
    dealId: 10,
    units: [
      { unitId: 101, priceVersion: 1, priceCents: 5000000n, currency: "USD", componentRole: "principal" },
      { unitId: 102, priceVersion: 1, priceCents: 500000n, currency: "USD", componentRole: "parqueo" },
    ],
    reason: "Cliente interesado en plano",
    durationHours: 48,
    idempotencyKey,
    correlationId,
    source: "test",
  });

  assert.equal(hold.dealId, 10);
  assert.equal(hold.status, "activo");
  assert.equal(hold.extensionCount, 0);
  assert.equal(hold.rowVersion, 1);
  assert.equal(hold.units.length, 2);
  assert.equal(hold.units[0]?.priceCents, 5000000n);
  assert.equal(hold.units[1]?.priceCents, 500000n);
  assert.equal(repo.commitments.filter(c => c.status === "active").length, 2);
});

test("crearHold: repetición idempotente con misma clave y contenido devuelve el mismo hold", async () => {
  const { deps } = crearHarness();
  const idempotencyKey = randomUUID();

  const entrada = {
    dealId: 10,
    units: [{ unitId: 101, priceVersion: 1, priceCents: 5000000n, currency: "USD" as const, componentRole: "principal" }],
    reason: "Reserva previa",
    idempotencyKey,
    correlationId: randomUUID(),
    source: "test",
  };

  const hold1 = await crearHold(deps, actorAdmin, "all", entrada);
  const hold2 = await crearHold(deps, actorAdmin, "all", entrada);

  assert.equal(hold1.id, hold2.id);
  assert.equal(hold1.publicId, hold2.publicId);
});

test("crearHold: misma clave idempotente con contenido distinto lanza ConflictError", async () => {
  const { deps } = crearHarness();
  const idempotencyKey = randomUUID();

  await crearHold(deps, actorAdmin, "all", {
    dealId: 10,
    units: [{ unitId: 101, priceVersion: 1, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    reason: "Intento 1",
    idempotencyKey,
    correlationId: randomUUID(),
    source: "test",
  });

  await assert.rejects(
    () =>
      crearHold(deps, actorAdmin, "all", {
        dealId: 10,
        units: [{ unitId: 102, priceVersion: 1, priceCents: 3000000n, currency: "USD", componentRole: "principal" }],
        reason: "Intento 2 diferente",
        idempotencyKey,
        correlationId: randomUUID(),
        source: "test",
      }),
    ConflictError,
  );
});

test("crearHold: rechaza hold si una unidad ya tiene compromiso activo", async () => {
  const { deps } = crearHarness();

  await crearHold(deps, actorAdmin, "all", {
    dealId: 10,
    units: [{ unitId: 101, priceVersion: 1, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    reason: "Primer hold",
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  await assert.rejects(
    () =>
      crearHold(deps, actorAdmin, "all", {
        dealId: 20,
        units: [{ unitId: 101, priceVersion: 1, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
        reason: "Segundo hold competidor",
        idempotencyKey: randomUUID(),
        correlationId: randomUUID(),
        source: "test",
      }),
    ConflictError,
  );
});

test("crearHold: rechaza hold si el titular agota su cupo de 3 holds activos", async () => {
  const { deps } = crearHarness();

  // Crear 3 holds para el broker 1
  for (const [idx, unitId] of [101, 102, 103].entries()) {
    await crearHold(deps, actorAdmin, "all", {
      dealId: 10,
      holderId: 1,
      units: [{ unitId, priceVersion: 1, priceCents: 1000000n, currency: "USD", componentRole: "principal" }],
      reason: `Hold ${idx + 1}`,
      idempotencyKey: randomUUID(),
      correlationId: randomUUID(),
      source: "test",
    });
  }

  // El 4to hold debe lanzar CupoExcedidoError
  await assert.rejects(
    () =>
      crearHold(deps, actorAdmin, "all", {
        dealId: 10,
        holderId: 1,
        units: [{ unitId: 104, priceVersion: 1, priceCents: 1000000n, currency: "USD", componentRole: "principal" }],
        reason: "Hold 4 excedido",
        idempotencyKey: randomUUID(),
        correlationId: randomUUID(),
        source: "test",
      }),
    CupoExcedidoError,
  );
});

test("extenderHold: incrementa extensionCount, rowVersion y actualiza expiresAt", async () => {
  const { deps } = crearHarness();

  const hold = await crearHold(deps, actorAdmin, "all", {
    dealId: 10,
    units: [{ unitId: 101, priceVersion: 1, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    reason: "Hold para extender",
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  const expiracionOriginal = hold.expiresAt.getTime();

  const extendido = await extenderHold(deps, actorAdmin, "all", hold.id, {
    expectedVersion: 1,
    reason: "Prorroga acordada con cliente",
    additionalHours: 24,
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  assert.equal(extendido.extensionCount, 1);
  assert.equal(extendido.rowVersion, 2);
  assert.ok(extendido.expiresAt.getTime() > expiracionOriginal);
});

test("extenderHold: detecta conflicto de versión optimista", async () => {
  const { deps } = crearHarness();

  const hold = await crearHold(deps, actorAdmin, "all", {
    dealId: 10,
    units: [{ unitId: 101, priceVersion: 1, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    reason: "Hold",
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  await assert.rejects(
    () =>
      extenderHold(deps, actorAdmin, "all", hold.id, {
        expectedVersion: 99,
        reason: "Version vieja",
        idempotencyKey: randomUUID(),
        correlationId: randomUUID(),
        source: "test",
      }),
    ConflictError,
  );
});

test("cancelarHold: marca cancelado y resuelve compromisos", async () => {
  const { deps, repo } = crearHarness();

  const hold = await crearHold(deps, actorAdmin, "all", {
    dealId: 10,
    units: [{ unitId: 101, priceVersion: 1, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    reason: "Hold para cancelar",
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  const cancelado = await cancelarHold(deps, actorAdmin, "all", hold.id, {
    expectedVersion: 1,
    reason: "Cliente declinó comprar",
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  assert.equal(cancelado.status, "cancelado");
  assert.equal(cancelado.rowVersion, 2);
  assert.ok(cancelado.resolvedAt);

  const compromisos = repo.commitments.filter(c => c.holdId === hold.id);
  assert.equal(compromisos.length, 1);
  assert.equal(compromisos[0]?.status, "resolved");
  assert.equal(compromisos[0]?.resolutionReason, "cancelado");

  // Re-cancelar debe fallar con ConflictError
  await assert.rejects(
    () =>
      cancelarHold(deps, actorAdmin, "all", hold.id, {
        expectedVersion: 2,
        reason: "Intento cancelar otra vez",
        idempotencyKey: randomUUID(),
        correlationId: randomUUID(),
        source: "test",
      }),
    ConflictError,
  );
});

test("rollback: fallo en la operación revierte cualquier cambio en memoria", async () => {
  const { deps, repo } = crearHarness();

  // Intento de hold con negocio inexistente
  await assert.rejects(
    () =>
      crearHold(deps, actorAdmin, "all", {
        dealId: 99999, // Negocio inexistente
        units: [{ unitId: 101, priceVersion: 1, priceCents: 1000000n, currency: "USD", componentRole: "principal" }],
        reason: "Fallo esperado",
        idempotencyKey: randomUUID(),
        correlationId: randomUUID(),
        source: "test",
      }),
    NotFoundError,
  );

  assert.equal(repo.holds.length, 0);
  assert.equal(repo.commitments.length, 0);
  assert.equal(deps.unidad.revertidas, 1);
  assert.equal(deps.unidad.confirmadas, 0);
});
