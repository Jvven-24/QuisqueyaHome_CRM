import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { StageKind } from "../../domain/catalogs.ts";

export type ReadScope = Exclude<PermissionScope, "none">;
/** Días inclusivos en Santo Domingo; cada métrica usa su fecha de evento. */
export type ReportFilters = { desde?: string; hasta?: string; projectId?: number; brokerId?: number };
export type ReportQuery = ReportFilters & { asOf: string; trendStart: string };
export type FunnelRow = {
  stageId: number; label: string; kind: StageKind; position: number;
  count: number; reachedCount: number; previousReachedCount: number | null;
  passedFromPreviousCount: number | null;
};
export type FunnelStep = FunnelRow & { widthPercent: number; passRatePercent: number | null };
export type SourceRow = {
  sourceId: number | null; source: string; count: number; deals: number; won: number;
  revenueCents: number; spendCents: number | null;
};
export type SourceDistribution = SourceRow & {
  percentage: number; roiPercent: number | null;
  colorClass: "gold" | "navy" | "blue" | "gray";
};
export type ZoneInterestMetric = { zoneId: number | null; label: string; count: number; percentage: number };
export type LossReasonMetric = { reasonId: number | null; label: string; count: number };
export type MonthlyTrendPoint = { month: string; leads: number; deals: number; won: number; revenueCents: number };
export type BrokerMetric = { brokerId: number | null; name: string; leads: number; deals: number; won: number; volumeCents: number; conversionPercent: number | null };
export type InventoryMetric = { state: string; count: number; medianAgeDays: number | null; p75AgeDays: number | null };
export type CommissionMetric = { month: string | null; count: number; totalCents: number; brokerCents: number; agencyCents: number; paidCents: number };
export type MonthlyProjectionPoint = { month: string | null; amountCents: number; heightPercent: number };
export type PipelineProjection = {
  totalWeightedCents: number; totalDisplayUsd: string; confidenceEstimated: number | null;
  missingProbabilityCount: number; missingAmountCount: number; points: MonthlyProjectionPoint[];
};
/** Agregados de SQL. Nunca filas de personas ni credenciales. */
export type ReportSnapshot = {
  totalLeads: number; totalDeals: number; funnel: FunnelRow[]; sources: SourceRow[];
  zones: Omit<ZoneInterestMetric, "percentage">[]; lossReasons: LossReasonMetric[];
  trend: MonthlyTrendPoint[]; brokers: Omit<BrokerMetric, "conversionPercent">[];
  velocity: { sampleSize: number; medianDays: number | null; p75Days: number | null };
  inventory: InventoryMetric[]; commissions: CommissionMetric[];
  projection: { totalWeightedCents: number; knownAmountCents: number; missingProbabilityCount: number; missingAmountCount: number; points: Omit<MonthlyProjectionPoint, "heightPercent">[] };
};
export type ReportesBiData = Omit<ReportSnapshot, "funnel" | "sources" | "zones" | "brokers" | "projection"> & {
  filters: ReportFilters; asOf: string; funnel: FunnelStep[]; sources: SourceDistribution[];
  zones: ZoneInterestMetric[]; brokers: BrokerMetric[]; projection: PipelineProjection;
};
export type ReportesRepositorio = {
  obtenerMetricasBi(actor: Actor, scope: ReadScope, query: ReportQuery): Promise<ReportSnapshot>;
};
