import assert from "node:assert/strict";
import { test } from "node:test";
import { CrearLeadInput } from "./entrada.ts";
import { CrearContactoInput, erroresDeCampos } from "../contactos/entrada.ts";

for (const [name, schema] of [["lead", CrearLeadInput], ["contacto", CrearContactoInput]] as const) {
  test(`G1-05 ${name}: nombre ausente, vacío y espacios tienen error propio de campo`, () => {
    for (const input of [{}, { fullName: "" }, { fullName: "   " }]) {
      const result = schema.safeParse(input);
      assert.equal(result.success, false);
      if (!result.success) assert.match(erroresDeCampos(result.error).fullName!, /nombre/);
    }
  });
  test(`G1-05 ${name}: teléfono y correo inválidos se rechazan en la frontera compartida`, () => {
    for (const input of [{ phone: "basura" }, { phone: "+1809" }, { email: "correo@" }]) {
      assert.equal(schema.safeParse({ fullName: "Persona", ...input }).success, false);
    }
    assert.equal(schema.safeParse({ fullName: "Persona", phone: "+1 809 555 0184", email: "persona@example.com" }).success, true);
  });
  test(`${name}: vacíos opcionales, HTML literal y campos ajenos`, () => {
    const result = schema.parse({ fullName: "<script>alert(1)</script>", phone: "", email: "", sourceId: "", brokerId: 999 });
    assert.equal(result.fullName, "<script>alert(1)</script>");
    assert.equal(result.phone, undefined);
    assert.equal("brokerId" in result, false);
  });
}
test("G1 lead: presupuesto seguro y rango coherente", () => {
  for (const values of [{ budgetMinCents: -1 }, { budgetMaxCents: 1.5 }, { budgetMaxCents: Number.MAX_SAFE_INTEGER + 1 }, { budgetMinCents: 200, budgetMaxCents: 100 }]) {
    assert.equal(CrearLeadInput.safeParse({ fullName: "Persona", ...values }).success, false);
  }
  assert.equal(CrearLeadInput.safeParse({ contactId: 1, budgetMinCents: 0, budgetMaxCents: 0 }).success, true);
});
