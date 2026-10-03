/**
 * Adaptador Drizzle del repositorio genérico de Catálogos
 * (`application/catalogos/puertos.ts`). Una implementación para las dos tablas:
 * `TABLAS_CATALOGO` traduce la clave de texto (`TipoCatalogo`) a la tabla, que
 * `application/` no puede importar. El SQL está calcado del que vivía en
 * `api/catalogos/[tipo]/**`.
 *
 * El `update` arma el `set` campo por campo, nunca `...cambios`, y no incluye
 * `slug` (identidad estable).
 */

import { eq, like, or } from "drizzle-orm";
import type {
  CambiosEntradaCatalogo,
  EntradaCatalogo,
  RepositorioCatalogos,
  ReposCatalogos,
  TipoCatalogo,
} from "../../../application/catalogos/puertos";
import { leadSources, lossReasons } from "../schema";
import { auditoriaDrizzle, type Tx } from "./compartido";

const TABLAS_CATALOGO = {
  "motivos-perdida": lossReasons,
  canales: leadSources,
} as const satisfies Record<TipoCatalogo, typeof lossReasons | typeof leadSources>;

export function repositorioCatalogos(tx: Tx): RepositorioCatalogos {
  return {
    async slugsParecidos(tipo, base) {
      const tabla = TABLAS_CATALOGO[tipo];
      const filas = await tx
        .select({ slug: tabla.slug })
        .from(tabla)
        .where(or(like(tabla.slug, base), like(tabla.slug, `${base}-%`)));
      return filas.map((f) => f.slug);
    },

    async crear(tipo, datos): Promise<EntradaCatalogo> {
      const tabla = TABLAS_CATALOGO[tipo];
      const [fila] = await tx.insert(tabla).values({ slug: datos.slug, name: datos.name, position: datos.position }).returning();
      return fila!;
    },

    async buscar(tipo, id): Promise<EntradaCatalogo | undefined> {
      const tabla = TABLAS_CATALOGO[tipo];
      const [fila] = await tx.select().from(tabla).where(eq(tabla.id, id)).limit(1);
      return fila;
    },

    async actualizar(tipo, id, cambios: CambiosEntradaCatalogo): Promise<EntradaCatalogo> {
      const tabla = TABLAS_CATALOGO[tipo];
      // Asignación campo por campo, nunca `...cambios` (AGENTS.md).
      const set: { name?: string; position?: number; isActive?: boolean } = {};
      if (cambios.name !== undefined) set.name = cambios.name;
      if (cambios.position !== undefined) set.position = cambios.position;
      if (cambios.isActive !== undefined) set.isActive = cambios.isActive;
      const [fila] = await tx.update(tabla).set(set).where(eq(tabla.id, id)).returning();
      return fila!;
    },
  };
}

/** El juego transaccional: el repositorio del módulo más la auditoría, ambos ligados a `tx`. */
export function reposCatalogos(tx: Tx): ReposCatalogos {
  return { catalogos: repositorioCatalogos(tx), auditoria: auditoriaDrizzle(tx) };
}
