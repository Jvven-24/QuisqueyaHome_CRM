import assert from "node:assert/strict";
import { test } from "node:test";
import { EdicionFormularioInput, InvitacionFormularioInput, enmascararTelefonoUsuario } from "./formulario.ts";

const valido = { fullName: "Asesor", email: "asesor@example.invalid", roleId: "2", phone: "809-555-0184", monthlyTargetDeals: "0" };

test("R2 H-03: un envío vacío explica cada campo obligatorio en español", () => {
  const resultado = InvitacionFormularioInput.safeParse({ fullName: "  ", email: "", roleId: "", phone: "" });
  assert.equal(resultado.success, false);
  if (resultado.success) return;
  assert.deepEqual(Object.fromEntries(resultado.error.issues.map(i => [i.path[0], i.message])), {
    fullName: "Escribe el nombre completo.", email: "Escribe un correo válido.", roleId: "Selecciona un rol válido.",
  });
});

test("R2 G4-03: teléfono inválido se rechaza tanto en invitación como en edición", () => {
  for (const phone of ["abc!!<b>x</b>", "123", "8095550184abc", "++18095550184"]) {
    for (const esquema of [InvitacionFormularioInput, EdicionFormularioInput]) {
      const resultado = esquema.safeParse({ ...valido, isActive: true, phone });
      assert.equal(resultado.success, false);
      if (!resultado.success) assert.ok(resultado.error.issues.some(i => i.path[0] === "phone" && i.message.startsWith("Escribe un teléfono")));
    }
  }
  assert.equal(InvitacionFormularioInput.parse(valido).phone, "+18095550184");
  assert.equal(InvitacionFormularioInput.parse({ ...valido, phone: "+34 612 345 678" }).phone, "+34612345678");
});

test("R2 H-03: máscara progresiva sin truncar ni convertir basura en un teléfono válido", () => {
  for (const [entrada, salida] of [["809", "809"], ["8095", "809-5"], ["8295550", "829-555-0"], ["8495550184", "849-555-0184"], ["", ""], ["+34 612 345 678", "+34 612 345 678"], ["abc8095550184", "abc8095550184"], ["80955501845", "80955501845"]]) {
    assert.equal(enmascararTelefonoUsuario(entrada!), salida);
  }
});

test("R2: cero es explícito, meta vacía se omite, fracciones y negativos tienen error de campo", () => {
  assert.equal(InvitacionFormularioInput.parse(valido).monthlyTargetDeals, 0);
  assert.equal(InvitacionFormularioInput.parse({ ...valido, monthlyTargetDeals: "" }).monthlyTargetDeals, undefined);
  for (const monthlyTargetDeals of ["-1", "1.5"]) {
    const resultado = InvitacionFormularioInput.safeParse({ ...valido, monthlyTargetDeals });
    assert.equal(resultado.success, false);
    if (!resultado.success) assert.equal(resultado.error.issues[0]?.path[0], "monthlyTargetDeals");
  }
});
