import { ConflictError, ValidationError } from "../errors.ts";

/** M40 §4.2: solo aristas explícitas. Retiro/cancelación con política pendiente no se habilitan. */
const TRANSITIONS = {
  unit: {
    por_confirmar: ["disponible"], disponible: ["comprometida", "vendida"],
    comprometida: ["disponible", "vendida"], vendida: [],
  },
  hold: { activo: ["convertido", "cancelado", "expirado"], convertido: [], cancelado: [], expirado: [] },
  reservation: {
    borrador: ["pendiente_pago", "expirada"], pendiente_pago: ["en_verificacion", "expirada"],
    en_verificacion: ["confirmada", "expirada"], confirmada: ["cancelacion_solicitada"],
    cancelacion_solicitada: ["cancelada", "confirmada"], cancelada: [], expirada: [],
  },
  payment: {
    pendiente: ["confirmado", "rechazado"], confirmado: ["reversado_parcial", "reversado_total", "contracargo"],
    reversado_parcial: ["reversado_total", "contracargo"], reversado_total: [], contracargo: [], rechazado: [],
  },
  plan: { borrador: ["acordado_activo"], acordado_activo: ["completado", "sustituido"], completado: ["acordado_activo"], sustituido: [] },
  commission: { esperada: ["devengada", "retirada"], devengada: ["aprobada"], aprobada: ["exigible"], exigible: ["pagada"], pagada: [], retirada: [] },
  refund: {
    solicitado: ["aprobado", "rechazado"], aprobado: ["pendiente_ejecucion"], pendiente_ejecucion: ["enviado", "fallido", "desconocido"],
    enviado: ["confirmado", "fallido", "desconocido"], desconocido: ["confirmado", "fallido"], confirmado: [], rechazado: [], fallido: [],
  },
  batch: {
    borrador: ["pendiente_aprobacion", "cancelado"], pendiente_aprobacion: ["aprobado", "cancelado"],
    aprobado: ["instruido", "cancelado"], instruido: ["parcialmente_conciliado", "conciliado"],
    parcialmente_conciliado: ["conciliado"], conciliado: [], cancelado: [],
  },
} as const;

export type Machine = keyof typeof TRANSITIONS;
export type TransactionState<M extends Machine> = keyof (typeof TRANSITIONS)[M] & string;
export type TransitionFacts = Readonly<Partial<Record<
  | "availabilityVerified" | "commitmentRecorded" | "commitmentResolved" | "saleRecorded" | "ownCommitmentConsumed"
  | "ownCommitmentActive" | "conditionsSatisfied" | "paymentVerified" | "expirationVerified" | "transferAtomic"
  | "compensationRecorded" | "balanceZero" | "balancePositive" | "planBalanced" | "agreementPresent" | "replacementBalanced"
  | "contractualMilestone" | "independentReview" | "paymentConditionMet" | "bankReconciled" | "cancellationApproved"
  | "cancellationRejected" | "accountVersionMatches" | "mfaSatisfied" | "eligibleLines" | "instructionRecorded"
  | "externalEvidence" | "someLinesReconciled" | "allLinesReconciled" | "policyApproved" | "capacityAvailable", boolean>>>;

export type TransitionContext = Readonly<{
  actorId: string;
  source: string;
  previousVersion: number;
  evidenceIds: readonly string[];
  reason: string;
  correlationId: string;
  facts: TransitionFacts;
}>;

function requireFacts(facts: TransitionFacts, ...required: (keyof TransitionFacts)[]): void {
  if (required.some(fact => facts[fact] !== true)) throw new ConflictError("Faltan condiciones verificadas para la transición.");
}

function validateContext(context: TransitionContext): void {
  if (!context.actorId.trim() || !context.source.trim() || !context.reason.trim() || !context.correlationId.trim()
    || context.evidenceIds.length === 0 || context.evidenceIds.some(id => !id.trim())
    || !Number.isSafeInteger(context.previousVersion) || context.previousVersion < 1 || context.previousVersion >= 2147483647) {
    throw new ValidationError("La transición requiere autoría, fuente, versión, evidencia, motivo y correlación.");
  }
}

