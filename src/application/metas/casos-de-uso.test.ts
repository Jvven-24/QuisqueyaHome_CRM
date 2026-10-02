/**
 * Pruebas del caso de uso de Metas con el doble en memoria. El invariante
 * (decisión #35) —fijar la meta escribe solo `target_*`, nunca `achieved_*`—
 * se comprueba aquí con el doble y, sobre el SQL real, en `api/metas/route.test.ts`.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ForbiddenError, NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { fijarMetaMensual } from "./casos-de-uso.ts";
import { metasEnMemoria } from "./en-memoria.ts";
import type { Meta } from "./puertos.ts";

const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };
const broker: Actor = { userId: 5, roleSlug: "broker", permissions: [] };

function meta(parcial: Partial<Meta> & { id: number }): Meta {
  return {
    brokerId: 5,
    year: 2026,
    month: 9,
    targetDeals: 3,
    targetAmountCents: null,
    achievedDeals: 0,
    achievedAmountCents: 0,
    currency: "USD",
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    createdBy: 1,
    updatedBy: 1,
    ...parcial,
  };
}

function montar(metas: Meta[] = [], perfiles: number[] = [5, 7]) {
  const repo = metasEnMemoria({ metas, perfiles });
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ metas: repo, auditoria }, [repo, auditoria]);
  return { repo, auditoria, unidad, deps: { unidad } };
}

test("fijar la meta de un broker crea la fila y la audita como 'crear'", async () => {
  const { repo, auditoria, deps } = montar();
  const fila = await fijarMetaMensual(deps, admin, "all", { brokerId: 5, year: 2026, month: 9, targetDeals: 4, targetAmountCents: 500_000_00 });

  assert.equal(fila.brokerId, 5);
  assert.equal(fila.targetDeals, 4);
  assert.equal(fila.targetAmountCents, 500_000_00);
  assert.equal(fila.achievedDeals, 0);
  assert.equal(fila.updatedBy, 1);
  assert.equal(repo.metas.length, 1);
  assert.equal(auditoria.registros.length, 1);
  const registro = auditoria.registros[0]!;
  assert.equal(registro.accion, "crear");
  assert.equal(registro.entidad, "goal");
  assert.equal(registro.entidadId, fila.id);
  assert.equal(registro.actorId, 1);
  assert.equal(registro.antes, undefined);
  assert.deepEqual(registro.despues, fila);
});

test("fijar la meta de la compañía (brokerId nulo) no pide perfil de broker", async () => {
  const { auditoria, deps } = montar([], []);
  const fila = await fijarMetaMensual(deps, admin, "all", { brokerId: null, year: 2026, month: 9, targetDeals: 10 });

  assert.equal(fila.brokerId, null);
  assert.equal(fila.targetDeals, 10);
  assert.equal(fila.targetAmountCents, null);
  assert.equal(auditoria.registros[0]!.accion, "crear");
});

test("fijar la meta NO toca achieved_*: si ya había valores, siguen igual", async () => {
  const previa = meta({ id: 1, brokerId: 5, achievedDeals: 2, achievedAmountCents: 80_000_000 });
  const previaCompania = meta({ id: 2, brokerId: null, achievedDeals: 7, achievedAmountCents: 300_000_000 });
  const { repo, deps } = montar([previa, previaCompania]);

  const delBroker = await fijarMetaMensual(deps, admin, "all", { brokerId: 5, year: 2026, month: 9, targetDeals: 9 });
  const deLaCompania = await fijarMetaMensual(deps, admin, "all", { brokerId: null, year: 2026, month: 9, targetDeals: 20 });

  assert.equal(delBroker.achievedDeals, 2);
  assert.equal(delBroker.achievedAmountCents, 80_000_000);
  assert.equal(deLaCompania.achievedDeals, 7);
  assert.equal(deLaCompania.achievedAmountCents, 300_000_000);
  assert.equal(repo.metas.find((m) => m.id === 1)!.achievedDeals, 2);
  assert.equal(repo.metas.find((m) => m.id === 2)!.achievedAmountCents, 300_000_000);
});

test("fijar dos veces el mismo periodo actualiza en vez de duplicar, y la segunda se audita como 'editar'", async () => {
  const { repo, auditoria, deps } = montar();
  const primera = await fijarMetaMensual(deps, admin, "all", { brokerId: 5, year: 2026, month: 9, targetDeals: 3 });
  const segunda = await fijarMetaMensual(deps, admin, "all", { brokerId: 5, year: 2026, month: 9, targetDeals: 6 });

  assert.equal(repo.metas.length, 1);
  assert.equal(segunda.id, primera.id);
  assert.equal(segunda.targetDeals, 6);
  assert.equal(auditoria.registros[1]!.accion, "editar");
  assert.deepEqual(auditoria.registros[1]!.antes, primera);
  assert.deepEqual(auditoria.registros[1]!.despues, segunda);
});

test("la meta del broker y la de la compañía del mismo periodo son filas distintas", async () => {
  const { repo, deps } = montar();
  await fijarMetaMensual(deps, admin, "all", { brokerId: 5, year: 2026, month: 9, targetDeals: 3 });
  await fijarMetaMensual(deps, admin, "all", { brokerId: null, year: 2026, month: 9, targetDeals: 30 });
  await fijarMetaMensual(deps, admin, "all", { brokerId: null, year: 2026, month: 9, targetDeals: 31 });
  assert.equal(repo.metas.length, 2);
});

test("sin targetAmountCents en la edición, el monto que ya había se conserva", async () => {
  const { deps } = montar([meta({ id: 1, targetAmountCents: 900_000_00 })]);
  const fila = await fijarMetaMensual(deps, admin, "all", { brokerId: 5, year: 2026, month: 9, targetDeals: 8 });
  assert.equal(fila.targetAmountCents, 900_000_00);
});

test("un broker sin perfil: NotFoundError con el mensaje literal y nada escrito", async () => {
  const { repo, auditoria, deps } = montar([], []);
  await assert.rejects(
    () => fijarMetaMensual(deps, admin, "all", { brokerId: 5, year: 2026, month: 9, targetDeals: 3 }),
    (error) => error instanceof NotFoundError && error.message === "El broker indicado no tiene perfil de broker.",
  );
  assert.equal(repo.metas.length, 0);
  assert.equal(auditoria.registros.length, 0);
});

test("alcance own: la propia meta sí; la de otro broker y la de la compañía, 403 con el mensaje literal", async () => {
  const { repo, deps } = montar();
  const propia = await fijarMetaMensual(deps, broker, "own", { brokerId: 5, year: 2026, month: 9, targetDeals: 3 });
  assert.equal(propia.brokerId, 5);

  for (const brokerId of [7, null]) {
    await assert.rejects(
      () => fijarMetaMensual(deps, broker, "own", { brokerId, year: 2026, month: 9, targetDeals: 3 }),
      (error) => error instanceof ForbiddenError && error.message === "No tienes permiso para fijar esta meta.",
    );
  }
  assert.equal(repo.metas.length, 1);
});

test("un fallo dentro de la transacción no deja meta ni auditoría", async () => {
  const { repo, auditoria, unidad, deps } = montar();
  auditoria.registrar = async () => {
    throw new Error("fallo de auditoría");
  };
  await assert.rejects(
    () => fijarMetaMensual(deps, admin, "all", { brokerId: 5, year: 2026, month: 9, targetDeals: 3 }),
    /fallo de auditoría/,
  );
  assert.equal(repo.metas.length, 0);
  assert.equal(unidad.revertidas, 1);
});
