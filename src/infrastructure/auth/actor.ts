/**
 * Puente entre Supabase Auth y el CRM (T2 → T3).
 *
 * Supabase autentica contra `auth.users`, que solo sabe de correos y
 * contraseñas. El CRM necesita el rol y sus permisos para decidir cualquier
 * cosa. Aquí se cruzan las dos cosas, una vez por petición.
 */

import { and, eq, inArray, isNull, ne, or, type SQL } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { UnauthorizedError } from "@/domain/errors";
import { canViewAs, effectivePermissions, type Actor, type Permission } from "@/domain/rbac";
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
export const getActor = cache(async (): Promise<Actor | null> => {
  const cookieStore = await cookies().catch(() => null);
  const requestHeaders = await headers().catch(() => null);
  if (cookieStore && evaluationLoginAllowed(requestHeaders?.get("host") ?? null)
      && !hasSupabaseSessionCookie(cookieStore.getAll())) {
    const devRole = cookieStore.get("qh_dev_role")?.value ?? "admin";
    const ev = devRole ? await getEvaluationActor(devRole) : null;
    return ev ? applyViewAs(ev, cookieStore.get(VIEW_AS_COOKIE)?.value) : null;
  }

  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const real = await actorFor(eq(users.authUserId, user.id));
  return real ? applyViewAs(real, cookieStore?.get(VIEW_AS_COOKIE)?.value) : null;
});

/** Cookie del selector "Ver como broker". Se valida en cada petición. */
export const VIEW_AS_COOKIE = "qh_view_as";

/**
 * Si hay "ver como" válido, devuelve el actor del broker en solo lectura.
 * Inválido o no autorizado → el actor real, sin escalar nada.
 */
export async function applyViewAs(real: Actor, raw: string | undefined): Promise<Actor> {
  const targetId = Number(raw);
  if (!raw || !Number.isInteger(targetId) || targetId <= 0) return real;
  const target = await actorFor(eq(users.id, targetId));
  if (!target || !canViewAs(real, target)) return real;
  return { ...target, viewAsBy: real.userId };
}

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
      roleProtected: roles.isProtected,
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

  const db = getDb();
  const overrides = first.roleProtected
    ? []
    : await db
        .select({
          resource: userPermissionOverrides.resource,
          action: userPermissionOverrides.action,
          scope: userPermissionOverrides.scope,
        })
        .from(userPermissionOverrides)
        .where(eq(userPermissionOverrides.userId, first.userId));

  // Equipos que lidera o supervisa → miembros (alcance `team` real).
  const supervisados = db
    .select({ id: managerScopes.teamId })
    .from(managerScopes)
    .where(eq(managerScopes.managerId, first.userId));
  const miembros = await db
    .select({ userId: teamMembers.userId })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(
      and(
        eq(teams.isActive, true),
        ne(teamMembers.userId, first.userId),
        or(eq(teams.leaderId, first.userId), inArray(teams.id, supervisados)),
      ),
    );

  return {
    userId: first.userId,
    roleSlug: first.roleSlug,
    permissions: effectivePermissions(granted, overrides, first.roleProtected),
    teamUserIds: [...new Set(miembros.map((m) => m.userId))],
  };
}

/** El actor, o 401. Es lo que llama todo caso de uso que exige sesión. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw new UnauthorizedError();
  return actor;
}
