/**
 * Adaptador Drizzle del repositorio genérico de Papelera
 * (`application/papelera/puertos.ts`). Una implementación para las seis tablas
 * con borrado lógico: `TABLAS_PAPELERA` traduce la clave de texto
 * (`EntidadPapelera`) a la tabla, que `application/` no puede importar. El SQL
 * está calcado del que vivía en `api/papelera/restaurar/route.ts`.
 *
 * `restaurar` escribe SOLO `deletedAt = null`.
 */

import { eq } from "drizzle-orm";
import type { EntidadPapelera, FilaPapelera, RepositorioPapelera, ReposPapelera } from "../../../application/papelera/puertos";
import { contacts, deals, leads, projects, units, users } from "../schema";
import { auditoriaDrizzle, type Tx } from "./compartido";

const TABLAS_PAPELERA = {
  contact: contacts,
  lead: leads,
  deal: deals,
  project: projects,
  unit: units,
  user: users,
} as const satisfies Record<EntidadPapelera, unknown>;

export function repositorioPapelera(tx: Tx): RepositorioPapelera {
  return {
    async buscar(entidad, id): Promise<FilaPapelera | undefined> {
      const tabla = TABLAS_PAPELERA[entidad];
      const [fila] = await tx.select().from(tabla).where(eq(tabla.id, id)).limit(1);
      return fila;
    },

    async restaurar(entidad, id): Promise<FilaPapelera> {
      const tabla = TABLAS_PAPELERA[entidad];
      const [fila] = await tx.update(tabla).set({ deletedAt: null }).where(eq(tabla.id, id)).returning();
      return fila!;
    },
  };
}

/** El juego transaccional: el repositorio del módulo más la auditoría, ambos ligados a `tx`. */
export function reposPapelera(tx: Tx): ReposPapelera {
  return { papelera: repositorioPapelera(tx), auditoria: auditoriaDrizzle(tx) };
}
