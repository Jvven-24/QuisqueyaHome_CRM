import { consultarReportesBi } from "@/application/reportes/consultas";
import { reportesRepositorio } from "@/infrastructure/contenedor/reportes";
import { consultarDashboard, dashboardScopes } from "@/application/dashboard/consultas";
import { can } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { dashboardRepositorio } from "@/infrastructure/contenedor/dashboard";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { leerFiltros, type FilterParams } from "../reportes/filtros";
import { InicioVista } from "./vista";

export const metadata = { title: "Inicio · CRM Quisqueya Home" };

export default async function InicioPage({ searchParams }: { searchParams: Promise<FilterParams> }) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "dashboard", "view");
  const filtros = leerFiltros(await searchParams);
  const scopes = dashboardScopes(actor, scope);

  // M41: Carga concurrente optimizada del dashboard y el embudo canónico de Reportes.
  const [metricas, reporte] = await Promise.all([
    consultarDashboard(dashboardRepositorio(), actor, scope, filtros),
    scopes.deals === "none"
      ? Promise.resolve(null)
      : consultarReportesBi(reportesRepositorio(), actor, scopes.deals, filtros),
  ]);

  metricas.funnel = reporte?.funnel ?? [];
  const permissions = {
    leads: scopes.leads !== "none",
    deals: scopes.deals !== "none",
    activities: scopes.activities !== "none",
    projects: scopes.projects !== "none",
    goals: scopes.goals !== "none",
    academy: scopes.academy !== "none",
    createLead: can(actor, "leads", "create"),
  };

  return <InicioVista key={actor.userId} roleSlug={actor.roleSlug} metricas={metricas} nombre={metricas.nombre} permissions={permissions} />;
}
