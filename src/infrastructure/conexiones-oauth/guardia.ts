/** Regla de administrador de Conexiones (se suma a requireFullScope("settings","edit") en cada ruta). */
import { ForbiddenError } from "@/domain/errors";
import { scopeFor, type Actor } from "@/domain/rbac";
import { puedeAdministrarConexiones } from "./acceso";

export function soloAdministrador(actor: Actor): void {
  if (!puedeAdministrarConexiones(actor, scopeFor(actor, "settings", "edit"))) {
    throw new ForbiddenError("Solo el administrador puede gestionar las conexiones.");
  }
}
