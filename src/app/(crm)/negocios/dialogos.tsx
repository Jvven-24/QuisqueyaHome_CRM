"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { centavosAUnidad, unidadACentavos } from "../_ui/formato";
import { enviarJson, type RespuestaApi } from "./api";
import type { EtapaConRequisito, MotivoPerdida, NegocioFila, PropiedadDeal, ProyectoOpcion } from "./logica";

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
  return { enviando, error, ejecutar, estaEnviando: () => enCurso.current };
}

function Marco({ titulo, descripcion, onCancelar, children, enviando, estaEnviando }: { titulo: string; descripcion: string; onCancelar: () => void; children: ReactNode; enviando: boolean; estaEnviando: () => boolean }) {
  return (
    <Dialog open onOpenChange={(abierto) => { if (!abierto && !estaEnviando()) onCancelar(); }}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto" aria-busy={enviando}
        onEscapeKeyDown={(e) => { if (estaEnviando()) e.preventDefault(); }}
        onInteractOutside={(e) => { if (estaEnviando()) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        {enviando && <p role="status" className="m-0 text-sm text-ink-muted">Guardando. Espera la respuesta antes de cerrar o salir; la operación ya fue enviada al servidor.</p>}
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
  const { enviando, error, ejecutar, estaEnviando } = useEnvio();
  const errMotivo = intentado && !motivoId ? "Elige un motivo." : undefined;
  const errComentario = intentado && !comentario.trim() ? "Escribe un comentario." : undefined;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    setIntentado(true);
    if (!motivoId || !comentario.trim()) return;
    void ejecutar(() => onConfirmar(Number(motivoId), comentario.trim()));
  }

  return (
    <Marco titulo="Marcar negocio como no concretado" descripcion={`El negocio de ${contacto} se archiva; el contacto sigue disponible para volver a contactarlo.`} onCancelar={onCancelar} enviando={enviando} estaEnviando={estaEnviando}>
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
          <button type="button" className={BOTON_SECUNDARIO} onClick={() => { if (!estaEnviando()) onCancelar(); }} disabled={enviando}>Cancelar</button>
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
  const { enviando, error, ejecutar, estaEnviando } = useEnvio();

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
      descripcion={`Negocio de ${negocio.contactName} · etapa ${nombreEtapa}. Hace falta una unidad concreta del proyecto.`} onCancelar={onCancelar} enviando={enviando} estaEnviando={estaEnviando}>
      {!principal ? (
        <div className="grid gap-4">
          <p role="alert" className="m-0 rounded-lg border border-warning/40 bg-warning-bg p-3 text-sm text-warning">
            Este negocio no tiene un proyecto principal. Agrega un proyecto de interés y márcalo como principal en la ficha; después vuelve a cerrar.
          </p>
          <DialogFooter><button type="button" className={BOTON_SECUNDARIO} onClick={() => { if (!estaEnviando()) onCancelar(); }}>Entendido</button></DialogFooter>
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
            <RadioGroup aria-label="Modo de unidad" value={modo} onValueChange={(value) => setModo(value as typeof modo)} className="gap-1">
            {unidades.length > 0 && (
              <label className="flex min-h-12 cursor-pointer items-center gap-2 text-sm text-ink">
                <RadioGroupItem value="elegir" />
                <span>Elegir unidad</span>
              </label>
            )}
            <label className="flex min-h-12 cursor-pointer items-center gap-2 text-sm text-ink"><RadioGroupItem value="crear" /><span>Crear unidad</span></label>
            </RadioGroup>
            {modo === "elegir" && unidades.length > 0 && (
              <select aria-label="Unidad del proyecto" value={unidadId} onChange={(e) => setUnidadId(e.target.value)} className={CAMPO}
                aria-invalid={Boolean(errUnidad)} aria-describedby={errUnidad ? "cierre-unidad-error" : undefined}>
                <option value="">Selecciona una unidad…</option>
                {unidades.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
              </select>
            )}
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
            <button type="button" className={BOTON_SECUNDARIO} onClick={() => { if (!estaEnviando()) onCancelar(); }} disabled={enviando}>Cancelar</button>
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
  const { enviando, error, ejecutar, estaEnviando } = useEnvio();
  const errMotivo = intentado && !motivo.trim() ? "Escribe el motivo del retiro." : undefined;
  return (
    <Marco titulo="Retirar interés" descripcion={`${descripcionInteres}. El interés queda dado de baja con su historial; no se borra.`} onCancelar={onCancelar} enviando={enviando} estaEnviando={estaEnviando}>
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
          <button type="button" className={BOTON_SECUNDARIO} onClick={() => { if (!estaEnviando()) onCancelar(); }} disabled={enviando}>Cancelar</button>
          <button type="submit" className={BOTON_PRIMARIO} aria-busy={enviando} disabled={enviando}>{enviando ? "Retirando…" : "Retirar interés"}</button>
        </DialogFooter>
      </form>
    </Marco>
  );
}

/* --------------- Completar el requisito de una etapa y mover --------------- */

const TIPOS_CONTACTO: { valor: "call" | "whatsapp" | "email" | "meeting"; etiqueta: string }[] = [
  { valor: "call", etiqueta: "Llamada" },
  { valor: "whatsapp", etiqueta: "WhatsApp" },
  { valor: "email", etiqueta: "Correo" },
  { valor: "meeting", etiqueta: "Reunión" },
];

async function guardarActividad(cuerpo: Record<string, unknown>): Promise<ResultadoEnvio> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return { ok: false, error: "Sin conexión a internet. No se guardó nada; lo que escribiste sigue aquí." };
  try {
    const respuesta = await fetch("/api/actividades", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(cuerpo) });
    if (respuesta.ok) return { ok: true };
    const datos = (await respuesta.json().catch(() => ({}))) as { error?: string };
    if (respuesta.status === 403) return { ok: false, error: "Tu rol no tiene permiso para registrar actividades." };
    return { ok: false, error: datos.error ?? "No se pudo guardar la actividad. Revisa los datos." };
  } catch {
    return { ok: false, error: "No se pudo contactar al servidor. No se confirmó ningún cambio; reintenta." };
  }
}

function aResultado(r: RespuestaApi): ResultadoEnvio {
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export function DialogoRequisito({ slug, nombreEtapa, negocio, proyectos, onGuardado, onCancelar, onAbrirNegocio }: {
  slug: EtapaConRequisito;
  nombreEtapa: string;
  negocio: NegocioFila;
  proyectos: ProyectoOpcion[];
  /** Se llama tras guardar el dato: reintenta el movimiento y devuelve su resultado. */
  onGuardado: () => Promise<ResultadoEnvio>;
  onCancelar: () => void;
  onAbrirNegocio: () => void;
}) {
  const { enviando, error, ejecutar, estaEnviando } = useEnvio();
  const [intentado, setIntentado] = useState(false);
  // contactado
  const [tipo, setTipo] = useState<(typeof TIPOS_CONTACTO)[number]["valor"]>("call");
  const [asunto, setAsunto] = useState("");
  // presentacion
  const [fecha, setFecha] = useState("");
  // preseleccion
  const [proyectoId, setProyectoId] = useState(proyectos[0] ? String(proyectos[0].id) : "");
  const [unidadId, setUnidadId] = useState("");
  // negociacion
  const [monto, setMonto] = useState(String(centavosAUnidad(negocio.amountCents ?? null)));
  const [probabilidad, setProbabilidad] = useState(negocio.probability === null ? "" : String(negocio.probability));
  const [comision, setComision] = useState(negocio.commissionBasisPoints == null ? "" : String(negocio.commissionBasisPoints / 100));
  const [cierre, setCierre] = useState(negocio.expectedCloseDate ?? "");

  const centavos = unidadACentavos(monto);
  const prob = probabilidad.trim() === "" ? null : Number(probabilidad);
  const com = comision.trim() === "" ? null : Number(comision);
  const errores: Record<string, string | undefined> = {};
  if (slug === "contactado" && !asunto.trim()) errores.asunto = "Escribe de qué trató el contacto.";
  if (slug === "presentacion") {
    if (!asunto.trim()) errores.asunto = "Escribe cuál es la próxima acción.";
    if (!fecha) errores.fecha = "Indica la fecha y hora de la próxima acción.";
    else if (Number.isNaN(new Date(fecha).getTime())) errores.fecha = "La fecha no es válida.";
  }
  if (slug === "preseleccion" && !proyectoId) errores.proyecto = "Elige el proyecto de interés.";
  if (slug === "negociacion") {
    if (centavos === null || centavos <= 0) errores.monto = "Indica el monto comercial.";
    if (prob === null || !Number.isInteger(prob) || prob < 0 || prob > 100) errores.probabilidad = "Indica un porcentaje entero entre 0 y 100.";
    if (com === null || !Number.isFinite(com) || com < 0 || com > 100) errores.comision = "Indica la comisión como porcentaje, de 0 a 100.";
    if (!cierre) errores.cierre = "Indica la fecha estimada de cierre.";
  }
  const hayErrores = Object.values(errores).some(Boolean);
  const unidades = proyectos.find((p) => String(p.id) === proyectoId)?.unidades ?? [];
  const sinProyectos = slug === "preseleccion" && proyectos.length === 0;

  async function guardar(): Promise<ResultadoEnvio> {
    let guardado: ResultadoEnvio;
    if (slug === "contactado") {
      guardado = await guardarActividad({ activityType: tipo, title: asunto.trim(), dealId: negocio.id, contactId: negocio.contactId, status: "completed" });
    } else if (slug === "presentacion") {
      guardado = await guardarActividad({
        activityType: "task", title: asunto.trim(), dealId: negocio.id, contactId: negocio.contactId, status: "pending", priority: "high",
        startsAt: new Date(fecha).toISOString(), ...(negocio.brokerId ? { assigneeId: negocio.brokerId } : {}),
      });
    } else if (slug === "preseleccion") {
      guardado = aResultado(await enviarJson(`${negocio.id}/propiedades`, "POST", { projectId: Number(proyectoId), ...(unidadId ? { unitId: Number(unidadId) } : {}), isPrimary: true }));
    } else {
      guardado = aResultado(await enviarJson(`${negocio.id}`, "PATCH", { amountCents: centavos, probability: prob, commissionBasisPoints: Math.round((com ?? 0) * 100), expectedCloseDate: cierre }));
    }
    if (!guardado.ok) return guardado;
    return onGuardado();
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    setIntentado(true);
    if (hayErrores || sinProyectos) return;
    void ejecutar(guardar);
  }

  const mostrar = (campo: string) => (intentado ? errores[campo] : undefined);
  const textos: Record<EtapaConRequisito, { titulo: string; que: string; boton: string }> = {
    contactado: { titulo: "Registrar el contacto", que: "Para pasar a Contactado hace falta registrar al menos una actividad de contacto ya realizada.", boton: "Registrar y mover" },
    presentacion: { titulo: "Agendar la próxima acción", que: "Para pasar a Presentación hace falta una próxima acción con responsable y fecha.", boton: "Agendar y mover" },
    preseleccion: { titulo: "Elegir la propiedad de interés", que: "Para pasar a Preselección hace falta al menos una propiedad de interés.", boton: "Agregar y mover" },
    negociacion: { titulo: "Completar los datos de la negociación", que: "Para pasar a Negociación hacen falta el monto, la probabilidad, la comisión y la fecha estimada de cierre.", boton: "Guardar y mover" },
  };
  const t = textos[slug];

  return (
    <Marco titulo={t.titulo} descripcion={`${negocio.contactName} · se moverá a ${nombreEtapa} al guardar. ${t.que}`} onCancelar={onCancelar} enviando={enviando} estaEnviando={estaEnviando}>
      {sinProyectos ? (
        <div className="grid gap-4">
          <p role="alert" className="m-0 rounded-lg border border-warning/40 bg-warning-bg p-3 text-sm text-warning">
            Abre el negocio, agrega una propiedad de interés en la pestaña Propiedades y vuelve a moverlo.
          </p>
          <DialogFooter>
            <button type="button" className={BOTON_SECUNDARIO} onClick={onCancelar}>Cancelar</button>
            <button type="button" className={BOTON_PRIMARIO} onClick={onAbrirNegocio}>Abrir negocio</button>
          </DialogFooter>
        </div>
      ) : (
        <form onSubmit={enviar} className="grid gap-4" noValidate aria-busy={enviando}>
          <BloqueError texto={error} />
          {slug === "contactado" && (
            <>
              <label className="grid gap-1.5 text-sm font-bold text-ink">
                <span>Tipo de contacto<Obligatorio /></span>
                <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className={CAMPO} autoFocus>
                  {TIPOS_CONTACTO.map((x) => <option key={x.valor} value={x.valor}>{x.etiqueta}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-ink">
                <span>Qué se habló<Obligatorio /></span>
                <input value={asunto} onChange={(e) => setAsunto(e.target.value)} className={CAMPO} placeholder="Ej. Primera llamada: quiere ver unidades de 2 habitaciones"
                  aria-required="true" aria-invalid={Boolean(mostrar("asunto"))} aria-describedby={mostrar("asunto") ? "req-asunto-error" : undefined} />
                <ErrorCampo id="req-asunto-error" texto={mostrar("asunto")} />
              </label>
            </>
          )}
          {slug === "presentacion" && (
            <>
              <label className="grid gap-1.5 text-sm font-bold text-ink">
                <span>Próxima acción<Obligatorio /></span>
                <input value={asunto} onChange={(e) => setAsunto(e.target.value)} className={CAMPO} placeholder="Ej. Presentar el proyecto en la sala de ventas" autoFocus
                  aria-required="true" aria-invalid={Boolean(mostrar("asunto"))} aria-describedby={mostrar("asunto") ? "req-asunto-error" : undefined} />
                <ErrorCampo id="req-asunto-error" texto={mostrar("asunto")} />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-ink">
                <span>Fecha y hora<Obligatorio /></span>
                <input type="datetime-local" value={fecha} onChange={(e) => setFecha(e.target.value)} className={CAMPO}
                  aria-required="true" aria-invalid={Boolean(mostrar("fecha"))} aria-describedby={mostrar("fecha") ? "req-fecha-error" : undefined} />
                <ErrorCampo id="req-fecha-error" texto={mostrar("fecha")} />
              </label>
              <p className="m-0 text-[13px] text-ink-muted">Responsable: {negocio.brokerName ?? "tú, que estás agendándola"}.</p>
            </>
          )}
          {slug === "preseleccion" && (
            <>
              <label className="grid gap-1.5 text-sm font-bold text-ink">
                <span>Proyecto<Obligatorio /></span>
                <select value={proyectoId} onChange={(e) => { setProyectoId(e.target.value); setUnidadId(""); }} className={CAMPO} autoFocus
                  aria-required="true" aria-invalid={Boolean(mostrar("proyecto"))} aria-describedby={mostrar("proyecto") ? "req-proyecto-error" : undefined}>
                  {proyectos.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <ErrorCampo id="req-proyecto-error" texto={mostrar("proyecto")} />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-ink">
                <span>Unidad (opcional)</span>
                <select value={unidadId} onChange={(e) => setUnidadId(e.target.value)} className={CAMPO}>
                  <option value="">Interés general en el proyecto</option>
                  {unidades.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
                </select>
              </label>
            </>
          )}
          {slug === "negociacion" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-bold text-ink">
                <span>Monto comercial ({negocio.currency})<Obligatorio /></span>
                <input type="number" min="0" step="1" inputMode="numeric" value={monto} onChange={(e) => setMonto(e.target.value)} className={CAMPO} autoFocus
                  aria-required="true" aria-invalid={Boolean(mostrar("monto"))} aria-describedby={mostrar("monto") ? "req-monto-error" : undefined} />
                <ErrorCampo id="req-monto-error" texto={mostrar("monto")} />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-ink">
                <span>Probabilidad de cierre (%)<Obligatorio /></span>
                <input type="number" min="0" max="100" step="1" inputMode="numeric" value={probabilidad} onChange={(e) => setProbabilidad(e.target.value)} className={CAMPO}
                  aria-required="true" aria-invalid={Boolean(mostrar("probabilidad"))} aria-describedby={mostrar("probabilidad") ? "req-prob-error" : undefined} />
                <ErrorCampo id="req-prob-error" texto={mostrar("probabilidad")} />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-ink">
                <span>Comisión (%)<Obligatorio /></span>
                <input type="number" min="0" max="100" step="0.01" inputMode="decimal" value={comision} onChange={(e) => setComision(e.target.value)} className={CAMPO}
                  aria-required="true" aria-invalid={Boolean(mostrar("comision"))} aria-describedby={mostrar("comision") ? "req-com-error" : undefined} />
                <ErrorCampo id="req-com-error" texto={mostrar("comision")} />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-ink">
                <span>Fecha estimada de cierre<Obligatorio /></span>
                <input type="date" value={cierre} onChange={(e) => setCierre(e.target.value)} className={CAMPO}
                  aria-required="true" aria-invalid={Boolean(mostrar("cierre"))} aria-describedby={mostrar("cierre") ? "req-cierre-error" : undefined} />
                <ErrorCampo id="req-cierre-error" texto={mostrar("cierre")} />
              </label>
            </div>
          )}
          <DialogFooter>
            <button type="button" className={BOTON_SECUNDARIO} onClick={() => { if (!estaEnviando()) onCancelar(); }} disabled={enviando}>Cancelar</button>
            <button type="submit" className={BOTON_PRIMARIO} aria-busy={enviando} disabled={enviando}>{enviando ? "Guardando…" : t.boton}</button>
          </DialogFooter>
        </form>
      )}
    </Marco>
  );
}
