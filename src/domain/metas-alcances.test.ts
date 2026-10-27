import assert from "node:assert/strict";
import { test } from "node:test";
import {
  agruparLogroPorMoneda,
  cumplimientoMonto,
  estadoAvance,
  leerConfigAtribucion,
  logradoEnMoneda,
  siguienteVersion,
  slugEquipo,
} from "./metas-alcances.ts";

test("agrupa por moneda sin mezclar USD y DOP, en orden USD, DOP", () => {
  const d = agruparLogroPorMoneda([
    { currency: "DOP", amountCents: 100 },
    { currency: "USD", amountCents: 500 },
    { currency: "USD", amountCents: 250 },
    { currency: "usd", amountCents: null },
  ]);
  assert.deepEqual(d, [
    { currency: "USD", deals: 3, amountCents: 750 },
    { currency: "DOP", deals: 1, amountCents: 100 },
  ]);
  assert.equal(logradoEnMoneda(d, "DOP"), 100);
  assert.equal(logradoEnMoneda(d, "EUR"), 0);
});

test("sin negocios no hay desglose", () => {
  assert.deepEqual(agruparLogroPorMoneda([]), []);
});

test("cumplimiento de monto: null sin objetivo, redondeado con objetivo", () => {
  assert.equal(cumplimientoMonto(10, null), null);
  assert.equal(cumplimientoMonto(10, 0), null);
  assert.equal(cumplimientoMonto(1, 3), 33);
  assert.equal(cumplimientoMonto(5, 4), 125);
});

test("estado del avance", () => {
  assert.equal(estadoAvance(3, 0), "sin_meta");
  assert.equal(estadoAvance(2, 3), "en_curso");
  assert.equal(estadoAvance(3, 3), "cumplida");
});

test("slug de equipo sin acentos ni símbolos", () => {
  assert.equal(slugEquipo("  Equipo Bávaro & Cap Cana "), "equipo-bavaro-cap-cana");
});

test("config de atribución desconocida cae a la v1 y la versión nunca se reutiliza", () => {
  assert.equal(leerConfigAtribucion(null).equipo, "equipo_del_broker_al_cierre");
  assert.equal(leerConfigAtribucion({ equipo: "sin_equipo" }).equipo, "sin_equipo");
  assert.equal(siguienteVersion([]), 1);
  assert.equal(siguienteVersion([1, 3, 2]), 4);
});
