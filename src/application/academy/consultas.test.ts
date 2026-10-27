/**
 * Pruebas de consultas de Academy para gerentes. El repositorio es un doble mínimo:
 * solo implementa lo que la consulta de equipo usa. `npm test` lo corre con el runner de Node.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import type { Actor } from "../../domain/rbac.ts";
import { consultarProgresoEquipoAcademy } from "./consultas.ts";
import type { ConstanciaAcademy, RepositorioAcademy, SolicitudRevisionAcademy } from "./puertos.ts";

const ahora = new Date("2026-06-01T00:00:00.000Z");

function constancia(brokerId: number, issuedAt: string, status: "vigente" | "revocada" = "vigente"): ConstanciaAcademy {
  return {
    id: brokerId,
    publicId: "x",
    reviewRequestId: 1,
    brokerId,
    brokerNombre: "",
    brokerEmail: "",
    courseCode: "ONB-1",
    courseName: "",
    verificationCode: "V",
    cryptographicHash: "h",
    evidenceSnapshot: {},
    approvedBy: 1,
    approvedByNombre: "",
    status,
    revokedBy: null,
    revokedReason: null,
    revokedAt: null,
    issuedAt: new Date(issuedAt),
  };
}

const solicitudPendiente = { status: "pendiente" } as SolicitudRevisionAcademy;

// Brokers 10 y 11 en el equipo del gerente 5; el 20 es de otro equipo.
const constanciasPorBroker: Record<number, ConstanciaAcademy[]> = {
  10: [constancia(10, "2026-01-15T00:00:00.000Z"), constancia(10, "2025-01-01T00:00:00.000Z")],
  11: [constancia(11, "2025-05-01T00:00:00.000Z")],
  20: [constancia(20, "2026-01-15T00:00:00.000Z")],
};

function repoFalso(consultados: number[]): RepositorioAcademy {
  return {
    async obtenerPerfilActor(id: number) {
      consultados.push(id);
      return { userId: id, fullName: `Broker ${id}`, email: `b${id}@x.do`, roleSlug: "broker", moodleUserId: null, proyectosAsignados: [] };
    },
    async listarSolicitudesRevision(id?: number) {
      return id === 10 ? [solicitudPendiente] : [];
    },
    async listarConstancias(id?: number) {
      return id === undefined ? [] : constanciasPorBroker[id] ?? [];
    },
  } as unknown as RepositorioAcademy;
}

const gerente: Actor = {
  userId: 5,
  roleSlug: "manager",
  permissions: [{ resource: "academy", action: "view", scope: "team" }],
  teamUserIds: [5, 10, 11],
};

test("el gerente ve el progreso de su equipo, sin incluir a otros equipos", async () => {
  const consultados: number[] = [];
  const filas = await consultarProgresoEquipoAcademy(repoFalso(consultados), gerente, ahora);
  assert.ok(filas);
  assert.deepEqual(filas.map((f) => f.brokerId), [10, 11]);
  assert.ok(!consultados.includes(20));
});

test("cuenta constancias acreditadas, por vencer, vencidas y solicitudes pendientes", async () => {
  const filas = await consultarProgresoEquipoAcademy(repoFalso([]), gerente, ahora);
  assert.ok(filas);
  const broker10 = filas.find((f) => f.brokerId === 10)!;
  assert.equal(broker10.nombre, "Broker 10");
  assert.equal(broker10.constanciasAcreditadas, 1);
  assert.equal(broker10.vencidas, 1);
  assert.equal(broker10.porVencer, 0);
  assert.equal(broker10.solicitudesPendientes, 1);
  const broker11 = filas.find((f) => f.brokerId === 11)!;
  assert.equal(broker11.constanciasAcreditadas, 0);
  assert.equal(broker11.vencidas, 1);
});

test("quien no tiene alcance team sobre Academy no recibe datos de equipo", async () => {
  const admin: Actor = {
    userId: 1,
    roleSlug: "admin",
    permissions: [{ resource: "academy", action: "view", scope: "all" }],
    teamUserIds: [10],
  };
  assert.equal(await consultarProgresoEquipoAcademy(repoFalso([]), admin, ahora), null);
});
