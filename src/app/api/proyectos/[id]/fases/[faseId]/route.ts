/**
 * R3.4: edición y borrado de fase, incluido el recálculo de avance.
 * La regla del promedio vive en `domain/avance-obra.ts`, no en la ruta.
 */
import { z } from "zod";
import { PHASE_STATUSES } from "@/domain/catalogs";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { proyectosParaEscritura } from "@/infrastructure/contenedor/proyectos";
import { errorResponse, idsDeRuta, parseInput, vaciosANull } from "@/infrastructure/http";
import { borrarFase, editarFase } from "@/application/proyectos/casos-de-uso";

const Entrada = z.object({
  title: z.string().min(1, "Escribe el título de la fase.").optional(),
  period: z.string().nullable().optional(),
  status: z.enum(PHASE_STATUSES).optional(),
  progressPercent: z.coerce.number().int().min(0).max(100).optional(),
  statusDate: z.union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escribe la fecha en formato AAAA-MM-DD."),
    z.null(),
  ]).optional(),
  videoUrl: z.union([
    z.url({ protocol: /^https?$/, error: "Escribe una URL de video válida (http o https)." }),
    z.null(),
  ]).optional(),
  publicNote: z.string().nullable().optional(),
  responsibleId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  isPublished: z.boolean().optional(),
});

function cambios(datos: z.infer<typeof Entrada>, actorId: number) {
  const salida: import("@/application/proyectos/puertos").CambiosFase = {
    updatedBy: actorId,
  };
  if ("title" in datos) salida.title = datos.title;
  if ("period" in datos) salida.period = datos.period;
  if ("status" in datos) salida.status = datos.status;
  if ("progressPercent" in datos) salida.progressPercent = datos.progressPercent;
  if ("statusDate" in datos) salida.statusDate = datos.statusDate;
  if ("videoUrl" in datos) salida.videoUrl = datos.videoUrl;
  if ("publicNote" in datos) salida.publicNote = datos.publicNote;
  if ("responsibleId" in datos) salida.responsibleId = datos.responsibleId;
  if ("isPublished" in datos) {
    salida.isPublished = datos.isPublished;
    salida.publishedAt = datos.isPublished ? new Date() : null;
  }
  return salida;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; faseId: string }> },
) {
  try {
    const [projectId, faseId] = idsDeRuta(
      (await params).id,
      (await params).faseId,
    );
    const datos = parseInput(
      Entrada,
      vaciosANull(
        await request.json().catch(() => ({})),
        ["period", "statusDate", "videoUrl", "publicNote", "responsibleId"],
      ),
    );
    const actor = await requireActor();
    const alcance = requireScope(actor, "construction_phases", "edit");
    const fase = await editarFase(
      proyectosParaEscritura(),
      actor,
      alcance,
      projectId,
      faseId,
      cambios(datos, actor.userId),
    );
    return Response.json({ ok: true, fase });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; faseId: string }> },
) {
  try {
    const [projectId, faseId] = idsDeRuta(
      (await params).id,
      (await params).faseId,
    );
    const actor = await requireActor();
    const alcance = requireScope(actor, "construction_phases", "delete");
    await borrarFase(proyectosParaEscritura(), actor, alcance, projectId, faseId);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

