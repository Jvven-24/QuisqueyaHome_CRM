/**
 * M4 · Actividades — edición y borrado lógico (`docs/F2_ANALISIS_Y_PLAN.md`
 * paso 2). Mismo patrón que `api/contactos/[id]/route.ts`.
 *
 * Completar una tarea es un `PATCH` de `status` — no un endpoint propio
 * (`docs/F2_ANALISIS_Y_PLAN.md` §4.1): la cola de tareas y la agenda leen la
 * misma tabla, así que marcarla lista es el mismo verbo que cualquier otro
 * cambio.
 */

import { z } from "zod";
import { ACTIVITY_PRIORITIES, ACTIVITY_STATUSES, ACTIVITY_TYPES } from "@/domain/catalogs";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { actividadesParaEscritura } from "@/infrastructure/contenedor/actividades";
import { errorResponse, idsDeRuta, parseInput, vaciosANull } from "@/infrastructure/http";
import { borrarActividad, editarActividad, type EntradaEditarActividad } from "@/application/actividades/casos-de-uso";

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

function entradaDeEdicion(datos: z.infer<typeof EditarActividadInput>): EntradaEditarActividad {
  const entrada: EntradaEditarActividad = {};
  if (datos.activityType !== undefined) entrada.activityType = datos.activityType;
  if (datos.title !== undefined) entrada.title = datos.title;
  if ("description" in datos) entrada.description = datos.description;
  if ("contactId" in datos) entrada.contactId = datos.contactId;
  if ("dealId" in datos) entrada.dealId = datos.dealId;
  if ("projectId" in datos) entrada.projectId = datos.projectId;
  if (datos.assigneeId !== undefined) entrada.assigneeId = datos.assigneeId;
  if ("startsAt" in datos) entrada.startsAt = datos.startsAt ? new Date(datos.startsAt) : null;
  if ("endsAt" in datos) entrada.endsAt = datos.endsAt ? new Date(datos.endsAt) : null;
  if (datos.isAllDay !== undefined) entrada.isAllDay = datos.isAllDay;
  if ("location" in datos) entrada.location = datos.location;
  if ("meetingUrl" in datos) entrada.meetingUrl = datos.meetingUrl;
  if (datos.priority !== undefined) entrada.priority = datos.priority;
  if (datos.status !== undefined) entrada.status = datos.status;
  return entrada;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [id] = idsDeRuta((await params).id);
    const datos = parseInput(
      EditarActividadInput,
      vaciosANull(await request.json().catch(() => ({})), [
        "description", "contactId", "dealId", "projectId", "startsAt",
        "endsAt", "location", "meetingUrl",
      ]),
    );
    const actor = await requireActor();
    const alcance = requireScope(actor, "activities", "edit");
    const actividad = await editarActividad(actividadesParaEscritura(), actor, alcance, id, entradaDeEdicion(datos));
    return Response.json({ ok: true, actividad });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const [id] = idsDeRuta((await params).id);
    const actor = await requireActor();
    const alcance = requireScope(actor, "activities", "delete");
    await borrarActividad(actividadesParaEscritura(), actor, alcance, id);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
