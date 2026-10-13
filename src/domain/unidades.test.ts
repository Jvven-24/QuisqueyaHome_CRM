import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizarCodigoUnidad } from "./unidades.ts";

test("S-303-N: Unicode, acentos, separadores y espacios comparten identidad", () => {
  for (const code of [" a 101 ", "a_101", "A–101", "á—101", "A‐101", "A‑101", "A−101", "Ａ １０１", "a\t__--101", "a\u0301 101"]) {
    assert.equal(normalizarCodigoUnidad(code), "A-101", code);
  }
  assert.equal(normalizarCodigoUnidad("Torre   Ñ  01"), "TORRE-N-01");
  assert.equal(normalizarCodigoUnidad(normalizarCodigoUnidad("á—101")), "A-101");
  for (const code of ["", "   ", "\t\n", "\u0301"]) assert.throws(() => normalizarCodigoUnidad(code), { name: "ValidationError" });
});
