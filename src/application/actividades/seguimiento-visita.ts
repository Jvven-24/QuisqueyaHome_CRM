import { z } from "zod";
import { ValidationError } from "../../domain/errors.ts";
export type SeguimientoVisita = {
  activityType: "task"; title: string; priority: "high" | "normal"; startsAt: string;
  assigneeId?: number; contactId?: number; dealId?: number; projectId?: number;
};
export async function crearSeguimientoVisita(crear: (datos: SeguimientoVisita) => Promise<{ ok: boolean }>, entrada: { titulo: string; fecha: string; prioridad: "high" | "normal"; assigneeId?: number; contactId?: number; dealId?: number; projectId?: number }): Promise<void> {
  if (!entrada.titulo.trim() || !z.iso.date().safeParse(entrada.fecha).success) throw new ValidationError("Indica título y fecha válidos para el seguimiento.");
  const respuesta = await crear({ activityType: "task", title: entrada.titulo.trim(), priority: entrada.prioridad, startsAt: entrada.fecha + "T10:00:00-04:00", assigneeId: entrada.assigneeId, contactId: entrada.contactId, dealId: entrada.dealId, projectId: entrada.projectId });
  if (!respuesta.ok) throw new ValidationError("El resultado se guardó, pero no se creó el seguimiento. Puedes reintentar sin volver a guardar el resultado.");
}
