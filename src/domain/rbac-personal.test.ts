import assert from "node:assert/strict";
import { test } from "node:test";
import { ForbiddenError } from "./errors.ts";
import { effectivePermissions, reaches, requireScope, scopeFor, viewAsBroker, previewRequestAllowed, type Actor, type Permission } from "./rbac.ts";

const permission = (scope: Permission["scope"], resource: Permission["resource"] = "leads"): Permission => ({ resource, action: "view", scope });
const broker: Actor = { userId: 7, roleSlug: "broker", permissions: [permission("own"), { resource: "leads", action: "edit", scope: "all" }] };
const operator: Actor = { userId: 1, roleSlug: "manager", teamUserIds: [7, 8], permissions: [permission("team"), permission("team", "brokers")] };

test("overrides suben y bajan el alcance, incluido none, sin cambiar otros recursos", () => {
  for (const scope of ["none", "own", "team", "all"] as const) {
    const permissions = effectivePermissions([permission("team"), permission("own", "projects")], [permission(scope)], false);
    const actor = { ...broker, permissions };
    assert.equal(scopeFor(actor, "leads", "view"), scope);
    assert.equal(scopeFor(actor, "projects", "view"), "own");
    assert.equal(scopeFor(actor, "contacts", "view"), "none");
    assert.equal(permissions.length, 2);
  }
});

test("restablecer usa el rol actual; admin protegido ignora todas las excepciones", () => {
  assert.equal(effectivePermissions([permission("team")], [], false)[0]?.scope, "team");
  assert.deepEqual(effectivePermissions([permission("all")], [permission("none"), permission("all", "projects")], true), [permission("all")]);
});

test("team alcanza miembros liderados/supervisados y propio, nunca otro equipo ni nulos", () => {
  for (const id of [1, 7, 8]) assert.equal(reaches(operator, "team", id), true);
  for (const id of [9, null, undefined]) assert.equal(reaches(operator, "team", id), false);
  assert.equal(reaches(operator, "own", 7), false);
  assert.equal(reaches(operator, "none", 7), false);
  assert.equal(reaches({ ...operator, teamUserIds: [] }, "team", 7), false);
});

test("ver como usa la identidad del broker, bloquea cualquier mutación/exportación y preserva operador", () => {
  const preview = viewAsBroker(operator, broker, "Broker de prueba");
  assert.equal(preview.userId, 7);
  assert.equal(preview.viewingAs?.operatorId, 1);
  assert.equal(requireScope(preview, "leads", "view"), "own");
  for (const action of ["create", "edit", "delete", "import", "export"] as const) assert.throws(() => requireScope(preview, "leads", action), ForbiddenError);
  assert.equal(scopeFor(broker, "leads", "edit"), "all", "no mutar actor original");
});

test("manager no puede ver como un broker ajeno ni ampliar su perímetro mediante overrides del broker", () => {
  assert.throws(() => viewAsBroker(operator, { ...broker, userId: 9 }, "Ajeno"), ForbiddenError);
  const preview = viewAsBroker(operator, { ...broker, permissions: [permission("all"), permission("all", "unit_real_price")] }, "Asignado");
  assert.equal(reaches(preview, "all", 7), true);
  assert.equal(reaches(preview, "all", 9), false);
  assert.equal(reaches(preview, "all", null), false);
  assert.equal(scopeFor(preview, "unit_real_price", "view"), "none");
});

test("solo admin/manager reales pueden iniciar la simulación y solo sobre brokers", () => {
  assert.throws(() => viewAsBroker(broker, broker, "Propio"), ForbiddenError);
  assert.throws(() => viewAsBroker({ ...operator, readOnly: true }, broker, "Asignado"), ForbiddenError);
  assert.throws(() => viewAsBroker(operator, { ...broker, roleSlug: "admin" }, "Admin"), ForbiddenError);
  assert.throws(() => viewAsBroker({ ...operator, permissions: [] }, broker, "Asignado"), ForbiddenError);
  assert.equal(viewAsBroker({ ...operator, roleSlug: "admin" }, { ...broker, userId: 9 }, "Otro").userId, 9);
});

test("solo lectura transversal rechaza POST/PATCH/PUT/DELETE, OAuth y descargas; permite salir", () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) assert.equal(previewRequestAllowed(method, "/api/leads/7"), false);
  for (const pathname of ["/api/integraciones/google/conectar", "/api/integraciones/google/callback", "/api/actividades/ics", "/api/comisiones/export", "/api/contactos/7/exportar"]) {
    for (const method of ["GET", "HEAD"]) assert.equal(previewRequestAllowed(method, pathname), false, pathname);
  }
  assert.equal(previewRequestAllowed("GET", "/leads"), true);
  assert.equal(previewRequestAllowed("GET", "/api/notificaciones"), true);
  for (const method of ["GET", "POST", "DELETE"]) assert.equal(previewRequestAllowed(method, "/api/ver-como"), true);
});


test("una reducción personal del manager también limita ver-como", () => {
  const ownOnly = { ...operator, permissions: [permission("own"), permission("team", "brokers")] };
  assert.equal(scopeFor(viewAsBroker(ownOnly, broker, "Asignado"), "leads", "view"), "none");
  const ownBrokers = { ...operator, permissions: [permission("team"), permission("own", "brokers")] };
  assert.throws(() => viewAsBroker(ownBrokers, broker, "Asignado"), ForbiddenError);
});
