/**
 * M7 · Brokers — "Asignar propiedades" (`docs/F3_ANALISIS_Y_PLAN.md` §4.4,
 * decisión #38, issue #33). La única escritura nueva del módulo: el resto de
 * la pantalla son consultas sobre lo que M13, M5 y el cierre ya escriben.
 *
 * `projects:edit` no basta con cualquier alcance: solo `all` puede reasignar
 * el proyecto de otro broker (admin y asistente, según `db/seed.sql`) — un
 * broker con `projects:view own` no tiene este permiso, y aunque lo tuviera
 * con `own` no tendría sentido: no puede "asignarse a sí mismo" un proyecto
 * ajeno sin verlo primero.
 *
 * El diff (qué se asigna, qué se suelta) es `domain/asignacion-propiedades.ts`,
 * probado aparte; aquí solo se aplica dentro de una transacción y se audita
 * cada proyecto que de verdad cambió — nunca los que ya estaban como deben
 * quedar.
 */

import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { diffAsignacion } from "@/domain/asignacion-propiedades";
import { ForbiddenError, NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { brokerProfiles, projects, users } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";

const AsignarProyectosInput = z.object({
  projectIds: z.array(z.number().int().positive()),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const brokerId = Number(idParam);
    if (!Number.isInteger(brokerId) || brokerId <= 0) throw new NotFoundError();

    const datos = parseInput(AsignarProyectosInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "projects", "edit");
    if (scope !== "all") {
      throw new ForbiddenError("Se requiere alcance completo sobre proyectos para asignar propiedades.");
    }

    const idsSolicitados = Array.from(new Set(datos.projectIds));

    const proyectosActualizados = await transaction(async (tx) => {
      const [broker] = await tx
        .select({ userId: brokerProfiles.userId, isActive: users.isActive, deletedAt: users.deletedAt })
        .from(brokerProfiles)
        .innerJoin(users, eq(users.id, brokerProfiles.userId))
        .where(eq(brokerProfiles.userId, brokerId))
        .limit(1);
      if (!broker || !broker.isActive || broker.deletedAt) throw new NotFoundError("El broker indicado no existe.");

      // Una sola consulta cubre las dos cosas que hacían falta por separado:
      // validar que los proyectos pedidos existen (`encontrados`) y tener la
      // foto "antes" de auditoría de todo lo que puede cambiar — los
      // proyectos pedidos y los que hoy ya son de este broker (`OR`, no dos
      // `SELECT`).
      //
      // El universo es "activo, no borrado": exactamente lo que el modal de
      // `/brokers` ofrece marcar (`isActive = true`, `deletedAt is null`). Un
      // proyecto inactivo asignado hoy a este broker no aparece aquí, así que
      // nunca cae en `aQuitar` — antes sí, y como el modal ni lo lista, cada
      // guardado lo desasignaba solo (bug de la revisión de spec, issue #33).
      const universoCondicion = and(eq(projects.isActive, true), isNull(projects.deletedAt));
      const relevantes =
        idsSolicitados.length > 0
          ? await tx
              .select()
              .from(projects)
              .where(and(or(inArray(projects.id, idsSolicitados), eq(projects.brokerId, brokerId)), universoCondicion))
          : await tx.select().from(projects).where(and(eq(projects.brokerId, brokerId), universoCondicion));

      const encontrados = new Set(relevantes.map((fila) => fila.id));
      if (idsSolicitados.some((id) => !encontrados.has(id))) {
        throw new NotFoundError("Alguno de los proyectos indicados no existe o no está activo.");
      }
      const antesPorId = new Map(relevantes.map((fila) => [fila.id, fila]));

      const asignadosActualmente = relevantes.filter((fila) => fila.brokerId === brokerId).map((fila) => fila.id);
      const { aAsignar, aQuitar } = diffAsignacion(asignadosActualmente, idsSolicitados);
      if (aAsignar.length === 0 && aQuitar.length === 0) return [];

      const filas = [];
      if (aAsignar.length > 0) {
        filas.push(
          ...(await tx
            .update(projects)
            .set({ brokerId, updatedBy: actor.userId })
            .where(inArray(projects.id, aAsignar))
            .returning()),
        );
      }
      if (aQuitar.length > 0) {
        filas.push(
          ...(await tx
            .update(projects)
            .set({ brokerId: null, updatedBy: actor.userId })
            .where(inArray(projects.id, aQuitar))
            .returning()),
        );
      }

      for (const fila of filas) {
        await auditar(tx, actor, {
          accion: "asignar",
          entidad: "project",
          entidadId: fila.id,
          antes: antesPorId.get(fila.id),
          despues: fila,
        });
      }

      return filas;
    });

    return Response.json({ ok: true, proyectos: proyectosActualizados });
  } catch (error) {
    return errorResponse(error);
  }
}
