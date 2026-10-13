import { notFound } from "next/navigation";
import { NotFoundError, ValidationError } from "@/domain/errors";
import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { pipelineParaLectura } from "@/infrastructure/contenedor/pipeline";
import { consultarCatalogosNegocios, consultarFichaNegocio, consultarListaNegocios, consultarTableroNegocios, ORDEN_NEGOCIOS } from "@/application/pipeline/consultas";
import type { CursorNegocios, FiltrosNegocios, OrdenNegocios } from "@/application/pipeline/puertos";
import { Historial } from "../_ui/historial";
import { PipelineVista } from "./vista";

export const metadata = { title: "Negocios · CRM Quisqueya Home" };
function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}
export default async function PipelinePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  requireScopeInPage(actor, "deals", "view");
  const params = await searchParams;
  const repo = pipelineParaLectura();
  const filtros: FiltrosNegocios = {};
  for (const key of ["projectId", "brokerId", "stageId", "montoMin", "montoMax"] as const) {
    if (primero(params[key]) !== undefined) filtros[key] = Number(primero(params[key]));
  }
  for (const key of ["desde", "hasta", "moneda"] as const) {
    if (primero(params[key]) !== undefined) filtros[key] = primero(params[key]);
  }
  if (primero(params.resultado) !== undefined) filtros.resultado = primero(params.resultado) as FiltrosNegocios["resultado"];
  if (primero(params.campoFecha) !== undefined) filtros.campoFecha = primero(params.campoFecha) as FiltrosNegocios["campoFecha"];
  const orden: OrdenNegocios = { campo: (primero(params.orden) ?? ORDEN_NEGOCIOS.campo) as OrdenNegocios["campo"],
    direccion: (primero(params.direccion) ?? ORDEN_NEGOCIOS.direccion) as OrdenNegocios["direccion"] };
  let cursor: CursorNegocios | null = null;
  try { if (primero(params.cursor)) cursor = JSON.parse(primero(params.cursor)!); }
  catch { throw new ValidationError("Cursor de negocios inválido."); }
  let ficha = null;
  if (primero(params.deal) !== undefined) {
    try { ficha = await consultarFichaNegocio(repo, actor, Number(primero(params.deal))); }
    catch (error) { if (error instanceof NotFoundError) notFound(); throw error; }
  }
  const modo = primero(params.vista) === "lista" ? "lista" : "kanban";
  const [lista, catalogos] = await Promise.all([
    modo === "lista" ? consultarListaNegocios(repo, actor, filtros, orden, cursor)
      : consultarTableroNegocios(repo, actor, filtros, cursor),
    consultarCatalogosNegocios(repo, actor),
  ]);
  return <PipelineVista negocios={lista.filas} etapas={catalogos.etapas} motivos={catalogos.motivos}
    resumen={lista.resumen} siguiente={lista.siguiente} modo={modo} catalogos={catalogos}
    negocioSeleccionado={ficha?.negocio ?? null} propiedades={ficha?.propiedades ?? []}
    proyectosDisponibles={ficha?.proyectosDisponibles ?? []}
    historial={ficha && actor.roleSlug === "admin" ? <Historial entidad="deal" entidadId={ficha.negocio.id} /> : null} />;
}
