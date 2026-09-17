/**
 * Pruebas de M6 · Avances de obra. Sin base de datos, sin framework: `npm
 * test` las corre con el runner de Node.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { FASES_ESTANDAR, FOTO_MIME_EXTENSIONES, promedioAvance, validarFoto } from "./avance-obra.ts";

test("promedioAvance sin fases es 0, no NaN", () => {
  assert.equal(promedioAvance([]), 0);
});

test("promedioAvance redondea al entero más cercano", () => {
  assert.equal(promedioAvance([0, 100]), 50);
  assert.equal(promedioAvance([10, 20, 21]), 17);
});

test("promedioAvance con una sola fase es su propio porcentaje", () => {
  assert.equal(promedioAvance([42]), 42);
});

test("FASES_ESTANDAR trae exactamente las 8 fases del prototipo", () => {
  assert.equal(FASES_ESTANDAR.length, 8);
  assert.equal(FASES_ESTANDAR[0], "Movimiento de tierra");
  assert.equal(FASES_ESTANDAR[7], "Entrega");
});

test("validarFoto rechaza un mime type que no es imagen", () => {
  assert.match(validarFoto("application/pdf", 1024)!, /JPEG, PNG, WEBP o GIF/);
});

test("validarFoto rechaza SVG aunque su mime empiece con image/", () => {
  // Un SVG puede llevar <script> embebido: no basta con `startsWith("image/")`.
  assert.match(validarFoto("image/svg+xml", 1024)!, /JPEG, PNG, WEBP o GIF/);
});

test("validarFoto rechaza una imagen de más de 10 MB", () => {
  assert.match(validarFoto("image/png", 11 * 1024 * 1024)!, /10 MB/);
});

test("validarFoto acepta cada formato ráster permitido dentro del límite", () => {
  for (const mime of Object.keys(FOTO_MIME_EXTENSIONES)) {
    assert.equal(validarFoto(mime, 5 * 1024 * 1024), null);
  }
});

test("validarFoto acepta exactamente el límite de 10 MB", () => {
  assert.equal(validarFoto("image/png", 10 * 1024 * 1024), null);
});
