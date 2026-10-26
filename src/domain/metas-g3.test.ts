import assert from "node:assert/strict";
import { test } from "node:test";
import { diagnosticarRitmo } from "./metas.ts";

test("ritmo: usa el día civil indicado y considera febrero bisiesto", () => {
  const ritmo = diagnosticarRitmo({ year: 2024, month: 2 }, { targetDeals: 4, achievedDeals: 2 }, "2024-02-15");
  assert.equal(ritmo.diasMes, 29);
  assert.equal(ritmo.diasTranscurridos, 15);
  assert.equal(ritmo.diasRestantes, 14);
  assert.equal(ritmo.ritmoSemanalRequerido, 1);
});
test("ritmo: periodos futuros y pasados no dependen del reloj del navegador", () => {
  const futuro = diagnosticarRitmo({ year: 2026, month: 11 }, null, "2026-10-18");
  assert.equal(futuro.diasTranscurridos, 0);
  assert.equal(futuro.enRitmo, false);
  const pasado = diagnosticarRitmo({ year: 2026, month: 9 }, { targetDeals: 2, achievedDeals: 3 }, "2026-10-18");
  assert.equal(pasado.diasRestantes, 0);
  assert.equal(pasado.faltantes, 0);
  assert.equal(pasado.enRitmo, true);
});
