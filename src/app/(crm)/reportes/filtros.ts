import { z } from "zod";
import { fechaSantoDomingo, sumarDias } from "@/domain/zona-horaria";
import type { ReportFilters } from "@/application/reportes/puertos";
const filterSchema = z.object({
  periodo: z.enum(["todo", "90d", "ano"]).default("todo"),
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  projectId: z.coerce.number().int().positive().optional(),
  brokerId: z.coerce.number().int().positive().optional(),
});
export type FilterParams = Record<string, string | string[] | undefined>;
export function leerFiltros(params: FilterParams, now = new Date()): ReportFilters {
  const scalar = (key: string) => typeof params[key] === "string" && params[key] !== "" ? params[key] : undefined;
  const parsed = filterSchema.parse({ periodo: scalar("periodo"), desde: scalar("desde"), hasta: scalar("hasta"), projectId: scalar("projectId"), brokerId: scalar("brokerId") });
  const today = fechaSantoDomingo(now);
  return { desde: parsed.desde ?? (parsed.periodo === "90d" ? sumarDias(today, -89) : parsed.periodo === "ano" ? today.slice(0, 4) + "-01-01" : undefined), hasta: parsed.hasta, projectId: parsed.projectId, brokerId: parsed.brokerId };
}

