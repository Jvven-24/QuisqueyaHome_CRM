import assert from "node:assert/strict";
import { test } from "node:test";
import { MODULOS, ENTRADAS_N1, ENTRADAS_PIE } from "../modulos.ts";
import { routeActive, visibleEntries } from "./navigation.ts";

test("S1: el grupo usa el primer hijo permitido aunque el padre no sea visible", () => {
  const allowed = MODULOS.filter(module => ["/metas", "/avances", "/documentos", "/portal"].includes(module.ruta));
  const entries = visibleEntries([...ENTRADAS_N1, ...ENTRADAS_PIE], allowed);
  assert.deepEqual(entries.map(entry => entry.ruta), ["/documentos", "/avances", "/metas", "/portal"]);
  for (const entry of entries) assert.ok(entry.rutasHijas?.every(route => allowed.some(module => module.ruta === route)));
  assert.deepEqual(visibleEntries(ENTRADAS_N1, []), []);
});

test("S1: todas las rutas de la ola tienen un acceso de sección sin duplicados", () => {
  const entries = visibleEntries([...ENTRADAS_N1, ...ENTRADAS_PIE], MODULOS);
  const routes = entries.flatMap(entry => entry.rutasHijas ?? [entry.ruta]);
  assert.equal(new Set(routes).size, MODULOS.length);
  assert.deepEqual(new Set(routes), new Set(MODULOS.map(module => module.ruta)));
  const shortcuts = MODULOS.map(module => module.atajo);
  assert.equal(new Set(shortcuts).size, MODULOS.length);
});

test("S1: las rutas activas respetan segmentos completos", () => {
  assert.equal(routeActive("/tareas/42", "/tareas"), true);
  assert.equal(routeActive("/tareas-falsas", "/tareas"), false);
  assert.equal(routeActive("/tareas", "/tareas"), true);
});
