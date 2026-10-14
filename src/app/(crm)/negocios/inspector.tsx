"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { centavosAUnidad, formatearMonto, unidadACentavos } from "../_ui/formato";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import { AvisoPermiso } from "../_ui/estados";
import { Avatar, Modal } from "../_ui/prototipo-ui";
import { enviarJson } from "./api";
import { calcularAntiguedad } from "./antiguedad";
import { DialogoRetiro, type ResultadoEnvio } from "./dialogos";
import type { Etapa, MotivoPerdida, NegocioFila, PropiedadDeal, ProyectoOpcion } from "./logica";

const BOTON_TEXTO = "inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-lg px-3.5 text-sm font-semibold text-navy-900 hover:bg-navy-100";
const CAMPO = "min-h-12 w-full rounded-lg border border-input-line bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-gold-700";

/**
 * Ficha del negocio: inspector lateral en escritorio, pantalla completa en
 * móvil (el CSS global lo posiciona). Pestañas Resumen · Propiedades y, solo
 * si el servidor entrega el historial (administración), Seguimiento.
 *
 * Qué NO hay, porque no existe endpoint: registrar nota o próxima acción
 * desde aquí, enviar propuestas del asistente, documentos y pestaña
 * «Seguimiento» para roles distintos de administración. Esos controles no se
 * muestran (ver evidencia D09-c1-cierre).
 */
