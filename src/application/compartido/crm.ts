import type { Contacto } from "../contactos/puertos.ts";
import type { Negocio } from "../pipeline/puertos.ts";
import type { Actividad } from "../actividades/puertos.ts";
import { TIPOS_EVENTO_FINANCIERO } from "./eventos-financieros.ts";
import type { EventoFinanciero } from "./eventos-financieros.ts";

/** Espejo de referencias; esta fase no transmite nombres, teléfonos ni notas. */
export type ContactoDominio = Pick<Contacto, "id">;
export type NegocioDominio = Pick<Negocio, "id" | "stageId">;
export type ActividadDominio = Pick<Actividad, "id" | "activityType">;
export type RefExterna = { system: string; externalId: string };
export type EstadoIntegracion = "disponible" | "no_disponible";
export type ContextoCrm = { idempotencyKey: string; correlationId: string; version: number };

export interface CrmPort {
  reflejarContacto(contacto: ContactoDominio, contexto: ContextoCrm): Promise<RefExterna>;
  reflejarNegocio(negocio: NegocioDominio, contexto: ContextoCrm): Promise<RefExterna>;
  registrarActividad(actividad: ActividadDominio, contexto: ContextoCrm): Promise<RefExterna>;
  salud(): Promise<EstadoIntegracion>;
}

export const TIPOS_EVENTO_CRM = ["LeadCreado", "NegocioCambioEtapa", "ActividadRegistrada", ...TIPOS_EVENTO_FINANCIERO] as const;
export type EventoCrm =
  | { tipo: "LeadCreado"; aggregateId: number; payload: { contactId: number } }
  | { tipo: "NegocioCambioEtapa"; aggregateId: number; payload: NegocioDominio }
  | { tipo: "ActividadRegistrada"; aggregateId: number; payload: ActividadDominio }
  | EventoFinanciero;

/** Siempre pertenece al juego de repositorios de la misma unidad de trabajo. */
export interface OutboxCrm {
  emitir(evento: EventoCrm): Promise<void>;
}

export const CLASES_FALLO_CRM = ["RETRYABLE", "NON_RETRYABLE", "HUMAN_REQUIRED"] as const;
export type ClaseFalloCrm = typeof CLASES_FALLO_CRM[number];

/** Código controlado, sin mensaje del driver/proveedor que pueda contener PII. */
export class FalloCrm extends Error {
  readonly clase: ClaseFalloCrm;
  readonly retryAfterMs: number | undefined;
  constructor(clase: ClaseFalloCrm, retryAfterMs?: number) {
    super(clase);
    this.clase = clase;
    this.retryAfterMs = retryAfterMs;
  }
}
