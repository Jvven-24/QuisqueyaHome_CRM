/**
 * M10 · Academy — carpeta de ruta creada por T7. Datos reales en F4.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Sin permiso responde 403, no 500. El JSX visual vive en
 * `./vista.tsx` (cliente), portado del prototipo con datos de muestra hasta
 * que F4 lo conecte a progreso real.
 */

import { requireScopeInPage } from "@/infrastructure/page-guard";
import { requireActor } from "@/infrastructure/auth/actor";
import { AcademyVista } from "./vista";

export const metadata = { title: "Academy · CRM Quisqueya Home" };

export default async function AcademyPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "academy", "view");

  return <AcademyVista />;
}
