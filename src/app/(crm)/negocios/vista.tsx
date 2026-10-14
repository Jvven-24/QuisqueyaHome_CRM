"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertCircle, BarChart3, Check, Kanban as KanbanIcon, List as ListIcon, WifiOff, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CatalogosNegocios, CursorNegocios, ResumenEtapaNegocio } from "@/application/pipeline/puertos";
import { formatearMonto } from "../_ui/formato";
import { PageHeader } from "../_ui/prototipo-ui";
import { AvisoPermiso, SinResultados, Vacio } from "../_ui/estados";
import { AnalisisNegocios } from "./analisis";
import { enviarJson } from "./api";
import { DialogoCierre, DialogoPerdida, type DatosCierre, type ResultadoEnvio } from "./dialogos";
import { BarraFiltros, type ClaveFiltro } from "./filtros";
import { DealInspector } from "./inspector";
import { ListaNegocios } from "./lista";
import {
  armarColumnas,
  estadoContenido,
  siguienteOrden,
  totalNegocios,
  valorActivoPorDivisa,
  type CampoOrden,
  type Etapa,
  type MotivoPerdida,
  type NegocioFila,
  type PropiedadDeal,
  type ProyectoOpcion,
} from "./logica";
import { Tablero } from "./tablero";
import { useEnLinea, useMediaQuery } from "./usar-entorno";

export type { Etapa, MotivoPerdida, NegocioFila, PropiedadDeal, ProyectoOpcion } from "./logica";

type Modo = "tablero" | "lista" | "analisis";
type Aviso = { tipo: "exito" | "error"; texto: string };

