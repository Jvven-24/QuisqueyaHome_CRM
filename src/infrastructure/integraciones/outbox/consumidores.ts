import { z } from "zod";
import { FalloCrm } from "../../../application/compartido/crm.ts";
import { crearRegistro } from "./registro.ts";
import type { ConsumidorOutbox, Manejador, PendienteOutbox } from "./registro.ts";

const id = z.number().int().positive();
const esquemas = {
  LeadCreado: z.object({ eventType: z.literal("LeadCreado"), aggregateId: id, payload: z.object({ contactId: id }).strict() }),
  NegocioCambioEtapa: z.object({ eventType: z.literal("NegocioCambioEtapa"), aggregateId: id, payload: z.object({ id, stageId: id }).strict() }),
  ActividadRegistrada: z.object({
    eventType: z.literal("ActividadRegistrada"), aggregateId: id,
    payload: z.object({ id, activityType: z.enum(["task", "call", "meeting", "note", "whatsapp", "email"]) }).strict(),
  }),
} as const;

/** Evento mal formado o de versión desconocida: no se invoca el puerto, fallo no reintentable. */
function validar<T extends z.ZodTypeAny>(esquema: T, evento: PendienteOutbox): z.infer<T> {
  const parsed = esquema.safeParse(evento);
  if (!parsed.success || evento.version !== 1) throw new FalloCrm("NON_RETRYABLE");
  return parsed.data;
}
const contextoDe = (evento: PendienteOutbox) =>
  ({ version: evento.version, correlationId: evento.correlationId, idempotencyKey: evento.idempotencyKey });

const leadCreado: Manejador = async (evento, { crm }) => {
  const e = validar(esquemas.LeadCreado, evento);
  return { ref: await crm.reflejarContacto({ id: e.payload.contactId }, contextoDe(evento)), entityType: "contact", localId: e.payload.contactId };
};
const negocioCambioEtapa: Manejador = async (evento, { crm }) => {
  const e = validar(esquemas.NegocioCambioEtapa, evento);
  if (e.aggregateId !== e.payload.id) throw new FalloCrm("NON_RETRYABLE");
  return { ref: await crm.reflejarNegocio(e.payload, contextoDe(evento)), entityType: "deal", localId: e.aggregateId };
};
const actividadRegistrada: Manejador = async (evento, { crm }) => {
  const e = validar(esquemas.ActividadRegistrada, evento);
  if (e.aggregateId !== e.payload.id) throw new FalloCrm("NON_RETRYABLE");
  return { ref: await crm.registrarActividad(e.payload, contextoDe(evento)), entityType: "activity", localId: e.aggregateId };
};

/** Destino actual: espejo del CRM comercial vía `CrmPort`. */
export const consumidorCrm: ConsumidorOutbox = {
  destino: "crm",
  manejadores: { LeadCreado: leadCreado, NegocioCambioEtapa: negocioCambioEtapa, ActividadRegistrada: actividadRegistrada },
};

/**
 * Bus de eventos del CRM. Para que un módulo nuevo (Cobros, Portal, Academy) consuma sus eventos
 * añade aquí su `ConsumidorOutbox`; mientras no esté, sus eventos quedan pendientes e intactos.
 */
export const registroPorDefecto = crearRegistro([consumidorCrm]);
export const TIPOS_CONSUMIDOS_POR_DEFECTO = registroPorDefecto.tipos();
