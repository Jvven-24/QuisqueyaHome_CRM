import assert from "node:assert/strict";
import { test } from "node:test";
import { NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { borrarActividad, crearActividad, editarActividad } from "./casos-de-uso.ts";
import { exportarActividadesIcs } from "./consultas.ts";
import { actividadesEnMemoria } from "./en-memoria.ts";
import type { Actividad } from "./puertos.ts";

const broker: Actor = { userId: 5, roleSlug: "broker", permissions: [] };
const actividad = (cambios: Partial<Actividad> & { id: number }): Actividad => {
  const { id, ...resto } = cambios;
  return {
    id,
    activityType: "task",
    title: "Llamar",
    description: null,
    contactId: null,
    dealId: null,
    projectId: null,
    assigneeId: 5,
    startsAt: null,
    endsAt: null,
    isAllDay: false,
    location: null,
    meetingUrl: null,
    status: "pending",
    priority: "normal",
    completedAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    createdBy: 5,
    updatedBy: 5,
    deletedAt: null,
    ...resto,
  };
};

function montar(iniciales: readonly Actividad[] = [], negocios: readonly number[] = []) {
  const actividades = actividadesEnMemoria(iniciales, negocios);
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ actividades, auditoria }, [actividades, auditoria]);
  return { actividades, auditoria, unidad, deps: { actividades, unidad } };
}

test("crear: inserta, audita y actualiza la próxima acción del negocio", async () => {
  const { deps, actividades, auditoria } = montar([], [7]);
  const fila = await crearActividad(deps, broker, "own", { activityType: "task", title: "Llamar", description: null, contactId: 3, dealId: 7, projectId: null, startsAt: null, endsAt: null, isAllDay: false, location: null, meetingUrl: null, priority: "high", status: "pending" });
  assert.equal(fila.assigneeId, 5);
  assert.deepEqual(actividades.proximas, [{ dealId: 7, actividadId: fila.id }]);
  assert.deepEqual(auditoria.registros, [{ accion: "crear", entidad: "activity", entidadId: fila.id, despues: fila, actorId: 5 }]);
});

test("crear: una actividad completada no reemplaza la próxima acción", async () => {
  const { deps, actividades } = montar([], [7]);
  await crearActividad(deps, broker, "own", {
    activityType: "call",
    title: "Ya ocurrió",
    description: null,
    contactId: null,
    dealId: 7,
    projectId: null,
    startsAt: null,
    endsAt: null,
    isAllDay: false,
    location: null,
    meetingUrl: null,
    priority: "normal",
    status: "completed",
  });
  assert.deepEqual(actividades.proximas, []);
});

test("crear: un broker no puede sobrescribir la próxima acción de un negocio fuera de alcance", async () => {
  const { deps, actividades, auditoria } = montar([], []);
  await assert.rejects(
    crearActividad(deps, broker, "own", {
      activityType: "task",
      title: "No",
      description: null,
      contactId: null,
      dealId: 99,
      projectId: null,
      startsAt: null,
      endsAt: null,
      isAllDay: false,
      location: null,
      meetingUrl: null,
      status: "pending",
    }),
    NotFoundError,
  );
  assert.deepEqual(actividades.filas, []);
  assert.deepEqual(actividades.proximas, []);
  assert.deepEqual(auditoria.registros, []);
});

test("editar: null borra un campo y ausencia lo conserva", async () => {
  const original = actividad({ id: 1, description: "detalle", location: "Oficina" });
  const { deps } = montar([original]);
  const intacta = await editarActividad(deps, broker, "own", 1, {});
  assert.equal(intacta.description, "detalle");
  assert.equal(intacta.location, "Oficina");
  const borrada = await editarActividad(deps, broker, "own", 1, { description: null, location: null });
  assert.equal(borrada.description, null);
  assert.equal(borrada.location, null);
});

test("editar: completar fija completedAt y reabrir la limpia", async () => {
  const original = actividad({ id: 1, status: "pending" });
  const { deps } = montar([original]);
  const completada = await editarActividad(deps, broker, "own", 1, { status: "completed" });
  assert.ok(completada.completedAt instanceof Date);
  const reabierta = await editarActividad(deps, broker, "own", 1, { status: "pending" });
  assert.equal(reabierta.completedAt, null);
});

test("exportar ICS: respeta alcance y rango de lunes a sábado exclusivo", async () => {
  const visible = actividad({ id: 1, title: "Visible", startsAt: new Date("2026-01-05T14:00:00Z") });
  const ajena = actividad({ id: 2, title: "Ajena", assigneeId: 9, startsAt: new Date("2026-01-06T14:00:00Z") });
  const sabado = actividad({ id: 3, title: "Sábado", startsAt: new Date("2026-01-10T14:00:00Z") });
  const domingo = actividad({ id: 4, title: "Domingo", startsAt: new Date("2026-01-11T14:00:00Z") });
  const sinHora = actividad({ id: 5, title: "Sin hora" });
  const { actividades } = montar([visible, ajena, sabado, domingo, sinHora]);
  const resultado = await exportarActividadesIcs({ actividades }, broker, "own", "2026-01-05");
  assert.equal(resultado.lunes, "2026-01-05");
  assert.match(resultado.ics, /SUMMARY:Visible/);
  assert.doesNotMatch(resultado.ics, /SUMMARY:(Ajena|Sábado|Domingo|Sin hora)/);
});

test("borrar: marca la fila y audita; fuera de alcance devuelve NotFoundError", async () => {
  const { deps, actividades, auditoria } = montar([actividad({ id: 1 })]);
  await borrarActividad(deps, broker, "own", 1);
  assert.ok(actividades.filas[0]!.deletedAt instanceof Date);
  assert.equal(auditoria.registros[0]!.accion, "eliminar");
  await assert.rejects(borrarActividad(deps, broker, "own", 1), NotFoundError);
});
