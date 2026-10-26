import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { FunnelRow, FunnelStep, ReadScope, ReportFilters, ReportQuery } from "../reportes/puertos.ts";
export type DashboardLeadSummary = { id: number; name: string; project: string; source: string; stage: string; next: string };
export type DashboardActivity = { id: number; title: string; startsAt: string; location: string | null };
export type DashboardSnapshot = {
  fullName: string; myLeads: number; monthLeads: number; activeDeals: number; pipelineCents: number;
  monthWon: number; unassignedLeads: number; todayMeetings: number; weekMeetings: number; pendingTasks: number;
  goal: { achieved: number; target: number } | null; level: string | null;
  recentLeads: DashboardLeadSummary[]; activities: DashboardActivity[];
  projects: { id: number; name: string; leads: number }[];
  academy: { title: string; progressPercent: number } | null; funnel: FunnelRow[];
};
export type DashboardMetrics = {
  misLeadsCount: number; citasSemanaCount: number; metaMesLabel: string; miNivel: string; metaPorcentaje: number;
  leadsMesCount: number; negociosActivosCount: number; volumenPipelineDisplay: string; cierresMesCount: number; conversionPorcentaje: string;
  leadsSinAsignarCount: number; citasHoyCount: number; tareasPendientesCount: number; avancesPorRevisarCount: number | null;
  leadsRecientes: DashboardLeadSummary[]; saludoNombre: string; nombre: string; fechaTexto: string;
  funnel: FunnelStep[]; activities: DashboardActivity[]; projects: DashboardSnapshot["projects"]; academy: DashboardSnapshot["academy"];
};
export type DashboardQuery = ReportQuery & { today: string; weekStart: string; weekEnd: string; monthStart: string; monthEnd: string };
export type DashboardScopes = { leads: PermissionScope; deals: PermissionScope; activities: PermissionScope; projects: PermissionScope; goals: PermissionScope; academy: PermissionScope };
export type DashboardRepositorio = {
  obtenerMetricasDashboard(actor: Actor, scope: ReadScope, scopes: DashboardScopes, query: DashboardQuery): Promise<DashboardSnapshot>;
};
export type DashboardFilters = ReportFilters;

