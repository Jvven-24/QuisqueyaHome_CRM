/**
 * Puertos de la autoridad de inventario y compromisos comerciales (M40 b1i / b2a).
 *
 * En b1i3a/b1i3e, extrae la autoridad mínima de inventario para el cierre de venta
 * y alquiler. En b2a se amplía para soportar adquisición, extensión y cancelación
 * de holds con bloqueo transaccional ordenado, cuota de titular, idempotencia y outbox.
 */

import { DomainError } from "../../domain/errors.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";

export class CupoExcedidoError extends DomainError {
  constructor(message = "El titular ha alcanzado el límite máximo de holds activos permitidos.") {
    super(message);
  }
}

export type HoldStatus = "activo" | "convertido" | "cancelado" | "expirado";

export type UnidadHold = {
  id?: number;
  unitId: number;
  projectId: number;
  unitCodeNormalized: string;
  priceVersion: number;
  priceCents: bigint;
  currency: "USD" | "DOP";
  componentRole: string;
};

export type Hold = {
  id: number;
  publicId: string;
  dealId: number;
  holderId: number;
  status: HoldStatus;
  expiresAt: Date;
  policyVersion: number;
  extensionCount: number;
  reason: string;
  resolvedAt: Date | null;
  createdBy: number;
  updatedBy: number;
  rowVersion: number;
  correlationId: string;
  source: string;
  createdAt: Date;
  updatedAt: Date;
  units: UnidadHold[];
};

export type EntradaCrearHoldUnidad = {
  unitId: number;
  priceVersion: number;
  priceCents: bigint;
  currency: "USD" | "DOP";
  componentRole: string;
};

export type EntradaCrearHold = {
  dealId: number;
  holderId?: number;
  units: EntradaCrearHoldUnidad[];
  reason: string;
  policyVersion?: number;
  durationHours?: number;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  source: string;
  actorId: number;
};

export type EntradaExtenderHold = {
  id: number | string;
  expectedVersion: number;
  reason: string;
  additionalHours?: number;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  source: string;
  actorId: number;
};

export type EntradaCancelarHold = {
  id: number | string;
  expectedVersion: number;
  reason: string;
  idempotencyKey: string;
  requestHash: string;
  correlationId: string;
  source: string;
  actorId: number;
};

export type FiltrosHolds = {
  dealId?: number;
  holderId?: number;
  status?: HoldStatus;
  unitId?: number;
  id?: number | string;
};

/**
 * Autoridad base de inventario y compromisos comerciales (M40 b1i / b2a).
 * Conserva compatibilidad con pipeline mientras habilita los métodos de hold.
 */
export type CompromisosPort = {
  cerrarVenta(params: { unitId: number; projectId: number; dealId: number; actorId: number }): Promise<Date>;
  cerrarAlquiler(params: { unitId: number; projectId: number; dealId: number; actorId: number }): Promise<Date>;
  crearHold?(params: EntradaCrearHold): Promise<Hold>;
  extenderHold?(params: EntradaExtenderHold): Promise<Hold>;
  cancelarHold?(params: EntradaCancelarHold): Promise<Hold>;
  buscarHoldPorId?(id: number, actor: Actor, scope: PermissionScope): Promise<Hold | null>;
  buscarHoldPorPublicId?(publicId: string, actor: Actor, scope: PermissionScope): Promise<Hold | null>;
  listarHolds?(filtros: FiltrosHolds, actor: Actor, scope: PermissionScope): Promise<Hold[]>;
};

/**
 * Puerto ampliado de compromisos con capacidades completas de holds requeridas para b2a.
 */
export type CompromisosHoldsPort = CompromisosPort & {
  crearHold(params: EntradaCrearHold): Promise<Hold>;
  extenderHold(params: EntradaExtenderHold): Promise<Hold>;
  cancelarHold(params: EntradaCancelarHold): Promise<Hold>;
  buscarHoldPorId(id: number, actor: Actor, scope: PermissionScope): Promise<Hold | null>;
  buscarHoldPorPublicId(publicId: string, actor: Actor, scope: PermissionScope): Promise<Hold | null>;
  listarHolds(filtros: FiltrosHolds, actor: Actor, scope: PermissionScope): Promise<Hold[]>;
};

/** Juego de repositorios para la unidad de trabajo del módulo de compromisos. */
export type ReposCompromisos = {
  compromisos: CompromisosHoldsPort;
};
