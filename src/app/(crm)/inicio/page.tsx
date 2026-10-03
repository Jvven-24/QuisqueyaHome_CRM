/**
 * M14 · Inicio — Dashboard Operativo de Viltrum Agentic OS.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Conectado a consultas de base de datos en tiempo real.
 */

import { consultarDashboard } from "@/application/dashboard/consultas";
import { requireActor } from "@/infrastructure/auth/actor";
import { dashboardRepositorio } from "@/infrastructure/contenedor/dashboard";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { InicioVista } from "./vista";

export const metadata = { title: "Inicio · CRM Quisqueya Home" };

export default async function InicioPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "dashboard", "view");

  const metricas = await consultarDashboard(
    dashboardRepositorio(),
    actor.userId,
    actor.roleSlug,
    actor.roleSlug === "broker" ? "Yostar" : actor.roleSlug === "assistant" ? "Alexandra" : "Ismael",
  );

  return <InicioVista roleSlug={actor.roleSlug} metricas={metricas} />;
}
