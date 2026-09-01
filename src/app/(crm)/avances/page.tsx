/**
 * M6 · Avances de obra — carpeta de ruta creada por T7. La vista se construye en F3.
 *
 * Este archivo es la plantilla del patrón de lectura: componente de servidor,
 * actor resuelto una vez, permiso comprobado en servidor antes de consultar
 * nada. Sin permiso responde 403, no 500. El listado real filtra por el `scope`
 * que devuelve `requireScopeInPage` usando `visibleRows` — no con un `WHERE`
 * escrito a mano (§18.1).
 */

import { requireScopeInPage } from "@/infrastructure/page-guard";
import { requireActor } from "@/infrastructure/auth/actor";

export const metadata = { title: "Avances de obra · CRM Quisqueya Home" };

export default async function AvancesdeobraPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "construction_phases", "view");

  return (
    <section>
      <h1>Avances de obra</h1>
      <p>Módulo M6. Pendiente de construir en F3.</p>
    </section>
  );
}
