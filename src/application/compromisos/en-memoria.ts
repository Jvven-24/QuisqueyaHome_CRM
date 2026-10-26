import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError } from "../../domain/errors.ts";
import { reaches, type Actor, type PermissionScope } from "../../domain/rbac.ts";
import { normalizarCodigoUnidad } from "../../domain/unidades.ts";
import type { Reversible } from "../testing/reversible.ts";
import {
  CupoExcedidoError,
  type CompromisosPort,
  type EntradaCancelarHold,
  type EntradaCrearHold,
  type EntradaExtenderHold,
  type FiltrosHolds,
  type Hold,
  type UnidadHold,
} from "./puertos.ts";

export type CompromisoEnMemoria = {
  id: number;
  unitId: number;
  projectId: number;
  unitCodeNormalized: string;
  kind: "hold" | "reservation" | "sale";
  status: "active" | "resolved";
  holdId?: number;
  expiresAt?: Date;
  resolvedAt?: Date | null;
  resolutionReason?: string | null;
  rowVersion: number;
};

export type VentaEnMemoria = {
  id: string;
  unitId: number;
  projectId: number;
  dealId: number;
  unitCodeNormalized: string;
};

export type UnidadEnMemoria = {
  id: number;
  projectId: number;
  code: string;
  status: "available" | "reserved" | "sold" | "unavailable";
};

export type NegocioEnMemoria = {
  id: number;
  brokerId: number;
  deletedAt: Date | null;
};

export type ComandoEnMemoria = {
  actorId: number;
  operation: string;
  idempotencyKey: string;
  requestHash: string;
  status: "processing" | "completed";
  httpStatus?: number;
  resultPublicId?: string;
  resultCode?: string;
};

export class CompromisosEnMemoria implements CompromisosPort, Reversible {
  holds: Hold[] = [];
  commitments: CompromisoEnMemoria[] = [];
  sales: VentaEnMemoria[] = [];
  units: UnidadEnMemoria[] = [];
  deals: NegocioEnMemoria[] = [];
  commands: ComandoEnMemoria[] = [];

  private nextHoldId = 1;
  private nextCommitmentId = 1;

  instantanea(): () => void {
    const holds = structuredClone(this.holds);
    const commitments = structuredClone(this.commitments);
    const sales = structuredClone(this.sales);
    const units = structuredClone(this.units);
    const deals = structuredClone(this.deals);
    const commands = structuredClone(this.commands);
    const nextHoldId = this.nextHoldId;
    const nextCommitmentId = this.nextCommitmentId;

    return () => {
      this.holds = holds;
      this.commitments = commitments;
      this.sales = sales;
      this.units = units;
      this.deals = deals;
      this.commands = commands;
      this.nextHoldId = nextHoldId;
      this.nextCommitmentId = nextCommitmentId;
    };
  }

  async cerrarVenta(params: { unitId: number; projectId: number; dealId: number; actorId: number }): Promise<Date> {
    const now = new Date();
    const unidad = this.units.find(u => u.id === params.unitId);
    if (!unidad) throw new NotFoundError();

    const ventaExistente = this.sales.find(s => s.unitId === params.unitId);
    if (ventaExistente) throw new ConflictError("La unidad ya no está disponible para este cierre.");

    // Resolver compromisos activos o expirados
    const compromisoActivo = this.commitments.find(c => c.unitId === params.unitId && c.status === "active");
    if (compromisoActivo) {
      if (compromisoActivo.kind === "hold" && compromisoActivo.holdId != null) {
        const hold = this.holds.find(h => h.id === compromisoActivo.holdId);
        if (hold) {
          if (hold.expiresAt <= now || hold.dealId === params.dealId) {
            hold.status = hold.expiresAt <= now ? "expirado" : "cancelado";
            hold.resolvedAt = now;
            compromisoActivo.status = "resolved";
            compromisoActivo.resolvedAt = now;
            compromisoActivo.resolutionReason = hold.expiresAt <= now ? "expirado" : "venta";
          } else {
            throw new ConflictError("La unidad tiene un compromiso pendiente de resolución.");
          }
        }
      }
    }

    unidad.status = "sold";
    this.sales.push({
      id: randomUUID(),
      unitId: params.unitId,
      projectId: params.projectId,
      dealId: params.dealId,
      unitCodeNormalized: normalizarCodigoUnidad(unidad.code),
    });

    return now;
  }

