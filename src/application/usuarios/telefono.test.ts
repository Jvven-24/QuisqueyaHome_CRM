import assert from "node:assert/strict";
import { test } from "node:test";
import { ValidationError } from "../../domain/errors.ts";
import { TelefonoUsuarioInput, validarTelefonoUsuario } from "./telefono.ts";
test("G4-03: teléfono RD e internacional explícito", () => {
  assert.equal(validarTelefonoUsuario("(809) 555-0184"), "+18095550184");
  assert.equal(validarTelefonoUsuario("+34 612 345 678"), "+34612345678");
  assert.equal(validarTelefonoUsuario(""), null);
  assert.equal(validarTelefonoUsuario(null), null);
});
test("G4-03: basura, HTML y números incompletos se rechazan por campo", () => {
  for (const valor of ["abc!!<b>x</b>", "abc8095550184", "<b>8095550184</b>", "123", "++18095550184"]) {
    assert.equal(TelefonoUsuarioInput.safeParse(valor).success, false);
    assert.throws(() => validarTelefonoUsuario(valor), (error) => error instanceof ValidationError && Boolean(error.fields.phone));
  }
});
