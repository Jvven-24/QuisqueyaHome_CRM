/**
 * M4 · Actividades — edición y borrado lógico (`docs/F2_ANALISIS_Y_PLAN.md`
 * paso 2). Mismo patrón que `api/contactos/[id]/route.ts`.
 *
 * Completar una tarea es un `PATCH` de `status` — no un endpoint propio
 * (`docs/F2_ANALISIS_Y_PLAN.md` §4.1): la cola de tareas y la agenda leen la
 * misma tabla, así que marcarla lista es el mismo verbo que cualquier otro
 * cambio.
 */

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { ACTIVITY_PRIORITIES, ACTIVITY_STATUSES, ACTIVITY_TYPES } from "@/domain/catalogs";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction, type Db } from "@/infrastructure/db/client";
import { activities } from "@/infrastructure/db/schema";
import { errorResponse, parseInput, vaciosANull } from "@/infrastructure/http";
import { visibleRows } from "@/infrastructure/rbac-filter";

const EditarActividadInput = z.object({
  activityType: z.enum(ACTIVITY_TYPES).optional(),
  title: z.string().min(1, "Escribe el asunto de la actividad.").optional(),
  description: z.string().nullable().optional(),
  contactId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  dealId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  projectId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  assigneeId: z.coerce.number().int().positive().optional(),
  startsAt: z.string().nullable().optional(),
  endsAt: z.string().nullable().optional(),
  isAllDay: z.boolean().optional(),
  location: z.string().nullable().optional(),
  meetingUrl: z.string().nullable().optional(),
  priority: z.enum(ACTIVITY_PRIORITIES).optional(),
  status: z.enum(ACTIVITY_STATUSES).optional(),
});

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

async function actividadVisible(tx: Tx, id: number, actor: Awaited<ReturnType<typeof requireActor>>, scope: Parameters<typeof visibleRows>[1]) {
  const [fila] = await tx
    .select()
    .from(activities)
    .where(and(eq(activities.id, id), visibleRows(actor, scope, activities.assigneeId, activities.deletedAt)))
    .limit(1);
  return fila;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(
      EditarActividadInput,
      vaciosANull(await request.json().catch(() => ({})), [
        "description",
        "contactId",
        "dealId",
        "projectId",
        "startsAt",
        "endsAt",
        "location",
        "meetingUrl",
      ]),
    );
    const actor = await requireActor();
    const scope = requireScope(actor, "activities", "edit");

    const actividad = await transaction(async (tx) => {
      const anterior = await actividadVisible(tx, id, actor, scope);
      if (!anterior) throw new NotFoundError();

      const cambios: Partial<typeof activities.$inferInsert> = { updatedBy: actor.userId };
      if (datos.activityType !== undefined) cambios.activityType = datos.activityType;
      if (datos.title !== undefined) cambios.title = datos.title;
      if ("description" in datos) cambios.description = datos.description;
      if ("contactId" in datos) cambios.contactId = datos.contactId;
      if ("dealId" in datos) cambios.dealId = datos.dealId;
      if ("projectId" in datos) cambios.projectId = datos.projectId;
      if (datos.assigneeId !== undefined) cambios.assigneeId = datos.assigneeId;
      if ("startsAt" in datos) cambios.startsAt = datos.startsAt ? new Date(datos.startsAt) : null;
      if ("endsAt" in datos) cambios.endsAt = datos.endsAt ? new Date(datos.endsAt) : null;
      if (datos.isAllDay !== undefined) cambios.isAllDay = datos.isAllDay;
      if ("location" in datos) cambios.location = datos.location;
      if ("meetingUrl" in datos) cambios.meetingUrl = datos.meetingUrl;
      if (datos.priority !== undefined) cambios.priority = datos.priority;
      if (datos.status !== undefined) {
        cambios.status = datos.status;
        // Reabrir una actividad (volver a "pending") limpia la fecha de
        // cierre: "completada" y "con fecha de cierre" van juntas o no van.
        cambios.completedAt = datos.status === "completed" ? new Date() : null;
      }

      const [fila] = await tx.update(activities).set(cambios).where(eq(activities.id, id)).returning();

      await auditar(tx, actor, { accion: "editar", entidad: "activity", entidadId: id, antes: anterior, despues: fila });

      return fila;
    });

    return Response.json({ ok: true, actividad });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const actor = await requireActor();
    const scope = requireScope(actor, "activities", "delete");

    await transaction(async (tx) => {
      const anterior = await actividadVisible(tx, id, actor, scope);
      if (!anterior) throw new NotFoundError();

      const [fila] = await tx
        .update(activities)
        .set({ deletedAt: new Date(), updatedBy: actor.userId })
        .where(eq(activities.id, id))
        .returning();

      await auditar(tx, actor, { accion: "eliminar", entidad: "activity", entidadId: id, antes: anterior, despues: fila });
    });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
