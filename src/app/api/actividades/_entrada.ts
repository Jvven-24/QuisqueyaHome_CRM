/** Entrada HTTP compartida por el alta suelta y el pack (`lote`). */

import { tituloActividad } from "@/application/actividades/validacion";
import type { EntradaCrearActividad } from "@/application/actividades/casos-de-uso";
import { z } from "zod";
import { ACTIVITY_PRIORITIES, ACTIVITY_TYPES } from "@/domain/catalogs";

export const CrearActividadInput = z.object({
  activityType: z.enum(ACTIVITY_TYPES),
  title: tituloActividad,
  description: z.string().optional(),
  contactId: z.coerce.number().int().positive().optional(),
  dealId: z.coerce.number().int().positive().optional(),
  projectId: z.coerce.number().int().positive().optional(),
  assigneeId: z.coerce.number().int().positive().optional(),
  startsAt: z.iso.datetime({ offset: true, error: "Indica una fecha y hora válidas." }).optional(),
  endsAt: z.iso.datetime({ offset: true, error: "Indica una fecha y hora válidas." }).optional(),
  isAllDay: z.coerce.boolean().optional(),
  location: z.string().optional(),
  meetingUrl: z.string().optional(),
  priority: z.enum(ACTIVITY_PRIORITIES).optional(),
  /** Solo para registrar algo ya hecho (ej. una llamada que acaba de terminar). Por defecto `pending`. */
  status: z.enum(["pending", "completed"]).optional(),
});

export function limpiarVacios(cuerpo: unknown): unknown {
  if (typeof cuerpo !== "object" || cuerpo === null) return cuerpo;
  const copia: Record<string, unknown> = { ...(cuerpo as Record<string, unknown>) };
  for (const campo of [
    "description", "contactId", "dealId", "projectId", "assigneeId",
    "startsAt", "endsAt", "location", "meetingUrl", "priority",
  ]) {
    if (copia[campo] === "" || copia[campo] === null) delete copia[campo];
  }
  return copia;
}

export function aEntradaCrear(datos: z.infer<typeof CrearActividadInput>): EntradaCrearActividad {
  return {
      activityType: datos.activityType,
      title: datos.title,
      description: datos.description ?? null,
      contactId: datos.contactId ?? null,
      dealId: datos.dealId ?? null,
      projectId: datos.projectId ?? null,
      assigneeId: datos.assigneeId,
      startsAt: datos.startsAt ? new Date(datos.startsAt) : null,
      endsAt: datos.endsAt ? new Date(datos.endsAt) : null,
      isAllDay: datos.isAllDay ?? false,
      location: datos.location ?? null,
      meetingUrl: datos.meetingUrl ?? null,
      priority: datos.priority,
      status: datos.status ?? "pending",
  };
}
