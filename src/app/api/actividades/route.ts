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

import { aEntradaCrear, CrearActividadInput, limpiarVacios } from "./_entrada";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { actividadesParaEscritura } from "@/infrastructure/contenedor/actividades";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { crearActividad } from "@/application/actividades/casos-de-uso";
import { crearEventoEnCalendario } from "@/infrastructure/contenedor/google-calendario";

export async function POST(request: Request) {
  try {
    const cuerpo = await request.json().catch(() => ({}));
    const datos = parseInput(CrearActividadInput, limpiarVacios(cuerpo));
    const actor = await requireActor();
    const alcance = requireScope(actor, "activities", "create");
    const actividad = await crearActividad(actividadesParaEscritura(), actor, alcance, aEntradaCrear(datos));
    const google = await sincronizarConGoogle(actor.userId, cuerpo, datos);
    return Response.json({ ok: true, actividad, ...(google ? { google } : {}) });
  } catch (error) {
    return errorResponse(error);
  }
}

/**
 * Visitas (meeting con hora) van al calendario Google elegido en el formulario
 * (`googleCalendarId` = fila de google_calendars) o al predeterminado para visitas.
 * Nunca hace fallar el alta: la cita ya quedó en el CRM.
 */
async function sincronizarConGoogle(userId: number, cuerpo: unknown, datos: { activityType: string; title: string; startsAt?: string; endsAt?: string; description?: string; location?: string }) {
  const elegido = Number((cuerpo as { googleCalendarId?: unknown })?.googleCalendarId) || undefined;
  if (!datos.startsAt || (datos.activityType !== "meeting" && !elegido)) return null;
  const fin = datos.endsAt ?? new Date(new Date(datos.startsAt).getTime() + 3_600_000).toISOString();
  try {
    return await crearEventoEnCalendario(userId, elegido, { titulo: datos.title, inicio: datos.startsAt, fin, descripcion: datos.description, lugar: datos.location });
  } catch {
    return { error: "No se pudo crear el evento en Google Calendar." };
  }
}
