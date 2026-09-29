/**
 * Control de acceso basado en roles (T3) — lógica pura, sin base de datos.
 *
 * Modelo: `permissions(role_id, resource, action, scope)` con
 * `scope ∈ {none, own, team, all}` (decisión #2 de `docs/contexto/decisiones.md`).
 *
 * Dos reglas que no se negocian:
 *
 *  1. **Se decide en servidor.** Ocultar un botón no es seguridad, es maquetación
 *     (criterio de terminado #1, `MAPEO_FRONTEND_CRM.md` §16).
 *  2. **Se decide en un solo sitio.** Si cada módulo escribe su propio
 *     `WHERE broker_id = ?`, la seguridad deja de ser auditable (§18.1). Los
 *     módulos llaman a estas funciones; no reimplementan el filtro.
 *
 * Este archivo no importa nada de Next.js, Drizzle ni Supabase — se prueba
 * entero sin infraestructura, que es para lo que se eligió la arquitectura
 * hexagonal.
 */

import { ForbiddenError } from "./errors.ts";
import type {
  PermissionAction,
  PermissionResource,
  PermissionScope,
} from "./catalogs.ts";

export type { PermissionAction, PermissionResource, PermissionScope };

export type Permission = {
  resource: PermissionResource;
  action: PermissionAction;
  scope: PermissionScope;
};

/** Quién pregunta. Lo arma la capa de autenticación (T2) una vez por petición. */
export type Actor = {
  userId: number;
  roleSlug: string;
  permissions: readonly Permission[];
};

/**
 * Alcance del actor sobre un recurso y una acción.
 *
 * Ausencia de permiso equivale a `none`: se concede explícitamente o no se
 * concede. Un recurso nuevo sin fila en `permissions` queda cerrado, que es el
 * fallo correcto — al revés, un módulo nuevo nacería abierto para todos.
 */
export function scopeFor(
  actor: Actor,
  resource: PermissionResource,
  action: PermissionAction,
): PermissionScope {
  const match = actor.permissions.find(
    (p) => p.resource === resource && p.action === action,
  );
  return match?.scope ?? "none";
}

/** ¿Tiene algún alcance sobre esto? Para decidir qué se pinta, no para autorizar. */
export function can(
  actor: Actor,
  resource: PermissionResource,
  action: PermissionAction,
): boolean {
  return scopeFor(actor, resource, action) !== "none";
}

/**
 * Autoriza o lanza. Es la llamada que va al principio de cada caso de uso y de
 * cada route handler. Devuelve el alcance para que quien la llama filtre con él.
 */
export function requireScope(
  actor: Actor,
  resource: PermissionResource,
  action: PermissionAction,
): Exclude<PermissionScope, "none"> {
  const scope = scopeFor(actor, resource, action);
  if (scope === "none") {
    throw new ForbiddenError(
      `Sin permiso para ${action} sobre ${resource}.`,
    );
  }
  return scope;
}

/**
 * Autoriza solo con alcance `all`. Para recursos administrativos (`users`) que
 * no tienen responsable por fila: con `own`, un usuario "alcanzaría" su propia
 * fila y podría cambiarse el rol a sí mismo. La garantía vive aquí, no en el
 * seed.
 */
export function requireFullScope(
  actor: Actor,
  resource: PermissionResource,
  action: PermissionAction,
): void {
  if (requireScope(actor, resource, action) !== "all") {
    throw new ForbiddenError(
      `Solo un alcance total permite ${action} sobre ${resource}.`,
    );
  }
}

/**
 * ¿Alcanza este actor a un registro concreto? Para comprobaciones en memoria
 * (un registro ya cargado, un valor que se va a devolver). El filtrado de
 * listados se hace en SQL — ver `infrastructure/rbac-filter.ts` —, porque traer
 * la tabla entera para descartarla en memoria no escala ni es seguro.
 *
 * `ownerId` es el responsable del registro: `broker_id` en contactos, leads,
 * negocios, proyectos y unidades; `assignee_id` en actividades.
 */
export function reaches(
  actor: Actor,
  scope: PermissionScope,
  ownerId: number | null | undefined,
): boolean {
  switch (scope) {
    case "all":
      return true;
    case "own":
    case "team":
      // ponytail: `team` se comporta como `own` porque el esquema no tiene
      // equipos (no hay tabla de equipos ni `team_id` en `users`). Fallar hacia
      // lo restrictivo es el lado correcto del error. Cuando exista el modelo de
      // equipos, este caso se separa aquí y en `rbac-filter.ts`, y en ningún
      // otro sitio.
      return ownerId != null && ownerId === actor.userId;
    case "none":
      return false;
  }
}

/**
 * Campos restringidos por permiso, no por rol (§10.4): `units.real_price_cents`
 * y `projects.internal_price_cents` cuelgan del recurso `unit_real_price`.
 *
 * Se borran del objeto en vez de devolver el registro completo confiando en que
 * la vista no los pinte: si el dato sale del servidor, ya se filtró.
 */
export function stripRestrictedPrices<
  T extends { realPriceCents?: unknown; internalPriceCents?: unknown },
>(actor: Actor, row: T): T {
  if (can(actor, "unit_real_price", "view")) return row;
  const copy = { ...row };
  if ("realPriceCents" in copy) copy.realPriceCents = null;
  if ("internalPriceCents" in copy) copy.internalPriceCents = null;
  return copy;
}
