import assert from "node:assert/strict";
import { test } from "node:test";
import { ValidationError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { crearActividadesEnLote, type EntradaCrearActividad } from "./casos-de-uso.ts";
import { actividadesEnMemoria } from "./en-memoria.ts";

const broker: Actor = { userId: 5, roleSlug: "broker", permissions: [{ resource: "contacts", action: "view", scope: "own" }, { resource: "projects", action: "view", scope: "own" }] };
const tarea = (title: string): EntradaCrearActividad => ({ activityType: "task", title, description: null, contactId: null, dealId: null, projectId: null, startsAt: null, endsAt: null, isAllDay: false, location: null, meetingUrl: null, priority: "normal", status: "pending" });

function montar() {
  const actividades = actividadesEnMemoria([], [], { contacts: [] });
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ actividades, auditoria }, [actividades, auditoria]);
  return { actividades, auditoria, deps: { actividades, unidad } };
}

test("pack: crea todas las tareas en una sola unidad", async () => {
  const { deps, auditoria } = montar();
  const creadas = await crearActividadesEnLote(deps, broker, "own", [tarea("Uno"), tarea("Dos"), tarea("Tres")]);
  assert.equal(creadas.length, 3);
  assert.equal(auditoria.registros.length, 3);
});

test("pack: si una falla no queda ninguna creada", async () => {
  const { deps, auditoria, actividades } = montar();
  await assert.rejects(crearActividadesEnLote(deps, broker, "own", [tarea("Uno"), { ...tarea("Dos"), status: "completed" }]), ValidationError);
  assert.equal(auditoria.registros.length, 0);
  assert.equal(actividades.filas.length, 0);
});

test("pack vacío: error de validación", async () => {
  const { deps } = montar();
  await assert.rejects(crearActividadesEnLote(deps, broker, "own", []), ValidationError);
});
