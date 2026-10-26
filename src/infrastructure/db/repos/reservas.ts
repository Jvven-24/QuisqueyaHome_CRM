/**
 * Adaptador Drizzle para la autoridad de reservas (M40 b2b).
 *
 * Implementa ReservasPort dentro de transacciones atómicas con orden estricto de locks,
 * idempotencia en transaction_commands, reloj desacoplado (clock_timestamp),
 * conversión de holds a reservas, resolución de compromisos, outbox y auditoría.
 */

import { randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import type {
  EntradaCambiarUnidadReserva,
  EntradaCancelarReserva,
  EntradaConfirmarReserva,
  EntradaCrearReserva,
  FiltrosReservas,
  ReposReservas,
  Reserva,
  ReservaParty,
  ReservasPort,
} from "../../../application/reservas/puertos.ts";
import { ConflictError, NotFoundError } from "../../../domain/errors.ts";
import type { Actor, PermissionScope } from "../../../domain/rbac.ts";
import { normalizarCodigoUnidad } from "../../../domain/unidades.ts";
import { visibleReservas } from "../../rbac-filter.ts";
import {
  auditLog,
  deals,
  files,
  holds,
  inventoryCommitments,
  outbox,
  reservationParties,
  reservations,
  reservationUnits,
  transactionCommands,
  units,
  unitSales,
} from "../schema.ts";
import type { Tx } from "./compartido.ts";

function lockForUpdate<T extends { for: (type: "update") => unknown }>(query: T): T {
  const method = "for" as const;
  return (query[method] as (type: "update") => T)("update");
}

function mapearReserva(
  row: typeof reservations.$inferSelect,
  parties: Array<typeof reservationParties.$inferSelect>,
  unidades: Array<typeof reservationUnits.$inferSelect>,
): Reserva {
  return {
    id: row.id,
    publicId: row.publicId,
    dealId: row.dealId,
    holdId: row.holdId,
    status: row.status as Reserva["status"],
    currency: row.currency as "USD" | "DOP",
    totalCents: row.totalCents,
    adjustmentCents: row.adjustmentCents,
    depositRequiredCents: row.depositRequiredCents,
    conditionsVersion: row.conditionsVersion,
    conditionsDocumentId: row.conditionsDocumentId,
    conditionsHash: row.conditionsHash,
    confirmationEvidenceId: row.confirmationEvidenceId,
    confirmedBy: row.confirmedBy,
    confirmedAt: row.confirmedAt,
    expiresAt: row.expiresAt,
    reason: row.reason,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
    rowVersion: row.rowVersion,
    correlationId: row.correlationId,
    source: row.source,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    parties: parties.map(p => ({
      id: p.id,
      reservationId: p.reservationId,
      contactId: p.contactId,
      role: p.role as ReservaParty["role"],
      representationEvidenceId: p.representationEvidenceId,
      createdAt: p.createdAt,
      createdBy: p.createdBy,
    })),
    units: unidades.map(u => ({
      id: u.id,
      reservationId: u.reservationId,
      unitId: u.unitId,
      projectId: u.projectId,
      unitCodeNormalized: u.unitCodeNormalized,
      priceCents: u.priceCents,
      currency: u.currency as "USD" | "DOP",
      componentRole: u.componentRole,
      releasedAt: u.releasedAt,
      releaseReason: u.releaseReason,
      createdAt: u.createdAt,
      createdBy: u.createdBy,
    })),
  };
}

export function repositorioReservas(tx: Tx): ReservasPort {
  return {
    async crearReserva(params: EntradaCrearReserva): Promise<Reserva> {
      // 1. Idempotencia: transaction_commands
      const [cmdExistente] = await tx
        .select()
        .from(transactionCommands)
        .where(
          and(
            eq(transactionCommands.actorId, params.actorId),
            eq(transactionCommands.operation, "RESERVA_CREAR"),
            eq(transactionCommands.idempotencyKey, params.idempotencyKey),
          ),
        );

      if (cmdExistente) {
        if (cmdExistente.status === "completed") {
          if (cmdExistente.requestHash === params.requestHash && cmdExistente.resultPublicId) {
            const [reservaExistente] = await tx
              .select()
              .from(reservations)
              .where(eq(reservations.publicId, cmdExistente.resultPublicId));
            if (reservaExistente) {
              const parties = await tx
                .select()
                .from(reservationParties)
                .where(eq(reservationParties.reservationId, reservaExistente.id))
                .orderBy(reservationParties.id);
              const unitsList = await tx
                .select()
                .from(reservationUnits)
                .where(eq(reservationUnits.reservationId, reservaExistente.id))
                .orderBy(reservationUnits.id);
              return mapearReserva(reservaExistente, parties, unitsList);
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
          operation: "RESERVA_CREAR",
          idempotencyKey: params.idempotencyKey,
          requestHash: params.requestHash,
          status: "processing",
        })
        .returning();
      if (!comando) throw new Error("Fallo al registrar comando.");

      // 2. Bloquear negocio por ID ASC
      const [negocio] = await lockForUpdate(
        tx.select().from(deals).where(eq(deals.id, params.dealId)),
      );
      if (!negocio || negocio.deletedAt) throw new NotFoundError("Negocio no encontrado.");

      // 3. Bloquear unidades del paquete por ID ASC
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
      }

      // 4. Si viene de un hold, bloquear el hold por ID ASC
      let holdExistente: typeof holds.$inferSelect | undefined;
      if (params.holdId != null) {
        const [h] = await lockForUpdate(
          tx.select().from(holds).where(eq(holds.id, params.holdId)),
        );
        if (!h) throw new NotFoundError("Hold no encontrado.");
        if (h.dealId !== params.dealId) throw new ConflictError("El hold no pertenece al negocio indicado.");
        if (h.status !== "activo") throw new ConflictError("El hold no se encuentra en estado activo.");
        holdExistente = h;
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
        sql`set constraints m40_holds_complete, m40_hold_units_complete, m40_reservations_complete, m40_reservation_units_complete, m40_reservation_parties_complete, m40_commitments_complete, m40_commands_complete deferred`,
      );

      if (holdExistente && holdExistente.expiresAt <= effectiveAt) {
        throw new ConflictError("El hold ha expirado.");
      }

      // 7. Resolver compromisos expirados bajo lock
      for (const c of compromisosExistentes) {
        if (c.kind === "hold" && c.holdId != null) {
          if (holdExistente && c.holdId === holdExistente.id) {
            // Compromiso del propio hold a convertir
            continue;
          }
          const [h] = await tx.select().from(holds).where(eq(holds.id, c.holdId));
          if (h && h.expiresAt <= effectiveAt) {
            await tx.update(holds).set({
              status: "expirado",
              resolvedAt: effectiveAt,
              updatedBy: params.actorId,
              updatedAt: effectiveAt,
            }).where(eq(holds.id, h.id));

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
          const [ru] = await tx.select().from(reservationUnits).where(eq(reservationUnits.id, c.reservationUnitId));
          if (ru) {
            const [res] = await tx.select().from(reservations).where(eq(reservations.id, ru.reservationId));
            if (res && res.expiresAt != null && res.expiresAt <= effectiveAt) {
              await tx.update(reservationUnits).set({
                releasedAt: effectiveAt,
                releaseReason: "expirada",
              }).where(eq(reservationUnits.id, ru.id));

              await tx.update(reservations).set({
                status: "expirada",
                updatedBy: params.actorId,
                updatedAt: effectiveAt,
              }).where(eq(reservations.id, res.id));

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

      // 9. Comprobar documento de condiciones
      const [archivoCondiciones] = await tx.select().from(files).where(eq(files.id, params.conditionsDocumentId));
      if (!archivoCondiciones) throw new NotFoundError("Documento de condiciones no encontrado.");

      // 10. Si viene de hold, convertir el hold y sus compromisos
      if (holdExistente) {
        await tx.update(holds).set({
          status: "convertido",
          resolvedAt: effectiveAt,
          updatedBy: params.actorId,
          updatedAt: effectiveAt,
        }).where(eq(holds.id, holdExistente.id));

        await tx.update(inventoryCommitments).set({
          status: "resolved",
          resolvedAt: effectiveAt,
          resolutionReason: "convertido",
          updatedBy: params.actorId,
          updatedAt: effectiveAt,
        }).where(and(eq(inventoryCommitments.holdId, holdExistente.id), eq(inventoryCommitments.status, "active")));

        await tx.insert(outbox).values({
          eventId: randomUUID(),
          eventType: "HoldConvertido",
          version: 1,
          aggregateId: holdExistente.id,
          correlationId: params.correlationId,
          idempotencyKey: params.idempotencyKey,
          payload: {
            publicId: holdExistente.publicId,
            aggregateVersion: holdExistente.rowVersion,
            commandId: params.idempotencyKey,
            correlationId: params.correlationId,
          },
          availableAt: effectiveAt,
          createdAt: effectiveAt,
        });

        await tx.insert(auditLog).values({
          userId: params.actorId,
          action: "convertir",
          entityType: "hold",
          entityId: holdExistente.id,
          newValue: holdExistente.publicId,
          createdAt: effectiveAt,
        });
      }

      // 11. Insertar reserva
      const status = params.status ?? "pendiente_pago";
      const [nuevaReserva] = await tx
        .insert(reservations)
        .values({
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
          expiresAt: params.expiresAt ?? null,
          reason: params.reason,
          createdBy: params.actorId,
          updatedBy: params.actorId,
          rowVersion: 1,
          correlationId: params.correlationId,
          source: params.source,
          createdAt: effectiveAt,
          updatedAt: effectiveAt,
        })
        .returning();
      if (!nuevaReserva) throw new Error("Fallo al insertar reserva.");

      // 12. Insertar partes de la reserva
      const partiesInsertadas: Array<typeof reservationParties.$inferSelect> = [];
      for (const p of params.parties) {
        const [rp] = await tx
          .insert(reservationParties)
          .values({
            reservationId: nuevaReserva.id,
            contactId: p.contactId,
            role: p.role,
            representationEvidenceId: p.representationEvidenceId ?? null,
            createdAt: effectiveAt,
            createdBy: params.actorId,
          })
          .returning();
        if (!rp) throw new Error("Fallo al insertar titular de reserva.");
        partiesInsertadas.push(rp);
      }

      // 13. Insertar unidades de la reserva y compromisos
      const unidadesInsertadas: Array<typeof reservationUnits.$inferSelect> = [];
      for (const u of params.units) {
        const unidad = unidadesBloqueadas.find(ub => ub.id === u.unitId)!;
        const unitCodeNormalized = normalizarCodigoUnidad(unidad.code);

        const [ru] = await tx
          .insert(reservationUnits)
          .values({
            reservationId: nuevaReserva.id,
            unitId: u.unitId,
            projectId: unidad.projectId,
            unitCodeNormalized,
            priceCents: u.priceCents,
            currency: u.currency,
            componentRole: u.componentRole,
            createdAt: effectiveAt,
            createdBy: params.actorId,
          })
          .returning();
        if (!ru) throw new Error("Fallo al insertar unidad de reserva.");
        unidadesInsertadas.push(ru);

        if (["pendiente_pago", "en_verificacion", "confirmada", "cancelacion_solicitada"].includes(status)) {
          await tx.insert(inventoryCommitments).values({
            unitId: u.unitId,
            projectId: unidad.projectId,
            unitCodeNormalized,
            kind: "reservation",
            status: "active",
            reservationUnitId: ru.id,
            expiresAt: params.expiresAt ?? null,
            createdBy: params.actorId,
            updatedBy: params.actorId,
            rowVersion: 1,
            correlationId: params.correlationId,
            source: params.source,
            createdAt: effectiveAt,
            updatedAt: effectiveAt,
          });
        }
      }

      // 14. Outbox & auditLog
      const eventType = status === "en_verificacion" ? "ReservaEnVerificacion" : "ReservaCreada";
      await tx.insert(outbox).values({
        eventId: randomUUID(),
        eventType,
        version: 1,
        aggregateId: nuevaReserva.id,
        correlationId: params.correlationId,
        idempotencyKey: params.idempotencyKey,
        payload: {
          publicId: nuevaReserva.publicId,
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
        entityType: "reservation",
        entityId: nuevaReserva.id,
        newValue: nuevaReserva.publicId,
        createdAt: effectiveAt,
      });

      // 15. Completar comando
      await tx.update(transactionCommands).set({
        status: "completed",
        httpStatus: 201,
        resultPublicId: nuevaReserva.publicId,
        resultCode: "ReservaCreada",
        completedAt: effectiveAt,
      }).where(eq(transactionCommands.id, comando.id));

      return mapearReserva(nuevaReserva, partiesInsertadas, unidadesInsertadas);
    },

    async confirmarReserva(params: EntradaConfirmarReserva): Promise<Reserva> {
      // 1. Idempotencia: transaction_commands
      const [cmdExistente] = await tx
        .select()
        .from(transactionCommands)
        .where(
          and(
            eq(transactionCommands.actorId, params.actorId),
            eq(transactionCommands.operation, "RESERVA_CONFIRMAR"),
            eq(transactionCommands.idempotencyKey, params.idempotencyKey),
          ),
        );

      if (cmdExistente) {
        if (cmdExistente.status === "completed") {
          if (cmdExistente.requestHash === params.requestHash && cmdExistente.resultPublicId) {
            const [reservaExistente] = await tx
              .select()
              .from(reservations)
              .where(eq(reservations.publicId, cmdExistente.resultPublicId));
            if (reservaExistente) {
              const parties = await tx
                .select()
                .from(reservationParties)
                .where(eq(reservationParties.reservationId, reservaExistente.id))
                .orderBy(reservationParties.id);
              const unitsList = await tx
                .select()
                .from(reservationUnits)
                .where(eq(reservationUnits.reservationId, reservaExistente.id))
                .orderBy(reservationUnits.id);
              return mapearReserva(reservaExistente, parties, unitsList);
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
          operation: "RESERVA_CONFIRMAR",
          idempotencyKey: params.idempotencyKey,
          requestHash: params.requestHash,
          status: "processing",
        })
        .returning();
      if (!comando) throw new Error("Fallo al registrar comando.");

      // 2. Bloquear reserva por ID
      const idCond = typeof params.id === "number" || /^\d+$/.test(String(params.id))
        ? eq(reservations.id, Number(params.id))
        : eq(reservations.publicId, String(params.id));

      const [reserva] = await lockForUpdate(
        tx.select().from(reservations).where(idCond),
      );
      if (!reserva) throw new NotFoundError("Reserva no encontrada.");

      if (reserva.rowVersion !== params.expectedVersion) {
        throw new ConflictError("Versión de reserva desactualizada.");
      }

      if (reserva.status === "confirmada") {
        throw new ConflictError("La reserva ya ha sido confirmada.");
      }
      if (["cancelada", "expirada"].includes(reserva.status)) {
        throw new ConflictError("No se puede confirmar una reserva terminal.");
      }

      // 3. Bloquear negocio
      await lockForUpdate(tx.select().from(deals).where(eq(deals.id, reserva.dealId)));

      // 4. Bloquear unidades de la reserva
      const resUnits = await lockForUpdate(
        tx
          .select()
          .from(reservationUnits)
          .where(and(eq(reservationUnits.reservationId, reserva.id), sql`${reservationUnits.releasedAt} is null`))
          .orderBy(reservationUnits.id),
      );

      // 5. Bloquear compromisos de la reserva
      const resUnitIds = resUnits.map(ru => ru.id);
      if (resUnitIds.length > 0) {
        await lockForUpdate(
          tx
            .select()
            .from(inventoryCommitments)
            .where(
              and(
                inArray(inventoryCommitments.reservationUnitId, resUnitIds),
                eq(inventoryCommitments.status, "active"),
              ),
            )
            .orderBy(inventoryCommitments.id),
        );
      }

      // 6. Comprobar archivo de evidencia
      const [archivoEvidencia] = await tx.select().from(files).where(eq(files.id, params.confirmationEvidenceId));
      if (!archivoEvidencia) throw new NotFoundError("Archivo de evidencia no encontrado.");

      // 7. Reloj SQL desacoplado
      const [reloj] = await tx.execute<{ effectiveAt: Date }>(sql`select clock_timestamp() as "effectiveAt"`);
      const effectiveAt = new Date(reloj!.effectiveAt);

      await tx.execute(
        sql`set constraints m40_holds_complete, m40_hold_units_complete, m40_reservations_complete, m40_reservation_units_complete, m40_reservation_parties_complete, m40_commitments_complete, m40_commands_complete deferred`,
      );

      if (reserva.expiresAt && reserva.expiresAt <= effectiveAt) {
        throw new ConflictError("La reserva ha expirado y no puede confirmarse.");
      }

      // 8. Actualizar reserva a confirmada
      const [reservaConfirmada] = await tx
        .update(reservations)
        .set({
          status: "confirmada",
          confirmedAt: effectiveAt,
          confirmedBy: params.actorId,
          confirmationEvidenceId: params.confirmationEvidenceId,
          reason: params.reason,
          rowVersion: reserva.rowVersion + 1,
          updatedAt: effectiveAt,
          updatedBy: params.actorId,
        })
        .where(eq(reservations.id, reserva.id))
        .returning();
      if (!reservaConfirmada) throw new Error("Fallo al confirmar reserva.");

      // 9. Outbox & auditLog
      await tx.insert(outbox).values({
        eventId: randomUUID(),
        eventType: "ReservaConfirmada",
        version: 1,
        aggregateId: reservaConfirmada.id,
        correlationId: params.correlationId,
        idempotencyKey: params.idempotencyKey,
        payload: {
          publicId: reservaConfirmada.publicId,
          aggregateVersion: reservaConfirmada.rowVersion,
          commandId: params.idempotencyKey,
          correlationId: params.correlationId,
        },
        availableAt: effectiveAt,
        createdAt: effectiveAt,
      });

      await tx.insert(auditLog).values({
        userId: params.actorId,
        action: "confirmar",
        entityType: "reservation",
        entityId: reservaConfirmada.id,
        newValue: reservaConfirmada.publicId,
        createdAt: effectiveAt,
      });

      // 10. Completar comando
      await tx.update(transactionCommands).set({
        status: "completed",
        httpStatus: 200,
        resultPublicId: reservaConfirmada.publicId,
        resultCode: "ReservaConfirmada",
        completedAt: effectiveAt,
      }).where(eq(transactionCommands.id, comando.id));

      const parties = await tx
        .select()
        .from(reservationParties)
        .where(eq(reservationParties.reservationId, reservaConfirmada.id))
        .orderBy(reservationParties.id);
      const unitsList = await tx
        .select()
        .from(reservationUnits)
        .where(eq(reservationUnits.reservationId, reservaConfirmada.id))
        .orderBy(reservationUnits.id);

      return mapearReserva(reservaConfirmada, parties, unitsList);
    },

    async cambiarUnidad(params: EntradaCambiarUnidadReserva): Promise<Reserva> {
      // 1. Idempotencia: transaction_commands
      const [cmdExistente] = await tx
        .select()
        .from(transactionCommands)
        .where(
          and(
            eq(transactionCommands.actorId, params.actorId),
            eq(transactionCommands.operation, "RESERVA_CAMBIO_UNIDAD"),
            eq(transactionCommands.idempotencyKey, params.idempotencyKey),
          ),
        );

      if (cmdExistente) {
        if (cmdExistente.status === "completed") {
          if (cmdExistente.requestHash === params.requestHash && cmdExistente.resultPublicId) {
            const [reservaExistente] = await tx
              .select()
              .from(reservations)
              .where(eq(reservations.publicId, cmdExistente.resultPublicId));
            if (reservaExistente) {
              const parties = await tx
                .select()
                .from(reservationParties)
                .where(eq(reservationParties.reservationId, reservaExistente.id))
                .orderBy(reservationParties.id);
              const unitsList = await tx
                .select()
                .from(reservationUnits)
                .where(eq(reservationUnits.reservationId, reservaExistente.id))
                .orderBy(reservationUnits.id);
              return mapearReserva(reservaExistente, parties, unitsList);
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
          operation: "RESERVA_CAMBIO_UNIDAD",
          idempotencyKey: params.idempotencyKey,
          requestHash: params.requestHash,
          status: "processing",
        })
        .returning();
      if (!comando) throw new Error("Fallo al registrar comando.");

      // 2. Bloquear reserva
      const idCond = typeof params.id === "number" || /^\d+$/.test(String(params.id))
        ? eq(reservations.id, Number(params.id))
        : eq(reservations.publicId, String(params.id));

      const [reserva] = await lockForUpdate(
        tx.select().from(reservations).where(idCond),
      );
      if (!reserva) throw new NotFoundError("Reserva no encontrada.");

      if (reserva.rowVersion !== params.expectedVersion) {
        throw new ConflictError("Versión de reserva desactualizada.");
      }
      if (["cancelada", "expirada"].includes(reserva.status)) {
        throw new ConflictError("No se puede cambiar la unidad de una reserva terminal.");
      }

      // 3. Bloquear negocio
      await lockForUpdate(tx.select().from(deals).where(eq(deals.id, reserva.dealId)));

      // 4. Bloquear unidades (antigua y nueva) en orden ASC
      const unitIds = [params.oldUnitId, params.newUnit.unitId].sort((a, b) => a - b);
      const lockedUnits = await lockForUpdate(
        tx.select().from(units).where(inArray(units.id, unitIds)).orderBy(units.id),
      );
      const oldUnitCat = lockedUnits.find(u => u.id === params.oldUnitId);
      const newUnitCat = lockedUnits.find(u => u.id === params.newUnit.unitId);

      if (!oldUnitCat || !newUnitCat) throw new NotFoundError("Unidad no encontrada.");
      if (newUnitCat.status !== "available") {
        throw new ConflictError(`La unidad de destino ${newUnitCat.code} no está disponible.`);
      }
      if (newUnitCat.deletedAt) {
        throw new ConflictError("La unidad de destino está marcada como eliminada.");
      }

      // 5. Comprobar ventas durables en nueva unidad
      const [ventaDurable] = await tx
        .select({ id: unitSales.id })
        .from(unitSales)
        .where(eq(unitSales.unitId, params.newUnit.unitId))
        .limit(1);
      if (ventaDurable) throw new ConflictError("La unidad de destino cuenta con una venta durable registrada.");

      // 6. Bloquear compromisos existentes de ambas unidades en orden ASC
      const compromisosExistentes = await lockForUpdate(
        tx
          .select()
          .from(inventoryCommitments)
          .where(
            and(
              inArray(inventoryCommitments.unitId, unitIds),
              eq(inventoryCommitments.status, "active"),
            ),
          )
          .orderBy(inventoryCommitments.id),
      );

      // 7. Reloj SQL desacoplado
      const [reloj] = await tx.execute<{ effectiveAt: Date }>(sql`select clock_timestamp() as "effectiveAt"`);
      const effectiveAt = new Date(reloj!.effectiveAt);

      await tx.execute(
        sql`set constraints m40_holds_complete, m40_hold_units_complete, m40_reservations_complete, m40_reservation_units_complete, m40_reservation_parties_complete, m40_commitments_complete, m40_commands_complete deferred`,
      );

      // 8. Resolver compromisos expirados en la nueva unidad
      for (const c of compromisosExistentes) {
        if (c.unitId === params.newUnit.unitId) {
          if (c.expiresAt && c.expiresAt <= effectiveAt) {
            await tx.update(inventoryCommitments).set({
              status: "resolved",
              resolvedAt: effectiveAt,
              resolutionReason: "expirado",
              updatedBy: params.actorId,
              updatedAt: effectiveAt,
            }).where(eq(inventoryCommitments.id, c.id));
          } else {
            throw new ConflictError("La unidad de destino ya tiene un compromiso activo.");
          }
        }
      }

      // 9. Verificar que la unidad antigua está activa en la reserva
      const [oldRu] = await tx.select().from(reservationUnits).where(
        and(
          eq(reservationUnits.reservationId, reserva.id),
          eq(reservationUnits.unitId, params.oldUnitId),
          sql`${reservationUnits.releasedAt} is null`,
        ),
      );
      if (!oldRu) throw new NotFoundError("La unidad a sustituir no se encuentra activa en esta reserva.");

      // Si no es borrador, el total pactado es inmutable (m40_guard_history)
      if (reserva.status !== "borrador" && params.newUnit.priceCents !== oldRu.priceCents) {
        throw new ConflictError("El cambio de unidad no puede alterar el total pactado de una reserva no borrador.");
      }

      // 10. Liberar unidad antigua
      await tx.update(reservationUnits).set({
        releasedAt: effectiveAt,
        releaseReason: params.releaseReason,
      }).where(eq(reservationUnits.id, oldRu.id));

      // 11. Resolver compromiso antiguo
      await tx.update(inventoryCommitments).set({
        status: "resolved",
        resolvedAt: effectiveAt,
        resolutionReason: "cambio_unidad",
        updatedAt: effectiveAt,
        updatedBy: params.actorId,
      }).where(and(eq(inventoryCommitments.reservationUnitId, oldRu.id), eq(inventoryCommitments.status, "active")));

      // 12. Insertar nueva unidad en la reserva
      const newUnitCodeNormalized = normalizarCodigoUnidad(newUnitCat.code);
      const [newRu] = await tx
        .insert(reservationUnits)
        .values({
          reservationId: reserva.id,
          unitId: params.newUnit.unitId,
          projectId: newUnitCat.projectId,
          unitCodeNormalized: newUnitCodeNormalized,
          priceCents: params.newUnit.priceCents,
          currency: params.newUnit.currency,
          componentRole: params.newUnit.componentRole,
          createdAt: effectiveAt,
          createdBy: params.actorId,
        })
        .returning();
      if (!newRu) throw new Error("Fallo al insertar nueva unidad de reserva.");

      // 13. Insertar nuevo compromiso si la reserva está activa
      if (["pendiente_pago", "en_verificacion", "confirmada", "cancelacion_solicitada"].includes(reserva.status)) {
        await tx.insert(inventoryCommitments).values({
          unitId: params.newUnit.unitId,
          projectId: newUnitCat.projectId,
          unitCodeNormalized: newUnitCodeNormalized,
          kind: "reservation",
          status: "active",
          reservationUnitId: newRu.id,
          expiresAt: reserva.expiresAt,
          createdBy: params.actorId,
          updatedBy: params.actorId,
          rowVersion: 1,
          correlationId: params.correlationId,
          source: params.source,
          createdAt: effectiveAt,
          updatedAt: effectiveAt,
        });
      }

      // 14. Actualizar versión de la reserva
      const [reservaModificada] = await tx
        .update(reservations)
        .set({
          rowVersion: reserva.rowVersion + 1,
          updatedAt: effectiveAt,
          updatedBy: params.actorId,
        })
        .where(eq(reservations.id, reserva.id))
        .returning();
      if (!reservaModificada) throw new Error("Fallo al actualizar versión de reserva.");

      // 15. Outbox & auditLog
      await tx.insert(outbox).values({
        eventId: randomUUID(),
        eventType: "ReservaUnidadCambiada",
        version: 1,
        aggregateId: reservaModificada.id,
        correlationId: params.correlationId,
        idempotencyKey: params.idempotencyKey,
        payload: {
          publicId: reservaModificada.publicId,
          aggregateVersion: reservaModificada.rowVersion,
          commandId: params.idempotencyKey,
          correlationId: params.correlationId,
        },
        availableAt: effectiveAt,
        createdAt: effectiveAt,
      });

      await tx.insert(auditLog).values({
        userId: params.actorId,
        action: "cambiar_unidad",
        entityType: "reservation",
        entityId: reservaModificada.id,
        newValue: reservaModificada.publicId,
        createdAt: effectiveAt,
      });

      // 16. Completar comando
      await tx.update(transactionCommands).set({
        status: "completed",
        httpStatus: 200,
        resultPublicId: reservaModificada.publicId,
        resultCode: "ReservaUnidadCambiada",
        completedAt: effectiveAt,
      }).where(eq(transactionCommands.id, comando.id));

      const parties = await tx
        .select()
        .from(reservationParties)
        .where(eq(reservationParties.reservationId, reservaModificada.id))
        .orderBy(reservationParties.id);
      const unitsList = await tx
        .select()
        .from(reservationUnits)
        .where(eq(reservationUnits.reservationId, reservaModificada.id))
        .orderBy(reservationUnits.id);

      return mapearReserva(reservaModificada, parties, unitsList);
    },

    async cancelarReserva(params: EntradaCancelarReserva): Promise<Reserva> {
      // 1. Idempotencia: transaction_commands
      const [cmdExistente] = await tx
        .select()
        .from(transactionCommands)
        .where(
          and(
            eq(transactionCommands.actorId, params.actorId),
            eq(transactionCommands.operation, "RESERVA_CANCELAR"),
            eq(transactionCommands.idempotencyKey, params.idempotencyKey),
          ),
        );

      if (cmdExistente) {
        if (cmdExistente.status === "completed") {
          if (cmdExistente.requestHash === params.requestHash && cmdExistente.resultPublicId) {
            const [reservaExistente] = await tx
              .select()
              .from(reservations)
              .where(eq(reservations.publicId, cmdExistente.resultPublicId));
            if (reservaExistente) {
              const parties = await tx
                .select()
                .from(reservationParties)
                .where(eq(reservationParties.reservationId, reservaExistente.id))
                .orderBy(reservationParties.id);
              const unitsList = await tx
                .select()
                .from(reservationUnits)
                .where(eq(reservationUnits.reservationId, reservaExistente.id))
                .orderBy(reservationUnits.id);
              return mapearReserva(reservaExistente, parties, unitsList);
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
          operation: "RESERVA_CANCELAR",
          idempotencyKey: params.idempotencyKey,
          requestHash: params.requestHash,
          status: "processing",
        })
        .returning();
      if (!comando) throw new Error("Fallo al registrar comando.");

      // 2. Bloquear reserva
      const idCond = typeof params.id === "number" || /^\d+$/.test(String(params.id))
        ? eq(reservations.id, Number(params.id))
        : eq(reservations.publicId, String(params.id));

      const [reserva] = await lockForUpdate(
        tx.select().from(reservations).where(idCond),
      );
      if (!reserva) throw new NotFoundError("Reserva no encontrada.");

      if (reserva.rowVersion !== params.expectedVersion) {
        throw new ConflictError("Versión de reserva desactualizada.");
      }
      if (["cancelada", "expirada"].includes(reserva.status)) {
        throw new ConflictError("La reserva ya se encuentra en un estado terminal.");
      }

      // 3. Bloquear negocio
      await lockForUpdate(tx.select().from(deals).where(eq(deals.id, reserva.dealId)));

      // 4. Bloquear unidades de la reserva
      const resUnits = await lockForUpdate(
        tx
          .select()
          .from(reservationUnits)
          .where(and(eq(reservationUnits.reservationId, reserva.id), sql`${reservationUnits.releasedAt} is null`))
          .orderBy(reservationUnits.id),
      );

      // 5. Bloquear compromisos activos de la reserva
      const resUnitIds = resUnits.map(ru => ru.id);
      if (resUnitIds.length > 0) {
        await lockForUpdate(
          tx
            .select()
            .from(inventoryCommitments)
            .where(
              and(
                inArray(inventoryCommitments.reservationUnitId, resUnitIds),
                eq(inventoryCommitments.status, "active"),
              ),
            )
            .orderBy(inventoryCommitments.id),
        );
      }

      // 6. Reloj SQL desacoplado
      const [reloj] = await tx.execute<{ effectiveAt: Date }>(sql`select clock_timestamp() as "effectiveAt"`);
      const effectiveAt = new Date(reloj!.effectiveAt);

      await tx.execute(
        sql`set constraints m40_holds_complete, m40_hold_units_complete, m40_reservations_complete, m40_reservation_units_complete, m40_reservation_parties_complete, m40_commitments_complete, m40_commands_complete deferred`,
      );

      let reservaActualizada: typeof reservations.$inferSelect;
      let eventType: "CancelacionSolicitada" | "ReservaCancelada" | "ReservaExpirada";
      let auditAction: "solicitar_cancelacion" | "cancelar";

      if (params.action === "solicitar") {
        const [upd] = await tx
          .update(reservations)
          .set({
            status: "cancelacion_solicitada",
            rowVersion: reserva.rowVersion + 1,
            updatedAt: effectiveAt,
            updatedBy: params.actorId,
          })
          .where(eq(reservations.id, reserva.id))
          .returning();
        if (!upd) throw new Error("Fallo al solicitar cancelación.");
        reservaActualizada = upd;
        eventType = "CancelacionSolicitada";
        auditAction = "solicitar_cancelacion";
      } else {
        const terminalStatus = reserva.confirmedAt != null ? "cancelada" : "expirada";

        if (resUnitIds.length > 0) {
          await tx
            .update(reservationUnits)
            .set({
              releasedAt: effectiveAt,
              releaseReason: params.reason,
            })
            .where(and(eq(reservationUnits.reservationId, reserva.id), sql`${reservationUnits.releasedAt} is null`));

          await tx
            .update(inventoryCommitments)
            .set({
              status: "resolved",
              resolvedAt: effectiveAt,
              resolutionReason: terminalStatus,
              updatedAt: effectiveAt,
              updatedBy: params.actorId,
            })
            .where(
              and(
                inArray(inventoryCommitments.reservationUnitId, resUnitIds),
                eq(inventoryCommitments.status, "active"),
              ),
            );
        }

        const [upd] = await tx
          .update(reservations)
          .set({
            status: terminalStatus,
            rowVersion: reserva.rowVersion + 1,
            updatedAt: effectiveAt,
            updatedBy: params.actorId,
          })
          .where(eq(reservations.id, reserva.id))
          .returning();
        if (!upd) throw new Error("Fallo al cancelar reserva.");
        reservaActualizada = upd;
        eventType = terminalStatus === "cancelada" ? "ReservaCancelada" : "ReservaExpirada";
        auditAction = "cancelar";
      }

      // 7. Outbox & auditLog
      await tx.insert(outbox).values({
        eventId: randomUUID(),
        eventType,
        version: 1,
        aggregateId: reservaActualizada.id,
        correlationId: params.correlationId,
        idempotencyKey: params.idempotencyKey,
        payload: {
          publicId: reservaActualizada.publicId,
          aggregateVersion: reservaActualizada.rowVersion,
          commandId: params.idempotencyKey,
          correlationId: params.correlationId,
        },
        availableAt: effectiveAt,
        createdAt: effectiveAt,
      });

      await tx.insert(auditLog).values({
        userId: params.actorId,
        action: auditAction,
        entityType: "reservation",
        entityId: reservaActualizada.id,
        newValue: reservaActualizada.publicId,
        createdAt: effectiveAt,
      });

      // 8. Completar comando
      await tx.update(transactionCommands).set({
        status: "completed",
        httpStatus: 200,
        resultPublicId: reservaActualizada.publicId,
        resultCode: eventType,
        completedAt: effectiveAt,
      }).where(eq(transactionCommands.id, comando.id));

      const parties = await tx
        .select()
        .from(reservationParties)
        .where(eq(reservationParties.reservationId, reservaActualizada.id))
        .orderBy(reservationParties.id);
      const unitsList = await tx
        .select()
        .from(reservationUnits)
        .where(eq(reservationUnits.reservationId, reservaActualizada.id))
        .orderBy(reservationUnits.id);

      return mapearReserva(reservaActualizada, parties, unitsList);
    },

    async buscarReservaPorId(id: number, actor: Actor, scope: PermissionScope): Promise<Reserva | null> {
      const [reserva] = await tx
        .select()
        .from(reservations)
        .where(and(eq(reservations.id, id), visibleReservas(actor, scope)));
      if (!reserva) return null;

      const parties = await tx
        .select()
        .from(reservationParties)
        .where(eq(reservationParties.reservationId, reserva.id))
        .orderBy(reservationParties.id);
      const unitsList = await tx
        .select()
        .from(reservationUnits)
        .where(eq(reservationUnits.reservationId, reserva.id))
        .orderBy(reservationUnits.id);

      return mapearReserva(reserva, parties, unitsList);
    },

    async buscarReservaPorPublicId(publicId: string, actor: Actor, scope: PermissionScope): Promise<Reserva | null> {
      const [reserva] = await tx
        .select()
        .from(reservations)
        .where(and(eq(reservations.publicId, publicId), visibleReservas(actor, scope)));
      if (!reserva) return null;

      const parties = await tx
        .select()
        .from(reservationParties)
        .where(eq(reservationParties.reservationId, reserva.id))
        .orderBy(reservationParties.id);
      const unitsList = await tx
        .select()
        .from(reservationUnits)
        .where(eq(reservationUnits.reservationId, reserva.id))
        .orderBy(reservationUnits.id);

      return mapearReserva(reserva, parties, unitsList);
    },

    async listarReservas(filtros: FiltrosReservas, actor: Actor, scope: PermissionScope): Promise<Reserva[]> {
      const condiciones = [visibleReservas(actor, scope)];

      if (filtros.dealId != null) {
        condiciones.push(eq(reservations.dealId, filtros.dealId));
      }
      if (filtros.status != null) {
        condiciones.push(eq(reservations.status, filtros.status));
      }
      if (filtros.id != null) {
        if (typeof filtros.id === "number" || /^\d+$/.test(String(filtros.id))) {
          condiciones.push(eq(reservations.id, Number(filtros.id)));
        } else {
          condiciones.push(eq(reservations.publicId, String(filtros.id)));
        }
      }
      if (filtros.unitId != null) {
        condiciones.push(
          sql`exists (select 1 from ${reservationUnits} where ${reservationUnits.reservationId} = ${reservations.id} and ${reservationUnits.unitId} = ${filtros.unitId} and ${reservationUnits.releasedAt} is null)`,
        );
      }

      const rows = await tx
        .select()
        .from(reservations)
        .where(and(...condiciones))
        .orderBy(reservations.id);

      const resultado: Reserva[] = [];
      for (const row of rows) {
        const parties = await tx
          .select()
          .from(reservationParties)
          .where(eq(reservationParties.reservationId, row.id))
          .orderBy(reservationParties.id);
        const unitsList = await tx
          .select()
          .from(reservationUnits)
          .where(eq(reservationUnits.reservationId, row.id))
          .orderBy(reservationUnits.id);
        resultado.push(mapearReserva(row, parties, unitsList));
      }

      return resultado;
    },
  };
}

export const reposReservas = (tx: Tx): ReposReservas => ({
  reservas: repositorioReservas(tx),
});
