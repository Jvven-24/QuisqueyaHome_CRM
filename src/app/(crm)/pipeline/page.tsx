/**
 * M3 · Pipeline — carpeta de ruta creada por T7. Datos reales en F1.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Sin permiso responde 403, no 500. El JSX visual vive en
 * `./vista.tsx` (cliente), portado del prototipo con datos de muestra — el
 * listado real filtrará por el `scope` que devuelve `requireScopeInPage`
 * usando `visibleRows`, no con un `WHERE` escrito a mano (§18.1), cuando M3
 * entre en construcción.
 */

import { requireScopeInPage } from "@/infrastructure/page-guard";
import { requireActor } from "@/infrastructure/auth/actor";
import { PipelineVista } from "./vista";

export const metadata = { title: "Pipeline · CRM Quisqueya Home" };

export default async function PipelinePage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "deals", "view");

  return <PipelineVista roleSlug={actor.roleSlug} />;
}
