/**
 * M12 · Reportes y Business Intelligence.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Conectado a agregaciones SQL reales de la base de datos a través
 * de la arquitectura limpia de Viltrum Agentic OS.
 */

import { consultarReportesBi } from "@/application/reportes/consultas";
import { requireActor } from "@/infrastructure/auth/actor";
import { reportesRepositorio } from "@/infrastructure/contenedor/reportes";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { ReportesVista } from "./vista";

export const metadata = { title: "Reportes · CRM Quisqueya Home" };

export default async function ReportesPage() {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "reports", "view");

  const metricas = await consultarReportesBi(reportesRepositorio(), actor.userId, scope);

  return <ReportesVista metricas={metricas} />;
}
