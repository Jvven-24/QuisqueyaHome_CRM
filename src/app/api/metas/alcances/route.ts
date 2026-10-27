/**
 * M8 · Metas por proyecto o equipo. PUT fija/edita el objetivo del periodo;
 * DELETE la elimina. Solo `goals:edit` con alcance `all` (Administrador).
 */
import { EliminarMetaAlcanceInput, FijarMetaAlcanceInput } from "@/application/metas/alcances-validacion";
import { eliminarMetaAlcance, fijarMetaAlcance } from "@/application/metas/alcances";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { metasAlcanceParaEscritura } from "@/infrastructure/contenedor/metas-alcances";
import { errorResponse, parseInput } from "@/infrastructure/http";

export async function PUT(request: Request) {
  try {
    const datos = parseInput(FijarMetaAlcanceInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "goals", "edit");
    const meta = await fijarMetaAlcance(metasAlcanceParaEscritura(), actor, scope, {
      scopeType: datos.scopeType,
      scopeId: datos.scopeId,
      year: datos.year,
      month: datos.month,
      targetDeals: datos.targetDeals,
      targetAmountCents: datos.targetAmountCents ?? null,
      currency: datos.currency,
    });
    return Response.json({ ok: true, meta });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const datos = parseInput(EliminarMetaAlcanceInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    const scope = requireScope(actor, "goals", "edit");
    await eliminarMetaAlcance(metasAlcanceParaEscritura(), actor, scope, { id: datos.id });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
