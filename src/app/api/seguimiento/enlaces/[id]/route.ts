/** Activar o desactivar un enlace de seguimiento (los clics y leads ya atribuidos se conservan). */
import { z } from "zod";
import { requireFullScope } from "@/domain/rbac";
import { NotFoundError } from "@/domain/errors";
import { requireActor } from "@/infrastructure/auth/actor";
import { seguimientoParaLectura } from "@/infrastructure/contenedor/seguimiento";
import { errorResponse, idsDeRuta, parseInput } from "@/infrastructure/http";
import { leerJsonLimitado } from "@/infrastructure/limites";

const Cuerpo = z.object({ isActive: z.boolean({ error: "Indica si el enlace queda activo." }) });

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "integrations", "edit");
    const [id] = idsDeRuta((await ctx.params).id);
    const cuerpo = await leerJsonLimitado(request, 2 * 1024);
    if (cuerpo instanceof Response) return cuerpo;
    const { isActive } = parseInput(Cuerpo, cuerpo);
    if (!(await seguimientoParaLectura().cambiarActivo(id, isActive))) throw new NotFoundError("Enlace no encontrado.");
    return Response.json({ ok: true, id, isActive });
  } catch (error) {
    return errorResponse(error);
  }
}
