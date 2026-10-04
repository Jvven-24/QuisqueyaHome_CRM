import { consultarReportesBi } from "@/application/reportes/consultas";
import { can, scopeFor } from "@/domain/rbac";
import { consultarDashboard } from "@/application/dashboard/consultas";
import { dashboardRepositorio } from "@/infrastructure/contenedor/dashboard";
import { requireActor } from "@/infrastructure/auth/actor";
import { reportesRepositorio } from "@/infrastructure/contenedor/reportes";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { leerFiltros, type FilterParams } from "./filtros";
import { ReportesVista } from "./vista";
import { reportTabs } from "../_ui/analitica-copy";
export const metadata = { title: "Reportes · CRM Quisqueya Home" };
export default async function ReportesPage({ searchParams }: { searchParams: Promise<FilterParams> }) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "reports", "view");
  const params = await searchParams;
  const filtros = leerFiltros(params);
  const dashboardScope = scopeFor(actor, "dashboard", "view");
  const [metricas, dashboard] = await Promise.all([
    consultarReportesBi(reportesRepositorio(), actor, scope, filtros),
    dashboardScope === "none" ? Promise.resolve(null) : consultarDashboard(dashboardRepositorio(), actor, dashboardScope, {}),
  ]);
  const initialTab = reportTabs.find(t => t.id === params.tab)?.id ?? "embudo";
  return <ReportesVista key={`${actor.userId}:${metricas.asOf}`} metricas={metricas} canExport={can(actor, "reports", "export")} periodo={typeof params.periodo === "string" ? params.periodo : "todo"} projects={dashboard?.projects.map(p => ({ id: p.id, label: p.name })) ?? []} initialTab={initialTab} />;
}

