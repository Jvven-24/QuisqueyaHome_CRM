/**
 * R3.4: alta de fases; el caso de uso compone auditoría y recálculo.
 * Referencias: `src/application/README.md` §4 y `docs/R_ANALISIS_Y_PLAN.md` §7.
 */
import { z } from "zod";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { proyectosParaEscritura } from "@/infrastructure/contenedor/proyectos";
import { errorResponse, idsDeRuta, parseInput } from "@/infrastructure/http";
import { crearFases } from "@/application/proyectos/casos-de-uso";

const Entrada = z.union([
  z.object({ plantilla: z.literal(true) }),
  z.object({
    title: z.string({ error: "Escribe el título de la fase." })
      .min(1, "Escribe el título de la fase."),
  }),
]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const [projectId] = idsDeRuta((await params).id);
    const datos = parseInput(Entrada, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const alcance = requireScope(actor, "construction_phases", "create");
    const fases = await crearFases(
      proyectosParaEscritura(),
      actor,
      alcance,
      projectId,
      "plantilla" in datos,
      "title" in datos ? datos.title : undefined,
    );
    return Response.json({ ok: true, fases });
  } catch (error) {
    return errorResponse(error);
  }
}

