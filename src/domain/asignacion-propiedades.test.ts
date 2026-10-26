import assert from "node:assert/strict";
import { test } from "node:test";
import { diffAsignacion } from "./asignacion-propiedades.ts";

test("diffAsignacion no toca lo que ya estaba igual", () => {
  assert.deepEqual(diffAsignacion([1, 2], [1, 2]), { aAsignar: [], aQuitar: [] });
});

test("diffAsignacion detecta lo nuevo y lo soltado", () => {
  assert.deepEqual(diffAsignacion([1, 2], [2, 3]), { aAsignar: [3], aQuitar: [1] });
});

test("diffAsignacion vacío a vacío no hace nada", () => {
  assert.deepEqual(diffAsignacion([], []), { aAsignar: [], aQuitar: [] });
});

test("diffAsignacion desasigna todo cuando no se elige ninguno", () => {
  assert.deepEqual(diffAsignacion([1, 2, 3], []), { aAsignar: [], aQuitar: [1, 2, 3] });
});
