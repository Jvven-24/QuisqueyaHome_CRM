/** Puertos de Roles (`docs/R_ANALISIS_Y_PLAN.md` §7 R3.5; decisiones #2, #27 y #41). */

import type { Actor } from "../../domain/rbac.ts";
import type { Auditoria } from "../compartido/auditoria.ts";

export type Rol = {
  id: number;
  isProtected: boolean;
};

export type Permiso = {
  resource: "dashboard" | "leads" | "contacts" | "deals" | "activities" | "projects" | "units" | "unit_real_price" | "construction_phases" | "brokers" | "academy" | "goals" | "commissions" | "communications" | "reports" | "global_metrics" | "settings" | "users" | "roles" | "audit_log" | "integrations";
  action: "view" | "create" | "edit" | "delete" | "import" | "export";
  scope: "none" | "own" | "team" | "all";
};

export interface RepositorioRoles {
  buscar(id: number): Promise<Rol | undefined>;
  listarPermisos(roleId: number): Promise<Permiso[]>;
  guardarPermiso(roleId: number, permiso: Permiso): Promise<void>;
  borrarPermiso(roleId: number, permiso: Permiso): Promise<void>;
}

export type ReposRoles = {
  roles: RepositorioRoles;
  auditoria: Auditoria;
};

export type DependenciasRoles = {
  unidad: {
    ejecutar<T>(fn: (repos: ReposRoles) => Promise<T>): Promise<T>;
  };
};
export type ActorRoles = Actor;
