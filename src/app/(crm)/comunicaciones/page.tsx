/**
 * M11 · Comunicaciones — Centro de Mensajería Multicanal y Plantillas.
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. Sin permiso responde 403, no 500. El JSX visual vive en
 * `./vista.tsx` (cliente) conectado a plantillas de base de datos y canales.
 */

import { consultarComunicaciones } from "@/application/comunicaciones/consultas";
import { requireActor } from "@/infrastructure/auth/actor";
import { comunicacionesRepositorio } from "@/infrastructure/contenedor/comunicaciones";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { ComunicacionesVista } from "./vista";

export const metadata = { title: "Comunicaciones · CRM Quisqueya Home" };

export default async function ComunicacionesPage() {
  const actor = await requireActor();
  requireScopeInPage(actor, "communications", "view");

  const datos = await comunicacionesRepositorio().ejecutar(async (repo) => {
    return consultarComunicaciones(repo);
  });

  const plantillasSerializadas = datos.plantillas.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <ComunicacionesVista
      initialPlantillas={plantillasSerializadas}
      initialCanales={datos.canales}
    />
  );
}
