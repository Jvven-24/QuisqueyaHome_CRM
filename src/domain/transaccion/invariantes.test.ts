import assert from "node:assert/strict";
import { test } from "node:test";
import { ConflictError, ValidationError } from "../errors.ts";
import { createMoney } from "./dinero.ts";
import { installmentBalance, paymentBalance, payoutTotal, recognizeMilestone, validateCarryforward, validatePlan, validateProcessorAmounts } from "./invariantes.ts";
import type { Accrual, Compensation } from "./invariantes.ts";

const usd = (cents: bigint) => createMoney(cents, "USD");
const dop = (cents: bigint) => createMoney(cents, "DOP");

test("plan suma total contractual; depósito aplicado a cuota no se suma otra vez", () => {
  const installments = [usd(2000n), usd(3000n), usd(5000n)];
  validatePlan(usd(10000n), installments, { amount: usd(2000n), installmentIndex: 0 });
  assert.throws(() => validatePlan(usd(12000n), installments, { amount: usd(2000n), installmentIndex: 0 }), ConflictError);
  for (const installments of [[], [usd(0n)], [usd(-1n)]]) assert.throws(() => validatePlan(usd(1n), installments), ValidationError);
  assert.throws(() => validatePlan(usd(0n), [usd(1n)]), ValidationError);
  assert.throws(() => validatePlan(usd(1n), [dop(1n)]), ValidationError);
  assert.throws(() => validatePlan(usd(10000n), installments, { amount: usd(2001n), installmentIndex: 0 }), ConflictError);
  assert.throws(() => validatePlan(usd(10000n), installments, { amount: usd(1n), installmentIndex: 3 }), ConflictError);
});

test("TX-12: pago 1200, cuota 1000: aplicación 1000, crédito no aplicado 200", () => {
  assert.deepEqual(paymentBalance(usd(1200n), [], [usd(1000n)]), { eligible: usd(1200n), applied: usd(1000n), credit: usd(200n), applicationStatus: "parcialmente_aplicado" });
  assert.equal(paymentBalance(usd(1200n), [], []).applicationStatus, "sin_aplicar");
  assert.equal(paymentBalance(usd(1200n), [], [usd(1200n)]).applicationStatus, "totalmente_aplicado");
  assert.equal(installmentBalance(usd(1000n), [usd(1000n)]).cents, 0n);
  assert.throws(() => installmentBalance(usd(1000n), [usd(1001n)]), ConflictError);
  assert.throws(() => paymentBalance(usd(1200n), [], [usd(1201n)]), ConflictError);
  assert.throws(() => paymentBalance(usd(1200n), [], [usd(-1n)]), ConflictError);
  assert.throws(() => paymentBalance(usd(1200n), [], [dop(1n)]), ValidationError);
});

test("TX-13/18: compensaciones conservan originales y reabren saldo, sin tocar inventario", () => {
  const original = Object.freeze([usd(1000n)]);
  const compensations: readonly Compensation[] = Object.freeze([{ factId: "reverso-1", amount: usd(300n), status: "executed" }]);
  assert.equal(installmentBalance(usd(1000n), [...original, usd(-300n)]).cents, 300n);
  const result = paymentBalance(usd(1200n), compensations, [...original, usd(-300n)]);
  assert.equal(result.eligible.cents, 900n);
  assert.equal(result.credit.cents, 200n);
  assert.deepEqual(original, [usd(1000n)]);
  assert.deepEqual(compensations, [{ factId: "reverso-1", amount: usd(300n), status: "executed" }]);
  assert.equal(Object.hasOwn(result, "unit"), false);
});

