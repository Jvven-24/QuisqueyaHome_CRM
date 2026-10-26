/**
 * R3.4: borrado lógico de foto; la fila se audita dentro de la transacción.
 * Se conserva el comportamiento original: no se borra el objeto de Storage.
 */
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { borrarFoto } from "@/application/proyectos/casos-de-uso";
import { proyectosParaEscritura } from "@/infrastructure/contenedor/proyectos";
import { errorResponse, idsDeRuta } from "@/infrastructure/http";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; faseId: string; fileId: string }> },
) {
  try {
    const valores = await params;
    const [projectId, faseId] = idsDeRuta(valores.id, valores.faseId);
    const fileId = Number(valores.fileId);
    if (!Number.isInteger(fileId) || fileId <= 0) throw new NotFoundError();
    const actor = await requireActor();
    const alcance = requireScope(actor, "construction_phases", "edit");
    await borrarFoto(
      proyectosParaEscritura(),
      actor,
      alcance,
      projectId,
      faseId,
      fileId,
    );
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

