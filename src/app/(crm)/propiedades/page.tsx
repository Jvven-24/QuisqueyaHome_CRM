/**
 * M5 · Propiedades — carpeta de ruta creada por T7. Datos reales en F2.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Sin permiso responde 403, no 500. El JSX visual vive en
 * `./vista.tsx` (cliente), portado del prototipo con datos de muestra hasta
 * que F2 lo conecte a `projects`/`units`.
 */

import { requireScopeInPage } from "@/infrastructure/page-guard";
import { requireActor } from "@/infrastructure/auth/actor";
import { PropiedadesVista } from "./vista";

export const metadata = { title: "Propiedades · CRM Quisqueya Home" };

export default async function PropiedadesPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "projects", "view");

  return <PropiedadesVista roleSlug={actor.roleSlug} />;
}
