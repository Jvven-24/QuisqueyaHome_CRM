/**
 * R3.4: multipart validado; Storage queda fuera de Postgres y se compensa.
 * El caso de uso valida todos los archivos antes de subir cualquiera.
 */
import { ValidationError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { proyectosParaEscritura } from "@/infrastructure/contenedor/proyectos";
import { errorResponse, idsDeRuta } from "@/infrastructure/http";
import { subirFotos } from "@/application/proyectos/casos-de-uso";

const MAXIMO = 25 * 1024 * 1024;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; faseId: string }> },
) {
  try {
    const [projectId, faseId] = idsDeRuta(
      (await params).id,
      (await params).faseId,
    );
    const actor = await requireActor();
    const alcance = requireScope(actor, "construction_phases", "edit");
    if (Number(request.headers.get("content-length") ?? "0") > MAXIMO) {
      return Response.json(
        { error: "El total de las fotos no puede superar 25 MB por subida." },
        { status: 413 },
      );
    }
    const formData = await request.formData();
    const archivos = formData
      .getAll("foto")
      .filter((valor): valor is File => valor instanceof File && valor.size > 0);
    if (archivos.length === 0) {
      throw new ValidationError(
        "Selecciona al menos una foto.",
        { foto: "Selecciona al menos una foto." },
      );
    }
    const deps = proyectosParaEscritura();
    const fotos = await subirFotos(deps, actor, alcance, {
      projectId,
      faseId,
      actorId: actor.userId,
      archivos: archivos.map((archivo) => ({
        contenido: archivo,
        tipoMime: archivo.type,
        nombreVisible: archivo.name,
        sizeBytes: archivo.size,
      })),
    });
    return Response.json({ ok: true, fotos });
  } catch (error) {
    return errorResponse(error);
  }
}

