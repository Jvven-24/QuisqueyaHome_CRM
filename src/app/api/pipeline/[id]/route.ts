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

import { eq } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { deals } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { negocioAbiertoVisible } from "./_negocio-abierto";

const EditarNegocioInput = z.object({
  amountCents: z.union([z.coerce.number().int().nonnegative(), z.null()]).optional(),
  probability: z.union([z.coerce.number().int().min(0).max(100), z.null()]).optional(),
  commissionBasisPoints: z.union([z.coerce.number().int().min(0).max(10000), z.null()]).optional(),
  expectedCloseDate: z.string().nullable().optional(),
});

function vaciosANull(cuerpo: unknown): unknown {
  if (typeof cuerpo !== "object" || cuerpo === null) return cuerpo;
  const copia: Record<string, unknown> = { ...(cuerpo as Record<string, unknown>) };
  for (const campo of ["amountCents", "probability", "commissionBasisPoints", "expectedCloseDate"]) {
    if (copia[campo] === "") copia[campo] = null;
  }
  return copia;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(EditarNegocioInput, vaciosANull(await request.json().catch(() => ({}))));
    const actor = await requireActor();
    const scope = requireScope(actor, "deals", "edit");

    const negocio = await transaction(async (tx) => {
      const anterior = await negocioAbiertoVisible(tx, id, actor, scope);

      const cambios: Partial<typeof deals.$inferInsert> = { updatedBy: actor.userId };
      if ("amountCents" in datos) cambios.amountCents = datos.amountCents;
      if ("probability" in datos) cambios.probability = datos.probability;
      if ("commissionBasisPoints" in datos) cambios.commissionBasisPoints = datos.commissionBasisPoints;
      if ("expectedCloseDate" in datos) cambios.expectedCloseDate = datos.expectedCloseDate;

      const [fila] = await tx.update(deals).set(cambios).where(eq(deals.id, id)).returning();

      await auditar(tx, actor, { accion: "editar", entidad: "deal", entidadId: id, antes: anterior, despues: fila });

      return fila;
    });

    return Response.json({ ok: true, negocio });
  } catch (error) {
    return errorResponse(error);
  }
}
