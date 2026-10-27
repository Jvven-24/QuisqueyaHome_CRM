import { asc, eq, or, sql } from "drizzle-orm";
import type { CambiosEtapa, Etapa, RepositorioEtapas, ReposEtapas } from "../../../application/etapas/puertos";
import { pipelineStages, deals, dealStageHistory } from "../schema";
import { auditoriaDrizzle, type Tx } from "./compartido";

export function repositorioEtapas(tx: Tx): RepositorioEtapas {
  return {
    async bloquearCatalogo() {
      // Serializa creación/reordenado incluso con catálogo vacío.
      await tx.execute(sql`select pg_advisory_xact_lock(710031)`);
    },
    async listar() { return tx.select().from(pipelineStages).orderBy(asc(pipelineStages.position), asc(pipelineStages.id)); },
    async estaEnUso(id) {
      const [actual] = await tx.select({ id: deals.id }).from(deals).where(eq(deals.stageId, id)).limit(1);
      if (actual) return true;
      const [historia] = await tx.select({ id: dealStageHistory.id }).from(dealStageHistory)
        .where(or(eq(dealStageHistory.fromStageId, id), eq(dealStageHistory.toStageId, id))).limit(1);
      return !!historia;
    },
    async crear(datos) {
      const [fila] = await tx.insert(pipelineStages).values({ slug: datos.slug, name: datos.name, position: datos.position,
        kind: datos.kind, defaultProbability: datos.defaultProbability, isActive: datos.isActive }).returning();
      return fila!;
    },
    async buscar(id): Promise<Etapa | undefined> {
      const [fila] = await tx.select().from(pipelineStages).where(eq(pipelineStages.id, id)).limit(1).for("update");
      return fila;
    },

    async actualizar(id, cambios: CambiosEtapa): Promise<Etapa> {
      // Asignación explícita campo por campo (AGENTS.md).
      const set: Partial<typeof pipelineStages.$inferInsert> = {};
      if (cambios.name !== undefined) set.name = cambios.name;
      if (cambios.kind !== undefined) set.kind = cambios.kind;
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
