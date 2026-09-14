/**
 * Pruebas de la conversión a America/Santo_Domingo (issue #24). Sin base de
 * datos, sin framework — `npm test` las corre con el runner de Node, igual
 * que `telefono.test.ts`.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  fechaSantoDomingo,
  horaSantoDomingo,
  lunesDeLaSemana,
  medianocheSantoDomingo,
  sumarDias,
} from "./zona-horaria.ts";

test("las 21:00 del 31 de enero en Santo Domingo dan 2026-01-31, no 2026-02-01", () => {
  // Santo Domingo es UTC-4 todo el año (sin horario de verano): 21:00 del 31
  // de enero local son las 01:00 UTC del 1 de febrero.
  assert.equal(fechaSantoDomingo(new Date("2026-02-01T01:00:00.000Z")), "2026-01-31");
});

test("una hora que ya cae del lado de Santo Domingo no cambia de día", () => {
  // 15:00 UTC = 11:00 local, mismo día en las dos zonas.
  assert.equal(fechaSantoDomingo(new Date("2026-07-24T15:00:00.000Z")), "2026-07-24");
});

test("medianoche UTC del día 1 todavía es el día anterior en Santo Domingo", () => {
  assert.equal(fechaSantoDomingo(new Date("2026-03-01T00:00:00.000Z")), "2026-02-28");
});

test("horaSantoDomingo: las 13:00 UTC son las 9:00 locales", () => {
  assert.equal(horaSantoDomingo(new Date("2026-07-24T13:00:00.000Z")), "09:00");
});

test("medianocheSantoDomingo: la medianoche local del 24 de julio es las 4:00 UTC", () => {
  assert.equal(medianocheSantoDomingo("2026-07-24").toISOString(), "2026-07-24T04:00:00.000Z");
});

test("lunesDeLaSemana: un viernes retrocede al lunes de esa misma semana", () => {
  // 2026-07-24 es viernes.
  assert.equal(lunesDeLaSemana("2026-07-24"), "2026-07-20");
});

test("lunesDeLaSemana: un lunes se devuelve a sí mismo", () => {
  assert.equal(lunesDeLaSemana("2026-07-20"), "2026-07-20");
});

test("lunesDeLaSemana: un domingo pertenece a la semana que empezó el lunes anterior", () => {
  assert.equal(lunesDeLaSemana("2026-07-26"), "2026-07-20");
});

test("sumarDias: cruza el fin de mes", () => {
  assert.equal(sumarDias("2026-07-30", 4), "2026-08-03");
});
