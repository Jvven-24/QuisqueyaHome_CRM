import assert from "node:assert/strict";
import { test } from "node:test";
import { correrWorker, esDestinoLocal, leerOpcionesWorker } from "./ejecutor.ts";

test("leerOpcionesWorker: valores por defecto, --once, --interval y --limit", () => {
  assert.deepEqual(leerOpcionesWorker([]), { once: false, intervaloMs: 30_000, limite: 100, permitirRemoto: false });
  assert.deepEqual(
    leerOpcionesWorker(["--once", "--interval=5", "--limit=10", "--allow-remote"]),
    { once: true, intervaloMs: 5_000, limite: 10, permitirRemoto: true },
  );
});

test("leerOpcionesWorker: rechaza argumentos desconocidos y valores fuera de rango", () => {
  for (const malo of [["--foo"], ["--limit=0"], ["--limit=1001"], ["--interval=abc"], ["--interval=0"], ["--limit="]]) {
    assert.throws(() => leerOpcionesWorker(malo), RangeError, malo.join(" "));
  }
});

test("esDestinoLocal: solo loopback sin --allow-remote", () => {
  assert.equal(esDestinoLocal("postgres://u:p@127.0.0.1:5432/db"), true);
  assert.equal(esDestinoLocal("postgresql://u:p@localhost:5432/db"), true);
  assert.equal(esDestinoLocal("postgres://u:p@[::1]:5432/db"), true);
  assert.equal(esDestinoLocal("postgres://u:p@db.supabase.co:5432/postgres"), false);
  assert.equal(esDestinoLocal("no es una url"), false);
});

function armar(lotes: (number | Error)[], paradaTrasPasadas = Infinity) {
  const log: string[] = [];
  const pausas: number[] = [];
  const limitesUsados: number[] = [];
  let i = 0;
  let pasadas = 0;
  return {
    log, pausas, limitesUsados,
    deps: {
      lote: async (limite: number) => {
        limitesUsados.push(limite);
        pasadas++;
        const siguiente = lotes[Math.min(i++, lotes.length - 1)]!;
        if (siguiente instanceof Error) throw siguiente;
        return siguiente;
      },
      dormir: async (ms: number) => { pausas.push(ms); },
      detenido: () => pasadas >= paradaTrasPasadas,
      log: (m: string) => { log.push(m); },
    },
  };
}

test("correrWorker --once: una sola pasada, sin dormir", async () => {
  const w = armar([3]);
  const r = await correrWorker(w.deps, { once: true, intervaloMs: 1000, limite: 100 });
  assert.deepEqual(r, { pasadas: 1, procesados: 3, fallos: 0 });
  assert.deepEqual(w.pausas, []);
  assert.deepEqual(w.limitesUsados, [100]);
});

test("correrWorker --once: un fallo se propaga (el script sale con código 1)", async () => {
  const w = armar([new Error("x")]);
  await assert.rejects(() => correrWorker(w.deps, { once: true, intervaloMs: 1000, limite: 100 }), /x/);
  assert.equal(w.log.length, 1);
});

test("correrWorker en bucle: duerme el intervalo si el lote no se llena y sigue sin dormir si se llena", async () => {
  const w = armar([5, 2, 5], 3);
  const r = await correrWorker(w.deps, { once: false, intervaloMs: 2000, limite: 5 });
  assert.equal(r.pasadas, 3);
  assert.equal(r.procesados, 12);
  assert.deepEqual(w.pausas, [2000]); // solo tras el lote de 2
});

test("correrWorker en bucle: un fallo no lo detiene y no filtra el mensaje del driver", async () => {
  const peligroso = Object.assign(new Error("connection string postgres://u:SECRETO@host/db"), { cause: { code: "ECONNREFUSED" } });
  const w = armar([peligroso, 0], 2);
  const r = await correrWorker(w.deps, { once: false, intervaloMs: 10, limite: 5 });
  assert.equal(r.fallos, 1);
  assert.equal(r.pasadas, 2);
  const salida = w.log.join("\n");
  assert.match(salida, /ECONNREFUSED/);
  assert.ok(!salida.includes("SECRETO"));
});

test("correrWorker: no arranca si ya llegó la señal de parada", async () => {
  const w = armar([1], 0);
  const r = await correrWorker(w.deps, { once: false, intervaloMs: 10, limite: 5 });
  assert.deepEqual(r, { pasadas: 0, procesados: 0, fallos: 0 });
});