  async cerrarAlquiler(params: { unitId: number; projectId: number; dealId: number; actorId: number }): Promise<Date> {
    const now = new Date();
    const unidad = this.units.find(u => u.id === params.unitId);
    if (!unidad) throw new NotFoundError();

    const compromisoActivo = this.commitments.find(c => c.unitId === params.unitId && c.status === "active");
    if (compromisoActivo) {
      if (compromisoActivo.kind === "hold" && compromisoActivo.holdId != null) {
        const hold = this.holds.find(h => h.id === compromisoActivo.holdId);
        if (hold) {
          if (hold.expiresAt <= now || hold.dealId === params.dealId) {
            hold.status = hold.expiresAt <= now ? "expirado" : "cancelado";
            hold.resolvedAt = now;
            compromisoActivo.status = "resolved";
            compromisoActivo.resolvedAt = now;
            compromisoActivo.resolutionReason = hold.expiresAt <= now ? "expirado" : "alquiler";
          } else {
            throw new ConflictError("La unidad tiene un compromiso pendiente de resolución.");
          }
        }
      }
    }

    unidad.status = "reserved";
    return now;
  }

  async crearHold(params: EntradaCrearHold): Promise<Hold> {
    const now = new Date();

    // Idempotencia
    const cmdExistente = this.commands.find(
      c => c.actorId === params.actorId && c.operation === "HOLD_CREAR" && c.idempotencyKey === params.idempotencyKey,
    );
    if (cmdExistente) {
      if (cmdExistente.status === "completed") {
        if (cmdExistente.requestHash === params.requestHash) {
          const holdGuardado = this.holds.find(h => h.publicId === cmdExistente.resultPublicId);
          if (holdGuardado) return holdGuardado;
        } else {
          throw new ConflictError("Clave de idempotencia ya utilizada con un contenido distinto.");
        }
      } else {
        throw new ConflictError("Operación en curso para esta clave de idempotencia.");
      }
    }

    const titularId = params.holderId ?? params.actorId;

    // Guardia de cupo (máximo 3 holds activos por titular)
    const holdsActivos = this.holds.filter(
      h => h.holderId === titularId && h.status === "activo" && h.expiresAt > now,
    );
    if (holdsActivos.length >= 3) {
      throw new CupoExcedidoError("El titular ha alcanzado el límite máximo de holds activos permitidos.");
    }

    // Negocio existente
    const deal = this.deals.find(d => d.id === params.dealId && !d.deletedAt);
    if (!deal && this.deals.length > 0) {
      throw new NotFoundError("Negocio no encontrado.");
    }

    // Unidades disponibles
    const unitMap = new Map<number, UnidadEnMemoria>();
    for (const u of params.units) {
      const unidad = this.units.find(item => item.id === u.unitId);
      if (!unidad && this.units.length > 0) throw new NotFoundError("Unidad no encontrada.");
      if (unidad) {
        if (unidad.status !== "available") {
          throw new ConflictError(`La unidad ${unidad.code} no está disponible.`);
        }
        unitMap.set(unidad.id, unidad);
      }

      // Venta durable
      if (this.sales.some(s => s.unitId === u.unitId)) {
        throw new ConflictError("La unidad ya fue vendida.");
      }

      // Compromiso activo
      const compromiso = this.commitments.find(c => c.unitId === u.unitId && c.status === "active");
      if (compromiso) {
        if (compromiso.expiresAt && compromiso.expiresAt <= now) {
          compromiso.status = "resolved";
          compromiso.resolvedAt = now;
          compromiso.resolutionReason = "expirado";
        } else {
          throw new ConflictError("La unidad ya tiene un compromiso activo.");
        }
      }
    }

    const durationHours = params.durationHours ?? 48;
    const expiresAt = new Date(now.getTime() + durationHours * 3600 * 1000);
    const holdId = this.nextHoldId++;
    const publicId = randomUUID();

    const unidadesHold: UnidadHold[] = params.units.map(u => {
      const unidad = unitMap.get(u.unitId);
      const code = unidad ? unidad.code : `U-${u.unitId}`;
      const projectId = unidad ? unidad.projectId : 1;
      return {
        unitId: u.unitId,
        projectId,
        unitCodeNormalized: normalizarCodigoUnidad(code),
        priceVersion: u.priceVersion,
        priceCents: u.priceCents,
        currency: u.currency,
        componentRole: u.componentRole,
      };
    });

    const hold: Hold = {
      id: holdId,
      publicId,
      dealId: params.dealId,
      holderId: titularId,
      status: "activo",
      expiresAt,
      policyVersion: params.policyVersion ?? 1,
      extensionCount: 0,
      reason: params.reason,
      resolvedAt: null,
      createdBy: params.actorId,
      updatedBy: params.actorId,
      rowVersion: 1,
      correlationId: params.correlationId,
      source: params.source,
      createdAt: now,
      updatedAt: now,
      units: unidadesHold,
    };

    this.holds.push(hold);

    for (const u of unidadesHold) {
      this.commitments.push({
        id: this.nextCommitmentId++,
        unitId: u.unitId,
        projectId: u.projectId,
        unitCodeNormalized: u.unitCodeNormalized,
        kind: "hold",
        status: "active",
        holdId,
        expiresAt,
        rowVersion: 1,
      });
    }

    this.commands.push({
      actorId: params.actorId,
      operation: "HOLD_CREAR",
      idempotencyKey: params.idempotencyKey,
      requestHash: params.requestHash,
      status: "completed",
      httpStatus: 201,
      resultPublicId: publicId,
      resultCode: "HoldCreado",
    });

    return hold;
  }

