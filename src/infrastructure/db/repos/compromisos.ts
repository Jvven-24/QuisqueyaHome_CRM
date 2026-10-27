/**
 * Adaptador Drizzle para la autoridad de compromisos e inventario (M40 b1i / b2a).
 */

import { randomUUID } from "node:crypto";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import type {
  CompromisosHoldsPort,
  EntradaCancelarHold,
  EntradaCrearHold,
  EntradaExtenderHold,
  FiltrosHolds,
  Hold,
  ReposCompromisos,
  UnidadHold,
} from "../../../application/compromisos/puertos.ts";
import { CupoExcedidoError } from "../../../application/compromisos/puertos.ts";
import type { RepositorioPipeline } from "../../../application/pipeline/puertos.ts";
import { ConflictError, NotFoundError } from "../../../domain/errors.ts";
import type { Actor, PermissionScope } from "../../../domain/rbac.ts";
import { normalizarCodigoUnidad } from "../../../domain/unidades.ts";
import { visibleHolds } from "../../rbac-filter.ts";
import {
  auditLog,
  deals,
  holds,
  holdUnits,
  inventoryCommitments,
  outbox,
  reservations,
  reservationUnits,
  transactionCommands,
  units,
  unitSales,
} from "../schema.ts";
import type { Tx } from "./compartido.ts";
import { repositorioPipeline } from "./pipeline.ts";

function mapearHold(
  row: typeof holds.$inferSelect,
  unidades: Array<{
    id?: number;
    unitId: number;
    projectId: number;
    unitCodeNormalized: string;
    priceVersion: number;
    priceCents: bigint;
    currency: string;
    componentRole: string;
  }>,
): Hold {
  return {
    id: row.id,
    publicId: row.publicId,
    dealId: row.dealId,
    holderId: row.holderId,
    status: row.status as Hold["status"],
    expiresAt: row.expiresAt,
    policyVersion: row.policyVersion,
    extensionCount: row.extensionCount,
    reason: row.reason,
    resolvedAt: row.resolvedAt,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    rowVersion: row.rowVersion,
    correlationId: row.correlationId,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    units: unidades.map(u => ({
      id: u.id,
      unitId: u.unitId,
      projectId: u.projectId,
      unitCodeNormalized: u.unitCodeNormalized,
      priceVersion: u.priceVersion,
      priceCents: u.priceCents,
      currency: u.currency as "USD" | "DOP",
      componentRole: u.componentRole,
    })),
  };
}

function lockForUpdate<T extends { for: (type: "update") => unknown }>(query: T): T {
  const method = "for" as const;
  return (query[method] as (type: "update") => T)("update");
}

/**
 * Adaptador de CompromisosPort sobre la transacción dada.
 * Si se proporciona `pipeline`, delega las operaciones de unidad y venta en él
 * para mantener la composición y las interceptaciones de prueba de pipeline.
 */
