/** Regla RBAC de Conexiones: solo el administrador (rol admin, no solo lectura, con settings:edit en alcance total) conecta. */
export function puedeAdministrarConexiones(a: { roleSlug: string; readOnly?: boolean }, alcanceSettingsEdit: string): boolean {
  return a.roleSlug === "admin" && !a.readOnly && alcanceSettingsEdit === "all";
}
