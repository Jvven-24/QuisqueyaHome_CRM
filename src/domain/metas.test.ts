/**
 * Pruebas de M8 · Metas. Sin base de datos, sin framework: `npm test` las
 * corre con el runner de Node.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { cumplimientoPorcentaje, esMetaCumplida, formatoPeriodo, parsearPeriodo } from "./metas.ts";

test("parsearPeriodo con ?periodo= válido usa ese año y mes", () => {
  assert.deepEqual(parsearPeriodo("2026-03"), { year: 2026, month: 3 });
});

test("parsearPeriodo sin parámetro cae al mes actual en Santo Domingo", () => {
  // Mediodía UTC del 15 de septiembre: en Santo Domingo (UTC-4) sigue siendo
  // el mismo día, así que no hay ambigüedad de zona horaria en la prueba.
  const ahora = new Date("2026-09-15T12:00:00Z");
  assert.deepEqual(parsearPeriodo(undefined, ahora), { year: 2026, month: 9 });
});

test("parsearPeriodo ignora un valor con formato inválido y usa el mes actual", () => {
  const ahora = new Date("2026-09-15T12:00:00Z");
  assert.deepEqual(parsearPeriodo("no-es-un-periodo", ahora), { year: 2026, month: 9 });
});

test("parsearPeriodo rechaza un mes fuera de 1-12 y usa el mes actual", () => {
  const ahora = new Date("2026-09-15T12:00:00Z");
  assert.deepEqual(parsearPeriodo("2026-13", ahora), { year: 2026, month: 9 });
});

test("formatoPeriodo rellena el mes con cero a la izquierda", () => {
  assert.equal(formatoPeriodo({ year: 2026, month: 3 }), "2026-03");
  assert.equal(formatoPeriodo({ year: 2026, month: 11 }), "2026-11");
});

test("cumplimientoPorcentaje con meta en 0 no divide entre cero: sin meta fijada", () => {
  assert.equal(cumplimientoPorcentaje(0, 0), null);
  assert.equal(cumplimientoPorcentaje(5, 0), null);
});

test("cumplimientoPorcentaje redondea al entero más cercano", () => {
  assert.equal(cumplimientoPorcentaje(2, 4), 50);
  assert.equal(cumplimientoPorcentaje(5, 6), 83);
});

test("esMetaCumplida es falso sin meta fijada, aunque haya negocios logrados", () => {
  assert.equal(esMetaCumplida(3, 0), false);
});

test("esMetaCumplida es verdadero al alcanzar o superar la meta", () => {
  assert.equal(esMetaCumplida(4, 4), true);
  assert.equal(esMetaCumplida(5, 4), true);
  assert.equal(esMetaCumplida(3, 4), false);
});
