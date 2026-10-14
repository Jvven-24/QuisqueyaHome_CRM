/**
 * M10 · Academy — Plataforma de Formación y Certificación de Brokers.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Conecta los contenidos formativos y checklists con la instancia
 * de Quisqueya Academy LMS (Moodle 4.5 LTS local) mediante MoodleAdaptador.
 */

import { consultarAcademy } from "@/application/academy/consultas";
import { requireActor } from "@/infrastructure/auth/actor";
import { academyRepositorio, lmsAdaptador } from "@/infrastructure/contenedor/academy";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { AcademyVista } from "./vista";

export const metadata = { title: "Academy · CRM Quisqueya Home" };

export default async function AcademyPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "academy", "view");

  const lms = lmsAdaptador();

  const [datos, saludLms, cursosLms] = await Promise.all([
    academyRepositorio().ejecutar(async (repo) => consultarAcademy(repo, actor.userId)),
    lms.comprobarSalud(),
    lms.listarCursos(),
  ]);

  // Serializar fechas para el cliente
  const contenidosSerializados = datos.contenidos.map((item) => ({
    ...item,
    completedAt: item.completedAt ? item.completedAt.toISOString() : null,
  }));

  return (
    <AcademyVista
      initialContenidos={contenidosSerializados}
      initialResumen={datos.resumen}
      saludLms={saludLms}
      cursosLms={cursosLms}
      rol={actor.roleSlug}
      usuarioId={actor.userId}
      usuarioNombre={actor.roleSlug === "admin" ? "Administrador de Operaciones" : "Asesor Comercial Quisqueya"}
    />
  );
}
