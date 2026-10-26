/**
 * M4 · Agenda — exportación `.ics` (`docs/F2_ANALISIS_Y_PLAN.md` paso 3,
 * decisión #25). `text/calendar` generado en servidor con el mismo filtro de
 * permiso que la agenda: quien exporta no descarga citas que no podría ver.
 *
 * `?semana=YYYY-MM-DD` es cualquier fecha de la semana a exportar (por
 * defecto, hoy en Santo Domingo) — mismo parámetro que usa `/agenda`.
 */

import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { actividadesParaLectura } from "@/infrastructure/contenedor/actividades";
import { errorResponse } from "@/infrastructure/http";
import { exportarActividadesIcs } from "@/application/actividades/consultas";

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    const alcance = requireScope(actor, "activities", "view");
    const semana = new URL(request.url).searchParams.get("semana");
    const resultado = await exportarActividadesIcs(actividadesParaLectura(), actor, alcance, semana);
    return new Response(resultado.ics, {
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": `attachment; filename="agenda-${resultado.lunes}.ics"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
