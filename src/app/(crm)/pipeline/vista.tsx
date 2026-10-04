"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { Building2, Calendar, MessageCircle, Kanban as KanbanIcon, List as ListIcon } from "lucide-react";
import { formatearMonto } from "../_ui/formato";
import { Avatar, Badge, Modal, PageHeader } from "../_ui/prototipo-ui";
import { SinResultados, Vacio } from "../_ui/estados";
import { ModuleTabs } from "../_ui/module-tabs";
import { generarEnlaceWhatsApp } from "@/domain/comunicaciones";
import { DealInspector } from "./inspector";

export type Etapa = {
  id: number;
  slug: string;
  name: string;
  position: number;
  kind: "open" | "won" | "lost";
};

export type MotivoPerdida = { id: number; name: string };

export type ProyectoPrincipal = {
  dealId: number;
  projectName: string;
  unitCode: string | null;
  unitId: number | null;
};

export type PropiedadDeal = {
  id: number;
  projectId: number;
  projectName: string;
  unitId: number | null;
  unitCode: string | null;
  isPrimary: boolean;
};

/** Proyectos activos con sus unidades, para el formulario "Agregar propiedad de interés" (deuda de F1). */
export type ProyectoOpcion = { id: number; name: string; unidades: { id: number; code: string }[] };

