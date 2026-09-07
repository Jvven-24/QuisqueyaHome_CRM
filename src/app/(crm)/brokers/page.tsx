/**
 * M7 · Brokers — carpeta de ruta creada por T7. Datos reales en F3.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Sin permiso responde 403, no 500. El JSX visual vive en
 * `./vista.tsx` (cliente), portado del prototipo con datos de muestra hasta
 * que F3 lo conecte a `broker_profiles`.
 */

import { requireScopeInPage } from "@/infrastructure/page-guard";
import { requireActor } from "@/infrastructure/auth/actor";
import { BrokersVista } from "./vista";

export const metadata = { title: "Brokers · CRM Quisqueya Home" };

export default async function BrokersPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "brokers", "view");

  return <BrokersVista />;
}
