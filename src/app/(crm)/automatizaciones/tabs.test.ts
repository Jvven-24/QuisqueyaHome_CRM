import assert from "node:assert/strict";
import test from "node:test";
import { seleccionarTabAutomatizaciones } from "./_tabs.ts";

test("automatizaciones conserva una pestaña reconocida de la URL", () => {
  assert.equal(seleccionarTabAutomatizaciones("monitor"), "monitor");
  assert.equal(seleccionarTabAutomatizaciones(["copiloto", "monitor"]), "copiloto");
});

test("automatizaciones usa Constructor para tab ausente o inválido", () => {
  assert.equal(seleccionarTabAutomatizaciones(undefined), "constructor");
  assert.equal(seleccionarTabAutomatizaciones("desconocida"), "constructor");
});
