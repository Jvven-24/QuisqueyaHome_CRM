/**
 * Adaptador Drizzle de Metas (`application/metas/puertos.ts`).
 *
 * `fijarMetaMensual` es `INSERT ... ON CONFLICT DO UPDATE` atómico, con las dos
 * ramas: la del broker (índice `goals_broker_period_unq`) y la de la compañía
 * (índice parcial `goals_company_period_unq`, de ahí el `targetWhere`: sin él
 * Drizzle no sabría contra cuál de los dos índices resolver el conflicto).
 *
 * Invariante (decisión #35): este módulo escribe SOLO las columnas `target_*`
 * y `updated_by`. Las columnas de lo alcanzado las escribe únicamente el cierre
 * de pipeline (`repos/pipeline.ts`, `incrementarMetaAlcanzada`), con la mitad
 * opuesta. El `set` de aquí NUNCA las nombra; por eso este archivo no contiene
 * esa palabra y `api/metas/route.test.ts` lo comprueba leyendo el código.
 */

import { and, eq, isNull, sql } from "drizzle-orm";
import type { DatosMetaMensual, Meta, RepositorioMetas, ReposMetas } from "../../../application/metas/puertos";
import { brokerProfiles, goals } from "../schema";
import { auditoriaDrizzle, type Tx } from "./compartido";

export function repositorioMetas(tx: Tx): RepositorioMetas {
  return {
    async existePerfilDeBroker(brokerId): Promise<boolean> {
      const [perfil] = await tx
        .select({ userId: brokerProfiles.userId })
        .from(brokerProfiles)
        .where(eq(brokerProfiles.userId, brokerId))
        .limit(1);
      return Boolean(perfil);
    },

    async fijarMetaMensual(datos: DatosMetaMensual): Promise<{ anterior: Meta | undefined; meta: Meta }> {
      // La lectura de `anterior` es solo para la auditoría (acción y `antes`);
      // la escritura no depende de ella: es el upsert de abajo, atómico.
      const condicionPeriodo =
        datos.brokerId != null
          ? and(eq(goals.brokerId, datos.brokerId), eq(goals.year, datos.year), eq(goals.month, datos.month))
          : and(isNull(goals.brokerId), eq(goals.year, datos.year), eq(goals.month, datos.month));
      const [anterior] = await tx.select().from(goals).where(condicionPeriodo).limit(1);

      // `targetAmountCents` solo se incluye si vino: si se manda `undefined` en
      // `set`, Drizzle igual lo escribiría como NULL y borraría un monto que ya
      // existía en la fila por no venir en esta edición puntual (que solo toca
      // negocios, ver §7 de `F3_ANALISIS_Y_PLAN.md`: "la pantalla aprobada mide
      // negocios").
      const montoInput = datos.targetAmountCents !== undefined ? { targetAmountCents: datos.targetAmountCents } : {};

      const valores = {
        brokerId: datos.brokerId,
        year: datos.year,
        month: datos.month,
        targetDeals: datos.targetDeals,
        ...montoInput,
        createdBy: datos.actorId,
        updatedBy: datos.actorId,
      };
      // Solo `target_*` y `updated_by` (ver el docblock del archivo).
      const cambios = {
        targetDeals: datos.targetDeals,
        ...montoInput,
        updatedBy: datos.actorId,
      };

      const [fila] =
        datos.brokerId != null
          ? await tx
              .insert(goals)
              .values(valores)
              .onConflictDoUpdate({ target: [goals.brokerId, goals.year, goals.month], set: cambios })
              .returning()
          : await tx
              .insert(goals)
              .values(valores)
              .onConflictDoUpdate({
                target: [goals.year, goals.month],
                targetWhere: sql`${goals.brokerId} is null`,
                set: cambios,
              })
              .returning();

      return { anterior, meta: fila! };
    },
  };
}

/** El juego transaccional: el repositorio del módulo más la auditoría, ambos ligados a `tx`. */
export function reposMetas(tx: Tx): ReposMetas {
  return { metas: repositorioMetas(tx), auditoria: auditoriaDrizzle(tx) };
}
