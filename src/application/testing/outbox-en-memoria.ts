import type { EventoCrm, OutboxCrm } from "../compartido/crm.ts";
import type { Reversible } from "./reversible.ts";

export function outboxEnMemoria(): OutboxCrm & Reversible & { readonly eventos: readonly EventoCrm[] } {
  let eventos: EventoCrm[] = [];
  return {
    get eventos() { return structuredClone(eventos); },
    async emitir(evento) { eventos = [...eventos, structuredClone(evento)]; },
    instantanea() {
      const copia = eventos;
      return () => { eventos = copia; };
    },
  };
}
