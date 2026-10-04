import type { Actor } from "../../domain/rbac.ts";
import type { DashboardRepositorio, DashboardSnapshot, DashboardScopes, DashboardQuery } from "./puertos.ts";
import type { ReadScope } from "../reportes/puertos.ts";
export function dashboardEnMemoria(snapshot: DashboardSnapshot, failure?: Error) {
  const calls: { actor: Actor; scope: ReadScope; scopes: DashboardScopes; query: DashboardQuery }[] = [];
  const repo: DashboardRepositorio = {
    async obtenerMetricasDashboard(actor, scope, scopes, query) {
      calls.push({ actor, scope, scopes, query });
      if (failure) throw failure;
      return structuredClone(snapshot);
    },
  };
  return { repo, calls };
}

