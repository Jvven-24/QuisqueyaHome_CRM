import { test } from "node:test";
import assert from "node:assert/strict";
import { erroresActividad } from "./validacion.ts";

test("actividad: los campos vacíos tienen un mensaje propio en español", () => {
  assert.deepEqual(erroresActividad({ title: "  ", day: "", time: "" }), {
    title: "Escribe el título.", day: "Indica una fecha válida.", time: "Indica una hora válida.",
  });
  assert.deepEqual(erroresActividad({ title: "Visita", day: "2026-10-18", time: "10:30" }), {});
  assert.equal(erroresActividad({ title: "Visita", day: "2026-02-30", time: "24:00" }).day, "Indica una fecha válida.");
});
