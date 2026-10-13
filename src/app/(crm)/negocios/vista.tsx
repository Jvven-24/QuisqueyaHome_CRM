"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { Building2, Calendar, MessageCircle, Kanban as KanbanIcon, List as ListIcon, UserCheck, X } from "lucide-react";
import { formatearMonto } from "../_ui/formato";
import { Avatar, Badge, Modal, PageHeader } from "../_ui/prototipo-ui";
import { SinResultados, Vacio } from "../_ui/estados";
import { ModuleTabs } from "../_ui/module-tabs";
import { generarEnlaceWhatsApp } from "@/domain/comunicaciones";
import { DealInspector } from "./inspector";

import type { CatalogosNegocios, CursorNegocios, FilaNegocio, InteresNegocio, ProyectoDisponibleNegocio, ResumenEtapaNegocio } from "@/application/pipeline/puertos";
export type Etapa = CatalogosNegocios["etapas"][number];
export type MotivoPerdida = CatalogosNegocios["motivos"][number];
export type PropiedadDeal = InteresNegocio;
export type ProyectoOpcion = ProyectoDisponibleNegocio;
export type NegocioFila = FilaNegocio;

const formateadorFecha = new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short" });

/**
 * M3b · Pipeline (F1). Sustituye los `initialLeads`/`stageOrder` de muestra
 * (`../_ui/datos-muestra.ts`) por los negocios reales que resuelve
 * `page.tsx`. Conserva el arrastre nativo con `dataTransfer` del prototipo tal
 * cual — solo cambia de dónde vienen las columnas y qué pasa al soltar:
 *
 * - Las columnas salen de `etapas` (`pipeline_stages` real), no de
 *   `stageOrder`, e incluyen la de `kind: "lost"` — el defecto documentado en
 *   `docs/contexto/errores-conocidos.md` §2 ("Perdido no tiene columna").
 * - Soltar sobre una columna abierta llama directo al servidor
 *   (`PATCH /api/pipeline/:id/etapa`); soltar sobre "Perdido" abre el modal de
 *   motivo primero — el motivo es obligatorio *antes* de llamar al servidor,
 *   no después.
 * - Un 409 (`validarTransicion` o motivo faltante) se muestra tal cual lo
 *   redactó `transicion-etapa.ts`, sin traducir nada.
 */
