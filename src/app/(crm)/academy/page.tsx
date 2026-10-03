/**
 * M10 · Academy — Plataforma de Formación y Certificación de Brokers.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Sin permiso responde 403, no 500. El JSX visual vive en
 * `./vista.tsx` (cliente) conectado a datos reales de base de datos.
 */

import { consultarAcademy } from "@/application/academy/consultas";
import { requireActor } from "@/infrastructure/auth/actor";
import { academyRepositorio } from "@/infrastructure/contenedor/academy";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { AcademyVista } from "./vista";

export const metadata = { title: "Academy · CRM Quisqueya Home" };

export default async function AcademyPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "academy", "view");

  const datos = await academyRepositorio().ejecutar(async (repo) => {
    return consultarAcademy(repo, actor.userId);
  });

  // Serializar fechas para el cliente
  const contenidosSerializados = datos.contenidos.map((item) => ({
    ...item,
    completedAt: item.completedAt ? item.completedAt.toISOString() : null,
  }));

  return (
    <AcademyVista
      initialContenidos={contenidosSerializados}
      initialResumen={datos.resumen}
    />
  );
}
