/**
 * Adaptador Drizzle de Academy (`application/academy/puertos.ts`).
 *
 * Incluye:
 * - Contenidos y checklists operativos persistidos (sin fallback de IDs fijos negativos).
 * - Perfil del actor con sus proyectos asignados y su vínculo en `external_refs` (`system = 'moodle'`).
 * - Solicitudes de revisión de completado (`academy_review_requests`).
 * - Decisión administrativa (regla Q-C1-03: prohibición estricta de autoaprobación),
 *   emisión de constancias con firma SHA-256 calculada en servidor (`academy_certificates`)
 *   y registro transaccional en `audit_log` mediante `auditar(tx, actor, ...)`.
 */

import { createHash } from "node:crypto";
import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import {
  bloqueaNuevaSolicitud,
  estadoVigenciaConstancia,
} from "../../../domain/academy-vigencia.ts";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../domain/errors.ts";
import type { Actor } from "../../../domain/rbac.ts";
import type {
  ChecklistItemAcademy,
  ConstanciaAcademy,
  EstadoConstanciaAcademy,
  EstadoSolicitudAcademy,
  ItemAcademy,
  PerfilActorAcademy,
  RepositorioAcademy,
  ResumenProgresoAcademy,
  SolicitudRevisionAcademy,
  TipoContenidoAcademy,
  UsuarioCrmAcademy,
} from "../../../application/academy/puertos.ts";
import { auditar } from "../../audit.ts";
import {
  academyCertificates,
  academyChecklistItems,
  academyChecklistProgress,
  academyItems,
  academyProgress,
  academyReviewRequests,
  externalRefs,
  projects,
  roles,
  users,
} from "../schema.ts";
import type { Tx } from "./compartido.ts";

