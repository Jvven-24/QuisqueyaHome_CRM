import { requireScope } from "../../domain/rbac.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import { puedeModificarNota } from "./notas.ts";
import { tituloActividad } from "./validacion.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { Actividad, CambiosActividad, DatosNuevaActividad, ReposActividades, RepositorioActividades } from "./puertos.ts";

export type EntradaCrearActividad = Omit<DatosNuevaActividad, "assigneeId" | "createdBy" | "updatedBy" | "completedAt"> & {
  assigneeId?: number;
};

export type EntradaEditarActividad = Omit<CambiosActividad, "updatedBy">;

type Escritura = { actividades: RepositorioActividades; unidad: UnidadDeTrabajo<ReposActividades> };

async function crearEnUnidad({ actividades, auditoria }: ReposActividades, actor: Actor, alcance: PermissionScope, entrada: EntradaCrearActividad): Promise<Actividad> {
  await validarReferencias(actividades, actor, alcance, entrada);
  validarResultadoTarea(entrada.activityType, entrada.status, entrada.description);
  if (entrada.dealId !== null) {
    // Hallazgo H15 de `docs/R_HALLAZGOS.md`: antes el alcance se pedía y se
    // tiraba, y `dealId` entraba sin comprobar. Como más abajo se escribe la
    // próxima acción de ese negocio, un broker con alcance `own` podía
    // sobrescribir la próxima acción del negocio de otro broker mandando su
    // id a mano. `seguridad.test.ts` no lo veía porque comprueba que
    // `requireScope` se *llame*, y se llamaba: lo que faltaba era usarlo.
    //
    // Se relee con el alcance antes de crear la actividad: `NotFoundError`
    // cubre a la vez "no existe" y "existe fuera de tu alcance", sin
    // distinguirlos.
    const negocio = await actividades.buscarNegocioVisible(actor, alcance, entrada.dealId);
    if (!negocio) throw new NotFoundError();
  }

  const actividad = await actividades.crear({
    activityType: entrada.activityType,
    title: entrada.title.trim(),
    description: entrada.description,
    contactId: entrada.contactId,
    dealId: entrada.dealId,
    projectId: entrada.projectId,
    assigneeId: entrada.assigneeId ?? actor.userId,
    startsAt: entrada.startsAt,
    endsAt: entrada.endsAt,
    isAllDay: entrada.isAllDay,
    location: entrada.location,
    meetingUrl: entrada.meetingUrl,
    priority: entrada.priority,
    status: entrada.status,
    completedAt: entrada.status === "completed" ? new Date() : null,
    createdBy: actor.userId,
    updatedBy: actor.userId,
  });

  await auditoria.registrar(actor, { accion: "crear", entidad: "activity", entidadId: actividad.id, despues: actividad });
  // La próxima acción del negocio (§10.1, → Presentación): la actividad
  // pendiente más reciente que se crea para un negocio es la que cuenta
  // como "próxima acción". Una ya completada al crearla (una llamada que
  // se registra después de hecha) no reemplaza lo que ya estaba agendado.
  if (entrada.dealId !== null && entrada.status === "pending") {
    await actividades.actualizarProximaActividad(entrada.dealId, actividad.id);
  }
  return actividad;
}

export async function crearActividad(deps: Escritura, actor: Actor, alcance: PermissionScope, entrada: EntradaCrearActividad): Promise<Actividad> {
  return deps.unidad.ejecutar((repos) => crearEnUnidad(repos, actor, alcance, entrada));
}

/**
 * Pack de tareas: todas o ninguna en una sola transacción (auditoría
 * 27/10/2026: antes eran N POST sueltos y un reintento duplicaba las creadas).
 */
export async function crearActividadesEnLote(deps: Escritura, actor: Actor, alcance: PermissionScope, entradas: readonly EntradaCrearActividad[]): Promise<Actividad[]> {
  if (entradas.length === 0) throw new ValidationError("El pack no tiene tareas.");
  return deps.unidad.ejecutar(async (repos) => {
    const creadas: Actividad[] = [];
    for (const entrada of entradas) creadas.push(await crearEnUnidad(repos, actor, alcance, entrada));
    return creadas;
  });
}

