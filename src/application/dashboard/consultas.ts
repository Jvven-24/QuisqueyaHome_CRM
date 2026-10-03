import type { DashboardMetrics, DashboardRepositorio } from "./puertos.ts";

export async function consultarDashboard(
  repo: DashboardRepositorio,
  actorId: number,
  roleSlug: string,
  actorName: string,
): Promise<DashboardMetrics> {
  return repo.obtenerMetricasDashboard(actorId, roleSlug, actorName);
}