export function PipelineVista({
  negocios,
  etapas,
  motivos,
  negocioSeleccionado,
  propiedades,
  proyectosDisponibles,
  historial,
  resumen,
  siguiente,
  modo,
  catalogos,
  rol,
  puedeVerLeads,
  puedeVerAnalisis,
}: {
  negocios: NegocioFila[];
  etapas: Etapa[];
  motivos: MotivoPerdida[];
  negocioSeleccionado: NegocioFila | null;
  propiedades: PropiedadDeal[];
  proyectosDisponibles: ProyectoOpcion[];
  historial: ReactNode;
  resumen: ResumenEtapaNegocio[];
  siguiente: CursorNegocios | null;
  modo: Modo;
  catalogos: CatalogosNegocios;
  rol?: string;
  puedeVerLeads: boolean;
  puedeVerAnalisis: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendiente, iniciarTransicion] = useTransition();

  const esMovil = useMediaQuery("(max-width: 767px)");
  const fichaModal = useMediaQuery("(max-width: 1250px)");
  const enLinea = useEnLinea();
  const sinConexion = !enLinea;

  const [ocupado, setOcupado] = useState(false);
  const enCurso = useRef(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [perdida, setPerdida] = useState<{ negocio: NegocioFila; etapaId: number } | null>(null);

  useEffect(() => {
    if (aviso?.tipo !== "exito") return;
    const temporizador = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const valores = {
    resultado: searchParams.get("resultado") ?? "",
    brokerId: searchParams.get("brokerId") ?? "",
    projectId: searchParams.get("projectId") ?? "",
    stageId: modo === "lista" ? (searchParams.get("stageId") ?? "") : "",
  };
  const hayFiltros = Boolean(valores.resultado || valores.brokerId || valores.projectId || valores.stageId);
  const orden = {
    campo: searchParams.get("orden") ?? "createdAt",
    direccion: searchParams.get("direccion") ?? "desc",
  };
  const hayCursor = searchParams.has("cursor");

  const etapaPorId = useMemo(() => new Map(etapas.map((e) => [e.id, e])), [etapas]);
  const columnas = useMemo(() => armarColumnas(etapas, negocios, resumen), [etapas, negocios, resumen]);
  const total = totalNegocios(resumen);
  const valorActivo = valorActivoPorDivisa(resumen);
  const veMontos = resumen.some((r) => r.amountCents !== undefined) || negocios.some((n) => n.amountCents !== undefined);
  const puedeEditar = rol !== "assistant";

  /* ------------------------------ navegación ------------------------------ */

  function navegar(cambios: Record<string, string | undefined>, conservarCursor = false) {
    const params = new URLSearchParams(searchParams.toString());
    if (!conservarCursor) params.delete("cursor");
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    const consulta = params.toString();
    iniciarTransicion(() => router.push(consulta ? `${pathname}?${consulta}` : pathname));
  }

  function cambiarModo(valor: string) {
    navegar({ vista: valor === "tablero" ? undefined : valor, deal: undefined, cerrar: undefined, orden: undefined, direccion: undefined, stageId: undefined });
  }
  function filtrar(clave: ClaveFiltro, valor: string) {
    navegar({ [clave]: valor || undefined });
  }
  function limpiarFiltros() {
    navegar({ resultado: undefined, brokerId: undefined, projectId: undefined, stageId: undefined });
  }
  function ordenar(campo: CampoOrden, direccion?: "asc" | "desc") {
    const nuevo = direccion ? { campo, direccion } : siguienteOrden(orden, campo);
    navegar({ orden: nuevo.campo, direccion: nuevo.direccion });
  }

  /* ------------------------------- mutaciones ------------------------------- */

  async function cambiarEtapa(
    negocio: NegocioFila,
    stageId: number,
    extra: { lossReasonId?: number; lossComment?: string; amountCents?: number; unitId?: number; unitCode?: string } = {},
  ): Promise<ResultadoEnvio> {
    if (enCurso.current) return { ok: false, error: "Ya hay un cambio en curso. Espera a que termine." };
    enCurso.current = true;
    setOcupado(true);
    const respuesta = await enviarJson(`${negocio.id}/etapa`, "PATCH", { stageId, ...extra });
    enCurso.current = false;
    setOcupado(false);
    if (!respuesta.ok) {
      setAviso(perdida || cierreSolicitado ? null : { tipo: "error", texto: respuesta.error });
      return respuesta;
    }
    const destino = etapaPorId.get(stageId);
    const alquiler = negocio.operationType === "rent";
    setAviso({
      tipo: "exito",
      texto:
        destino?.kind === "lost" ? "Negocio no concretado, archivado. El contacto sigue disponible para volver a contactarlo."
        : destino?.kind === "won" ? (alquiler ? "Alquiler cerrado: la unidad quedó reservada." : "Venta cerrada: la unidad quedó vendida.")
        : `Negocio movido a ${destino?.name ?? "la nueva etapa"}.`,
    });
    router.refresh();
    return { ok: true };
  }

  function solicitarMover(negocio: NegocioFila, etapaId: number) {
    const destino = etapaPorId.get(etapaId);
    if (!destino || destino.id === negocio.stageId || negocio.stageKind !== "open" || !puedeEditar) return;
    if (sinConexion) {
      setAviso({ tipo: "error", texto: "Sin conexión a internet. No se movió nada; vuelve a intentarlo cuando regrese la conexión." });
      return;
    }
    setAviso(null);
    if (destino.kind === "lost") { setPerdida({ negocio, etapaId }); return; }
    if (destino.kind === "won") { navegar({ deal: String(negocio.id), cerrar: String(etapaId) }, true); return; }
    void cambiarEtapa(negocio, etapaId);
  }

  const cierreSolicitado = (() => {
    const etapa = etapaPorId.get(Number(searchParams.get("cerrar")));
    return negocioSeleccionado && negocioSeleccionado.stageKind === "open" && etapa?.kind === "won" ? etapa : null;
  })();

  async function confirmarCierre(datos: DatosCierre): Promise<ResultadoEnvio> {
    if (!negocioSeleccionado || !cierreSolicitado) return { ok: false, error: "No se encontró el negocio." };
    const r = await cambiarEtapa(negocioSeleccionado, cierreSolicitado.id, datos);
    if (r.ok) navegar({ cerrar: undefined }, true);
    return r;
  }

  async function confirmarPerdida(lossReasonId: number, lossComment: string): Promise<ResultadoEnvio> {
    if (!perdida) return { ok: false, error: "No se encontró el negocio." };
    const r = await cambiarEtapa(perdida.negocio, perdida.etapaId, { lossReasonId, lossComment });
    if (r.ok) setPerdida(null);
    return r;
  }

  function abrirFicha(negocio: NegocioFila) {
    navegar({ deal: String(negocio.id), cerrar: undefined }, true);
  }
  function cerrarFicha() {
    navegar({ deal: undefined, cerrar: undefined }, true);
  }

  /* -------------------------------- render -------------------------------- */

  const estado = estadoContenido(total, hayFiltros);
  const tabs = [
    { id: "tablero", etiqueta: "Tablero", Icono: KanbanIcon, cuenta: total },
    { id: "lista", etiqueta: "Lista", Icono: ListIcon, cuenta: total },
    { id: "analisis", etiqueta: "Análisis", Icono: BarChart3, cuenta: undefined },
  ] as const;

  const ficha = negocioSeleccionado && (
    <DealInspector
      key={negocioSeleccionado.id}
      negocio={negocioSeleccionado}
      etapas={etapas}
      motivos={motivos}
      propiedades={propiedades}
      proyectos={proyectosDisponibles}
      historial={historial}
      ocupado={ocupado}
      puedeEditar={puedeEditar}
      modal={fichaModal}
      onSolicitarEtapa={(etapaId) => solicitarMover(negocioSeleccionado, etapaId)}
      onExito={(texto) => setAviso({ tipo: "exito", texto })}
      onClose={cerrarFicha}
    />
  );

  let contenido: ReactNode;
  if (modo === "analisis" && !puedeVerAnalisis) {
    contenido = <AvisoPermiso titulo="Análisis no disponible para tu rol" motivo="Las cifras de rendimiento de negocios no se muestran con tu rol. Puedes seguir trabajando en el Tablero y la Lista." />;
  } else if (estado === "cartera-vacia") {
    contenido = (
      <Vacio
        titulo="Sin negocios todavía"
        texto={puedeVerLeads ? "Los negocios aparecen aquí al convertir un lead. Empieza desde Leads." : "Los negocios aparecen aquí al convertir un lead."}
      />
    );
  } else if (estado === "sin-resultados") {
    contenido = <SinResultados texto="Ningún negocio coincide con los filtros elegidos. Quita algún filtro para ver más." onLimpiar={limpiarFiltros} />;
  } else if (modo === "analisis") {
    contenido = (
      <AnalisisNegocios etapas={etapas} resumen={resumen} filas={negocios} hayMasPaginas={siguiente !== null} veMontos={veMontos} sinConexion={sinConexion} />
    );
  } else if (modo === "lista") {
    contenido = (
      <div className={negocioSeleccionado ? "grid min-w-0 gap-4 min-[1251px]:grid-cols-[minmax(0,1fr)_420px]" : "min-w-0"}>
        <ListaNegocios filas={negocios} etapas={etapas} orden={orden} veMontos={veMontos} esMovil={esMovil}
          seleccionadoId={negocioSeleccionado?.id ?? null} onOrden={ordenar} onVerFicha={abrirFicha} />
        {ficha}
      </div>
    );
  } else {
    const tablero = (
      <Tablero
        columnas={columnas}
        alSoltar={(dealId, etapaId) => {
          const negocio = negocios.find((n) => n.id === dealId);
          if (negocio) solicitarMover(negocio, etapaId);
        }}
        acciones={{ etapas, ocupado, sinConexion, puedeMover: puedeEditar, onVerFicha: abrirFicha, onMover: solicitarMover }}
      />
    );
    contenido = esMovil ? (
      <>
        {tablero}
        {ficha}
      </>
    ) : (
      <div className={negocioSeleccionado ? "pipeline-layout inspector-open" : "pipeline-layout"}>
        {tablero}
        {ficha}
      </div>
    );
  }

  const hayPaginacion = estado === "con-datos" && modo !== "analisis" && (siguiente !== null || hayCursor);

  return (
    <>
      <PageHeader
        eyebrow="Ventas"
        title="Negocios"
        subtitle="Mueve cada oportunidad y mantén visible la siguiente acción."
        action={
          valorActivo.length > 0 ? (
            <div className="pipeline-total" aria-label="Resumen de valor activo">
              <span>Valor activo</span>
              <strong>{valorActivo.map((v) => formatearMonto(v.amountCents, v.currency)).join(" · ")}</strong>
            </div>
          ) : undefined
        }
      />

      <Tabs value={modo} onValueChange={cambiarModo}>
        <TabsList aria-label="Vistas de negocios" className="group-data-[orientation=horizontal]/tabs:h-12! w-full justify-start md:w-fit">
          {tabs.map(({ id, etiqueta, Icono, cuenta }) => (
            <TabsTrigger key={id} value={id} className="min-h-12 min-w-12 flex-1 gap-1.5 px-2 text-sm sm:gap-2 sm:px-4 md:flex-none">
              <Icono className="size-4" aria-hidden="true" />
              <span>{etiqueta}</span>
              {cuenta !== undefined && <span className="hidden rounded-full bg-gold-100 px-2 text-[13px] font-bold tabular-nums text-gold-800 sm:inline-block">{cuenta}</span>}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="grid gap-3" aria-live="polite">
          {sinConexion && (
            <div role="status" className="flex items-center gap-2.5 rounded-xl border border-warning/40 bg-warning-bg p-3.5 text-sm font-medium text-warning">
              <WifiOff className="size-4 shrink-0" aria-hidden="true" />
              <span>Sin conexión a internet. Ves los datos ya cargados en solo lectura; mover, cerrar y editar están en pausa y no se guardará nada.</span>
            </div>
          )}
          {aviso && (
            <div
              role={aviso.tipo === "error" ? "alert" : "status"}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 text-sm font-medium ${
                aviso.tipo === "error" ? "border-danger/40 bg-danger-bg text-danger" : "border-success/40 bg-success-bg text-success"
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                {aviso.tipo === "error" ? <AlertCircle className="size-4 shrink-0" aria-hidden="true" /> : <Check className="size-4 shrink-0" aria-hidden="true" />}
                <span>{aviso.texto}</span>
              </div>
              <button type="button" onClick={() => setAviso(null)} aria-label="Cerrar aviso"
                className="inline-flex min-h-12 min-w-12 shrink-0 cursor-pointer items-center justify-center rounded-lg hover:bg-black/5">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )}
          {siguiente !== null && modo !== "analisis" && estado === "con-datos" && (
            <p role="status" className="m-0 rounded-xl border border-info/30 bg-info-bg p-3 text-sm text-info">
              Resultados parciales: esta página muestra {negocios.length} de {total} negocios. Los totales por etapa sí cuentan todos.
            </p>
          )}
        </div>

        <div className="mt-3">
          <BarraFiltros
            valores={valores}
            catalogos={catalogos}
            conEtapa={modo === "lista"}
            esMovil={esMovil}
            deshabilitado={pendiente}
            onCambiar={filtrar}
            onLimpiar={limpiarFiltros}
          />
        </div>

        <TabsContent value={modo} className="min-w-0" aria-busy={pendiente}>
          {pendiente && (
            <p role="status" className="m-0 mb-2 text-sm font-medium text-ink-muted">Actualizando…</p>
          )}
          <div className={pendiente ? "opacity-60 transition-opacity" : "transition-opacity"}>{contenido}</div>

          {hayPaginacion && (
            <nav className="mt-4 flex flex-wrap items-center gap-2" aria-label="Páginas de resultados">
              {hayCursor && (
                <button type="button" onClick={() => navegar({ cursor: undefined })} disabled={pendiente}
                  className="min-h-12 cursor-pointer rounded-lg border border-input-line bg-surface px-4 text-sm font-semibold text-navy-900 hover:bg-navy-100">
                  Volver a la primera página
                </button>
              )}
              {siguiente !== null && (
                <button type="button" disabled={pendiente}
                  onClick={() => navegar({ cursor: JSON.stringify(siguiente) }, true)}
                  className="min-h-12 cursor-pointer rounded-lg bg-gold-600 px-4 text-sm font-bold text-navy-950">
                  Siguiente página
                </button>
              )}
            </nav>
          )}
          {estado === "cartera-vacia" && puedeVerLeads && (
            <p className="mt-3 text-center">
              <Link href="/leads" className="inline-flex min-h-12 items-center rounded-lg bg-gold-600 px-4 text-sm font-bold text-navy-950">Ir a Leads</Link>
            </p>
          )}
        </TabsContent>
      </Tabs>

      {perdida && (
        <DialogoPerdida contacto={perdida.negocio.contactName} motivos={motivos} onConfirmar={confirmarPerdida} onCancelar={() => setPerdida(null)} />
      )}
      {negocioSeleccionado && cierreSolicitado && (
        <DialogoCierre
          negocio={negocioSeleccionado}
          propiedades={propiedades}
          proyectos={proyectosDisponibles}
          nombreEtapa={cierreSolicitado.name}
          onConfirmar={confirmarCierre}
          onCancelar={() => navegar({ cerrar: undefined }, true)}
        />
      )}
    </>
  );
}