test("saldo común reverso/reembolso: pendiente reserva dinero y mismo hecho no descuenta dos veces", () => {
  const refund: Compensation = { factId: "hecho-1", amount: usd(60000n), status: "reserved" };
  assert.equal(paymentBalance(usd(100000n), [refund], []).eligible.cents, 40000n);
  assert.throws(() => paymentBalance(usd(100000n), [refund, { ...refund, factId: "hecho-2" }], []), ConflictError);
  const executed: Compensation = { ...refund, status: "executed" };
  assert.equal(paymentBalance(usd(100000n), [executed, executed], []).eligible.cents, 40000n);
  assert.equal(paymentBalance(usd(100000n), [{ ...refund, status: "released" }], []).eligible.cents, 100000n);
  assert.throws(() => paymentBalance(usd(100000n), [executed, { ...executed, amount: usd(1n) }], []), ConflictError);
  assert.throws(() => paymentBalance(usd(100000n), [executed, refund], []), ConflictError);
  assert.throws(() => paymentBalance(usd(100000n), [{ ...refund, factId: "" }], []), ValidationError);
  assert.throws(() => paymentBalance(usd(100000n), [{ ...refund, amount: usd(0n) }], []), ValidationError);
});

test("crédito trasladado cuenta solo en calendario activo y nunca excede origen/destino", () => {
  validateCarryforward(usd(1000n), [usd(600n), usd(400n)]);
  assert.throws(() => validateCarryforward(usd(1000n), [usd(1001n)]), ConflictError);
  assert.throws(() => validateCarryforward(usd(1000n), [usd(-1n)]), ConflictError);
  assert.equal(installmentBalance(usd(1200n), [usd(100n)], [usd(1000n)]).cents, 100n);
  assert.throws(() => installmentBalance(usd(1000n), [usd(1n)], [usd(1000n)]), ConflictError);
  assert.equal(installmentBalance(usd(1200n), [usd(100n)], [usd(1000n), usd(-300n)]).cents, 400n);
});

test("TX-19: hito repetido no duplica devengo ni recalcula historia con regla nueva", () => {
  const candidate: Accrual = { agreementId: "acuerdo-v1", beneficiaryId: "broker-1", milestoneInstanceId: "hito-1", sourceEventId: "evento-1", ruleVersion: "regla-v1", amount: usd(1000n) };
  const first = recognizeMilestone([], candidate);
  assert.equal(first.created, true);
  const repeated = recognizeMilestone(first.entries, { ...candidate });
  assert.equal(repeated.created, false);
  assert.equal(repeated.entries, first.entries);
  assert.equal(first.entries.length, 1);
  for (const changed of [{ ...candidate, amount: usd(1001n) }, { ...candidate, ruleVersion: "regla-v2" }, { ...candidate, sourceEventId: "evento-2" }]) {
    assert.throws(() => recognizeMilestone(first.entries, changed), ConflictError);
  }
  assert.equal(recognizeMilestone(first.entries, { ...candidate, milestoneInstanceId: "hito-2" }).entries.length, 2);
  assert.throws(() => recognizeMilestone([], { ...candidate, amount: usd(0n) }), ValidationError);
  assert.throws(() => recognizeMilestone([], { ...candidate, sourceEventId: "" }), ValidationError);
});

test("TX-19/24: lote suma obligaciones exigibles únicas, en una sola moneda", () => {
  const eligible = { id: "obligacion-1", state: "exigible" as const, amount: usd(3500n) };
  assert.equal(payoutTotal([eligible, { ...eligible, id: "obligacion-2", amount: usd(5300n) }]).cents, 8800n);
  for (const state of ["esperada", "devengada", "aprobada", "pagada", "retirada"] as const) {
    assert.throws(() => payoutTotal([{ ...eligible, state }]), ConflictError);
  }
  assert.throws(() => payoutTotal([]), ConflictError);
  assert.throws(() => payoutTotal([eligible, eligible]), ConflictError);
  assert.throws(() => payoutTotal([eligible, { ...eligible, id: "otra", amount: dop(1n) }]), ValidationError);
});

test("bruto comprador, comisión procesador y neto separados; USD y DOP nunca se suman", () => {
  validateProcessorAmounts(usd(10000n), usd(300n), usd(9700n));
  assert.throws(() => validateProcessorAmounts(usd(10000n), usd(300n), usd(10000n)), ConflictError);
  assert.throws(() => validateProcessorAmounts(usd(10000n), dop(300n), usd(9700n)), ValidationError);
  assert.throws(() => validateProcessorAmounts(usd(100n), usd(-1n), usd(101n)), ValidationError);
});
