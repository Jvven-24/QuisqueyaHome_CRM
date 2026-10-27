import assert from "node:assert/strict";
import { test } from "node:test";
import { ForbiddenError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { EquipoInput, OverrideInput, requirePermissionAdministrator, validateOverrideTarget, validateTeamUsers, type PermissionUser } from "./administracion.ts";
const person: PermissionUser = { id: 7, fullName: "Broker", roleId: 2, roleSlug: "broker", isProtected: false };
const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [{ resource: "settings", action: "edit", scope: "all" }] };

test("administrar excepciones requiere admin real y alcance total", () => {
  assert.doesNotThrow(() => requirePermissionAdministrator(admin));
  for (const roleSlug of ["broker", "manager", "assistant"]) assert.throws(() => requirePermissionAdministrator({ ...admin, roleSlug }), ForbiddenError);
  assert.throws(() => requirePermissionAdministrator({ ...admin, readOnly: true }), ForbiddenError);
  for (const scope of ["own", "team", "none"] as const) assert.throws(() => requirePermissionAdministrator({ ...admin, permissions: [{ resource: "settings", action: "edit", scope }] }), ForbiddenError);
});

test("admin protegido rechaza override y reset; usuario inexistente tampoco se modifica", () => {
  assert.doesNotThrow(() => validateOverrideTarget(person));
  assert.throws(() => validateOverrideTarget({ ...person, roleSlug: "admin" }), ForbiddenError);
  assert.throws(() => validateOverrideTarget({ ...person, isProtected: true }), ForbiddenError);
  assert.throws(() => validateOverrideTarget(undefined), NotFoundError);
});

test("override valida recurso, acción, denegación explícita, motivo y restablecimiento", () => {
  for (const scope of ["none", "own", "team", "all", null]) assert.equal(OverrideInput.parse({ resource: "leads", action: "view", scope, reason: " Ajuste aprobado " }).reason, "Ajuste aprobado");
  for (const change of [{ resource: "secreto" }, { action: "assign" }, { scope: "super" }, { reason: " " }, { grantedBy: 999 }]) {
    assert.equal(OverrideInput.safeParse({ resource: "leads", action: "view", scope: "all", reason: "Ajuste", ...change }).success, false);
  }
});

test("equipos rechazan duplicados, usuarios inactivos e intento de hacer supervisor a un broker", () => {
  assert.equal(EquipoInput.safeParse({ leaderId: null, memberIds: [7, 7], supervisorIds: [] }).success, false);
  const change = { leaderId: 7, memberIds: [7], supervisorIds: [8] };
  assert.throws(() => validateTeamUsers(change, [person]), ValidationError);
  assert.throws(() => validateTeamUsers({ ...change, supervisorIds: [7] }, [person]), ValidationError);
  assert.doesNotThrow(() => validateTeamUsers(change, [person, { ...person, id: 8, roleSlug: "manager" }]));
});
