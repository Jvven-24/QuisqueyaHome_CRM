"use client";

import { NotasBitacora } from "../_ui/notas-bitacora";

import { CalificacionLead } from "./_componentes/calificacion";
import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, Modal } from "../_ui/prototipo-ui";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import {
  ETIQUETAS_ESTADO,
  CanalChip,
  type BrokerOpcion,
  type LeadFila,
} from "./vista";
import { Building2, MessageSquare, Phone, Sparkles, UserCheck, X } from "lucide-react";

const BOTON_TEXTO =
  "inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-navy-900 hover:bg-navy-100 transition-colors focus-visible:outline-2 focus-visible:outline-gold-700";
const CAMPO =
  "min-h-12 w-full rounded-lg border border-input-line bg-surface px-3.5 text-[13.5px] text-ink focus-visible:outline-2 focus-visible:outline-gold-700";

function formatoMonto(lead: LeadFila): string {
  if (!lead.budgetMinCents && !lead.budgetMaxCents) return "Por definir";
  const formateador = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: lead.currency,
    maximumFractionDigits: 0,
  });
  if (lead.budgetMinCents && lead.budgetMaxCents) {
    return `${formateador.format(lead.budgetMinCents / 100)} - ${formateador.format(lead.budgetMaxCents / 100)}`;
  }
  const centavos = lead.budgetMinCents ?? lead.budgetMaxCents ?? 0;
  return formateador.format(centavos / 100);
}

/**
 * Ficha lateral de un lead (M01 / M2 · Private Desk).
 *
 * Cumple con Decisión #47:
 * - El broker puede tomar leads no asignados desde la cola de disponibles con bloqueo concurrente.
 * - Solo el administrador reasigna a otros brokers.
 * - Los diálogos son modales accesibles (CA-17: sin confirm/alert nativos).
 * - Controles táctiles >= 48px (min-h-12) y tipografía >= 13px.
 */
