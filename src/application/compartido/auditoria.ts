/**
 * Puerto de auditoría.
 *
 * Nunca se entrega como dependencia suelta del caso de uso: viaja **dentro del
 * juego de repositorios que da la unidad de trabajo**. Es la misma regla de
 * `infrastructure/audit.ts` (auditar siempre en la transacción del cambio, no
 * después), llevada al tipo: si la auditoría se inyectara aparte, nada
 * impediría que escribiera en otra conexión y dejara el dato cambiado sin
 * rastro, o el rastro sin dato.
 *
 * `actor` es un parámetro explícito y no estado del adaptador porque el
 * adaptador vive lo que dura una transacción y puede compartirse entre casos de
 * uso; guardar al actor en él haría que un actor equivocado se arrastrara sin
 * que ninguna firma lo mostrara.
 */

import type { AuditAction, EntityType } from "../../domain/catalogs.ts";
import type { Actor } from "../../domain/rbac.ts";

export type RegistroAuditoria = {
  accion: AuditAction;
  entidad: EntityType;
  entidadId: number;
  /** Estado antes del cambio. `undefined` si no aplica (p. ej. al crear). */
  antes?: unknown;
  /** Estado después del cambio. `undefined` si no aplica (p. ej. al eliminar). */
  despues?: unknown;
};

export interface Auditoria {
  registrar(actor: Actor, registro: RegistroAuditoria): Promise<void>;
}
