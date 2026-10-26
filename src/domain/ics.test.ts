import assert from "node:assert/strict";
import { test } from "node:test";
import { generarIcs } from "./ics.ts";

test("el UID es estable: exportar dos veces el mismo evento da el mismo UID", () => {
  const evento = {
    id: 42,
    title: "Llamada con José Reyes",
    startsAt: new Date("2026-07-20T13:00:00.000Z"),
    endsAt: null,
    location: null,
  };
  const primera = generarIcs([evento]);
  const segunda = generarIcs([evento]);
  const uid = "UID:activity-42@quisqueyahome.com";
  assert.ok(primera.includes(uid));
  assert.ok(segunda.includes(uid));
});

test("sin endsAt, asume una hora de duración", () => {
  const ics = generarIcs([
    { id: 1, title: "Cita", startsAt: new Date("2026-07-20T13:00:00.000Z"), endsAt: null, location: null },
  ]);
  assert.ok(ics.includes("DTSTART:20260720T130000Z"));
  assert.ok(ics.includes("DTEND:20260720T140000Z"));
});

test("escapa comas y punto y coma del título", () => {
  const ics = generarIcs([
    { id: 2, title: "Praderas, fase 2; unidad A1", startsAt: new Date("2026-07-20T13:00:00.000Z"), endsAt: null, location: null },
  ]);
  assert.ok(ics.includes("SUMMARY:Praderas\\, fase 2\\; unidad A1"));
});

test("sin ubicación, no escribe LOCATION", () => {
  const ics = generarIcs([
    { id: 3, title: "Sin lugar", startsAt: new Date("2026-07-20T13:00:00.000Z"), endsAt: null, location: null },
  ]);
  assert.ok(!ics.includes("LOCATION"));
});

test("una agenda vacía sigue siendo un .ics válido", () => {
  const ics = generarIcs([]);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR"));
  assert.ok(ics.trim().endsWith("END:VCALENDAR"));
});
