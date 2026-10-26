import assert from "node:assert/strict";
import { test } from "node:test";
import { ValidationError } from "../../domain/errors.ts";
import { prepararReparto } from "./reparto.ts";

test("reparto: vacío, basura y valores fuera de rango nunca se normalizan a cero", () => {
  for (const valor of ["", " ", "abc", "-1", "101", "50.001", "Infinity"]) {
    assert.throws(() => prepararReparto(101, valor), ValidationError);
  }
});
test("reparto: conserva centavos y los porcentajes explícitos 0, 50.25 y 100", () => {
  for (const porcentaje of ["0", "50.25", "100"]) {
    const reparto = prepararReparto(101, porcentaje);
    assert.equal(reparto.brokerAmountCents + reparto.agencyAmountCents, 101);
    assert.equal(reparto.brokerShareBasisPoints + reparto.agencyShareBasisPoints, 10000);
  }
});
