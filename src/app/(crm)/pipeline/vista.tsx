"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ReactNode, useMemo, useState } from "react";
import { formatearMonto } from "../_ui/formato";
import { Avatar, Modal, PageHeader } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";
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

  /** Llama al servidor para mover un negocio de etapa. Común a drag&drop, modal de pérdida e inspector. */
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
        // 409 (`validarTransicion`, motivo faltante, doble cierre) y 400 (Zod)
        // traen el mensaje ya redactado en español para el usuario — se
        // muestra tal cual, sin envolverlo en texto propio.
        alert(cuerpo.error ?? "No se pudo cambiar la etapa del negocio.");
        return;
      }
      router.refresh();
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
      ) : (
        <div className={negocioSeleccionado ? "pipeline-layout inspector-open" : "pipeline-layout"}>
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
                    {negociosEtapa.map((negocio) => (
                      <button
                        className="deal-card"
                        draggable={!enviando}
                        key={negocio.id}
                        onDragStart={(event) => event.dataTransfer.setData("dealId", String(negocio.id))}
                        onClick={() => irCon({ deal: String(negocio.id) })}
                      >
                        <span className="deal-source">{negocio.sourceName ?? "Sin canal"}</span>
                        <strong>{negocio.contactName}</strong>
                        <small>{negocio.proyectoPrincipal?.projectName ?? "Interés general"}</small>
                        <b>{formatearMonto(negocio.amountCents, negocio.currency)}</b>
                        <span>
                          {negocio.nextActivityTitle
                            ? `${negocio.nextActivityTitle}${
                                negocio.nextActivityStartsAt
                                  ? ` · ${formateadorFecha.format(new Date(negocio.nextActivityStartsAt))}`
                                  : ""
                              }`
                            : "Sin próxima acción"}
                        </span>
                        <footer>
                          <Avatar name={negocio.brokerName ?? "Sin asignar"} small />
                          <small>{negocio.brokerName?.split(" ")[0] ?? "Sin asignar"}</small>
                        </footer>
                      </button>
                    ))}
                    {!negociosEtapa.length && <div className="kanban-empty">Suelta aquí</div>}
                  </div>
                </section>
              );
            })}
          </div>
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
