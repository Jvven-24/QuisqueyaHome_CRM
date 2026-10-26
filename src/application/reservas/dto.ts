import type { Actor } from "../../domain/rbac.ts";
import type { Reserva, ReservaParty, UnidadReserva } from "./puertos.ts";

export type UnidadReservaDto = {
  id?: number;
  unitId: number;
  projectId: number;
  unitCode: string;
  priceCents: string;
  currency: "USD" | "DOP";
  componentRole: string;
  releasedAt: string | null;
  releaseReason: string | null;
};

export type ReservaPartyDto = {
  id?: number;
  contactId: number;
  role: "titular" | "representante";
  representationEvidenceId: number | null;
};

export type ReservaDto = {
  id: number;
  publicId: string;
  dealId: number;
  holdId: number | null;
  status: Reserva["status"];
  currency: "USD" | "DOP";
  totalCents: string;
  adjustmentCents: string;
  depositRequiredCents: string;
  conditionsVersion: number;
  conditionsDocumentId: number;
  conditionsHash: string;
  confirmationEvidenceId: number | null;
  confirmedBy: number | null;
  confirmedAt: string | null;
  expiresAt: string | null;
  reason: string;
  rowVersion: number;
  createdAt: string;
  updatedAt: string;
  parties: ReservaPartyDto[];
  units: UnidadReservaDto[];
};

export function dtoUnidadReserva(u: UnidadReserva): UnidadReservaDto {
  return {
    id: u.id,
    unitId: u.unitId,
    projectId: u.projectId,
    unitCode: u.unitCodeNormalized,
    priceCents: u.priceCents.toString(),
    currency: u.currency,
    componentRole: u.componentRole,
    releasedAt: u.releasedAt ? u.releasedAt.toISOString() : null,
    releaseReason: u.releaseReason ?? null,
  };
}

export function dtoReservaParty(p: ReservaParty): ReservaPartyDto {
  return {
    id: p.id,
    contactId: p.contactId,
    role: p.role,
    representationEvidenceId: p.representationEvidenceId ?? null,
  };
}

export function dtoReserva(_actor: Actor, reserva: Reserva): ReservaDto {
  return {
    id: reserva.id,
    publicId: reserva.publicId,
    dealId: reserva.dealId,
    holdId: reserva.holdId ?? null,
    status: reserva.status,
    currency: reserva.currency,
    totalCents: reserva.totalCents.toString(),
    adjustmentCents: reserva.adjustmentCents.toString(),
    depositRequiredCents: reserva.depositRequiredCents.toString(),
    conditionsVersion: reserva.conditionsVersion,
    conditionsDocumentId: reserva.conditionsDocumentId,
    conditionsHash: reserva.conditionsHash,
    confirmationEvidenceId: reserva.confirmationEvidenceId ?? null,
    confirmedBy: reserva.confirmedBy ?? null,
    confirmedAt: reserva.confirmedAt ? reserva.confirmedAt.toISOString() : null,
    expiresAt: reserva.expiresAt ? reserva.expiresAt.toISOString() : null,
    reason: reserva.reason,
    rowVersion: reserva.rowVersion,
    createdAt: reserva.createdAt.toISOString(),
    updatedAt: reserva.updatedAt.toISOString(),
    parties: (reserva.parties || []).map(dtoReservaParty),
    units: (reserva.units || []).map(dtoUnidadReserva),
  };
}

export function dtoListaReservas(actor: Actor, reservas: Reserva[]): ReservaDto[] {
  return reservas.map(r => dtoReserva(actor, r));
}
