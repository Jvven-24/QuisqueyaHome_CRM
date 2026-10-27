import { notFound } from "next/navigation";
import { NotFoundError } from "@/domain/errors";
import { scopeFor } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { pipelineParaLectura } from "@/infrastructure/contenedor/pipeline";
import { consultarCatalogosNegocios, consultarFichaNegocio, consultarListaNegocios, consultarTableroNegocios, ORDEN_NEGOCIOS } from "@/application/pipeline/consultas";
import type { CursorNegocios, FiltrosNegocios, ListaNegocios, OrdenNegocios } from "@/application/pipeline/puertos";
import { Historial } from "../_ui/historial";
import { PipelineVista } from "./vista";

export const metadata = { title: "Negocios · CRM Quisqueya Home" };

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

/** Entero positivo de la URL; cualquier otra cosa se ignora en lugar de romper la página. */
function entero(valor: string | undefined): number | undefined {
  if (valor === undefined || !/^\d{1,10}$/.test(valor)) return undefined;
  const n = Number(valor);
  return Number.isSafeInteger(n) && n > 0 && n <= 2147483647 ? n : undefined;
}

const RESULTADOS = ["open", "won", "lost"] as const;
const CAMPOS_FECHA = ["createdAt", "closedAt", "expectedCloseDate"] as const;
const CAMPOS_ORDEN = ["createdAt", "amountCents", "id"] as const;

export default async function PipelinePage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  requireScopeInPage(actor, "deals", "view");
  const params = await searchParams;
  const repo = pipelineParaLectura();

  const vistaParam = primero(params.vista);
  const modo = vistaParam === "lista" ? "lista" : vistaParam === "analisis" ? "analisis" : "tablero";

  const filtros: FiltrosNegocios = {};
  for (const key of ["projectId", "brokerId"] as const) {
    const n = entero(primero(params[key]));
    if (n !== undefined) filtros[key] = n;
  }
  // El filtro por etapa solo existe en la Lista; en el Tablero cada etapa ya es una columna.
  const etapa = entero(primero(params.stageId));
  if (modo === "lista" && etapa !== undefined) filtros.stageId = etapa;
  for (const key of ["montoMin", "montoMax"] as const) {
    const texto = primero(params[key]);
    if (texto !== undefined && /^\d{1,15}$/.test(texto)) filtros[key] = Number(texto);
  }
  for (const key of ["desde", "hasta"] as const) {
    const texto = primero(params[key]);
    if (texto !== undefined && /^\d{4}-\d{2}-\d{2}$/.test(texto)) filtros[key] = texto;
  }
  const moneda = primero(params.moneda);
  if (moneda !== undefined && /^[A-Z]{3}$/.test(moneda)) filtros.moneda = moneda;
  const resultado = primero(params.resultado);
  if (RESULTADOS.includes(resultado as (typeof RESULTADOS)[number])) filtros.resultado = resultado as FiltrosNegocios["resultado"];
  const campoFecha = primero(params.campoFecha);
  if (CAMPOS_FECHA.includes(campoFecha as (typeof CAMPOS_FECHA)[number])) filtros.campoFecha = campoFecha as FiltrosNegocios["campoFecha"];

  const campoOrden = primero(params.orden);
  const direccion = primero(params.direccion);
  const orden: OrdenNegocios = {
    campo: CAMPOS_ORDEN.includes(campoOrden as (typeof CAMPOS_ORDEN)[number]) ? (campoOrden as OrdenNegocios["campo"]) : ORDEN_NEGOCIOS.campo,
    direccion: direccion === "asc" || direccion === "desc" ? direccion : ORDEN_NEGOCIOS.direccion,
  };

  // Un cursor ilegible vuelve a la primera página en lugar de romper la vista.
  let cursor: CursorNegocios | null = null;
  const textoCursor = primero(params.cursor);
  if (textoCursor) {
    try { cursor = JSON.parse(textoCursor) as CursorNegocios; } catch { cursor = null; }
  }

  let ficha = null;
  const dealParam = primero(params.deal);
  if (dealParam !== undefined) {
    const dealId = entero(dealParam);
    if (dealId === undefined) notFound();
    try { ficha = await consultarFichaNegocio(repo, actor, dealId); }
    catch (error) { if (error instanceof NotFoundError) notFound(); throw error; }
  }

  // Asistente: sin cifras de rendimiento de negocios (docs/DESIGN.md, «Reglas por rol»).
  // Ni siquiera se consulta: no viajan datos que la vista luego tendría que ocultar.
  const puedeVerAnalisis = actor.roleSlug !== "assistant";
  const sinAnalisis = modo === "analisis" && !puedeVerAnalisis;
  const sinDatos: ListaNegocios = { filas: [], siguiente: null, resumen: [] };

  const [lista, catalogos] = await Promise.all([
    sinAnalisis ? Promise.resolve(sinDatos)
      : modo === "lista" ? consultarListaNegocios(repo, actor, filtros, orden, cursor)
      : consultarTableroNegocios(repo, actor, filtros, cursor),
    consultarCatalogosNegocios(repo, actor),
  ]);

  return <PipelineVista negocios={lista.filas} etapas={catalogos.etapas} motivos={catalogos.motivos}
    resumen={lista.resumen} siguiente={lista.siguiente} modo={modo} catalogos={catalogos}
    negocioSeleccionado={ficha?.negocio ?? null} propiedades={ficha?.propiedades ?? []}
    proyectosDisponibles={ficha?.proyectosDisponibles ?? []}
    historial={ficha ? <>
      <h3>Historial de etapas</h3>
      {ficha.historialEtapas?.length ? <ol className="space-y-3">{ficha.historialEtapas.map(h => <li key={h.id}>
        <strong>{h.desde ?? "Inicio"} → {h.hasta}</strong><br />
        <span>{h.autor ?? "Usuario no disponible"} · {new Intl.DateTimeFormat("es-DO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Santo_Domingo" }).format(h.fecha)}</span>
      </li>)}</ol> : <p>No hay cambios de etapa registrados.</p>}
      {actor.roleSlug === "admin" && <Historial entidad="deal" entidadId={ficha.negocio.id} />}
    </> : null}
    rol={actor.roleSlug}
    puedeEditarNegocios={scopeFor(actor, "deals", "edit") !== "none"}
    puedeVerLeads={scopeFor(actor, "leads", "view") !== "none"}
    puedeExportar={scopeFor(actor, "deals", "export") !== "none"}
    puedeVerAnalisis={puedeVerAnalisis} />;
}
