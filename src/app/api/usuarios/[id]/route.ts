/**
 * M13 · Usuarios — edición y borrado (`docs/R_ANALISIS_Y_PLAN.md` §7 R3.5).
 * Sin `visibleRows`: users no tiene responsable por fila, así que se exige
 * alcance `all`; con `own`, un usuario podría cambiarse el rol a sí mismo.
 */

import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { borrarUsuario, editarUsuario } from "@/application/usuarios/casos-de-uso";
import { usuariosParaEscritura } from "@/infrastructure/contenedor/usuarios";
import { errorResponse, parseInput, vaciosANull } from "@/infrastructure/http";

const EditarUsuarioInput = z.object({
  fullName: z.string().min(1, "Escribe el nombre completo.").optional(),
  roleId: z.coerce.number().int().positive().optional(),
  jobTitle: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  specialty: z.string().nullable().optional(),
  handlesRentals: z.boolean().optional(),
  monthlyTargetDeals: z.coerce.number().int().nonnegative().optional(),
});

async function idDe(params: Promise<{ id: string }>): Promise<number> {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();
  return id;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = await idDe(params);
    const datos = parseInput(
      EditarUsuarioInput,
      vaciosANull(
        await request.json().catch(() => ({})),
        ["jobTitle", "phone", "specialty"],
      ),
    );
    const actor = await requireActor();
    // Con `own` el actor alcanzaría su propia fila y podría cambiarse el rol.
    // Con `own` el actor alcanzaría su propia fila y podría cambiarse el rol.
    requireFullScope(actor, "users", "edit");
    const usuario = await editarUsuario(
      usuariosParaEscritura(),
      actor,
      "all",
      id,
      {
        fullName: datos.fullName,
        roleId: datos.roleId,
        jobTitle: datos.jobTitle,
        phone: datos.phone,
        isActive: datos.isActive,
        specialty: datos.specialty,
        handlesRentals: datos.handlesRentals,
        monthlyTargetDeals: datos.monthlyTargetDeals,
      },
    );
    return Response.json({
      ok: true,
      usuario,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const id = await idDe(params);
    const actor = await requireActor();
    // Con `own` el actor alcanzaría su propia fila y podría borrarse o alterar
    // el perímetro administrativo; la ruta exige alcance total.
    // Con `own` el actor alcanzaría su propia fila y podría borrarse o alterar
    // el perímetro administrativo; la ruta exige alcance total.
    requireFullScope(actor, "users", "delete");
    await borrarUsuario(usuariosParaEscritura(), actor, "all", id);
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
