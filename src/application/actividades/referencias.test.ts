import { test } from "node:test";
import assert from "node:assert/strict";
import { NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { crearActividad, editarActividad } from "./casos-de-uso.ts";
import { actividadesEnMemoria } from "./en-memoria.ts";
const actor: Actor = { userId: 5, roleSlug: "broker", permissions: [{ resource: "contacts", action: "view", scope: "own" }, { resource: "projects", action: "view", scope: "own" }] };
const entrada = { activityType: "task" as const, title: "Visita", description: null, contactId: null, dealId: null, projectId: null, startsAt: null, endsAt: null, isAllDay: false, location: null, meetingUrl: null, status: "pending" as const };
function montar() {
  const actividades = actividadesEnMemoria([], [], { contacts: [{ id: 1, brokerId: 5 }, { id: 2, brokerId: 6 }, { id: 3, brokerId: 5, deletedAt: new Date() }], projects: [{ id: 1, brokerId: 5 }, { id: 2, brokerId: 6 }] });
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ actividades, auditoria }, [actividades, auditoria]);
  return { deps: { actividades, unidad }, actividades, auditoria };
}
for (const cambio of [{ contactId: 2 }, { contactId: 3 }, { contactId: 999 }, { projectId: 2 }, { projectId: 999 }]) {
  test("actividad: rechaza referencia ajena, borrada o inexistente " + JSON.stringify(cambio), async () => {
    const { deps, actividades, auditoria } = montar();
    await assert.rejects(crearActividad(deps, actor, "own", { ...entrada, ...cambio }), NotFoundError);
    assert.equal(actividades.filas.length, 0); assert.equal(auditoria.registros.length, 0);
  });
}
test("actividad: enlaza referencias propias y revierte una edición que cambia a proyecto ajeno", async () => {
  const { deps, actividades, auditoria } = montar();
  const fila = await crearActividad(deps, actor, "own", { ...entrada, contactId: 1, projectId: 1 });
  await assert.rejects(editarActividad(deps, actor, "own", fila.id, { projectId: 2 }), NotFoundError);
  assert.equal(actividades.filas[0]?.projectId, 1); assert.equal(auditoria.registros.length, 1);
});

test("actividad: alcance propio impide asignar a otro usuario al crear o editar", async () => {
  const { deps, actividades } = montar();
  await assert.rejects(crearActividad(deps, actor, "own", { ...entrada, assigneeId: 9 }), /No tienes permiso/);
  const fila = await crearActividad(deps, actor, "own", entrada);
  await assert.rejects(editarActividad(deps, actor, "own", fila.id, { assigneeId: 9 }), /No tienes permiso/);
  assert.equal(actividades.filas[0]?.assigneeId, actor.userId);
});
test("actividad: alcance global conserva la asignación explícita autorizada", async () => {
  const { deps } = montar();
  const fila = await crearActividad(deps, actor, "all", { ...entrada, assigneeId: 9 });
  assert.equal(fila.assigneeId, 9);
});

test("tarea: cerrar sin resultado se rechaza sin completar ni auditar; con resultado persiste", async () => {
  const { deps, actividades, auditoria } = montar();
  const tarea = await crearActividad(deps, actor, "own", entrada);
  await assert.rejects(editarActividad(deps, actor, "own", tarea.id, { status: "completed", description: "  " }), /resultado o la evidencia/);
  assert.equal(actividades.filas[0]?.status, "pending"); assert.equal(auditoria.registros.length, 1);
  const completada = await editarActividad(deps, actor, "own", tarea.id, { status: "completed", description: "Se envió la documentación solicitada" });
  assert.equal(completada.status, "completed"); assert.ok(completada.completedAt); assert.equal(completada.description, "Se envió la documentación solicitada"); assert.equal(auditoria.registros.length, 2);
});
