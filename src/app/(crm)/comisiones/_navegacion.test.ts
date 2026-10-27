import assert from "node:assert/strict";
import test from "node:test";
import { enlacesEstadoComisiones } from "./_navegacion.ts";

const counts = { todos: 12, pending: 4, approved: 3, paid: 2, void: 3 };

test("los enlaces de estado actualizan tab y estado conservando el resto de filtros", () => {
  const tabs = enlacesEstadoComisiones("/comisiones", "broker=17&periodo=2026-10&estado=paid", counts);
  const approved = new URL(tabs.find((tab) => tab.value === "approved")!.href, "http://crm.local");

  assert.equal(approved.searchParams.get("tab"), "approved");
  assert.equal(approved.searchParams.get("estado"), "approved");
  assert.equal(approved.searchParams.get("broker"), "17");
  assert.equal(approved.searchParams.get("periodo"), "2026-10");
});

test("la pestaña Todas borra el estado sin perder broker ni período", () => {
  const tabs = enlacesEstadoComisiones("/comisiones", "broker=17&periodo=2026-10&estado=paid", counts);
  const all = new URL(tabs.find((tab) => tab.value === "todos")!.href, "http://crm.local");

  assert.equal(all.searchParams.get("tab"), "todos");
  assert.equal(all.searchParams.has("estado"), false);
  assert.equal(all.searchParams.get("broker"), "17");
  assert.equal(all.searchParams.get("periodo"), "2026-10");
});