export function PipelineVista({
  negocios,
  etapas,
  motivos,
  negocioSeleccionado,
  propiedades,
  proyectosDisponibles,
  historial, resumen, siguiente, modo, catalogos,
}: {
  negocios: NegocioFila[];
  etapas: Etapa[];
  motivos: MotivoPerdida[];
  negocioSeleccionado: NegocioFila | null;
  propiedades: PropiedadDeal[];
  /** Proyectos activos con sus unidades, para el formulario de propiedades de interés del inspector. */
  proyectosDisponibles: ProyectoOpcion[];
  historial: ReactNode;
  resumen: ResumenEtapaNegocio[]; siguiente: CursorNegocios | null;
  modo: "kanban" | "lista"; catalogos: CatalogosNegocios;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const brokerFiltro = searchParams.get("brokerId") ?? "";
  const setBrokerFiltro = (valor: string) => filtrar("brokerId", valor);
  const proyectoFiltro = searchParams.get("projectId") ?? "";
  const setProyectoFiltro = (valor: string) => filtrar("projectId", valor);
  const [enviando, setEnviando] = useState(false);
  const vistaModo = modo;
  const setVistaModo = (valor: "kanban" | "lista") => filtrar("vista", valor);
  function filtrar(clave: string, valor: string) {
    const params = new URLSearchParams(searchParams);
    params.delete("cursor");
    if (valor) params.set(clave, valor); else params.delete(clave);
    router.push(`${pathname}?${params.toString()}`);
  }
  function limpiarFiltros() {
    const params = new URLSearchParams(searchParams);
    params.delete("cursor"); params.delete("projectId"); params.delete("brokerId");
    router.push(`${pathname}?${params.toString()}`);
  }
  // Negocio + etapa destino en espera del motivo de pérdida, o `null` si el
  // modal está cerrado.
  const [pendienteDePerdida, setPendienteDePerdida] = useState<{ dealId: number; etapaId: number } | null>(null);

  function irCon(cambios: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const brokers = catalogos.brokers;
  const proyectos = catalogos.proyectos;
  const negociosFiltrados = negocios;
  const etapaPorId = useMemo(() => new Map(etapas.map((e) => [e.id, e])), [etapas]);
  const valorActivo = resumen.filter(n => n.kind === "open").reduce((totales, n) => {
    if (n.amountCents !== undefined) totales.set(n.currency, (totales.get(n.currency) ?? 0) + n.amountCents);
    return totales;
  }, new Map<string, number>());

  async function cambiarEtapa(dealId: number, stageId: number, extra?: { lossReasonId?: number; lossComment?: string }) {
    setEnviando(true);
    try {
      const respuesta = await fetch(`/api/pipeline/${dealId}/etapa`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stageId, ...extra }),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        alert(cuerpo.error ?? "No se pudo cambiar la etapa del negocio.");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      alert("Error de red o conexión al intentar mover el negocio. Por favor, reintenta.");
    } finally {
      setEnviando(false);
    }
  }

  function alSoltar(etapaDestino: Etapa, dealId: number) {
    if (Number.isNaN(dealId)) return;
    if (etapaDestino.kind === "lost") {
      setPendienteDePerdida({ dealId, etapaId: etapaDestino.id });
      return;
    }
    void cambiarEtapa(dealId, etapaDestino.id);
  }

  return (
    <>
      <PageHeader
        eyebrow="Ventas"
        title="Negocios"
        subtitle="Mueve cada oportunidad y mantén visible la siguiente acción."
        action={
          <div className="pipeline-total">
            <span>Valor activo</span>
            <strong>{[...valorActivo].map(([moneda, monto]) => formatearMonto(monto, moneda)).join(" · ") || "—"}</strong>
          </div>
        }
      />
      <div className="mb-3">
        <ModuleTabs
          tabs={[
            { id: "kanban", label: "Tablero Kanban", icon: KanbanIcon, count: resumen.reduce((s, n) => s + n.count, 0) },
            { id: "lista", label: "Vista Lista", icon: ListIcon, count: resumen.reduce((s, n) => s + n.count, 0) },
          ]}
          activeTab={vistaModo}
          onTabChange={(id) => setVistaModo(id as "kanban" | "lista")}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-slate-100/70 border border-slate-200/80 rounded-xl mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex items-center">
            <UserCheck className="absolute left-2.5 size-3.5 text-slate-400 pointer-events-none" />
            <select
              value={brokerFiltro}
              onChange={(event) => setBrokerFiltro(event.target.value)}
              className="h-8 pl-8 pr-7 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:border-gold-500 cursor-pointer"
            >
              <option value="">Todos los brokers</option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center">
            <Building2 className="absolute left-2.5 size-3.5 text-slate-400 pointer-events-none" />
            <select
              value={proyectoFiltro}
              onChange={(event) => setProyectoFiltro(event.target.value)}
              className="h-8 pl-8 pr-7 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg shadow-2xs focus:outline-none focus:border-gold-500 cursor-pointer"
            >
              <option value="">Todos los proyectos</option>
              {proyectos.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id}>
                  {proyecto.name}
                </option>
              ))}
            </select>
          </div>

          {(brokerFiltro || proyectoFiltro) && (
            <button
              type="button"
              onClick={() => {
                limpiarFiltros();
              }}
              className="h-8 px-2.5 inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <X className="size-3" />
              <span>Limpiar</span>
            </button>
          )}
        </div>

        <span className="text-xs text-slate-500/80 hidden sm:inline-block pr-1 font-medium">
          Arrastra para cambiar de etapa
        </span>
      </div>

      {siguiente && <button className="button secondary" type="button" onClick={() => {
        const params = new URLSearchParams(searchParams);
        params.set("cursor", JSON.stringify(siguiente));
        router.push(`${pathname}?${params.toString()}`);
      }}>Siguiente página</button>}
      {negocios.length === 0 ? (
        <Vacio titulo="Sin negocios todavía" texto="Los negocios aparecen aquí al convertir un lead." />
      ) : negociosFiltrados.length === 0 ? (
        <SinResultados
          texto="No hay negocios que coincidan con los filtros seleccionados de broker o proyecto."
          onLimpiar={() => {
            limpiarFiltros();
          }}
        />
      ) : (
        <div className={negocioSeleccionado ? "pipeline-layout inspector-open" : "pipeline-layout"}>
          {vistaModo === "lista" ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Negocio / Contacto</th>
                    <th>Proyecto</th>
                    <th>Etapa</th>
                    <th>Monto</th>
                    <th>Broker</th>
                    <th>Próxima Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {negociosFiltrados.map((negocio) => {
                    const etapa = etapaPorId.get(negocio.stageId);
                    return (
                      <tr
                        key={negocio.id}
                        tabIndex={0}
                        role="button"
                        aria-label={`Ver ficha de negocio de ${negocio.contactName}`}
                        className={`cursor-pointer focus-visible:outline-2 focus-visible:outline-gold-600 ${
                          negocioSeleccionado?.id === negocio.id ? "selected" : ""
                        }`}
                        onClick={() => irCon({ deal: String(negocio.id) })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            irCon({ deal: String(negocio.id) });
                          }
                        }}
                      >
                        <td>
                          <span className="table-person">
                            <Avatar name={negocio.contactName} small />
                            <span>
                              <strong>{negocio.contactName}</strong>
                              <small>{negocio.sourceName ?? "Directo"}</small>
                            </span>
                          </span>
                        </td>
                        <td>
                          <span className="font-semibold text-navy-950">
                            {negocio.proyectoPrincipal?.projectName ?? "General"}
                          </span>
                          {negocio.proyectoPrincipal?.unitCode && (
                            <small className="block text-ink-muted">
                              Unidad {negocio.proyectoPrincipal.unitCode}
                            </small>
                          )}
                        </td>
                        <td>
                          <Badge
                            tone={
                              etapa?.kind === "won"
                                ? "green"
                                : etapa?.kind === "lost"
                                ? "red"
                                : "gold"
                            }
                          >
                            {etapa?.name ?? "Etapa"}
                          </Badge>
                        </td>
                        <td>
                          <strong className="font-heading text-navy-950 font-bold">
                            {formatearMonto(negocio.amountCents ?? null, negocio.currency)}
                          </strong>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5 text-xs">
                            <Avatar name={negocio.brokerName ?? "Sin asignar"} small />
                            <span>{negocio.brokerName ?? "Sin asignar"}</span>
                          </div>
                        </td>
                        <td>
                          <small className="text-xs text-ink-muted">
                            {negocio.nextActivityTitle ?? "Sin acción"}
                          </small>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="kanban">
            {etapas.map((etapa) => {
              const negociosEtapa = negociosFiltrados.filter((negocio) => negocio.stageId === etapa.id);
              const totalesEtapa = resumen.filter(n => n.stageId === etapa.id);
              const conteoEtapa = totalesEtapa.reduce((sum, n) => sum + n.count, 0);
              return (
                <section
                  className="kanban-column"
                  key={etapa.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => alSoltar(etapa, Number(event.dataTransfer.getData("dealId")))}
                >
                  <header>
                    <div className="flex items-center gap-2">
                      <span>{etapa.name}</span>
                      <strong>{conteoEtapa}</strong>
                    </div>
                    {totalesEtapa.some(n => n.amountCents !== undefined) && (
                      <span className="text-[11px] font-bold text-slate-500 font-mono tracking-tight">
                        {totalesEtapa.map(n => n.amountCents === undefined ? "" : formatearMonto(n.amountCents, n.currency)).filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </header>
                  <div className="kanban-column-body">
                    {negociosEtapa.map((negocio) => {
                      const tieneWhatsApp = Boolean(negocio.contactPhone);
                      const enlaceWa = tieneWhatsApp
                        ? generarEnlaceWhatsApp(
                            negocio.contactPhone!,
                            `Hola ${negocio.contactName}, le saludo de Quisqueya Home en relación a su interés en ${negocio.proyectoPrincipal?.projectName ?? "proyectos en RD"}.`,
                          )
                        : null;

                      return (
                        <div
                          className="deal-card"
                          draggable={!enviando}
                          key={negocio.id}
                          onDragStart={(event) => event.dataTransfer.setData("dealId", String(negocio.id))}
                          onClick={() => irCon({ deal: String(negocio.id) })}
                        >
                          {/* Fila 1: Contacto y Origen */}
                          <div className="flex items-center justify-between gap-1.5">
                            <strong className="text-sm font-bold text-navy-950 truncate hover:text-gold-700 transition-colors">
                              {negocio.contactName}
                            </strong>
                            <span className="deal-source text-[10px] font-semibold text-slate-500 uppercase bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 font-mono shrink-0">
                              {negocio.sourceName ?? "Directo"}
                            </span>
                          </div>

                          {/* Fila 2: Proyecto e Interés */}
                          <div className="flex items-center gap-1.5 text-xs text-ink-muted font-medium">
                            <Building2 className="size-3 text-gold-600 shrink-0" />
                            <span className="truncate">
                              {negocio.proyectoPrincipal?.projectName ?? "Interés general RD"}
                              {negocio.proyectoPrincipal?.unitCode ? ` · ${negocio.proyectoPrincipal.unitCode}` : ""}
                            </span>
                          </div>

                          {/* Fila 3: Monto, Confotur y Comisión */}
                          <div className="flex items-baseline justify-between gap-1.5 pt-0.5">
                            <span className="text-sm font-extrabold text-navy-900 tracking-tight font-heading">
                              {formatearMonto(negocio.amountCents ?? null, negocio.currency)}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-tight">
                                Confotur
                              </span>
                              {negocio.commissionBasisPoints ? (
                                <span className="text-[9px] font-bold text-gold-700 bg-gold-50 px-1.5 py-0.5 rounded border border-gold-200">
                                  {(negocio.commissionBasisPoints / 100).toFixed(1)}%
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Fila 4: Próxima Acción */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                            <Calendar className="size-3 text-gold-600 shrink-0" />
                            <span className="truncate font-medium">
                              {negocio.nextActivityTitle
                                ? `${negocio.nextActivityTitle}${
                                    negocio.nextActivityStartsAt
                                      ? ` · ${formateadorFecha.format(new Date(negocio.nextActivityStartsAt))}`
                                      : ""
                                  }`
                                : "Sin próxima acción"}
                            </span>
                          </div>

                          {/* Fila 5: Broker Responsable y WhatsApp rápido */}
                          <footer>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Avatar name={negocio.brokerName ?? "Sin asignar"} small />
                              <span className="text-xs font-semibold text-slate-600 truncate max-w-[110px]">
                                {negocio.brokerName?.split(" ")[0] ?? "Sin asignar"}
                              </span>
                            </div>

                            {enlaceWa ? (
                              <a
                                href={enlaceWa}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-300 transition-colors shrink-0"
                                title="Contactar por WhatsApp"
                              >
                                <MessageCircle className="size-3" />
                                <span>WhatsApp</span>
                              </a>
                            ) : null}
                          </footer>
                        </div>
                      );
                    })}
                    {!negociosEtapa.length && <div className="kanban-empty">Suelta aquí</div>}
                  </div>
                </section>
              );
            })}
          </div>
          )}
          {negocioSeleccionado && (
            <DealInspector
              negocio={negocioSeleccionado}
              etapas={etapas}
              motivos={motivos}
              propiedades={propiedades}
              proyectos={proyectosDisponibles}
              historial={historial}
              enviando={enviando}
              onCambiarEtapa={(etapaId) => {
                const destino = etapaPorId.get(etapaId);
                if (destino) alSoltar(destino, negocioSeleccionado.id);
              }}
              onClose={() => irCon({ deal: undefined })}
            />
          )}
        </div>
      )}

      {pendienteDePerdida && (
        <ModalMotivoPerdida
          motivos={motivos}
          enviando={enviando}
          onCancelar={() => setPendienteDePerdida(null)}
          onConfirmar={async (lossReasonId, lossComment) => {
            if (await cambiarEtapa(pendienteDePerdida.dealId, pendienteDePerdida.etapaId, { lossReasonId, lossComment })) setPendienteDePerdida(null);
          }}
        />
      )}
    </>
  );
}

/**
 * Modal de motivo de pérdida (encargo, punto 2): se abre al soltar una
 * tarjeta sobre "Perdido" — o al elegirlo desde el selector del inspector — y
 * el motivo es obligatorio antes de llamar al servidor, no después. Reutiliza
 * `Modal` de `../_ui/prototipo-ui.tsx`, tal como pide el encargo.
 */
function ModalMotivoPerdida({
  motivos,
  enviando,
  onCancelar,
  onConfirmar,
}: {
  motivos: MotivoPerdida[];
  enviando: boolean;
  onCancelar: () => void;
  onConfirmar: (lossReasonId: number, lossComment: string | undefined) => void | Promise<void>;
}) {
  const [motivoId, setMotivoId] = useState<string>("");
  const [comentario, setComentario] = useState("");

  return (
    <Modal title="Marcar negocio como perdido" onClose={onCancelar}>
      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          if (!motivoId || !comentario.trim()) return;
          void onConfirmar(Number(motivoId), comentario.trim() || undefined);
        }}
      >
        <label className="span-2">
          Motivo
          <select value={motivoId} onChange={(event) => setMotivoId(event.target.value)} required>
            <option value="" disabled>
              Selecciona un motivo…
            </option>
            {motivos.filter(m => m.isActive).map((motivo) => (
              <option key={motivo.id} value={motivo.id}>
                {motivo.name}
              </option>
            ))}
          </select>
        </label>
        <label className="span-2">
          Comentario (opcional)
          <textarea required value={comentario} onChange={(event) => setComentario(event.target.value)} />
        </label>
        <div className="form-actions">
          <button className="button" type="button" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="button primary" type="submit" disabled={enviando || !motivoId}>
            {enviando ? "Guardando…" : "Marcar como perdido"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
