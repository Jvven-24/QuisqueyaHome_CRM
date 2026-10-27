import { and, eq, isNull } from "drizzle-orm";
import { requirePermissionAdministrator, validateOverrideTarget, validateTeamUsers, type OverrideChange, type PermissionAdminData, type TeamChange } from "@/application/permisos/administracion";
import { NotFoundError } from "@/domain/errors";
import type { Actor } from "@/domain/rbac";
import { requireFullScope } from "@/domain/rbac";
import { auditar } from "@/infrastructure/audit";
import { getDb, transaction } from "../client";
import { managerScopes, permissions, roles, teamMembers, teams, userPermissionOverrides, users } from "../schema";

const userProjection = { id: users.id, fullName: users.fullName, roleId: users.roleId, roleSlug: roles.slug, isProtected: roles.isProtected };

export async function permissionAdminData(actor: Actor): Promise<PermissionAdminData> {
  requireFullScope(actor, "settings", "view");
  const db = getDb();
  const [people, roleRows, permissionRows, overrideRows, teamRows, members, supervisors] = await Promise.all([
    db.select(userProjection).from(users).innerJoin(roles, eq(roles.id, users.roleId)).where(and(eq(users.isActive, true), isNull(users.deletedAt))).orderBy(users.fullName),
    db.select({ id: roles.id, name: roles.name, slug: roles.slug, isProtected: roles.isProtected }).from(roles).where(eq(roles.isActive, true)).orderBy(roles.name),
    db.select({ roleId: permissions.roleId, resource: permissions.resource, action: permissions.action, scope: permissions.scope }).from(permissions),
    db.select({ userId: userPermissionOverrides.userId, resource: userPermissionOverrides.resource, action: userPermissionOverrides.action, scope: userPermissionOverrides.scope }).from(userPermissionOverrides),
    db.select({ id: teams.id, name: teams.name, leaderId: teams.leaderId }).from(teams).where(eq(teams.isActive, true)).orderBy(teams.name),
    db.select({ userId: teamMembers.userId, teamId: teamMembers.teamId }).from(teamMembers),
    db.select().from(managerScopes),
  ]);
  return { users: people, roles: roleRows, permissions: permissionRows, overrides: overrideRows,
    teams: teamRows.map(t => ({ ...t, memberIds: members.filter(m => m.teamId === t.id).map(m => m.userId), supervisorIds: supervisors.filter(m => m.teamId === t.id).map(m => m.managerId) })) };
}

export async function changeUserPermission(actor: Actor, userId: number, change: OverrideChange): Promise<void> {
  requirePermissionAdministrator(actor);
  await transaction(async tx => {
    // El bloqueo serializa cambios de rol y cambios de celdas del mismo usuario.
    const [target] = await tx.select(userProjection).from(users).innerJoin(roles, eq(roles.id, users.roleId))
      .where(and(eq(users.id, userId), eq(users.isActive, true), isNull(users.deletedAt))).for("update", { of: users });
    validateOverrideTarget(target);
    const cell = and(eq(userPermissionOverrides.userId, userId), eq(userPermissionOverrides.resource, change.resource), eq(userPermissionOverrides.action, change.action));
    const [before] = await tx.select().from(userPermissionOverrides).where(cell);
    if (change.scope === null) {
      await tx.delete(userPermissionOverrides).where(cell);
    } else {
      await tx.insert(userPermissionOverrides).values({ userId, resource: change.resource, action: change.action, scope: change.scope, reason: change.reason, grantedBy: actor.userId })
        .onConflictDoUpdate({ target: [userPermissionOverrides.userId, userPermissionOverrides.resource, userPermissionOverrides.action],
          set: { scope: change.scope, reason: change.reason, grantedBy: actor.userId, createdAt: new Date() } });
    }
    await auditar(tx, actor, { accion: "editar", entidad: "user", entidadId: userId, antes: before ?? null,
      despues: { resource: change.resource, action: change.action, scope: change.scope, reason: change.reason, restoredToRole: change.scope === null } });
  });
}

export async function changePermissionTeam(actor: Actor, teamId: number, change: TeamChange): Promise<void> {
  requirePermissionAdministrator(actor);
  await transaction(async tx => {
    const [team] = await tx.select().from(teams).where(and(eq(teams.id, teamId), eq(teams.isActive, true))).for("update");
    if (!team) throw new NotFoundError("El equipo no está disponible.");
    const available = await tx.select(userProjection).from(users).innerJoin(roles, eq(roles.id, users.roleId))
      .where(and(eq(users.isActive, true), isNull(users.deletedAt)));
    validateTeamUsers(change, available);
    const beforeMembers = await tx.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
    const beforeSupervisors = await tx.select().from(managerScopes).where(eq(managerScopes.teamId, teamId));
    await tx.update(teams).set({ leaderId: change.leaderId, updatedBy: actor.userId }).where(eq(teams.id, teamId));
    await tx.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
    for (const userId of change.memberIds) {
      // Un miembro pertenece a un solo equipo; el traslado conserva evidencia del origen.
      const [origin] = await tx.select().from(teamMembers).where(eq(teamMembers.userId, userId));
      await tx.insert(teamMembers).values({ teamId, userId, createdBy: actor.userId })
        .onConflictDoUpdate({ target: teamMembers.userId, set: { teamId, createdBy: actor.userId, createdAt: new Date() } });
      if (origin && origin.teamId !== teamId) await auditar(tx, actor, { accion: "asignar", entidad: "user", entidadId: userId, antes: { teamId: origin.teamId }, despues: { teamId } });
    }
    await tx.delete(managerScopes).where(eq(managerScopes.teamId, teamId));
    for (const managerId of change.supervisorIds) await tx.insert(managerScopes).values({ managerId, teamId });
    await auditar(tx, actor, { accion: "editar", entidad: "team", entidadId: teamId,
      antes: { leaderId: team.leaderId, members: beforeMembers, supervisors: beforeSupervisors },
      despues: { leaderId: change.leaderId, memberIds: change.memberIds, supervisorIds: change.supervisorIds } });
  });
}
