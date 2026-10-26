import assert from "node:assert/strict";
import { test } from "node:test";
import { crearEnvioUnico } from "./envio.ts";
test("G4: doble submit envía una petición y el error libera el bloqueo", async () => {
  const enviar = crearEnvioUnico();
  let resolver!: () => void;
  let peticiones = 0;
  const primera = enviar(async () => { peticiones++; await new Promise<void>((resolve) => { resolver = resolve; }); });
  await enviar(async () => { peticiones++; });
  assert.equal(peticiones, 1);
  resolver(); await primera;
  await assert.rejects(enviar(async () => { throw new Error("Red no disponible"); }));
  await enviar(async () => { peticiones++; });
  assert.equal(peticiones, 2);
});
