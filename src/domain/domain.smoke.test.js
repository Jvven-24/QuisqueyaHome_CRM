import { test } from "node:test";
import assert from "node:assert/strict";

// Prueba de humo: confirma que node --test está cableado sobre src/.
// Se reemplaza por pruebas de dominio reales a partir de T1.
test("el test runner corre sobre src/", () => {
  assert.equal(1 + 1, 2);
});
