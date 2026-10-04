import { z } from "zod";
import { FalloCrm } from "../../../application/compartido/crm.ts";
import type { CrmPort, RefExterna, ClaseFalloCrm } from "../../../application/compartido/crm.ts";
import { decidirReintento } from "./politica.ts";

const id = z.number().int().positive();
const eventoSchema = z.discriminatedUnion("eventType", [
  z.object({ eventType: z.literal("LeadCreado"), aggregateId: id, payload: z.object({ contactId: id }).strict() }),
  z.object({ eventType: z.literal("NegocioCambioEtapa"), aggregateId: id, payload: z.object({ id, stageId: id }).strict() }),
  z.object({ eventType: z.literal("ActividadRegistrada"), aggregateId: id, payload: z.object({ id, activityType: z.enum(["task", "call", "meeting", "note", "whatsapp", "email"]) }).strict() }),
]);

export type PendienteOutbox = {
  eventId: string; eventType: string; aggregateId: number; payload: unknown;
  version: number; correlationId: string; idempotencyKey: string; attempts: number;
};
export interface RegistroPendiente {
  evento: PendienteOutbox;
  enviado(ref: RefExterna, entityType: string, localId: number, cuando: Date): Promise<void>;
  fallido(clase: ClaseFalloCrm, proximo: Date | null, cuando: Date): Promise<void>;
}
export interface ColaOutbox {
  /** Mantiene lock hasta concluir callback; liberación y estado en la misma transacción. */
  conSiguiente(cuando: Date, procesar: (registro: RegistroPendiente) => Promise<void>): Promise<boolean>;
}

/** Una pasada acotada. El scheduler decide frecuencia; aquí nunca se duerme ni se conecta. */
export async function procesarOutbox(deps: {
  cola: ColaOutbox; crm: CrmPort; ahora?: () => Date; random?: () => number;
}, limite = 100): Promise<number> {
  if (!Number.isSafeInteger(limite) || limite < 1 || limite > 1000) throw new RangeError("Límite de lote inválido.");
  const ahora = deps.ahora ?? (() => new Date());
  let procesados = 0;
  while (procesados < limite && await deps.cola.conSiguiente(ahora(), async (registro) => {
    const evento = registro.evento;
    let resultado: { ref: RefExterna; entityType: string; localId: number };
    try {
      const parsed = eventoSchema.safeParse(evento);
      if (!parsed.success || evento.version !== 1) throw new FalloCrm("NON_RETRYABLE");
      const e = parsed.data;
      if (e.eventType !== "LeadCreado" && e.aggregateId !== e.payload.id) throw new FalloCrm("NON_RETRYABLE");
      const contexto = { version: evento.version, correlationId: evento.correlationId, idempotencyKey: evento.idempotencyKey };
      switch (e.eventType) {
        case "LeadCreado":
          resultado = { ref: await deps.crm.reflejarContacto({ id: e.payload.contactId }, contexto), entityType: "contact", localId: e.payload.contactId };
          break;
        case "NegocioCambioEtapa":
          resultado = { ref: await deps.crm.reflejarNegocio(e.payload, contexto), entityType: "deal", localId: e.aggregateId };
          break;
        case "ActividadRegistrada":
          resultado = { ref: await deps.crm.registrarActividad(e.payload, contexto), entityType: "activity", localId: e.aggregateId };
          break;
      }
    } catch (error) {
      const decision = decidirReintento(error, evento.attempts + 1, deps.random);
      const cuando = ahora();
      await registro.fallido(decision.clase, decision.esperaMs === null ? null : new Date(cuando.getTime() + decision.esperaMs), cuando);
      return;
    }
    // Fallar al persistir no se confunde con un rechazo del proveedor: rollback.
    await registro.enviado(resultado.ref, resultado.entityType, resultado.localId, ahora());
  })) procesados++;
  return procesados;
}
