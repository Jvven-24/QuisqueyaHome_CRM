/**
 * M13 · Academy — API de matrícula de usuarios del CRM en cursos de Moodle (por rol o por persona).
 */

import { z } from "zod";
import { matricularUsuariosAdminAcademy } from "@/application/academy/comandos";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { academyRepositorio, lmsAdaptador } from "@/infrastructure/contenedor/academy";
import { errorResponse, parseInput } from "@/infrastructure/http";

const matricularSchema = z.object({
  cursoId: z.number().int().positive("El curso de Moodle es obligatorio."),
  modo: z.enum(["rol", "persona"]),
  roleSlug: z.enum(["broker", "assistant", "admin"]).optional(),
  userIds: z.array(z.number().int().positive()).max(100).optional(),
  rolCurso: z.enum(["student", "editingteacher"]).optional(),
});

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "academy", "edit");

    const cuerpo = await request.json().catch(() => ({}));
    const parsed = parseInput(matricularSchema, cuerpo);
    const lms = lmsAdaptador();

    const resultado = await academyRepositorio().ejecutar((repo) =>
      matricularUsuariosAdminAcademy(repo, lms, actor, {
        cursoId: parsed.cursoId,
        modo: parsed.modo,
        roleSlug: parsed.roleSlug,
        userIds: parsed.userIds,
        rolCurso: parsed.rolCurso,
      }),
    );

    const progresoPersonas = await lms.listarProgresoCurso(parsed.cursoId);

    return Response.json({
      ok: true,
      matriculados: resultado.matriculados,
      usuarios: resultado.usuarios,
      progresoPersonas,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