  async extenderHold(params: EntradaExtenderHold): Promise<Hold> {
    const now = new Date();

    const cmdExistente = this.commands.find(
      c => c.actorId === params.actorId && c.operation === "HOLD_EXTENDER" && c.idempotencyKey === params.idempotencyKey,
    );
    if (cmdExistente) {
      if (cmdExistente.status === "completed") {
        if (cmdExistente.requestHash === params.requestHash) {
          const h = this.holds.find(item => item.publicId === cmdExistente.resultPublicId);
          if (h) return h;
        } else {
          throw new ConflictError("Clave de idempotencia ya utilizada con un contenido distinto.");
        }
      } else {
        throw new ConflictError("Operación en curso para esta clave de idempotencia.");
      }
    }

    const hold = typeof params.id === "number"
      ? this.holds.find(h => h.id === params.id)
      : this.holds.find(h => h.publicId === params.id);

    if (!hold) throw new NotFoundError("Hold no encontrado.");

    if (hold.status !== "activo") {
      throw new ConflictError("El hold no está activo.");
    }

    if (params.expectedVersion !== undefined && hold.rowVersion !== params.expectedVersion) {
      throw new ConflictError("Conflicto de concurrencia: la versión del hold ha cambiado.");
    }

    if (hold.expiresAt <= now) {
      hold.status = "expirado";
      hold.resolvedAt = now;
      for (const c of this.commitments.filter(c => c.holdId === hold.id && c.status === "active")) {
        c.status = "resolved";
        c.resolvedAt = now;
        c.resolutionReason = "expirado";
      }
      throw new ConflictError("El hold ya ha expirado.");
    }

    const additionalHours = params.additionalHours ?? 24;
    const newExpiresAt = new Date(hold.expiresAt.getTime() + additionalHours * 3600 * 1000);

    hold.expiresAt = newExpiresAt;
    hold.extensionCount += 1;
    hold.rowVersion += 1;
    hold.updatedBy = params.actorId;
    hold.updatedAt = now;
    hold.correlationId = params.correlationId;
    hold.source = params.source;

    for (const c of this.commitments.filter(c => c.holdId === hold.id && c.status === "active")) {
      c.expiresAt = newExpiresAt;
      c.rowVersion += 1;
    }

    this.commands.push({
      actorId: params.actorId,
      operation: "HOLD_EXTENDER",
      idempotencyKey: params.idempotencyKey,
      requestHash: params.requestHash,
      status: "completed",
      httpStatus: 200,
      resultPublicId: hold.publicId,
      resultCode: "HoldExtendido",
    });

    return hold;
  }

