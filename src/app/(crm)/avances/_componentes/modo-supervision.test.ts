import assert from "node:assert/strict";
import test from "node:test";
import { normalizarModoSupervision } from "./modo-supervision.ts";

test("acepta los modos de supervisión disponibles en la URL", () => {
  assert.equal(normalizarModoSupervision("edicion"), "edicion");
  assert.equal(normalizarModoSupervision("gantt"), "gantt");
  assert.equal(normalizarModoSupervision("comparador"), "comparador");
  assert.equal(normalizarModoSupervision("recorrido360"), "recorrido360");
});

test("usa edición como vista inicial ante pestaña ausente o inválida", () => {
  assert.equal(normalizarModoSupervision(null), "edicion");
  assert.equal(normalizarModoSupervision("otra"), "edicion");
});
