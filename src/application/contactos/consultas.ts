/**
 * Consultas de solo lectura de Contactos.
 *
 * El tamaño de página vive aquí y no en la página web porque es una regla del
 * módulo (cuántas filas se piden) y la página solo la necesita para pasarla a la
 * vista; si cada superficie fijara su propio número, el `LIMIT` de la consulta y
 * el `tamanioPagina` que calcula "página X de Y" en la vista podrían desalinearse
 * sin error alguno.
 */

import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { FiltrosListado, ListadoContactos, LecturaContactos } from "./puertos.ts";

export const TAMANIO_PAGINA_CONTACTOS = 20;

export function consultarListadoContactos(
  lectura: LecturaContactos,
  actor: Actor,
  alcance: PermissionScope,
  filtros: FiltrosListado,
): Promise<ListadoContactos> {
  return lectura.listado(actor, alcance, { ...filtros, tamanioPagina: TAMANIO_PAGINA_CONTACTOS });
}
