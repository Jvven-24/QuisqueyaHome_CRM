import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { consultarHoldPorId, consultarHoldPorPublicId, listarHolds } from "./consultas.ts";
import { CompromisosEnMemoria } from "./en-memoria.ts";
import type { Hold } from "./puertos.ts";

const broker1: Actor = { userId: 1, roleSlug: "broker", permissions: [] };
const broker2: Actor = { userId: 2, roleSlug: "broker", permissions: [] };
const admin: Actor = { userId: 99, roleSlug: "admin", permissions: [] };

function crearHarness() {
  const repo = new CompromisosEnMemoria();
  repo.deals.push({ id: 10, brokerId: 1, deletedAt: null });
  repo.deals.push({ id: 20, brokerId: 2, deletedAt: null });

  const now = new Date();
  const hold1: Hold = {
    id: 1,
    publicId: "00000000-0000-0000-0000-000000000001",
    dealId: 10,
    holderId: 1,
    status: "activo",
    expiresAt: new Date(now.getTime() + 48 * 3600 * 1000),
    policyVersion: 1,
    extensionCount: 0,
    reason: "Hold negocio 10",
    resolvedAt: null,
    createdBy: 1,
    updatedBy: 1,
    rowVersion: 1,
    correlationId: randomUUID(),
    source: "test",
    createdAt: now,
    updatedAt: now,
    units: [
      {
        unitId: 101,
        projectId: 1,
        unitCodeNormalized: "A-101",
        priceVersion: 1,
        priceCents: 10000000n,
        currency: "USD",
        componentRole: "principal",
      },
    ],
  };

  const hold2: Hold = {
    id: 2,
    publicId: "00000000-0000-0000-0000-000000000002",
    dealId: 20,
    holderId: 2,
    status: "activo",
    expiresAt: new Date(now.getTime() + 48 * 3600 * 1000),
    policyVersion: 1,
    extensionCount: 0,
    reason: "Hold negocio 20",
    resolvedAt: null,
    createdBy: 2,
    updatedBy: 2,
    rowVersion: 1,
    correlationId: randomUUID(),
    source: "test",
    createdAt: now,
    updatedAt: now,
    units: [
      {
        unitId: 201,
        projectId: 2,
        unitCodeNormalized: "B-201",
        priceVersion: 1,
        priceCents: 20000000n,
        currency: "USD",
        componentRole: "principal",
      },
    ],
  };

  repo.holds.push(hold1, hold2);
  const uow = unidadDeTrabajoEnMemoria({ compromisos: repo }, [repo]);
  return { repo, deps: { unidad: uow }, hold1, hold2 };
}

test("consultarHoldPorPublicId: retorna hold si está en alcance", async () => {
  const { deps, hold1 } = crearHarness();
  const hold = await consultarHoldPorPublicId(deps, broker1, "own", hold1.publicId);
  assert.equal(hold.id, 1);
  assert.equal(hold.publicId, hold1.publicId);
  assert.equal(hold.units.length, 1);
});

test("consultarHoldPorPublicId: lanza NotFoundError si pertenece a otro broker con scope own", async () => {
  const { deps, hold2 } = crearHarness();
  // Broker 1 intenta consultar hold 2 (de broker 2)
  await assert.rejects(
    () => consultarHoldPorPublicId(deps, broker1, "own", hold2.publicId),
    NotFoundError,
  );
  // Broker 2 sí puede acceder a su propio hold
  const propio = await consultarHoldPorPublicId(deps, broker2, "own", hold2.publicId);
  assert.equal(propio.id, 2);
});

test("consultarHoldPorId: admin con scope all consulta cualquier hold", async () => {
  const { deps, hold2 } = crearHarness();
  const hold = await consultarHoldPorId(deps, admin, "all", hold2.id);
  assert.equal(hold.id, 2);
});

test("listarHolds: filtra por alcance relacional propio de broker", async () => {
  const { deps } = crearHarness();
  const listaBroker1 = await listarHolds(deps, broker1, "own");
  assert.equal(listaBroker1.length, 1);
  assert.equal(listaBroker1[0]?.id, 1);

  const listaAdmin = await listarHolds(deps, admin, "all");
  assert.equal(listaAdmin.length, 2);
});

test("listarHolds: filtros de dealId y status funcionan correctamente", async () => {
  const { deps } = crearHarness();
  const porDeal = await listarHolds(deps, admin, "all", { dealId: 10 });
  assert.equal(porDeal.length, 1);
  assert.equal(porDeal[0]?.dealId, 10);

  const cancelados = await listarHolds(deps, admin, "all", { status: "cancelado" });
  assert.equal(cancelados.length, 0);
});
