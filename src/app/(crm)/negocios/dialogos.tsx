"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { centavosAUnidad, unidadACentavos } from "../_ui/formato";
import type { MotivoPerdida, NegocioFila, PropiedadDeal, ProyectoOpcion } from "./logica";

export type ResultadoEnvio = { ok: true } | { ok: false; error: string };

const CAMPO = "min-h-12 w-full rounded-lg border border-input-line bg-surface px-3 text-sm text-ink focus-visible:outline-2 focus-visible:outline-gold-700";
const BOTON_PRIMARIO = "min-h-12 cursor-pointer rounded-lg bg-gold-600 px-5 text-sm font-bold text-navy-950 disabled:cursor-wait disabled:opacity-70";
const BOTON_SECUNDARIO = "min-h-12 cursor-pointer rounded-lg border border-input-line bg-surface px-5 text-sm font-semibold text-navy-900 hover:bg-navy-100 disabled:opacity-70";

function ErrorCampo({ id, texto }: { id: string; texto?: string }) {
  return texto ? <p id={id} role="alert" className="m-0 text-[13px] font-medium text-danger">{texto}</p> : null;
}

function BloqueError({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-bg p-3 text-sm text-danger">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="m-0">{texto}</p>
    </div>
  );
}

function Obligatorio() {
  return (
    <>
      <span aria-hidden="true" className="text-danger"> *</span>
      <span className="sr-only"> (obligatorio)</span>
    </>
  );
}

/** Envío con guarda contra doble clic: la ref se activa antes del primer re-render. */
function useEnvio() {
  const enCurso = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function ejecutar(accion: () => Promise<ResultadoEnvio>) {
    if (enCurso.current) return;
    enCurso.current = true;
    setEnviando(true);
    setError(null);
    try {
      const resultado = await accion();
      if (!resultado.ok) setError(resultado.error);
    } catch {
      setError("No se pudo completar la operación por un fallo de conexión. Lo que escribiste sigue aquí; reintenta.");
    } finally {
      enCurso.current = false;
      setEnviando(false);
    }
  }
  return { enviando, error, ejecutar };
}

