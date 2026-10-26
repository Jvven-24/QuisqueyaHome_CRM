import { forbidden } from "next/navigation";
import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { scopeFor } from "@/domain/rbac";
import { estadoOutbox } from "@/infrastructure/contenedor/outbox";
import { AutomatizacionesVista } from "./vista";

export const metadata = { title: "Automatizaciones · CRM Quisqueya Home" };
export default async function AutomatizacionesPage() {
  const actor = await requireActor();
  if (requireScopeInPage(actor, "settings", "view") !== "all") forbidden();
  const cola = await estadoOutbox().catch(() => null);
  return <AutomatizacionesVista cola={cola} puedeEditar={scopeFor(actor, "settings", "edit") === "all"} />;
}
