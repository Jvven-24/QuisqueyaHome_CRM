/**
 * M9 · Comisiones — exportación CSV (`docs/F3_ANALISIS_Y_PLAN.md` §3
 * hallazgo 7, decisión #37, issue #31). Mismo criterio que el `.ics` de
 * agenda (`api/actividades/ics/route.ts`): texto generado en servidor con el
 * mismo filtro de permiso y alcance que la pantalla, sin librería de hojas de
 * cálculo — Excel abre CSV.
 *
 * Los mismos `searchParams` (`broker`, `periodo`, `estado`) y la misma
 * consulta que `/comisiones` — `./_consulta.ts`, no una copia — así que quien
 * exporta nunca descarga una fila que la tabla no le mostró.
 */

import { COMMISSION_STATUS_LABELS } from "@/domain/comision-estado";
import { formatoPeriodo } from "@/domain/metas";
import { requireScope } from "@/domain/rbac";
import { generarCsv } from "@/domain/csv";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse } from "@/infrastructure/http";
import { consultarFilas, leerFiltros } from "@/app/(crm)/comisiones/_consulta";

const ENCABEZADO = [
  "Negocio",
  "Proyecto",
  "Monto de venta",
  "Comisión %",
  "Total comisión",
  "Broker %",
  "Agencia %",
  "Monto broker",
  "Monto agencia",
  "Broker",
  "Estado",
  "Fecha de cierre",
] as const;

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    const scope = requireScope(actor, "commissions", "export");

    const params = Object.fromEntries(new URL(request.url).searchParams);
    const filtros = leerFiltros(params);

    const filas = await consultarFilas(actor, scope, filtros);

    const csv = generarCsv(
      ENCABEZADO,
      filas.map((fila) => [
        fila.contactName,
        fila.projectName ?? "",
        (fila.saleAmountCents / 100).toFixed(2),
        (fila.commissionBasisPoints / 100).toString(),
        (fila.totalCommissionCents / 100).toFixed(2),
        (fila.brokerShareBasisPoints / 100).toString(),
        (fila.agencyShareBasisPoints / 100).toString(),
        (fila.brokerAmountCents / 100).toFixed(2),
        (fila.agencyAmountCents / 100).toFixed(2),
        fila.brokerName ?? "Sin asignar",
        COMMISSION_STATUS_LABELS[fila.status],
        fila.closedDate ?? "",
      ]),
    );

    const nombrePeriodo = filtros.periodo ? formatoPeriodo(filtros.periodo) : "todos";

    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="comisiones-${nombrePeriodo}.csv"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
