import test from "node:test";
import assert from "node:assert/strict";
import { evaluar } from "./avance.mjs";

const mapa = (items, peso = 1) => ({ programa: "t", actualizado: "x", fases: [{ id: "F", nombre: "f", peso, items }] });
const it = (id, estado, depende = [], extra = {}) => ({ id, titulo: id, estado, depende, ...extra });

test("porcentaje: DONE 1, IN_PROGRESS 0.5, TODO y BLOCKED 0, ponderado por peso", () => {
  const r = evaluar(mapa([it("a", "DONE", [], { evidencia: { archivo: "x" } }), it("b", "IN_PROGRESS"), it("c", "TODO"), it("d", "BLOCKED")]));
  assert.equal(r.fases[0].porcentaje, 37.5);
  const p = evaluar(mapa([it("a", "DONE", [], { evidencia: { archivo: "x" }, peso: 3 }), it("b", "TODO", [], { peso: 1 })]));
  assert.equal(p.fases[0].porcentaje, 75);
});

test("DONE sin evidencia, con commit inexistente o con archivo inexistente es error", () => {
  assert.match(evaluar(mapa([it("a", "DONE")])).errores[0], /sin evidencia/);
  const r = evaluar(mapa([it("a", "DONE", [], { evidencia: { commit: "zzz" } })]), { existeCommit: () => false });
  assert.match(r.errores[0], /no existe/);
  const f = evaluar(mapa([it("a", "DONE", [], { evidencia: { archivo: "nada" } })]), { existeArchivo: () => false });
  assert.match(f.errores[0], /no existe/);
});

test("dependencia inexistente, ciclo y DONE con dependencia sin terminar son errores", () => {
  assert.match(evaluar(mapa([it("a", "TODO", ["zz"])])).errores.join(), /no existe/);
  assert.match(evaluar(mapa([it("a", "TODO", ["b"]), it("b", "TODO", ["a"])])).errores.join(), /ciclo/);
  const r = evaluar(mapa([it("a", "TODO"), it("b", "DONE", ["a"], { evidencia: { archivo: "x" } })]));
  assert.match(r.errores.join(), /dependencia a no lo está/);
});

test("siguiente: solo lo que tiene todas sus dependencias hechas; bloqueados aparte", () => {
  const r = evaluar(mapa([it("a", "DONE", [], { evidencia: { archivo: "x" } }), it("b", "TODO", ["a"]), it("c", "TODO", ["b"]), it("d", "BLOCKED", ["a"])]));
  assert.deepEqual(r.siguientes.map((i) => i.id), ["b"]);
  assert.deepEqual(r.bloqueados.map((i) => i.id), ["d"]);
  assert.deepEqual(r.esperando.map((i) => i.id), ["c"]);
});

test("el roadmap real es válido en estructura (sin ids repetidos, dependencias ni ciclos)", async () => {
  const { readFileSync } = await import("node:fs");
  const real = JSON.parse(readFileSync(new URL("../../.viltrum/vre-os/roadmap.json", import.meta.url), "utf8"));
  const r = evaluar(real, { existeCommit: () => true, existeArchivo: () => true });
  assert.deepEqual(r.errores, []);
});
