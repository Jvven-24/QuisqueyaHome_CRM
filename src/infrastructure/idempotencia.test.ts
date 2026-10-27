import assert from "node:assert/strict";
import { test } from "node:test";
import { claveIdempotencia, ejecutarIdempotente, type AlmacenIdempotencia, type EstadoComando } from "./idempotencia.ts";

function almacen(): AlmacenIdempotencia & { filas: Map<string, EstadoComando> } {
  const filas = new Map<string, EstadoComando>();
  const k = (a: number, o: string, c: string) => `${a}|${o}|${c}`;
  return {
    filas,
    async reservar(a, o, c, h) { const e = filas.get(k(a, o, c)); if (e) return e; filas.set(k(a, o, c), { status: "processing", requestHash: h }); return null; },
    async completar(a, o, c) { const e = filas.get(k(a, o, c))!; filas.set(k(a, o, c), { ...e, status: "completed" }); },
    async liberar(a, o, c) { filas.delete(k(a, o, c)); },
  };
}
const KEY = "3f2b8c1e-9a4d-4c2b-8e1f-0a1b2c3d4e5f";

test("misma clave y cuerpo: la escritura corre una sola vez", async () => {
  const a = almacen(); let veces = 0;
  const op = () => { veces++; return Promise.resolve(Response.json({ ok: true })); };
  const p = { actorId: 1, operation: "META", key: KEY, cuerpo: "{\"x\":1}" };
  assert.equal((await ejecutarIdempotente(a, p, op)).status, 200);
  const r2 = await ejecutarIdempotente(a, p, op);
  assert.deepEqual(await r2.json(), { ok: true, replayed: true });
  assert.equal(veces, 1);
});

test("misma clave con otro cuerpo: 409", async () => {
  const a = almacen();
  const op = () => Promise.resolve(Response.json({ ok: true }));
  await ejecutarIdempotente(a, { actorId: 1, operation: "META", key: KEY, cuerpo: "a" }, op);
  assert.equal((await ejecutarIdempotente(a, { actorId: 1, operation: "META", key: KEY, cuerpo: "b" }, op)).status, 409);
});

test("si falla se libera la clave y se puede reintentar", async () => {
  const a = almacen();
  const p = { actorId: 1, operation: "META", key: KEY, cuerpo: "a" };
  await ejecutarIdempotente(a, p, () => Promise.resolve(Response.json({ error: "x" }, { status: 400 })));
  assert.equal(a.filas.size, 0);
  await assert.rejects(ejecutarIdempotente(a, p, () => Promise.reject(new Error("boom"))));
  assert.equal(a.filas.size, 0);
});

test("sin clave o clave inválida: no aplica", () => {
  assert.equal(claveIdempotencia(new Request("http://x", { headers: { "Idempotency-Key": "abc" } })), null);
  assert.equal(claveIdempotencia(new Request("http://x", { headers: { "Idempotency-Key": KEY } })), KEY);
});
