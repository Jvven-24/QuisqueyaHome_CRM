/**
 * M13 · Configuración — carpeta de ruta creada por T7. La vista se construye en F2.
 *
 * Este archivo es la plantilla del patrón de lectura: componente de servidor,
 * actor resuelto una vez, permiso comprobado en servidor antes de consultar
 * nada. Sin permiso responde 403, no 500. El listado real filtra por el `scope`
 * que devuelve `requireScopeInPage` usando `visibleRows` — no con un `WHERE`
 * escrito a mano (§18.1).
 */

import { requireScopeInPage } from "@/infrastructure/page-guard";
import { requireActor } from "@/infrastructure/auth/actor";

export const metadata = { title: "Configuración · CRM Quisqueya Home" };

export default async function ConfiguracionPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "settings", "view");

  return (
    <section>
      <h1>Configuración</h1>
      <p>Módulo M13. Pendiente de construir en F2.</p>
    </section>
  );
}
