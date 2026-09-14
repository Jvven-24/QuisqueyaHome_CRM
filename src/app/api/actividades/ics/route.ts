/**
 * M4 · Agenda — exportación `.ics` (`docs/F2_ANALISIS_Y_PLAN.md` paso 3,
 * decisión #25). `text/calendar` generado en servidor con el mismo filtro de
 * permiso que la agenda: quien exporta no descarga citas que no podría ver.
 *
 * `?semana=YYYY-MM-DD` es cualquier fecha de la semana a exportar (por
 * defecto, hoy en Santo Domingo) — mismo parámetro que usa `/agenda`.
 */

import { and, asc, gte, lt } from "drizzle-orm";
import { generarIcs } from "@/domain/ics";
import { requireScope } from "@/domain/rbac";
import { fechaSantoDomingo, lunesDeLaSemana, medianocheSantoDomingo, sumarDias } from "@/domain/zona-horaria";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { activities } from "@/infrastructure/db/schema";
import { errorResponse } from "@/infrastructure/http";
import { visibleRows } from "@/infrastructure/rbac-filter";

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    const scope = requireScope(actor, "activities", "view");

    const semanaParam = new URL(request.url).searchParams.get("semana");
    const lunes = lunesDeLaSemana(semanaParam || fechaSantoDomingo(new Date()));
    const sabado = sumarDias(lunes, 5); // lunes + 5 días = sábado, límite exclusivo de la semana laboral

    const eventos = await getDb()
      .select({ id: activities.id, title: activities.title, startsAt: activities.startsAt, endsAt: activities.endsAt, location: activities.location })
      .from(activities)
      .where(
        and(
          visibleRows(actor, scope, activities.assigneeId, activities.deletedAt),
          gte(activities.startsAt, medianocheSantoDomingo(lunes)),
          lt(activities.startsAt, medianocheSantoDomingo(sabado)),
        ),
      )
      .orderBy(asc(activities.startsAt));

    // `startsAt` es nulable en el esquema (una tarea sin hora fija); el
    // filtro de fechas de arriba ya descarta esas filas (`gte`/`lt` con
    // `null` no compara verdadero en SQL), así que aquí siempre hay valor.
    const ics = generarIcs(
      eventos.map((e) => ({ id: e.id, title: e.title, startsAt: e.startsAt!, endsAt: e.endsAt, location: e.location })),
    );

    return new Response(ics, {
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": `attachment; filename="agenda-${lunes}.ics"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
