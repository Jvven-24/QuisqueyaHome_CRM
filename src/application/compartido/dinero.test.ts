import assert from "node:assert/strict";
import { test } from "node:test";
import { CentavosFirmados, CentavosNoNegativos, CentavosPositivos, EntradaDinero, fromLegacyCents, moneyToDto, toLegacyCents } from "./dinero.ts";
import { MAX_CENTS, MIN_CENTS, createMoney } from "../../domain/transaccion/dinero.ts";
import { ValidationError } from "../../domain/errors.ts";

test("TX-45/H-m01: texto/BigInt/JSON preservan 9007199254740993 sin number", () => {
  const input = EntradaDinero.parse({ cents: "9007199254740993", currency: "USD" });
  assert.equal(input.cents, 9007199254740993n);
  const json = JSON.stringify(moneyToDto(input));
  assert.equal(json, '{"cents":"9007199254740993","currency":"USD"}');
  assert.deepEqual(EntradaDinero.parse(JSON.parse(json)), input);
  for (const cents of [0n, MAX_CENTS]) assert.equal(CentavosNoNegativos.parse(cents.toString()), cents);
  for (const cents of [MIN_CENTS, -1n, 0n, MAX_CENTS]) assert.equal(CentavosFirmados.parse(cents.toString()), cents);
  assert.equal(CentavosPositivos.parse("1"), 1n);
  assert.equal(CentavosPositivos.safeParse("0").success, false);
});

test("TX-45: rechaza coerciones, overflow, espacios, exponente, fracción y ceros iniciales", () => {
  const invalid: unknown[] = ["", "-0", "+1", "00", "01", "-01", "1.0", "1e3", " 1", "1 ", "1\n", "\t1", "０", 1, 9007199254740992, 1n, null, undefined, {}, [], "9".repeat(1000)];
  for (const value of invalid) {
    assert.equal(CentavosNoNegativos.safeParse(value).success, false, String(value));
    assert.equal(CentavosFirmados.safeParse(value).success, false, String(value));
  }
  for (const value of [(MAX_CENTS + 1n).toString(), (MIN_CENTS - 1n).toString()]) assert.equal(CentavosFirmados.safeParse(value).success, false);
  assert.equal(CentavosNoNegativos.safeParse("-1").success, false);
  assert.equal(CentavosNoNegativos.safeParse((MAX_CENTS + 1n).toString()).success, false);
  assert.equal(EntradaDinero.safeParse({ cents: "1", currency: "EUR" }).success, false);
  assert.equal(EntradaDinero.safeParse({ cents: "1", currency: "USD", approved: true }).success, false);
});

test("puente legacy seguro falla antes de convertir importes inseguros; releer texto", () => {
  for (const value of [Number.MIN_SAFE_INTEGER, -1, 0, 1, Number.MAX_SAFE_INTEGER]) assert.equal(toLegacyCents(fromLegacyCents(value)), value);
  for (const value of [NaN, Infinity, -Infinity, 1.1, Number.MAX_SAFE_INTEGER + 1, Number.MIN_SAFE_INTEGER - 1, "1" as unknown as number]) {
    assert.throws(() => fromLegacyCents(value), ValidationError);
  }
  assert.throws(() => toLegacyCents(9007199254740993n), ValidationError);
  assert.throws(() => toLegacyCents(-9007199254740993n), ValidationError);
  assert.throws(() => toLegacyCents(MAX_CENTS + 1n), ValidationError);
  assert.deepEqual(moneyToDto(createMoney(MIN_CENTS, "DOP")), { cents: MIN_CENTS.toString(), currency: "DOP" });
});
