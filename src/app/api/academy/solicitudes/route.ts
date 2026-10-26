/**
 * M13 · Academy — API de solicitudes de revisión de completado y constancias.
 */

import { z } from "zod";
import { solicitarRevisionCursoAcademy } from "@/application/academy/comandos";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { academyRepositorio, lmsAdaptador } from "@/infrastructure/contenedor/academy";
import { errorResponse, parseInput } from "@/infrastructure/http";

const solicitarRevisionSchema = z.object({
  courseCode: z.string().trim().min(2, "El código del curso es obligatorio.").max(80),
  brokerId: z.number().int().positive().optional(),
});

export async function GET() {
  try {
    const actor = await requireActor();
    const scope = requireScope(actor, "academy", "view");
    const filtroBroker = scope === "all" ? undefined : actor.userId;

    const { solicitudes, constancias } = await academyRepositorio().ejecutar(async (repo) => {
      const [sols, certs] = await Promise.all([
        repo.listarSolicitudesRevision(filtroBroker),
        repo.listarConstancias(filtroBroker),
      ]);
      return { solicitudes: sols, constancias: certs };
    });

    return Response.json({
      ok: true,
      solicitudes,
      constancias,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "academy", "view");

    const cuerpo = await request.json().catch(() => ({}));
    const parsed = parseInput(solicitarRevisionSchema, cuerpo);
    const lms = lmsAdaptador();

    const solicitud = await academyRepositorio().ejecutar((repo) =>
      solicitarRevisionCursoAcademy(repo, lms, actor, {
        courseCode: parsed.courseCode,
        brokerId: parsed.brokerId,
      }),
    );

    return Response.json({ ok: true, solicitud }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
