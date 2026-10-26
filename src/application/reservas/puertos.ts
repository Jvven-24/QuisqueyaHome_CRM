/**
 * Puertos de la autoridad de reservas inmobiliarias (M40 b2b).
 *
 * Define contratos de dominio y persistencia para la preparación, confirmación,
 * cambio de unidad, cancelación y consulta de reservas dentro de la cadena
 * transaccional de M40.
 */

import { DomainError } from "../../domain/errors.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";

export class ReservaInvalidaError extends DomainError {
  constructor(message = "La reserva no cumple las condiciones requeridas.") {
    super(message);
  }
}

export type ReservaStatus =
  | "borrador"
  | "pendiente_pago"
  | "en_verificacion"
  | "confirmada"
  | "expirada"
  | "cancelacion_solicitada"
  | "cancelada";

export type PartyRol = "titular" | "representante";

export type ReservaParty = {
  id?: number;
  reservationId?: number;
  contactId: number;
  role: PartyRol;
  representationEvidenceId: number | null;
  createdAt?: Date;
  createdBy?: number;
};

export type UnidadReserva = {
  id?: number;
  reservationId?: number;
  unitId: number;
  projectId: number;
  unitCodeNormalized: string;
  priceCents: bigint;
  currency: "USD" | "DOP";
  componentRole: string;
  releasedAt: Date | null;
  releaseReason: string | null;
  createdAt?: Date;
  createdBy?: number;
};

export type Reserva = {
  id: number;
  publicId: string;
  dealId: number;
  holdId: number | null;
  status: ReservaStatus;
  currency: "USD" | "DOP";
  totalCents: bigint;
  adjustmentCents: bigint;
  depositRequiredCents: bigint;
  conditionsVersion: number;
  conditionsDocumentId: number;
  conditionsHash: string;
  confirmationEvidenceId: number | null;
  confirmedBy: number | null;
  confirmedAt: Date | null;
  expiresAt: Date | null;
  reason: string;
  createdBy: number;
  updatedBy: number;
  rowVersion: number;
  correlationId: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  parties: ReservaParty[];
  units: UnidadReserva[];
};

export type EntradaCrearReservaParty = {
  contactId: number;
  role: PartyRol;
  representationEvidenceId?: number;
};

export type EntradaCrearReservaUnidad = {
  unitId: number;
  priceCents: bigint;
  currency: "USD" | "DOP";
  componentRole: string;
};

export type EntradaCrearReserva = {
  dealId: number;
  holdId?: number;
  status?: ReservaStatus;
  currency: "USD" | "DOP";
  totalCents: bigint;
  adjustmentCents?: bigint;
  depositRequiredCents: bigint;
  conditionsVersion: number;
  conditionsDocumentId: number;
  conditionsHash: string;
  expiresAt?: Date | null;
  reason: string;
  parties: EntradaCrearReservaParty[];
  units: EntradaCrearReservaUnidad[];
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  source: string;
  actorId: number;
};

export type EntradaConfirmarReserva = {
  id: number | string;
  expectedVersion: number;
  confirmationEvidenceId: number;
  reason: string;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  source: string;
  actorId: number;
};

export type EntradaCambiarUnidadReserva = {
  id: number | string;
  expectedVersion: number;
  oldUnitId: number;
  newUnit: EntradaCrearReservaUnidad;
  releaseReason: string;
  reason: string;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  source: string;
  actorId: number;
};

export type EntradaCancelarReserva = {
  id: number | string;
  expectedVersion: number;
  action?: "solicitar" | "cancelar";
  reason: string;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  source: string;
  actorId: number;
};

export type FiltrosReservas = {
  dealId?: number;
  status?: ReservaStatus;
  unitId?: number;
  id?: number | string;
};

export type ReservasPort = {
  crearReserva(params: EntradaCrearReserva): Promise<Reserva>;
  confirmarReserva(params: EntradaConfirmarReserva): Promise<Reserva>;
  cambiarUnidad(params: EntradaCambiarUnidadReserva): Promise<Reserva>;
  cancelarReserva(params: EntradaCancelarReserva): Promise<Reserva>;
  buscarReservaPorId(id: number, actor: Actor, scope: PermissionScope): Promise<Reserva | null>;
  buscarReservaPorPublicId(publicId: string, actor: Actor, scope: PermissionScope): Promise<Reserva | null>;
  listarReservas(filtros: FiltrosReservas, actor: Actor, scope: PermissionScope): Promise<Reserva[]>;
};

export type ReposReservas = {
  reservas: ReservasPort;
};
