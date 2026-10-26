import type { Actor } from "../../domain/rbac.ts";
import { ForbiddenError, ValidationError } from "../../domain/errors.ts";
import { fechaSantoDomingo } from "../../domain/zona-horaria.ts";
import type { ReadScope, ReportesRepositorio, ReportesBiData, ReportFilters, ReportQuery, ReportSnapshot } from "./puertos.ts";

export const TREND_MONTHS = 18;
export const REPORT_TIME_ZONE = "America/Santo_Domingo";
const COLORS = ["gold", "navy", "blue", "gray"] as const;
/** JSON de Postgres puede representar bigint como number; rechazar pérdida de precisión. */
export function assertMonetaryTotals(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (key.endsWith("Cents") && child !== null && (typeof child !== "number" || !Number.isSafeInteger(child) || child < 0)) {
      throw new ValidationError("Importe fuera del rango seguro de representación.");
    }
    if (typeof child === "object") assertMonetaryTotals(child);
  }
}
export function percentage(value: number, total: number): number {
  return total > 0 ? Math.round(value / total * 1000) / 10 : 0;
}
export function reportQuery(filters: ReportFilters = {}, now = new Date()): ReportQuery {
  for (const date of [filters.desde, filters.hasta]) {
    if (date !== undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) {
      throw new ValidationError("Fecha de análisis inválida.");
    }
  }
  if (filters.desde && filters.hasta && filters.desde > filters.hasta) throw new ValidationError("El inicio debe preceder al fin.");
  for (const id of [filters.projectId, filters.brokerId]) {
    if (id !== undefined && (!Number.isSafeInteger(id) || id <= 0)) throw new ValidationError("Identificador de filtro inválido.");
  }
  const localDate = fechaSantoDomingo(now);
  const end = filters.hasta && filters.hasta < localDate ? filters.hasta : localDate;
  const [year, month] = end.split("-").map(Number);
  const trendStart = new Date(Date.UTC(year!, month! - TREND_MONTHS, 1)).toISOString().slice(0, 10);
  return { ...filters, asOf: now.toISOString(), trendStart };
}
export function requireReadScope(scope: ReadScope): void {
  if (!["own", "team", "all"].includes(scope)) throw new ForbiddenError();
}
export function presentReport(snapshot: ReportSnapshot, query: ReportQuery): ReportesBiData {
  assertMonetaryTotals(snapshot);
  const base = Math.max(0, ...snapshot.funnel.map(row => row.reachedCount));
  const peak = Math.max(0, ...snapshot.projection.points.map(point => point.amountCents));
  return {
    ...snapshot,
    filters: { desde: query.desde, hasta: query.hasta, projectId: query.projectId, brokerId: query.brokerId }, asOf: query.asOf,
    funnel: snapshot.funnel.map(row => ({ ...row, widthPercent: percentage(row.reachedCount, base), passRatePercent: row.previousReachedCount ? percentage(row.passedFromPreviousCount ?? 0, row.previousReachedCount) : null })),
    sources: snapshot.sources.map((row, index) => ({ ...row, percentage: percentage(row.count, snapshot.totalLeads), roiPercent: row.spendCents ? percentage(row.revenueCents - row.spendCents, row.spendCents) : null, colorClass: COLORS[index % COLORS.length]! })),
    zones: snapshot.zones.map(row => ({ ...row, percentage: percentage(row.count, snapshot.totalLeads) })),
    brokers: snapshot.brokers.map(row => ({ ...row, conversionPercent: row.leads > 0 ? percentage(row.won, row.leads) : null })),
    projection: {
      totalWeightedCents: snapshot.projection.totalWeightedCents,
      totalDisplayUsd: new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" }).format(snapshot.projection.totalWeightedCents / 100),
      confidenceEstimated: snapshot.projection.knownAmountCents > 0 ? percentage(snapshot.projection.totalWeightedCents, snapshot.projection.knownAmountCents) : null,
      missingProbabilityCount: snapshot.projection.missingProbabilityCount, missingAmountCount: snapshot.projection.missingAmountCount,
      points: snapshot.projection.points.map(point => ({ ...point, heightPercent: percentage(point.amountCents, peak) })),
    },
  };
}
export async function consultarReportesBi(repo: ReportesRepositorio, actor: Actor, scope: ReadScope, filters: ReportFilters = {}, now = new Date()): Promise<ReportesBiData> {
  requireReadScope(scope);
  const query = reportQuery(filters, now);
  return presentReport(await repo.obtenerMetricasBi(actor, scope, query), query);
}
