"use client";

import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import type { EstadoOutbox } from "@/application/compartido/outbox-estado";
import {
  ACCIONES_FLUJO,
  DISPARADORES,
  NOMBRES_ACCION,
  NOMBRES_DISPARADOR,
  PLANTILLAS_FLUJO,
  validarFlujo,
  type BorradorFlujo,
} from "@/application/reportes/automatizaciones";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOnline } from "../_ui/analytics-state";
import { PageHeader } from "../_ui/prototipo-ui";
import { ModuleTabs } from "@/components/modulo";
import { AUTOMATIZACIONES_TABS, type AutomatizacionesTab } from "./_tabs";
import { LEAD_EJEMPLO } from "./_ejemplo";
import { Combobox } from "@/components/ui/combobox";
import {
  Bot,
  AlertTriangle,
  ArrowRight,
  Clock,
  Play,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export function AutomatizacionesVista({
  cola,
  puedeEditar,
  tab,
}: {
  cola: EstadoOutbox | null;
  puedeEditar: boolean;
  tab: AutomatizacionesTab;
}) {
  const online = useOnline();
  const router = useRouter();
  const [borrador, setBorrador] = useState<BorradorFlujo>({
    ...PLANTILLAS_FLUJO[0]!,
    acciones: [...PLANTILLAS_FLUJO[0]!.acciones],
  });
  const [locales, setLocales] = useState<BorradorFlujo[]>([]);
  const [aviso, setAviso] = useState("");
  const [dialogo, setDialogo] = useState<"activar" | "reintentar" | "copiloto" | null>(null);
  const [tipoAyuda, setTipoAyuda] = useState("resumen");
  const [texto, setTexto] = useState("");
  const [revisado, setRevisado] = useState(false);
  const bloqueado = !online || !puedeEditar;

  function guardar() {
    const r = validarFlujo(borrador);
    if (!r.ok) {
      setAviso(r.errores.join(" "));
      return;
    }
    setLocales((l) => [...l, r.borrador]);
    setAviso(
      "Borrador guardado en memoria de esta pestaña. No está activado ni persistido; falta el motor de automatizaciones."
    );
  }

  const opcionesDisparador = useMemo(
    () =>
      DISPARADORES.map((d) => ({
        value: d,
        label: NOMBRES_DISPARADOR[d] ?? d,
      })),
    []
  );

  const opcionesPlantilla = useMemo(
    () => [
      { value: "0", label: "Bienvenida desde Meta (Lead nuevo)" },
      { value: "1", label: "Seguimiento sin próxima acción agendada" },
    ],
    []
  );

  const opcionesCopiloto = useMemo(
    () => [
      { value: "resumen", label: "Resumen ejecutivo del lead" },
      { value: "accion", label: "Recomendar próxima acción comercial" },
      { value: "respuesta", label: "Borrador de respuesta personalizada" },
    ],
    []
  );

  return (
    <main className="space-y-6 min-w-0">
      <PageHeader
        eyebrow="Operaciones & Motor de Flujos"
        title="Automatizaciones y copiloto"
        subtitle="Diseña el seguimiento automatizado y supervisa la cola de mensajería y eventos en tiempo real."
      />

      {/* Avisos de conectividad o permisos */}
      {!online && (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 text-xs sm:text-[13px] text-amber-950 flex items-center gap-2.5"
        >
          <AlertTriangle className="size-4 text-amber-700 shrink-0" />
          <span>Sin conexión. Conservamos la información cargada. Guardar, actualizar y solicitar acciones están en pausa.</span>
        </div>
      )}

      {!puedeEditar && (
        <div
          role="status"
          className="rounded-xl border border-slate-200 bg-surface-alt p-3.5 text-xs sm:text-[13px] text-muted-foreground flex items-center gap-2.5"
        >
          <Clock className="size-4 text-slate-500 shrink-0" />
          <span>Permiso de consulta: tu alcance no permite preparar cambios ni solicitar acciones.</span>
        </div>
      )}

      <ModuleTabs label="Secciones de automatizaciones" queryParam="tab" activeTab={tab} panelId="automatizaciones-panel" className="mb-0" items={AUTOMATIZACIONES_TABS.map(({ id, label }) => ({ href: "/automatizaciones", label, value: id }))} />
      <div role="tabpanel" id="automatizaciones-panel" aria-labelledby={`automatizaciones-panel-tab-${tab}`} tabIndex={0}>


      {aviso && (
        <div
          role="status"
          className="rounded-xl border border-gold-300 bg-gold-50/80 p-3.5 text-xs sm:text-[13px] text-gold-950 flex items-center justify-between gap-3 animate-in fade-in duration-150"
        >
          <span>{aviso}</span>
          <button
            type="button"
            onClick={() => setAviso("")}
            className="text-xs font-bold text-gold-800 hover:text-gold-950 underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* PESTAÑA 1: CONSTRUCTOR */}
      {tab === "constructor" && (
        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-xl font-heading font-bold text-navy-950 m-0">
              Constructor de flujos automatizados
            </h2>
            <p className="text-xs sm:text-[13px] text-ink-muted mt-1 m-0">
              Vista previa · datos de ejemplo — falta: reglas persistentes, motor de ejecución, permisos de cada acción y revisión humana. Ningún flujo está activo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-alt/50 p-4 rounded-xl border border-line">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Cargar desde plantilla
              </label>
              <Combobox
                options={opcionesPlantilla}
                value="0"
                onChange={(val) => {
                  const p = PLANTILLAS_FLUJO[Number(val)];
                  if (p) setBorrador({ ...p, acciones: [...p.acciones] });
                }}
                placeholder="Seleccionar plantilla predefinida..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Nombre del flujo operativo
              </label>
              <input
                className="w-full min-h-[44px] px-3.5 text-xs sm:text-[13px] rounded-lg border border-line bg-surface focus:border-gold-600 focus:outline-none transition-colors"
                maxLength={100}
                value={borrador.nombre}
                onChange={(e) => setBorrador({ ...borrador, nombre: e.target.value })}
                disabled={bloqueado}
                placeholder="Ej. Notificar al broker asignado..."
              />
            </div>
          </div>

          {/* Tres pasos visuales del flujo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <fieldset className="rounded-xl border border-line bg-surface p-4 space-y-3">
              <legend className="text-xs font-bold text-navy-950 px-2 uppercase tracking-wider flex items-center gap-1.5">
                <span className="size-5 rounded-full bg-navy-950 text-white text-[11px] inline-flex items-center justify-center font-bold">1</span>
                <span>Disparador (Trigger)</span>
              </legend>
              <label className="block text-xs text-muted-foreground">
                Evento que activa la ejecución:
              </label>
              <Combobox
                options={opcionesDisparador}
                value={borrador.disparador}
                disabled={bloqueado}
                onChange={(val) => {
                  if (val) {
                    setBorrador({
                      ...borrador,
                      disparador: val as BorradorFlujo["disparador"],
                    });
                  }
                }}
                placeholder="Seleccionar disparador..."
                className="w-full"
              />
            </fieldset>

            <fieldset className="rounded-xl border border-line bg-surface p-4 space-y-3">
              <legend className="text-xs font-bold text-navy-950 px-2 uppercase tracking-wider flex items-center gap-1.5">
                <span className="size-5 rounded-full bg-navy-950 text-white text-[11px] inline-flex items-center justify-center font-bold">2</span>
                <span>Condición de filtrado</span>
              </legend>
              <label className="block text-xs text-muted-foreground">
                Regla que debe cumplirse:
              </label>
              <textarea
                aria-label="Condición"
                className="min-h-[88px] w-full rounded-lg border border-line bg-surface p-3 text-xs sm:text-[13px] focus:border-gold-600 focus:outline-none"
                maxLength={500}
                value={borrador.condicion}
                disabled={bloqueado}
                onChange={(e) => setBorrador({ ...borrador, condicion: e.target.value })}
                placeholder="Ej. El lead proviene de Meta y no tiene broker..."
              />
            </fieldset>

            <fieldset className="rounded-xl border border-line bg-surface p-4 space-y-3">
              <legend className="text-xs font-bold text-navy-950 px-2 uppercase tracking-wider flex items-center gap-1.5">
                <span className="size-5 rounded-full bg-navy-950 text-white text-[11px] inline-flex items-center justify-center font-bold">3</span>
                <span>Acciones en orden</span>
              </legend>
              <div className="space-y-2">
                {ACCIONES_FLUJO.map((a) => (
                  <label
                    className="flex min-h-[38px] items-center gap-2.5 text-xs sm:text-[13px] text-ink cursor-pointer hover:bg-surface-alt p-1 rounded-md"
                    key={a}
                  >
                    <Checkbox
                      disabled={bloqueado}
                      checked={borrador.acciones.includes(a)}
                      onCheckedChange={(checked) =>
                        setBorrador({
                          ...borrador,
                          acciones: checked
                            ? [...borrador.acciones, a]
                            : borrador.acciones.filter((x) => x !== a),
                        })
                      }
                    />
                    <span>{NOMBRES_ACCION[a]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Resumen secuencial de la cadena */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-gold-50/90 to-amber-50/50 border border-gold-200">
            <span className="text-[11px] uppercase tracking-wider font-bold text-gold-900 block mb-1">
              Secuencia configurada:
            </span>
            <p
              aria-label="Secuencia del flujo"
              className="text-xs sm:text-[13px] font-semibold text-ink m-0 flex flex-wrap items-center gap-2"
            >
              <span className="px-2.5 py-1 rounded-md bg-white border border-gold-300 text-navy-950">
                {NOMBRES_DISPARADOR[borrador.disparador]}
              </span>
              <ArrowRight className="size-3.5 text-gold-700" />
              <span className="px-2.5 py-1 rounded-md bg-white border border-gold-300 text-ink">
                {borrador.condicion || "Condición pendiente"}
              </span>
              <ArrowRight className="size-3.5 text-gold-700" />
              <span className="px-2.5 py-1 rounded-md bg-white border border-gold-300 text-navy-950">
                {borrador.acciones.map((a) => NOMBRES_ACCION[a]).join(" → ") || "Sin acciones"}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={bloqueado}
              className="button secondary min-h-[44px] px-5 text-xs sm:text-[13px] font-bold cursor-pointer disabled:opacity-50"
              onClick={guardar}
            >
              Conservar borrador de sesión
            </button>
            <button
              type="button"
              disabled={bloqueado}
              className="button primary min-h-[44px] px-5 text-xs sm:text-[13px] font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              onClick={() => setDialogo("activar")}
            >
              <Play className="size-3.5 text-gold-400" />
              <span>Revisar activación</span>
            </button>
          </div>

          {/* Historial de borradores en memoria */}
          <div className="border-t border-line pt-4 space-y-2">
            <h3 className="text-sm font-bold text-navy-950 m-0">
              Borradores de esta sesión ({locales.length})
            </h3>
            {locales.length ? (
              <ul className="divide-y divide-line rounded-xl border border-line bg-surface p-0 m-0 list-none">
                {locales.map((l, i) => (
                  <li
                    key={i}
                    className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-[13px]"
                  >
                    <div>
                      <strong className="text-ink">{l.nombre}</strong>
                      <span className="text-muted-foreground ml-2">· sin activar en producción</span>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
                      onClick={() => setLocales(locales.filter((_, j) => j !== i))}
                    >
                      Quitar borrador
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground m-0">No hay borradores conservados.</p>
            )}
          </div>
        </section>
      )}

      {/* PESTAÑA 2: MONITOR REAL */}
      {tab === "monitor" && (
        <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-xl font-heading font-bold text-navy-950 m-0">
                Monitor de ejecuciones y outbox
              </h2>
              <p className="text-xs sm:text-[13px] text-ink-muted mt-1 m-0">
                Conteos reales del outbox en el momento de cargar. No prueban que el worker esté ejecutándose.
              </p>
            </div>
            <button
              className="button secondary min-h-[40px] px-3.5 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              type="button"
              disabled={!online}
              onClick={() => router.refresh()}
            >
              <RefreshCw className="size-3.5 text-muted-foreground" />
              <span>Actualizar conteos</span>
            </button>
          </div>

          {cola ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 m-0">
              {([
                ["Pendientes", cola.pendientes, "bg-amber-500", "text-amber-900", "border-amber-200"],
                ["Enviados", cola.enviados, "bg-emerald-500", "text-emerald-900", "border-emerald-200"],
                ["Fallidos / cola muerta", cola.fallidos, "bg-rose-500", "text-rose-900", "border-rose-200"],
                ["Sin consumidor", cola.sinConsumidor, "bg-slate-400", "text-slate-900", "border-slate-200"],
              ] as [string, number, string, string, string][]).map(([k, v, dot, textCol, borderCol]) => (
                <div
                  key={String(k)}
                  className={`rounded-xl border ${borderCol} bg-surface-alt p-4 flex flex-col justify-between gap-2 shadow-2xs`}
                >
                  <dt className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${dot}`} />
                    <span>{k}</span>
                  </dt>
                  <dd className={`text-3xl font-extrabold font-heading tabular-nums ${textCol} m-0`}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <div role="alert" className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-900 text-xs sm:text-[13px]">
              No se pudo leer la cola. No se sustituyen sus conteos por ceros.
            </div>
          )}

          <div className="rounded-xl border border-line bg-surface-alt p-4 space-y-1.5 text-xs sm:text-[13px]">
            <p className="m-0 text-ink">
              <strong>Último envío registrado:</strong>{" "}
              {cola?.ultimoEnviadoAt
                ? new Intl.DateTimeFormat("es-DO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "America/Santo_Domingo",
                  }).format(new Date(cola.ultimoEnviadoAt))
                : "Sin registro disponible"}
              .
            </p>
            <p className="m-0 text-muted-foreground">
              El detalle por evento y la acción de reintentar requieren un contrato administrativo adicional. No se expone payload ni datos personales.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              className="button secondary min-h-[44px] px-5 text-xs sm:text-[13px] font-bold cursor-pointer disabled:opacity-50"
              type="button"
              disabled={bloqueado || !cola || cola.fallidos === 0}
              onClick={() => setDialogo("reintentar")}
            >
              Revisar reintentos de fallidos
            </button>
          </div>
        </section>
      )}

      {/* PESTAÑA 3: COPILOTO CON SUPERVISIÓN */}
      {tab === "copiloto" && (
        <aside className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-2xs space-y-5 max-w-3xl">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-navy-950 text-gold-400 border border-gold-500/30">
              <Bot className="size-5" />
            </span>
            <div>
              <h2 className="text-xl font-heading font-bold text-navy-950 m-0">
                Copiloto con supervisión humana
              </h2>
              <p className="text-xs sm:text-[13px] text-ink-muted mt-0.5 m-0">
                Vista previa · datos de ejemplo — falta: proveedor IA, contexto autorizado, cola de revisión y envío. Ningún dato real se comparte.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-surface-alt p-4 space-y-3">
            <label className="block text-xs font-bold text-ink">
              Ayuda solicitada al copiloto
            </label>
            <Combobox
              options={opcionesCopiloto}
              value={tipoAyuda}
              onChange={setTipoAyuda}
              placeholder="Seleccionar tipo de asistencia..."
            />

            <div className="p-3 rounded-lg bg-surface border border-line text-xs space-y-1">
              <span className="font-bold text-navy-950 block">Lead de contexto (ejemplo tipado):</span>
              <p className="text-muted-foreground m-0">
                {LEAD_EJEMPLO.nombre} · Interés: {LEAD_EJEMPLO.interes} · Canal: {LEAD_EJEMPLO.canal}.
              </p>
            </div>

            <button
              className="button primary min-h-[44px] px-5 text-xs sm:text-[13px] font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 w-full sm:w-auto justify-center"
              type="button"
              disabled={bloqueado}
              onClick={() => {
                setRevisado(false);
                setTexto(
                  tipoAyuda === "resumen"
                    ? LEAD_EJEMPLO.nombre +
                        ": interés en " +
                        LEAD_EJEMPLO.interes +
                        ". Condiciones por confirmar."
                    : tipoAyuda === "accion"
                    ? LEAD_EJEMPLO.proximaAccion
                    : "Gracias por tu consulta. ¿Podemos confirmar tus preferencias antes de proponerte opciones?"
                );
              }}
            >
              <Sparkles className="size-3.5 text-gold-400" />
              <span>Preparar ejemplo para revisión</span>
            </button>
          </div>

          {texto && (
            <div className="space-y-4 pt-2 border-t border-line">
              <label className="block space-y-1.5">
                <span className="block text-xs font-bold text-navy-950">
                  Borrador editable generado por el asistente
                </span>
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-line bg-surface p-3.5 text-xs sm:text-[13px] leading-relaxed focus:border-gold-600 focus:outline-none"
                  value={texto}
                  onChange={(e) => {
                    setTexto(e.target.value);
                    setRevisado(false);
                  }}
                />
              </label>

              <label className="flex min-h-[44px] items-center gap-2.5 text-xs sm:text-[13px] font-semibold text-ink cursor-pointer bg-surface-alt p-3 rounded-xl border border-line">
                <Checkbox
                  checked={revisado}
                  onCheckedChange={setRevisado}
                  className="size-4 accent-gold-600 rounded"
                />
                <span>He revisado y verificado este borrador de ejemplo</span>
              </label>

              <button
                type="button"
                className="button primary min-h-[44px] px-5 text-xs sm:text-[13px] font-bold cursor-pointer disabled:opacity-50"
                disabled={bloqueado || !revisado || !texto.trim()}
                onClick={() => setDialogo("copiloto")}
              >
                Revisar envío supervisado
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Modal accesible de diálogo de operaciones */}
      </div>
      <Dialog
        open={dialogo !== null}
        onOpenChange={(open) => {
          if (!open) setDialogo(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogo === "activar"
                ? "Revisión de activación"
                : dialogo === "reintentar"
                ? "Revisar eventos fallidos"
                : "Envío supervisado"}
            </DialogTitle>
            <DialogDescription>
              Esta operación no está conectada a un servicio de escritura.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-3.5 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              setAviso(
                dialogo === "activar"
                  ? "No se activó el flujo. Falta el motor persistente y la autorización de sus acciones."
                  : dialogo === "reintentar"
                  ? "No se enviaron reintentos. Falta un contrato administrativo de reintento; la cola quedó intacta."
                  : "No se envió ningún mensaje ni se registró aprobación. Falta la cola humana auditada y el proveedor autorizado."
              );
              setDialogo(null);
            }}
          >
            <label className="block text-xs sm:text-[13px] font-semibold text-ink">
              <span className="block mb-1">Motivo de revisión</span>
              <textarea
                required
                maxLength={500}
                className="w-full min-h-[80px] p-2.5 rounded-lg border border-line bg-surface text-xs sm:text-[13px]"
                placeholder="Indica el motivo o contexto para esta solicitud..."
              />
            </label>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                className="button primary min-h-[44px] flex-1 text-xs sm:text-[13px] font-bold cursor-pointer disabled:opacity-50"
                disabled={bloqueado}
                type="submit"
              >
                Consultar disponibilidad
              </button>
              <button
                className="button secondary min-h-[44px] px-4 text-xs font-semibold cursor-pointer"
                type="button"
                onClick={() => setDialogo(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
