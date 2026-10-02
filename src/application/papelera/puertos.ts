/**
 * Puertos del módulo Papelera: restaurar una fila con borrado lógico.
 *
 * ## Por qué la clave es texto y no la tabla
 *
 * Seis tablas (`contacts`, `leads`, `deals`, `projects`, `units`, `users`)
 * comparten la operación «quitar la marca `deletedAt`», así que hay UN
 * repositorio genérico y UN caso de uso, no uno por tabla (decisión 2 del
 * plan). Pero `application/` no puede importar `drizzle-orm` ni el esquema
 * (`arquitectura.test.ts`), de modo que el objeto de tabla no puede viajar hasta
 * aquí. El caso de uso direcciona por una **clave de texto** (`EntidadPapelera`,
 * que además es el nombre de la entidad en la auditoría) y el adaptador
 * (`infrastructure/db/repos/papelera.ts`), que sí conoce Drizzle, la traduce a
 * la tabla. El mapa de tablas vive allí.
 *
 * La fila es genérica (`FilaPapelera`): cada tabla tiene columnas distintas y
 * la fila entera viaja en la respuesta y en `antes`/`despues` de la auditoría.
 * `restaurar` escribe SOLO `deletedAt = null`: por eso un usuario restaurado
 * vuelve como «Inactivo» (eliminar lo desactiva; restaurar solo quita la marca).
 *
 * La auditoría viaja dentro de `ReposPapelera` (ver `compartido/auditoria.ts`).
 */

import type { Auditoria } from "../compartido/auditoria.ts";

/** Unión de literales escrita a mano; es también el `entityType` del body y la entidad auditada. */
export type EntidadPapelera = "contact" | "lead" | "deal" | "project" | "unit" | "user";

/** Fila de cualquiera de las seis tablas. Se comprueba `deletedAt` en tiempo de ejecución. */
export type FilaPapelera = Record<string, unknown>;

export interface RepositorioPapelera {
  /** La fila con ese id, borrada o no. `undefined` si no existe. */
  buscar(entidad: EntidadPapelera, id: number): Promise<FilaPapelera | undefined>;
  /** Escribe solo `deletedAt = null` y devuelve la fila resultante. */
  restaurar(entidad: EntidadPapelera, id: number): Promise<FilaPapelera>;
}

export type ReposPapelera = { papelera: RepositorioPapelera; auditoria: Auditoria };
