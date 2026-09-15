/**
 * M3 · Negocios — guardia compartido por `route.ts`, `propiedades/route.ts` y
 * `propiedades/[propId]/route.ts` (deuda de F1, issue #21).
 *
 * Editar el monto, la comisión o las unidades de interés después del cierre
 * desincroniza el negocio con la comisión que el cierre transaccional ya
 * generó (`etapa/_cierre.ts`, paso 6) — ese número no se recalcula solo. Un
 * negocio ganado o perdido se edita por su propia vía (reabrir la etapa,
 * nunca este formulario).
 */

import { eq } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/domain/errors";
import { reaches, type Actor, type PermissionScope } from "@/domain/rbac";
import type { Db } from "@/infrastructure/db/client";
import { deals, pipelineStages } from "@/infrastructure/db/schema";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** El negocio completo (para `auditar`) más el `kind` de su etapa actual. */
export async function negocioAbiertoVisible(tx: Tx, dealId: number, actor: Actor, scope: PermissionScope) {
  const [fila] = await tx
    .select({ deal: deals, kind: pipelineStages.kind })
    .from(deals)
    .innerJoin(pipelineStages, eq(pipelineStages.id, deals.stageId))
    .where(eq(deals.id, dealId))
    .limit(1);

  if (!fila || fila.deal.deletedAt || !reaches(actor, scope, fila.deal.brokerId)) throw new NotFoundError();
  if (fila.kind !== "open") throw new ConflictError("Este negocio ya está cerrado; no se puede editar.");

  return fila.deal;
}
