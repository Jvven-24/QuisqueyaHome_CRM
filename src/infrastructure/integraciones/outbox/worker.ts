import type { CrmPort, RefExterna, ClaseFalloCrm } from "../../../application/compartido/crm.ts";
import { registroPorDefecto } from "./consumidores.ts";
import { decidirReintento } from "./politica.ts";
import type { PendienteOutbox, RegistroConsumidores, ResultadoConsumo } from "./registro.ts";

export type { PendienteOutbox };
export interface RegistroPendiente {
  evento: PendienteOutbox;
  enviado(ref: RefExterna, entityType: string, localId: number, cuando: Date): Promise<void>;
  fallido(clase: ClaseFalloCrm, proximo: Date | null, cuando: Date): Promise<void>;
}
export interface ColaOutbox {
  /**
   * Reclama el siguiente evento pendiente cuyo tipo esté en `tipos` (los que tienen consumidor);
   * cualquier otro tipo no se toca. Mantiene el lock hasta concluir el callback; liberación y estado
   * en la misma transacción. Con `tipos` vacío no reclama nada.
   */
  conSiguiente(cuando: Date, tipos: readonly string[], procesar: (registro: RegistroPendiente) => Promise<void>): Promise<boolean>;
}

/** Una pasada acotada. El scheduler decide frecuencia; aquí nunca se duerme ni se conecta. */
export async function procesarOutbox(deps: {
  cola: ColaOutbox; crm: CrmPort; registro?: RegistroConsumidores; ahora?: () => Date; random?: () => number;
}, limite = 100): Promise<number> {
  if (!Number.isSafeInteger(limite) || limite < 1 || limite > 1000) throw new RangeError("Límite de lote inválido.");
  const ahora = deps.ahora ?? (() => new Date());
  const consumidores = deps.registro ?? registroPorDefecto;
  const tipos = consumidores.tipos();
  let procesados = 0;
  while (procesados < limite && await deps.cola.conSiguiente(ahora(), tipos, async (pendiente) => {
    const evento = pendiente.evento;
    const manejador = consumidores.manejadorDe(evento.eventType);
    // Nunca a cola muerta: significa que la cola ignoró el filtro. El error revierte la transacción y el evento queda intacto.
    if (!manejador) throw new Error("La cola entregó un evento sin consumidor registrado.");
    let resultado: ResultadoConsumo;
    try {
      resultado = await manejador(evento, { crm: deps.crm });
    } catch (error) {
      const decision = decidirReintento(error, evento.attempts + 1, deps.random);
      const cuando = ahora();
      await pendiente.fallido(decision.clase, decision.esperaMs === null ? null : new Date(cuando.getTime() + decision.esperaMs), cuando);
      return;
    }
    // Fallar al persistir no se confunde con un rechazo del proveedor: rollback.
    await pendiente.enviado(resultado.ref, resultado.entityType, resultado.localId, ahora());
  })) procesados++;
  return procesados;
}
