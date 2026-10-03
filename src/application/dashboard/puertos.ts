export type DashboardLeadSummary = {
  id: number;
  name: string;
  project: string;
  source: string;
  stage: string;
  next: string;
};

export type DashboardMetrics = {
  // Broker view
  misLeadsCount: number;
  citasSemanaCount: number;
  metaMesLabel: string;
  miNivel: string;
  metaPorcentaje: number;

  // Admin view
  leadsMesCount: number;
  negociosActivosCount: number;
  volumenPipelineDisplay: string;
  cierresMesCount: number;
  conversionPorcentaje: string;

  // Assistant view
  leadsSinAsignarCount: number;
  citasHoyCount: number;
  tareasPendientesCount: number;
  avancesPorRevisarCount: number;

  // Shared
  leadsRecientes: DashboardLeadSummary[];
  saludoNombre: string;
  fechaTexto: string;
};

export type DashboardRepositorio = {
  obtenerMetricasDashboard(actorId: number, roleSlug: string, actorName: string): Promise<DashboardMetrics>;
};
