/**
 * M9 · Comisiones — exportación CSV (`docs/F3_ANALISIS_Y_PLAN.md` §3
 * hallazgo 7, decisión #37, issue #31). Mismo criterio que el `.ics` de
 * agenda (`api/actividades/ics/route.ts`): texto generado en servidor con el
 * mismo filtro de permiso y alcance que la pantalla, sin librería de hojas de
 * cálculo — Excel abre CSV.
 *
 * Los mismos `searchParams` (`broker`, `periodo`, `estado`) y la misma
 * consulta que `/comisiones` — `_consulta.ts`, no una copia — así que quien
 * exporta nunca descarga una fila que la tabla no le mostró. La consulta se
 * inyecta en el caso de uso (`exportarComisionesCsv`) hasta que R4.3 la mueva a
 * `application/comisiones/consultas.ts`; el CSV y su nombre los arma el caso de uso.
 */

import { exportarComisionesCsv } from "@/application/comisiones/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse } from "@/infrastructure/http";
import { consultarFilas, leerFiltros } from "@/app/(crm)/comisiones/_consulta";

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    const scope = requireScope(actor, "commissions", "export");

    const params = Object.fromEntries(new URL(request.url).searchParams);
    const filtros = leerFiltros(params);

    const { csv, nombreArchivo } = await exportarComisionesCsv({ leerFilas: consultarFilas }, actor, scope, filtros);

    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${nombreArchivo}"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
