import assert from "node:assert/strict";
import { test } from "node:test";
import { CrearEntradaInput, EditarEntradaInput } from "./entrada.ts";
test("G4-01: catálogo valida nombre y posición sin copiar campos adicionales", () => {
 assert.deepEqual(CrearEntradaInput.parse({ name: " Motivo ", position: "7", isAdmin: true }), { name: "Motivo", position: 7 });
 assert.equal(CrearEntradaInput.safeParse({ name: "  " }).success, false);
 assert.equal(CrearEntradaInput.safeParse({ name: "Motivo", position: "1.5" }).success, false);
 assert.equal(EditarEntradaInput.safeParse({ isActive: "false" }).success, false);
 assert.equal(CrearEntradaInput.parse({ name: "<b>texto</b>" }).name, "<b>texto</b>");
});
