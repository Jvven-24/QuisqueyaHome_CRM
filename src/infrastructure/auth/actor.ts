/**
 * Puente entre Supabase Auth y el CRM (T2 → T3).
 *
 * Supabase autentica contra `auth.users`, que solo sabe de correos y
 * contraseñas. El CRM necesita el rol y sus permisos para decidir cualquier
 * cosa. Aquí se cruzan las dos cosas, una vez por petición.
 */

import { and, eq, inArray, isNull, or, type SQL } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { ForbiddenError, UnauthorizedError } from "@/domain/errors";
import { effectivePermissions, viewAsBroker, type Actor, type Permission } from "@/domain/rbac";
import { getDb } from "../db/client";
import { managerScopes, permissions, roles, teamMembers, teams, userPermissionOverrides, users } from "../db/schema";
import { evaluationLoginAllowed } from "../env";
import { serverClient } from "./supabase";
import { hasSupabaseSessionCookie } from "./session-cookie";

/**
 * El actor de la petición actual, o `null` si no hay sesión utilizable.
 *
 * `cache` de React deduplica: el layout, la página y tres componentes pueden
 * pedirlo y solo se consulta una vez.
 *
 * Existir en Supabase Auth no basta. Si no hay fila en `users`, o está inactiva,
 * o está en la papelera, el resultado es `null` — sin sesión utilizable. Alguien
 * dado de baja en el CRM no entra por conservar su credencial de Supabase.
 */
export const getAuthenticatedActor = cache(async (): Promise<Actor | null> => {
  const cookieStore = await cookies().catch(() => null);
  const requestHeaders = await headers().catch(() => null);
  if (cookieStore && evaluationLoginAllowed(requestHeaders?.get("host") ?? null)
      && !hasSupabaseSessionCookie(cookieStore.getAll())) {
    const devRole = cookieStore.get("qh_dev_role")?.value ?? "admin";
    return devRole ? getEvaluationActor(devRole) : null;
  }

  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return actorFor(eq(users.authUserId, user.id));
});

/** Rol y usuario reales: nunca inventar identidad ni conceder permisos extra. */
export async function getEvaluationActor(roleSlug: string): Promise<Actor | null> {
  const requestHeaders = await headers();
  if (!evaluationLoginAllowed(requestHeaders.get("host"))) return null;

  const [candidate] = await getDb()
    .select({ userId: users.id })
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .where(and(eq(roles.slug, roleSlug), eq(users.isActive, true), isNull(users.deletedAt)))
    .orderBy(users.id)
    .limit(1);
  return candidate ? actorFor(eq(users.id, candidate.userId)) : null;
}

async function actorFor(identity: SQL): Promise<Actor | null> {
  const rows = await getDb()
    .select({
      userId: users.id,
      roleSlug: roles.slug,
      isProtected: roles.isProtected,
      resource: permissions.resource,
      action: permissions.action,
      scope: permissions.scope,
    })
    .from(users)
    .innerJoin(roles, eq(roles.id, users.roleId))
    .leftJoin(permissions, eq(permissions.roleId, users.roleId))
    .where(
      and(
        identity,
        eq(users.isActive, true),
        eq(roles.isActive, true),
        isNull(users.deletedAt),
      ),
    );

  const first = rows[0];
  if (!first) return null;

  const granted: Permission[] = rows
    .filter((r) => r.resource !== null && r.action !== null && r.scope !== null)
    .map((r) => ({
      resource: r.resource!,
      action: r.action!,
      scope: r.scope!,
    }));

  const overrides = await getDb().select({ resource: userPermissionOverrides.resource, action: userPermissionOverrides.action, scope: userPermissionOverrides.scope })
    .from(userPermissionOverrides).where(eq(userPermissionOverrides.userId, first.userId));
  const supervised = await getDb().select({ id: teams.id }).from(teams)
    .leftJoin(managerScopes, eq(managerScopes.teamId, teams.id))
    .where(and(eq(teams.isActive, true), or(eq(teams.leaderId, first.userId), eq(managerScopes.managerId, first.userId))));
  const members = supervised.length ? await getDb().select({ userId: users.id }).from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId))
    .where(and(inArray(teamMembers.teamId, supervised.map(t => t.id)), eq(users.isActive, true), isNull(users.deletedAt))) : [];
  return {
    userId: first.userId,
    roleSlug: first.roleSlug,
    permissions: effectivePermissions(granted, overrides, first.isProtected || first.roleSlug === "admin"),
    teamUserIds: [...new Set(members.map(m => m.userId))],
  };
}

/** El actor, o 401. Es lo que llama todo caso de uso que exige sesión. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw new UnauthorizedError();
  return actor;
}


/** Se revalida identidad, rol, actividad y equipos en cada petición; la cookie solo indica intención. */
export async function brokerPreview(operator: Actor, brokerId: number): Promise<Actor> {
  const broker = await actorFor(eq(users.id, brokerId));
  if (!broker) throw new ForbiddenError("El broker no está disponible.");
  const [row] = await getDb().select({ name: users.fullName }).from(users).where(eq(users.id, brokerId));
  return viewAsBroker(operator, broker, row?.name ?? "Broker");
}

export const getActor = cache(async (): Promise<Actor | null> => {
  const operator = await getAuthenticatedActor();
  if (!operator) return null;
  const store = await cookies();
  const requested = store.get("qh_view_as")?.value;
  if (requested === undefined) return operator;
  const brokerId = Number(requested);
  try {
    if (!Number.isSafeInteger(brokerId) || brokerId <= 0 || brokerId > 2147483647) throw new ForbiddenError("Vista inválida.");
    return await brokerPreview(operator, brokerId);
  } catch (error) {
    if (!(error instanceof ForbiddenError)) throw error;
    // Una asignación revocada no deja una sesión atrapada ni devuelve la cartera del broker.
    return { ...operator, permissions: operator.permissions.filter(p => p.action === "view"), readOnly: true,
      viewingAs: { operatorId: operator.userId, brokerName: "Vista caducada: sal para continuar" } };
  }
});
