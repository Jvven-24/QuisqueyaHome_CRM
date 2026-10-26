import { resolverFiltros, type FilterParams } from "@/application/reportes/filtros";
import type { ReportFilters } from "@/application/reportes/puertos";
export type { FilterParams };
export function leerFiltros(params: FilterParams, now = new Date()): ReportFilters {
  return resolverFiltros(params, now).filtros;
}
