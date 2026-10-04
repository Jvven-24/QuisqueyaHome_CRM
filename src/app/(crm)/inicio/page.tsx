import { consultarDashboard } from "@/application/dashboard/consultas";
import { requireActor } from "@/infrastructure/auth/actor";
import { dashboardRepositorio } from "@/infrastructure/contenedor/dashboard";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { leerFiltros, type FilterParams } from "../reportes/filtros";
import { InicioVista } from "./vista";
export const metadata = { title: "Inicio · CRM Quisqueya Home" };
export default async function InicioPage({ searchParams }: { searchParams: Promise<FilterParams> }) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "dashboard", "view");
  const metricas = await consultarDashboard(dashboardRepositorio(), actor, scope, leerFiltros(await searchParams));
  return <InicioVista roleSlug={actor.roleSlug} metricas={metricas} nombre={metricas.nombre} />;
}

