import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import {
  consultarReservaPorId,
  consultarReservaPorPublicId,
  listarReservas,
} from "./consultas.ts";
import { ReservasEnMemoria } from "./en-memoria.ts";
import type { Reserva } from "./puertos.ts";

const actorAdmin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };
const actorBroker1: Actor = { userId: 10, roleSlug: "broker", permissions: [] };
const actorBroker2: Actor = { userId: 20, roleSlug: "broker", permissions: [] };

function crearHarness() {
  const repo = new ReservasEnMemoria();
  repo.deals.push({ id: 1, brokerId: 10, deletedAt: null });
  repo.deals.push({ id: 2, brokerId: 20, deletedAt: null });

  const r1: Reserva = {
    id: 100,
    publicId: "11111111-1111-1111-1111-111111111111",
    dealId: 1,
    holdId: null,
    status: "pendiente_pago",
    currency: "USD",
    totalCents: 5000000n,
    adjustmentCents: 0n,
    depositRequiredCents: 500000n,
    conditionsVersion: 1,
    conditionsDocumentId: 1,
    conditionsHash: "a".repeat(64),
    confirmationEvidenceId: null,
    confirmedBy: null,
    confirmedAt: null,
    expiresAt: null,
    reason: "Reserva de broker 1",
    createdBy: 10,
    updatedBy: 10,
    rowVersion: 1,
    correlationId: randomUUID(),
    source: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
    parties: [{ id: 1, reservationId: 100, contactId: 301, role: "titular", representationEvidenceId: null }],
    units: [
      {
        id: 1,
        reservationId: 100,
        unitId: 101,
        projectId: 1,
        unitCodeNormalized: "A-101",
        priceCents: 5000000n,
        currency: "USD",
        componentRole: "principal",
        releasedAt: null,
        releaseReason: null,
      },
    ],
  };

  const r2: Reserva = {
    id: 200,
    publicId: "22222222-2222-2222-2222-222222222222",
    dealId: 2,
    holdId: null,
    status: "confirmada",
    currency: "USD",
    totalCents: 8000000n,
    adjustmentCents: 0n,
    depositRequiredCents: 800000n,
    conditionsVersion: 1,
    conditionsDocumentId: 1,
    conditionsHash: "b".repeat(64),
    confirmationEvidenceId: 2,
    confirmedBy: 20,
    confirmedAt: new Date(),
    expiresAt: null,
    reason: "Reserva de broker 2",
    createdBy: 20,
    updatedBy: 20,
    rowVersion: 2,
    correlationId: randomUUID(),
    source: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
    parties: [{ id: 2, reservationId: 200, contactId: 302, role: "titular", representationEvidenceId: null }],
    units: [
      {
        id: 2,
        reservationId: 200,
        unitId: 102,
        projectId: 1,
        unitCodeNormalized: "A-102",
        priceCents: 8000000n,
        currency: "USD",
        componentRole: "principal",
        releasedAt: null,
        releaseReason: null,
      },
    ],
  };

  repo.reservas.push(r1, r2);

  const uow = unidadDeTrabajoEnMemoria({ reservas: repo }, [repo]);
  return { repo, deps: { unidad: uow } };
}

test("consultarReservaPorPublicId: devuelve reserva si el actor tiene alcance", async () => {
  const { deps } = crearHarness();

  const r = await consultarReservaPorPublicId(
    deps,
    actorBroker1,
    "own",
    "11111111-1111-1111-1111-111111111111",
  );
  assert.equal(r.id, 100);
  assert.equal(r.dealId, 1);
});

test("consultarReservaPorPublicId: NotFoundError si broker ajeno con scope own intenta leerla", async () => {
  const { deps } = crearHarness();

  await assert.rejects(
    () =>
      consultarReservaPorPublicId(
        deps,
        actorBroker2,
        "own",
        "11111111-1111-1111-1111-111111111111",
      ),
    NotFoundError,
  );
});

test("consultarReservaPorId: devuelve reserva por id numérico con scope all", async () => {
  const { deps } = crearHarness();

  const r = await consultarReservaPorId(deps, actorAdmin, "all", 200);
  assert.equal(r.publicId, "22222222-2222-2222-2222-222222222222");
  assert.equal(r.status, "confirmada");
});

test("listarReservas: filtra por dealId y respeta alcance del broker", async () => {
  const { deps } = crearHarness();

  const todas = await listarReservas(deps, actorAdmin, "all", {});
  assert.equal(todas.length, 2);

  const delBroker1 = await listarReservas(deps, actorBroker1, "own", {});
  assert.equal(delBroker1.length, 1);
  assert.equal(delBroker1[0]?.id, 100);

  const filtradasPorDeal = await listarReservas(deps, actorAdmin, "all", { dealId: 2 });
  assert.equal(filtradasPorDeal.length, 1);
  assert.equal(filtradasPorDeal[0]?.id, 200);
});

test("listarReservas: filtra por unitId activa", async () => {
  const { deps } = crearHarness();

  const conUnidad101 = await listarReservas(deps, actorAdmin, "all", { unitId: 101 });
  assert.equal(conUnidad101.length, 1);
  assert.equal(conUnidad101[0]?.id, 100);

  const conUnidadInexistente = await listarReservas(deps, actorAdmin, "all", { unitId: 999 });
  assert.equal(conUnidadInexistente.length, 0);
});

test("listarReservas: filtra por status", async () => {
  const { deps } = crearHarness();

  const confirmadas = await listarReservas(deps, actorAdmin, "all", { status: "confirmada" });
  assert.equal(confirmadas.length, 1);
  assert.equal(confirmadas[0]?.id, 200);

  const borradores = await listarReservas(deps, actorAdmin, "all", { status: "borrador" });
  assert.equal(borradores.length, 0);
});
