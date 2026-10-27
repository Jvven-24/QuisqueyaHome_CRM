import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { financeTabsFor } from "./_navegacion.ts";

test("Finanzas conserva conjuntos propios de Comisiones y Reservas", () => {
  const comisiones = financeTabsFor("comisiones");
  const reservas = financeTabsFor("reservas");

  assert.deepEqual(comisiones.map(({ href }) => href), [
    "/comisiones", "/comisiones/reglas", "/comisiones/liquidaciones", "/metas",
  ]);
  assert.deepEqual(reservas.map(({ href }) => href), [
    "/reservas", "/reservas/holds", "/reservas/cartera", "/reservas/conciliacion",
    "/reservas/excepciones", "/reservas/documentos",
  ]);
  assert.equal(reservas.find(({ href }) => href === "/reservas/documentos")?.label, "Documentos fiscales");
  assert.ok(reservas.every(({ href }) => !href.includes("/comisiones") && href !== "/metas"));
  assert.ok(comisiones.every(({ href }) => !href.startsWith("/reservas")));
});

test("ambos layouts de Finanzas montan la navegación compartida con su sección", () => {
  const comisiones = readFileSync(new URL("../../comisiones/layout.tsx", import.meta.url), "utf8");
  const reservasKit = readFileSync(new URL("../_componentes/kit.tsx", import.meta.url), "utf8");

  assert.match(comisiones, /NavegacionFinanzas section="comisiones"/);
  assert.match(reservasKit, /NavegacionFinanzas section=\{group === "comisiones" \? "comisiones" : "reservas"\}/);
});
