/**
 * M3b · Pipeline — cambio de etapa (`docs/F1_ANALISIS_Y_PLAN.md` paso 6,
 * `MAPEO_FRONTEND_CRM.md` §10.1 y §10.2).
 *
 * Mismo patrón que el resto: `parseInput` → `requireActor` + `requireScope` →
 * caso de uso → `errorResponse`. La resolución del `ContextoTransicion`, la
 * validación (`validarTransicion`) y el cierre de ocho pasos viven en
 * `application/pipeline/` (`cambiarEtapaDeNegocio`, `cierre.ts`).
 */

import { z } from "zod";
import { cambiarEtapaDeNegocio, type EntradaCambiarEtapa } from "@/application/pipeline/casos-de-uso";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { pipelineParaEscritura } from "@/infrastructure/contenedor/pipeline";
import { errorResponse, parseInput } from "@/infrastructure/http";

const CambiarEtapaInput = z.object({
  stageId: z.coerce.number().int().positive(),
  /** Obligatorio cuando la etapa destino es `lost` — se valida en el caso de uso, no aquí: Zod no conoce todavía el `kind` de la etapa. */
  lossReasonId: z.coerce.number().int().positive().optional(),
  lossComment: z.string().optional(),
  /** Monto final del cierre. Si no llega, se usa el que ya tenía el negocio (encargo, punto 4.1). */
  amountCents: z.coerce.number().int().nonnegative().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(CambiarEtapaInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "deals", "edit");

    const entrada: EntradaCambiarEtapa = { stageId: datos.stageId };
    if (datos.lossReasonId !== undefined) entrada.lossReasonId = datos.lossReasonId;
    if (datos.lossComment !== undefined) entrada.lossComment = datos.lossComment;
    if (datos.amountCents !== undefined) entrada.amountCents = datos.amountCents;

    const deal = await cambiarEtapaDeNegocio(pipelineParaEscritura(), actor, scope, id, entrada);

    return Response.json({ ok: true, deal });
  } catch (error) {
    return errorResponse(error);
  }
}
