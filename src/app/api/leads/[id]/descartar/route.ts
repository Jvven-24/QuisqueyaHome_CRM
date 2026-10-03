/**
 * M2 · Leads — descarte con motivo (`docs/F1_ANALISIS_Y_PLAN.md` paso 4).
 *
 * Ruta delgada: `discardReason` es texto obligatorio y se valida ANTES de
 * autenticar, como siempre; el permiso y el alcance se aplican aquí y el resto
 * (guardas de estado, transacción, auditoría) vive en `descartarLead`
 * (`application/leads`).
 */

import { descartarLead } from "@/application/leads/casos-de-uso";
import { NotFoundError, ValidationError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { leadsParaEscritura } from "@/infrastructure/contenedor/leads";
import { errorResponse } from "@/infrastructure/http";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const cuerpo = await request.json().catch(() => ({}));
    const discardReason =
      typeof cuerpo?.discardReason === "string" ? cuerpo.discardReason.trim() : "";
    if (!discardReason) {
      throw new ValidationError("Escribe el motivo del descarte.", {
        discardReason: "Escribe el motivo del descarte.",
      });
    }

    const actor = await requireActor();
    const scope = requireScope(actor, "leads", "edit");

    const lead = await descartarLead(leadsParaEscritura(), actor, scope, id, discardReason);

    return Response.json({ ok: true, lead });
  } catch (error) {
    return errorResponse(error);
  }
}
