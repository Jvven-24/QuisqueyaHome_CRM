/**
 * M9 · Comisiones — consulta compartida entre `/comisiones` (tabla) y
 * `/api/comisiones/export` (CSV), issue #31.
 *
 * Los dos leen los mismos tres `searchParams` (`broker`, `periodo`, `estado`)
 * y aplican el mismo `visibleRows`: si cada uno construyera su propio
 * `WHERE`, tarde o temprano se desincronizan y alguien exporta filas que la
 * pantalla no muestra (o al revés). `route.ts` solo puede exportar verbos
 * HTTP, así que este helper vive en un archivo `_` de la carpeta de la
 * página, no en `api/comisiones/export/`.
 *
 * `condicionBase` (alcance + broker + periodo, sin estado) alimenta los KPI,
 * que desglosan por estado ellos mismos; `condicionFilas` le suma el filtro
 * de estado para la tabla y el CSV.
 *
 * `condicionBase` descarta negocios borrados (`deals.deleted_at`): la comisión
 * no tiene su propio borrado lógico, pero sigue atada a un negocio que pudo
 * borrarse después del cierre, y ni el reporte ni los KPI deben seguir
 * contándola. Como referencia `deals`, cualquier consulta que la use tiene
 * que unir esa tabla (ver el `innerJoin` que arma `consultarFilas` y el que
 * añade `page.tsx` para el KPI).
 */

import { and, desc, eq, gte, isNull, lt, type SQL } from "drizzle-orm";
import { COMMISSION_STATUSES, type CommissionStatus } from "@/domain/catalogs";
import { formatoPeriodo, parsearPeriodo, type Periodo } from "@/domain/metas";
import type { Actor, PermissionScope } from "@/domain/rbac";
import { getDb } from "@/infrastructure/db/client";
import { commissions, contacts, dealProperties, deals, projects, users } from "@/infrastructure/db/schema";
import { visibleRows } from "@/infrastructure/rbac-filter";

export type FiltrosComisiones = {
  /** `null` = todos los brokers (solo tiene efecto real con alcance `all`). */
  brokerId: number | null;
  /** `null` = todos los periodos. */
  periodo: Periodo | null;
  estado: CommissionStatus | "todos";
};

const ESTADOS_VALIDOS = new Set<string>(COMMISSION_STATUSES);

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

/** Lee `?broker=`, `?periodo=` y `?estado=` — los mismos tres nombres para la tabla y el CSV. */
export function leerFiltros(
  params: Record<string, string | string[] | undefined>,
  ahora: Date = new Date(),
): FiltrosComisiones {
  const brokerParam = Number(primero(params.broker));
  const periodoParam = primero(params.periodo);
  const estadoParam = primero(params.estado);

  return {
    brokerId: Number.isInteger(brokerParam) && brokerParam > 0 ? brokerParam : null,
    periodo: periodoParam === "todos" ? null : parsearPeriodo(periodoParam, ahora),
    estado: estadoParam && ESTADOS_VALIDOS.has(estadoParam) ? (estadoParam as CommissionStatus) : "todos",
  };
}

/** Primer día (`AAAA-MM-DD`) del mes siguiente a `periodo` — límite exclusivo del rango. */
function primerDiaMesSiguiente(periodo: Periodo): string {
  const mes = periodo.month === 12 ? 1 : periodo.month + 1;
  const anio = periodo.month === 12 ? periodo.year + 1 : periodo.year;
  return `${anio}-${String(mes).padStart(2, "0")}-01`;
}

/** Alcance + broker + periodo, sin el estado — lo que necesitan los KPI. */
export function condicionBase(actor: Actor, scope: PermissionScope, filtros: FiltrosComisiones): SQL | undefined {
  return and(
    visibleRows(actor, scope, commissions.brokerId),
    isNull(deals.deletedAt),
    filtros.brokerId != null ? eq(commissions.brokerId, filtros.brokerId) : undefined,
    filtros.periodo
      ? and(
          gte(commissions.closedDate, `${formatoPeriodo(filtros.periodo)}-01`),
          lt(commissions.closedDate, primerDiaMesSiguiente(filtros.periodo)),
        )
      : undefined,
  );
}

/** `condicionBase` + estado — lo que necesitan la tabla y el CSV. */
export function condicionFilas(actor: Actor, scope: PermissionScope, filtros: FiltrosComisiones): SQL | undefined {
  return and(condicionBase(actor, scope, filtros), filtros.estado !== "todos" ? eq(commissions.status, filtros.estado) : undefined);
}

export type FilaComision = {
  id: number;
  dealId: number;
  status: CommissionStatus;
  closedDate: string | null;
  currency: string;
  saleAmountCents: number;
  commissionBasisPoints: number;
  totalCommissionCents: number;
  brokerShareBasisPoints: number;
  agencyShareBasisPoints: number;
  brokerAmountCents: number;
  agencyAmountCents: number;
  brokerId: number | null;
  brokerName: string | null;
  contactName: string;
  projectName: string | null;
};

/** Filas de la tabla/CSV, con el proyecto de la unidad principal del negocio. */
export async function consultarFilas(
  actor: Actor,
  scope: PermissionScope,
  filtros: FiltrosComisiones,
): Promise<FilaComision[]> {
  const db = getDb();

  const filas = await db
    .select({
      id: commissions.id,
      dealId: commissions.dealId,
      status: commissions.status,
      closedDate: commissions.closedDate,
      currency: commissions.currency,
      saleAmountCents: commissions.saleAmountCents,
      commissionBasisPoints: commissions.commissionBasisPoints,
      totalCommissionCents: commissions.totalCommissionCents,
      brokerShareBasisPoints: commissions.brokerShareBasisPoints,
      agencyShareBasisPoints: commissions.agencyShareBasisPoints,
      brokerAmountCents: commissions.brokerAmountCents,
      agencyAmountCents: commissions.agencyAmountCents,
      brokerId: commissions.brokerId,
      brokerName: users.fullName,
      contactName: contacts.fullName,
    })
    .from(commissions)
    .innerJoin(deals, eq(deals.id, commissions.dealId))
    .innerJoin(contacts, eq(contacts.id, deals.contactId))
    .leftJoin(users, eq(users.id, commissions.brokerId))
    .where(condicionFilas(actor, scope, filtros))
    .orderBy(desc(commissions.closedDate), desc(commissions.id));

  // Proyecto de la unidad principal (`deal_properties.is_primary`): consulta
  // aparte y no un join más sobre `commissions`, mismo criterio que
  // `pipeline/page.tsx` — es una tabla N:M por negocio y un join directo
  // duplicaría filas si algo dejara más de una primaria por negocio.
  const primarias = await db
    .select({ dealId: dealProperties.dealId, projectName: projects.name })
    .from(dealProperties)
    .innerJoin(projects, eq(projects.id, dealProperties.projectId))
    .where(eq(dealProperties.isPrimary, true));
  const proyectoPorDeal = new Map(primarias.map((fila) => [fila.dealId, fila.projectName]));

  return filas.map((fila) => ({ ...fila, projectName: proyectoPorDeal.get(fila.dealId) ?? null }));
}
