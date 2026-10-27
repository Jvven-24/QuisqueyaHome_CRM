export type ModoSupervision = "edicion" | "gantt" | "comparador" | "recorrido360";

const MODOS_VALIDOS: readonly ModoSupervision[] = ["edicion", "gantt", "comparador", "recorrido360"];

export function normalizarModoSupervision(tab: string | null): ModoSupervision {
  return MODOS_VALIDOS.includes(tab as ModoSupervision) ? (tab as ModoSupervision) : "edicion";
}
