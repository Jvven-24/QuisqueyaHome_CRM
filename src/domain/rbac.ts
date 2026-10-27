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
  /**
   * Miembros de los equipos que el actor lidera o supervisa (sin incluirse).
   * Es lo que da contenido real al alcance `team`. Ausente = sin equipo.
   */
  teamUserIds?: readonly number[];
  /**
   * "Ver como broker": usuario real que está mirando (admin o gerente). Cuando
   * existe, el actor es de solo lectura: cualquier acción distinta de `view`
   * se rechaza en `requireScope`, el único sitio por el que pasa toda autorización.
   */
  viewAsBy?: number;
};

/** Sobrescritura por usuario: sube o baja una celda respecto a su rol. */
export type PermissionOverride = Permission;

/**
 * Permisos efectivos: la sobrescritura del usuario gana sobre la del rol.
 * El admin protegido no admite sobrescrituras (quien las pase se ignora).
 */
export function effectivePermissions(
  rolePermissions: readonly Permission[],
  overrides: readonly PermissionOverride[],
  roleIsProtected: boolean,
): Permission[] {
  const key = (p: { resource: string; action: string }) => `${p.resource}:${p.action}`;
  const merged = new Map<string, Permission>();
  for (const p of rolePermissions) merged.set(key(p), p);
  if (!roleIsProtected) for (const o of overrides) merged.set(key(o), o);
  return [...merged.values()].filter((p) => p.scope !== "none");
}

/**
 * ¿Puede `viewer` mirar el CRM como `target`? El admin a cualquiera que no sea
 * otro admin; el gerente solo a miembros de sus equipos. Nadie a sí mismo.
 */
export function canViewAs(
  viewer: Actor,
  target: { userId: number; roleSlug: string },
): boolean {
  if (viewer.viewAsBy !== undefined) return false;
  if (target.userId === viewer.userId) return false;
  if (target.roleSlug === "admin") return false;
  if (viewer.roleSlug === "admin") return true;
  if (scopeFor(viewer, "users", "view") === "all") return true;
  return (viewer.teamUserIds ?? []).includes(target.userId) && can(viewer, "brokers", "view");
}

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
  if (actor.viewAsBy !== undefined && action !== "view") {
    throw new ForbiddenError("Modo \"ver como\": solo lectura.");
  }
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
      return ownerId != null && ownerId === actor.userId;
    case "team":
      return ownerId != null
        && (ownerId === actor.userId || (actor.teamUserIds ?? []).includes(ownerId));
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
