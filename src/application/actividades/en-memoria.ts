import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { Reversible } from "../testing/reversible.ts";
import type { Actividad, CambiosActividad, DatosNuevaActividad, EventoActividad, RepositorioActividades } from "./puertos.ts";

const FECHA_FIJA = new Date("2026-01-01T00:00:00Z");

export function actividadesEnMemoria(iniciales: readonly Actividad[] = [], negocios: readonly number[] = []): RepositorioActividades & Reversible & { readonly filas: readonly Actividad[]; readonly proximas: readonly { dealId: number; actividadId: number }[] } {
  let filas = [...iniciales];
  let siguienteId = Math.max(0, ...filas.map((fila) => fila.id)) + 1;
  let proximas: { dealId: number; actividadId: number }[] = [];
  const negocioIds = new Set(negocios);
  function indice(id: number): number {
    const resultado = filas.findIndex((fila) => fila.id === id);
    if (resultado < 0) throw new Error(`actividadesEnMemoria: no existe la actividad ${id}.`);
    return resultado;
  }
  function visible(actor: Actor, alcance: PermissionScope, fila: Actividad): boolean {
    return alcance !== "none" && fila.deletedAt === null && (alcance === "all" || fila.assigneeId === actor.userId);
  }
  function reemplazar(id: number, cambios: Partial<Actividad>): Actividad {
    const fila = { ...filas[indice(id)]!, ...cambios, updatedAt: FECHA_FIJA };
    filas = filas.map((actual, posicion) => posicion === indice(id) ? fila : actual);
    return fila;
  }
  return {
    get filas() { return filas; },
    get proximas() { return proximas; },
    async buscarVisible(actor, alcance, id) { return filas.find((fila) => fila.id === id && visible(actor, alcance, fila)); },
    async buscarNegocioVisible(_actor, alcance, id) { return alcance !== "none" && negocioIds.has(id) ? { id } : undefined; },
    async crear(datos: DatosNuevaActividad) {
      const fila: Actividad = { id: siguienteId++, activityType: datos.activityType, title: datos.title, description: datos.description, contactId: datos.contactId, dealId: datos.dealId, projectId: datos.projectId, assigneeId: datos.assigneeId, startsAt: datos.startsAt, endsAt: datos.endsAt, isAllDay: datos.isAllDay, location: datos.location, meetingUrl: datos.meetingUrl, status: datos.status, priority: datos.priority ?? "normal", completedAt: datos.completedAt, createdAt: FECHA_FIJA, updatedAt: FECHA_FIJA, createdBy: datos.createdBy, updatedBy: datos.updatedBy, deletedAt: null };
      filas = [...filas, fila]; return fila;
    },
    async actualizar(id: number, cambios: CambiosActividad) { return reemplazar(id, cambios); },
    async marcarBorrado(id, cuando, actorId) { return reemplazar(id, { deletedAt: cuando, updatedBy: actorId }); },
    async actualizarProximaActividad(dealId, actividadId) { proximas = [...proximas, { dealId, actividadId }]; },
    async eventosIcs(actor, alcance, desde, hasta): Promise<EventoActividad[]> {
      // `startsAt` es nulable en el esquema; el filtro de fechas ya descarta
      // esas filas (`gte`/`lt` con `null` no compara verdadero en SQL), así que
      // aquí siempre hay valor.
      return filas.filter((fila) => visible(actor, alcance, fila) && fila.startsAt !== null && fila.startsAt >= desde && fila.startsAt < hasta).map((fila) => ({ id: fila.id, title: fila.title, startsAt: fila.startsAt!, endsAt: fila.endsAt, location: fila.location }));
    },
    instantanea() {
      const copia = { filas, proximas };
      return () => { filas = copia.filas; proximas = copia.proximas; };
    },
  };
}
