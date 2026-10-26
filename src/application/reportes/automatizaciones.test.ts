import assert from "node:assert/strict";
import { test } from "node:test";
import { PLANTILLAS_FLUJO, resumenCalidad, validarFlujo } from "./automatizaciones.ts";
test("borrador de flujo valida contrato y no acepta acciones ni disparadores arbitrarios", () => {
  assert.equal(validarFlujo(PLANTILLAS_FLUJO[0]).ok, true);
  for (const cambio of [{ nombre: " " }, { disparador: "sql-libre" }, { condicion: "" }, { acciones: [] }, { acciones: ["enviar-sin-revision"] }]) assert.equal(validarFlujo({ ...PLANTILLAS_FLUJO[0], ...cambio }).ok, false);
});
test("calidad diferencia cero medido de métricas que no se consultaron", () => {
  const r = resumenCalidad(0, 3);
  assert.equal(r[0]!.valor, 0);
  assert.equal(r[1]!.valor, 3);
  assert.equal(r[2]!.valor, null);
  assert.equal(r[3]!.valor, null);
});
