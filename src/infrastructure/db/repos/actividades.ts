import { and, asc, eq, gte, lt } from "drizzle-orm";
import type { Db } from "../client";
import type { Actor, PermissionScope } from "../../../domain/rbac";
import type { Actividad, CambiosActividad, DatosNuevaActividad, EventoActividad, ReposActividades, RepositorioActividades } from "../../../application/actividades/puertos";
import { visibleRows } from "../../rbac-filter";
import { activities, deals } from "../schema";
import { auditoriaDrizzle, type Tx } from "./compartido";

type Ejecutor = Pick<Tx | Db, "select" | "insert" | "update">;

export function repositorioActividades(ejecutor: Ejecutor): RepositorioActividades {
  return {
    async buscarVisible(actor: Actor, alcance: PermissionScope, id: number): Promise<Actividad | undefined> {
      const [fila] = await ejecutor.select().from(activities).where(and(eq(activities.id, id), visibleRows(actor, alcance, activities.assigneeId, activities.deletedAt))).limit(1);
      return fila;
    },

    async buscarNegocioVisible(actor: Actor, alcance: PermissionScope, id: number): Promise<{ id: number } | undefined> {
      const [fila] = await ejecutor.select({ id: deals.id }).from(deals).where(and(eq(deals.id, id), visibleRows(actor, alcance, deals.brokerId, deals.deletedAt))).limit(1);
      return fila;
    },

    async crear(datos: DatosNuevaActividad): Promise<Actividad> {
      const [fila] = await ejecutor.insert(activities).values({
        activityType: datos.activityType,
        title: datos.title,
        description: datos.description,
        contactId: datos.contactId,
        dealId: datos.dealId,
        projectId: datos.projectId,
        assigneeId: datos.assigneeId,
        startsAt: datos.startsAt,
        endsAt: datos.endsAt,
        isAllDay: datos.isAllDay,
        location: datos.location,
        meetingUrl: datos.meetingUrl,
        priority: datos.priority,
        status: datos.status,
        completedAt: datos.completedAt,
        createdBy: datos.createdBy,
        updatedBy: datos.updatedBy,
      }).returning();
      return fila!;
    },

    async actualizar(id: number, cambios: CambiosActividad): Promise<Actividad> {
      const set: Partial<typeof activities.$inferInsert> = { updatedBy: cambios.updatedBy };
      if (cambios.activityType !== undefined) set.activityType = cambios.activityType;
      if (cambios.title !== undefined) set.title = cambios.title;
      if (cambios.description !== undefined) set.description = cambios.description;
      if (cambios.contactId !== undefined) set.contactId = cambios.contactId;
      if (cambios.dealId !== undefined) set.dealId = cambios.dealId;
      if (cambios.projectId !== undefined) set.projectId = cambios.projectId;
      if (cambios.assigneeId !== undefined) set.assigneeId = cambios.assigneeId;
      if (cambios.startsAt !== undefined) set.startsAt = cambios.startsAt;
      if (cambios.endsAt !== undefined) set.endsAt = cambios.endsAt;
      if (cambios.isAllDay !== undefined) set.isAllDay = cambios.isAllDay;
      if (cambios.location !== undefined) set.location = cambios.location;
      if (cambios.meetingUrl !== undefined) set.meetingUrl = cambios.meetingUrl;
      if (cambios.priority !== undefined) set.priority = cambios.priority;
      if (cambios.status !== undefined) set.status = cambios.status;
      if (cambios.completedAt !== undefined) set.completedAt = cambios.completedAt;
      const [fila] = await ejecutor.update(activities).set(set).where(eq(activities.id, id)).returning();
      return fila!;
    },

    async marcarBorrado(id: number, cuando: Date, actorId: number): Promise<Actividad> {
      const [fila] = await ejecutor.update(activities).set({ deletedAt: cuando, updatedBy: actorId }).where(eq(activities.id, id)).returning();
      return fila!;
    },

    async actualizarProximaActividad(dealId: number, actividadId: number): Promise<void> {
      await ejecutor.update(deals).set({ nextActivityId: actividadId }).where(eq(deals.id, dealId));
    },

    async eventosIcs(actor: Actor, alcance: PermissionScope, desde: Date, hasta: Date): Promise<EventoActividad[]> {
      const filas = await ejecutor.select({ id: activities.id, title: activities.title, startsAt: activities.startsAt, endsAt: activities.endsAt, location: activities.location })
        .from(activities)
        .where(and(visibleRows(actor, alcance, activities.assigneeId, activities.deletedAt), gte(activities.startsAt, desde), lt(activities.startsAt, hasta)))
        .orderBy(asc(activities.startsAt));
      return filas.map((fila) => ({ id: fila.id, title: fila.title, startsAt: fila.startsAt!, endsAt: fila.endsAt, location: fila.location }));
    },
  };
}

export function reposActividades(tx: Tx): ReposActividades {
  return { actividades: repositorioActividades(tx), auditoria: auditoriaDrizzle(tx) };
}
