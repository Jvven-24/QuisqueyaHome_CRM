import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { ConflictError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import {
  cambiarUnidadReserva,
  cancelarReserva,
  confirmarReserva,
  crearReserva,
} from "./casos-de-uso.ts";
import { ReservasEnMemoria } from "./en-memoria.ts";

const actorAdmin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };

function crearHarness() {
  const repo = new ReservasEnMemoria();
  repo.deals.push({ id: 10, brokerId: 1, deletedAt: null });
  repo.deals.push({ id: 20, brokerId: 2, deletedAt: null });
  repo.unitsCatalog.push({ id: 101, projectId: 1, code: "A-101", status: "available" });
  repo.unitsCatalog.push({ id: 102, projectId: 1, code: "A-102", status: "available" });
  repo.unitsCatalog.push({ id: 103, projectId: 1, code: "A-103", status: "available" });
  repo.unitsCatalog.push({ id: 104, projectId: 1, code: "A-104", status: "available" });
  repo.files.push({ id: 501 });
  repo.files.push({ id: 502 });

  const uow = unidadDeTrabajoEnMemoria({ reservas: repo }, [repo]);
  return { repo, deps: { unidad: uow } };
}

test("crearReserva: adquiere reserva con unidades, titulares y compromisos activos", async () => {
  const { deps, repo } = crearHarness();
  const idempotencyKey = randomUUID();
  const correlationId = randomUUID();

  const reserva = await crearReserva(deps, actorAdmin, "all", {
    dealId: 10,
    currency: "USD",
    totalCents: 10000000n,
    depositRequiredCents: 1000000n,
    adjustmentCents: 0n,
    conditionsVersion: 1,
    conditionsDocumentId: 501,
    conditionsHash: "a".repeat(64),
    reason: "Reserva de preventa",
    parties: [{ contactId: 301, role: "titular" }],
    units: [
      { unitId: 101, priceCents: 9000000n, currency: "USD", componentRole: "principal" },
      { unitId: 102, priceCents: 1000000n, currency: "USD", componentRole: "parqueo" },
    ],
    idempotencyKey,
    correlationId,
    source: "test",
  });

  assert.equal(reserva.dealId, 10);
  assert.equal(reserva.status, "pendiente_pago");
  assert.equal(reserva.rowVersion, 1);
  assert.equal(reserva.units.length, 2);
  assert.equal(reserva.parties.length, 1);
  assert.equal(reserva.totalCents, 10000000n);
  assert.equal(repo.commitments.filter(c => c.status === "active").length, 2);
});

test("crearReserva: repetición idempotente con misma clave y contenido devuelve la misma reserva", async () => {
  const { deps } = crearHarness();
  const idempotencyKey = randomUUID();

  const entrada = {
    dealId: 10,
    currency: "USD" as const,
    totalCents: 5000000n,
    depositRequiredCents: 500000n,
    conditionsVersion: 1,
    conditionsDocumentId: 501,
    conditionsHash: "b".repeat(64),
    reason: "Reserva directa",
    parties: [{ contactId: 301, role: "titular" as const }],
    units: [{ unitId: 101, priceCents: 5000000n, currency: "USD" as const, componentRole: "principal" }],
    idempotencyKey,
    correlationId: randomUUID(),
    source: "test",
  };

  const r1 = await crearReserva(deps, actorAdmin, "all", entrada);
  const r2 = await crearReserva(deps, actorAdmin, "all", entrada);

  assert.equal(r1.id, r2.id);
  assert.equal(r1.publicId, r2.publicId);
});

