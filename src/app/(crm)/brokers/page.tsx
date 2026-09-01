/**
 * M7 · Brokers — carpeta de ruta creada por T7. La vista se construye en F3.
 *
 * Este archivo es la plantilla del patrón de lectura: componente de servidor,
 * actor resuelto una vez, permiso comprobado en servidor antes de consultar
 * nada. Sin permiso responde 403, no 500. El listado real filtra por el `scope`
 * que devuelve `requireScopeInPage` usando `visibleRows` — no con un `WHERE`
 * escrito a mano (§18.1).
 */

import { requireScopeInPage } from "@/infrastructure/page-guard";
import { requireActor } from "@/infrastructure/auth/actor";

export const metadata = { title: "Brokers · CRM Quisqueya Home" };

export default async function BrokersPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "brokers", "view");

  return (
    <section>
      <h1>Brokers</h1>
      <p>Módulo M7. Pendiente de construir en F3.</p>
    </section>
  );
}
