"use client";
import { Checkbox } from "@/components/ui/checkbox";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { PhoneInput } from "@/components/ui/phone-input";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import type { Canal } from "./vista";
import {
  CheckCircle2,
  Loader2,
  Mic,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

type PropuestaExtraida = {
  transcripcion: string;
  fuenteMotor: "groq_whisper" | "texto_directo" | "fallback_local";
  datos: {
    fullName: string | null;
    phone: string | null;
    email?: string | null;
    zoneInterest: string | null;
    projectInterestText: string | null;
    operationType: "sale" | "rent";
    budgetMinCents: number | null;
    budgetMaxCents: number | null;
    currency: "USD" | "DOP";
    sugerenciaActividad: string | null;
    confianza: number;
    notasResumen: string;
  };
};

const EJEMPLOS_CAMPO = [
  {
    etiqueta: "Inversionista Miami · Cap Cana",
    texto:
      "Hablé con Roberto Rosario desde Miami al +1 (305) 555-0144 correo roberto@rosario.com, quiere una villa en Cap Cana entre 600 y 800 mil dólares, quedamos en enviar brochure hoy y agendar videollamada el jueves.",
  },
  {
    etiqueta: "Comprador Local · Bávaro Cana Rock",
    texto:
      "Tengo a Carlos Peña al 809-555-0184, le interesa un apartamento en Bávaro en Cana Rock, tiene unos 185 mil dólares de presupuesto, llamarlo el viernes por la mañana.",
  },
  {
    etiqueta: "Diáspora Madrid · Piantini",
    texto:
      "Cliente Elena Vázquez al +34 612 34 56 78 busca apartamento en Piantini Santo Domingo presupuesto 320 mil dólares, enviar cotización Confotur esta tarde.",
  },
];

export function NotaDeVozLeadModal({
  canales,
  onClose,
}: {
  canales: Canal[];
  onClose: () => void;
}) {
  const router = useRouter();
  const modalRef = useFocusTrap<HTMLElement>({ onClose });
  const formRef = useRef<HTMLFormElement>(null);

  const [notaTexto, setNotaTexto] = useState(EJEMPLOS_CAMPO[0]!.texto);
  const [analizando, setAnalizando] = useState(false);
  const [propuesta, setPropuesta] = useState<PropuestaExtraida | null>(null);
  const [crearTareaSugerida, setCrearTareaSugerida] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analizarNota() {
    if (!notaTexto.trim() || analizando) return;
    setAnalizando(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/audio-transcribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: notaTexto.trim() }),
      });
      const cuerpo = await res.json().catch(() => ({}));
      if (!res.ok || !cuerpo.propuesta) {
        setError(cuerpo.error ?? "No se pudo analizar la nota de voz.");
        return;
      }
      setPropuesta(cuerpo.propuesta as PropuestaExtraida);
    } catch {
      setError("Error de red al procesar la nota con el copiloto inmobiliario.");
    } finally {
      setAnalizando(false);
    }
  }

  async function confirmarYGuardar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formRef.current || guardando) return;
    setGuardando(true);
    setError(null);

    try {
      const fd = new FormData(formRef.current);
      const fullName = String(fd.get("fullName") ?? "").trim();
      const phone = String(fd.get("phone") ?? "").trim();
      const email = String(fd.get("email") ?? "").trim();
      const zoneInterest = String(fd.get("zoneInterest") ?? "").trim();
      const projectInterestText = String(fd.get("projectInterestText") ?? "").trim();
      const operationType = String(fd.get("operationType") ?? "sale");
      const currency = String(fd.get("currency") ?? "USD");
      const budgetMaxUsd = Number(fd.get("budgetMax") ?? 0);
      const sourceId = String(fd.get("sourceId") ?? "");
      const actividadTitulo = String(fd.get("sugerenciaActividad") ?? "").trim();

      const resLead = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone: phone || undefined,
          email: email || undefined,
          zoneInterest: zoneInterest || undefined,
          projectInterestText: projectInterestText || undefined,
          operationType,
          currency,
          budgetMinCents: budgetMaxUsd > 0 ? Math.round(budgetMaxUsd * 100) : undefined,
          budgetMaxCents: budgetMaxUsd > 0 ? Math.round(budgetMaxUsd * 100) : undefined,
          sourceId: sourceId ? Number(sourceId) : undefined,
          originalMessage: notaTexto.trim(),
          crear_igual: true,
        }),
      });

      const cuerpoLead = await resLead.json().catch(() => ({}));
      if (!resLead.ok) {
        setError(cuerpoLead.error ?? "No se pudo guardar el lead extraído.");
        return;
      }

      const contactIdCreado = cuerpoLead.lead?.contactId as number | undefined;
      if (crearTareaSugerida && actividadTitulo) {
        await fetch("/api/actividades", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            activityType: "task",
            title: actividadTitulo,
            description: `Extraído de nota de voz de campo: "${notaTexto.trim()}"`,
            contactId: contactIdCreado,
            priority: "high",
            status: "pending",
          }),
        }).catch(() => null);
      }

      router.refresh();
      onClose();
    } catch {
      setError("Error de conexión al guardar el prospecto y su tarea de seguimiento.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-navy-950/65 backdrop-blur-xs p-4 animate-in fade-in"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={modalRef}
        tabIndex={-1}
        className="modal bg-surface border border-line rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="voz-lead-title"
      >
        <div className="drawer-head flex items-center justify-between px-6 py-4 border-b border-line bg-surface-alt sticky top-0 z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wider text-gold-700">
              <Sparkles className="size-3.5 text-gold-600" />
              Copiloto Inmobiliario · Human-in-the-Loop
            </span>
            <h2 id="voz-lead-title" className="font-heading font-bold text-lg text-navy-950 m-0">
              Ingesta inteligente por nota de voz o transcripción de WhatsApp
            </h2>
          </div>
          <button
            className="icon-button min-h-12 min-w-12 size-12"
            onClick={onClose}
            aria-label="Cerrar asistente de voz"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 grid gap-5">
          {error && <AlertaErrorFormulario mensaje={error} esErrorRed={false} />}

          {/* Paso 1: Entrada de nota de voz o transcripción */}
          <div className="grid gap-2.5 rounded-xl border border-line bg-surface-alt/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor="nota-voz-input" className="text-[13.5px] font-bold text-navy-950 flex items-center gap-2">
                <Mic className="size-4 text-gold-600" />
                <span>1. Dictado o transcripción de nota de campo</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EJEMPLOS_CAMPO.map((ej) => (
                  <button
                    key={ej.etiqueta}
                    type="button"
                    onClick={() => {
                      setNotaTexto(ej.texto);
                      setPropuesta(null);
                    }}
                    className="min-h-12 px-3 rounded-lg border border-line bg-surface text-[13px] font-semibold text-navy-900 hover:border-gold-500 transition-colors cursor-pointer"
                  >
                    {ej.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              id="nota-voz-input"
              value={notaTexto}
              onChange={(e) => setNotaTexto(e.target.value)}
              rows={3}
              placeholder="Ej: Hablé con Roberto Rosario al +1 (305) 555-0144, busca villa en Cap Cana entre 600 y 800 mil dólares, enviar brochure hoy..."
              className="w-full rounded-xl border border-input-line bg-surface p-3.5 text-[13.5px] text-ink focus-visible:outline-2 focus-visible:outline-gold-700"
            />

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[13px] text-muted">
                Reconoce dialecto inmobiliario dominicano, teléfonos de diáspora, zonas, proyectos y próxima tarea.
              </span>
              <button
                type="button"
                disabled={analizando || !notaTexto.trim()}
                onClick={analizarNota}
                className="min-h-12 px-5 inline-flex items-center gap-2 rounded-xl bg-navy-950 text-white text-[13.5px] font-bold hover:bg-navy-900 disabled:opacity-50 transition-all cursor-pointer shrink-0"
              >
                {analizando ? (
                  <>
                    <Loader2 className="size-4 animate-spin text-gold-400" />
                    <span>Extrayendo ficha…</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="size-4 text-gold-400" />
                    <span>Extraer datos del prospecto</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Paso 2: Confirmación Human-in-the-Loop */}
          {propuesta && (
            <form
              ref={formRef}
              onSubmit={confirmarYGuardar}
              key={propuesta.transcripcion}
              className="grid gap-4 rounded-xl border-2 border-gold-500/40 bg-surface p-5 shadow-md animate-in fade-in duration-150"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <strong className="text-[14px] text-navy-950">
                    2. Ficha estructurada lista para tu revisión
                  </strong>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 text-[13px] font-bold">
                  Confianza IA: {Math.round(propuesta.datos.confianza * 100)}%
                </span>
              </div>

              <div className="form-grid">
                <label className="span-2 text-[13.5px] font-semibold text-ink">
                  Nombre completo detectado
                  <input
                    name="fullName"
                    required
                    defaultValue={propuesta.datos.fullName ?? ""}
                    placeholder="Nombre y apellido del prospecto"
                    className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700"
                  />
                </label>

                <div className="span-2 text-[13.5px] font-semibold text-ink">
                  <span className="block mb-1">Teléfono con país y máscara</span>
                  <PhoneInput
                    name="phone"
                    defaultValue={propuesta.datos.phone ?? ""}
                  />
                </div>

                <label className="text-[13.5px] font-semibold text-ink">
                  Correo electrónico
                  <input
                    name="email"
                    type="email"
                    defaultValue={propuesta.datos.email ?? ""}
                    placeholder="cliente@ejemplo.com"
                    className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700"
                  />
                </label>

                <label className="text-[13.5px] font-semibold text-ink">
                  Canal de captación
                  <select
                    name="sourceId"
                    defaultValue=""
                    className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700 cursor-pointer"
                  >
                    <option value="">Nota de voz / WhatsApp</option>
                    {canales.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-[13.5px] font-semibold text-ink">
                  Zona de interés
                  <input
                    name="zoneInterest"
                    defaultValue={propuesta.datos.zoneInterest ?? ""}
                    placeholder="Cap Cana, Bávaro, Piantini..."
                    className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700"
                  />
                </label>

                <label className="text-[13.5px] font-semibold text-ink">
                  Proyecto mencionado
                  <input
                    name="projectInterestText"
                    defaultValue={propuesta.datos.projectInterestText ?? ""}
                    placeholder="Ej. Cana Rock, Punta Palmera..."
                    className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700"
                  />
                </label>

                <label className="text-[13.5px] font-semibold text-ink">
                  Operación
                  <select
                    name="operationType"
                    defaultValue={propuesta.datos.operationType}
                    className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg focus-visible:outline-2 focus-visible:outline-gold-700 cursor-pointer"
                  >
                    <option value="sale">Venta patrimonial</option>
                    <option value="rent">Alquiler</option>
                  </select>
                </label>

                <label className="text-[13.5px] font-semibold text-ink">
                  Presupuesto estimado ({propuesta.datos.currency})
                  <input
                    name="budgetMax"
                    type="number"
                    min={0}
                    step={1000}
                    defaultValue={
                      propuesta.datos.budgetMaxCents
                        ? Math.round(propuesta.datos.budgetMaxCents / 100)
                        : ""
                    }
                    placeholder="Ej. 250000"
                    className="min-h-12 text-[13.5px] px-3.5 border border-input-line rounded-lg font-mono focus-visible:outline-2 focus-visible:outline-gold-700"
                  />
                  <input type="hidden" name="currency" value={propuesta.datos.currency} />
                </label>

                <div className="span-2 rounded-xl border border-gold-500/40 bg-gold-50/30 p-3.5 grid gap-2">
                  <label className="flex items-center gap-2.5 text-[13.5px] font-bold text-navy-950 cursor-pointer">
                    <Checkbox checked={crearTareaSugerida} onCheckedChange={(checked) => setCrearTareaSugerida(checked)} />
                    <span>Agendar automáticamente tarea de seguimiento al guardar</span>
                  </label>
                  <input
                    name="sugerenciaActividad"
                    defaultValue={
                      propuesta.datos.sugerenciaActividad ??
                      `Dar seguimiento a ${propuesta.datos.fullName ?? "prospecto"}`
                    }
                    placeholder="Ej. Enviar brochure y agendar llamada"
                    className="min-h-12 w-full rounded-lg border border-input-line bg-surface px-3.5 text-[13.5px] text-ink focus-visible:outline-2 focus-visible:outline-gold-700"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={guardando}
                  className="button min-h-12 px-5 text-[13.5px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="min-h-12 px-6 inline-flex items-center gap-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-navy-950 text-[13.5px] font-bold shadow-sm transition-all cursor-pointer"
                >
                  {guardando ? "Guardando prospecto…" : "Confirmar y crear lead"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
