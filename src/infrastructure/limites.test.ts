import assert from "node:assert/strict";
import { test } from "node:test";
import { crearLimitador, cuerpoDemasiadoGrande, ipCliente, leerJsonLimitado } from "./limites.ts";

test("limitador: corta al superar el máximo y se reabre tras la ventana", () => {
  let t = 0;
  const l = crearLimitador(2, 1000, () => t);
  assert.equal(l.consumir("a"), null);
  assert.equal(l.consumir("a"), null);
  assert.equal(l.consumir("a"), 1);
  assert.equal(l.consumir("b"), null);
  t = 1000;
  assert.equal(l.consumir("a"), null);
});

test("ip: toma el último salto (Caddy) de x-forwarded-for", () => {
  assert.equal(ipCliente(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 5.6.7.8" } })), "5.6.7.8");
});

test("tamaño: 413 por content-length y por bytes reales", async () => {
  assert.equal(cuerpoDemasiadoGrande(new Request("http://x", { method: "POST", headers: { "content-length": "2000" }, body: "x".repeat(2000) }), 1000)?.status, 413);
  const r = await leerJsonLimitado(new Request("http://x", { method: "POST", body: JSON.stringify({ a: "x".repeat(2000) }) }), 1000);
  assert.ok(r instanceof Response && r.status === 413);
  assert.deepEqual(await leerJsonLimitado(new Request("http://x", { method: "POST", body: "{\"a\":1}" }), 1000), { a: 1 });
});

test("bloqueado no gasta intento", () => {
  const l = crearLimitador(1, 1000, () => 0);
  assert.equal(l.bloqueado("a"), null);
  assert.equal(l.consumir("a"), null);
  assert.equal(l.bloqueado("a"), 1);
});
