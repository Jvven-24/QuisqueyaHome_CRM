import assert from "node:assert/strict";
import { test } from "node:test";
import { ConflictError, ValidationError } from "../errors.ts";
import { extendHold, transitionState } from "./estados.ts";
import type { Machine, TransitionContext, TransitionFacts } from "./estados.ts";

const facts: TransitionFacts = {
  availabilityVerified: true, commitmentRecorded: true, commitmentResolved: true, saleRecorded: true, ownCommitmentConsumed: true,
  ownCommitmentActive: true, conditionsSatisfied: true, paymentVerified: true, expirationVerified: true, transferAtomic: true,
  compensationRecorded: true, balanceZero: true, balancePositive: true, planBalanced: true, agreementPresent: true, replacementBalanced: true,
  contractualMilestone: true, independentReview: true, paymentConditionMet: true, bankReconciled: true, cancellationApproved: true,
  cancellationRejected: true, accountVersionMatches: true, mfaSatisfied: true, eligibleLines: true, instructionRecorded: true,
  externalEvidence: true, someLinesReconciled: true, allLinesReconciled: true, policyApproved: true, capacityAvailable: true,
};
const context: TransitionContext = { actorId: "actor-1", source: "servidor", previousVersion: 1, evidenceIds: ["evidencia-opaca"], reason: "Hecho verificado", correlationId: "correlacion-1", facts };

// Oráculo de aristas de §4.2, independiente del catálogo de implementación.
const graphs: Record<Machine, Record<string, readonly string[]>> = {
  unit: { por_confirmar: ["disponible"], disponible: ["comprometida", "vendida"], comprometida: ["disponible", "vendida"], vendida: [] },
  hold: { activo: ["convertido", "cancelado", "expirado"], convertido: [], cancelado: [], expirado: [] },
  reservation: { borrador: ["pendiente_pago", "expirada"], pendiente_pago: ["en_verificacion", "expirada"], en_verificacion: ["confirmada", "expirada"], confirmada: ["cancelacion_solicitada"], cancelacion_solicitada: ["cancelada", "confirmada"], cancelada: [], expirada: [] },
  payment: { pendiente: ["confirmado", "rechazado"], confirmado: ["reversado_parcial", "reversado_total", "contracargo"], reversado_parcial: ["reversado_total", "contracargo"], reversado_total: [], contracargo: [], rechazado: [] },
  plan: { borrador: ["acordado_activo"], acordado_activo: ["completado", "sustituido"], completado: ["acordado_activo"], sustituido: [] },
  commission: { esperada: ["devengada", "retirada"], devengada: ["aprobada"], aprobada: ["exigible"], exigible: ["pagada"], pagada: [], retirada: [] },
  refund: { solicitado: ["aprobado", "rechazado"], aprobado: ["pendiente_ejecucion"], pendiente_ejecucion: ["enviado", "fallido", "desconocido"], enviado: ["confirmado", "fallido", "desconocido"], desconocido: ["confirmado", "fallido"], confirmado: [], rechazado: [], fallido: [] },
  batch: { borrador: ["pendiente_aprobacion", "cancelado"], pendiente_aprobacion: ["aprobado", "cancelado"], aprobado: ["instruido", "cancelado"], instruido: ["parcialmente_conciliado", "conciliado"], parcialmente_conciliado: ["conciliado"], conciliado: [], cancelado: [] },
};

for (const machine of Object.keys(graphs) as Machine[]) {
  test(`M40 ${machine}: cada arista y cada salto prohibido, incluidos estados terminales`, () => {
    const graph = graphs[machine];
    for (const [from, destinations] of Object.entries(graph)) {
      for (const to of Object.keys(graph)) {
        const run = () => transitionState(machine, from as never, to as never, context);
        if (destinations.includes(to)) {
          const result = run();
          assert.equal(result.previousState, from);
          assert.equal(result.state, to);
          assert.equal(result.version, 2);
        } else assert.throws(run, ConflictError, `${machine}: ${from} → ${to}`);
      }
      assert.throws(() => transitionState(machine, from as never, "desconocido-invalido" as never, context), ConflictError);
    }
    assert.throws(() => transitionState(machine, "invalido" as never, "invalido" as never, context), ConflictError);
  });
}

