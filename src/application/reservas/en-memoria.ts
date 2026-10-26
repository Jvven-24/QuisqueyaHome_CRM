import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError } from "../../domain/errors.ts";
import { reaches, type Actor, type PermissionScope } from "../../domain/rbac.ts";
import { normalizarCodigoUnidad } from "../../domain/unidades.ts";
import type { Reversible } from "../testing/reversible.ts";
import type {
  EntradaCambiarUnidadReserva,
  EntradaCancelarReserva,
  EntradaConfirmarReserva,
  EntradaCrearReserva,
  FiltrosReservas,
  Reserva,
  ReservaParty,
  ReservasPort,
  UnidadReserva,
} from "./puertos.ts";

export type CompromisoEnMemoria = {
  id: number;
  unitId: number;
  projectId: number;
  unitCodeNormalized: string;
  kind: "hold" | "reservation" | "sale";
  status: "active" | "resolved";
  holdId?: number;
  reservationUnitId?: number;
  expiresAt?: Date | null;
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

export type HoldEnMemoria = {
  id: number;
  dealId: number;
  holderId: number;
  status: "activo" | "convertido" | "cancelado" | "expirado";
  expiresAt: Date;
  units: Array<{ unitId: number; priceCents: bigint; currency: "USD" | "DOP"; componentRole: string }>;
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

export class ReservasEnMemoria implements ReservasPort, Reversible {
  reservas: Reserva[] = [];
  commitments: CompromisoEnMemoria[] = [];
  sales: VentaEnMemoria[] = [];
  unitsCatalog: UnidadEnMemoria[] = [];
  deals: NegocioEnMemoria[] = [];
  holds: HoldEnMemoria[] = [];
  commands: ComandoEnMemoria[] = [];
  files: Array<{ id: number }> = [];

  private nextReservaId = 1;
  private nextPartyId = 1;
  private nextReservaUnitId = 1;
  private nextCommitmentId = 1;

  instantanea(): () => void {
    const reservas = structuredClone(this.reservas);
    const commitments = structuredClone(this.commitments);
    const sales = structuredClone(this.sales);
    const unitsCatalog = structuredClone(this.unitsCatalog);
    const deals = structuredClone(this.deals);
    const holds = structuredClone(this.holds);
    const commands = structuredClone(this.commands);
    const files = structuredClone(this.files);
    const nextReservaId = this.nextReservaId;
    const nextPartyId = this.nextPartyId;
    const nextReservaUnitId = this.nextReservaUnitId;
    const nextCommitmentId = this.nextCommitmentId;

    return () => {
      this.reservas = reservas;
      this.commitments = commitments;
      this.sales = sales;
      this.unitsCatalog = unitsCatalog;
      this.deals = deals;
      this.holds = holds;
      this.commands = commands;
      this.files = files;
      this.nextReservaId = nextReservaId;
      this.nextPartyId = nextPartyId;
      this.nextReservaUnitId = nextReservaUnitId;
      this.nextCommitmentId = nextCommitmentId;
    };
  }

  async crearReserva(params: EntradaCrearReserva): Promise<Reserva> {
    const cmdExistente = this.commands.find(
      c => c.actorId === params.actorId && c.operation === "RESERVA_CREAR" && c.idempotencyKey === params.idempotencyKey,
    );

    if (cmdExistente) {
      if (cmdExistente.status === "completed") {
        if (cmdExistente.requestHash === params.requestHash && cmdExistente.resultPublicId) {
          const res = this.reservas.find(r => r.publicId === cmdExistente.resultPublicId);
          if (res) return structuredClone(res);
        }
        throw new ConflictError("Clave de idempotencia ya utilizada con un contenido distinto.");
      }
      throw new ConflictError("Operación en curso para esta clave de idempotencia.");
    }

    this.commands.push({
      actorId: params.actorId,
      operation: "RESERVA_CREAR",
      idempotencyKey: params.idempotencyKey,
      requestHash: params.requestHash,
      status: "processing",
    });

    const now = new Date();
    const deal = this.deals.find(d => d.id === params.dealId && !d.deletedAt);
    if (!deal) throw new NotFoundError("Negocio no encontrado.");

    let holdActivo: HoldEnMemoria | undefined;
    if (params.holdId != null) {
      holdActivo = this.holds.find(h => h.id === params.holdId);
      if (!holdActivo) throw new NotFoundError("Hold no encontrado.");
      if (holdActivo.dealId !== params.dealId) {
        throw new ConflictError("El hold no pertenece al negocio indicado.");
      }
      if (holdActivo.status !== "activo" || holdActivo.expiresAt <= now) {
        throw new ConflictError("El hold no está activo o ha expirado.");
      }
    }

    const unitIds = [...new Set(params.units.map(u => u.unitId))].sort((a, b) => a - b);
    for (const uid of unitIds) {
      const u = this.unitsCatalog.find(uc => uc.id === uid);
      if (!u) throw new NotFoundError(`La unidad ${uid} no existe.`);
      if (u.status !== "available") throw new ConflictError(`La unidad ${u.code} no está disponible.`);

      const venta = this.sales.find(s => s.unitId === uid);
      if (venta) throw new ConflictError("Una o más unidades ya cuentan con una venta durable registrada.");

      const compromisoActivo = this.commitments.find(c => c.unitId === uid && c.status === "active");
      if (compromisoActivo) {
        if (compromisoActivo.expiresAt && compromisoActivo.expiresAt <= now) {
          compromisoActivo.status = "resolved";
          compromisoActivo.resolvedAt = now;
          compromisoActivo.resolutionReason = "expirado";
        } else if (holdActivo && compromisoActivo.holdId === holdActivo.id) {
          // Compromiso del propio hold
        } else {
          throw new ConflictError(`La unidad ${uid} ya tiene un compromiso activo.`);
        }
      }
    }

    if (holdActivo) {
      holdActivo.status = "convertido";
      for (const c of this.commitments.filter(c => c.holdId === holdActivo?.id && c.status === "active")) {
        c.status = "resolved";
        c.resolvedAt = now;
        c.resolutionReason = "convertido";
      }
    }

    const reservaId = this.nextReservaId++;
    const publicId = randomUUID();
    const status = params.status ?? "pendiente_pago";

    const partiesInsertadas: ReservaParty[] = params.parties.map(p => ({
      id: this.nextPartyId++,
      reservationId: reservaId,
      contactId: p.contactId,
      role: p.role,
      representationEvidenceId: p.representationEvidenceId ?? null,
      createdAt: now,
      createdBy: params.actorId,
    }));

    const unitsInsertadas: UnidadReserva[] = [];
    for (const u of params.units) {
      const unitCat = this.unitsCatalog.find(uc => uc.id === u.unitId)!;
      const unitCodeNormalized = normalizarCodigoUnidad(unitCat.code);
      const resUnitId = this.nextReservaUnitId++;

      unitsInsertadas.push({
        id: resUnitId,
        reservationId: reservaId,
        unitId: u.unitId,
        projectId: unitCat.projectId,
        unitCodeNormalized,
        priceCents: u.priceCents,
        currency: u.currency,
        componentRole: u.componentRole,
        releasedAt: null,
        releaseReason: null,
        createdAt: now,
        createdBy: params.actorId,
      });

      if (["pendiente_pago", "en_verificacion", "confirmada", "cancelacion_solicitada"].includes(status)) {
        this.commitments.push({
          id: this.nextCommitmentId++,
          unitId: u.unitId,
          projectId: unitCat.projectId,
          unitCodeNormalized,
          kind: "reservation",
          status: "active",
          reservationUnitId: resUnitId,
          expiresAt: params.expiresAt ?? null,
          rowVersion: 1,
        });
      }
    }

    const nuevaReserva: Reserva = {
      id: reservaId,
      publicId,
      dealId: params.dealId,
      holdId: params.holdId ?? null,
      status,
      currency: params.currency,
      totalCents: params.totalCents,
      adjustmentCents: params.adjustmentCents ?? 0n,
      depositRequiredCents: params.depositRequiredCents,
      conditionsVersion: params.conditionsVersion,
      conditionsDocumentId: params.conditionsDocumentId,
      conditionsHash: params.conditionsHash,
      confirmationEvidenceId: null,
      confirmedBy: null,
      confirmedAt: null,
      expiresAt: params.expiresAt ?? null,
      reason: params.reason,
      createdBy: params.actorId,
      updatedBy: params.actorId,
      rowVersion: 1,
      correlationId: params.correlationId,
      source: params.source,
      createdAt: now,
      updatedAt: now,
      parties: partiesInsertadas,
      units: unitsInsertadas,
    };

    this.reservas.push(nuevaReserva);

    const cmd = this.commands.find(
      c => c.actorId === params.actorId && c.operation === "RESERVA_CREAR" && c.idempotencyKey === params.idempotencyKey,
    );
    if (cmd) {
      cmd.status = "completed";
      cmd.httpStatus = 201;
      cmd.resultPublicId = publicId;
      cmd.resultCode = "ReservaCreada";
    }

    return structuredClone(nuevaReserva);
  }

  async confirmarReserva(params: EntradaConfirmarReserva): Promise<Reserva> {
    const cmdExistente = this.commands.find(
      c => c.actorId === params.actorId && c.operation === "RESERVA_CONFIRMAR" && c.idempotencyKey === params.idempotencyKey,
    );

    if (cmdExistente) {
      if (cmdExistente.status === "completed") {
        if (cmdExistente.requestHash === params.requestHash && cmdExistente.resultPublicId) {
          const res = this.reservas.find(r => r.publicId === cmdExistente.resultPublicId);
          if (res) return structuredClone(res);
        }
        throw new ConflictError("Clave de idempotencia ya utilizada con un contenido distinto.");
      }
      throw new ConflictError("Operación en curso para esta clave de idempotencia.");
    }

    this.commands.push({
      actorId: params.actorId,
      operation: "RESERVA_CONFIRMAR",
      idempotencyKey: params.idempotencyKey,
      requestHash: params.requestHash,
      status: "processing",
    });

    const now = new Date();
    const reserva = this.reservas.find(
      r => r.id === params.id || r.publicId === params.id,
    );
    if (!reserva) throw new NotFoundError("Reserva no encontrada.");

    if (reserva.rowVersion !== params.expectedVersion) {
      throw new ConflictError("Versión de reserva desactualizada.");
    }

    if (reserva.status === "confirmada") {
      throw new ConflictError("La reserva ya ha sido confirmada.");
    }
    if (reserva.status === "cancelada" || reserva.status === "expirada") {
      throw new ConflictError("No se puede confirmar una reserva terminal.");
    }
    if (reserva.expiresAt && reserva.expiresAt <= now) {
      throw new ConflictError("La reserva ha expirado y no puede confirmarse.");
    }

    reserva.status = "confirmada";
    reserva.confirmedAt = now;
    reserva.confirmedBy = params.actorId;
    reserva.confirmationEvidenceId = params.confirmationEvidenceId;
    reserva.reason = params.reason;
    reserva.rowVersion++;
    reserva.updatedAt = now;
    reserva.updatedBy = params.actorId;

    const cmd = this.commands.find(
      c => c.actorId === params.actorId && c.operation === "RESERVA_CONFIRMAR" && c.idempotencyKey === params.idempotencyKey,
    );
    if (cmd) {
      cmd.status = "completed";
      cmd.httpStatus = 200;
      cmd.resultPublicId = reserva.publicId;
      cmd.resultCode = "ReservaConfirmada";
    }

    return structuredClone(reserva);
  }

  async cambiarUnidad(params: EntradaCambiarUnidadReserva): Promise<Reserva> {
    const cmdExistente = this.commands.find(
      c => c.actorId === params.actorId && c.operation === "RESERVA_CAMBIO_UNIDAD" && c.idempotencyKey === params.idempotencyKey,
    );

    if (cmdExistente) {
      if (cmdExistente.status === "completed") {
        if (cmdExistente.requestHash === params.requestHash && cmdExistente.resultPublicId) {
          const res = this.reservas.find(r => r.publicId === cmdExistente.resultPublicId);
          if (res) return structuredClone(res);
        }
        throw new ConflictError("Clave de idempotencia ya utilizada con un contenido distinto.");
      }
      throw new ConflictError("Operación en curso para esta clave de idempotencia.");
    }

    this.commands.push({
      actorId: params.actorId,
      operation: "RESERVA_CAMBIO_UNIDAD",
      idempotencyKey: params.idempotencyKey,
      requestHash: params.requestHash,
      status: "processing",
    });

    const now = new Date();
    const reserva = this.reservas.find(
      r => r.id === params.id || r.publicId === params.id,
    );
    if (!reserva) throw new NotFoundError("Reserva no encontrada.");

    if (reserva.rowVersion !== params.expectedVersion) {
      throw new ConflictError("Versión de reserva desactualizada.");
    }

    if (["cancelada", "expirada"].includes(reserva.status)) {
      throw new ConflictError("No se puede cambiar la unidad de una reserva terminal.");
    }

    const oldUnit = reserva.units.find(u => u.unitId === params.oldUnitId && u.releasedAt == null);
    if (!oldUnit) {
      throw new NotFoundError("La unidad a sustituir no se encuentra activa en esta reserva.");
    }

    const newUnitCat = this.unitsCatalog.find(u => u.id === params.newUnit.unitId);
    if (!newUnitCat) throw new NotFoundError("La unidad de destino no existe.");
    if (newUnitCat.status !== "available") {
      throw new ConflictError(`La unidad de destino ${newUnitCat.code} no está disponible.`);
    }

    const venta = this.sales.find(s => s.unitId === params.newUnit.unitId);
    if (venta) throw new ConflictError("La unidad de destino cuenta con una venta durable registrada.");

    const compromisoActivo = this.commitments.find(c => c.unitId === params.newUnit.unitId && c.status === "active");
    if (compromisoActivo) {
      if (compromisoActivo.expiresAt && compromisoActivo.expiresAt <= now) {
        compromisoActivo.status = "resolved";
        compromisoActivo.resolvedAt = now;
        compromisoActivo.resolutionReason = "expirado";
      } else {
        throw new ConflictError("La unidad de destino ya tiene un compromiso activo.");
      }
    }

    if (reserva.status !== "borrador" && params.newUnit.priceCents !== oldUnit.priceCents) {
      throw new ConflictError("El cambio de unidad no puede alterar el total pactado de una reserva no borrador.");
    }

    oldUnit.releasedAt = now;
    oldUnit.releaseReason = params.releaseReason;

    const oldCommitment = this.commitments.find(
      c => c.reservationUnitId === oldUnit.id && c.status === "active",
    );
    if (oldCommitment) {
      oldCommitment.status = "resolved";
      oldCommitment.resolvedAt = now;
      oldCommitment.resolutionReason = "cambio_unidad";
    }

    const newUnitCodeNormalized = normalizarCodigoUnidad(newUnitCat.code);
    const newResUnitId = this.nextReservaUnitId++;
    const newResUnit: UnidadReserva = {
      id: newResUnitId,
      reservationId: reserva.id,
      unitId: params.newUnit.unitId,
      projectId: newUnitCat.projectId,
      unitCodeNormalized: newUnitCodeNormalized,
      priceCents: params.newUnit.priceCents,
      currency: params.newUnit.currency,
      componentRole: params.newUnit.componentRole,
      releasedAt: null,
      releaseReason: null,
      createdAt: now,
      createdBy: params.actorId,
    };
    reserva.units.push(newResUnit);

    if (["pendiente_pago", "en_verificacion", "confirmada", "cancelacion_solicitada"].includes(reserva.status)) {
      this.commitments.push({
        id: this.nextCommitmentId++,
        unitId: params.newUnit.unitId,
        projectId: newUnitCat.projectId,
        unitCodeNormalized: newUnitCodeNormalized,
        kind: "reservation",
        status: "active",
        reservationUnitId: newResUnitId,
        expiresAt: reserva.expiresAt ?? null,
        rowVersion: 1,
      });
    }

    reserva.rowVersion++;
    reserva.updatedAt = now;
    reserva.updatedBy = params.actorId;

    const cmd = this.commands.find(
      c => c.actorId === params.actorId && c.operation === "RESERVA_CAMBIO_UNIDAD" && c.idempotencyKey === params.idempotencyKey,
    );
    if (cmd) {
      cmd.status = "completed";
      cmd.httpStatus = 200;
      cmd.resultPublicId = reserva.publicId;
      cmd.resultCode = "ReservaUnidadCambiada";
    }

    return structuredClone(reserva);
  }

  async cancelarReserva(params: EntradaCancelarReserva): Promise<Reserva> {
    const cmdExistente = this.commands.find(
      c => c.actorId === params.actorId && c.operation === "RESERVA_CANCELAR" && c.idempotencyKey === params.idempotencyKey,
    );

    if (cmdExistente) {
      if (cmdExistente.status === "completed") {
        if (cmdExistente.requestHash === params.requestHash && cmdExistente.resultPublicId) {
          const res = this.reservas.find(r => r.publicId === cmdExistente.resultPublicId);
          if (res) return structuredClone(res);
        }
        throw new ConflictError("Clave de idempotencia ya utilizada con un contenido distinto.");
      }
      throw new ConflictError("Operación en curso para esta clave de idempotencia.");
    }

    this.commands.push({
      actorId: params.actorId,
      operation: "RESERVA_CANCELAR",
      idempotencyKey: params.idempotencyKey,
      requestHash: params.requestHash,
      status: "processing",
    });

    const now = new Date();
    const reserva = this.reservas.find(
      r => r.id === params.id || r.publicId === params.id,
    );
    if (!reserva) throw new NotFoundError("Reserva no encontrada.");

    if (reserva.rowVersion !== params.expectedVersion) {
      throw new ConflictError("Versión de reserva desactualizada.");
    }

    if (["cancelada", "expirada"].includes(reserva.status)) {
      throw new ConflictError("La reserva ya se encuentra en un estado terminal.");
    }

    if (params.action === "solicitar") {
      reserva.status = "cancelacion_solicitada";
      reserva.rowVersion++;
      reserva.updatedAt = now;
      reserva.updatedBy = params.actorId;
    } else {
      const terminalStatus = reserva.confirmedAt != null ? "cancelada" : "expirada";
      reserva.status = terminalStatus;
      reserva.rowVersion++;
      reserva.updatedAt = now;
      reserva.updatedBy = params.actorId;

      for (const u of reserva.units.filter(u => u.releasedAt == null)) {
        u.releasedAt = now;
        u.releaseReason = params.reason;

        const comm = this.commitments.find(c => c.reservationUnitId === u.id && c.status === "active");
        if (comm) {
          comm.status = "resolved";
          comm.resolvedAt = now;
          comm.resolutionReason = terminalStatus;
        }
      }
    }

    const cmd = this.commands.find(
      c => c.actorId === params.actorId && c.operation === "RESERVA_CANCELAR" && c.idempotencyKey === params.idempotencyKey,
    );
    if (cmd) {
      cmd.status = "completed";
      cmd.httpStatus = 200;
      cmd.resultPublicId = reserva.publicId;
      cmd.resultCode = params.action === "solicitar" ? "CancelacionSolicitada" : "ReservaCancelada";
    }

    return structuredClone(reserva);
  }

  async buscarReservaPorId(id: number, actor: Actor, scope: PermissionScope): Promise<Reserva | null> {
    const res = this.reservas.find(r => r.id === id);
    if (!res) return null;
    const deal = this.deals.find(d => d.id === res.dealId);
    if (!deal || !reaches(actor, scope, deal.brokerId)) return null;
    return structuredClone(res);
  }

  async buscarReservaPorPublicId(publicId: string, actor: Actor, scope: PermissionScope): Promise<Reserva | null> {
    const res = this.reservas.find(r => r.publicId === publicId);
    if (!res) return null;
    const deal = this.deals.find(d => d.id === res.dealId);
    if (!deal || !reaches(actor, scope, deal.brokerId)) return null;
    return structuredClone(res);
  }

  async listarReservas(filtros: FiltrosReservas, actor: Actor, scope: PermissionScope): Promise<Reserva[]> {
    return this.reservas
      .filter(r => {
        const deal = this.deals.find(d => d.id === r.dealId);
        if (!deal || !reaches(actor, scope, deal.brokerId)) return false;
        if (filtros.dealId != null && r.dealId !== filtros.dealId) return false;
        if (filtros.status != null && r.status !== filtros.status) return false;
        if (filtros.id != null) {
          if (typeof filtros.id === "number" && r.id !== filtros.id) return false;
          if (typeof filtros.id === "string" && r.publicId !== filtros.id) return false;
        }
        if (filtros.unitId != null) {
          if (!r.units.some(u => u.unitId === filtros.unitId && u.releasedAt == null)) return false;
        }
        return true;
      })
      .map(r => structuredClone(r));
  }
}
