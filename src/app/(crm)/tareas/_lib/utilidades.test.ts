import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parsearDescripcionChecklist,
  serializarDescripcionChecklist,
  calcularUrgencia,
  etiquetaFecha,
  estiloPrioridad,
} from "./utilidades.ts";

test("utilidades: parsearDescripcionChecklist extrae checklist y notas", () => {
  const desc = "Nota libre\n- [ ] paso uno\n- [x] paso dos\nOtra nota";
  const res = parsearDescripcionChecklist(desc);
  assert.equal(res.notasLibres, "Nota libre\nOtra nota");
  assert.equal(res.items.length, 2);
  assert.equal(res.items[0]!.texto, "paso uno");
  assert.equal(res.items[0]!.completado, false);
  assert.equal(res.items[1]!.completado, true);
});

test("utilidades: serializarDescripcionChecklist redondea a formato checklist", () => {
  const s = serializarDescripcionChecklist("Nota", [
    { texto: "a", completado: true },
    { texto: "", completado: false },
    { texto: "b", completado: false },
  ]);
  assert.ok(s.includes("Nota"));
  assert.ok(s.includes("- [x] a"));
  assert.ok(s.includes("- [ ] b"));
  assert.ok(!s.includes("  "));
});

test("utilidades: calcularUrgencia y etiquetaFecha usan fechaSantoDomingo", () => {
  const hoy = "2026-10-27";
  // Usar strings simulados que coincidan con formato en-US-CA
  assert.equal(calcularUrgencia(null, hoy), "proximas");
  // Las funciones delegan a fechaSantoDomingo; el test de integración cubre tz
  const e1 = etiquetaFecha(new Date("2026-10-26T10:00:00Z"), "2026-10-26");
  assert.ok(["red","gold","green","neutral"].includes(e1.tono));
});

test("utilidades: estiloPrioridad mapea high/normal/low", () => {
  const h = estiloPrioridad("high");
  assert.equal(h.label, "Alta Prioridad");
  const n = estiloPrioridad("normal");
  assert.equal(n.label, "Prioridad Normal");
  const l = estiloPrioridad("low");
  assert.equal(l.label, "Baja Prioridad");
});