export function repositorioAcademy(tx: Tx): RepositorioAcademy {
  return {
    async listarContenidos(userId: number, categoria?: string): Promise<ItemAcademy[]> {
      const items = await tx
        .select({
          id: academyItems.id,
          title: academyItems.title,
          itemType: academyItems.itemType,
          description: academyItems.description,
          durationMinutes: academyItems.durationMinutes,
          videoUrl: academyItems.videoUrl,
          position: academyItems.position,
          progressPercent: sql<number>`coalesce(${academyProgress.progressPercent}, 0)`,
          isCompleted: sql<boolean>`coalesce(${academyProgress.isCompleted}, false)`,
          completedAt: academyProgress.completedAt,
        })
        .from(academyItems)
        .leftJoin(
          academyProgress,
          and(
            eq(academyProgress.academyItemId, academyItems.id),
            eq(academyProgress.userId, userId),
          ),
        )
        .where(eq(academyItems.isActive, true))
        .orderBy(academyItems.position);

      const itemsConChecklist: ItemAcademy[] = [];

      for (const item of items) {
        let checklist: ChecklistItemAcademy[] = [];

        if (item.itemType === "checklist") {
          const pasos = await tx
            .select({
              id: academyChecklistItems.id,
              academyItemId: academyChecklistItems.academyItemId,
              position: academyChecklistItems.position,
              label: academyChecklistItems.label,
              isCompleted: sql<boolean>`coalesce(${academyChecklistProgress.isCompleted}, false)`,
            })
            .from(academyChecklistItems)
            .leftJoin(
              academyChecklistProgress,
              and(
                eq(academyChecklistProgress.checklistItemId, academyChecklistItems.id),
                eq(academyChecklistProgress.userId, userId),
              ),
            )
            .where(eq(academyChecklistItems.academyItemId, item.id))
            .orderBy(academyChecklistItems.position);

          checklist = pasos;
        }

        const cat =
          item.itemType === "session"
            ? "Sesión de formación"
            : item.itemType === "checklist"
              ? "Checklist operativo"
              : "Material de apoyo";
        if (categoria && cat.toLowerCase() !== categoria.toLowerCase()) continue;

        itemsConChecklist.push({
          id: item.id,
          title: item.title,
          itemType: item.itemType as TipoContenidoAcademy,
          description: item.description,
          durationMinutes: item.durationMinutes,
          videoUrl: item.videoUrl,
          position: item.position,
          category: cat,
          progressPercent: Number(item.progressPercent),
          isCompleted: Boolean(item.isCompleted),
          completedAt: item.completedAt,
          checklistItems: checklist,
        });
      }

      return itemsConChecklist;
    },

    async obtenerContenidoPorId(userId: number, itemId: number): Promise<ItemAcademy | null> {
      const [item] = await tx
        .select({
          id: academyItems.id,
          title: academyItems.title,
          itemType: academyItems.itemType,
          description: academyItems.description,
          durationMinutes: academyItems.durationMinutes,
          videoUrl: academyItems.videoUrl,
          position: academyItems.position,
          progressPercent: sql<number>`coalesce(${academyProgress.progressPercent}, 0)`,
          isCompleted: sql<boolean>`coalesce(${academyProgress.isCompleted}, false)`,
          completedAt: academyProgress.completedAt,
        })
        .from(academyItems)
        .leftJoin(
          academyProgress,
          and(
            eq(academyProgress.academyItemId, academyItems.id),
            eq(academyProgress.userId, userId),
          ),
        )
        .where(eq(academyItems.id, itemId))
        .limit(1);

      if (!item) return null;

      let checklist: ChecklistItemAcademy[] = [];
      if (item.itemType === "checklist") {
        checklist = await tx
          .select({
            id: academyChecklistItems.id,
            academyItemId: academyChecklistItems.academyItemId,
            position: academyChecklistItems.position,
            label: academyChecklistItems.label,
            isCompleted: sql<boolean>`coalesce(${academyChecklistProgress.isCompleted}, false)`,
          })
          .from(academyChecklistItems)
          .leftJoin(
            academyChecklistProgress,
            and(
              eq(academyChecklistProgress.checklistItemId, academyChecklistItems.id),
              eq(academyChecklistProgress.userId, userId),
            ),
          )
          .where(eq(academyChecklistItems.academyItemId, item.id))
          .orderBy(academyChecklistItems.position);
      }

      return {
        id: item.id,
        title: item.title,
        itemType: item.itemType as TipoContenidoAcademy,
        description: item.description,
        durationMinutes: item.durationMinutes,
        videoUrl: item.videoUrl,
        position: item.position,
        category:
          item.itemType === "session"
            ? "Sesión de formación"
            : item.itemType === "checklist"
              ? "Checklist operativo"
              : "Material de apoyo",
        progressPercent: Number(item.progressPercent),
        isCompleted: Boolean(item.isCompleted),
        completedAt: item.completedAt,
        checklistItems: checklist,
      };
    },

    async actualizarProgreso(
      userId: number,
      itemId: number,
      progressPercent: number,
      isCompleted: boolean,
    ): Promise<{ progressPercent: number; isCompleted: boolean }> {
      const percent = Math.min(100, Math.max(0, progressPercent));
      const completed = isCompleted || percent === 100;
      const completedAt = completed ? new Date() : null;

      await tx
        .insert(academyProgress)
        .values({
          userId,
          academyItemId: itemId,
          progressPercent: percent,
          isCompleted: completed,
          completedAt,
        })
        .onConflictDoUpdate({
          target: [academyProgress.userId, academyProgress.academyItemId],
          set: {
            progressPercent: percent,
            isCompleted: completed,
            completedAt,
          },
        });

      return { progressPercent: percent, isCompleted: completed };
    },

    async marcarPasoChecklist(
      userId: number,
      checklistItemId: number,
      isCompleted: boolean,
    ): Promise<boolean> {
      const [paso] = await tx
        .select({ academyItemId: academyChecklistItems.academyItemId })
        .from(academyChecklistItems)
        .where(eq(academyChecklistItems.id, checklistItemId))
        .limit(1);

      if (!paso) throw new Error("Paso de checklist no encontrado.");

      await tx
        .insert(academyChecklistProgress)
        .values({
          userId,
          checklistItemId,
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: [academyChecklistProgress.userId, academyChecklistProgress.checklistItemId],
          set: {
            isCompleted,
            completedAt: isCompleted ? new Date() : null,
          },
        });

      const todosLosPasos = await tx
        .select({ id: academyChecklistItems.id })
        .from(academyChecklistItems)
        .where(eq(academyChecklistItems.academyItemId, paso.academyItemId));

      const completados = await tx
        .select({ id: academyChecklistProgress.id })
        .from(academyChecklistProgress)
        .innerJoin(
          academyChecklistItems,
          eq(academyChecklistProgress.checklistItemId, academyChecklistItems.id),
        )
        .where(
          and(
            eq(academyChecklistItems.academyItemId, paso.academyItemId),
            eq(academyChecklistProgress.userId, userId),
            eq(academyChecklistProgress.isCompleted, true),
          ),
        );

      const percent = Math.round((completados.length / (todosLosPasos.length || 1)) * 100);
      const terminado = completados.length === todosLosPasos.length && todosLosPasos.length > 0;

      await tx
        .insert(academyProgress)
        .values({
          userId,
          academyItemId: paso.academyItemId,
          progressPercent: percent,
          isCompleted: terminado,
          completedAt: terminado ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: [academyProgress.userId, academyProgress.academyItemId],
          set: {
            progressPercent: percent,
            isCompleted: terminado,
            completedAt: terminado ? new Date() : null,
          },
        });

      return isCompleted;
    },

    async obtenerResumenProgreso(userId: number): Promise<ResumenProgresoAcademy> {
      const [cuenta] = await tx
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(academyItems)
        .where(eq(academyItems.isActive, true));

      const [completados] = await tx
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(academyProgress)
        .innerJoin(
          academyItems,
          and(
            eq(academyItems.id, academyProgress.academyItemId),
            eq(academyItems.isActive, true),
          ),
        )
        .where(
          and(
            eq(academyProgress.userId, userId),
            eq(academyProgress.isCompleted, true),
          ),
        );

      const totalItems = Number(cuenta?.total || 0);
      const completedItems = Number(completados?.total || 0);
      const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      return {
        totalItems,
        completedItems,
        percent,
      };
    },

    async obtenerPerfilActor(userId: number): Promise<PerfilActorAcademy | null> {
      const [fila] = await tx
        .select({
          userId: users.id,
          fullName: users.fullName,
          email: users.email,
          roleSlug: roles.slug,
          externalId: externalRefs.externalId,
        })
        .from(users)
        .innerJoin(roles, eq(roles.id, users.roleId))
        .leftJoin(
          externalRefs,
          and(
            eq(externalRefs.entityType, "user"),
            eq(externalRefs.localId, users.id),
            eq(externalRefs.system, "moodle"),
          ),
        )
        .where(and(eq(users.id, userId), isNull(users.deletedAt)))
        .limit(1);

      if (!fila) return null;

      const proyectos = await tx
        .select({
          id: projects.id,
          name: projects.name,
          zone: projects.zone,
        })
        .from(projects)
        .where(and(eq(projects.brokerId, userId), isNull(projects.deletedAt)))
        .orderBy(projects.id);

      const moodleUserId =
        fila.externalId && Number.isFinite(Number(fila.externalId))
          ? Number(fila.externalId)
          : null;

      return {
        userId: fila.userId,
        fullName: fila.fullName,
        email: fila.email ?? "",
        roleSlug: fila.roleSlug,
        moodleUserId,
        proyectosAsignados: proyectos,
      };
    },

    async listarUsuariosCrm(filtroRol?: string): Promise<UsuarioCrmAcademy[]> {
      const filas = await tx
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          roleSlug: roles.slug,
          externalId: externalRefs.externalId,
          proyectosCount: sql<number>`(
            select count(*)::int from projects p
            where p.broker_id = ${users.id} and p.deleted_at is null
          )`,
        })
        .from(users)
        .innerJoin(roles, eq(roles.id, users.roleId))
        .leftJoin(
          externalRefs,
          and(
            eq(externalRefs.entityType, "user"),
            eq(externalRefs.localId, users.id),
            eq(externalRefs.system, "moodle"),
          ),
        )
        .where(and(eq(users.isActive, true), isNull(users.deletedAt)))
        .orderBy(users.id);

      return filas
        .filter((f) => !filtroRol || f.roleSlug === filtroRol)
        .map((f) => ({
          id: f.id,
          fullName: f.fullName,
          email: f.email ?? "",
          roleSlug: f.roleSlug,
          moodleUserId:
            f.externalId && Number.isFinite(Number(f.externalId))
              ? Number(f.externalId)
              : null,
          proyectosCount: Number(f.proyectosCount || 0),
        }));
    },

    async guardarVinculoMoodle(localUserId: number, moodleUserId: number): Promise<void> {
      const [existente] = await tx
        .select({ id: externalRefs.id, version: externalRefs.version })
        .from(externalRefs)
        .where(
          and(
            eq(externalRefs.entityType, "user"),
            eq(externalRefs.localId, localUserId),
            eq(externalRefs.system, "moodle"),
          ),
        )
        .limit(1);

      if (existente) {
        await tx
          .update(externalRefs)
          .set({
            externalId: String(moodleUserId),
            version: existente.version + 1,
            syncedAt: new Date(),
          })
          .where(eq(externalRefs.id, existente.id));
      } else {
        await tx.insert(externalRefs).values({
          entityType: "user",
          localId: localUserId,
          system: "moodle",
          externalId: String(moodleUserId),
          version: 1,
          syncedAt: new Date(),
        });
      }
    },

    async listarSolicitudesRevision(brokerIdFiltro?: number): Promise<SolicitudRevisionAcademy[]> {
      const filas = await tx
        .select({
          id: academyReviewRequests.id,
          publicId: academyReviewRequests.publicId,
          brokerId: academyReviewRequests.brokerId,
          brokerNombre: users.fullName,
          brokerEmail: users.email,
          courseCode: academyReviewRequests.courseCode,
          courseName: academyReviewRequests.courseName,
          moodleCourseId: academyReviewRequests.moodleCourseId,
          progressPercent: academyReviewRequests.progressPercent,
          gradePercent: academyReviewRequests.gradePercent,
          evidenceHash: academyReviewRequests.evidenceHash,
          evidencePayload: academyReviewRequests.evidencePayload,
          status: academyReviewRequests.status,
          decisionBy: academyReviewRequests.decisionBy,
          decisionReason: academyReviewRequests.decisionReason,
          decidedAt: academyReviewRequests.decidedAt,
          createdAt: academyReviewRequests.createdAt,
          decisionByNombre: sql<string | null>`(
            select u2.full_name from users u2 where u2.id = ${academyReviewRequests.decisionBy}
          )`,
        })
        .from(academyReviewRequests)
        .innerJoin(users, eq(users.id, academyReviewRequests.brokerId))
        .where(
          brokerIdFiltro !== undefined
            ? and(
                eq(academyReviewRequests.brokerId, brokerIdFiltro),
                isNull(academyReviewRequests.deletedAt),
              )
            : isNull(academyReviewRequests.deletedAt),
        )
        .orderBy(desc(academyReviewRequests.createdAt), desc(academyReviewRequests.id));

      return filas.map((f) => ({
        id: f.id,
        publicId: f.publicId,
        brokerId: f.brokerId,
        brokerNombre: f.brokerNombre,
        brokerEmail: f.brokerEmail ?? "",
        courseCode: f.courseCode,
        courseName: f.courseName,
        moodleCourseId: f.moodleCourseId,
        progressPercent: f.progressPercent,
        gradePercent: f.gradePercent,
        evidenceHash: f.evidenceHash,
        evidencePayload: (f.evidencePayload ?? {}) as Record<string, unknown>,
        status: f.status as EstadoSolicitudAcademy,
        decisionBy: f.decisionBy,
        decisionByNombre: f.decisionByNombre,
        decisionReason: f.decisionReason,
        decidedAt: f.decidedAt,
        createdAt: f.createdAt,
      }));
    },

    async obtenerSolicitudRevisionPorId(solicitudId: number): Promise<SolicitudRevisionAcademy | null> {
      const todas = await this.listarSolicitudesRevision();
      return todas.find((s) => s.id === solicitudId) ?? null;
    },

    async crearSolicitudRevision(
      actor: Actor,
      datos: {
        brokerId: number;
        courseCode: string;
        courseName: string;
        moodleCourseId: number;
        progressPercent: number;
        gradePercent: number | null;
        evidenceHash: string;
        evidencePayload: Record<string, unknown>;
      },
    ): Promise<SolicitudRevisionAcademy> {
      const existentes = await tx
        .select({
          id: academyReviewRequests.id,
          status: academyReviewRequests.status,
        })
        .from(academyReviewRequests)
        .where(
          and(
            eq(academyReviewRequests.brokerId, datos.brokerId),
            eq(academyReviewRequests.courseCode, datos.courseCode),
            isNull(academyReviewRequests.deletedAt),
          ),
        )
        .orderBy(desc(academyReviewRequests.id));

      // Una aprobación solo bloquea mientras su constancia siga acreditando formación.
      // Vencida o revocada, el broker puede pedir recertificación.
      const aprobadas = existentes.filter((e) => e.status === "aprobado");
      if (aprobadas.length > 0) {
        const constanciasAprobadas = await tx
          .select({ status: academyCertificates.status, issuedAt: academyCertificates.issuedAt })
          .from(academyCertificates)
          .where(
            and(
              inArray(academyCertificates.reviewRequestId, aprobadas.map((a) => a.id)),
              isNull(academyCertificates.deletedAt),
            ),
          );
        const ahora = new Date();
        // `por_vencer` acredita pero ya es elegible para recertificar: solo bloquea `vigente`.
        const acreditada = constanciasAprobadas.some((c) =>
          bloqueaNuevaSolicitud(estadoVigenciaConstancia(c, ahora)),
        );
        if (acreditada) {
          throw new ValidationError(
            "Ya existe una solicitud aprobada con constancia vigente para este curso.",
          );
        }
      }

      const pendiente = existentes.find((e) => e.status === "pendiente");
      let solicitudId: number;

      if (pendiente) {
        const [actualizada] = await tx
          .update(academyReviewRequests)
          .set({
            courseName: datos.courseName,
            moodleCourseId: datos.moodleCourseId,
            progressPercent: datos.progressPercent,
            gradePercent: datos.gradePercent,
            evidenceHash: datos.evidenceHash,
            evidencePayload: datos.evidencePayload,
            updatedAt: new Date(),
          })
          .where(eq(academyReviewRequests.id, pendiente.id))
          .returning({ id: academyReviewRequests.id, publicId: academyReviewRequests.publicId });

        solicitudId = actualizada!.id;

        await auditar(tx, actor, {
          accion: "editar",
          entidad: "academy_item",
          entidadId: solicitudId,
          antes: { status: "pendiente" },
          despues: {
            tipo: "solicitud_revision_academy",
            publicId: actualizada!.publicId,
            brokerId: datos.brokerId,
            courseCode: datos.courseCode,
            progressPercent: datos.progressPercent,
            gradePercent: datos.gradePercent,
            evidenceHash: datos.evidenceHash,
          },
        });
      } else {
        const [insertada] = await tx
          .insert(academyReviewRequests)
          .values({
            brokerId: datos.brokerId,
            courseCode: datos.courseCode,
            courseName: datos.courseName,
            moodleCourseId: datos.moodleCourseId,
            progressPercent: datos.progressPercent,
            gradePercent: datos.gradePercent,
            evidenceHash: datos.evidenceHash,
            evidencePayload: datos.evidencePayload,
            status: "pendiente",
          })
          .returning({ id: academyReviewRequests.id, publicId: academyReviewRequests.publicId });

        solicitudId = insertada!.id;

        await auditar(tx, actor, {
          accion: "crear",
          entidad: "academy_item",
          entidadId: solicitudId,
          despues: {
            tipo: "solicitud_revision_academy",
            publicId: insertada!.publicId,
            brokerId: datos.brokerId,
            courseCode: datos.courseCode,
            progressPercent: datos.progressPercent,
            gradePercent: datos.gradePercent,
            evidenceHash: datos.evidenceHash,
          },
        });
      }

      const resultado = await this.obtenerSolicitudRevisionPorId(solicitudId);
      if (!resultado) {
        throw new NotFoundError("No fue posible recuperar la solicitud creada.");
      }
      return resultado;
    },

    async decidirSolicitudRevision(
      actor: Actor,
      datos: {
        solicitudId: number;
        decision: "aprobado" | "rechazado";
        motivo: string;
      },
    ): Promise<{
      solicitud: SolicitudRevisionAcademy;
      constancia: ConstanciaAcademy | null;
    }> {
      const actual = await this.obtenerSolicitudRevisionPorId(datos.solicitudId);
      if (!actual) {
        throw new NotFoundError("Solicitud de revisión no encontrada.");
      }

      if (actor.userId === actual.brokerId) {
        throw new ForbiddenError(
          "Regla Q-C1-03: ningún usuario puede aprobar o decidir su propia solicitud de certificación.",
        );
      }

      if (actual.status !== "pendiente") {
        throw new ValidationError(
          `La solicitud ya fue procesada con estado "${actual.status}".`,
        );
      }

      const ahora = new Date();
      await tx
        .update(academyReviewRequests)
        .set({
          status: datos.decision,
          decisionBy: actor.userId,
          decisionReason: datos.motivo.trim(),
          decidedAt: ahora,
          updatedAt: ahora,
        })
        .where(eq(academyReviewRequests.id, actual.id));

      let constanciaEmitida: ConstanciaAcademy | null = null;

      if (datos.decision === "aprobado") {
        const snapshot = {
          solicitudPublicId: actual.publicId,
          brokerId: actual.brokerId,
          courseCode: actual.courseCode,
          courseName: actual.courseName,
          moodleCourseId: actual.moodleCourseId,
          progressPercent: actual.progressPercent,
          gradePercent: actual.gradePercent,
          evidenceHash: actual.evidenceHash,
          approvedBy: actor.userId,
          issuedAt: ahora.toISOString(),
        };

        const cryptographicHash = createHash("sha256")
          .update(JSON.stringify(snapshot))
          .digest("hex");

        const verificationCode = `QHA-${ahora.getUTCFullYear()}-${String(actual.id).padStart(4, "0")}-${cryptographicHash.slice(0, 6).toUpperCase()}`;

        const [cert] = await tx
          .insert(academyCertificates)
          .values({
            reviewRequestId: actual.id,
            brokerId: actual.brokerId,
            courseCode: actual.courseCode,
            courseName: actual.courseName,
            verificationCode,
            cryptographicHash,
            evidenceSnapshot: snapshot,
            approvedBy: actor.userId,
            status: "vigente",
            issuedAt: ahora,
          })
          .returning({ id: academyCertificates.id });

        const todasConstancias = await this.listarConstancias(actual.brokerId);
        constanciaEmitida = todasConstancias.find((c) => c.id === cert?.id) ?? null;
      }

      await auditar(tx, actor, {
        accion: "editar",
        entidad: "academy_item",
        entidadId: actual.id,
        antes: {
          status: actual.status,
          decisionBy: actual.decisionBy,
        },
        despues: {
          tipo: "decision_revision_academy",
          status: datos.decision,
          decisionBy: actor.userId,
          decisionReason: datos.motivo.trim(),
          verificationCode: constanciaEmitida?.verificationCode ?? null,
          cryptographicHash: constanciaEmitida?.cryptographicHash ?? null,
        },
      });

      const solicitudActualizada = await this.obtenerSolicitudRevisionPorId(actual.id);
      if (!solicitudActualizada) {
        throw new NotFoundError("No se encontró la solicitud actualizada.");
      }

      return {
        solicitud: solicitudActualizada,
        constancia: constanciaEmitida,
      };
    },

    async revocarConstancia(
      actor: Actor,
      datos: {
        constanciaId: number;
        motivo: string;
      },
    ): Promise<ConstanciaAcademy> {
      const todas = await this.listarConstancias();
      const actual = todas.find((c) => c.id === datos.constanciaId);
      if (!actual) {
        throw new NotFoundError("Constancia de Academy no encontrada.");
      }

      if (actor.userId === actual.brokerId) {
        throw new ForbiddenError(
          "Regla Q-C1-03: ningún usuario puede gestionar o revocar su propia constancia.",
        );
      }

      if (actual.status === "revocada") {
        throw new ValidationError("La constancia ya se encuentra revocada.");
      }

      const ahora = new Date();
      await tx
        .update(academyCertificates)
        .set({
          status: "revocada",
          revokedBy: actor.userId,
          revokedReason: datos.motivo.trim(),
          revokedAt: ahora,
          updatedAt: ahora,
        })
        .where(eq(academyCertificates.id, actual.id));

      await tx
        .update(academyReviewRequests)
        .set({
          status: "revocado",
          decisionBy: actor.userId,
          decisionReason: datos.motivo.trim(),
          decidedAt: ahora,
          updatedAt: ahora,
        })
        .where(eq(academyReviewRequests.id, actual.reviewRequestId));

      await auditar(tx, actor, {
        accion: "eliminar",
        entidad: "academy_item",
        entidadId: actual.id,
        antes: { status: actual.status, verificationCode: actual.verificationCode },
        despues: {
          tipo: "revocacion_constancia_academy",
          status: "revocada",
          revokedBy: actor.userId,
          revokedReason: datos.motivo.trim(),
          verificationCode: actual.verificationCode,
        },
      });

      const actualizada = (await this.listarConstancias()).find((c) => c.id === actual.id);
      if (!actualizada) {
        throw new NotFoundError("No fue posible recuperar la constancia revocada.");
      }
      return actualizada;
    },

    async listarConstancias(brokerIdFiltro?: number): Promise<ConstanciaAcademy[]> {
      const filas = await tx
        .select({
          id: academyCertificates.id,
          publicId: academyCertificates.publicId,
          reviewRequestId: academyCertificates.reviewRequestId,
          brokerId: academyCertificates.brokerId,
          brokerNombre: users.fullName,
          brokerEmail: users.email,
          courseCode: academyCertificates.courseCode,
          courseName: academyCertificates.courseName,
          verificationCode: academyCertificates.verificationCode,
          cryptographicHash: academyCertificates.cryptographicHash,
          evidenceSnapshot: academyCertificates.evidenceSnapshot,
          approvedBy: academyCertificates.approvedBy,
          status: academyCertificates.status,
          revokedBy: academyCertificates.revokedBy,
          revokedReason: academyCertificates.revokedReason,
          revokedAt: academyCertificates.revokedAt,
          issuedAt: academyCertificates.issuedAt,
          approvedByNombre: sql<string>`coalesce((
            select u2.full_name from users u2 where u2.id = ${academyCertificates.approvedBy}
          ), 'Administrador')`,
        })
        .from(academyCertificates)
        .innerJoin(users, eq(users.id, academyCertificates.brokerId))
        .where(
          brokerIdFiltro !== undefined
            ? and(
                eq(academyCertificates.brokerId, brokerIdFiltro),
                isNull(academyCertificates.deletedAt),
              )
            : isNull(academyCertificates.deletedAt),
        )
        .orderBy(desc(academyCertificates.issuedAt), desc(academyCertificates.id));

      return filas.map((f) => ({
        id: f.id,
        publicId: f.publicId,
        reviewRequestId: f.reviewRequestId,
        brokerId: f.brokerId,
        brokerNombre: f.brokerNombre,
        brokerEmail: f.brokerEmail ?? "",
        courseCode: f.courseCode,
        courseName: f.courseName,
        verificationCode: f.verificationCode,
        cryptographicHash: f.cryptographicHash,
        evidenceSnapshot: (f.evidenceSnapshot ?? {}) as Record<string, unknown>,
        approvedBy: f.approvedBy,
        approvedByNombre: f.approvedByNombre,
        status: f.status as EstadoConstanciaAcademy,
        revokedBy: f.revokedBy,
        revokedReason: f.revokedReason,
        revokedAt: f.revokedAt,
        issuedAt: f.issuedAt,
      }));
    },
  };
}

export function reposAcademy(tx: Tx): RepositorioAcademy {
  return repositorioAcademy(tx);
}
