import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canViewAs,
  effectivePermissions,
  reaches,
  requireScope,
  scopeFor,
  type Actor,
  type Permission,
} from "./rbac.ts";

const rolBroker: Permission[] = [
  { resource: "leads", action: "view", scope: "own" },
  { resource: "projects", action: "view", scope: "own" },
];

const gerente: Actor = {
  userId: 10,
  roleSlug: "manager",
  permissions: [
    { resource: "leads", action: "view", scope: "team" },
    { resource: "leads", action: "edit", scope: "team" },
    { resource: "brokers", action: "view", scope: "team" },
  ],
  teamUserIds: [21, 22],
};

test("override sube un permiso concreto sin tocar el resto", () => {
  const p = effectivePermissions(rolBroker, [{ resource: "projects", action: "view", scope: "all" }], false);
  const a: Actor = { userId: 1, roleSlug: "broker", permissions: p };
  assert.equal(scopeFor(a, "projects", "view"), "all");
  assert.equal(scopeFor(a, "leads", "view"), "own");
});

test("override baja a none y cierra el recurso", () => {
  const p = effectivePermissions(rolBroker, [{ resource: "leads", action: "view", scope: "none" }], false);
  const a: Actor = { userId: 1, roleSlug: "broker", permissions: p };
  assert.throws(() => requireScope(a, "leads", "view"), /Sin permiso/);
});

test("el rol protegido (admin) ignora sobrescrituras", () => {
  const p = effectivePermissions(
    [{ resource: "users", action: "edit", scope: "all" }],
    [{ resource: "users", action: "edit", scope: "none" }],
    true,
  );
  assert.equal(p[0]?.scope, "all");
});

test("team alcanza a los miembros del equipo y al propio gerente, no a otros", () => {
  assert.equal(reaches(gerente, "team", 21), true);
  assert.equal(reaches(gerente, "team", 10), true);
  assert.equal(reaches(gerente, "team", 99), false);
  assert.equal(reaches(gerente, "team", null), false);
});

test("own no se amplía con teamUserIds", () => {
  assert.equal(reaches(gerente, "own", 21), false);
});

test("ver como: el gerente solo mira a su equipo", () => {
  assert.equal(canViewAs(gerente, { userId: 21, roleSlug: "broker" }), true);
  assert.equal(canViewAs(gerente, { userId: 99, roleSlug: "broker" }), false);
});

test("ver como: nadie mira como admin ni como sí mismo", () => {
  const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };
  assert.equal(canViewAs(admin, { userId: 2, roleSlug: "admin" }), false);
  assert.equal(canViewAs(admin, { userId: 1, roleSlug: "admin" }), false);
  assert.equal(canViewAs(admin, { userId: 21, roleSlug: "broker" }), true);
  assert.equal(canViewAs(gerente, { userId: 10, roleSlug: "manager" }), false);
});

test("ver como es de solo lectura aunque el broker pueda editar", () => {
  const comoBroker: Actor = {
    userId: 21,
    roleSlug: "broker",
    permissions: [
      { resource: "leads", action: "view", scope: "own" },
      { resource: "leads", action: "edit", scope: "own" },
    ],
    viewAsBy: 1,
  };
  assert.equal(requireScope(comoBroker, "leads", "view"), "own");
  assert.throws(() => requireScope(comoBroker, "leads", "edit"), /solo lectura/);
});

test("escalada: no se encadena ver como dentro de ver como", () => {
  const encadenado: Actor = { userId: 21, roleSlug: "broker", permissions: [], viewAsBy: 1 };
  assert.equal(canViewAs(encadenado, { userId: 22, roleSlug: "broker" }), false);
});

test("escalada: un broker sin equipo no puede ver como otro broker", () => {
  const broker: Actor = { userId: 21, roleSlug: "broker", permissions: [{ resource: "brokers", action: "view", scope: "own" }] };
  assert.equal(canViewAs(broker, { userId: 22, roleSlug: "broker" }), false);
});
