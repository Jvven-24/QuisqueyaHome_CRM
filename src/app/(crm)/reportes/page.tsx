import { consultarReportesBi } from "@/application/reportes/consultas";
import { can } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { reportesRepositorio } from "@/infrastructure/contenedor/reportes";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { leerFiltros, type FilterParams } from "./filtros";
import { ReportesVista } from "./vista";
export const metadata = { title: "Reportes · CRM Quisqueya Home" };
export default async function ReportesPage({ searchParams }: { searchParams: Promise<FilterParams> }) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "reports", "view");
  const params = await searchParams;
  const metricas = await consultarReportesBi(reportesRepositorio(), actor, scope, leerFiltros(params));
  return <ReportesVista metricas={metricas} canExport={can(actor, "reports", "export")} periodo={typeof params.periodo === "string" ? params.periodo : "todo"} />;
}