function Marco({ titulo, descripcion, onCancelar, children }: { titulo: string; descripcion: string; onCancelar: () => void; children: ReactNode }) {
  return (
    <Dialog open onOpenChange={(abierto) => { if (!abierto) onCancelar(); }}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------- Negocio no concretado ------------------------- */

export function DialogoPerdida({ contacto, motivos, onConfirmar, onCancelar }: {
  contacto: string;
  motivos: MotivoPerdida[];
  onConfirmar: (lossReasonId: number, lossComment: string) => Promise<ResultadoEnvio>;
  onCancelar: () => void;
}) {
  const activos = motivos.filter((m) => m.isActive);
  const [motivoId, setMotivoId] = useState("");
  const [comentario, setComentario] = useState("");
  const [intentado, setIntentado] = useState(false);
  const { enviando, error, ejecutar } = useEnvio();
  const errMotivo = intentado && !motivoId ? "Elige un motivo." : undefined;
  const errComentario = intentado && !comentario.trim() ? "Escribe un comentario." : undefined;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    setIntentado(true);
    if (!motivoId || !comentario.trim()) return;
    void ejecutar(() => onConfirmar(Number(motivoId), comentario.trim()));
  }

  return (
    <Marco titulo="Marcar negocio como no concretado" descripcion={`El negocio de ${contacto} se archiva; el contacto sigue disponible para volver a contactarlo.`} onCancelar={onCancelar}>
      <form onSubmit={enviar} className="grid gap-4" noValidate aria-busy={enviando}>
        <BloqueError texto={error} />
        {activos.length === 0 ? (
          <p role="alert" className="m-0 rounded-lg border border-warning/40 bg-warning-bg p-3 text-sm text-warning">
            No hay motivos de pérdida activos. Un administrador debe activar al menos uno en el catálogo para poder archivar negocios.
          </p>
        ) : (
          <>
            <label className="grid gap-1.5 text-sm font-bold text-ink">
              <span>Motivo<Obligatorio /></span>
              <select value={motivoId} onChange={(e) => setMotivoId(e.target.value)} className={CAMPO} aria-required="true"
                aria-invalid={Boolean(errMotivo)} aria-describedby={errMotivo ? "perdida-motivo-error" : undefined}>
                <option value="">Selecciona un motivo…</option>
                {activos.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <ErrorCampo id="perdida-motivo-error" texto={errMotivo} />
            </label>
            <label className="grid gap-1.5 text-sm font-bold text-ink">
              <span>Comentario<Obligatorio /></span>
              <textarea rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} className={`${CAMPO} py-2`}
                placeholder="Qué pasó y qué se acordó con el cliente" aria-required="true" aria-invalid={Boolean(errComentario)}
                aria-describedby={errComentario ? "perdida-comentario-error" : undefined} />
              <ErrorCampo id="perdida-comentario-error" texto={errComentario} />
            </label>
          </>
        )}
        <DialogFooter>
          <button type="button" className={BOTON_SECUNDARIO} onClick={onCancelar} disabled={enviando}>Cancelar</button>
          {activos.length > 0 && (
            <button type="submit" className={BOTON_PRIMARIO} aria-busy={enviando} disabled={enviando}>
              {enviando ? "Guardando…" : "Archivar como no concretado"}
            </button>
          )}
        </DialogFooter>
      </form>
    </Marco>
  );
}

/* ------------------------------ Cierre ------------------------------ */

export type DatosCierre = { amountCents?: number; unitId?: number; unitCode?: string };

export function DialogoCierre({ negocio, propiedades, proyectos, nombreEtapa, onConfirmar, onCancelar }: {
  negocio: NegocioFila;
  propiedades: PropiedadDeal[];
  proyectos: ProyectoOpcion[];
  nombreEtapa: string;
  onConfirmar: (datos: DatosCierre) => Promise<ResultadoEnvio>;
  onCancelar: () => void;
}) {
  const alquiler = negocio.operationType === "rent";
  const principal = propiedades.find((p) => p.isPrimary);
  const unidades = proyectos.find((p) => p.id === principal?.projectId)?.unidades ?? [];
  const veMonto = negocio.amountCents !== undefined;
  const [modo, setModo] = useState<"elegir" | "crear">(unidades.length > 0 ? "elegir" : "crear");
  const [unidadId, setUnidadId] = useState(principal?.unitId ? String(principal.unitId) : "");
  const [codigo, setCodigo] = useState("");
  const [monto, setMonto] = useState(String(centavosAUnidad(negocio.amountCents ?? null)));
  const [intentado, setIntentado] = useState(false);
  const { enviando, error, ejecutar } = useEnvio();

  const faltaUnidad = modo === "elegir" ? !unidadId : !codigo.trim();
  const centavos = unidadACentavos(monto);
  const faltaMonto = veMonto && (centavos === null || centavos <= 0);
  const errUnidad = intentado && faltaUnidad ? (modo === "elegir" ? "Elige la unidad que se vende." : "Escribe el código de la unidad.") : undefined;
  const errMonto = intentado && faltaMonto ? "Indica el monto comercial del cierre." : undefined;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    setIntentado(true);
    if (faltaUnidad || faltaMonto) return;
    const datos: DatosCierre = modo === "elegir" ? { unitId: Number(unidadId) } : { unitCode: codigo.trim() };
    if (veMonto && centavos !== null) datos.amountCents = centavos;
    void ejecutar(() => onConfirmar(datos));
  }

  return (
    <Marco titulo={alquiler ? "Cerrar alquiler" : "Cerrar venta"}
      descripcion={`Negocio de ${negocio.contactName} · etapa ${nombreEtapa}. Hace falta una unidad concreta del proyecto.`} onCancelar={onCancelar}>
      {!principal ? (
        <div className="grid gap-4">
          <p role="alert" className="m-0 rounded-lg border border-warning/40 bg-warning-bg p-3 text-sm text-warning">
            Este negocio no tiene un proyecto principal. Agrega un proyecto de interés y márcalo como principal en la ficha; después vuelve a cerrar.
          </p>
          <DialogFooter><button type="button" className={BOTON_SECUNDARIO} onClick={onCancelar}>Entendido</button></DialogFooter>
        </div>
      ) : (
        <form onSubmit={enviar} className="grid gap-4" noValidate aria-busy={enviando}>
          <BloqueError texto={error} />
          <dl className="m-0 grid gap-1 rounded-lg border border-line bg-surface-alt p-3 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-ink-muted">Contacto</dt><dd className="m-0 font-semibold text-ink">{negocio.contactName}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-ink-muted">Proyecto</dt><dd className="m-0 font-semibold text-ink">{principal.projectName}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-ink-muted">Operación</dt><dd className="m-0 font-semibold text-ink">{alquiler ? "Alquiler" : "Venta"}</dd></div>
          </dl>

          {veMonto && (
            <label className="grid gap-1.5 text-sm font-bold text-ink">
              <span>Monto comercial ({negocio.currency})<Obligatorio /></span>
              <input type="number" min="0" step="1" inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} className={CAMPO}
                aria-required="true" aria-invalid={Boolean(errMonto)} aria-describedby={errMonto ? "cierre-monto-error" : undefined} />
              <ErrorCampo id="cierre-monto-error" texto={errMonto} />
            </label>
          )}

          <fieldset className="m-0 grid gap-2 border-0 p-0">
            <legend className="mb-1 p-0 text-sm font-bold text-ink">Unidad<Obligatorio /></legend>
            {unidades.length > 0 && (
              <label className="flex min-h-12 cursor-pointer items-center gap-2 text-sm text-ink">
                <input type="radio" name="modo-unidad" checked={modo === "elegir"} onChange={() => setModo("elegir")} className="size-5" />
                <span>Elegir unidad</span>
              </label>
            )}
            {modo === "elegir" && unidades.length > 0 && (
              <select aria-label="Unidad del proyecto" value={unidadId} onChange={(e) => setUnidadId(e.target.value)} className={CAMPO}
                aria-invalid={Boolean(errUnidad)} aria-describedby={errUnidad ? "cierre-unidad-error" : undefined}>
                <option value="">Selecciona una unidad…</option>
                {unidades.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
              </select>
            )}
            <label className="flex min-h-12 cursor-pointer items-center gap-2 text-sm text-ink">
              <input type="radio" name="modo-unidad" checked={modo === "crear"} onChange={() => setModo("crear")} className="size-5" />
              <span>Crear unidad</span>
            </label>
            {modo === "crear" && (
              <input type="text" aria-label="Código de la unidad nueva" maxLength={200} value={codigo} onChange={(e) => setCodigo(e.target.value)}
                placeholder="Código, por ejemplo A-101" className={CAMPO}
                aria-invalid={Boolean(errUnidad)} aria-describedby={errUnidad ? "cierre-unidad-error" : undefined} />
            )}
            <ErrorCampo id="cierre-unidad-error" texto={errUnidad} />
          </fieldset>

          <p className="m-0 text-[13px] text-ink-muted">
            Al confirmar, la unidad queda {alquiler ? "reservada" : "vendida"} y el negocio se cierra. Si otra operación ya tomó la unidad, el cierre se rechaza y el negocio sigue abierto.
          </p>
          <DialogFooter>
            <button type="button" className={BOTON_SECUNDARIO} onClick={onCancelar} disabled={enviando}>Cancelar</button>
            <button type="submit" className={BOTON_PRIMARIO} aria-busy={enviando} disabled={enviando}>
              {enviando ? "Cerrando…" : alquiler ? "Confirmar alquiler" : "Confirmar venta"}
            </button>
          </DialogFooter>
        </form>
      )}
    </Marco>
  );
}