export function repositorioCompromisos(tx: Tx, pipeline?: RepositorioPipeline): CompromisosHoldsPort {
  const p = pipeline ?? repositorioPipeline(tx);

  async function resolverCompromisosYReloj(
    unitId: number,
    projectId: number,
    dealId: number,
    actorId: number,
    motivoConsumo: "venta" | "alquiler",
  ) {
    // Defer de constraints multi-tabla para transiciones coherentes.
    await tx.execute(
      sql`set constraints m40_holds_complete, m40_commitments_complete, m40_reservations_complete, m40_reservation_units_complete deferred`,
    );

    // El caso de uso ya bloqueó el negocio. Ningún perfil/meta se bloquea aquí.
    const unidad = await p.bloquearUnidad(unitId, projectId);
    if (!unidad) throw new NotFoundError();
    const unitCodeNormalized = normalizarCodigoUnidad(unidad.code);
    const identidad = and(
      eq(inventoryCommitments.projectId, projectId),
      eq(inventoryCommitments.unitCodeNormalized, unitCodeNormalized),
    );
    const compromisos = await tx.select().from(inventoryCommitments)
      .where(and(eq(inventoryCommitments.status, "active"), or(eq(inventoryCommitments.unitId, unitId), identidad)))
      .orderBy(inventoryCommitments.id).for("update");

    // No usar el reloj de BEGIN ni tomar la hora en la sentencia que espera.
    const [reloj] = await tx.execute<{ effectiveAt: Date }>(sql`select clock_timestamp() as "effectiveAt"`);
    const effectiveAt = new Date(reloj!.effectiveAt);

    let compromisoPropioOExpirado = false;

    for (const compromiso of compromisos) {
      if (compromiso.kind === "hold" && compromiso.holdId != null) {
        const [hold] = await tx.select().from(holds).where(eq(holds.id, compromiso.holdId));
        if (!hold) {
          throw new ConflictError("La unidad tiene un compromiso pendiente de resolución.");
        }
        const expirado = hold.expiresAt <= effectiveAt;
        if (expirado) {
          await tx.update(holds).set({
            status: "expirado",
            resolvedAt: effectiveAt,
            updatedBy: actorId,
            updatedAt: effectiveAt,
          }).where(eq(holds.id, hold.id));

          await tx.update(inventoryCommitments).set({
            status: "resolved",
            resolvedAt: effectiveAt,
            resolutionReason: "expirado",
            updatedBy: actorId,
            updatedAt: effectiveAt,
          }).where(eq(inventoryCommitments.id, compromiso.id));

          compromisoPropioOExpirado = true;
        } else if (hold.dealId === dealId) {
          // Hold propio vigente: se acepta y se consume para el cierre
          await tx.update(holds).set({
            status: "cancelado",
            resolvedAt: effectiveAt,
            updatedBy: actorId,
            updatedAt: effectiveAt,
          }).where(eq(holds.id, hold.id));

          await tx.update(inventoryCommitments).set({
            status: "resolved",
            resolvedAt: effectiveAt,
            resolutionReason: motivoConsumo,
            updatedBy: actorId,
            updatedAt: effectiveAt,
          }).where(eq(inventoryCommitments.id, compromiso.id));

          compromisoPropioOExpirado = true;
        } else {
          // Hold ajeno activo vigente
          throw new ConflictError("La unidad tiene un compromiso pendiente de resolución.");
        }
      } else if (compromiso.kind === "reservation" && compromiso.reservationUnitId != null) {
        const [resUnit] = await tx.select().from(reservationUnits).where(eq(reservationUnits.id, compromiso.reservationUnitId));
        if (!resUnit) {
          throw new ConflictError("La unidad tiene un compromiso pendiente de resolución.");
        }
        const [res] = await tx.select().from(reservations).where(eq(reservations.id, resUnit.reservationId));
        if (!res) {
          throw new ConflictError("La unidad tiene un compromiso pendiente de resolución.");
        }
        const expirada = res.expiresAt != null && res.expiresAt <= effectiveAt;
        if (expirada) {
          await tx.update(reservationUnits).set({
            releasedAt: effectiveAt,
            releaseReason: "expirada",
          }).where(eq(reservationUnits.id, resUnit.id));

          await tx.update(reservations).set({
            status: "expirada",
            updatedBy: actorId,
            updatedAt: effectiveAt,
          }).where(eq(reservations.id, res.id));

          await tx.update(inventoryCommitments).set({
            status: "resolved",
            resolvedAt: effectiveAt,
            resolutionReason: "expirada",
            updatedBy: actorId,
            updatedAt: effectiveAt,
          }).where(eq(inventoryCommitments.id, compromiso.id));

          compromisoPropioOExpirado = true;
        } else if (res.dealId === dealId) {
          // Reserva propia vigente: se acepta y se consume para el cierre
          await tx.update(reservationUnits).set({
            releasedAt: effectiveAt,
            releaseReason: motivoConsumo,
          }).where(eq(reservationUnits.id, resUnit.id));

          const statusReserva = res.confirmedAt != null ? "cancelada" : "expirada";
          await tx.update(reservations).set({
            status: statusReserva,
            updatedBy: actorId,
            updatedAt: effectiveAt,
          }).where(eq(reservations.id, res.id));

          await tx.update(inventoryCommitments).set({
            status: "resolved",
            resolvedAt: effectiveAt,
            resolutionReason: motivoConsumo,
            updatedBy: actorId,
            updatedAt: effectiveAt,
          }).where(eq(inventoryCommitments.id, compromiso.id));

          compromisoPropioOExpirado = true;
        } else {
          // Reserva ajena activa vigente
          throw new ConflictError("La unidad tiene un compromiso pendiente de resolución.");
        }
      } else if (compromiso.kind === "sale") {
        throw new ConflictError("La unidad ya no está disponible para este cierre.");
      } else {
        throw new ConflictError("La unidad tiene un compromiso pendiente de resolución.");
      }
    }

    const [venta] = await tx
      .select({ id: unitSales.id })
      .from(unitSales)
      .where(
        or(
          eq(unitSales.unitId, unitId),
          eq(unitSales.dealId, dealId),
          and(eq(unitSales.projectId, projectId), eq(unitSales.unitCodeNormalized, unitCodeNormalized)),
        ),
      )
      .limit(1);
    if (venta) throw new ConflictError("La unidad ya no está disponible para este cierre.");

    if (compromisoPropioOExpirado) {
      if (unidad.status !== "available" && unidad.status !== "reserved") {
        throw new ConflictError("La unidad ya no está disponible para este cierre.");
      }
    } else {
      if (unidad.status !== "available") {
        throw new ConflictError("La unidad ya no está disponible para este cierre.");
      }
    }

    return { effectiveAt, unitCodeNormalized };
  }

  return {
    async cerrarVenta({ unitId, projectId, dealId, actorId }) {
      const { effectiveAt, unitCodeNormalized } = await resolverCompromisosYReloj(unitId, projectId, dealId, actorId, "venta");
      // unit_sales es la autoridad durable existente, sin duplicar la venta.
      await p.marcarUnidad({ unitId, estado: "sold", actorId });
      await p.registrarVenta({ unitId, projectId, dealId, unitCodeNormalized, actorId });
      return effectiveAt;
    },

    async cerrarAlquiler({ unitId, projectId, dealId, actorId }) {
      const { effectiveAt } = await resolverCompromisosYReloj(unitId, projectId, dealId, actorId, "alquiler");
      await p.marcarUnidad({ unitId, estado: "reserved", actorId });
      return effectiveAt;
    },

    async crearHold(params: EntradaCrearHold): Promise<Hold> {
      // 1. Idempotencia: transaction_commands
      const [cmdExistente] = await tx
        .select()
        .from(transactionCommands)
        .where(
          and(
            eq(transactionCommands.actorId, params.actorId),
            eq(transactionCommands.operation, "HOLD_CREAR"),
            eq(transactionCommands.idempotencyKey, params.idempotencyKey),
          ),
        );

      if (cmdExistente) {
        if (cmdExistente.status === "completed") {
          if (cmdExistente.requestHash === params.requestHash && cmdExistente.resultPublicId) {
            const [holdExistente] = await tx
              .select()
              .from(holds)
              .where(eq(holds.publicId, cmdExistente.resultPublicId));
            if (holdExistente) {
              const unitsExistentes = await tx
                .select()
                .from(holdUnits)
                .where(eq(holdUnits.holdId, holdExistente.id))
                .orderBy(holdUnits.id);
              return mapearHold(holdExistente, unitsExistentes);
            }
          }
          throw new ConflictError("Clave de idempotencia ya utilizada con un contenido distinto.");
        }
        throw new ConflictError("Operación en curso para esta clave de idempotencia.");
      }

      const [comando] = await tx
        .insert(transactionCommands)
        .values({
          actorId: params.actorId,
          operation: "HOLD_CREAR",
          idempotencyKey: params.idempotencyKey,
          requestHash: params.requestHash,
          status: "processing",
        })
        .returning();
      if (!comando) throw new Error("Fallo al registrar comando.");

      // 2. Guardia de cupo transaccional por titular
      const titularId = params.holderId ?? params.actorId;
      await tx.execute(sql`SELECT pg_advisory_xact_lock(4001, ${titularId})`);

      const [conteoActivos] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(holds)
        .where(
          and(
            eq(holds.holderId, titularId),
            eq(holds.status, "activo"),
            sql`${holds.expiresAt} > clock_timestamp()`,
          ),
        );

      if (Number(conteoActivos?.count || 0) >= 3) {
        throw new CupoExcedidoError("El titular ha alcanzado el límite máximo de holds activos permitidos.");
      }

      // 3. Bloquear negocio por ID ASC
      const [negocio] = await lockForUpdate(
        tx
          .select()
          .from(deals)
          .where(eq(deals.id, params.dealId)),
      );
      if (!negocio || negocio.deletedAt) throw new NotFoundError("Negocio no encontrado.");

      // 4. Bloquear unidades del paquete por ID ASC
      const sortedUnitIds = [...new Set(params.units.map(u => u.unitId))].sort((a, b) => a - b);
      const unidadesBloqueadas = await lockForUpdate(
        tx
          .select()
          .from(units)
          .where(inArray(units.id, sortedUnitIds))
          .orderBy(units.id),
      );

      if (unidadesBloqueadas.length !== sortedUnitIds.length) {
        throw new NotFoundError("Una o más unidades solicitadas no existen.");
      }

      for (const u of unidadesBloqueadas) {
        if (u.deletedAt) throw new ConflictError("Una o más unidades están marcadas como eliminadas.");
        if (u.status !== "available") throw new ConflictError(`La unidad ${u.code} no está disponible.`);
      }

      // 5. Bloquear compromisos existentes por ID ASC
      const compromisosExistentes = await lockForUpdate(
        tx
          .select()
          .from(inventoryCommitments)
          .where(
            and(
              inArray(inventoryCommitments.unitId, sortedUnitIds),
              eq(inventoryCommitments.status, "active"),
            ),
          )
          .orderBy(inventoryCommitments.id),
      );

      // 6. Reloj SQL separado tras bloqueos
      const [reloj] = await tx.execute<{ effectiveAt: Date }>(sql`select clock_timestamp() as "effectiveAt"`);
      const effectiveAt = new Date(reloj!.effectiveAt);

      await tx.execute(
        sql`set constraints m40_holds_complete, m40_hold_units_complete, m40_commitments_complete, m40_commands_complete deferred`,
      );

      // 7. Resolver compromisos expirados bajo lock
      for (const c of compromisosExistentes) {
        if (c.kind === "hold" && c.holdId != null) {
          const [holdAntiguo] = await tx.select().from(holds).where(eq(holds.id, c.holdId));
          if (holdAntiguo && holdAntiguo.expiresAt <= effectiveAt) {
            await tx.update(holds).set({
              status: "expirado",
              resolvedAt: effectiveAt,
              updatedBy: params.actorId,
              updatedAt: effectiveAt,
            }).where(eq(holds.id, holdAntiguo.id));

            await tx.update(inventoryCommitments).set({
              status: "resolved",
              resolvedAt: effectiveAt,
              resolutionReason: "expirado",
              updatedBy: params.actorId,
              updatedAt: effectiveAt,
            }).where(eq(inventoryCommitments.id, c.id));
            continue;
          }
        } else if (c.kind === "reservation" && c.reservationUnitId != null) {
          const [res] = await tx
            .select()
            .from(reservations)
            .innerJoin(reservationUnits, eq(reservationUnits.reservationId, reservations.id))
            .where(eq(reservationUnits.id, c.reservationUnitId));
          if (res && res.reservations.expiresAt != null && res.reservations.expiresAt <= effectiveAt) {
            await tx.update(reservationUnits).set({
              releasedAt: effectiveAt,
              releaseReason: "expirada",
            }).where(eq(reservationUnits.id, c.reservationUnitId));

            await tx.update(reservations).set({
              status: "expirada",
              updatedBy: params.actorId,
              updatedAt: effectiveAt,
            }).where(eq(reservations.id, res.reservations.id));

            await tx.update(inventoryCommitments).set({
              status: "resolved",
              resolvedAt: effectiveAt,
              resolutionReason: "expirada",
              updatedBy: params.actorId,
              updatedAt: effectiveAt,
            }).where(eq(inventoryCommitments.id, c.id));
            continue;
          }
        }
        throw new ConflictError(`La unidad ${c.unitId} ya tiene un compromiso activo.`);
      }

      // 8. Comprobar ventas durables
      const [ventaDurable] = await tx
        .select({ id: unitSales.id })
        .from(unitSales)
        .where(inArray(unitSales.unitId, sortedUnitIds))
        .limit(1);
      if (ventaDurable) throw new ConflictError("Una o más unidades ya cuentan con una venta durable registrada.");

      // 9. Calcular expiración
      const durationHours = params.durationHours ?? 48;
      const expiresAt = new Date(effectiveAt.getTime() + durationHours * 3600 * 1000);

      // 10. Insertar hold
      const [nuevoHold] = await tx
        .insert(holds)
        .values({
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
          createdAt: effectiveAt,
          updatedAt: effectiveAt,
        })
        .returning();
      if (!nuevoHold) throw new Error("Fallo al insertar hold.");

      // 11. Insertar holdUnits e inventoryCommitments
      const unidadesInsertadas: UnidadHold[] = [];
      for (const u of params.units) {
        const unidad = unidadesBloqueadas.find(ub => ub.id === u.unitId)!;
        const unitCodeNormalized = normalizarCodigoUnidad(unidad.code);

        const [hu] = await tx
          .insert(holdUnits)
          .values({
            holdId: nuevoHold.id,
            unitId: u.unitId,
            projectId: unidad.projectId,
            unitCodeNormalized,
            priceVersion: u.priceVersion,
            priceCents: u.priceCents,
            currency: u.currency,
            componentRole: u.componentRole,
            createdAt: effectiveAt,
            createdBy: params.actorId,
          })
          .returning();
        if (!hu) throw new Error("Fallo al insertar unidad de hold.");

        await tx.insert(inventoryCommitments).values({
          unitId: u.unitId,
          projectId: unidad.projectId,
          unitCodeNormalized,
          kind: "hold",
          status: "active",
          holdId: nuevoHold.id,
          expiresAt,
          createdBy: params.actorId,
          updatedBy: params.actorId,
          rowVersion: 1,
          correlationId: params.correlationId,
          source: params.source,
          createdAt: effectiveAt,
          updatedAt: effectiveAt,
        });

        unidadesInsertadas.push({
          id: hu.id,
          unitId: u.unitId,
          projectId: unidad.projectId,
          unitCodeNormalized,
          priceVersion: u.priceVersion,
          priceCents: u.priceCents,
          currency: u.currency,
          componentRole: u.componentRole,
        });
      }

      // 12. Outbox & auditLog
      await tx.insert(outbox).values({
        eventId: randomUUID(),
        eventType: "HoldCreado",
        version: 1,
        aggregateId: nuevoHold.id,
        correlationId: params.correlationId,
        idempotencyKey: params.idempotencyKey,
        payload: {
          publicId: nuevoHold.publicId,
          aggregateVersion: 1,
          commandId: params.idempotencyKey,
          correlationId: params.correlationId,
        },
        availableAt: effectiveAt,
        createdAt: effectiveAt,
      });

      await tx.insert(auditLog).values({
        userId: params.actorId,
        action: "crear",
        entityType: "hold",
        entityId: nuevoHold.id,
        newValue: nuevoHold.publicId,
        createdAt: effectiveAt,
      });

      // 13. Completar comando
      await tx.update(transactionCommands).set({
        status: "completed",
        httpStatus: 201,
        resultPublicId: nuevoHold.publicId,
        resultCode: "HoldCreado",
        completedAt: effectiveAt,
        retainUntil: sql`${effectiveAt.toISOString()}::timestamptz + interval '5 years 1 day'`,
      }).where(eq(transactionCommands.id, comando.id));

      return mapearHold(nuevoHold, unidadesInsertadas);
    },

    async extenderHold(params: EntradaExtenderHold): Promise<Hold> {
      // 1. Idempotencia
      const [cmdExistente] = await tx
        .select()
        .from(transactionCommands)
        .where(
          and(
            eq(transactionCommands.actorId, params.actorId),
            eq(transactionCommands.operation, "HOLD_EXTENDER"),
            eq(transactionCommands.idempotencyKey, params.idempotencyKey),
          ),
        );

      if (cmdExistente) {
        if (cmdExistente.status === "completed") {
          if (cmdExistente.requestHash === params.requestHash && cmdExistente.resultPublicId) {
            const [holdExistente] = await tx.select().from(holds).where(eq(holds.publicId, cmdExistente.resultPublicId));
            if (holdExistente) {
              const unitsExistentes = await tx.select().from(holdUnits).where(eq(holdUnits.holdId, holdExistente.id)).orderBy(holdUnits.id);
              return mapearHold(holdExistente, unitsExistentes);
            }
          }
          throw new ConflictError("Clave de idempotencia ya utilizada con un contenido distinto.");
        }
        throw new ConflictError("Operación en curso para esta clave de idempotencia.");
      }

      const [comando] = await tx
        .insert(transactionCommands)
        .values({
          actorId: params.actorId,
          operation: "HOLD_EXTENDER",
          idempotencyKey: params.idempotencyKey,
          requestHash: params.requestHash,
          status: "processing",
        })
        .returning();
      if (!comando) throw new Error("Fallo al registrar comando.");

      // 2. Lock hold FOR UPDATE
      const [hold] = await lockForUpdate(
        tx
          .select()
          .from(holds)
          .where(typeof params.id === "number" ? eq(holds.id, params.id) : eq(holds.publicId, params.id)),
      );

      if (!hold) throw new NotFoundError("Hold no encontrado.");

      if (hold.status !== "activo") {
        throw new ConflictError("El hold no está activo.");
      }

      if (params.expectedVersion !== undefined && hold.rowVersion !== params.expectedVersion) {
        throw new ConflictError("Conflicto de concurrencia: la versión del hold ha cambiado.");
      }

      // Lock de cupo del titular
      await tx.execute(sql`SELECT pg_advisory_xact_lock(4001, ${hold.holderId})`);

      const unidadesHold = await tx
        .select()
        .from(holdUnits)
        .where(eq(holdUnits.holdId, hold.id))
        .orderBy(holdUnits.unitId);

      const unitIds = unidadesHold.map(u => u.unitId);
      if (unitIds.length > 0) {
        await lockForUpdate(tx.select().from(units).where(inArray(units.id, unitIds)).orderBy(units.id));
        await lockForUpdate(
          tx
            .select()
            .from(inventoryCommitments)
            .where(and(inArray(inventoryCommitments.unitId, unitIds), eq(inventoryCommitments.status, "active")))
            .orderBy(inventoryCommitments.id),
        );
      }

      const [reloj] = await tx.execute<{ effectiveAt: Date }>(sql`select clock_timestamp() as "effectiveAt"`);
      const effectiveAt = new Date(reloj!.effectiveAt);

      if (hold.expiresAt <= effectiveAt) {
        await tx.update(holds).set({
          status: "expirado",
          resolvedAt: effectiveAt,
          updatedBy: params.actorId,
          updatedAt: effectiveAt,
        }).where(eq(holds.id, hold.id));

        await tx.update(inventoryCommitments).set({
          status: "resolved",
          resolvedAt: effectiveAt,
          resolutionReason: "expirado",
          updatedBy: params.actorId,
          updatedAt: effectiveAt,
        }).where(eq(inventoryCommitments.holdId, hold.id));

        throw new ConflictError("El hold ya ha expirado.");
      }

      const additionalHours = params.additionalHours ?? 24;
      const newExpiresAt = new Date(hold.expiresAt.getTime() + additionalHours * 3600 * 1000);

      await tx.execute(
        sql`set constraints m40_holds_complete, m40_hold_units_complete, m40_commitments_complete, m40_commands_complete deferred`,
      );

      const [holdActualizado] = await tx
        .update(holds)
        .set({
          expiresAt: newExpiresAt,
          extensionCount: hold.extensionCount + 1,
          rowVersion: hold.rowVersion + 1,
          updatedBy: params.actorId,
          updatedAt: effectiveAt,
          correlationId: params.correlationId,
          source: params.source,
        })
        .where(eq(holds.id, hold.id))
        .returning();
      if (!holdActualizado) throw new Error("Fallo al actualizar hold.");

      await tx
        .update(inventoryCommitments)
        .set({
          expiresAt: newExpiresAt,
          rowVersion: sql`${inventoryCommitments.rowVersion} + 1`,
          updatedBy: params.actorId,
          updatedAt: effectiveAt,
          correlationId: params.correlationId,
          source: params.source,
        })
        .where(eq(inventoryCommitments.holdId, hold.id));

      await tx.insert(outbox).values({
        eventId: randomUUID(),
        eventType: "HoldExtendido",
        version: 1,
        aggregateId: hold.id,
        correlationId: params.correlationId,
        idempotencyKey: params.idempotencyKey,
        payload: {
          publicId: hold.publicId,
          aggregateVersion: holdActualizado.rowVersion,
          commandId: params.idempotencyKey,
          correlationId: params.correlationId,
        },
        availableAt: effectiveAt,
        createdAt: effectiveAt,
      });

      await tx.insert(auditLog).values({
        userId: params.actorId,
        action: "extender",
        entityType: "hold",
        entityId: hold.id,
        newValue: hold.publicId,
        createdAt: effectiveAt,
      });

      await tx.update(transactionCommands).set({
        status: "completed",
        httpStatus: 200,
        resultPublicId: hold.publicId,
        resultCode: "HoldExtendido",
        completedAt: effectiveAt,
        retainUntil: sql`${effectiveAt.toISOString()}::timestamptz + interval '5 years 1 day'`,
      }).where(eq(transactionCommands.id, comando.id));

      return mapearHold(holdActualizado, unidadesHold);
    },

    async cancelarHold(params: EntradaCancelarHold): Promise<Hold> {
      // 1. Idempotencia
      const [cmdExistente] = await tx
        .select()
        .from(transactionCommands)
        .where(
          and(
            eq(transactionCommands.actorId, params.actorId),
            eq(transactionCommands.operation, "HOLD_CANCELAR"),
            eq(transactionCommands.idempotencyKey, params.idempotencyKey),
          ),
        );

      if (cmdExistente) {
        if (cmdExistente.status === "completed") {
          if (cmdExistente.requestHash === params.requestHash && cmdExistente.resultPublicId) {
            const [holdExistente] = await tx.select().from(holds).where(eq(holds.publicId, cmdExistente.resultPublicId));
            if (holdExistente) {
              const unitsExistentes = await tx.select().from(holdUnits).where(eq(holdUnits.holdId, holdExistente.id)).orderBy(holdUnits.id);
              return mapearHold(holdExistente, unitsExistentes);
            }
          }
          throw new ConflictError("Clave de idempotencia ya utilizada con un contenido distinto.");
        }
        throw new ConflictError("Operación en curso para esta clave de idempotencia.");
      }

      const [comando] = await tx
        .insert(transactionCommands)
        .values({
          actorId: params.actorId,
          operation: "HOLD_CANCELAR",
          idempotencyKey: params.idempotencyKey,
          requestHash: params.requestHash,
          status: "processing",
        })
        .returning();
      if (!comando) throw new Error("Fallo al registrar comando.");

      // 2. Lock hold FOR UPDATE
      const [hold] = await lockForUpdate(
        tx
          .select()
          .from(holds)
          .where(typeof params.id === "number" ? eq(holds.id, params.id) : eq(holds.publicId, params.id)),
      );

      if (!hold) throw new NotFoundError("Hold no encontrado.");

      if (hold.status !== "activo") {
        throw new ConflictError("El hold no está activo.");
      }

      if (params.expectedVersion !== undefined && hold.rowVersion !== params.expectedVersion) {
        throw new ConflictError("Conflicto de concurrencia: la versión del hold ha cambiado.");
      }

      const unidadesHold = await tx
        .select()
        .from(holdUnits)
        .where(eq(holdUnits.holdId, hold.id))
        .orderBy(holdUnits.unitId);

      const unitIds = unidadesHold.map(u => u.unitId);
      if (unitIds.length > 0) {
        await lockForUpdate(tx.select().from(units).where(inArray(units.id, unitIds)).orderBy(units.id));
        await lockForUpdate(
          tx
            .select()
            .from(inventoryCommitments)
            .where(and(inArray(inventoryCommitments.unitId, unitIds), eq(inventoryCommitments.status, "active")))
            .orderBy(inventoryCommitments.id),
        );
      }

      const [reloj] = await tx.execute<{ effectiveAt: Date }>(sql`select clock_timestamp() as "effectiveAt"`);
      const effectiveAt = new Date(reloj!.effectiveAt);

      await tx.execute(
        sql`set constraints m40_holds_complete, m40_hold_units_complete, m40_commitments_complete, m40_commands_complete deferred`,
      );

      const [holdActualizado] = await tx
        .update(holds)
        .set({
          status: "cancelado",
          resolvedAt: effectiveAt,
          rowVersion: hold.rowVersion + 1,
          updatedBy: params.actorId,
          updatedAt: effectiveAt,
          correlationId: params.correlationId,
          source: params.source,
        })
        .where(eq(holds.id, hold.id))
        .returning();
      if (!holdActualizado) throw new Error("Fallo al actualizar hold.");

      await tx
        .update(inventoryCommitments)
        .set({
          status: "resolved",
          resolvedAt: effectiveAt,
          resolutionReason: "cancelado",
          rowVersion: sql`${inventoryCommitments.rowVersion} + 1`,
          updatedBy: params.actorId,
          updatedAt: effectiveAt,
          correlationId: params.correlationId,
          source: params.source,
        })
        .where(eq(inventoryCommitments.holdId, hold.id));

      await tx.insert(outbox).values({
        eventId: randomUUID(),
        eventType: "HoldCancelado",
        version: 1,
        aggregateId: hold.id,
        correlationId: params.correlationId,
        idempotencyKey: params.idempotencyKey,
        payload: {
          publicId: hold.publicId,
          aggregateVersion: holdActualizado.rowVersion,
          commandId: params.idempotencyKey,
          correlationId: params.correlationId,
        },
        availableAt: effectiveAt,
        createdAt: effectiveAt,
      });

      await tx.insert(auditLog).values({
        userId: params.actorId,
        action: "cancelar",
        entityType: "hold",
        entityId: hold.id,
        newValue: hold.publicId,
        createdAt: effectiveAt,
      });

      await tx.update(transactionCommands).set({
        status: "completed",
        httpStatus: 200,
        resultPublicId: hold.publicId,
        resultCode: "HoldCancelado",
        completedAt: effectiveAt,
        retainUntil: sql`${effectiveAt.toISOString()}::timestamptz + interval '5 years 1 day'`,
      }).where(eq(transactionCommands.id, comando.id));

      return mapearHold(holdActualizado, unidadesHold);
    },

    async buscarHoldPorId(id: number, actor: Actor, scope: PermissionScope): Promise<Hold | null> {
      const [hold] = await tx
        .select()
        .from(holds)
        .where(and(eq(holds.id, id), visibleHolds(actor, scope)));
      if (!hold) return null;
      const unidades = await tx
        .select()
        .from(holdUnits)
        .where(eq(holdUnits.holdId, hold.id))
        .orderBy(holdUnits.id);
      return mapearHold(hold, unidades);
    },

    async buscarHoldPorPublicId(publicId: string, actor: Actor, scope: PermissionScope): Promise<Hold | null> {
      const [hold] = await tx
        .select()
        .from(holds)
        .where(and(eq(holds.publicId, publicId), visibleHolds(actor, scope)));
      if (!hold) return null;
      const unidades = await tx
        .select()
        .from(holdUnits)
        .where(eq(holdUnits.holdId, hold.id))
        .orderBy(holdUnits.id);
      return mapearHold(hold, unidades);
    },

    async listarHolds(filtros: FiltrosHolds, actor: Actor, scope: PermissionScope): Promise<Hold[]> {
      const condiciones = [visibleHolds(actor, scope)];
      if (filtros.unitId !== undefined) {
        condiciones.push(inArray(holds.id, tx.select({ holdId: holdUnits.holdId })
          .from(holdUnits).where(eq(holdUnits.unitId, filtros.unitId))));
      }
      if (filtros.dealId !== undefined) {
        condiciones.push(eq(holds.dealId, filtros.dealId));
      }
      if (filtros.holderId !== undefined) {
        condiciones.push(eq(holds.holderId, filtros.holderId));
      }
      if (filtros.status !== undefined) {
        condiciones.push(eq(holds.status, filtros.status));
      }
      if (filtros.id !== undefined) {
        if (typeof filtros.id === "number") {
          condiciones.push(eq(holds.id, filtros.id));
        } else {
          condiciones.push(eq(holds.publicId, filtros.id));
        }
      }

      const rows = await tx
        .select()
        .from(holds)
        .where(and(...condiciones))
        .orderBy(sql`${holds.id} desc`);

      if (rows.length === 0) return [];

      const holdIds = rows.map(r => r.id);
      const unidades = await tx
        .select()
        .from(holdUnits)
        .where(inArray(holdUnits.holdId, holdIds))
        .orderBy(holdUnits.id);

      return rows.map(h => mapearHold(h, unidades.filter(u => u.holdId === h.id)));
    },
  };
}

export const compromisosDeCierre = repositorioCompromisos;

/** El juego transaccional de compromisos para la unidad de trabajo. */
export function reposCompromisos(tx: Tx): ReposCompromisos {
  return { compromisos: repositorioCompromisos(tx) };
}
