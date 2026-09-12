/**
 * Pruebas de la conversión a America/Santo_Domingo (issue #24). Sin base de
 * datos, sin framework — `npm test` las corre con el runner de Node, igual
 * que `telefono.test.ts`.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { fechaSantoDomingo } from "./zona-horaria.ts";

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
