import { ConflictError, ValidationError } from "../errors.ts";
import { createMoney, requireNonNegative, requireSameCurrency, sumMoney } from "./dinero.ts";
import type { Money } from "./dinero.ts";
import type { TransactionState } from "./estados.ts";

export function validatePlan(total: Money, installments: readonly Money[], deposit?: Readonly<{ amount: Money; installmentIndex: number }>): void {
  requireNonNegative(total);
  if (total.cents === 0n || installments.length === 0) throw new ValidationError("El plan requiere total y cuotas positivos.");
  for (const installment of installments) {
    requireNonNegative(installment);
    if (installment.cents === 0n) throw new ValidationError("Las cuotas deben ser positivas.");
  }
  if (sumMoney(installments, total.currency).cents !== total.cents) throw new ConflictError("Las cuotas no suman el total contractual.");
  if (deposit) {
    requireNonNegative(deposit.amount);
    requireSameCurrency(total, deposit.amount);
    const installment = installments[deposit.installmentIndex];
    if (!Number.isInteger(deposit.installmentIndex) || !installment || deposit.amount.cents > installment.cents) {
      throw new ConflictError("El depósito debe aplicarse a una obligación existente, sin aumentar el total.");
    }
  }
}

export type Compensation = Readonly<{
  factId: string;
  amount: Money;
  status: "reserved" | "executed" | "released";
}>;

/** Snapshot por hecho compensatorio común: reverso y reembolso enlazados usan el mismo factId. */
export function paymentBalance(confirmed: Money, compensations: readonly Compensation[], netAllocations: readonly Money[]) {
  requireNonNegative(confirmed);
  const facts = new Map<string, Compensation>();
  let consumed = 0n;
  for (const compensation of compensations) {
    requireNonNegative(compensation.amount);
    requireSameCurrency(confirmed, compensation.amount);
    if (!compensation.factId.trim() || compensation.amount.cents === 0n || !["reserved", "executed", "released"].includes(compensation.status)) {
      throw new ValidationError("Hecho compensatorio inválido.");
    }
    const previous = facts.get(compensation.factId);
    if (previous) {
      if (previous.amount.cents !== compensation.amount.cents || previous.status !== compensation.status) throw new ConflictError("El mismo hecho compensatorio tiene contenido diferente.");
      continue;
    }
    facts.set(compensation.factId, compensation);
    if (compensation.status !== "released") consumed += compensation.amount.cents;
  }
  if (consumed > confirmed.cents) throw new ConflictError("Reversos y reembolsos exceden el pago confirmado.");
  const eligible = createMoney(confirmed.cents - consumed, confirmed.currency);
  const applied = sumMoney(netAllocations, confirmed.currency);
  if (applied.cents < 0n || applied.cents > eligible.cents) throw new ConflictError("Aplicaciones netas fuera del saldo elegible.");
  return Object.freeze({ eligible, applied, credit: createMoney(eligible.cents - applied.cents, confirmed.currency),
    applicationStatus: applied.cents === 0n ? "sin_aplicar" as const : applied.cents === eligible.cents ? "totalmente_aplicado" as const : "parcialmente_aplicado" as const });
}

export function installmentBalance(due: Money, directAllocations: readonly Money[], carryforwards: readonly Money[] = []): Money {
  requireNonNegative(due);
  const applied = sumMoney([...directAllocations, ...carryforwards], due.currency);
  if (applied.cents < 0n || applied.cents > due.cents) throw new ConflictError("Las aplicaciones netas exceden la cuota.");
  return createMoney(due.cents - applied.cents, due.currency);
}

export function validateCarryforward(sourceNet: Money, transfers: readonly Money[]): void {
  requireNonNegative(sourceNet);
  const net = sumMoney(transfers, sourceNet.currency);
  if (net.cents < 0n || net.cents > sourceNet.cents) throw new ConflictError("El crédito trasladado excede la aplicación de origen.");
}

export type Accrual = Readonly<{
  agreementId: string;
  beneficiaryId: string;
  milestoneInstanceId: string;
  sourceEventId: string;
  ruleVersion: string;
  amount: Money;
}>;

/** Dedupe puro; la restricción única y su serialización pertenecen a b1e/b2g. */
export function recognizeMilestone(existing: readonly Accrual[], candidate: Accrual) {
  requireNonNegative(candidate.amount);
  if (candidate.amount.cents === 0n || [candidate.agreementId, candidate.beneficiaryId, candidate.milestoneInstanceId, candidate.sourceEventId, candidate.ruleVersion].some(id => !id.trim())) {
    throw new ValidationError("El devengo requiere acuerdo, beneficiario, hito, origen y regla congelada.");
  }
  const previous = existing.find(entry => entry.agreementId === candidate.agreementId && entry.beneficiaryId === candidate.beneficiaryId && entry.milestoneInstanceId === candidate.milestoneInstanceId);
  if (previous) {
    requireSameCurrency(previous.amount, candidate.amount);
    if (previous.amount.cents !== candidate.amount.cents || previous.ruleVersion !== candidate.ruleVersion || previous.sourceEventId !== candidate.sourceEventId) {
      throw new ConflictError("El hito ya fue devengado con otro contenido; requiere ajuste referenciado.");
    }
    return { created: false, entries: existing };
  }
  const entry = Object.freeze({ agreementId: candidate.agreementId, beneficiaryId: candidate.beneficiaryId, milestoneInstanceId: candidate.milestoneInstanceId,
    sourceEventId: candidate.sourceEventId, ruleVersion: candidate.ruleVersion, amount: createMoney(candidate.amount.cents, candidate.amount.currency) });
  return { created: true, entries: Object.freeze([...existing, entry]) };
}

export type PayoutObligation = Readonly<{ id: string; state: TransactionState<"commission">; amount: Money }>;

export function payoutTotal(obligations: readonly PayoutObligation[]): Money {
  const first = obligations[0];
  if (!first || new Set(obligations.map(entry => entry.id)).size !== obligations.length) throw new ConflictError("El lote requiere obligaciones únicas.");
  for (const entry of obligations) {
    requireNonNegative(entry.amount);
    if (!entry.id.trim() || entry.state !== "exigible" || entry.amount.cents === 0n) throw new ConflictError("Solo se seleccionan obligaciones exigibles con saldo positivo.");
  }
  return sumMoney(obligations.map(entry => entry.amount), first.amount.currency);
}

/** El bruto del comprador no se reduce por la comisión del procesador. */
export function validateProcessorAmounts(gross: Money, fee: Money, net: Money): void {
  requireNonNegative(gross);
  requireNonNegative(fee);
  requireNonNegative(net);
  requireSameCurrency(gross, fee);
  requireSameCurrency(gross, net);
  if (gross.cents - fee.cents !== net.cents) throw new ConflictError("Bruto, comisión y neto no concilian.");
}