const gates: [Machine, string, string, (keyof TransitionFacts)[]][] = [
  ["unit", "por_confirmar", "disponible", ["availabilityVerified"]],
  ["unit", "disponible", "comprometida", ["availabilityVerified", "commitmentRecorded"]],
  ["unit", "comprometida", "disponible", ["availabilityVerified", "commitmentResolved"]],
  ["unit", "disponible", "vendida", ["saleRecorded", "availabilityVerified"]],
  ["unit", "comprometida", "vendida", ["saleRecorded", "ownCommitmentConsumed"]],
  ["hold", "activo", "convertido", ["ownCommitmentActive", "transferAtomic"]],
  ["hold", "activo", "expirado", ["expirationVerified"]],
  ["reservation", "en_verificacion", "confirmada", ["ownCommitmentActive", "conditionsSatisfied", "paymentVerified"]],
  ["reservation", "cancelacion_solicitada", "confirmada", ["cancellationRejected"]],
  ["reservation", "cancelacion_solicitada", "cancelada", ["cancellationApproved"]],
  ["reservation", "borrador", "expirada", ["expirationVerified"]],
  ["reservation", "pendiente_pago", "expirada", ["expirationVerified"]],
  ["reservation", "en_verificacion", "expirada", ["expirationVerified"]],
  ["payment", "pendiente", "confirmado", ["paymentVerified", "independentReview"]],
  ["payment", "confirmado", "reversado_parcial", ["compensationRecorded", "balancePositive"]],
  ["payment", "confirmado", "reversado_total", ["compensationRecorded", "balanceZero"]],
  ["payment", "reversado_parcial", "reversado_total", ["compensationRecorded", "balanceZero"]],
  ["payment", "confirmado", "contracargo", ["compensationRecorded", "externalEvidence"]],
  ["payment", "reversado_parcial", "contracargo", ["compensationRecorded", "externalEvidence"]],
  ["plan", "borrador", "acordado_activo", ["planBalanced", "agreementPresent"]],
  ["plan", "acordado_activo", "completado", ["balanceZero"]],
  ["plan", "completado", "acordado_activo", ["compensationRecorded", "balancePositive"]],
  ["plan", "acordado_activo", "sustituido", ["replacementBalanced", "agreementPresent"]],
  ["commission", "esperada", "devengada", ["contractualMilestone", "agreementPresent"]],
  ["commission", "devengada", "aprobada", ["independentReview"]],
  ["commission", "aprobada", "exigible", ["paymentConditionMet"]],
  ["commission", "exigible", "pagada", ["bankReconciled", "balanceZero"]],
  ["refund", "solicitado", "aprobado", ["independentReview", "accountVersionMatches"]],
  ["refund", "aprobado", "pendiente_ejecucion", ["accountVersionMatches", "mfaSatisfied"]],
  ["refund", "pendiente_ejecucion", "enviado", ["instructionRecorded"]],
  ["refund", "enviado", "confirmado", ["externalEvidence"]],
  ["refund", "enviado", "fallido", ["externalEvidence"]],
  ["refund", "pendiente_ejecucion", "fallido", ["externalEvidence"]],
  ["refund", "desconocido", "confirmado", ["externalEvidence"]],
  ["refund", "desconocido", "fallido", ["externalEvidence"]],
  ["batch", "borrador", "pendiente_aprobacion", ["eligibleLines", "accountVersionMatches"]],
  ["batch", "pendiente_aprobacion", "aprobado", ["independentReview", "mfaSatisfied", "accountVersionMatches"]],
  ["batch", "aprobado", "instruido", ["instructionRecorded", "accountVersionMatches"]],
  ["batch", "instruido", "parcialmente_conciliado", ["someLinesReconciled", "externalEvidence"]],
  ["batch", "instruido", "conciliado", ["allLinesReconciled", "externalEvidence"]],
  ["batch", "parcialmente_conciliado", "conciliado", ["allLinesReconciled", "externalEvidence"]],
];

