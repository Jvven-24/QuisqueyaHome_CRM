import { forbidden } from "next/navigation";
import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { scopeFor } from "@/domain/rbac";
import { estadoOutbox } from "@/infrastructure/contenedor/outbox";
import { AutomatizacionesVista } from "./vista";
import { seleccionarTabAutomatizaciones } from "./_tabs";

export const metadata = { title: "Automatizaciones · CRM Quisqueya Home" };
export default async function AutomatizacionesPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  if (requireScopeInPage(actor, "settings", "view") !== "all") forbidden();
  const cola = await estadoOutbox().catch(() => null);
  const params = await searchParams;
  const tab = seleccionarTabAutomatizaciones(params.tab);
  return <AutomatizacionesVista cola={cola} puedeEditar={scopeFor(actor, "settings", "edit") === "all"} tab={tab} />;
}
