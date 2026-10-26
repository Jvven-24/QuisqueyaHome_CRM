import assert from "node:assert/strict";
import { test } from "node:test";
import { FijarMetaInput, leerObjetivoFormulario } from "./validacion.ts";

const base = { brokerId: null, year: 2026, month: 10 };

test("H-01: campo vacío y espacios no se convierten en cero", () => {
  for (const texto of ["", " ", "\t"]) {
    assert.equal(leerObjetivoFormulario(texto), undefined);
    const resultado = FijarMetaInput.safeParse({ ...base, targetDeals: leerObjetivoFormulario(texto) });
    assert.equal(resultado.success, false);
    if (!resultado.success) assert.equal(resultado.error.issues[0]?.path[0], "targetDeals");
  }
});

test("meta: rechaza omitido, null, texto, fracciones, negativos y desbordes de integer", () => {
  for (const targetDeals of [undefined, null, "", "4", NaN, Infinity, -1, 1.5, 2147483648]) {
    assert.equal(FijarMetaInput.safeParse({ ...base, targetDeals }).success, false);
  }
});

test("meta: cero explícito conserva el estado sin meta; enteros válidos se aceptan", () => {
  for (const texto of ["0", "4", "2147483647"]) {
    const resultado = FijarMetaInput.parse({ ...base, targetDeals: leerObjetivoFormulario(texto) });
    assert.equal(resultado.targetDeals, Number(texto));
  }
});
