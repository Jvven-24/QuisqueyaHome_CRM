/**
 * Pruebas de T3. Sin base de datos, sin framework, sin dependencias:
 * `npm test` las corre con el runner de Node.
 *
 * Cubren el criterio de terminado #1 de `MAPEO_FRONTEND_CRM.md` §16 — un
 * usuario no autorizado no puede leer ni modificar datos restringidos — en la
 * capa donde se decide.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ForbiddenError } from "./errors.ts";
import {
  can,
  reaches,
  requireScope,
  scopeFor,
  stripRestrictedPrices,
  type Actor,
} from "./rbac.ts";

const admin: Actor = {
  userId: 1,
  roleSlug: "admin",
  permissions: [
    { resource: "deals", action: "view", scope: "all" },
    { resource: "unit_real_price", action: "view", scope: "all" },
  ],
};

const broker: Actor = {
  userId: 7,
  roleSlug: "broker",
  permissions: [
    { resource: "deals", action: "view", scope: "own" },
    { resource: "deals", action: "edit", scope: "own" },
  ],
};

test("sin fila de permiso el alcance es none: un recurso nuevo nace cerrado", () => {
  assert.equal(scopeFor(broker, "commissions", "view"), "none");
  assert.equal(can(broker, "commissions", "view"), false);
});

test("el permiso es por acción, no por recurso", () => {
  assert.equal(scopeFor(broker, "deals", "view"), "own");
  assert.equal(scopeFor(broker, "deals", "delete"), "none");
});

test("requireScope lanza 403 cuando no hay permiso, y devuelve el alcance cuando lo hay", () => {
  assert.throws(() => requireScope(broker, "commissions", "view"), ForbiddenError);
  assert.equal(requireScope(broker, "deals", "view"), "own");
  assert.equal(requireScope(admin, "deals", "view"), "all");
});

test("con alcance own solo se alcanzan los registros propios", () => {
  assert.equal(reaches(broker, "own", 7), true);
  assert.equal(reaches(broker, "own", 8), false);
  // Un registro sin responsable no es de nadie: no se alcanza con `own`.
  assert.equal(reaches(broker, "own", null), false);
});

test("con alcance all se alcanza cualquier registro, incluso sin responsable", () => {
  assert.equal(reaches(admin, "all", 999), true);
  assert.equal(reaches(admin, "all", null), true);
});

test("team se comporta como own mientras no exista modelo de equipos", () => {
  assert.equal(reaches(broker, "team", 7), true);
  assert.equal(reaches(broker, "team", 8), false);
});

test("con alcance none no se alcanza nada, ni el registro propio", () => {
  assert.equal(reaches(broker, "none", 7), false);
});

test("el precio real se borra en servidor si falta el permiso unit_real_price", () => {
  const unidad = { id: 3, realPriceCents: 25_000_000, internalPriceCents: 1 };

  const paraBroker = stripRestrictedPrices(broker, unidad);
  assert.equal(paraBroker.realPriceCents, null);
  assert.equal(paraBroker.internalPriceCents, null);

  const paraAdmin = stripRestrictedPrices(admin, unidad);
  assert.equal(paraAdmin.realPriceCents, 25_000_000);

  // No se muta el original: el mismo registro puede servirse a dos usuarios.
  assert.equal(unidad.realPriceCents, 25_000_000);
});
