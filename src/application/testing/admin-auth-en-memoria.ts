/**
 * Doble en memoria del puerto de admin de Auth. Cubre los tres desenlaces que el
 * alta de usuario debe distinguir: invitación con id, invitación sin id (el
 * proveedor no lo devolvió) y fallo del proveedor. No es `Reversible` a
 * propósito: un correo enviado no se deshace con un rollback de base de datos,
 * y el doble no debe fingir lo contrario.
 */

import { ConflictError } from "../../domain/errors.ts";
import type { AdminAuth } from "../compartido/admin-auth.ts";

export function adminAuthEnMemoria(
  opciones: { fallarCon?: string; sinIdDeUsuario?: boolean } = {},
): AdminAuth & { readonly invitados: readonly string[] } {
  const invitados: string[] = [];

  return {
    invitados,
    async invitarPorCorreo(email) {
      if (opciones.fallarCon !== undefined) throw new ConflictError(opciones.fallarCon);
      invitados.push(email);
      return opciones.sinIdDeUsuario ? null : `auth-user-${invitados.length}`;
    },
  };
}
