/**
 * M3b · Pipeline — cambio de etapa (`docs/F1_ANALISIS_Y_PLAN.md` paso 6,
 * `MAPEO_FRONTEND_CRM.md` §10.1 y §10.2).
 *
 * Mismo patrón que el resto: `parseInput` → `requireActor` + `requireScope` →
 * caso de uso → `errorResponse`. La resolución del `ContextoTransicion`, la
 * validación (`validarTransicion`) y el cierre de ocho pasos viven en
 * `application/pipeline/` (`cambiarEtapaDeNegocio`, `cierre.ts`).
 */

import { cambiarEtapaSchema } from "@/application/pipeline/entrada";
import { dtoMutacionNegocio } from "@/application/pipeline/dto";
import { cambiarEtapaDeNegocio, type EntradaCambiarEtapa } from "@/application/pipeline/casos-de-uso";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { pipelineParaEscritura } from "@/infrastructure/contenedor/pipeline";
import { errorResponse, parseInput } from "@/infrastructure/http";


export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) throw new NotFoundError();

    const datos = parseInput(cambiarEtapaSchema.required({ expectedStageId: true, expectedStageChangedAt: true }), await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "deals", "edit");

    const entrada: EntradaCambiarEtapa = { stageId: datos.stageId, expectedStageId: datos.expectedStageId, expectedStageChangedAt: datos.expectedStageChangedAt };
    if (datos.lossReasonId !== undefined) entrada.lossReasonId = datos.lossReasonId;
    if (datos.lossComment !== undefined) entrada.lossComment = datos.lossComment;
    if (datos.amountCents !== undefined) entrada.amountCents = datos.amountCents;
    if (datos.unitId !== undefined) entrada.unitId = datos.unitId;
    if (datos.unitCode !== undefined) entrada.unitCode = datos.unitCode;

    const deal = await cambiarEtapaDeNegocio(pipelineParaEscritura(), actor, scope, id, entrada);

    return Response.json({ ok: true, deal: dtoMutacionNegocio(actor, deal) });
  } catch (error) {
    return errorResponse(error);
  }
}