export type NegocioFila = {
  id: number;
  contactId: number;
  contactName: string;
  contactPhone: string | null;
  contactPhoneDisplay: string | null;
  sourceName: string | null;
  brokerId: number | null;
  brokerName: string | null;
  stageId: number;
  operationType: "sale" | "rent";
  currency: string;
  amountCents: number | null;
  probability: number | null;
  commissionBasisPoints: number | null;
  expectedCloseDate: string | null;
  nextActivityTitle: string | null;
  nextActivityStartsAt: Date | null;
  stageChangedAt: Date | null;
  closedAt: Date | null;
  lossReasonId: number | null;
  lossComment: string | null;
  notes: string | null;
  proyectoPrincipal: ProyectoPrincipal | null;
};

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
  historial,
}: {
  negocios: NegocioFila[];
  etapas: Etapa[];
  motivos: MotivoPerdida[];
  negocioSeleccionado: NegocioFila | null;
  propiedades: PropiedadDeal[];
  /** Proyectos activos con sus unidades, para el formulario de propiedades de interés del inspector. */
  proyectosDisponibles: ProyectoOpcion[];
  historial: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [brokerFiltro, setBrokerFiltro] = useState("");
  const [proyectoFiltro, setProyectoFiltro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [vistaModo, setVistaModo] = useState<"kanban" | "lista">("kanban");
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

  const brokers = useMemo(
    () => Array.from(new Set(negocios.map((n) => n.brokerName).filter((n): n is string => Boolean(n)))).sort(),
    [negocios],
  );
  const proyectos = useMemo(
    () =>
      Array.from(
        new Set(negocios.map((n) => n.proyectoPrincipal?.projectName).filter((n): n is string => Boolean(n))),
      ).sort(),
    [negocios],
  );

  const negociosFiltrados = negocios.filter((negocio) => {
    if (brokerFiltro && negocio.brokerName !== brokerFiltro) return false;
    if (proyectoFiltro && negocio.proyectoPrincipal?.projectName !== proyectoFiltro) return false;
    return true;
  });

  const etapaPorId = useMemo(() => new Map(etapas.map((e) => [e.id, e])), [etapas]);
  const valorActivo = negociosFiltrados
    .filter((n) => etapaPorId.get(n.stageId)?.kind === "open")
    .reduce((suma, n) => suma + (n.amountCents ?? 0), 0);

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
        return;
      }
      router.refresh();
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
        eyebrow="C3 · Ventas"
        title="Pipeline"
        subtitle="Mueve cada oportunidad y mantén visible la siguiente acción."
        action={
          <div className="pipeline-total">
            <span>Valor activo</span>
            <strong>{formatearMonto(valorActivo, "USD")}</strong>
          </div>
        }
      />
      <div className="mb-3">
        <ModuleTabs
          tabs={[
            { id: "kanban", label: "Tablero Kanban", icon: KanbanIcon, count: negociosFiltrados.length },
            { id: "lista", label: "Vista Lista", icon: ListIcon, count: negociosFiltrados.length },
          ]}
          activeTab={vistaModo}
          onTabChange={(id) => setVistaModo(id as "kanban" | "lista")}
        />
      </div>
      <div className="filter-bar">
        <select value={brokerFiltro} onChange={(event) => setBrokerFiltro(event.target.value)}>
          <option value="">Todos los brokers</option>
          {brokers.map((broker) => (
            <option key={broker} value={broker}>
              {broker}
            </option>
          ))}
        </select>
        <select value={proyectoFiltro} onChange={(event) => setProyectoFiltro(event.target.value)}>
          <option value="">Todos los proyectos</option>
          {proyectos.map((proyecto) => (
            <option key={proyecto} value={proyecto}>
              {proyecto}
            </option>
          ))}
        </select>
        <span>Arrastra para cambiar de etapa</span>
      </div>

      {negocios.length === 0 ? (
        <Vacio titulo="Sin negocios todavía" texto="Los negocios aparecen aquí al convertir un lead." />
      ) : negociosFiltrados.length === 0 ? (
        <SinResultados
          texto="No hay negocios que coincidan con los filtros seleccionados de broker o proyecto."
          onLimpiar={() => {
            setBrokerFiltro("");
            setProyectoFiltro("");
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
                            {formatearMonto(negocio.amountCents, negocio.currency)}
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
              return (
                <section
                  className="kanban-column"
                  key={etapa.id}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => alSoltar(etapa, Number(event.dataTransfer.getData("dealId")))}
                >
                  <header>
                    <span>{etapa.name}</span>
                    <strong>{negociosEtapa.length}</strong>
                  </header>
                  <div>
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
                          className="deal-card group relative bg-surface border border-line rounded-xl p-4 shadow-xs hover:border-gold-600/50 hover:shadow-md transition-all duration-150 cursor-pointer text-left block w-full mb-3"
                          draggable={!enviando}
                          key={negocio.id}
                          onDragStart={(event) => event.dataTransfer.setData("dealId", String(negocio.id))}
                          onClick={() => irCon({ deal: String(negocio.id) })}
                        >
                          {/* Header row: Source & Confotur tag */}
                          <div className="flex items-center justify-between gap-1.5 mb-2 flex-wrap">
                            <span className="deal-source text-[10px] font-extrabold tracking-wider text-ink-muted uppercase bg-surface-alt px-2 py-0.5 rounded-md border border-line font-mono">
                              {negocio.sourceName ?? "Directo"}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold text-cyan-800 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200 uppercase tracking-tight">
                                Confotur
                              </span>
                              {negocio.probability ? (
                                <span className="text-[10px] font-bold text-navy-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {negocio.probability}% prob.
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Contact Name & Project */}
                          <strong className="block font-heading font-bold text-base text-navy-950 group-hover:text-gold-700 transition-colors leading-snug">
                            {negocio.contactName}
                          </strong>

                          <div className="flex items-center gap-1.5 text-xs text-ink-muted mt-1.5 mb-2 font-medium">
                            <Building2 className="size-3.5 text-gold-600 shrink-0" />
                            <span className="truncate">
                              {negocio.proyectoPrincipal?.projectName ?? "Interés en pozo RD"}
                              {negocio.proyectoPrincipal?.unitCode ? ` · Unidad ${negocio.proyectoPrincipal.unitCode}` : ""}
                            </span>
                          </div>

                          {/* Amount and Commission estimate */}
                          <div className="flex items-baseline justify-between gap-2 mb-2">
                            <span className="text-base font-extrabold text-navy-900 tracking-tight font-heading">
                              {formatearMonto(negocio.amountCents, negocio.currency)}
                            </span>
                            {negocio.commissionBasisPoints && negocio.amountCents ? (
                              <span className="text-[10px] font-bold text-gold-700 bg-gold-50 px-2 py-0.5 rounded-md border border-gold-200">
                                Com: {formatearMonto((negocio.amountCents * negocio.commissionBasisPoints) / 10000, negocio.currency)} ({(negocio.commissionBasisPoints / 100).toFixed(1)}%)
                              </span>
                            ) : null}
                          </div>

                          {/* Pre-construction Dominican payment milestone bar */}
                          <div className="mb-2.5 p-1.5 bg-surface-alt/70 rounded-lg border border-line/60">
                            <div className="flex items-center justify-between text-[9px] font-bold text-ink-muted uppercase tracking-wider mb-1 font-mono">
                              <span>Esquema Pre-construcción</span>
                              <span className="text-gold-700">10 / 40 / 50</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 text-center text-[9px] font-semibold">
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded py-0.5">
                                Reserva 10%
                              </span>
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded py-0.5">
                                Obra 40%
                              </span>
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded py-0.5">
                                Entrega 50%
                              </span>
                            </div>
                          </div>

                          {/* Next activity SLA pill */}
                          <div className="flex items-center gap-1.5 text-xs text-ink-muted/90 bg-surface-alt/90 px-2.5 py-1.5 rounded-lg border border-line/60 mb-3">
                            <Calendar className="size-3 text-gold-600 shrink-0" />
                            <span className="truncate">
                              {negocio.nextActivityTitle
                                ? `${negocio.nextActivityTitle}${
                                    negocio.nextActivityStartsAt
                                      ? ` · ${formateadorFecha.format(new Date(negocio.nextActivityStartsAt))}`
                                      : ""
                                  }`
                                : "Sin próxima acción"}
                            </span>
                          </div>

                          {/* Footer with broker avatar and fast WhatsApp action */}
                          <footer className="flex items-center justify-between pt-2.5 border-t border-line/60">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar name={negocio.brokerName ?? "Sin asignar"} small />
                              <span className="text-xs font-semibold text-ink-muted truncate max-w-[105px]">
                                {negocio.brokerName?.split(" ")[0] ?? "Sin asignar"}
                              </span>
                            </div>

                            {enlaceWa ? (
                              <a
                                href={enlaceWa}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-success hover:text-success/80 bg-success-bg px-2.5 py-1 rounded-md border border-success/30 transition-colors shrink-0"
                                title="Contactar por WhatsApp con plantilla de proyecto"
                              >
                                <MessageCircle className="size-3.5" />
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
            await cambiarEtapa(pendienteDePerdida.dealId, pendienteDePerdida.etapaId, { lossReasonId, lossComment });
            setPendienteDePerdida(null);
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
          if (!motivoId) return;
          void onConfirmar(Number(motivoId), comentario.trim() || undefined);
        }}
      >
        <label className="span-2">
          Motivo
          <select value={motivoId} onChange={(event) => setMotivoId(event.target.value)} required>
            <option value="" disabled>
              Selecciona un motivo…
            </option>
            {motivos.map((motivo) => (
              <option key={motivo.id} value={motivo.id}>
                {motivo.name}
              </option>
            ))}
          </select>
        </label>
        <label className="span-2">
          Comentario (opcional)
          <textarea value={comentario} onChange={(event) => setComentario(event.target.value)} />
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
