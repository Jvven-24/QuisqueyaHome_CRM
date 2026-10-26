/**
 * M13 · Academy — API de gestión de cursos en Moodle LMS (creación y progreso por persona).
 */

import { z } from "zod";
import { crearCursoAdminAcademy } from "@/application/academy/comandos";
import { requireFullScope, requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { lmsAdaptador } from "@/infrastructure/contenedor/academy";
import { errorResponse, parseInput } from "@/infrastructure/http";

const crearCursoSchema = z.object({
  nombre: z.string().trim().min(4, "El nombre del curso debe tener al menos 4 caracteres.").max(200),
  codigo: z
    .string()
    .trim()
    .min(3, "El código corto debe tener al menos 3 caracteres.")
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "El código solo admite letras, números, guion y guion bajo."),
  resumen: z.string().trim().min(10, "El resumen debe tener al menos 10 caracteres.").max(4000),
  categoriaId: z.number().int().positive().optional(),
  categoriaNombre: z.string().trim().max(150).optional(),
  notaMinima: z.number().min(1).max(100).default(80),
});

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "academy", "view");

    const url = new URL(request.url);
    const cursoIdParam = url.searchParams.get("cursoId");
    const lms = lmsAdaptador();

    const [saludLms, categorias, cursos] = await Promise.all([
      lms.comprobarSalud(),
      lms.listarCategorias(),
      lms.listarCursos(),
    ]);

    if (cursoIdParam) {
      requireFullScope(actor, "academy", "view");
      const cursoId = Number(cursoIdParam);
      const progresoPersonas =
        Number.isInteger(cursoId) && cursoId > 0
          ? await lms.listarProgresoCurso(cursoId)
          : [];
      return Response.json({
        ok: true,
        saludLms,
        categorias,
        cursos,
        progresoPersonas,
      });
    }

    return Response.json({
      ok: true,
      saludLms,
      categorias,
      cursos,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    requireFullScope(actor, "academy", "edit");

    const cuerpo = await request.json().catch(() => ({}));
    const parsed = parseInput(crearCursoSchema, cuerpo);
    const curso = await crearCursoAdminAcademy(lmsAdaptador(), actor, {
      nombre: parsed.nombre,
      codigo: parsed.codigo,
      resumen: parsed.resumen,
      categoriaId: parsed.categoriaId,
      categoriaNombre: parsed.categoriaNombre,
      notaMinima: parsed.notaMinima,
    });

    return Response.json({ ok: true, curso }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