/** Los hechos deben obtenerse de puertos autorizados bajo lock; no son campos del request. */
function validateConditions(machine: Machine, from: string, to: string, facts: TransitionFacts): void {
  switch (machine) {
    case "unit":
      if (to === "disponible") requireFacts(facts, "availabilityVerified", ...(from === "comprometida" ? ["commitmentResolved" as const] : []));
      if (to === "comprometida") requireFacts(facts, "availabilityVerified", "commitmentRecorded");
      if (to === "vendida") requireFacts(facts, "saleRecorded", ...(from === "comprometida" ? ["ownCommitmentConsumed" as const] : ["availabilityVerified" as const]));
      break;
    case "hold":
      if (to === "convertido") requireFacts(facts, "ownCommitmentActive", "transferAtomic");
      if (to === "expirado") requireFacts(facts, "expirationVerified");
      break;
    case "reservation":
      if (to === "confirmada" && from === "en_verificacion") requireFacts(facts, "ownCommitmentActive", "conditionsSatisfied", "paymentVerified");
      if (to === "confirmada" && from === "cancelacion_solicitada") requireFacts(facts, "cancellationRejected");
      if (to === "expirada") requireFacts(facts, "expirationVerified");
      if (to === "cancelada") requireFacts(facts, "cancellationApproved");
      break;
    case "payment":
      if (to === "confirmado") requireFacts(facts, "paymentVerified", "independentReview");
      if (to === "reversado_parcial") requireFacts(facts, "compensationRecorded", "balancePositive");
      if (to === "reversado_total") requireFacts(facts, "compensationRecorded", "balanceZero");
      if (to === "contracargo") requireFacts(facts, "compensationRecorded", "externalEvidence");
      break;
    case "plan":
      if (to === "acordado_activo" && from === "borrador") requireFacts(facts, "planBalanced", "agreementPresent");
      if (to === "acordado_activo" && from === "completado") requireFacts(facts, "compensationRecorded", "balancePositive");
      if (to === "completado") requireFacts(facts, "balanceZero");
      if (to === "sustituido") requireFacts(facts, "replacementBalanced", "agreementPresent");
      break;
    case "commission":
      if (to === "devengada") requireFacts(facts, "contractualMilestone", "agreementPresent");
      if (to === "aprobada") requireFacts(facts, "independentReview");
      if (to === "exigible") requireFacts(facts, "paymentConditionMet");
      if (to === "pagada") requireFacts(facts, "bankReconciled", "balanceZero");
      break;
    case "refund":
      if (to === "aprobado") requireFacts(facts, "independentReview", "accountVersionMatches");
      if (to === "pendiente_ejecucion") requireFacts(facts, "accountVersionMatches", "mfaSatisfied");
      if (to === "enviado") requireFacts(facts, "instructionRecorded");
      if (to === "confirmado" || to === "fallido") requireFacts(facts, "externalEvidence");
      break;
    case "batch":
      if (to === "pendiente_aprobacion") requireFacts(facts, "eligibleLines", "accountVersionMatches");
      if (to === "aprobado") requireFacts(facts, "independentReview", "mfaSatisfied", "accountVersionMatches");
      if (to === "instruido") requireFacts(facts, "instructionRecorded", "accountVersionMatches");
      if (to === "parcialmente_conciliado") requireFacts(facts, "someLinesReconciled", "externalEvidence");
      if (to === "conciliado") requireFacts(facts, "allLinesReconciled", "externalEvidence");
  }
}

/** Devuelve un hecho de UN objeto. No muta ni sincroniza otras máquinas. */
export function transitionState<M extends Machine>(machine: M, from: TransactionState<M>, to: TransactionState<M>, context: TransitionContext) {
  validateContext(context);
  if (!Object.hasOwn(TRANSITIONS, machine)) throw new ValidationError("Máquina desconocida.");
  const transitions = TRANSITIONS[machine] as Readonly<Record<string, readonly string[]>>;
  if (!Object.hasOwn(transitions, from) || !transitions[from]!.includes(to)) throw new ConflictError("Transición no permitida.");
  validateConditions(machine, from, to, context.facts);
  return Object.freeze({
    machine, previousState: from, state: to, previousVersion: context.previousVersion, version: context.previousVersion + 1,
    actorId: context.actorId, source: context.source, evidenceIds: Object.freeze([...context.evidenceIds]),
    reason: context.reason, correlationId: context.correlationId,
  });
}

export function extendHold(state: TransactionState<"hold">, context: TransitionContext) {
  validateContext(context);
  if (state !== "activo") throw new ConflictError("Solo se extiende un hold activo.");
  requireFacts(context.facts, "ownCommitmentActive", "policyApproved", "independentReview", "capacityAvailable");
  return Object.freeze({ state, previousVersion: context.previousVersion, version: context.previousVersion + 1,
    actorId: context.actorId, source: context.source, evidenceIds: Object.freeze([...context.evidenceIds]), reason: context.reason, correlationId: context.correlationId });
}
