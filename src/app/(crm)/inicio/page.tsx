/**
 * M14 · Inicio — carpeta de ruta creada por T7. Datos reales en F4.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Sin permiso responde 403, no 500. El JSX visual vive en
 * `./vista.tsx` (cliente), portado de `referencia-prototipo/app/page.tsx` con
 * datos de muestra hasta que F4 lo conecte a consultas reales.
 */

import { requireScopeInPage } from "@/infrastructure/page-guard";
import { requireActor } from "@/infrastructure/auth/actor";
import { InicioVista } from "./vista";

export const metadata = { title: "Inicio · CRM Quisqueya Home" };

export default async function InicioPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "dashboard", "view");

  return <InicioVista roleSlug={actor.roleSlug} />;
}
