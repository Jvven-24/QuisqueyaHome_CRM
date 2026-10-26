/**
 * M10 / M13 · Academy — Consultas de lectura para componentes de servidor y rutas API.
 */

import type { Actor } from "../../domain/rbac.ts";
import type {
  CategoriaLms,
  CursoLms,
  EstadoLms,
  EvidenciaLms,
  ProgresoPersonaCursoLms,
  PuertoAprendizaje,
} from "../aprendizaje/puertos.ts";
import type {
  ConstanciaAcademy,
  ItemAcademy,
  PerfilActorAcademy,
  RepositorioAcademy,
  ResumenProgresoAcademy,
  SolicitudRevisionAcademy,
  UsuarioCrmAcademy,
} from "./puertos.ts";

export type CursoAsignadoBroker = CursoLms & {
  matriculado: boolean;
  evidencia: EvidenciaLms | null;
};

export async function consultarAcademy(
  repo: RepositorioAcademy,
  userId: number,
  categoria?: string,
): Promise<{ contenidos: ItemAcademy[]; resumen: ResumenProgresoAcademy }> {
  const [contenidos, resumen] = await Promise.all([
    repo.listarContenidos(userId, categoria),
    repo.obtenerResumenProgreso(userId),
  ]);
  return { contenidos, resumen };
}

export async function consultarContextoBrokerAcademy(
  repo: RepositorioAcademy,
  lms: PuertoAprendizaje,
  actor: Actor,
): Promise<{
  perfil: PerfilActorAcademy | null;
  contenidos: ItemAcademy[];
  resumen: ResumenProgresoAcademy;
  saludLms: EstadoLms;
  cursosAsignados: CursoAsignadoBroker[];
  solicitudes: SolicitudRevisionAcademy[];
  constancias: ConstanciaAcademy[];
}> {
  const filtroBroker = actor.roleSlug === "admin" ? undefined : actor.userId;

  const [perfil, datosContenidos, saludLms, cursosCatalogo, solicitudes, constancias] =
    await Promise.all([
      repo.obtenerPerfilActor(actor.userId),
      consultarAcademy(repo, actor.userId),
      lms.comprobarSalud(),
      lms.listarCursos(),
      repo.listarSolicitudesRevision(filtroBroker),
      repo.listarConstancias(filtroBroker),
    ]);

  const moodleUserId = perfil?.moodleUserId ?? null;
  const cursosUsuario =
    saludLms.disponible && moodleUserId
      ? await lms.listarCursosUsuario(moodleUserId)
      : [];

  const codigosMatriculados = new Set(cursosUsuario.map((c) => c.codigo));
  const baseCursos = cursosCatalogo.length > 0 ? cursosCatalogo : cursosUsuario;

  const cursosAsignados: CursoAsignadoBroker[] = [];
  for (const curso of baseCursos) {
    const evidencia = saludLms.disponible
      ? await lms.obtenerEvidencia(
          actor.userId,
          curso.id,
          moodleUserId ?? undefined,
        )
      : null;

    cursosAsignados.push({
      ...curso,
      matriculado:
        codigosMatriculados.has(curso.codigo) || Boolean(moodleUserId && evidencia),
      evidencia,
    });
  }

  return {
    perfil,
    contenidos: datosContenidos.contenidos,
    resumen: datosContenidos.resumen,
    saludLms,
    cursosAsignados,
    solicitudes,
    constancias,
  };
}

export async function consultarContextoAdminAcademy(
  repo: RepositorioAcademy,
  lms: PuertoAprendizaje,
  actorUserId: number,
  cursoIdSeleccionado?: number,
): Promise<{
  perfil: PerfilActorAcademy | null;
  saludLms: EstadoLms;
  categorias: CategoriaLms[];
  cursos: CursoLms[];
  cursoActivoId: number | null;
  progresoPersonas: ProgresoPersonaCursoLms[];
  usuariosCrm: UsuarioCrmAcademy[];
  solicitudes: SolicitudRevisionAcademy[];
  constancias: ConstanciaAcademy[];
}> {
  const [perfil, saludLms, categorias, cursos, usuariosCrm, solicitudes, constancias] =
    await Promise.all([
      repo.obtenerPerfilActor(actorUserId),
      lms.comprobarSalud(),
      lms.listarCategorias(),
      lms.listarCursos(),
      repo.listarUsuariosCrm(),
      repo.listarSolicitudesRevision(),
      repo.listarConstancias(),
    ]);

  const primerCursoId =
    typeof cursos[0]?.id === "number"
      ? cursos[0].id
      : cursos[0]?.id && /^\d+$/.test(String(cursos[0].id))
        ? Number(cursos[0].id)
        : null;

  const cursoActivoId = cursoIdSeleccionado ?? primerCursoId;
  const progresoPersonas =
    saludLms.disponible && cursoActivoId
      ? await lms.listarProgresoCurso(cursoActivoId)
      : [];

  return {
    perfil,
    saludLms,
    categorias,
    cursos,
    cursoActivoId,
    progresoPersonas,
    usuariosCrm,
    solicitudes,
    constancias,
  };
}
