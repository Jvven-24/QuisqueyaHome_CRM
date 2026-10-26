import { scopeFor, type Actor, type PermissionScope } from "../../domain/rbac.ts";
import { fechaSantoDomingo, lunesDeLaSemana, sumarDias } from "../../domain/zona-horaria.ts";
import { assertMonetaryTotals, percentage, reportQuery, requireReadScope } from "../reportes/consultas.ts";
import type { ReadScope } from "../reportes/puertos.ts";
import type { DashboardMetrics, DashboardRepositorio, DashboardScopes, DashboardFilters, DashboardQuery } from "./puertos.ts";

export function dashboardScopes(actor: Actor, scope: ReadScope): DashboardScopes {
  const restrict = (resource: keyof DashboardScopes): PermissionScope => {
    const granted = scopeFor(actor, resource, "view");
    if (granted === "none") return "none";
    return scope === "all" ? granted : granted === "all" ? scope : "own";
  };
  return { leads: restrict("leads"), deals: restrict("deals"), activities: restrict("activities"), projects: restrict("projects"), goals: restrict("goals"), academy: restrict("academy") };
}
export function dashboardQuery(filters: DashboardFilters, now: Date): DashboardQuery {
  const query = reportQuery(filters, now);
  const today = fechaSantoDomingo(now);
  const weekStart = lunesDeLaSemana(today);
  const [year, month] = today.split("-").map(Number);
  const monthEnd = new Date(Date.UTC(year!, month!, 1)).toISOString().slice(0, 10);
  return { ...query, today, weekStart, weekEnd: sumarDias(weekStart, 7), monthStart: today.slice(0, 7) + "-01", monthEnd };
}
export async function consultarDashboard(repo: DashboardRepositorio, actor: Actor, scope: ReadScope, filters: DashboardFilters = {}, now = new Date()): Promise<DashboardMetrics> {
  requireReadScope(scope);
  const query = dashboardQuery(filters, now);
  const scopes = dashboardScopes(actor, scope);
  const snapshot = await repo.obtenerMetricasDashboard(actor, scope, scopes, query);
  assertMonetaryTotals(snapshot);
  const base = Math.max(0, ...snapshot.funnel.map(row => row.reachedCount));
  const funnel = snapshot.funnel.map(row => ({ ...row, widthPercent: percentage(row.reachedCount, base), passRatePercent: row.previousReachedCount ? percentage(row.passedFromPreviousCount ?? 0, row.previousReachedCount) : null }));
  return {
    misLeadsCount: snapshot.myLeads, citasSemanaCount: snapshot.weekMeetings,
    metaMesLabel: snapshot.goal ? `${snapshot.goal.achieved} / ${snapshot.goal.target}` : "Sin meta",
    metaPorcentaje: snapshot.goal ? Math.min(100, percentage(snapshot.goal.achieved, snapshot.goal.target)) : 0,
    miNivel: snapshot.level ?? "Sin nivel", leadsMesCount: snapshot.monthLeads,
    negociosActivosCount: snapshot.activeDeals,
    volumenPipelineDisplay: new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" }).format(snapshot.pipelineCents / 100),
    cierresMesCount: snapshot.monthWon, conversionPorcentaje: snapshot.monthLeads > 0 ? `${percentage(snapshot.monthWon, snapshot.monthLeads)}%` : "Sin captaciones",
    leadsSinAsignarCount: snapshot.unassignedLeads, citasHoyCount: snapshot.todayMeetings, tareasPendientesCount: snapshot.pendingTasks,
    // El modelo actual no registra aprobación/revisión de avances. No inventar un conteo.
    avancesPorRevisarCount: null,
    leadsRecientes: snapshot.recentLeads, saludoNombre: snapshot.fullName.split(" ")[0] ?? "",
    nombre: snapshot.fullName,
    fechaTexto: new Intl.DateTimeFormat("es-DO", { timeZone: "America/Santo_Domingo", dateStyle: "long" }).format(now),
    funnel, activities: snapshot.activities, projects: snapshot.projects, academy: snapshot.academy,
  };
}

