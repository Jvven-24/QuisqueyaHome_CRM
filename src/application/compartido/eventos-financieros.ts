import { z } from "zod";
import type { AuditAction, EntityType } from "../../domain/catalogs.ts";

type ContratoEventoFinanciero = {
  tipo: string;
  entidad: EntityType;
  accion: AuditAction;
  version: 1;
  consumidor: string | null;
};

/**
 * M40 §4.1/4.2/6.7: registro único del vocabulario financiero v1.
 * null = consumidor NO aprobado/implementado. No registra manejadores ni habilita
 * emisores; I00/b2i deben resolver entregas por destino antes de activarlos.
 */
export const REGISTRO_EVENTOS_FINANCIEROS = [
  { tipo: "UnidadDisponibilidadCambiada", entidad: "unit", accion: "cambiar_disponibilidad", version: 1, consumidor: null },
  { tipo: "HoldCreado", entidad: "hold", accion: "crear", version: 1, consumidor: null },
  { tipo: "HoldExtendido", entidad: "hold", accion: "extender", version: 1, consumidor: null },
  { tipo: "HoldCancelado", entidad: "hold", accion: "cancelar", version: 1, consumidor: null },
  { tipo: "HoldExpirado", entidad: "hold", accion: "expirar", version: 1, consumidor: null },
  { tipo: "HoldConvertido", entidad: "hold", accion: "convertir", version: 1, consumidor: null },
  { tipo: "ReservaCreada", entidad: "reservation", accion: "crear", version: 1, consumidor: null },
  { tipo: "ReservaEnVerificacion", entidad: "reservation", accion: "presentar", version: 1, consumidor: null },
  { tipo: "ReservaConfirmada", entidad: "reservation", accion: "confirmar", version: 1, consumidor: null },
  { tipo: "ReservaExpirada", entidad: "reservation", accion: "expirar", version: 1, consumidor: null },
  { tipo: "ReservaUnidadCambiada", entidad: "reservation", accion: "cambiar_unidad", version: 1, consumidor: null },
  { tipo: "CancelacionSolicitada", entidad: "reservation", accion: "solicitar_cancelacion", version: 1, consumidor: null },
  { tipo: "ReservaCancelada", entidad: "reservation", accion: "cancelar", version: 1, consumidor: null },
  { tipo: "PlanAcordado", entidad: "payment_plan", accion: "acordar", version: 1, consumidor: null },
  { tipo: "PlanReestructurado", entidad: "payment_plan", accion: "reestructurar", version: 1, consumidor: null },
  { tipo: "PlanCompletado", entidad: "payment_plan", accion: "completar", version: 1, consumidor: null },
  { tipo: "PlanReabierto", entidad: "payment_plan", accion: "reabrir", version: 1, consumidor: null },
  { tipo: "PagoPresentado", entidad: "payment", accion: "presentar", version: 1, consumidor: null },
  { tipo: "PagoConfirmado", entidad: "payment", accion: "confirmar", version: 1, consumidor: null },
  { tipo: "PagoRechazado", entidad: "payment", accion: "rechazar", version: 1, consumidor: null },
  { tipo: "PagoAplicado", entidad: "payment", accion: "aplicar", version: 1, consumidor: null },
  { tipo: "PagoReversado", entidad: "payment", accion: "reversar", version: 1, consumidor: null },
  { tipo: "ContracargoRegistrado", entidad: "payment", accion: "registrar_contracargo", version: 1, consumidor: null },
  { tipo: "ExtractoImportado", entidad: "bank_import", accion: "importar", version: 1, consumidor: null },
  { tipo: "ConciliacionResuelta", entidad: "reconciliation_case", accion: "conciliar", version: 1, consumidor: null },
  { tipo: "ReembolsoSolicitado", entidad: "refund", accion: "solicitar", version: 1, consumidor: null },
  { tipo: "ReembolsoAprobado", entidad: "refund", accion: "aprobar", version: 1, consumidor: null },
  { tipo: "ReembolsoInstruido", entidad: "refund", accion: "instruir", version: 1, consumidor: null },
  { tipo: "ReembolsoConfirmado", entidad: "refund", accion: "confirmar", version: 1, consumidor: null },
  { tipo: "ReglaComisionVersionada", entidad: "commission_rule", accion: "versionar", version: 1, consumidor: null },
  { tipo: "ComisionProyectada", entidad: "commission_entry", accion: "proyectar", version: 1, consumidor: null },
  { tipo: "ComisionDevengada", entidad: "commission_entry", accion: "devengar", version: 1, consumidor: null },
  { tipo: "ComisionAprobada", entidad: "commission_entry", accion: "aprobar", version: 1, consumidor: null },
  { tipo: "ComisionExigible", entidad: "commission_entry", accion: "hacer_exigible", version: 1, consumidor: null },
  { tipo: "ComisionAjustada", entidad: "commission_entry", accion: "ajustar", version: 1, consumidor: null },
  { tipo: "ComisionPagada", entidad: "commission_entry", accion: "pagar", version: 1, consumidor: null },
  { tipo: "LiquidacionAprobada", entidad: "payout_batch", accion: "aprobar", version: 1, consumidor: null },
  { tipo: "LiquidacionInstruida", entidad: "payout_batch", accion: "instruir", version: 1, consumidor: null },
  { tipo: "LiquidacionConciliada", entidad: "payout_batch", accion: "conciliar", version: 1, consumidor: null },
] as const satisfies readonly ContratoEventoFinanciero[];

export type TipoEventoFinanciero = typeof REGISTRO_EVENTOS_FINANCIEROS[number]["tipo"];
// El registro literal es no vacío; conservar la tupla requerida por Zod/Drizzle.
export const TIPOS_EVENTO_FINANCIERO = REGISTRO_EVENTOS_FINANCIEROS.map(e => e.tipo) as [TipoEventoFinanciero, ...TipoEventoFinanciero[]];

/** Solo referencias; rechaza cuentas, documentos, importes y PII adicionales. */
export const ESQUEMA_EVENTO_FINANCIERO = z.object({
  tipo: z.enum(TIPOS_EVENTO_FINANCIERO),
  aggregateId: z.number().int().positive().max(2_147_483_647),
  payload: z.object({
    publicId: z.uuid(),
    aggregateVersion: z.number().int().positive().max(2_147_483_647),
    commandId: z.uuid(),
    correlationId: z.uuid(),
  }).strict(),
}).strict();

export type EventoFinanciero = z.infer<typeof ESQUEMA_EVENTO_FINANCIERO>;
