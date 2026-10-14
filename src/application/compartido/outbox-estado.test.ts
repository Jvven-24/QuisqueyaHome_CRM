import assert from "node:assert/strict";
import { test } from "node:test";
import { COMANDO_WORKER_OUTBOX, describirEstadoOutbox } from "./outbox-estado.ts";

test("describirEstadoOutbox: dice que el worker es manual, nunca que esté activo", () => {
  for (const estado of [null, { pendientes: 0, enviados: 0, fallidos: 0, ultimoEnviadoAt: null }]) {
    const texto = describirEstadoOutbox(estado);
    assert.ok(texto.includes(COMANDO_WORKER_OUTBOX));
    assert.match(texto, /no hay proceso en segundo plano/);
    assert.doesNotMatch(texto, /worker transaccional activo/i);
  }
});

test("describirEstadoOutbox: muestra solo los conteos recibidos y 'nunca' sin envíos", () => {
  const texto = describirEstadoOutbox({ pendientes: 4, enviados: 0, fallidos: 2, ultimoEnviadoAt: null });
  assert.match(texto, /Pendientes: 4 · enviados: 0 · fallidos: 2 · último procesado: nunca/);
});

test("describirEstadoOutbox: formatea el último envío en hora de Santo Domingo", () => {
  const texto = describirEstadoOutbox({ pendientes: 0, enviados: 1, fallidos: 0, ultimoEnviadoAt: new Date("2026-10-14T16:30:00Z") });
  assert.match(texto, /2026/);
  assert.doesNotMatch(texto, /nunca/);
});

test("describirEstadoOutbox: sin lectura de la cola lo dice y no inventa conteos", () => {
  const texto = describirEstadoOutbox(null);
  assert.match(texto, /Estado de la cola no disponible/);
  assert.doesNotMatch(texto, /Pendientes/);
});
