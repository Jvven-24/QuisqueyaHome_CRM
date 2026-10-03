/**
 * M10 · Academy — Consultas de lectura para componentes de servidor.
 */

import type {
  RepositorioAcademy,
  ItemAcademy,
  ResumenProgresoAcademy,
} from "./puertos.ts";

export async function consultarAcademy(
  repo: RepositorioAcademy,
  userId: number,
  categoria?: string,
): Promise<{ contenidos: ItemAcademy[]; resumen: ResumenProgresoAcademy }> {
  const [contenidos, resumen] = await Promise.all([
    repo.listarContenidos(userId, categoria),
    repo.obtenerResumenProgreso(userId),
  ]);
  return { contenidos, resumen };
}
