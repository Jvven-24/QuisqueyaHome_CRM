/**
 * M11 · Comunicaciones — Consultas de lectura para componentes de servidor.
 */

import type {
  RepositorioComunicaciones,
  PlantillaMensaje,
  EstadoCanal,
} from "./puertos.ts";

export async function consultarComunicaciones(
  repo: RepositorioComunicaciones,
): Promise<{ plantillas: PlantillaMensaje[]; canales: EstadoCanal[] }> {
  const [plantillas, canales] = await Promise.all([
    repo.listarPlantillas(),
    repo.obtenerEstadosCanales(),
  ]);
  return { plantillas, canales };
}
