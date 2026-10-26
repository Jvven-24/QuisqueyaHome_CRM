import { test } from "node:test";
import assert from "node:assert/strict";
import { descripcionComercial, fechaProyecto, monedaProyecto, nombreProyecto } from "./validacion.ts";

test("proyecto: rechaza nombre vacío, fechas imposibles y moneda fuera del catálogo", () => {
  assert.equal(nombreProyecto.safeParse("   ").success, false);
  assert.equal(fechaProyecto.safeParse("2026-02-30").success, false);
  assert.equal(monedaProyecto.safeParse("cualquier cosa").success, false);
  assert.equal(nombreProyecto.parse("  Araya  "), "Araya");
});

test("G2-08: rechaza HTML en nombres sin eliminar texto silenciosamente", () => {
  for (const nombre of ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>", "Araya <b>Beach</b>", "Araya<", "Vista>"]) {
    const resultado = nombreProyecto.safeParse(nombre);
    assert.equal(resultado.success, false);
    if (!resultado.success) assert.match(resultado.error.issues[0]!.message, /sin etiquetas HTML/);
  }
  assert.equal(nombreProyecto.parse("  Bávaro & Sol — Fase 2  "), "Bávaro & Sol — Fase 2");
});

test("proyecto: no se presenta una fixture como descripción", () => {
  assert.equal(descripcionComercial("FIXTURE SIMULADA; portal:123. Confotur hipotético."), null);
  assert.equal(descripcionComercial("Descripción comercial"), "Descripción comercial");
});
