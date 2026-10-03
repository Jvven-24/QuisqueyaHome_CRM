export type FunnelStep = {
  label: string;
  count: number;
  widthPercent: number;
};

export type SourceDistribution = {
  source: string;
  count: number;
  percentage: number;
  colorClass: "gold" | "navy" | "blue" | "gray";
};

export type ZoneInterestMetric = {
  label: string;
  count: number;
  percentage: number;
};

export type LossReasonMetric = {
  label: string;
  count: number;
};

export type MonthlyProjectionPoint = {
  month: string;
  amountCents: number;
  heightPercent: number;
};

export type PipelineProjection = {
  totalWeightedCents: number;
  totalDisplayUsd: string;
  confidenceEstimated: number;
  points: MonthlyProjectionPoint[];
};

export type ReportesBiData = {
  totalLeads: number;
  funnel: FunnelStep[];
  sources: SourceDistribution[];
  zones: ZoneInterestMetric[];
  lossReasons: LossReasonMetric[];
  projection: PipelineProjection;
};

export type ReportesRepositorio = {
  obtenerMetricasBi(actorId: number, scope: string): Promise<ReportesBiData>;
};
