/**
 * M6 · Avances de obra — borrado lógico de una foto (issue #32, decisión #33).
 *
 * `files.deleted_at`, no `DELETE` real (a diferencia de la fase misma): la
 * tabla sí tiene papelera. El objeto en Storage se queda.
 *
 * ponytail: no se borra el objeto de Storage al borrar la fila. Techo: un
 * archivo huérfano en un bucket privado no se filtra a nadie (decisión #33),
 * solo ocupa espacio; si eso importa, se sube borrando también con
 * `admin.storage.from("avances-obra").remove([fila.url])` aquí, con el mismo
 * criterio de "mejor esfuerzo" que ya usa `fotos/route.ts` al revertir una
 * subida fallida.
 */

import { and, eq, isNull } from "drizzle-orm";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { files } from "@/infrastructure/db/schema";
import { errorResponse } from "@/infrastructure/http";
import { faseVisible, idsDeRuta } from "../../../_fase";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; faseId: string; fileId: string }> },
) {
  try {
    const { id: idParam, faseId: faseIdParam, fileId: fileIdParam } = await params;
    const { projectId, faseId } = idsDeRuta(idParam, faseIdParam);
    const fileId = Number(fileIdParam);
    if (!Number.isInteger(fileId) || fileId <= 0) throw new NotFoundError();

    const actor = await requireActor();
    const scope = requireScope(actor, "construction_phases", "edit");

    await transaction(async (tx) => {
      const fase = await faseVisible(tx, actor, scope, projectId, faseId);
      if (!fase) throw new NotFoundError();

      const [anterior] = await tx
        .select()
        .from(files)
        .where(
          and(
            eq(files.id, fileId),
            eq(files.entityType, "construction_phase"),
            eq(files.entityId, faseId),
            isNull(files.deletedAt),
          ),
        )
        .limit(1);
      if (!anterior) throw new NotFoundError();

      const [fila] = await tx.update(files).set({ deletedAt: new Date() }).where(eq(files.id, fileId)).returning();

      await auditar(tx, actor, { accion: "eliminar", entidad: "file", entidadId: fileId, antes: anterior, despues: fila });
    });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
