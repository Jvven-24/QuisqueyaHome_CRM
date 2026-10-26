import { test } from "node:test";
import assert from "node:assert/strict";
import { destinoLocal, esProyectoQA } from "./fix-g2-proyecto.mjs";
test("limpieza: solo permite una conexión PostgreSQL de loopback", () => {
  assert.equal(destinoLocal("postgres://localhost/crm").host, "localhost");
  assert.throws(()=>destinoLocal("postgres://example.com/crm"));
  assert.throws(()=>destinoLocal("https://localhost/crm"));
});
test("limpieza: coincidencia exacta y borrado lógico idempotente", () => {
  const fila = { slug: "script-alert-1-script", name: "  <script>alert(1)</script>  ", deleted_at: null };
  assert.equal(esProyectoQA(fila), true);
  assert.equal(esProyectoQA({ ...fila, name: "Proyecto comercial" }), false);
  assert.equal(esProyectoQA({ ...fila, deleted_at: new Date() }), false);
});
