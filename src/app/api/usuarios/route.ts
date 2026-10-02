/** M13 · Usuarios — alta (`docs/R_ANALISIS_Y_PLAN.md` §7 R3.5; decisión #28). La fila se crea antes de invitar para no perder datos si falla el correo. */

import { z } from "zod";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { crearUsuario } from "@/application/usuarios/casos-de-uso";
import { usuariosParaEscritura } from "@/infrastructure/contenedor/usuarios";
import { errorResponse, parseInput } from "@/infrastructure/http";

const CrearUsuarioInput = z.object({
  fullName: z
    .string({ error: "Escribe el nombre completo." })
    .min(1, "Escribe el nombre completo."),
  email: z.email("Escribe un correo válido."),
  roleId: z.coerce.number().int().positive(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  specialty: z.string().optional(),
  handlesRentals: z.coerce.boolean().optional(),
  monthlyTargetDeals: z.coerce.number().int().nonnegative().optional(),
});

function limpiarVacios(cuerpo: unknown): unknown {
  if (typeof cuerpo !== "object" || cuerpo === null || Array.isArray(cuerpo)) return cuerpo;
  const copia: Record<string, unknown> = {};
  for (const [campo, valor] of Object.entries(cuerpo)) {
    if (!["jobTitle", "phone", "specialty", "monthlyTargetDeals"].includes(campo) || valor !== "") copia[campo] = valor;
  }
  return copia;
}

export async function POST(request: Request) {
  try {
    const datos = parseInput(CrearUsuarioInput, limpiarVacios(await request.json().catch(() => ({}))));
    const actor = await requireActor();
    // users no tiene responsable por fila: `own` alcanzaría la propia fila y
    // permitiría una escalada; requireFullScope exige `all`.
    requireFullScope(actor, "users", "create");
    const resultado = await crearUsuario(
      usuariosParaEscritura(),
      actor,
      {
        fullName: datos.fullName,
        email: datos.email,
        roleId: datos.roleId,
        jobTitle: datos.jobTitle,
        phone: datos.phone,
        specialty: datos.specialty,
        handlesRentals: datos.handlesRentals,
        monthlyTargetDeals: datos.monthlyTargetDeals,
      },
    );
    return Response.json({
      ok: true,
      usuario: resultado.usuario,
      invitado: resultado.invitado,
      motivoError: resultado.motivoError,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
