/**
 * Adaptador Drizzle de Comisiones (`application/comisiones/puertos.ts`).
 *
 * El SQL está calcado del que vivía en `api/comisiones/[id]/route.ts`. Una
 * sentencia es una garantía de concurrencia y NO debe simplificarse:
 *
 * - `bloquearComision`: `SELECT ... FOR UPDATE OF commissions`. El `of` es
 *   deliberado: bloquea SOLO la fila de `commissions`, no la de `deals`. Sin
 *   bloqueo, dos aprobaciones casi simultáneas leerían ambas el estado viejo
 *   antes de decidir si la transición vale; con un `for("update")` a secas (sin
 *   `of`) se bloquearían también los negocios, creando contención sobre filas
 *   que nadie está editando. El `JOIN` a `deals` es solo para saber si el
 *   negocio se borró, y no necesita candado.
 *
 * El `update` arma el `set` campo por campo, nunca esparciendo el parámetro.
 */

import { eq } from "drizzle-orm";
import type {
  CambiosComision,
  Comision,
  ComisionBloqueada,
  RepositorioComisiones,
  ReposComisiones,
} from "../../../application/comisiones/puertos";
import { commissions, deals } from "../schema";
import { auditoriaDrizzle, type Tx } from "./compartido";

export function repositorioComisiones(tx: Tx): RepositorioComisiones {
  return {
    async bloquearComision(id): Promise<ComisionBloqueada | undefined> {
      // `for("update", { of: commissions })` bloquea solo la fila de
      // `commissions` (ver el docblock de arriba). No quites el `of`.
      const [bloqueada] = await tx
        .select({ comision: commissions, dealDeletedAt: deals.deletedAt })
        .from(commissions)
        .innerJoin(deals, eq(deals.id, commissions.dealId))
        .where(eq(commissions.id, id))
        .for("update", { of: commissions });
      return bloqueada ? { comision: bloqueada.comision, negocioBorradoEn: bloqueada.dealDeletedAt } : undefined;
    },

    async actualizar(id, cambios: CambiosComision): Promise<Comision> {
      // Asignación campo por campo, nunca `...cambios` (AGENTS.md).
      const set: Partial<typeof commissions.$inferInsert> = { updatedBy: cambios.updatedBy };
      if (cambios.status !== undefined) set.status = cambios.status;
      if (cambios.approvedBy !== undefined) set.approvedBy = cambios.approvedBy;
      if (cambios.approvedAt !== undefined) set.approvedAt = cambios.approvedAt;
      if (cambios.paidAt !== undefined) set.paidAt = cambios.paidAt;
      if (cambios.brokerShareBasisPoints !== undefined) set.brokerShareBasisPoints = cambios.brokerShareBasisPoints;
      if (cambios.agencyShareBasisPoints !== undefined) set.agencyShareBasisPoints = cambios.agencyShareBasisPoints;
      if (cambios.brokerAmountCents !== undefined) set.brokerAmountCents = cambios.brokerAmountCents;
      if (cambios.agencyAmountCents !== undefined) set.agencyAmountCents = cambios.agencyAmountCents;

      const [fila] = await tx.update(commissions).set(set).where(eq(commissions.id, id)).returning();
      return fila!;
    },
  };
}

/** El juego transaccional: el repositorio del módulo más la auditoría, ambos ligados a `tx`. */
export function reposComisiones(tx: Tx): ReposComisiones {
  return { comisiones: repositorioComisiones(tx), auditoria: auditoriaDrizzle(tx) };
}