test("crearReserva: misma clave idempotente con contenido distinto lanza ConflictError", async () => {
  const { deps } = crearHarness();
  const idempotencyKey = randomUUID();

  await crearReserva(deps, actorAdmin, "all", {
    dealId: 10,
    currency: "USD",
    totalCents: 5000000n,
    depositRequiredCents: 500000n,
    conditionsVersion: 1,
    conditionsDocumentId: 501,
    conditionsHash: "c".repeat(64),
    reason: "Intento 1",
    parties: [{ contactId: 301, role: "titular" }],
    units: [{ unitId: 101, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    idempotencyKey,
    correlationId: randomUUID(),
    source: "test",
  });

  await assert.rejects(
    () =>
      crearReserva(deps, actorAdmin, "all", {
        dealId: 10,
        currency: "USD",
        totalCents: 3000000n,
        depositRequiredCents: 300000n,
        conditionsVersion: 1,
        conditionsDocumentId: 501,
        conditionsHash: "c".repeat(64),
        reason: "Intento 2 distinto",
        parties: [{ contactId: 301, role: "titular" }],
        units: [{ unitId: 102, priceCents: 3000000n, currency: "USD", componentRole: "principal" }],
        idempotencyKey,
        correlationId: randomUUID(),
        source: "test",
      }),
    ConflictError,
  );
});

test("crearReserva: desde hold activo convierte el hold y adquiere los compromisos", async () => {
  const { deps, repo } = crearHarness();
  repo.holds.push({
    id: 88,
    dealId: 10,
    holderId: 1,
    status: "activo",
    expiresAt: new Date(Date.now() + 86400000),
    units: [{ unitId: 101, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
  });
  repo.commitments.push({
    id: 99,
    unitId: 101,
    projectId: 1,
    unitCodeNormalized: "A-101",
    kind: "hold",
    status: "active",
    holdId: 88,
    rowVersion: 1,
  });

  const reserva = await crearReserva(deps, actorAdmin, "all", {
    dealId: 10,
    holdId: 88,
    currency: "USD",
    totalCents: 5000000n,
    depositRequiredCents: 500000n,
    conditionsVersion: 1,
    conditionsDocumentId: 501,
    conditionsHash: "d".repeat(64),
    reason: "Conversión de hold a reserva",
    parties: [{ contactId: 301, role: "titular" }],
    units: [{ unitId: 101, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  assert.equal(reserva.holdId, 88);
  assert.equal(repo.holds.find(h => h.id === 88)?.status, "convertido");
  assert.equal(repo.commitments.find(c => c.id === 99)?.status, "resolved");
  assert.equal(repo.commitments.find(c => c.kind === "reservation")?.status, "active");
});

test("crearReserva: conflicto si una unidad ya tiene compromiso activo ajeno", async () => {
  const { deps, repo } = crearHarness();
  repo.commitments.push({
    id: 11,
    unitId: 101,
    projectId: 1,
    unitCodeNormalized: "A-101",
    kind: "hold",
    status: "active",
    holdId: 999,
    expiresAt: new Date(Date.now() + 86400000),
    rowVersion: 1,
  });

  await assert.rejects(
    () =>
      crearReserva(deps, actorAdmin, "all", {
        dealId: 10,
        currency: "USD",
        totalCents: 5000000n,
        depositRequiredCents: 500000n,
        conditionsVersion: 1,
        conditionsDocumentId: 501,
        conditionsHash: "e".repeat(64),
        reason: "Intento sobre unidad ocupada",
        parties: [{ contactId: 301, role: "titular" }],
        units: [{ unitId: 101, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
        idempotencyKey: randomUUID(),
        correlationId: randomUUID(),
        source: "test",
      }),
    ConflictError,
  );
});

test("confirmarReserva: confirma reserva con evidencia y fecha de confirmación", async () => {
  const { deps } = crearHarness();
  const reserva = await crearReserva(deps, actorAdmin, "all", {
    dealId: 10,
    currency: "USD",
    totalCents: 5000000n,
    depositRequiredCents: 500000n,
    conditionsVersion: 1,
    conditionsDocumentId: 501,
    conditionsHash: "f".repeat(64),
    reason: "Reserva para confirmación",
    parties: [{ contactId: 301, role: "titular" }],
    units: [{ unitId: 101, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  const confirmada = await confirmarReserva(deps, actorAdmin, "all", reserva.id, {
    expectedVersion: 1,
    confirmationEvidenceId: 502,
    reason: "Depósito acreditado en banco",
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  assert.equal(confirmada.status, "confirmada");
  assert.equal(confirmada.confirmationEvidenceId, 502);
  assert.ok(confirmada.confirmedAt);
  assert.equal(confirmada.confirmedBy, actorAdmin.userId);
  assert.equal(confirmada.rowVersion, 2);
});

test("confirmarReserva: conflicto si la versión esperada no coincide", async () => {
  const { deps } = crearHarness();
  const reserva = await crearReserva(deps, actorAdmin, "all", {
    dealId: 10,
    currency: "USD",
    totalCents: 5000000n,
    depositRequiredCents: 500000n,
    conditionsVersion: 1,
    conditionsDocumentId: 501,
    conditionsHash: "1".repeat(64),
    reason: "Reserva de prueba",
    parties: [{ contactId: 301, role: "titular" }],
    units: [{ unitId: 101, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  await assert.rejects(
    () =>
      confirmarReserva(deps, actorAdmin, "all", reserva.id, {
        expectedVersion: 99,
        confirmationEvidenceId: 502,
        reason: "Intento con versión vieja",
        idempotencyKey: randomUUID(),
        correlationId: randomUUID(),
        source: "test",
      }),
    ConflictError,
  );
});

test("cambiarUnidad: sustituye unidad activa por nueva unidad libre", async () => {
  const { deps, repo } = crearHarness();
  const reserva = await crearReserva(deps, actorAdmin, "all", {
    dealId: 10,
    currency: "USD",
    totalCents: 5000000n,
    depositRequiredCents: 500000n,
    conditionsVersion: 1,
    conditionsDocumentId: 501,
    conditionsHash: "2".repeat(64),
    reason: "Reserva inicial",
    parties: [{ contactId: 301, role: "titular" }],
    units: [{ unitId: 101, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  const modificada = await cambiarUnidadReserva(deps, actorAdmin, "all", reserva.id, {
    expectedVersion: 1,
    oldUnitId: 101,
    newUnit: { unitId: 102, priceCents: 5000000n, currency: "USD", componentRole: "principal" },
    releaseReason: "Cliente prefiere piso superior",
    reason: "Sustitución por unidad 102",
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  assert.equal(modificada.rowVersion, 2);
  const oldU = modificada.units.find(u => u.unitId === 101);
  const newU = modificada.units.find(u => u.unitId === 102);
  assert.ok(oldU?.releasedAt);
  assert.equal(oldU?.releaseReason, "Cliente prefiere piso superior");
  assert.equal(newU?.releasedAt, null);

  const activeCommitment = repo.commitments.find(c => c.status === "active");
  assert.equal(activeCommitment?.unitId, 102);
});

test("cambiarUnidad: rechaza cambio si la nueva unidad ya tiene compromiso activo", async () => {
  const { deps, repo } = crearHarness();
  repo.commitments.push({
    id: 55,
    unitId: 102,
    projectId: 1,
    unitCodeNormalized: "A-102",
    kind: "hold",
    status: "active",
    expiresAt: new Date(Date.now() + 86400000),
    rowVersion: 1,
  });

  const reserva = await crearReserva(deps, actorAdmin, "all", {
    dealId: 10,
    currency: "USD",
    totalCents: 5000000n,
    depositRequiredCents: 500000n,
    conditionsVersion: 1,
    conditionsDocumentId: 501,
    conditionsHash: "3".repeat(64),
    reason: "Reserva base",
    parties: [{ contactId: 301, role: "titular" }],
    units: [{ unitId: 101, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  await assert.rejects(
    () =>
      cambiarUnidadReserva(deps, actorAdmin, "all", reserva.id, {
        expectedVersion: 1,
        oldUnitId: 101,
        newUnit: { unitId: 102, priceCents: 5000000n, currency: "USD", componentRole: "principal" },
        releaseReason: "Cambio imposible",
        reason: "Cambio a unidad ocupada",
        idempotencyKey: randomUUID(),
        correlationId: randomUUID(),
        source: "test",
      }),
    ConflictError,
  );
});

test("cancelarReserva: cancela y resuelve compromisos", async () => {
  const { deps, repo } = crearHarness();
  const reserva = await crearReserva(deps, actorAdmin, "all", {
    dealId: 10,
    currency: "USD",
    totalCents: 5000000n,
    depositRequiredCents: 500000n,
    conditionsVersion: 1,
    conditionsDocumentId: 501,
    conditionsHash: "4".repeat(64),
    reason: "Reserva para cancelar",
    parties: [{ contactId: 301, role: "titular" }],
    units: [{ unitId: 101, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  const cancelada = await cancelarReserva(deps, actorAdmin, "all", reserva.id, {
    expectedVersion: 1,
    action: "cancelar",
    reason: "Comprador desiste",
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  assert.equal(cancelada.status, "expirada"); // No confirmada pasa a expirada
  assert.equal(repo.commitments.filter(c => c.status === "active").length, 0);
});

test("cancelarReserva: solicitar cancelación pone estado cancelacion_solicitada", async () => {
  const { deps, repo } = crearHarness();
  const reserva = await crearReserva(deps, actorAdmin, "all", {
    dealId: 10,
    currency: "USD",
    totalCents: 5000000n,
    depositRequiredCents: 500000n,
    conditionsVersion: 1,
    conditionsDocumentId: 501,
    conditionsHash: "5".repeat(64),
    reason: "Reserva confirmable",
    parties: [{ contactId: 301, role: "titular" }],
    units: [{ unitId: 101, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  const solicitada = await cancelarReserva(deps, actorAdmin, "all", reserva.id, {
    expectedVersion: 1,
    action: "solicitar",
    reason: "Solicitud formal de rescisión",
    idempotencyKey: randomUUID(),
    correlationId: randomUUID(),
    source: "test",
  });

  assert.equal(solicitada.status, "cancelacion_solicitada");
  assert.equal(repo.commitments.filter(c => c.status === "active").length, 1);
});

test("atomicidad: rollback completo en unidad de trabajo ante fallo", async () => {
  const { deps, repo } = crearHarness();

  await assert.rejects(async () => {
    await deps.unidad.ejecutar(async ({ reservas }) => {
      await reservas.crearReserva({
        dealId: 10,
        currency: "USD",
        totalCents: 5000000n,
        depositRequiredCents: 500000n,
        conditionsVersion: 1,
        conditionsDocumentId: 501,
        conditionsHash: "6".repeat(64),
        reason: "Fallo inyectado",
        parties: [{ contactId: 301, role: "titular" }],
        units: [{ unitId: 101, priceCents: 5000000n, currency: "USD", componentRole: "principal" }],
        idempotencyKey: randomUUID(),
        requestHash: "hash-fail",
        correlationId: randomUUID(),
        source: "test",
        actorId: 1,
      });
      throw new Error("Simulando fallo inesperado");
    });
  });

  assert.equal(repo.reservas.length, 0);
  assert.equal(repo.commitments.length, 0);
});
