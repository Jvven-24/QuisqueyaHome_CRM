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
  teamUserIds?: readonly number[];
  readOnly?: boolean;
  visibilityOwnerIds?: readonly number[];
  viewingAs?: { operatorId: number; brokerName: string };
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
  if (actor.readOnly && action !== "view") return "none";
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
  if (actor.visibilityOwnerIds && (ownerId == null || !actor.visibilityOwnerIds.includes(ownerId))) return false;
  switch (scope) {
    case "all":
      return true;
    case "own":
      return ownerId != null && ownerId === actor.userId;
    case "team":
      return ownerId != null && (ownerId === actor.userId || (actor.teamUserIds ?? []).includes(ownerId));
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

/** Único algoritmo de precedencia; un override none también reemplaza el rol. */
export function effectivePermissions(role: readonly Permission[], overrides: readonly Permission[], protectedAdmin: boolean): Permission[] {
  const cells = new Map(role.map(p => [`${p.resource}:${p.action}`, p]));
  if (!protectedAdmin) for (const p of overrides) cells.set(`${p.resource}:${p.action}`, p);
  return [...cells.values()];
}

/** Solo una identidad administrativa real puede iniciar una vista de broker. */
export function viewAsBroker(operator: Actor, broker: Actor, brokerName: string): Actor {
  if (operator.readOnly || !["admin", "manager"].includes(operator.roleSlug) || broker.roleSlug !== "broker") {
    throw new ForbiddenError("No puedes consultar como este broker.");
  }
  const brokerScope = requireScope(operator, "brokers", "view");
  if (brokerScope === "own" && operator.userId !== broker.userId) throw new ForbiddenError("No puedes consultar otros brokers.");
  if (operator.roleSlug === "manager" && !reaches(operator, "team", broker.userId)) {
    throw new ForbiddenError("El broker no pertenece a tus equipos.");
  }
  return {
    ...broker,
    permissions: broker.permissions.filter(p => p.action === "view" && (operator.roleSlug === "admin" || ["team", "all"].includes(scopeFor(operator, p.resource, "view")))),
    readOnly: true,
    viewingAs: { operatorId: operator.userId, brokerName },
    ...(operator.roleSlug === "manager" ? { visibilityOwnerIds: [operator.userId, ...(operator.teamUserIds ?? [])] } : {}),
  };
}

/** Incluye lecturas con efectos secundarios (OAuth) y descargas que usan view. */
export function previewRequestAllowed(method: string, pathname: string): boolean {
  if (pathname === "/api/ver-como") return true;
  if (!["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) return false;
  return !/^\/api\/(?:integraciones\/google\/(?:conectar|callback)|actividades\/ics)(?:\/|$)/.test(pathname)
    && !/^\/api\/.*\/(?:export|exportar)(?:\/|$)/.test(pathname);
}