/* ----------------------- Retirar interés (baja lógica) ----------------------- */

export function DialogoRetiro({ descripcionInteres, onConfirmar, onCancelar }: {
  descripcionInteres: string;
  onConfirmar: (motivo: string) => Promise<ResultadoEnvio>;
  onCancelar: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [intentado, setIntentado] = useState(false);
  const { enviando, error, ejecutar } = useEnvio();
  const errMotivo = intentado && !motivo.trim() ? "Escribe el motivo del retiro." : undefined;
  return (
    <Marco titulo="Retirar interés" descripcion={`${descripcionInteres}. El interés queda dado de baja con su historial; no se borra.`} onCancelar={onCancelar}>
      <form className="grid gap-4" noValidate aria-busy={enviando}
        onSubmit={(e) => { e.preventDefault(); setIntentado(true); if (motivo.trim()) void ejecutar(() => onConfirmar(motivo.trim())); }}>
        <BloqueError texto={error} />
        <label className="grid gap-1.5 text-sm font-bold text-ink">
          <span>Motivo<Obligatorio /></span>
          <input type="text" maxLength={1000} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={CAMPO}
            aria-required="true" aria-invalid={Boolean(errMotivo)} aria-describedby={errMotivo ? "retiro-motivo-error" : undefined} />
          <ErrorCampo id="retiro-motivo-error" texto={errMotivo} />
        </label>
        <DialogFooter>
          <button type="button" className={BOTON_SECUNDARIO} onClick={onCancelar} disabled={enviando}>Cancelar</button>
          <button type="submit" className={BOTON_PRIMARIO} aria-busy={enviando} disabled={enviando}>{enviando ? "Retirando…" : "Retirar interés"}</button>
        </DialogFooter>
      </form>
    </Marco>
  );
}
