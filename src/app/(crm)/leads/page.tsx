/**
 * M2 · Leads — carpeta de ruta creada por T7. La vista se construye en F1.
 *
 * Este archivo es la plantilla del patrón de lectura: componente de servidor,
 * actor resuelto una vez, permiso comprobado en servidor antes de consultar
 * nada. El listado real filtra por el `scope` que devuelve `requireScope`
 * usando `visibleRows` — no con un `WHERE` escrito a mano (§18.1).
 */

import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";

export const metadata = { title: "Leads · CRM Quisqueya Home" };

export default async function LeadsPage() {
  const actor = await requireActor();
  requireScope(actor, "leads", "view");

  return (
    <section>
      <h1>Leads</h1>
      <p>Módulo M2. Pendiente de construir en F1.</p>
    </section>
  );
}
