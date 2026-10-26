import assert from "node:assert/strict";
import { test } from "node:test";
import { estadoIntegracion } from "./integraciones-estado.ts";
test("G4: Moodle sin cuenta y outbox solo con estado medido", () => {
  assert.equal(estadoIntegracion("moodle", undefined, null).texto, "Sin configurar");
  assert.equal(estadoIntegracion("outbox", "connected", null).texto, "No disponible");
  const cola = { pendientes: 1, enviados: 0, fallidos: 0, sinConsumidor: 0, ultimoEnviadoAt: null };
  assert.equal(estadoIntegracion("outbox", undefined, cola).texto, "Cola disponible");
  assert.equal(estadoIntegracion("outbox", undefined, { ...cola, fallidos: 1 }).texto, "Requiere atención");
});
