/**
 * M2 · Leads — conversión transaccional a negocio (`docs/F1_ANALISIS_Y_PLAN.md`
 * paso 4). Toca dos recursos (`leads`, `deals`), así que exige permiso sobre
 * los dos antes de tocar la base — no basta con poder editar el lead si no se
 * puede crear el negocio en el que se convierte. Los pasos viven en
 * `convertirLead` (`application/leads/conversion.ts`).
 */

import { convertirLead } from "@/application/leads/conversion";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { leadsParaEscritura } from "@/infrastructure/contenedor/leads";
import { errorResponse } from "@/infrastructure/http";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const actor = await requireActor();
    // La conversión escribe en los dos recursos: sin permiso sobre alguno de
    // los dos, no se empieza — mejor un 403 antes que un negocio a medio crear.
    const scopeLeads = requireScope(actor, "leads", "edit");
    requireScope(actor, "deals", "create");

    const resultado = await convertirLead(leadsParaEscritura(), actor, scopeLeads, id);

    return Response.json({ ok: true, ...resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
