import assert from "node:assert/strict";
import { test } from "node:test";
import { ValidationError } from "../errors.ts";
import { MAX_CENTS, MIN_CENTS, allocateCommission, allocateInstallments, convertMoney, createFxRate, createMoney, divideRounded, fxDifference, moneyToDecimal, payoutNet, sumMoney } from "./dinero.ts";
import type { Currency, RoundingMode } from "./dinero.ts";

const usd = (cents: bigint) => createMoney(cents, "USD");
const dop = (cents: bigint) => createMoney(cents, "DOP");

test("TX-45: dominio conserva entero superior a Number.MAX_SAFE_INTEGER y límites PostgreSQL", () => {
  for (const cents of [MIN_CENTS, -1n, 0n, 9007199254740993n, MAX_CENTS]) assert.equal(usd(cents).cents, cents);
  for (const cents of [MIN_CENTS - 1n, MAX_CENTS + 1n, 1 as unknown as bigint]) assert.throws(() => usd(cents), ValidationError);
  assert.throws(() => createMoney(1n, "EUR" as Currency), ValidationError);
  assert.throws(() => sumMoney([usd(MAX_CENTS), usd(1n)], "USD"), ValidationError);
  assert.throws(() => sumMoney([usd(1n), dop(1n)], "USD"), ValidationError);
  assert.ok(Object.isFrozen(usd(1n)));
});

test("TX-11: 10001 se divide en 3333, 3333, 3335 con todo el residual al final", () => {
  assert.deepEqual(allocateInstallments(usd(10001n), [1n, 1n, 1n]).map(value => value.cents), [3333n, 3333n, 3335n]);
  assert.deepEqual(allocateInstallments(usd(10001n), [2n, 3n, 5n]).map(value => value.cents), [2000n, 3000n, 5001n]);
  assert.deepEqual(allocateInstallments(usd(MAX_CENTS), [1n]), [usd(MAX_CENTS)]);
  for (const [amount, weights] of [[-1n, [1n]], [1n, []], [1n, [0n]], [1n, [-1n]], [1n, [1n, 1n]]] as const) {
    assert.throws(() => allocateInstallments(usd(amount), weights), ValidationError);
  }
});

test("repartos conservan la suma incluso con totales grandes y pesos desiguales", () => {
  for (const total of [19n, 10001n, 9007199254740993n, MAX_CENTS]) {
    for (const weights of [[1n, 1n, 1n], [1n, 2n, 7n], [3n]]) {
      assert.equal(sumMoney(allocateInstallments(usd(total), weights), "USD").cents, total);
    }
  }
});

test("redondeo racional explícito: signos, empates pares y cantidades grandes", () => {
  const cases: [bigint, bigint, RoundingMode, bigint][] = [
    [5n, 2n, "towards_zero", 2n], [-5n, 2n, "towards_zero", -2n],
    [5n, 2n, "floor", 2n], [-5n, 2n, "floor", -3n], [5n, 2n, "ceil", 3n], [-5n, 2n, "ceil", -2n],
    [5n, 2n, "half_even", 2n], [7n, 2n, "half_even", 4n], [-5n, 2n, "half_even", -2n], [-7n, 2n, "half_even", -4n],
    [4n, 3n, "half_even", 1n], [-5n, 3n, "half_even", -2n], [0n, 3n, "floor", 0n],
    [18014398509481986n, 2n, "half_even", 9007199254740993n],
  ];
  for (const [numerator, denominator, mode, expected] of cases) assert.equal(divideRounded(numerator, denominator, mode), expected);
  for (const denominator of [0n, -1n]) assert.throws(() => divideRounded(1n, denominator, "floor"), ValidationError);
  assert.throws(() => divideRounded(1n, 2n, "unknown" as RoundingMode), ValidationError);
});