  async cancelarHold(params: EntradaCancelarHold): Promise<Hold> {
    const now = new Date();

    const cmdExistente = this.commands.find(
      c => c.actorId === params.actorId && c.operation === "HOLD_CANCELAR" && c.idempotencyKey === params.idempotencyKey,
    );
    if (cmdExistente) {
      if (cmdExistente.status === "completed") {
        if (cmdExistente.requestHash === params.requestHash) {
          const h = this.holds.find(item => item.publicId === cmdExistente.resultPublicId);
          if (h) return h;
        } else {
          throw new ConflictError("Clave de idempotencia ya utilizada con un contenido distinto.");
        }
      } else {
        throw new ConflictError("Operación en curso para esta clave de idempotencia.");
      }
    }

    const hold = typeof params.id === "number"
      ? this.holds.find(h => h.id === params.id)
      : this.holds.find(h => h.publicId === params.id);

    if (!hold) throw new NotFoundError("Hold no encontrado.");

    if (hold.status !== "activo") {
      throw new ConflictError("El hold no está activo.");
    }

    if (params.expectedVersion !== undefined && hold.rowVersion !== params.expectedVersion) {
      throw new ConflictError("Conflicto de concurrencia: la versión del hold ha cambiado.");
    }

    hold.status = "cancelado";
    hold.resolvedAt = now;
    hold.rowVersion += 1;
    hold.updatedBy = params.actorId;
    hold.updatedAt = now;
    hold.correlationId = params.correlationId;
    hold.source = params.source;

    for (const c of this.commitments.filter(c => c.holdId === hold.id && c.status === "active")) {
      c.status = "resolved";
      c.resolvedAt = now;
      c.resolutionReason = "cancelado";
      c.rowVersion += 1;
    }

    this.commands.push({
      actorId: params.actorId,
      operation: "HOLD_CANCELAR",
      idempotencyKey: params.idempotencyKey,
      requestHash: params.requestHash,
      status: "completed",
      httpStatus: 200,
      resultPublicId: hold.publicId,
      resultCode: "HoldCancelado",
    });

    return hold;
  }

  async buscarHoldPorId(id: number, actor: Actor, scope: PermissionScope): Promise<Hold | null> {
    const hold = this.holds.find(h => h.id === id);
    if (!hold) return null;
    const deal = this.deals.find(d => d.id === hold.dealId);
    if (deal && !reaches(actor, scope, deal.brokerId)) return null;
    return hold;
  }

  async buscarHoldPorPublicId(publicId: string, actor: Actor, scope: PermissionScope): Promise<Hold | null> {
    const hold = this.holds.find(h => h.publicId === publicId);
    if (!hold) return null;
    const deal = this.deals.find(d => d.id === hold.dealId);
    if (deal && !reaches(actor, scope, deal.brokerId)) return null;
    return hold;
  }

  async listarHolds(filtros: FiltrosHolds, actor: Actor, scope: PermissionScope): Promise<Hold[]> {
    return this.holds.filter(h => {
      const deal = this.deals.find(d => d.id === h.dealId);
      if (deal && !reaches(actor, scope, deal.brokerId)) return false;
      if (filtros.dealId !== undefined && h.dealId !== filtros.dealId) return false;
      if (filtros.holderId !== undefined && h.holderId !== filtros.holderId) return false;
      if (filtros.status !== undefined && h.status !== filtros.status) return false;
      if (filtros.unitId !== undefined && !h.units.some(u => u.unitId === filtros.unitId)) return false;
      if (filtros.id !== undefined) {
        if (typeof filtros.id === "number" && h.id !== filtros.id) return false;
        if (typeof filtros.id === "string" && h.publicId !== filtros.id) return false;
      }
      return true;
    });
  }
}
