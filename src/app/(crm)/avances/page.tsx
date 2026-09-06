/**
 * M6 · Avances de obra — carpeta de ruta creada por T7. Datos reales en F3.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Sin permiso responde 403, no 500. El JSX visual vive en
 * `./vista.tsx` (cliente), portado del prototipo con datos de muestra hasta
 * que F3 lo conecte a `construction_phases`.
 */

import { requireScopeInPage } from "@/infrastructure/page-guard";
import { requireActor } from "@/infrastructure/auth/actor";
import { AvancesVista } from "./vista";

export const metadata = { title: "Avances de obra · CRM Quisqueya Home" };

export default async function AvancesdeobraPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "construction_phases", "view");

  return <AvancesVista />;
}
