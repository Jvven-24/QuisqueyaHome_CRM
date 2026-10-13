/**
 * M3 · Negocios — edición (deuda de F1, issue #21). El pendiente que
 * `docs/F1_ANALISIS_Y_PLAN.md` §10 dejó anotado: sin esto, un negocio no
 * podía cumplir por su cuenta los requisitos de §10.1 para → Negociación
 * (monto, probabilidad, comisión, fecha estimada) desde la interfaz — solo
 * existía el cambio de etapa (`api/pipeline/[id]/etapa/route.ts`).
 *
 * Mismo patrón que `api/contactos/[id]/route.ts`. No toca `stageId`,
 * `brokerId` ni los campos de cierre/pérdida — esos ya tienen su propia ruta
 * (`etapa/route.ts`), con sus propias validaciones de `validarTransicion`.
 */

import { editarNegocioSchema } from "@/application/pipeline/entrada";
import { dtoMutacionNegocio } from "@/application/pipeline/dto";
import { editarNegocio, type EntradaEditarNegocio } from "@/application/pipeline/casos-de-uso";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { pipelineParaEscritura } from "@/infrastructure/contenedor/pipeline";
import { errorResponse, parseInput, vaciosANull } from "@/infrastructure/http";


export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0 || id > 2147483647) throw new NotFoundError();

    const datos = parseInput(
      editarNegocioSchema,
      vaciosANull(await request.json().catch(() => ({})), [
        "amountCents",
        "probability",
        "commissionBasisPoints",
        "expectedCloseDate",
      ]),
    );
    const actor = await requireActor();
    const scope = requireScope(actor, "deals", "edit");

    // Se copian solo las claves PRESENTES en `datos`, nunca `...datos`: para el
    // caso de uso `null` borra el campo y ausente lo deja igual.
    const entrada: EntradaEditarNegocio = {};
    if ("amountCents" in datos) entrada.amountCents = datos.amountCents;
    if ("probability" in datos) entrada.probability = datos.probability;
    if ("commissionBasisPoints" in datos) entrada.commissionBasisPoints = datos.commissionBasisPoints;
    if ("expectedCloseDate" in datos) entrada.expectedCloseDate = datos.expectedCloseDate;

    const negocio = await editarNegocio(pipelineParaEscritura(), actor, scope, id, entrada);

    return Response.json({ ok: true, negocio: dtoMutacionNegocio(actor, negocio) });
  } catch (error) {
    return errorResponse(error);
  }
}
