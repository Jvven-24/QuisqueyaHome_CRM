/**
 * M11 · Comunicaciones — carpeta de ruta creada por T7. Datos reales en F4.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Sin permiso responde 403, no 500. El JSX visual vive en
 * `./vista.tsx` (cliente), portado del prototipo con datos de muestra hasta
 * que F4 lo conecte a `communications`.
 */

import { requireScopeInPage } from "@/infrastructure/page-guard";
import { requireActor } from "@/infrastructure/auth/actor";
import { ComunicacionesVista } from "./vista";

export const metadata = { title: "Comunicaciones · CRM Quisqueya Home" };

export default async function ComunicacionesPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "communications", "view");

  return <ComunicacionesVista />;
}
