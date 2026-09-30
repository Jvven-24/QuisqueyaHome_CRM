/**
 * Adaptadores Drizzle de los puertos compartidos (`application/compartido/`).
 *
 * `unidadDeTrabajoDrizzle` recibe un **constructor de repos** en vez de exponer
 * el `tx`: el caso de uso solo ve el juego de repositorios ya ligado a la
 * transacción. Si el adaptador entregara el `tx`, el caso de uso tendría que
 * conocer Drizzle (vetado en `application/`) y nada impediría construir un
 * repositorio con otra conexión y escribir fuera de la transacción.
 *
 * Imports relativos sin extensión, como `auth/actor.ts` y `db/client.ts`: este
 * archivo abre la conexión al cargarse la primera consulta y solo lo compila
 * Next; `node --test` nunca lo importa (por eso `audit.ts`, que sí se prueba,
 * usa `.ts`).
 */

import type { UnidadDeTrabajo } from "../../../application/compartido/unidad-de-trabajo";
import type { Auditoria } from "../../../application/compartido/auditoria";
import { auditar } from "../../audit";
import { transaction, type Db } from "../client";

/**
 * La transacción de Drizzle, derivada igual que en `audit.ts`. Se exporta para
 * que los repos de cada módulo tipen su constructor con el mismo `Tx`.
 */
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export function unidadDeTrabajoDrizzle<R>(construirRepos: (tx: Tx) => R): UnidadDeTrabajo<R> {
  return {
    ejecutar: (fn) => transaction((tx) => fn(construirRepos(tx))),
  };
}

/** Delega en `auditar`: escribe en la transacción `tx`, nunca en otra conexión. */
export function auditoriaDrizzle(tx: Tx): Auditoria {
  return {
    registrar: (actor, registro) => auditar(tx, actor, registro),
  };
}
