import { forbidden } from "next/navigation";
import { scopeFor } from "@/domain/rbac";
import type {
  Actor,
  PermissionAction,
  PermissionResource,
  PermissionScope,
} from "@/domain/rbac";

/**
 * Autorización dentro de una página (T3, lado HTML).
 *
 * Existe junto a `requireScope` del dominio porque los dos adaptadores presentan
 * la negativa de forma distinta, y ninguno de los dos debe imitar al otro:
 *
 *  - Un **route handler** devuelve JSON: deja que `requireScope` lance y
 *    `errorResponse` lo traduce a 403.
 *  - Una **página** devuelve HTML: una excepción sin manejar se convierte en un
 *    500 con la pantalla de error genérica, que ni tiene el código correcto ni
 *    le dice al usuario qué pasó. `forbidden()` de Next sí produce un 403 real y
 *    renderiza `app/forbidden.tsx`.
 *
 * La decisión de permiso es la misma en los dos casos: `scopeFor`, en el
 * dominio. Aquí solo cambia cómo se presenta.
 *
 * Devuelve el alcance para filtrar la consulta — ver `visibleRows`.
 */
export function requireScopeInPage(
  actor: Actor,
  resource: PermissionResource,
  action: PermissionAction,
): Exclude<PermissionScope, "none"> {
  const scope = scopeFor(actor, resource, action);
  if (scope === "none") forbidden();
  return scope;
}
