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

export async function POST(request: Request) {
  try {
    const datos = parseInput(
      CrearActividadInput,
      limpiarVacios(await request.json().catch(() => ({}))),
    );
    const actor = await requireActor();
    const alcance = requireScope(actor, "activities", "create");
    const actividad = await crearActividad(actividadesParaEscritura(), actor, alcance, aEntradaCrear(datos));
    return Response.json({ ok: true, actividad });
  } catch (error) {
    return errorResponse(error);
  }
}
