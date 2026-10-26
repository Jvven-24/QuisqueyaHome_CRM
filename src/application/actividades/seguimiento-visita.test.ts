import { test } from "node:test";
import assert from "node:assert/strict";
import { crearSeguimientoVisita, type SeguimientoVisita } from "./seguimiento-visita.ts";
test("visita: el seguimiento usa startsAt, conserva las referencias y comprueba la respuesta", async () => {
  let datos: SeguimientoVisita | undefined;
  const entrada = { titulo: " Seguimiento ", fecha: "2026-10-20", prioridad: "normal" as const, contactId: 3, projectId: 7 };
  await crearSeguimientoVisita(async cuerpo => { datos = cuerpo; return { ok: true }; }, entrada);
  assert.equal(datos?.startsAt, "2026-10-20T10:00:00-04:00"); assert.equal(datos?.contactId, 3); assert.equal(datos?.projectId, 7); assert.equal(datos?.title, "Seguimiento");
  assert.equal(Object.hasOwn(datos!, "dueAt"), false);
  await assert.rejects(crearSeguimientoVisita(async()=>({ ok: false }), entrada), /no se creó el seguimiento/);
});
