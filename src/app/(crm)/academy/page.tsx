/**
 * M10 / M13 · Academy — Plataforma de Formación y Certificación de Brokers (UI-065).
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Conecta los cursos asignados, progreso y calificaciones reales
 * de Quisqueya Academy LMS (Moodle 4.5 LTS local) mediante MoodleAdaptador y
 * persiste las solicitudes de revisión y constancias en PostgreSQL.
 */

import { consultarContextoBrokerAcademy } from "@/application/academy/consultas";
import { requireActor } from "@/infrastructure/auth/actor";
import { academyRepositorio, lmsAdaptador } from "@/infrastructure/contenedor/academy";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { AcademyVista } from "./vista";

export const metadata = { title: "Academy · CRM Quisqueya Home" };

export default async function AcademyPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "academy", "view");

  const lms = lmsAdaptador();
  const datos = await academyRepositorio().ejecutar((repo) =>
    consultarContextoBrokerAcademy(repo, lms, actor),
  );

  const contenidosSerializados = datos.contenidos.map((item) => ({
    ...item,
    completedAt: item.completedAt ? item.completedAt.toISOString() : null,
  }));

  const cursosSerializados = datos.cursosAsignados.map((curso) => ({
    ...curso,
    evidencia: curso.evidencia
      ? {
          ...curso.evidencia,
          sincronizadoEn: curso.evidencia.sincronizadoEn.toISOString(),
        }
      : null,
  }));

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
    <AcademyVista
      initialContenidos={contenidosSerializados}
      initialResumen={datos.resumen}
      saludLms={datos.saludLms}
      cursosAsignados={cursosSerializados}
      initialSolicitudes={solicitudesSerializadas}
      initialConstancias={constanciasSerializadas}
      proyectosAsignados={datos.perfil?.proyectosAsignados ?? []}
      moodleUserId={datos.perfil?.moodleUserId ?? null}
      rol={actor.roleSlug}
      usuarioId={actor.userId}
      usuarioNombre={datos.perfil?.fullName || actor.roleSlug}
      usuarioEmail={datos.perfil?.email || ""}
    />
  );
}
