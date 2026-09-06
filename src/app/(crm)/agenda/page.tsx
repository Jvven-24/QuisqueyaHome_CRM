/**
 * M4 · Agenda — carpeta de ruta creada por T7. Datos reales en F2.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Sin permiso responde 403, no 500. El JSX visual vive en
 * `./vista.tsx` (cliente), portado del prototipo con datos de muestra hasta
 * que F2 lo conecte a `activities`.
 */

import { requireScopeInPage } from "@/infrastructure/page-guard";
import { requireActor } from "@/infrastructure/auth/actor";
import { AgendaVista } from "./vista";

export const metadata = { title: "Agenda · CRM Quisqueya Home" };

export default async function AgendaPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "activities", "view");

  return <AgendaVista />;
}
