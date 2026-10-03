import type { ReportesRepositorio, ReportesBiData } from "./puertos.ts";

export async function consultarReportesBi(
  repo: ReportesRepositorio,
  actorId: number,
  scope: string,
): Promise<ReportesBiData> {
  return repo.obtenerMetricasBi(actorId, scope);
}
