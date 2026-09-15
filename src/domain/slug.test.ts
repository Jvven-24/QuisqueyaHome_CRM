import assert from "node:assert/strict";
import { test } from "node:test";
import { slugify } from "./slug.ts";

test("minúsculas y espacios a guiones", () => {
  assert.equal(slugify("Praderas de Punta Cana"), "praderas-de-punta-cana");
});

test("quita acentos", () => {
  assert.equal(slugify("Bávaro Beach Lofts"), "bavaro-beach-lofts");
});

test("colapsa símbolos y recorta guiones en los extremos", () => {
  assert.equal(slugify("  Vista Cana — Fase 2!!  "), "vista-cana-fase-2");
});
