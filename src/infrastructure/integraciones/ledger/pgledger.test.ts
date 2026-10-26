import assert from "node:assert/strict";
import { test } from "node:test";
import { decimalDesdeCentavos } from "./pgledger.ts";

test("libro: conversión exacta hasta bigint sin pasar por Number", () => {
  for (const [c, d] of [["1", "0.01"], ["12345", "123.45"],
    ["9007199254740993", "90071992547409.93"],
    ["9223372036854775807", "92233720368547758.07"]]) {
    assert.equal(decimalDesdeCentavos(c!), d);
  }
});

test("libro: rechaza representaciones ambiguas, fracciones y exceso", () => {
  for (const c of ["0", "-1", "01", "1.1", "1e2", " 1", "1 ", "NaN", "Infinity",
    "9223372036854775808", 123]) {
    assert.throws(() => decimalDesdeCentavos(c as string));
  }
});
