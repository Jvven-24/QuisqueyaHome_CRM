/**
 * M14 · Inicio — Dashboard Operativo de Viltrum Agentic OS.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Conectado a consultas de base de datos en tiempo real.
 */

import { consultarDashboard } from "@/application/dashboard/consultas";
import { requireActor } from "@/infrastructure/auth/actor";
import { dashboardRepositorio } from "@/infrastructure/contenedor/dashboard";
import { getDb } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { eq } from "drizzle-orm";
import { InicioVista } from "./vista";

export const metadata = { title: "Inicio · CRM Quisqueya Home" };

export default async function InicioPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "dashboard", "view");

  const [usuario] = await getDb()
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, actor.userId))
    .limit(1);

  const metricas = await consultarDashboard(
    dashboardRepositorio(),
    actor.userId,
    actor.roleSlug,
    usuario?.fullName ?? "",
  );

  return <InicioVista roleSlug={actor.roleSlug} metricas={metricas} nombre={usuario?.fullName ?? ""} />;
}
