/**
 * Escritura en `audit_log` (T6).
 *
 * Un helper de veinte líneas, como dice `docs/F1_ANALISIS_Y_PLAN.md` §3.3 — la
 * trampa no está en la función, está en *dónde* se llama: **siempre dentro de
 * la misma transacción que el cambio que audita, nunca después.** Por eso
 * `auditar` recibe `tx` en vez de abrir su propia conexión con `getDb()`. Si
 * escribiera fuera de la transacción, un fallo a mitad de camino dejaría el
 * dato cambiado sin rastro, o el rastro sin dato — y el criterio de terminado
 * #2 de `MAPEO_FRONTEND_CRM.md` («todo cambio persiste y tiene autor y
 * fecha») se pierde en silencio, que es la peor forma de perderlo.
 *
 * Se llama así, dentro de una `transaction()` de `db/client.ts`:
 *
 * ```ts
 * await transaction(async (tx) => {
 *   const [contacto] = await tx.update(contacts)...returning();
 *   await auditar(tx, actor, {
 *     accion: "editar",
 *     entidad: "contact",
 *     entidadId: contacto.id,
 *     antes: anterior,
 *     despues: contacto,
 *   });
 * });
 * ```
 *
 * No hay triggers, ni middleware que intercepte todas las escrituras, ni un
 * decorador genérico (`MAPEO_FRONTEND_CRM.md` §4, T6): «acción sensible» es la
 * lista corta y explícita de `AUDIT_ACTIONS` en `domain/catalogs.ts`, y una
 * lista corta se escribe a mano en cada caso de uso que la necesite.
 */

import type { AuditAction, EntityType } from "@/domain/catalogs";
import type { Actor } from "@/domain/rbac";
import type { Db } from "./db/client.ts";
import { auditLog } from "./db/schema.ts";

/**
 * La transacción de Drizzle abierta por `transaction()` — el mismo tipo que
 * `db/client.ts` usa para tipar su callback. Se repite aquí en vez de
 * importarlo como valor porque `client.ts` abre la conexión al cargarse
 * (`getDb`), y este módulo debe poder probarse con `node --test` sin que eso
 * ocurra: como es un `import type`, se borra al compilar y nunca llega a
 * resolverse en tiempo de ejecución.
 */
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type DatosAuditoria = {
  accion: AuditAction;
  entidad: EntityType;
  entidadId: number;
  /** Estado antes del cambio. `undefined` si no aplica (p. ej. al crear). */
  antes?: unknown;
  /** Estado después del cambio. `undefined` si no aplica (p. ej. al eliminar). */
  despues?: unknown;
};

/**
 * Inserta una fila en `audit_log`. `antes`/`despues` se serializan a JSON
 * porque las columnas son texto (`previous_value`/`new_value`); si no vienen,
 * la columna queda `null` en vez de la cadena `"undefined"`.
 */
export async function auditar(
  tx: Tx,
  actor: Actor,
  { accion, entidad, entidadId, antes, despues }: DatosAuditoria,
): Promise<void> {
  await tx.insert(auditLog).values({
    userId: actor.userId,
    action: accion,
    entityType: entidad,
    entityId: entidadId,
    previousValue: antes === undefined ? null : JSON.stringify(antes),
    newValue: despues === undefined ? null : JSON.stringify(despues),
    // ponytail: no se captura `ip_address`/`user_agent`. El techo es que este
    // helper vive en `domain`-adyacente y no debe conocer `Request` ni
    // `headers()` de Next — acoplarlo a eso lo haría inútil para una futura
    // vía de escritura que no sea HTTP (un job programado, un script). Para
    // subir el techo: el route handler lee `request.headers.get("user-agent")`
    // y la IP (cabecera `x-forwarded-for` detrás del proxy de Supabase/hosting),
    // y se añaden `ip`/`userAgent` opcionales a `DatosAuditoria` que este
    // `values()` reenvía tal cual — sin cambiar la firma para quien no los pase.
  });
}
