/**
 * M13 · Academy — Administración de Cursos, Matrículas y Certificaciones (UI-066).
 *
 * Permite al Administrador:
 * - Abrir «Crear curso» y «Editar curso» en Moodle LMS y listar los cursos reales de Moodle.
 * - Matricular usuarios del CRM en Moodle por rol o por persona (`enrol_manual_enrol_users`, sincronizando `external_refs`).
 * - Consultar el estado de finalización y progreso por persona (`core_completion_get_course_completion_status`).
 * - Aprobar, rechazar o revocar solicitudes de constancia bajo la regla Q-C1-03.
 */

import { consultarContextoAdminAcademy } from "@/application/academy/consultas";
import { can } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { academyRepositorio, lmsAdaptador } from "@/infrastructure/contenedor/academy";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { AcademyAdministracionVista } from "./vista";

export const metadata = {
  title: "Administración Academy · CRM Quisqueya Home",
};

export default async function AcademyAdministracionPage({
  searchParams,
}: {
  searchParams?: Promise<{ cursoId?: string }>;
}) {
  const actor = await requireActor();
  requireScopeInPage(actor, "academy", "view");

  const tienePermisoAdmin = actor.roleSlug === "admin" && can(actor, "academy", "edit");
  const params = searchParams ? await searchParams : {};
  const cursoIdParam =
    params?.cursoId && /^\d+$/.test(params.cursoId) ? Number(params.cursoId) : undefined;

  if (!tienePermisoAdmin) {
    const perfil = await academyRepositorio().ejecutar((repo) =>
      repo.obtenerPerfilActor(actor.userId),
    );
    return (
      <AcademyAdministracionVista
        tienePermisoAdmin={false}
        usuarioId={actor.userId}
        usuarioNombre={perfil?.fullName || actor.roleSlug}
        rol={actor.roleSlug}
        saludLms={{
          disponible: false,
          url: "http://127.0.0.1:9330",
          version: "Restringido",
        }}
        initialCategorias={[]}
        initialCursos={[]}
        initialCursoActivoId={null}
        initialProgresoPersonas={[]}
        initialUsuariosCrm={[]}
        initialSolicitudes={[]}
        initialConstancias={[]}
      />
    );
  }

  const lms = lmsAdaptador();
  const datos = await academyRepositorio().ejecutar((repo) =>
    consultarContextoAdminAcademy(repo, lms, actor.userId, cursoIdParam),
  );

  const solicitudesSerializadas = datos.solicitudes.map((sol) => ({
    ...sol,
    decidedAt: sol.decidedAt ? sol.decidedAt.toISOString() : null,
    createdAt: sol.createdAt.toISOString(),
  }));

  const constanciasSerializadas = datos.constancias.map((cert) => ({
    ...cert,
    revokedAt: cert.revokedAt ? cert.revokedAt.toISOString() : null,
    issuedAt: cert.issuedAt.toISOString(),
  }));

  return (
    <AcademyAdministracionVista
      tienePermisoAdmin={true}
      usuarioId={actor.userId}
      usuarioNombre={datos.perfil?.fullName || "Administrador"}
      rol={actor.roleSlug}
      saludLms={datos.saludLms}
      initialCategorias={datos.categorias}
      initialCursos={datos.cursos}
      initialCursoActivoId={datos.cursoActivoId}
      initialProgresoPersonas={datos.progresoPersonas}
      initialUsuariosCrm={datos.usuariosCrm}
      initialSolicitudes={solicitudesSerializadas}
      initialConstancias={constanciasSerializadas}
    />
  );
}
