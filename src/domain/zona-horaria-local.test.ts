import { test } from "node:test";
import assert from "node:assert/strict";
import { fechaLocal } from "./zona-horaria.ts";
test("fecha local: no desplaza una fecha de calendario y convierte instantes a Santo Domingo", () => {
  assert.equal(fechaLocal("2027-12-01"), "01/12/2027");
  assert.equal(fechaLocal(new Date("2026-10-19T01:00:00Z")), "18/10/2026");
  assert.equal(fechaLocal(null), "Sin fecha");
});
