/**
 * Pruebas de vigencia de constancias de Academy. Sin base de datos: `npm test`
 * las corre con el runner de Node.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  VENTANA_RECERTIFICACION_DIAS,
  constanciaAcreditaFormacion,
  estadoVigenciaConstancia,
  fechaVencimientoConstancia,
  requiereRecertificacion,
  bloqueaNuevaSolicitud,
  constanciaMasReciente,
  etiquetaEstadoConstancia,
} from "./academy-vigencia.ts";

const emitida = new Date("2026-01-15T12:00:00.000Z");

test("la fecha de vencimiento suma 12 meses calendario en UTC", () => {
  assert.equal(fechaVencimientoConstancia(emitida).toISOString(), "2027-01-15T12:00:00.000Z");
});

test("una constancia recién emitida está vigente", () => {
  const ahora = new Date("2026-02-01T00:00:00.000Z");
  assert.equal(estadoVigenciaConstancia({ status: "vigente", issuedAt: emitida }, ahora), "vigente");
});

test("a 60 días o menos del vencimiento pasa a por_vencer", () => {
  const vence = fechaVencimientoConstancia(emitida).getTime();
  const dentroDeVentana = new Date(vence - VENTANA_RECERTIFICACION_DIAS * 24 * 60 * 60 * 1000);
  assert.equal(
    estadoVigenciaConstancia({ status: "vigente", issuedAt: emitida }, dentroDeVentana),
    "por_vencer",
  );
});

test("en el instante exacto del vencimiento ya está vencida", () => {
  const vence = fechaVencimientoConstancia(emitida);
  assert.equal(estadoVigenciaConstancia({ status: "vigente", issuedAt: emitida }, vence), "vencida");
});

test("una constancia revocada sigue revocada aunque no haya vencido", () => {
  const ahora = new Date("2026-02-01T00:00:00.000Z");
  assert.equal(estadoVigenciaConstancia({ status: "revocada", issuedAt: emitida }, ahora), "revocada");
});

test("solo vigente y por_vencer acreditan formación; solo por_vencer y vencida piden recertificar", () => {
  assert.equal(constanciaAcreditaFormacion("vigente"), true);
  assert.equal(constanciaAcreditaFormacion("por_vencer"), true);
  assert.equal(constanciaAcreditaFormacion("vencida"), false);
  assert.equal(constanciaAcreditaFormacion("revocada"), false);
  assert.equal(requiereRecertificacion("vigente"), false);
  assert.equal(requiereRecertificacion("por_vencer"), true);
  assert.equal(requiereRecertificacion("vencida"), true);
  assert.equal(requiereRecertificacion("revocada"), false);
});

test("por_vencer acredita formación y NO bloquea pedir recertificación (coherente con repos/academy.ts)", () => {
  assert.equal(constanciaAcreditaFormacion("por_vencer"), true);
  assert.equal(requiereRecertificacion("por_vencer"), true);
  assert.equal(bloqueaNuevaSolicitud("por_vencer"), false);
  assert.equal(bloqueaNuevaSolicitud("vigente"), true);
  assert.equal(bloqueaNuevaSolicitud("vencida"), false);
  assert.equal(bloqueaNuevaSolicitud("revocada"), false);
});

test("una constancia vencida (status 'vigente' en BD) no se muestra vigente", () => {
  const ahora = new Date("2027-03-01T00:00:00.000Z");
  const estado = estadoVigenciaConstancia({ status: "vigente", issuedAt: emitida }, ahora);
  assert.equal(estado, "vencida");
  assert.equal(etiquetaEstadoConstancia(estado), "VENCIDA");
  assert.equal(constanciaAcreditaFormacion(estado), false);
});

test("constanciaMasReciente elige la última emitida (tras recertificar, la vieja no cuenta)", () => {
  const vieja = { id: 1, issuedAt: "2025-01-01T00:00:00.000Z" };
  const nueva = { id: 2, issuedAt: new Date("2026-06-01T00:00:00.000Z") };
  assert.equal(constanciaMasReciente([vieja, nueva])?.id, 2);
  assert.equal(constanciaMasReciente([nueva, vieja])?.id, 2);
  assert.equal(constanciaMasReciente([]), undefined);
});
