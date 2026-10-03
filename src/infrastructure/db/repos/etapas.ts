/**
 * Adaptador Drizzle de Etapas (`application/etapas/puertos.ts`). El SQL está
 * calcado del que vivía en `api/etapas/[id]/route.ts`.
 *
 * El `update` arma el `set` campo por campo y **no incluye `kind` ni `slug`**:
 * `kind` decide si un negocio está ganado o perdido, y cambiarlo reescribiría
 * en silencio los negocios ya cerrados. Una guarda de lectura de código
 * (`application/etapas/casos-de-uso.test.ts`) vigila que no aparezcan.
 */

import { eq } from "drizzle-orm";
import type { CambiosEtapa, Etapa, RepositorioEtapas, ReposEtapas } from "../../../application/etapas/puertos";
import { pipelineStages } from "../schema";
import { auditoriaDrizzle, type Tx } from "./compartido";

export function repositorioEtapas(tx: Tx): RepositorioEtapas {
  return {
    async buscar(id): Promise<Etapa | undefined> {
      const [fila] = await tx.select().from(pipelineStages).where(eq(pipelineStages.id, id)).limit(1);
      return fila;
    },

    async actualizar(id, cambios: CambiosEtapa): Promise<Etapa> {
      // Asignación campo por campo, nunca `...cambios` (AGENTS.md).
      const set: Partial<typeof pipelineStages.$inferInsert> = {};
      if (cambios.name !== undefined) set.name = cambios.name;
      if (cambios.position !== undefined) set.position = cambios.position;
      if ("defaultProbability" in cambios) set.defaultProbability = cambios.defaultProbability;
      if (cambios.isActive !== undefined) set.isActive = cambios.isActive;

      const [fila] = await tx.update(pipelineStages).set(set).where(eq(pipelineStages.id, id)).returning();
      return fila!;
    },
  };
}

/** El juego transaccional: el repositorio del módulo más la auditoría, ambos ligados a `tx`. */
export function reposEtapas(tx: Tx): ReposEtapas {
  return { etapas: repositorioEtapas(tx), auditoria: auditoriaDrizzle(tx) };
}
