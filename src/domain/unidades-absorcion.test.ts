import { test } from "node:test";
import assert from "node:assert/strict";
import { absorcionUnidades } from "./unidades.ts";
test("absorción: inventario vacío e inconsistencias nunca superan 0–100", () => {
  assert.equal(absorcionUnidades(0, 0), 0); assert.equal(absorcionUnidades(20, 17), 15);
  assert.equal(absorcionUnidades(20, -20), 100); assert.equal(absorcionUnidades(20, 40), 0);
});
