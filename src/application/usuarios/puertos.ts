/**
 * Puertos de Usuarios (`docs/R_ANALISIS_Y_PLAN.md` §7 R3.5; decisiones #28 y #41).
 * La aplicación declara sus filas a mano para no conocer Drizzle.
 */

import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { AdminAuth } from "../compartido/admin-auth.ts";
import type { Auditoria } from "../compartido/auditoria.ts";

export type Usuario = {
  id: number;
  roleId: number;
  authUserId: string | null;
  fullName: string;
  email: string;
  passwordHash: string | null;
  initials: string | null;
  jobTitle: string | null;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type Rol = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  isProtected: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PerfilBroker = {
  userId: number;
  specialty: string | null;
  handlesRentals: boolean;
  level: "junior" | "senior" | "senior_plus" | "top_producer" | "top_leader";
  annualSalesCents: number;
  monthlyTargetDeals: number;
  createdAt: Date;
  updatedAt: Date;
};

export type Permiso = {
  resource: "dashboard" | "leads" | "contacts" | "deals" | "activities" | "projects" | "units" | "unit_real_price" | "construction_phases" | "brokers" | "academy" | "goals" | "commissions" | "communications" | "reports" | "global_metrics" | "settings" | "users" | "roles" | "audit_log" | "integrations";
  action: "view" | "create" | "edit" | "delete" | "import" | "export";
  scope: "none" | "own" | "team" | "all";
};

export type EntradaCrearUsuario = {
  fullName: string;
  email: string;
  roleId: number;
  jobTitle?: string;
  phone?: string;
  specialty?: string;
  handlesRentals?: boolean;
  monthlyTargetDeals?: number;
};

export type EntradaEditarUsuario = {
  fullName?: string;
  roleId?: number;
  jobTitle?: string | null;
  phone?: string | null;
  isActive?: boolean;
  specialty?: string | null;
  handlesRentals?: boolean;
  monthlyTargetDeals?: number;
};

export interface RepositorioUsuarios {
  buscarActivoPorCorreo(email: string): Promise<{ id: number } | undefined>;
  buscarRol(id: number): Promise<Rol | undefined>;
  crear(datos: { roleId: number; fullName: string; email: string; jobTitle: string | null; phone: string | null; initials: string }): Promise<Usuario>;
  crearPerfilBroker(datos: { userId: number; specialty: string | null; handlesRentals: boolean; level: PerfilBroker["level"]; monthlyTargetDeals: number }): Promise<void>;
  buscar(id: number): Promise<Usuario | undefined>;
  contarOtrosAdminsActivos(id: number): Promise<number>;
  actualizar(id: number, cambios: EntradaEditarUsuario): Promise<Usuario>;
  buscarPerfilBroker(userId: number): Promise<{ userId: number } | undefined>;
  actualizarPerfilBroker(userId: number, cambios: { specialty?: string | null; handlesRentals?: boolean; monthlyTargetDeals?: number }): Promise<void>;
  marcarBorrado(id: number, cuando: Date): Promise<Usuario>;
  actualizarAuthUserId(id: number, authUserId: string): Promise<void>;
  esAdminActivo(usuario: Usuario): Promise<boolean>;
}

export type ReposUsuarios = { usuarios: RepositorioUsuarios; auditoria: Auditoria };

export type DependenciasUsuarios = {
  usuarios: RepositorioUsuarios;
  unidad: { ejecutar<T>(fn: (repos: ReposUsuarios) => Promise<T>): Promise<T> };
  adminAuth: AdminAuth;
};

export type DependenciasReenvio = { usuarios: RepositorioUsuarios; adminAuth: AdminAuth };

export type AlcanceUsuarios = Exclude<PermissionScope, "none">;
export type ActorUsuarios = Actor;

