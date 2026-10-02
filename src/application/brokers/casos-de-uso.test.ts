/**
 * Pruebas del caso de uso de Brokers: asignar y desasignar proyectos con el
 * doble en memoria. El diff es `domain/asignacion-propiedades.ts`.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ForbiddenError, NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { asignarProyectosABroker } from "./casos-de-uso.ts";
import { brokersEnMemoria } from "./en-memoria.ts";
import type { BrokerAsignable, Proyecto } from "./puertos.ts";

const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };
const broker: Actor = { userId: 5, roleSlug: "broker", permissions: [] };

function proyecto(parcial: Partial<Proyecto> & { id: number }): Proyecto {
  return {
    name: `Proyecto ${parcial.id}`,
    slug: `proyecto-${parcial.id}`,
    zone: null,
    projectType: "blueprint",
    operationType: "sale",
    developer: null,
    description: null,
    startDate: null,
    estimatedDeliveryDate: null,
    progressPercent: 0,
    currency: "USD",
    internalPriceCents: null,
    publicRangeMinCents: null,
    publicRangeMaxCents: null,
    brokerId: null,
    videoUrl: null,
    isPublished: false,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    createdBy: 1,
    updatedBy: 1,
    deletedAt: null,
    ...parcial,
  };
}

const BROKER_ACTIVO: BrokerAsignable = { userId: 5, isActive: true, deletedAt: null };

function montar(proyectos: Proyecto[], brokers: BrokerAsignable[] = [BROKER_ACTIVO]) {
  const repo = brokersEnMemoria({ brokers, proyectos });
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ brokers: repo, auditoria }, [repo, auditoria]);
  return { repo, auditoria, unidad, deps: { unidad } };
}

test("asignar proyectos libres: se asignan y cada uno se audita con 'asignar'", async () => {
  const { repo, auditoria, deps } = montar([proyecto({ id: 1 }), proyecto({ id: 2 })]);
  const filas = await asignarProyectosABroker(deps, admin, "all", 5, [1, 2]);

  assert.deepEqual(filas.map((f) => [f.id, f.brokerId, f.updatedBy]), [[1, 5, 1], [2, 5, 1]]);
  assert.deepEqual(repo.proyectos.map((p) => p.brokerId), [5, 5]);
  assert.equal(auditoria.registros.length, 2);
  for (const registro of auditoria.registros) {
    assert.equal(registro.accion, "asignar");
    assert.equal(registro.entidad, "project");
    assert.equal(registro.actorId, 1);
  }
  assert.equal((auditoria.registros[0]!.antes as Proyecto).brokerId, null);
  assert.equal((auditoria.registros[0]!.despues as Proyecto).brokerId, 5);
});

test("desasignar: lo que ya era del broker y no se pide, se suelta", async () => {
  const { repo, auditoria, deps } = montar([proyecto({ id: 1, brokerId: 5 }), proyecto({ id: 2, brokerId: 5 })]);
  const filas = await asignarProyectosABroker(deps, admin, "all", 5, [1]);

  assert.deepEqual(filas.map((f) => [f.id, f.brokerId]), [[2, null]]);
  assert.deepEqual(repo.proyectos.map((p) => p.brokerId), [5, null]);
  assert.equal(auditoria.registros.length, 1);
  assert.equal((auditoria.registros[0]!.antes as Proyecto).brokerId, 5);
});

test("asignar y soltar a la vez: primero las asignadas, luego las soltadas", async () => {
  const { auditoria, deps } = montar([proyecto({ id: 1, brokerId: 5 }), proyecto({ id: 2 })]);
  const filas = await asignarProyectosABroker(deps, admin, "all", 5, [2]);
  assert.deepEqual(filas.map((f) => [f.id, f.brokerId]), [[2, 5], [1, null]]);
  assert.deepEqual(auditoria.registros.map((r) => r.entidadId), [2, 1]);
});

test("sin cambios reales: no escribe ni audita nada y responde lista vacía", async () => {
  const { repo, auditoria, deps } = montar([proyecto({ id: 1, brokerId: 5 }), proyecto({ id: 2 })]);
  const antes = repo.proyectos;
  const filas = await asignarProyectosABroker(deps, admin, "all", 5, [1, 1]);

  assert.deepEqual(filas, []);
  assert.equal(repo.proyectos, antes);
  assert.equal(auditoria.registros.length, 0);
});

test("lista vacía suelta todo lo que tenía el broker", async () => {
  const { repo, deps } = montar([proyecto({ id: 1, brokerId: 5 }), proyecto({ id: 2, brokerId: 7 })]);
  const filas = await asignarProyectosABroker(deps, admin, "all", 5, []);
  assert.deepEqual(filas.map((f) => f.id), [1]);
  assert.equal(repo.proyectos.find((p) => p.id === 2)!.brokerId, 7);
});

test("reasignar un proyecto de otro broker lo toma (alcance all)", async () => {
  const { repo, deps } = montar([proyecto({ id: 1, brokerId: 7 })]);
  await asignarProyectosABroker(deps, admin, "all", 5, [1]);
  assert.equal(repo.proyectos[0]!.brokerId, 5);
});

test("un proyecto inactivo asignado hoy NO se desasigna solo (universo activo)", async () => {
  const { repo, deps } = montar([proyecto({ id: 1, brokerId: 5, isActive: false }), proyecto({ id: 2 })]);
  const filas = await asignarProyectosABroker(deps, admin, "all", 5, [2]);
  assert.deepEqual(filas.map((f) => f.id), [2]);
  assert.equal(repo.proyectos.find((p) => p.id === 1)!.brokerId, 5);
});

test("alcance distinto de all: 403 con el mensaje literal y nada escrito", async () => {
  for (const alcance of ["own", "team", "none"] as const) {
    const { repo, auditoria, unidad, deps } = montar([proyecto({ id: 1 })]);
    await assert.rejects(
      () => asignarProyectosABroker(deps, broker, alcance, 5, [1]),
      (error) =>
        error instanceof ForbiddenError &&
        error.message === "Se requiere alcance completo sobre proyectos para asignar propiedades.",
    );
    assert.equal(repo.proyectos[0]!.brokerId, null);
    assert.equal(auditoria.registros.length, 0);
    assert.equal(unidad.confirmadas + unidad.revertidas, 0);
  }
});

test("broker inexistente, inactivo o borrado: NotFoundError con el mensaje literal", async () => {
  const casos: BrokerAsignable[][] = [
    [],
    [{ userId: 5, isActive: false, deletedAt: null }],
    [{ userId: 5, isActive: true, deletedAt: new Date("2026-01-01T00:00:00Z") }],
  ];
  for (const brokers of casos) {
    const { repo, deps } = montar([proyecto({ id: 1 })], brokers);
    await assert.rejects(
      () => asignarProyectosABroker(deps, admin, "all", 5, [1]),
      (error) => error instanceof NotFoundError && error.message === "El broker indicado no existe.",
    );
    assert.equal(repo.proyectos[0]!.brokerId, null);
  }
});

test("un proyecto que no existe, está borrado o inactivo: NotFoundError y no se asigna ninguno", async () => {
  const { repo, auditoria, deps } = montar([
    proyecto({ id: 1 }),
    proyecto({ id: 2, isActive: false }),
    proyecto({ id: 3, deletedAt: new Date("2026-01-01T00:00:00Z") }),
  ]);
  for (const pedidos of [[1, 99], [1, 2], [1, 3]]) {
    await assert.rejects(
      () => asignarProyectosABroker(deps, admin, "all", 5, pedidos),
      (error) =>
        error instanceof NotFoundError && error.message === "Alguno de los proyectos indicados no existe o no está activo.",
    );
  }
  assert.deepEqual(repo.proyectos.map((p) => p.brokerId), [null, null, null]);
  assert.equal(auditoria.registros.length, 0);
});

test("un fallo dentro de la transacción deshace las asignaciones y la auditoría", async () => {
  const { repo, auditoria, unidad, deps } = montar([proyecto({ id: 1 }), proyecto({ id: 2, brokerId: 5 })]);
  repo.desasignar = async () => {
    throw new Error("fallo al soltar");
  };
  await assert.rejects(() => asignarProyectosABroker(deps, admin, "all", 5, [1]), /fallo al soltar/);
  assert.deepEqual(repo.proyectos.map((p) => p.brokerId), [null, 5]);
  assert.equal(auditoria.registros.length, 0);
  assert.equal(unidad.revertidas, 1);
});
