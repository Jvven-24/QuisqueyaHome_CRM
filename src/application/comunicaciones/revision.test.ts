import { test } from "node:test";
import assert from "node:assert/strict";
import { prepararYDespacharMensaje } from "./casos-de-uso.ts";
import type { ProveedorDespachoCanal } from "./puertos.ts";
test("despacho: ni una afirmación fiscal sin revisión ni una variable sin resolver llegan al proveedor", async () => {
  let llamadas = 0;
  const proveedor: ProveedorDespachoCanal = { async despachar(mensaje) { llamadas++; return { ok: true, canal: mensaje.canal, enviadoAt: new Date() }; } };
  for (const cuerpoOPlantilla of ["0% IPI durante 15 años", "Beneficios de Confotur", "Hola {nombre}", "   "]) {
    await assert.rejects(prepararYDespacharMensaje(proveedor, { canal: "telegram", destinatario: "@destinatario", cuerpoOPlantilla }));
  }
  assert.equal(llamadas, 0);
  await prepararYDespacharMensaje(proveedor, { canal: "telegram", destinatario: "@destinatario", cuerpoOPlantilla: "Hola Ana, confirmamos tu cita." });
  assert.equal(llamadas, 1);
});

test("despacho: un ID de simulación del adaptador nunca se presenta como envío real", async () => {
  for (const mensajeId of ["sim_email_1", "tg_sim_1", "wa_sim_1"]) {
    const proveedor: ProveedorDespachoCanal = { async despachar(mensaje) { return { ok: true, canal: mensaje.canal, mensajeId, enviadoAt: new Date() }; } };
    const resultado = await prepararYDespacharMensaje(proveedor, { canal: "telegram", destinatario: "@destinatario", cuerpoOPlantilla: "Mensaje" });
    assert.equal(resultado.ok, false); assert.match(resultado.error!, /no confirma un envío real/);
  }
});

test("despacho: teléfono inválido no sale y un teléfono válido se normaliza con el dominio", async () => {
  const enviados: string[] = [];
  const proveedor: ProveedorDespachoCanal = { async despachar(mensaje) { enviados.push(mensaje.destinatario); return { ok: true, canal: mensaje.canal, enviadoAt: new Date() }; } };
  await assert.rejects(prepararYDespacharMensaje(proveedor, { canal: "whatsapp", destinatario: "123", cuerpoOPlantilla: "Hola" }));
  assert.equal(enviados.length, 0);
  await prepararYDespacharMensaje(proveedor, { canal: "whatsapp", destinatario: "809-555-0142", cuerpoOPlantilla: "Hola" });
  assert.deepEqual(enviados, ["+18095550142"]);
});
