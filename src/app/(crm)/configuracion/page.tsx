/**
 * M13 · Configuración — carpeta de ruta creada por T7. Datos reales en F2.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Sin permiso responde 403, no 500. El JSX visual vive en
 * `./vista.tsx` (cliente), portado del prototipo con datos de muestra — la
 * tabla de permisos es una maqueta visual, no autoriza nada (el permiso real
 * lo decide `src/domain/rbac.ts` en servidor).
 */

import { requireScopeInPage } from "@/infrastructure/page-guard";
import { requireActor } from "@/infrastructure/auth/actor";
import { ConfiguracionVista } from "./vista";

export const metadata = { title: "Configuración · CRM Quisqueya Home" };

export default async function ConfiguracionPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "settings", "view");

  return <ConfiguracionVista />;
}