export function LeadInspector({
  lead,
  brokers,
  historial,
  actorId,
  roleSlug,
  onClose,
}: {
  lead: LeadFila;
  brokers: BrokerOpcion[];
  historial: React.ReactNode;
  actorId?: number;
  roleSlug?: string;
  onClose: () => void;
  }) {
  const router = useRouter();
  const inspectorRef = useFocusTrap<HTMLElement>({ onClose, autoFocus: false });
  const accionandoRef = useRef(false);

  const [pestana, setPestana] = useState("detalle");
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [confirmandoConversion, setConfirmandoConversion] = useState(false);
  const [tomando, setTomando] = useState(false);
  const [descartando, setDescartando] = useState(false);
  const [motivoDescarte, setMotivoDescarte] = useState("");
  const [mostrarDescarte, setMostrarDescarte] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [brokerElegido, setBrokerElegido] = useState(
    String(lead.brokerId ?? lead.suggestedBrokerId ?? ""),
  );
  const [mostrarNuevoSeguimiento, setMostrarNuevoSeguimiento] = useState(false);
  const [tipoSeguimiento, setTipoSeguimiento] = useState<"call" | "whatsapp" | "task">("call");
  const [tituloSeguimiento, setTituloSeguimiento] = useState("");
  const [estadoSeguimiento, setEstadoSeguimiento] = useState<"completed" | "pending">("completed");
  const [guardandoSeguimiento, setGuardandoSeguimiento] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const puedeActuar = lead.status !== "converted" && lead.status !== "discarded";
  const esAdmin = roleSlug === "admin";
  const sinResponsable = !lead.brokerId;
  const tieneHistorial = historial !== null && historial !== undefined;

  const phone = lead.contactPhone;
  const cleanPhone = phone ? phone.replace(/\D/g, "") : null;
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hola ${lead.contactName}, le contacto de Quisqueya Home Private Desk respecto a su consulta sobre ${
          lead.projectName ?? "inversiones inmobiliarias en República Dominicana"
        }. ¿En qué horario le resultaría conveniente conversar?`,
      )}`
    : null;

  async function tomarLead() {
    if (accionandoRef.current || !actorId) return;
    accionandoRef.current = true;
    setTomando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/leads/${lead.id}/tomar`, {
        method: "POST",
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo tomar el lead. Es posible que otro asesor lo haya tomado.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión al reclamar el lead.");
    } finally {
      accionandoRef.current = false;
      setTomando(false);
    }
  }

  async function asignar() {
    if (!brokerElegido || accionandoRef.current) return;
    accionandoRef.current = true;
    setAsignando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ brokerId: Number(brokerElegido) }),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo asignar el responsable.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de red o conexión al asignar el responsable.");
    } finally {
      accionandoRef.current = false;
      setAsignando(false);
    }
  }

  async function ejecutarConversion() {
    if (accionandoRef.current) return;
    accionandoRef.current = true;
    setConvirtiendo(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/leads/${lead.id}/convertir`, { method: "POST" });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo convertir el lead.");
        setConfirmandoConversion(false);
        return;
      }
      setConfirmandoConversion(false);
      router.refresh();
    } catch {
      setError("Error de red o conexión al convertir el lead.");
    } finally {
      accionandoRef.current = false;
      setConvirtiendo(false);
    }
  }

  async function descartar(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!motivoDescarte.trim() || accionandoRef.current) {
      if (!motivoDescarte.trim()) setError("Escribe el motivo del descarte.");
      return;
    }
    accionandoRef.current = true;
    setDescartando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/leads/${lead.id}/descartar`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ discardReason: motivoDescarte.trim() }),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo descartar el lead.");
        return;
      }
      setMostrarDescarte(false);
      router.refresh();
    } catch {
      setError("Error de red o conexión al descartar el lead.");
    } finally {
      accionandoRef.current = false;
      setDescartando(false);
    }
  }

  async function registrarSeguimiento(e: FormEvent) {
    e.preventDefault();
    if (!tituloSeguimiento.trim() || accionandoRef.current) return;
    accionandoRef.current = true;
    setGuardandoSeguimiento(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/actividades", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          activityType: tipoSeguimiento,
          title: tituloSeguimiento.trim(),
          contactId: lead.contactId,
          projectId: lead.projectId ?? undefined,
          status: estadoSeguimiento,
          priority: "normal",
        }),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo registrar el seguimiento.");
        return;
      }
      setTituloSeguimiento("");
      setMostrarNuevoSeguimiento(false);
      router.refresh();
    } catch {
      setError("Error de red al guardar el seguimiento.");
    } finally {
      accionandoRef.current = false;
      setGuardandoSeguimiento(false);
    }
  }

  return (
    <aside
      className="inspector"
      ref={inspectorRef}
      tabIndex={-1}
      role="region"
      aria-label="Ficha de lead patrimonial"
    >
      <div className="drawer-head flex items-start justify-between pb-3 border-b border-line">
        <div>
          <p className="eyebrow inline-flex items-center gap-1.5 font-bold tracking-[0.14em] text-[13px] text-gold-700 uppercase mb-1">
            Private Desk · Lead
          </p>
          <h2 className="font-heading font-extrabold text-xl text-navy-950 m-0">
            {lead.contactName}
          </h2>
        </div>
        <button
          className={`${BOTON_TEXTO} text-2xl text-ink-muted hover:text-navy-950`}
          onClick={onClose}
          aria-label="Cerrar detalle"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="contact-hero bg-surface-alt border border-line rounded-xl p-4 my-3 flex flex-col gap-3">
        <div className="flex items-center gap-3.5">
          <Avatar name={lead.contactName} />
          <div className="grid min-w-0">
            <strong className="text-[14.5px] text-navy-950 font-bold truncate">
              {lead.contactPhoneDisplay ?? lead.contactPhone ?? "Sin teléfono registrado"}
            </strong>
            <span className="text-[13px] text-muted-foreground truncate">
              {lead.contactEmail ?? "Sin correo registrado"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <CanalChip nombre={lead.sourceName} />
        </div>

        {/* Acciones de contacto rápido 48px */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line/60">
          {whatsappUrl ? (
            <a
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 text-[13.5px] font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-gold-700"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir WhatsApp con el lead"
            >
              <MessageSquare className="size-4" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <button
              disabled
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl bg-muted/30 px-3.5 text-[13.5px] font-semibold text-muted-foreground cursor-not-allowed"
            >
              <MessageSquare className="size-4" />
              <span>Sin WhatsApp</span>
            </button>
          )}

          {cleanPhone ? (
            <a
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl bg-surface border border-line px-3.5 text-[13.5px] font-bold text-navy-950 hover:bg-surface-alt transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-gold-700"
              href={`tel:${cleanPhone}`}
              aria-label="Llamar directamente al lead"
            >
              <Phone className="size-4 text-gold-600" />
              <span>Llamar</span>
            </a>
          ) : (
            <button
              disabled
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl bg-muted/30 px-3.5 text-[13.5px] font-semibold text-muted-foreground cursor-not-allowed"
            >
              <Phone className="size-4" />
              <span>Sin teléfono</span>
            </button>
          )}
        </div>
      </div>

      <Tabs value={pestana} onValueChange={setPestana} className="mt-2">
        <TabsList className="group-data-[orientation=horizontal]/tabs:h-12! w-full grid grid-cols-2 bg-surface-alt p-1 rounded-xl border border-line">
          <TabsTrigger value="detalle" className="min-h-12 text-[13.5px] font-bold rounded-lg data-[state=active]:bg-surface data-[state=active]:shadow-xs">
            Detalle
          </TabsTrigger>
          {tieneHistorial && (
            <TabsTrigger value="seguimiento" className="min-h-12 text-[13.5px] font-bold rounded-lg data-[state=active]:bg-surface data-[state=active]:shadow-xs">
              Seguimiento
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="detalle" className="grid gap-4 pt-4">
          <NotasBitacora entidad="lead" entidadId={lead.id} />
          <CalificacionLead lead={lead} />
          <dl className="detail-grid">
            <div className="py-2.5">
              <dt className="text-[13px] text-muted-foreground font-semibold">Presupuesto</dt>
              <dd className="text-[14px] font-bold text-foreground mt-1 tabular-nums">
                {formatoMonto(lead)}
              </dd>
            </div>
            <div className="py-2.5">
              <dt className="text-[13px] text-muted-foreground font-semibold">Interés / Proyecto</dt>
              <dd className="text-[13.5px] font-semibold text-foreground mt-1 flex items-center gap-1.5">
                <Building2 className="size-4 text-gold-600 shrink-0" />
                <span className="truncate">{lead.projectName ?? lead.projectInterestText ?? lead.zoneInterest ?? "Por definir"}</span>
              </dd>
            </div>
            <div className="py-2.5">
              <dt className="text-[13px] text-muted-foreground font-semibold">Zona de interés</dt>
              <dd className="text-[13.5px] font-semibold text-foreground mt-1">
                {lead.zoneInterest ?? "Sin especificar"}
              </dd>
            </div>
            <div className="py-2.5">
              <dt className="text-[13px] text-muted-foreground font-semibold">Operación</dt>
              <dd className="text-[13.5px] font-semibold text-foreground mt-1">
                {lead.operationType === "rent" ? "Alquiler" : lead.operationType === "sale" ? "Venta" : "Sin especificar"}
              </dd>
            </div>
            <div className="py-2.5">
              <dt className="text-[13px] text-muted-foreground font-semibold">Estado actual</dt>
              <dd className="text-[13.5px] font-semibold text-foreground mt-1">
                {ETIQUETAS_ESTADO[lead.status]}
              </dd>
            </div>
            <div className="py-2.5">
              <dt className="text-[13px] text-muted-foreground font-semibold">Fecha de ingreso</dt>
              <dd className="text-[13.5px] font-semibold text-foreground mt-1">
                {new Date(lead.receivedAt).toLocaleDateString("es-DO")}
              </dd>
            </div>

            <div className="span-2 py-3 border-t border-line">
              <dt className="text-[13px] text-muted-foreground font-semibold">Asesor Responsable</dt>
              <dd className="text-[13.5px] font-bold text-navy-950 mt-1">
                {lead.brokerName ? (
                  <span className="inline-flex items-center gap-1.5">
                    <UserCheck className="size-4 text-navy-800" />
                    {lead.brokerName}
                  </span>
                ) : lead.suggestedBrokerName ? (
                  <span className="inline-flex items-center gap-1.5 text-gold-700 bg-gold-500/10 px-2.5 py-1 rounded-full border border-gold-500/30">
                    <Sparkles className="size-3.5 text-gold-600" /> Sugerido: {lead.suggestedBrokerName}
                  </span>
                ) : (
                  <span className="text-muted-foreground italic font-normal">Sin asignar</span>
                )}

                {/* Asignación admin o toma de lead según Decisión #47 */}
                {puedeActuar && esAdmin && brokers.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      aria-label="Elegir broker a asignar"
                      className={CAMPO}
                      value={brokerElegido}
                      onChange={(event) => setBrokerElegido(event.target.value)}
                    >
                      <option value="">Elegir broker…</option>
                      {brokers.map((broker) => (
                        <option key={broker.userId} value={broker.userId}>
                          {broker.fullName}
                          {broker.userId === lead.suggestedBrokerId ? " (sugerido)" : ""}
                        </option>
                      ))}
                    </select>
                    <button
                      className="inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-xl bg-navy-900 px-5 text-[13.5px] font-bold text-white hover:bg-navy-800 disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-gold-700"
                      type="button"
                      disabled={asignando || !brokerElegido}
                      onClick={asignar}
                    >
                      {asignando ? "Asignando…" : "Asignar"}
                    </button>
                  </div>
                )}

                {puedeActuar && !esAdmin && sinResponsable && actorId && (
                  <div className="mt-3">
                    <button
                      className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gold-600 px-5 text-[13.5px] font-bold text-navy-950 hover:bg-gold-500 disabled:cursor-wait disabled:opacity-70 shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-gold-700"
                      type="button"
                      disabled={tomando}
                      onClick={tomarLead}
                    >
                      {tomando ? "Reclamando lead…" : "Tomar este lead"}
                    </button>
                  </div>
                )}
              </dd>
            </div>
          </dl>

          {lead.discardReason && (
            <div className="rounded-xl bg-danger-bg p-3 border border-danger/20">
              <strong className="text-[13px] text-danger block mb-0.5">Motivo del descarte:</strong>
              <span className="text-[13.5px] text-danger/90">{lead.discardReason}</span>
            </div>
          )}

          {error && <AlertaErrorFormulario mensaje={error} esErrorRed={false} />}

          {puedeActuar && (
            <div className="grid gap-2.5 pt-2">
              <button
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl bg-gold-600 px-5 text-[13.5px] font-bold text-navy-950 hover:bg-gold-500 disabled:opacity-50 transition-all shadow-xs focus-visible:outline-2 focus-visible:outline-gold-700"
                type="button"
                disabled={convirtiendo}
                onClick={() => setConfirmandoConversion(true)}
              >
                {convirtiendo ? "Convirtiendo…" : "Convertir a negocio"}
              </button>

              <button
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-gold-500/40 bg-gold-50/30 px-5 text-[13.5px] font-semibold text-navy-950 hover:bg-gold-100/50 transition-colors focus-visible:outline-2 focus-visible:outline-gold-700"
                type="button"
                onClick={() => setMostrarNuevoSeguimiento((v) => !v)}
              >
                Registrar contacto o próxima tarea
              </button>

              <button
                className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-xl border border-line bg-surface px-5 text-[13.5px] font-semibold text-ink hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-gold-700"
                type="button"
                onClick={() => setMostrarDescarte((v) => !v)}
              >
                Descartar lead
              </button>
            </div>
          )}

          {mostrarNuevoSeguimiento && (
            <form onSubmit={registrarSeguimiento} className="grid gap-3 rounded-xl border border-gold-500/40 bg-surface-alt p-4">
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1 text-[13px] font-bold text-ink">
                  <span>Canal</span>
                  <select
                    value={tipoSeguimiento}
                    onChange={(e) => setTipoSeguimiento(e.target.value as "call" | "whatsapp" | "task")}
                    className={CAMPO}
                  >
                    <option value="call">Llamada telefónica</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="task">Tarea de seguimiento</option>
                  </select>
                </label>
                <label className="grid gap-1 text-[13px] font-bold text-ink">
                  <span>Estado</span>
                  <select
                    value={estadoSeguimiento}
                    onChange={(e) => setEstadoSeguimiento(e.target.value as "completed" | "pending")}
                    className={CAMPO}
                  >
                    <option value="completed">Ya realizada hoy</option>
                    <option value="pending">Pendiente por hacer</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-1 text-[13.5px] font-bold text-ink">
                <span>Resumen o compromiso acordado</span>
                <input
                  required
                  value={tituloSeguimiento}
                  onChange={(e) => setTituloSeguimiento(e.target.value)}
                  placeholder="Ej. Llamada realizada, enviar brochure de Cap Cana"
                  className={CAMPO}
                />
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarNuevoSeguimiento(false)}
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl px-4 text-[13.5px] font-semibold text-ink hover:bg-line/30 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoSeguimiento || !tituloSeguimiento.trim()}
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-navy-950 px-5 text-[13.5px] font-bold text-white hover:bg-navy-900 disabled:opacity-50 transition-colors"
                >
                  {guardandoSeguimiento ? "Guardando…" : "Guardar seguimiento"}
                </button>
              </div>
            </form>
          )}

          {mostrarDescarte && (
            <form onSubmit={descartar} className="grid gap-3 rounded-xl border border-line bg-surface-alt p-4">
              <label className="grid gap-1.5 text-[13.5px] font-bold text-ink">
                <span>Motivo del descarte</span>
                <textarea
                  className="min-h-24 w-full rounded-xl border border-input-line bg-surface p-3 text-[13.5px] text-ink focus-visible:outline-2 focus-visible:outline-gold-700"
                  value={motivoDescarte}
                  onChange={(event) => setMotivoDescarte(event.target.value)}
                  placeholder="Ej. Dejó de responder, fuera de presupuesto..."
                />
              </label>
              <div className="flex flex-wrap justify-end gap-2.5">
                <button
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl px-4 text-[13.5px] font-semibold text-ink hover:bg-line/30 transition-colors focus-visible:outline-2 focus-visible:outline-gold-700"
                  type="button"
                  onClick={() => setMostrarDescarte(false)}
                >
                  Cancelar
                </button>
                <button
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-danger px-5 text-[13.5px] font-bold text-white hover:bg-danger/90 disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-gold-700"
                  type="submit"
                  disabled={descartando}
                >
                  {descartando ? "Descartando…" : "Confirmar descarte"}
                </button>
              </div>
            </form>
          )}
        </TabsContent>

        {tieneHistorial && (
          <TabsContent value="seguimiento" className="pt-3">
            {historial}
          </TabsContent>
        )}
      </Tabs>

      {/* Modal accesible de confirmación de conversión (CA-17: sin confirm nativo) */}
      {confirmandoConversion && (
        <Modal title="Convertir a negocio" onClose={() => setConfirmandoConversion(false)}>
          <div className="grid gap-4">
            <p className="m-0 text-[13.5px] text-ink leading-relaxed">
              ¿Deseas convertir a <strong>{lead.contactName}</strong> en un negocio activo?
              Se creará en la primera etapa del flujo de ventas y podrás asociarle proyectos y unidades.
            </p>
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-line px-5 text-[13.5px] font-semibold text-ink hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-gold-700"
                type="button"
                onClick={() => setConfirmandoConversion(false)}
                disabled={convirtiendo}
              >
                Cancelar
              </button>
              <button
                className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-gold-600 px-6 text-[13.5px] font-bold text-navy-950 hover:bg-gold-500 disabled:opacity-50 transition-all focus-visible:outline-2 focus-visible:outline-gold-700"
                type="button"
                onClick={ejecutarConversion}
                disabled={convirtiendo}
              >
                {convirtiendo ? "Convirtiendo…" : "Sí, convertir en negocio"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </aside>
  );
}