test("cada condición de transición falla cerrada si falta o es falsa", () => {
  for (const [machine, from, to, required] of gates) {
    for (const fact of required) {
      for (const value of [false, undefined]) {
        assert.throws(() => transitionState(machine, from as never, to as never, { ...context, facts: { ...facts, [fact]: value } }), ConflictError, `${machine}: ${from} → ${to}; ${fact}=${value}`);
      }
    }
  }
});

test("transición conserva trazabilidad y copia evidencia; versión PostgreSQL válida", () => {
  const evidence = ["evidencia-1"];
  const result = transitionState("hold", "activo", "cancelado", { ...context, previousVersion: 7, evidenceIds: evidence });
  evidence.push("posterior");
  assert.deepEqual(result, { machine: "hold", previousState: "activo", state: "cancelado", previousVersion: 7, version: 8,
    actorId: "actor-1", source: "servidor", evidenceIds: ["evidencia-1"], reason: "Hecho verificado", correlationId: "correlacion-1" });
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.evidenceIds));
  for (const previousVersion of [0, -1, 1.5, NaN, 2147483647]) {
    assert.throws(() => transitionState("hold", "activo", "cancelado", { ...context, previousVersion }), ValidationError);
  }
  for (const field of ["actorId", "source", "reason", "correlationId"] as const) {
    assert.throws(() => transitionState("hold", "activo", "cancelado", { ...context, [field]: " " }), ValidationError);
  }
  for (const evidenceIds of [[], [""]]) assert.throws(() => transitionState("hold", "activo", "cancelado", { ...context, evidenceIds }), ValidationError);
  assert.throws(() => transitionState("__proto__" as Machine, "x" as never, "y" as never, context), ValidationError);
});

test("hold se extiende con aprobación y cupo: sigue activo, nueva versión; terminal no se extiende", () => {
  assert.equal(extendHold("activo", context).version, 2);
  assert.equal(extendHold("activo", context).state, "activo");
  for (const state of ["convertido", "cancelado", "expirado"] as const) assert.throws(() => extendHold(state, context), ConflictError);
  for (const fact of ["ownCommitmentActive", "policyApproved", "independentReview", "capacityAvailable"] as const) {
    assert.throws(() => extendHold("activo", { ...context, facts: { ...facts, [fact]: false } }), ConflictError);
  }
});

test("TX-09: comprobante/redirect solo permite revisión; no acredita confirmación ni venta", () => {
  assert.equal(transitionState("reservation", "pendiente_pago", "en_verificacion", { ...context, facts: {} }).state, "en_verificacion");
  assert.throws(() => transitionState("reservation", "pendiente_pago", "confirmada", context), ConflictError);
  assert.throws(() => transitionState("reservation", "en_verificacion", "confirmada", { ...context, facts: { ownCommitmentActive: true, conditionsSatisfied: true } }), ConflictError);
  assert.throws(() => transitionState("payment", "pendiente", "confirmado", { ...context, facts: {} }), ConflictError);
  assert.throws(() => transitionState("unit", "disponible", "vendida", { ...context, facts: { paymentVerified: true } }), ConflictError);
});

test("TX-18: reverso/contracargo solo emite hecho del pago; venta durable no se reabre", () => {
  const unit = Object.freeze({ state: "vendida", id: "unidad-ajena" });
  const result = transitionState("payment", "confirmado", "contracargo", context);
  assert.equal(result.machine, "payment");
  assert.equal(Object.hasOwn(result, "unit"), false);
  assert.deepEqual(unit, { state: "vendida", id: "unidad-ajena" });
  assert.throws(() => transitionState("unit", "vendida", "disponible", context), ConflictError);
  assert.throws(() => transitionState("commission", "pagada", "esperada", context), ConflictError);
});

test("TX-19/23: proyección, pago parcial o exportación no acreditan comisión pagada", () => {
  assert.throws(() => transitionState("commission", "esperada", "exigible", context), ConflictError);
  assert.throws(() => transitionState("commission", "exigible", "pagada", { ...context, facts: { bankReconciled: true, balanceZero: false } }), ConflictError);
  assert.throws(() => transitionState("commission", "exigible", "pagada", { ...context, facts: { instructionRecorded: true, balanceZero: true } }), ConflictError);
  assert.throws(() => transitionState("refund", "desconocido", "enviado", context), ConflictError);
});
