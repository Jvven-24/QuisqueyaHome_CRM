import { z } from "zod";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES, PERMISSION_SCOPES } from "../../domain/catalogs.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import { requireFullScope, type Actor, type Permission } from "../../domain/rbac.ts";

const Id = z.number().int().positive().max(2147483647);
export const OverrideInput = z.object({
  resource: z.enum(PERMISSION_RESOURCES), action: z.enum(PERMISSION_ACTIONS),
  scope: z.enum(PERMISSION_SCOPES).nullable(),
  reason: z.string().trim().min(3).max(500),
}).strict();
export const EquipoInput = z.object({
  leaderId: Id.nullable(), memberIds: z.array(Id).max(500), supervisorIds: z.array(Id).max(100),
}).strict().refine(v => new Set(v.memberIds).size === v.memberIds.length && new Set(v.supervisorIds).size === v.supervisorIds.length, "Hay usuarios duplicados.");
export type OverrideChange = z.infer<typeof OverrideInput>;
export type TeamChange = z.infer<typeof EquipoInput>;
export type PermissionUser = { id: number; fullName: string; roleId: number; roleSlug: string; isProtected: boolean };
export type PermissionTeam = { id: number; name: string; leaderId: number | null; memberIds: number[]; supervisorIds: number[] };
export type PermissionAdminData = {
  users: PermissionUser[];
  roles: { id: number; name: string; slug: string; isProtected: boolean }[];
  permissions: (Permission & { roleId: number })[];
  overrides: (Permission & { userId: number })[];
  teams: PermissionTeam[];
};

export function requirePermissionAdministrator(actor: Actor): void {
  requireFullScope(actor, "settings", "edit");
  if (actor.roleSlug !== "admin" || actor.readOnly) throw new ForbiddenError("Solo el administrador puede gestionar permisos y equipos.");
}

export function validateOverrideTarget(user: PermissionUser | undefined): asserts user is PermissionUser {
  if (!user) throw new NotFoundError("El usuario no está disponible.");
  if (user.isProtected || user.roleSlug === "admin") throw new ForbiddenError("El administrador protegido no admite permisos personalizados.");
}

export function validateTeamUsers(change: TeamChange, available: PermissionUser[]): void {
  const byId = new Map(available.map(u => [u.id, u]));
  for (const id of [...change.memberIds, ...change.supervisorIds, ...(change.leaderId ? [change.leaderId] : [])]) {
    if (!byId.has(id)) throw new ValidationError("Un usuario seleccionado no está activo.");
  }
  if (change.supervisorIds.some(id => !["admin", "manager"].includes(byId.get(id)!.roleSlug))) {
    throw new ValidationError("Los supervisores deben ser administradores o gerentes.");
  }
}
