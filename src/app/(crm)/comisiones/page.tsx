/**
 * M9 · Comisiones (`docs/F3_ANALISIS_Y_PLAN.md` §4.2, issue #31). Conecta
 * `/comisiones` a `commissions`: filtros reales por broker, periodo
 * (`closed_date`) y estado vía `searchParams`, KPI calculados con consulta
 * agregada respetando la regla multimoneda M22 (sin mezclar USD con DOP),
 * y la tabla que ya arma `./_consulta.ts` (compartida con el CSV de
 * `api/comisiones/export`). El JSX visual vive en `./vista.tsx` (cliente).
 */

import { and, eq, isNull, sql } from "drizzle-orm";
import { can } from "@/domain/rbac";
import { formatoPeriodo, nombreMes } from "@/domain/metas";
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
    // Consulta agrupada por moneda para respetar la regla M22 (sin mezclar USD con DOP).
    db
      .select({
        currency: commissions.currency,
        totalCents: sql<string>`coalesce(sum(${commissions.totalCommissionCents}), 0)`,
        totalCount: sql<number>`count(*)::int`,
        pendientesCents: sql<string>`coalesce(sum(${commissions.totalCommissionCents}) filter (where ${commissions.status} in ('pending', 'approved')), 0)`,
        porAprobarCount: sql<number>`count(*) filter (where ${commissions.status} = 'pending')::int`,
        pagadasCents: sql<string>`coalesce(sum(${commissions.totalCommissionCents}) filter (where ${commissions.status} = 'paid'), 0)`,
      })
      .from(commissions)
      .innerJoin(deals, eq(deals.id, commissions.dealId))
      .where(condicionBase(actor, scope, filtros))
      .groupBy(commissions.currency),
    // Selector de broker: solo tiene sentido con alcance `all` (con `own` el
    // actor solo se ve a sí mismo).
    scope === "all"
      ? db
          .select({ id: users.id, fullName: users.fullName })
          .from(users)
          .innerJoin(roles, eq(roles.id, users.roleId))
          .where(and(eq(roles.slug, "broker"), eq(users.isActive, true), isNull(users.deletedAt)))
          .orderBy(users.fullName)
      : Promise.resolve([]),
  ]);

  // Si no hay filas aún, asegurar fallback en USD con ceros
  const filaUsd = kpiFilas.find((f) => f.currency === "USD") ?? kpiFilas[0];
  const totalCountGeneral = kpiFilas.reduce((acc, f) => acc + f.totalCount, 0);
  const porAprobarCountGeneral = kpiFilas.reduce((acc, f) => acc + f.porAprobarCount, 0);

  const kpis = {
    totalCents: filaUsd ? Number(filaUsd.totalCents) : 0,
    totalCount: totalCountGeneral,
    pendientesCents: filaUsd ? Number(filaUsd.pendientesCents) : 0,
    porAprobarCount: porAprobarCountGeneral,
    pagadasCents: filaUsd ? Number(filaUsd.pagadasCents) : 0,
    monedaPrincipal: filaUsd?.currency ?? "USD",
    porMoneda: kpiFilas.map((f) => ({
      currency: f.currency,
      totalCents: Number(f.totalCents),
      totalCount: f.totalCount,
      pendientesCents: Number(f.pendientesCents),
      porAprobarCount: f.porAprobarCount,
      pagadasCents: Number(f.pagadasCents),
    })),
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
