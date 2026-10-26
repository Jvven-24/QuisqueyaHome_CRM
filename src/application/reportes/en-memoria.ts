import type { Actor } from "../../domain/rbac.ts";
import type { ReportesRepositorio, ReportSnapshot, ReportQuery, ReadScope } from "./puertos.ts";

/** Doble de puerto: captura identidad/filtros y permite simular fallos. */
export function reportesEnMemoria(snapshot: ReportSnapshot, failure?: Error) {
  const calls: { actor: Actor; scope: ReadScope; query: ReportQuery }[] = [];
  const repo: ReportesRepositorio = {
    async obtenerMetricasBi(actor, scope, query) {
      calls.push({ actor, scope, query });
      if (failure) throw failure;
      return structuredClone(snapshot);
    },
  };
  return { repo, calls };
}
