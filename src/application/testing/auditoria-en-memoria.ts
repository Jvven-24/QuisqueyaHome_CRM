/**
 * Doble en memoria del puerto de auditoría. Guarda cada registro con el id del
 * actor, que es lo que una prueba de caso de uso necesita comprobar ("quedó
 * auditado y a nombre de quién"), y se puede revertir junto con el resto del
 * juego transaccional.
 */

import type { Auditoria, RegistroAuditoria } from "../compartido/auditoria.ts";
import type { Reversible } from "./reversible.ts";

export function auditoriaEnMemoria(): Auditoria &
  Reversible & { readonly registros: readonly (RegistroAuditoria & { actorId: number })[] } {
  let registros: (RegistroAuditoria & { actorId: number })[] = [];

  return {
    get registros() {
      return registros;
    },
    async registrar(actor, registro) {
      registros = [...registros, { ...registro, actorId: actor.userId }];
    },
    instantanea() {
      const copia = registros;
      // `registros` se reasigna en vez de mutarse: la copia es inmutable y
      // restaurarla es devolver la referencia.
      return () => {
        registros = copia;
      };
    },
  };
}
