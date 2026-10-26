/**
 * Puente entre Supabase Auth y el CRM (T2 → T3).
 *
 * Supabase autentica contra `auth.users`, que solo sabe de correos y
 * contraseñas. El CRM necesita el rol y sus permisos para decidir cualquier
 * cosa. Aquí se cruzan las dos cosas, una vez por petición.
 */

import { and, eq, isNull, type SQL } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { UnauthorizedError } from "@/domain/errors";
import type { Actor, Permission } from "@/domain/rbac";
import { getDb } from "../db/client";
import { permissions, roles, users } from "../db/schema";
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

  return {
    userId: first.userId,
    roleSlug: first.roleSlug,
    permissions: granted,
  };
}

/** El actor, o 401. Es lo que llama todo caso de uso que exige sesión. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw new UnauthorizedError();
  return actor;
}
