import assert from "node:assert/strict";
import { test } from "node:test";
import { AprendizajeEnMemoria } from "./en-memoria.ts";

test("AprendizajePort: comprobarSalud reporta estado disponible y versión LTS", async () => {
  const puerto = new AprendizajeEnMemoria();
  const salud = await puerto.comprobarSalud();

  assert.equal(salud.disponible, true);
  assert.equal(salud.url, "http://127.0.0.1:9330");
  assert.ok(salud.version.includes("4.5.15"));
});

test("AprendizajePort: listarCursos retorna catálogo oficial de formación", async () => {
  const puerto = new AprendizajeEnMemoria();
  const cursos = await puerto.listarCursos();

  assert.equal(cursos.length, 3);
  assert.equal(cursos[0]?.codigo, "QHA-CONFOTUR");
  assert.equal(cursos[1]?.codigo, "QHA-RESERVAS");
  assert.equal(cursos[2]?.codigo, "QHA-PLAFT");
});

test("AprendizajePort: evidencia caída reporta null sin arrojar excepción", async () => {
  const puerto = new AprendizajeEnMemoria();
  puerto.disponible = false;

  const salud = await puerto.comprobarSalud();
  assert.equal(salud.disponible, false);

  const cursos = await puerto.listarCursos();
  assert.deepEqual(cursos, []);

  const evidencia = await puerto.obtenerEvidencia(1, "QHA-CONFOTUR-01");
  assert.equal(evidencia, null);
});
