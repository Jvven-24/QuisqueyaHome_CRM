/**
 * M12 · Reportes — carpeta de ruta creada por T7. La vista se construye en F4.
 *
 * Este archivo es la plantilla del patrón de lectura: componente de servidor,
 * actor resuelto una vez, permiso comprobado en servidor antes de consultar
 * nada. El listado real filtra por el `scope` que devuelve `requireScope`
 * usando `visibleRows` — no con un `WHERE` escrito a mano (§18.1).
 */

import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";

export const metadata = { title: "Reportes · CRM Quisqueya Home" };

export default async function ReportesPage() {
  const actor = await requireActor();
  requireScope(actor, "reports", "view");

  return (
    <section>
      <h1>Reportes</h1>
      <p>Módulo M12. Pendiente de construir en F4.</p>
    </section>
  );
}
