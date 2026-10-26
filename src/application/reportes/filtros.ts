import { z } from "zod";
import { fechaSantoDomingo, sumarDias } from "../../domain/zona-horaria.ts";
import type { ReportFilters } from "./puertos.ts";
const periodoSchema = z.enum(["todo", "90d", "ano"]);
const fechaSchema = z.iso.date();
const idSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export type FilterParams = Record<string, string | string[] | undefined>;
export function resolverFiltros(params: FilterParams, now = new Date()): { periodo: string; filtros: ReportFilters } {
  const scalar = (key: string) => typeof params[key] === "string" && params[key] !== "" ? params[key] : undefined;
  const periodo = periodoSchema.safeParse(scalar("periodo"));
  const rango = periodo.success ? periodo.data : "todo";
  const desde = fechaSchema.safeParse(scalar("desde"));
  const hasta = fechaSchema.safeParse(scalar("hasta"));
  const proyecto = idSchema.safeParse(scalar("projectId"));
  const broker = idSchema.safeParse(scalar("brokerId"));
  const hoy = fechaSantoDomingo(now);
  let inicio = desde.success ? desde.data : rango === "90d" ? sumarDias(hoy, -89) : rango === "ano" ? `${hoy.slice(0, 4)}-01-01` : undefined;
  let fin = hasta.success ? hasta.data : undefined;
  if (inicio && fin && inicio > fin) { inicio = undefined; fin = undefined; }
  return { periodo: rango, filtros: { desde: inicio, hasta: fin, projectId: proyecto.success ? proyecto.data : undefined, brokerId: broker.success ? broker.data : undefined } };
}
export function urlPestanaReportes(query: string, tab: string): string {
  const params = new URLSearchParams(query);
  params.set("tab", tab);
  return `/reportes?${params.toString()}`;
}