test("TX-14/15: DOP 6210 a 62.10 = USD 100; referencia 58 informa DOP 410 sin alterar contrato", () => {
  const contracted = createFxRate("USD", "DOP", "62.10", "half_even", "acuerdo", "v1");
  const reference = createFxRate("USD", "DOP", "58.00", "half_even", "reporte", "v2");
  assert.deepEqual(convertMoney(dop(621000n), "USD", contracted), usd(10000n));
  assert.deepEqual(convertMoney(usd(10000n), "DOP", contracted), dop(621000n));
  assert.deepEqual(fxDifference(usd(10000n), contracted, reference), dop(41000n));
  assert.deepEqual(convertMoney(dop(621000n), "USD", contracted), usd(10000n));
  assert.ok(Object.isFrozen(contracted));
  const fractional = createFxRate("USD", "DOP", "1.000000000001", "half_even", "acuerdo", "v3");
  assert.equal(convertMoney(usd(1000000000000n), "DOP", fractional).cents, 1000000000001n);
  assert.throws(() => convertMoney(usd(1n), "USD", contracted), ValidationError);
  assert.throws(() => fxDifference(dop(1n), contracted, reference), ValidationError);
  assert.throws(() => convertMoney(usd(MAX_CENTS), "DOP", contracted), ValidationError);
  assert.throws(() => convertMoney(usd(1n), "DOP", { ...contracted, denominator: 0n }), ValidationError);
});

test("FX rechaza tasa sin fuente/versión/política, fracciones fuera de escala y coerciones", () => {
  for (const decimal of ["0", "0.0", "-1", "01", " 62.10", "62.10 ", "1e2", ".5", "1.", "1.0000000000001", "1000000000000", 62.1 as unknown as string]) {
    assert.throws(() => createFxRate("USD", "DOP", decimal, "half_even", "acuerdo", "v1"), ValidationError);
  }
  assert.throws(() => createFxRate("USD", "USD", "1", "floor", "acuerdo", "v1"), ValidationError);
  assert.throws(() => createFxRate("USD", "DOP", "1", "floor", "", "v1"), ValidationError);
  assert.throws(() => createFxRate("USD", "DOP", "1", "floor", "acuerdo", ""), ValidationError);
});

test("reparto de comisión determinista explica el receptor y cuantía del residual", () => {
  const shares = [{ beneficiaryId: "b", weight: 1n }, { beneficiaryId: "a", weight: 1n }, { beneficiaryId: "c", weight: 1n }];
  const result = allocateCommission(usd(10001n), shares, "b");
  assert.deepEqual(result.shares.map(share => [share.beneficiaryId, share.amount.cents]), [["a", 3333n], ["b", 3335n], ["c", 3333n]]);
  assert.equal(result.residual.cents, 2n);
  assert.deepEqual(allocateCommission(usd(10001n), [...shares].reverse(), "b"), result);
  assert.equal(sumMoney(result.shares.map(share => share.amount), "USD").cents, 10001n);
  for (const invalid of [[], [shares[0]!, shares[0]!], [{ beneficiaryId: "b", weight: 0n }], [{ beneficiaryId: "", weight: 1n }]]) {
    assert.throws(() => allocateCommission(usd(10n), invalid, "b"), ValidationError);
  }
  assert.throws(() => allocateCommission(usd(10n), shares, "missing"), ValidationError);
});

test("TX-24: 10000 bruto -1000 retención -200 ajuste = 8800 neto", () => {
  assert.deepEqual(payoutNet(usd(10000n), usd(1000n), usd(-200n)), usd(8800n));
  const lines = [payoutNet(usd(4000n), usd(400n), usd(-100n)), payoutNet(usd(6000n), usd(600n), usd(-100n))];
  assert.deepEqual(sumMoney(lines, "USD"), usd(8800n));
  assert.throws(() => payoutNet(usd(100n), usd(101n), usd(0n)), ValidationError);
  assert.throws(() => payoutNet(usd(100n), usd(0n), usd(-101n)), ValidationError);
  assert.throws(() => payoutNet(usd(100n), dop(0n), usd(0n)), ValidationError);
});

test("ledger decimal exacto, incluidos mínimo negativo y centavo", () => {
  assert.equal(moneyToDecimal(usd(12345n)), "123.45");
  assert.equal(moneyToDecimal(usd(-1n)), "-0.01");
  assert.equal(moneyToDecimal(usd(0n)), "0.00");
  assert.equal(moneyToDecimal(usd(MIN_CENTS)), "-92233720368547758.08");
  assert.equal(moneyToDecimal(usd(9007199254740993n)), "90071992547409.93");
});
