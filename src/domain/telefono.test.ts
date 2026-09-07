/**
 * Pruebas de la normalización de teléfono (M1). Sin base de datos, sin
 * framework — `npm test` las corre con el runner de Node, igual que
 * `rbac.test.ts`.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizarTelefono } from "./telefono.ts";

test("un número de RD con guiones y espacios se normaliza a E.164", () => {
  assert.deepEqual(normalizarTelefono("809-555-0184"), {
    phone: "+18095550184",
    phoneDisplay: "809-555-0184",
  });
  assert.deepEqual(normalizarTelefono("(829) 555 0139"), {
    phone: "+18295550139",
    phoneDisplay: "(829) 555 0139",
  });
});

test("un número que ya viene en E.164 se conserva", () => {
  assert.deepEqual(normalizarTelefono("+18495550170"), {
    phone: "+18495550170",
    phoneDisplay: "+18495550170",
  });
});

test("un número que no es de RD no se normaliza, pero se conserva el texto", () => {
  // 305 es Miami, no un código de área dominicano.
  assert.deepEqual(normalizarTelefono("305-555-0100"), {
    phone: null,
    phoneDisplay: "305-555-0100",
  });
});

test("un número con menos o más dígitos de los que hacen falta no se normaliza", () => {
  assert.equal(normalizarTelefono("809-555").phone, null);
  assert.equal(normalizarTelefono("8095550184000").phone, null);
});

test("vacío, solo espacios o undefined no rompen y devuelven null en los dos campos", () => {
  assert.deepEqual(normalizarTelefono(undefined), { phone: null, phoneDisplay: null });
  assert.deepEqual(normalizarTelefono(null), { phone: null, phoneDisplay: null });
  assert.deepEqual(normalizarTelefono("   "), { phone: null, phoneDisplay: null });
});