export function DealInspector({
  negocio,
  etapas,
  motivos,
  propiedades,
  proyectos,
  historial,
  ocupado,
  puedeEditar,
  modal,
  onSolicitarEtapa,
  onExito,
  onClose,
}: {
  negocio: NegocioFila;
  etapas: Etapa[];
  motivos: MotivoPerdida[];
  propiedades: PropiedadDeal[];
  proyectos: ProyectoOpcion[];
  historial: ReactNode;
  ocupado: boolean;
  puedeEditar: boolean;
  /** Móvil: la ficha cubre la pantalla, así que atrapa el foco como cualquier diálogo. */
  modal: boolean;
  onSolicitarEtapa: (etapaId: number) => void;
  onExito: (mensaje: string) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const inspectorRef = useFocusTrap<HTMLElement>({ onClose, isActive: modal });
  const [editando, setEditando] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [retirando, setRetirando] = useState<PropiedadDeal | null>(null);
  const [ocupadoProp, setOcupadoProp] = useState<number | null>(null);
  const [errorProp, setErrorProp] = useState<string | null>(null);
  const [pestana, setPestana] = useState("resumen");
  const [etapaElegida, setEtapaElegida] = useState("");
  const [errorEtapa, setErrorEtapa] = useState<string | null>(null);

  const etapaActual = etapas.find((e) => e.id === negocio.stageId);
  const abierto = negocio.stageKind === "open";
  const editable = abierto && puedeEditar;
  const motivoPerdida = negocio.lossReasonId ? motivos.find((m) => m.id === negocio.lossReasonId) : undefined;
  const tieneHistorial = historial !== null && historial !== undefined;

  async function marcarPrincipal(propiedad: PropiedadDeal) {
    setOcupadoProp(propiedad.id);
    setErrorProp(null);
    const r = await enviarJson(`${negocio.id}/propiedades/${propiedad.id}`, "PATCH", { isPrimary: true });
    setOcupadoProp(null);
    if (!r.ok) { setErrorProp(r.error); return; }
    onExito("Proyecto principal actualizado.");
    router.refresh();
  }

  async function retirar(propiedad: PropiedadDeal, motivo: string): Promise<ResultadoEnvio> {
    const r = await enviarJson(`${negocio.id}/propiedades/${propiedad.id}`, "DELETE", { motivo });
    if (!r.ok) return r;
    setRetirando(null);
    onExito("Interés retirado. Queda registrado con su motivo.");
    router.refresh();
    return { ok: true };
  }

  function confirmarEtapa() {
    if (!etapaElegida) { setErrorEtapa("Elige la etapa de destino."); return; }
    setErrorEtapa(null);
    onSolicitarEtapa(Number(etapaElegida));
    setEtapaElegida("");
  }

  return (
    <aside
      className="inspector"
      ref={inspectorRef}
      tabIndex={-1}
      role={modal ? "dialog" : "region"}
      aria-modal={modal ? true : undefined}
      aria-label="Ficha de negocio"
      onKeyDown={(e) => { if (!modal && e.key === "Escape" && !editando && !retirando) onClose(); }}
    >
      <div className="drawer-head">
        <div>
          <p className="eyebrow">Ficha de negocio</p>
          <h2>{negocio.contactName}</h2>
        </div>
        <div className="header-actions-inline">
          {editable && <button className={BOTON_TEXTO} type="button" onClick={() => setEditando(true)}>Editar</button>}
          <button className={`${BOTON_TEXTO} text-xl text-ink-muted`} type="button" onClick={onClose} aria-label="Cerrar ficha">×</button>
        </div>
      </div>

      <div className="contact-hero">
        <Avatar name={negocio.contactName} />
        <div>
          <strong>{negocio.contactPhoneDisplay ?? negocio.contactPhone ?? "Sin teléfono"}</strong>
          <small>{negocio.sourceName ?? "Sin canal"}</small>
        </div>
      </div>

      <Tabs value={pestana} onValueChange={setPestana} className="mt-3">
        <TabsList className="group-data-[orientation=horizontal]/tabs:h-12! w-full">
          <TabsTrigger value="resumen" className="min-h-12 text-sm">Resumen</TabsTrigger>
          <TabsTrigger value="propiedades" className="min-h-12 text-sm">Propiedades ({propiedades.length})</TabsTrigger>
          {tieneHistorial && <TabsTrigger value="seguimiento" className="min-h-12 text-sm">Seguimiento</TabsTrigger>}
        </TabsList>

        <TabsContent value="resumen" className="grid gap-4 pt-3">
          <dl className="detail-grid">
            <div><dt>Etapa</dt><dd>{etapaActual?.name ?? "—"}</dd></div>
            <div><dt>Responsable</dt><dd>{negocio.brokerName ?? "Sin asignar"}</dd></div>
            <div><dt>Operación</dt><dd>{negocio.operationType === "rent" ? "Alquiler" : "Venta"}</dd></div>
            {negocio.amountCents !== undefined && (
              <div><dt>Monto comercial</dt><dd>{negocio.amountCents !== null ? formatearMonto(negocio.amountCents, negocio.currency) : "Por definir"}</dd></div>
            )}
            <div><dt>Probabilidad</dt><dd>{negocio.probability !== null ? `${negocio.probability}%` : "—"}</dd></div>
            {negocio.commissionBasisPoints !== undefined && (
              <div><dt>Comisión</dt><dd>{negocio.commissionBasisPoints !== null ? `${(negocio.commissionBasisPoints / 100).toFixed(2)}%` : "—"}</dd></div>
            )}
            <div><dt>Fecha estimada de cierre</dt><dd>{negocio.expectedCloseDate ?? "—"}</dd></div>
            <div><dt>Próxima acción</dt><dd>{negocio.nextActivityTitle ?? "Sin registrar"}</dd></div>
            <div><dt>Tiempo en la etapa</dt><dd>{calcularAntiguedad(negocio.stageChangedAt)}</dd></div>
          </dl>

          {motivoPerdida && (
            <p className="m-0 text-sm"><strong>Motivo de pérdida:</strong> {motivoPerdida.name}{negocio.lossComment ? ` — ${negocio.lossComment}` : ""}</p>
          )}
          {negocio.notes && <p className="m-0 text-sm"><strong>Notas:</strong> {negocio.notes}</p>}

          {abierto && !puedeEditar && (
            <AvisoPermiso titulo="Cambios con aprobación" motivo="Tu rol prepara cambios para que un administrador los apruebe. El envío de propuestas todavía no está disponible en esta pantalla." />
          )}

          {editable && (
            <div className="grid gap-2">
              <label className="grid gap-1.5 text-sm font-bold text-ink">
                <span>Cambiar de etapa</span>
                <select className={CAMPO} value={etapaElegida} disabled={ocupado} aria-invalid={Boolean(errorEtapa)}
                  aria-describedby={errorEtapa ? "inspector-etapa-error" : undefined}
                  onChange={(e) => { setEtapaElegida(e.target.value); setErrorEtapa(null); }}>
                  <option value="">Elige una etapa…</option>
                  {etapas.filter((e) => e.id !== negocio.stageId).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </label>
              {errorEtapa && <p id="inspector-etapa-error" role="alert" className="m-0 text-[13px] font-medium text-danger">{errorEtapa}</p>}
              <button type="button" onClick={confirmarEtapa} disabled={ocupado} aria-busy={ocupado}
                className="min-h-12 cursor-pointer rounded-lg bg-gold-600 px-4 text-sm font-bold text-navy-950 disabled:cursor-wait disabled:opacity-70">
                {ocupado ? "Aplicando…" : "Cambiar etapa"}
              </button>
              <p className="m-0 text-[13px] text-ink-muted">Pasar a una etapa de venta pide la unidad; pasar a una de pérdida pide motivo y comentario.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="propiedades" className="grid gap-3 pt-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="m-0 text-base font-bold">Propiedades de interés</h3>
            {editable && !agregando && <button className={BOTON_TEXTO} type="button" onClick={() => setAgregando(true)}>+ Agregar</button>}
          </div>
          {errorProp && <p role="alert" className="m-0 rounded-lg border border-danger/40 bg-danger-bg p-3 text-sm text-danger">{errorProp}</p>}
          {propiedades.length === 0 && !agregando && <p className="m-0 text-sm text-ink-muted">Ninguna todavía. Agrega el proyecto que le interesa al contacto.</p>}
          {propiedades.length > 0 && (
            <ul className="m-0 grid list-none gap-2 p-0">
              {propiedades.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-2.5 text-sm">
                  <span>
                    {p.projectName}{p.unitCode ? ` · Unidad ${p.unitCode}` : ""}
                    {p.isPrimary && <span className="ml-1.5 rounded-full bg-gold-100 px-2 py-0.5 text-[13px] font-semibold text-gold-800">Principal</span>}
                  </span>
                  {editable && (
                    <span className="flex flex-wrap gap-1">
                      {!p.isPrimary && (
                        <button className={BOTON_TEXTO} type="button" disabled={ocupadoProp === p.id} onClick={() => void marcarPrincipal(p)}>Marcar principal</button>
                      )}
                      <button className={`${BOTON_TEXTO} text-danger`} type="button" disabled={ocupadoProp === p.id} onClick={() => setRetirando(p)}
                        aria-label={`Retirar ${p.projectName}${p.unitCode ? ` unidad ${p.unitCode}` : ""} de los intereses`}>Retirar</button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {agregando && (
            <FormularioPropiedad dealId={negocio.id} proyectos={proyectos} tienePrincipal={propiedades.some((p) => p.isPrimary)}
              onClose={() => setAgregando(false)} onExito={onExito} />
          )}
        </TabsContent>

        {tieneHistorial && <TabsContent value="seguimiento" className="pt-3">{historial}</TabsContent>}
      </Tabs>

      {editando && <FormularioNegocio negocio={negocio} onClose={() => setEditando(false)} onExito={onExito} />}
      {retirando && (
        <DialogoRetiro
          descripcionInteres={`${retirando.projectName}${retirando.unitCode ? ` · Unidad ${retirando.unitCode}` : ""}`}
          onCancelar={() => setRetirando(null)}
          onConfirmar={(motivo) => retirar(retirando, motivo)}
        />
      )}
    </aside>
  );
}

/**
 * Los campos que las reglas de etapa exigen para Negociación y Cierre. El
 * servidor rechaza la edición si el negocio ya está cerrado. Los números viajan
 * como número (el esquema no acepta texto) y un campo vacío viaja como null.
 */
function FormularioNegocio({ negocio, onClose, onExito }: { negocio: NegocioFila; onClose: () => void; onExito: (mensaje: string) => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const enCurso = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [esErrorRed, setEsErrorRed] = useState(false);

  async function enviar(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    if (!formRef.current || enCurso.current) return;
    enCurso.current = true;
    setEnviando(true);
    setError(null);
    setEsErrorRed(false);
    const form = formRef.current;
    const datos: Record<string, unknown> = {};
    const probabilidad = String(new FormData(form).get("probability") ?? "").trim();
    datos.probability = probabilidad === "" ? null : Number(probabilidad);
    datos.expectedCloseDate = String(new FormData(form).get("expectedCloseDate") ?? "") || null;
    if (negocio.amountCents !== undefined) datos.amountCents = unidadACentavos(String(new FormData(form).get("amount") ?? "") || null);
    const comision = form.elements.namedItem("commissionPercent") as HTMLInputElement | null;
    if (comision) datos.commissionBasisPoints = comision.value ? Math.round(Number(comision.value) * 100) : null;
    const r = await enviarJson(`${negocio.id}`, "PATCH", datos);
    enCurso.current = false;
    setEnviando(false);
    if (!r.ok) { setError(r.error); setEsErrorRed(r.estado === 0); return; }
    onExito("Cambios del negocio guardados.");
    router.refresh();
    onClose();
  }

  return (
    <Modal title="Editar negocio" onClose={onClose}>
      <form className="form-grid" ref={formRef} onSubmit={enviar} aria-busy={enviando} noValidate>
        {error && <AlertaErrorFormulario mensaje={error} esErrorRed={esErrorRed} onReintentar={esErrorRed ? () => void enviar() : undefined} reintentando={enviando} />}
        {negocio.amountCents !== undefined && (
          <label>
            Monto comercial ({negocio.currency})
            <input className={CAMPO} name="amount" type="number" min="0" step="1" placeholder="Ej. 150000" defaultValue={centavosAUnidad(negocio.amountCents)} />
          </label>
        )}
        <label>
          Probabilidad (%)
          <input className={CAMPO} name="probability" type="number" min="0" max="100" defaultValue={negocio.probability ?? ""} />
        </label>
        {negocio.commissionBasisPoints !== undefined && (
          <label>
            Comisión (%)
            <input className={CAMPO} name="commissionPercent" type="number" min="0" max="100" step="0.01"
              defaultValue={negocio.commissionBasisPoints !== null ? (negocio.commissionBasisPoints / 100).toString() : ""} />
          </label>
        )}
        <label>
          Fecha estimada de cierre
          <input className={CAMPO} name="expectedCloseDate" type="date" defaultValue={negocio.expectedCloseDate ?? ""} />
        </label>
        <div className="form-actions span-2">
          <button className="button secondary min-h-12 px-4" type="button" onClick={onClose} disabled={enviando}>Cancelar</button>
          <button className="button primary min-h-12 px-4" type="submit" disabled={enviando} aria-busy={enviando}>{enviando ? "Guardando…" : "Guardar cambios"}</button>
        </div>
      </form>
    </Modal>
  );
}

/** Asociar un proyecto o una unidad de interés. La unidad depende del proyecto elegido. */
function FormularioPropiedad({ dealId, proyectos, tienePrincipal, onClose, onExito }: {
  dealId: number;
  proyectos: ProyectoOpcion[];
  tienePrincipal: boolean;
  onClose: () => void;
  onExito: (mensaje: string) => void;
}) {
  const router = useRouter();
  const enCurso = useRef(false);
  const [proyectoId, setProyectoId] = useState<number | "">(proyectos[0]?.id ?? "");
  const [unidadId, setUnidadId] = useState("");
  const [principal, setPrincipal] = useState(!tienePrincipal);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [esErrorRed, setEsErrorRed] = useState(false);
  const unidades = proyectos.find((p) => p.id === proyectoId)?.unidades ?? [];

  async function enviar(event?: FormEvent<HTMLFormElement>) {
    if (event) event.preventDefault();
    if (enCurso.current || proyectoId === "") return;
    enCurso.current = true;
    setEnviando(true);
    setError(null);
    setEsErrorRed(false);
    const datos: Record<string, unknown> = { projectId: proyectoId, isPrimary: principal };
    if (unidadId) datos.unitId = Number(unidadId);
    const r = await enviarJson(`${dealId}/propiedades`, "POST", datos);
    enCurso.current = false;
    setEnviando(false);
    if (!r.ok) { setError(r.error); setEsErrorRed(r.estado === 0); return; }
    onExito("Propiedad de interés agregada.");
    router.refresh();
    onClose();
  }

  if (proyectos.length === 0) return <p className="m-0 text-sm text-ink-muted">No hay proyectos activos con inventario todavía.</p>;

  return (
    <form className="form-grid" onSubmit={enviar} aria-busy={enviando} noValidate>
      {error && <AlertaErrorFormulario mensaje={error} esErrorRed={esErrorRed} onReintentar={esErrorRed ? () => void enviar() : undefined} reintentando={enviando} />}
      <label>
        Proyecto
        <select className={CAMPO} value={proyectoId} onChange={(e) => { setProyectoId(Number(e.target.value)); setUnidadId(""); }}>
          {proyectos.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <label>
        Unidad (opcional)
        <select className={CAMPO} value={unidadId} onChange={(e) => setUnidadId(e.target.value)}>
          <option value="">Interés general</option>
          {unidades.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
        </select>
      </label>
      <label className="span-2 flex min-h-12 cursor-pointer items-center gap-2">
        <input type="checkbox" checked={principal} onChange={(e) => setPrincipal(e.target.checked)} className="size-5" />
        <span>Marcar como principal</span>
      </label>
      <div className="form-actions span-2">
        <button className="button secondary min-h-12 px-4" type="button" onClick={onClose} disabled={enviando}>Cancelar</button>
        <button className="button primary min-h-12 px-4" type="submit" disabled={enviando} aria-busy={enviando}>{enviando ? "Agregando…" : "Agregar"}</button>
      </div>
    </form>
  );
}
