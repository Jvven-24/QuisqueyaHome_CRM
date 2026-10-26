import assert from "node:assert/strict";
import { test } from "node:test";
import { consultarReportesBi, reportQuery, TREND_MONTHS } from "./consultas.ts";
import { reportesEnMemoria } from "./en-memoria.ts";
import type { Actor } from "../../domain/rbac.ts";
import type { ReportSnapshot } from "./puertos.ts";
import { ForbiddenError, ValidationError } from "../../domain/errors.ts";

const actor: Actor = { userId: 17, roleSlug: "renombrado", permissions: [] };
export function emptySnapshot(): ReportSnapshot {
  return { totalLeads: 0, totalDeals: 0, funnel: [], sources: [], zones: [], lossReasons: [], trend: [], brokers: [], velocity: { sampleSize: 0, medianDays: null, p75Days: null }, inventory: [], commissions: [], projection: { totalWeightedCents: 0, knownAmountCents: 0, missingProbabilityCount: 0, missingAmountCount: 0, points: [] } };
}
test("reportes: cero y vacío no crean datos de demostración", async () => {
  const { repo } = reportesEnMemoria(emptySnapshot());
  const result = await consultarReportesBi(repo, actor, "own");
  assert.equal(result.totalLeads, 0); assert.equal(result.totalDeals, 0);
  assert.deepEqual(result.funnel, []); assert.deepEqual(result.sources, []);
  assert.equal(result.projection.totalWeightedCents, 0); assert.equal(result.projection.confidenceEstimated, null);
});
test("reportes: identidad, team y todos los filtros llegan al puerto", async () => {
  const double = reportesEnMemoria(emptySnapshot());
  const filters = { desde: "2026-09-01", hasta: "2026-09-30", projectId: 21, brokerId: 99 };
  await consultarReportesBi(double.repo, actor, "team", filters, new Date("2026-10-01T02:00:00Z"));
  assert.equal(double.calls[0]!.actor, actor); assert.equal(double.calls[0]!.scope, "team");
  assert.deepEqual(double.calls[0]!.query, { ...filters, asOf: "2026-10-01T02:00:00.000Z", trendStart: "2025-04-01" });
  assert.equal(TREND_MONTHS, 18);
});
test("reportes: rechaza fechas imposibles, rangos invertidos e IDs inválidos antes del puerto", async () => {
  const d = reportesEnMemoria(emptySnapshot());
  for (const filters of [{ desde: "2026-02-30" }, { hasta: "basura" }, { desde: "2026-10-02", hasta: "2026-10-01" }, { brokerId: 1.5 }, { projectId: 0 }]) {
    await assert.rejects(consultarReportesBi(d.repo, actor, "all", filters), ValidationError);
  }
  assert.equal(d.calls.length, 0);
});
test("reportes: alcance none o desconocido falla cerrado", async () => {
  const d = reportesEnMemoria(emptySnapshot());
  await assert.rejects(consultarReportesBi(d.repo, actor, "none" as "all"), ForbiddenError);
  await assert.rejects(consultarReportesBi(d.repo, actor, "inventado" as "all"), ForbiddenError);
  assert.equal(d.calls.length, 0);
});
test("reportes: el fallo del puerto se propaga sin sustitución ni logs internos", async () => {
  const failure = new Error("fallo simulado");
  const d = reportesEnMemoria(emptySnapshot(), failure);
  await assert.rejects(consultarReportesBi(d.repo, actor, "all"), error => error === failure);
});
test("reportes: porcentajes, ROI y barras se derivan de agregados distintos a los antiguos", async () => {
  const snapshot = emptySnapshot();
  snapshot.totalLeads = 10; snapshot.totalDeals = 4;
  snapshot.funnel = [
    { stageId: 41, label: "Primera", kind: "open", position: 1, count: 2, reachedCount: 4, previousReachedCount: null, passedFromPreviousCount: null },
    { stageId: 73, label: "Segunda", kind: "open", position: 2, count: 2, reachedCount: 2, previousReachedCount: 4, passedFromPreviousCount: 1 },
  ];
  snapshot.sources = [
    { sourceId: 11, source: "Canal", count: 6, deals: 3, won: 1, revenueCents: 30000, spendCents: 10000 },
    { sourceId: null, source: "Sin canal", count: 4, deals: 1, won: 0, revenueCents: 0, spendCents: 0 },
  ];
  snapshot.projection = { totalWeightedCents: 200, knownAmountCents: 1000, missingProbabilityCount: 1, missingAmountCount: 2, points: [{ month: "2026-10", amountCents: 150 }, { month: null, amountCents: 50 }] };
  const d = reportesEnMemoria(snapshot);
  const result = await consultarReportesBi(d.repo, actor, "all");
  assert.equal(result.funnel[1]!.widthPercent, 50); assert.equal(result.funnel[1]!.passRatePercent, 25);
  assert.equal(result.sources[0]!.percentage, 60); assert.equal(result.sources[0]!.roiPercent, 200);
  assert.equal(result.sources[1]!.roiPercent, null); assert.equal(result.projection.confidenceEstimated, 20);
  assert.equal(result.projection.points[1]!.heightPercent, 33.3);
  assert.equal(result.funnel.reduce((sum, row) => sum + row.count, 0), result.totalDeals);
});
test("reportes: centavos fuera de precisión segura fallan explícitamente", async () => {
  const snapshot = emptySnapshot(); snapshot.projection.totalWeightedCents = Number.MAX_SAFE_INTEGER + 1;
  await assert.rejects(consultarReportesBi(reportesEnMemoria(snapshot).repo, actor, "all"), ValidationError);
});
test("tendencia: el cambio de mes usa Santo Domingo y el hasta limita la ventana", () => {
  assert.equal(reportQuery({}, new Date("2026-10-01T02:00:00Z")).trendStart, "2025-04-01");
  assert.equal(reportQuery({ hasta: "2026-03-31" }, new Date("2026-10-04T12:00:00Z")).trendStart, "2024-10-01");
});
