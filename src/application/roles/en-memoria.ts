/** Doble de Roles para R3.5 (`docs/R_ANALISIS_Y_PLAN.md` §3 paso 4). */

import type { Reversible } from "../testing/reversible.ts";
import type { Permiso, RepositorioRoles, Rol } from "./puertos.ts";

export function rolesEnMemoria(rolInicial: Rol, permisosIniciales: readonly Permiso[] = []): RepositorioRoles & Reversible & { readonly permisos: readonly Permiso[] } {
  let permisos = [...permisosIniciales];
  return {
    async buscar() { return rolInicial; },
    async listarPermisos() { return permisos; },
    async guardarPermiso(_roleId, permiso) { permisos = [...permisos.filter((actual) => actual.resource !== permiso.resource || actual.action !== permiso.action), permiso]; },
    async borrarPermiso(_roleId, permiso) { permisos = permisos.filter((actual) => actual.resource !== permiso.resource || actual.action !== permiso.action); },
    get permisos() { return permisos; },
    instantanea() { const copia = permisos; return () => { permisos = copia; }; },
  };
}
