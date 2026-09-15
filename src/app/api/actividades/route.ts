/**
 * M4 · Actividades — alta (`docs/F2_ANALISIS_Y_PLAN.md` paso 2).
 *
 * Cubre tanto una cita (`startsAt` con hora) como una tarea (sin hora fija,
 * `isAllDay`) y una nota de contacto ya hecha (`status: "completed"` de una
 * vez): el esquema ya unifica las tres en `activities` (decisión #23), y una
 * sola ruta de alta evita mantener dos formularios que divergen solos.
 *
 * `assigneeId` responde a "quién la hace", no a "quién la crea" (a diferencia
 * de `contacts.brokerId` en M1): un administrador con alcance `all` puede
 * agendar una tarea para un broker. Sin `assigneeId`, se asigna a quien la
 * crea — nunca queda huérfana de responsable.
 */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { ACTIVITY_PRIORITIES, ACTIVITY_TYPES } from "@/domain/catalogs";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { activities, deals } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";

const CrearActividadInput = z.object({
  activityType: z.enum(ACTIVITY_TYPES),
  title: z.string({ error: "Escribe el asunto de la actividad." }).min(1, "Escribe el asunto de la actividad."),
  description: z.string().optional(),
  contactId: z.coerce.number().int().positive().optional(),
  dealId: z.coerce.number().int().positive().optional(),
  projectId: z.coerce.number().int().positive().optional(),
  assigneeId: z.coerce.number().int().positive().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  isAllDay: z.coerce.boolean().optional(),
  location: z.string().optional(),
  meetingUrl: z.string().optional(),
  priority: z.enum(ACTIVITY_PRIORITIES).optional(),
  /** Solo para registrar algo ya hecho (ej. una llamada que acaba de terminar). Por defecto `pending`. */
  status: z.enum(["pending", "completed"]).optional(),
});

function limpiarVacios(cuerpo: unknown): unknown {
  if (typeof cuerpo !== "object" || cuerpo === null) return cuerpo;
  const copia: Record<string, unknown> = { ...(cuerpo as Record<string, unknown>) };
  for (const campo of [
    "description", "contactId", "dealId", "projectId", "assigneeId",
    "startsAt", "endsAt", "location", "meetingUrl", "priority",
  ]) {
    if (copia[campo] === "") delete copia[campo];
  }
  return copia;
}

export async function POST(request: Request) {
  try {
    const datos = parseInput(CrearActividadInput, limpiarVacios(await request.json().catch(() => ({}))));
    const actor = await requireActor();
    requireScope(actor, "activities", "create");

    const resultado = await transaction(async (tx) => {
      const [actividad] = await tx
        .insert(activities)
        .values({
          activityType: datos.activityType,
          title: datos.title,
          description: datos.description ?? null,
          contactId: datos.contactId ?? null,
          dealId: datos.dealId ?? null,
          projectId: datos.projectId ?? null,
          assigneeId: datos.assigneeId ?? actor.userId,
          startsAt: datos.startsAt ? new Date(datos.startsAt) : null,
          endsAt: datos.endsAt ? new Date(datos.endsAt) : null,
          isAllDay: datos.isAllDay ?? false,
          location: datos.location ?? null,
          meetingUrl: datos.meetingUrl ?? null,
          priority: datos.priority,
          status: datos.status ?? "pending",
          completedAt: datos.status === "completed" ? new Date() : null,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        })
        .returning();

      await auditar(tx, actor, { accion: "crear", entidad: "activity", entidadId: actividad!.id, despues: actividad });

      // La próxima acción del negocio (§10.1, → Presentación): la actividad
      // pendiente más reciente que se crea para un negocio es la que cuenta
      // como "próxima acción". Una ya completada al crearla (una llamada que
      // se registra después de hecha) no reemplaza lo que ya estaba agendado.
      if (datos.dealId && (datos.status ?? "pending") === "pending") {
        await tx.update(deals).set({ nextActivityId: actividad!.id }).where(eq(deals.id, datos.dealId));
      }

      return actividad!;
    });

    return Response.json({ ok: true, actividad: resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
