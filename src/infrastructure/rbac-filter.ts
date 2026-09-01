/**
 * Aplicación del alcance de T3 en SQL.
 *
 * La decisión de si se puede y con qué alcance vive en `domain/rbac.ts`, pura.
 * Aquí solo se traduce ese alcance a una condición de Drizzle. Es el «un solo
 * lugar» de `MAPEO_FRONTEND_CRM.md` §18.1: ningún módulo escribe su propio
 * `WHERE broker_id = ?`.
 */

import { and, eq, isNull, sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { Actor, PermissionScope } from "@/domain/rbac";

/**
 * Condición que restringe un listado al alcance del actor.
 *
 * `ownerColumn` es la columna del responsable: `broker_id` en contactos, leads,
 * negocios, proyectos y unidades; `assignee_id` en actividades.
 *
 * Devuelve `undefined` cuando el alcance es `all` — no hay nada que añadir al
 * `WHERE`. Nunca se llama con `none`: eso ya lanzó 403 en `requireScope`.
 */
export function scopeCondition(
  actor: Actor,
  scope: PermissionScope,
  ownerColumn: PgColumn,
): SQL | undefined {
  switch (scope) {
    case "all":
      return undefined;
    case "own":
    case "team":
      // Ver la nota sobre `team` en `domain/rbac.ts`: sin modelo de equipos se
      // comporta como `own`, que es el lado seguro del error.
      return eq(ownerColumn, actor.userId);
    case "none":
      // Defensa en profundidad: si alguien salta `requireScope`, no filtra nada.
      return sql`false`;
  }
}

/**
 * Filtro completo de un listado: papelera + alcance.
 *
 * `deleted_at` se olvida con facilidad y su olvido no da error — solo devuelve
 * registros borrados como si existieran. Por eso va aquí y no en cada consulta.
 */
export function visibleRows(
  actor: Actor,
  scope: PermissionScope,
  ownerColumn: PgColumn,
  deletedAtColumn?: PgColumn,
): SQL | undefined {
  return and(
    deletedAtColumn ? isNull(deletedAtColumn) : undefined,
    scopeCondition(actor, scope, ownerColumn),
  );
}