export async function editarActividad(deps: { unidad: UnidadDeTrabajo<ReposActividades> }, actor: Actor, alcance: PermissionScope, id: number, entrada: EntradaEditarActividad): Promise<Actividad> {
  return deps.unidad.ejecutar(async ({ actividades, auditoria }) => {
    const anterior = await actividades.buscarVisible(actor, alcance, id);
    if (!anterior) throw new NotFoundError();
    if (anterior.activityType === "note") {
      if ("leadId" in anterior && anterior.leadId != null) throw new ValidationError("Modifica esta nota desde la bitácora de su lead.");
      if (!puedeModificarNota(actor, anterior, "edit")) throw new ForbiddenError("Solo el autor o un usuario con permiso global puede modificar esta nota.");
      if (anterior.dealId !== null && !await actividades.buscarNegocioVisible(actor, requireScope(actor, "deals", "view"), anterior.dealId)) throw new NotFoundError();
      if (anterior.contactId !== null && !await actividades.referenciaVisible(actor, requireScope(actor, "contacts", "view"), "contacts", anterior.contactId)) throw new NotFoundError();
    }
    if (anterior.activityType === "note" && ["activityType", "contactId", "dealId", "assigneeId"].some(campo => campo in entrada)) throw new ValidationError("La autoría y los vínculos de una nota no se pueden cambiar.");
    if (entrada.dealId !== undefined && entrada.dealId !== null && entrada.dealId !== anterior.dealId) {
      const negocio = await actividades.buscarNegocioVisible(actor, alcance, entrada.dealId);
      if (!negocio) throw new NotFoundError();
    }
    // Validar el rango con los valores efectivos: un PATCH que solo trae `endsAt`
    // (o solo `startsAt`) se compara contra lo ya guardado en la fila.
    await validarReferencias(actividades, actor, alcance, {
      ...entrada,
      startsAt: "startsAt" in entrada ? entrada.startsAt : anterior.startsAt,
      endsAt: "endsAt" in entrada ? entrada.endsAt : anterior.endsAt,
    });
    validarResultadoTarea(entrada.activityType ?? anterior.activityType, entrada.status, entrada.description);
    const cambios: CambiosActividad = { updatedBy: actor.userId };
    if (entrada.activityType !== undefined) cambios.activityType = entrada.activityType;
    if (entrada.title !== undefined) cambios.title = entrada.title.trim();
    if ("description" in entrada) cambios.description = entrada.description;
    if ("contactId" in entrada) cambios.contactId = entrada.contactId;
    if ("dealId" in entrada) cambios.dealId = entrada.dealId;
    if ("projectId" in entrada) cambios.projectId = entrada.projectId;
    if (entrada.assigneeId !== undefined) cambios.assigneeId = entrada.assigneeId;
    if ("startsAt" in entrada) cambios.startsAt = entrada.startsAt;
    if ("endsAt" in entrada) cambios.endsAt = entrada.endsAt;
    if (entrada.isAllDay !== undefined) cambios.isAllDay = entrada.isAllDay;
    if ("location" in entrada) cambios.location = entrada.location;
    if ("meetingUrl" in entrada) cambios.meetingUrl = entrada.meetingUrl;
    if (entrada.priority !== undefined) cambios.priority = entrada.priority;
    if (entrada.status !== undefined) {
      cambios.status = entrada.status;
      // Reabrir una actividad (volver a "pending") limpia la fecha de cierre:
      // "completada" y "con fecha de cierre" van juntas o no van.
      cambios.completedAt = entrada.status === "completed" ? new Date() : null;
    }
    const actividad = await actividades.actualizar(id, cambios);
    await auditoria.registrar(actor, { accion: "editar", entidad: "activity", entidadId: id, antes: anterior, despues: actividad });
    return actividad;
  });
}

export async function borrarActividad(deps: { unidad: UnidadDeTrabajo<ReposActividades> }, actor: Actor, alcance: PermissionScope, id: number): Promise<void> {
  await deps.unidad.ejecutar(async ({ actividades, auditoria }) => {
    const anterior = await actividades.buscarVisible(actor, alcance, id);
    if (!anterior) throw new NotFoundError();
    if (anterior.activityType === "note") {
      if ("leadId" in anterior && anterior.leadId != null) throw new ValidationError("Modifica esta nota desde la bitácora de su lead.");
      if (!puedeModificarNota(actor, anterior, "delete")) throw new ForbiddenError("Solo el autor o un usuario con permiso global puede modificar esta nota.");
      if (anterior.dealId !== null && !await actividades.buscarNegocioVisible(actor, requireScope(actor, "deals", "view"), anterior.dealId)) throw new NotFoundError();
      if (anterior.contactId !== null && !await actividades.referenciaVisible(actor, requireScope(actor, "contacts", "view"), "contacts", anterior.contactId)) throw new NotFoundError();
    }
    const actividad = await actividades.marcarBorrado(id, new Date(), actor.userId);
    await auditoria.registrar(actor, { accion: "eliminar", entidad: "activity", entidadId: id, antes: anterior, despues: actividad });
  });
}

async function validarReferencias(repo: RepositorioActividades, actor: Actor, alcance: PermissionScope, entrada: { assigneeId?: number; title?: string; contactId?: number | null; projectId?: number | null; startsAt?: Date | null; endsAt?: Date | null }): Promise<void> {
  if (entrada.assigneeId !== undefined && entrada.assigneeId !== actor.userId && alcance !== "all") throw new ForbiddenError("No tienes permiso para asignar esta actividad a otra persona.");
  if (entrada.title !== undefined && !tituloActividad.safeParse(entrada.title).success) throw new ValidationError("Escribe el título.", { title: "Escribe el título." });
  for (const [recurso, id] of [["contacts", entrada.contactId], ["projects", entrada.projectId]] as const) {
    if (id != null && !await repo.referenciaVisible(actor, requireScope(actor, recurso, "view"), recurso, id)) throw new NotFoundError();
  }
  if (entrada.startsAt && entrada.endsAt && entrada.endsAt <= entrada.startsAt) throw new ValidationError("La fecha de fin debe ser posterior al inicio.", { endsAt: "Indica una hora posterior al inicio." });
}

function validarResultadoTarea(tipo: string, estado: string | undefined, descripcion: string | null | undefined): void {
  if (tipo === "task" && estado === "completed" && !descripcion?.trim()) throw new ValidationError("Describe el resultado o la evidencia de la tarea.", { description: "Describe el resultado o la evidencia de la tarea." });
}
