/**
 * Puerto de administración de Auth (invitaciones por correo).
 *
 * Quien llama decide si el fallo es fatal. En el alta de usuario **no lo es**:
 * el usuario ya está creado en el CRM y el alta NO se revierte cuando la
 * invitación falla (comportamiento actual de `api/usuarios`); el motivo se
 * reporta y se repara con el reenvío de invitación. En el reenvío, en cambio, el
 * fallo sí se propaga. Por eso el puerto solo lanza y no decide nada más.
 */
export interface AdminAuth {
  /** Invita por correo. Devuelve el id del usuario de Auth, o `null` si el proveedor no lo devolvió. Lanza ConflictError con el mensaje del proveedor si falla. */
  invitarPorCorreo(email: string): Promise<string | null>;
}
