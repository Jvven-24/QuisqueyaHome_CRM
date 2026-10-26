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
import { alias } from "drizzle-orm/pg-core";
import type { Actor, PermissionScope } from "../domain/rbac.ts";
import { deals, holds, paymentPlans, payments, reservations, unitSales } from "./db/schema.ts";

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

/** EXISTS correlacionado: incluso `all` exige un negocio existente y no borrado. */
function visibleDeal(actor: Actor, scope: PermissionScope, dealId: PgColumn): SQL {
  const deal = alias(deals, "rbac_deal");
  return sql`exists (
    select 1 from ${deals} as ${sql.identifier("rbac_deal")}
    where ${deal.id} = ${dealId}
      and ${visibleRows(actor, scope, deal.brokerId, deal.deletedAt)}
  )`;
}

/**
 * Alcance M40 heredado del negocio, nunca del titular ni de la autoría.
 * El permiso de acción y, para mutar, la titularidad/concesión se exigen aparte.
 * El tercer argumento permite usar la tabla exterior con alias (reservados: rbac_*).
 */
export function visibleHolds(
  actor: Actor,
  scope: PermissionScope,
  row: { dealId: PgColumn } = holds,
): SQL {
  return visibleDeal(actor, scope, row.dealId);
}

export function visibleReservas(
  actor: Actor,
  scope: PermissionScope,
  row: { dealId: PgColumn } = reservations,
): SQL {
  return visibleDeal(actor, scope, row.dealId);
}

/** Origen exclusivo: reserva o venta legacy. Ambos/ninguno fallan cerrado. */
function visibleFinancialOrigin(
  actor: Actor,
  scope: PermissionScope,
  row: { reservationId: PgColumn; legacyUnitSaleId: PgColumn },
): SQL {
  const reservation = alias(reservations, "rbac_reservation");
  const sale = alias(unitSales, "rbac_sale");
  return sql`(
    (${row.reservationId} is not null and ${row.legacyUnitSaleId} is null
      and exists (
        select 1 from ${reservations} as ${sql.identifier("rbac_reservation")}
        where ${reservation.id} = ${row.reservationId}
          and ${visibleReservas(actor, scope, reservation)}
      ))
    or (${row.reservationId} is null and ${row.legacyUnitSaleId} is not null
      and exists (
        select 1 from ${unitSales} as ${sql.identifier("rbac_sale")}
        where ${sale.id} = ${row.legacyUnitSaleId}
          and ${visibleDeal(actor, scope, sale.dealId)}
      ))
  )`;
}

/** Usar también en el EXISTS del plan padre al leer cuotas/versiones. */
export function visiblePlanes(
  actor: Actor,
  scope: PermissionScope,
  row: { reservationId: PgColumn; legacyUnitSaleId: PgColumn } = paymentPlans,
): SQL {
  return visibleFinancialOrigin(actor, scope, row);
}

/** El pagador no concede acceso. Aplicaciones/reversos/reembolsos exigen este padre. */
export function visiblePagos(
  actor: Actor,
  scope: PermissionScope,
  row: { reservationId: PgColumn; legacyUnitSaleId: PgColumn } = payments,
): SQL {
  return visibleFinancialOrigin(actor, scope, row);
}
