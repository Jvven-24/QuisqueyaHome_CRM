/**
 * M9 · Comisiones (`docs/F3_ANALISIS_Y_PLAN.md` §4.2, issue #31). Conecta
 * `/comisiones` a `commissions`: filtros reales por broker, periodo
 * (`closed_date`) y estado vía `searchParams`, KPI calculados con una sola
 * consulta agregada, y la tabla que ya arma `./_consulta.ts` (compartida con
 * el CSV de `api/comisiones/export`, para que los dos nunca vean filas
 * distintas). El JSX visual vive en `./vista.tsx` (cliente).
 */

import { and, eq, isNull, sql } from "drizzle-orm";
import { can } from "@/domain/rbac";
import { formatoPeriodo } from "@/domain/metas";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { commissions, deals, roles, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { condicionBase, consultarFilas, leerFiltros } from "./_consulta";
import { ComisionesVista } from "./vista";

export const metadata = { title: "Comisiones · CRM Quisqueya Home" };

export default async function ComisionesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "commissions", "view");
  const puedeEditar = can(actor, "commissions", "edit");
  const puedeExportar = can(actor, "commissions", "export");

  const params = await searchParams;
  const filtros = leerFiltros(params);

  const db = getDb();

  const [filas, kpiFilas, brokers] = await Promise.all([
    consultarFilas(actor, scope, filtros),
    // Una sola consulta agregada para los tres KPI (sin `estado` en el
    // filtro: cada KPI desglosa por estado con su propio `filter`, no tiene
    // sentido que el selector de estado de la tabla también se lo aplique a
    // ellos — "pagadas" seguiría queriendo su total aunque la tabla filtre
    // por "pendiente").
    db
      .select({
        totalCents: sql<string>`coalesce(sum(${commissions.totalCommissionCents}), 0)`,
        totalCount: sql<number>`count(*)::int`,
        pendientesCents: sql<string>`coalesce(sum(${commissions.totalCommissionCents}) filter (where ${commissions.status} in ('pending', 'approved')), 0)`,
        porAprobarCount: sql<number>`count(*) filter (where ${commissions.status} = 'pending')::int`,
        pagadasCents: sql<string>`coalesce(sum(${commissions.totalCommissionCents}) filter (where ${commissions.status} = 'paid'), 0)`,
      })
      .from(commissions)
      // `condicionBase` filtra `deals.deleted_at`: sin este join, esa
      // condición referenciaría una tabla fuera del `FROM` y Postgres
      // fallaría con "missing FROM-clause entry".
      .innerJoin(deals, eq(deals.id, commissions.dealId))
      .where(condicionBase(actor, scope, filtros)),
    // Selector de broker: solo tiene sentido con alcance `all` (con `own` el
    // actor solo se ve a sí mismo). Mismo query que `contactos/page.tsx` para
    // la lista de brokers activos.
    scope === "all"
      ? db
          .select({ id: users.id, fullName: users.fullName })
          .from(users)
          .innerJoin(roles, eq(roles.id, users.roleId))
          .where(and(eq(roles.slug, "broker"), eq(users.isActive, true), isNull(users.deletedAt)))
          .orderBy(users.fullName)
      : Promise.resolve([]),
  ]);

  // `coalesce(sum(...), 0)` sin `GROUP BY` siempre trae una fila (mismo
  // comentario que `_cierre.ts`), pero postgres.js devuelve `bigint` como
  // texto para no perder precisión — se convierte aquí, una sola vez.
  const kpiFila = kpiFilas[0]!;
  const kpis = {
    totalCents: Number(kpiFila.totalCents),
    totalCount: kpiFila.totalCount,
    pendientesCents: Number(kpiFila.pendientesCents),
    porAprobarCount: kpiFila.porAprobarCount,
    pagadasCents: Number(kpiFila.pagadasCents),
  };

  const opcionesPeriodo = Array.from({ length: 12 }, (_, indice) => {
    const mes = indice + 1;
    const anio = filtros.periodo?.year ?? new Date().getFullYear();
    return { value: formatoPeriodo({ year: anio, month: mes }), label: `${nombreMes(mes)} ${anio}` };
  });

  return (
    <ComisionesVista
      scope={scope}
      puedeEditar={puedeEditar}
      puedeExportar={puedeExportar}
      brokerIdSeleccionado={filtros.brokerId}
      periodoSeleccionado={filtros.periodo ? formatoPeriodo(filtros.periodo) : "todos"}
      estadoSeleccionado={filtros.estado}
      opcionesPeriodo={opcionesPeriodo}
      brokers={brokers}
      kpis={kpis}
      filas={filas}
    />
  );
}

function nombreMes(mes: number): string {
  const fecha = new Date(Date.UTC(2000, mes - 1, 1));
  const texto = new Intl.DateTimeFormat("es-DO", { month: "long" }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
