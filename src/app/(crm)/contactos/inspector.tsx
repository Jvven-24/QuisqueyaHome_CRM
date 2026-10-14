"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, Modal } from "../_ui/prototipo-ui";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import { CanalChip, type Canal, type ContactoFila } from "./vista";
import {
  Calendar,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";

const BOTON_TEXTO =
  "inline-flex min-h-12 min-w-12 cursor-pointer items-center justify-center rounded-lg px-4 text-[13.5px] font-semibold text-navy-900 hover:bg-navy-100 transition-colors focus-visible:outline-2 focus-visible:outline-gold-700";
const CAMPO =
  "min-h-12 w-full rounded-lg border border-input-line bg-surface px-3.5 text-[13.5px] text-ink focus-visible:outline-2 focus-visible:outline-gold-700";

/**
 * Ficha lateral 360 de un contacto (M1 · Private Desk).
 *
 * Características:
 * - Resumen patrimonial integral y segmentación.
 * - Acciones de contacto rápido de 48px (WhatsApp, teléfono, correo).
 * - Componentes accesibles sin diálogos nativos (confirm/alert).
 * - Tipografía >= 13px y controles táctiles >= 48px (min-h-12).
 */
export function ContactoInspector({
  contacto,
  canales,
  brokers,
  puedeReasignar,
  historial,
  onClose,
}: {
  contacto: ContactoFila;
  canales: Canal[];
  /** Deuda de F1 (issue #21): reasignar responsable, solo alcance `all`. */
  brokers: { id: number; fullName: string }[];
  puedeReasignar: boolean;
  historial: React.ReactNode;
  onClose: () => void;
}) {
  const router = useRouter();
  const asideRef = useFocusTrap<HTMLElement>({ onClose });
  const submittingRef = useRef(false);

  const [pestana, setPestana] = useState("ficha360");
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const phone = contacto.phone;
  const cleanPhone = phone ? phone.replace(/\D/g, "") : null;
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Hola ${contacto.fullName}, le escribo de Quisqueya Home Private Desk respecto a su portafolio inmobiliario y proyectos de interés en República Dominicana.`,
      )}`
    : null;

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setGuardando(true);
    setErrores({});
    setErrorGeneral(null);

    try {
      const datos: Record<string, unknown> = Object.fromEntries(new FormData(event.currentTarget).entries());
      if (datos.brokerId === "") delete datos.brokerId;
      const respuesta = await fetch(`/api/contactos/${contacto.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(datos),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setErrores(cuerpo.fields ?? {});
        setErrorGeneral(cuerpo.error ?? "No se pudo guardar el cambio.");
        return;
      }

      setEditando(false);
      router.refresh();
    } catch {
      setErrorGeneral("Fallo de conexión de red al guardar los cambios.");
    } finally {
      submittingRef.current = false;
      setGuardando(false);
    }
  }

  async function ejecutarEliminar() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setEliminando(true);
    setErrorGeneral(null);

    try {
      const respuesta = await fetch(`/api/contactos/${contacto.id}`, { method: "DELETE" });
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}));
        setErrorGeneral(cuerpo.error ?? "No se pudo eliminar el contacto.");
        setConfirmandoEliminar(false);
        return;
      }
      setConfirmandoEliminar(false);
      onClose();
      router.refresh();
    } catch {
      setErrorGeneral("Error de red al intentar eliminar el contacto.");
      setConfirmandoEliminar(false);
    } finally {
      submittingRef.current = false;
      setEliminando(false);
    }
  }

  const tieneHistorial = historial !== null && historial !== undefined;

  return (
    <aside
      className="inspector"
      ref={asideRef}
      tabIndex={-1}
      role="region"
      aria-label={`Ficha 360 de ${contacto.fullName}`}
    >
      <div className="drawer-head flex items-start justify-between pb-3 border-b border-line">
        <div>
          <p className="eyebrow inline-flex items-center gap-1.5 font-bold tracking-[0.14em] text-[13px] text-gold-700 uppercase mb-1">
            Private Desk · Ficha 360
          </p>
          <h2 className="font-heading font-extrabold text-xl text-navy-950 m-0">
            {contacto.fullName}
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
          <Avatar name={contacto.fullName} />
          <div className="grid min-w-0">
            <strong className="text-[14.5px] text-navy-950 font-bold truncate">
              {contacto.phoneDisplay ?? contacto.phone ?? "Sin teléfono registrado"}
            </strong>
            <span className="text-[13px] text-muted-foreground truncate">
              {contacto.email ?? "Sin correo registrado"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <CanalChip nombre={contacto.sourceName} />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold bg-gold-100 text-gold-900 border border-gold-300/60 shadow-2xs">
            Inversionista Calificado
          </span>
        </div>

        {/* Acciones de contacto rápido 48px */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line/60">
          {whatsappUrl ? (
            <a
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-[13px] font-bold text-white hover:bg-emerald-700 transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-gold-700"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`WhatsApp con ${contacto.fullName}`}
              title="WhatsApp directo"
            >
              <MessageSquare className="size-4 shrink-0" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <button
              disabled
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl bg-muted/30 px-3 text-[13px] font-semibold text-muted-foreground cursor-not-allowed"
            >
              <MessageSquare className="size-4 shrink-0" />
              <span>Sin WA</span>
            </button>
          )}

          {cleanPhone ? (
            <a
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl bg-surface border border-line px-3 text-[13px] font-bold text-navy-950 hover:bg-surface-alt transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-gold-700"
              href={`tel:${cleanPhone}`}
              aria-label={`Llamar a ${contacto.fullName}`}
              title="Llamar directamente"
            >
              <Phone className="size-4 text-gold-600 shrink-0" />
              <span>Llamar</span>
            </a>
          ) : (
            <button
              disabled
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl bg-muted/30 px-3 text-[13px] font-semibold text-muted-foreground cursor-not-allowed"
            >
              <Phone className="size-4 shrink-0" />
              <span>Sin tel</span>
            </button>
          )}

          {contacto.email ? (
            <a
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-300 px-3 text-[13px] font-bold transition-colors shadow-2xs focus-visible:outline-2 focus-visible:outline-gold-700"
              href={`mailto:${contacto.email}?subject=${encodeURIComponent("Quisqueya Home Private Desk — Asesoría Patrimonial")}`}
              aria-label={`Enviar correo a ${contacto.fullName}`}
              title="Enviar correo"
            >
              <Mail className="size-4 shrink-0" />
              <span>Correo</span>
            </a>
          ) : (
            <button
              disabled
              className="inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-xl bg-muted/30 px-3 text-[13px] font-semibold text-muted-foreground cursor-not-allowed"
            >
              <Mail className="size-4 shrink-0" />
              <span>Sin correo</span>
            </button>
          )}
        </div>
      </div>

      <Tabs value={pestana} onValueChange={setPestana} className="mt-2">
        <TabsList className="group-data-[orientation=horizontal]/tabs:h-12! w-full grid grid-cols-2 bg-surface-alt p-1 rounded-xl border border-line">
          <TabsTrigger value="ficha360" className="min-h-12 text-[13.5px] font-bold rounded-lg data-[state=active]:bg-surface data-[state=active]:shadow-xs">
            Ficha 360
          </TabsTrigger>
          {tieneHistorial && (
            <TabsTrigger value="seguimiento" className="min-h-12 text-[13.5px] font-bold rounded-lg data-[state=active]:bg-surface data-[state=active]:shadow-xs">
              Historial
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="ficha360" className="pt-4 grid gap-4">
          {errorGeneral && <AlertaErrorFormulario mensaje={errorGeneral} esErrorRed={false} />}

          {!editando ? (
            <>
              <dl className="detail-grid">
                <div className="py-2.5">
                  <dt className="text-[13px] text-muted-foreground font-semibold">Canal de origen</dt>
                  <dd className="text-[13.5px] font-semibold text-foreground mt-1">
                    {contacto.sourceName ?? "Directo / Sin especificar"}
                  </dd>
                </div>
                <div className="py-2.5">
                  <dt className="text-[13px] text-muted-foreground font-semibold">Asesor Patrimonial</dt>
                  <dd className="text-[13.5px] font-semibold text-foreground mt-1 flex items-center gap-1.5">
                    {contacto.brokerName ? (
                      <>
                        <UserCheck className="size-4 text-navy-800 shrink-0" />
                        <span>{contacto.brokerName}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground italic font-normal text-[13px]">Sin asignar</span>
                    )}
                  </dd>
                </div>
                <div className="span-2 py-2.5">
                  <dt className="text-[13px] text-muted-foreground font-semibold">Última interacción</dt>
                  <dd className="text-[13.5px] font-semibold text-foreground mt-1 flex items-center gap-1.5">
                    <Calendar className="size-4 text-gold-600 shrink-0" />
                    <span>
                      {contacto.lastInteractionAt
                        ? new Date(contacto.lastInteractionAt).toLocaleDateString("es-DO", {
                            weekday: "long",
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })
                        : "Sin interacciones registradas"}
                    </span>
                  </dd>
                </div>
              </dl>

              {contacto.notes && (
                <div className="rounded-xl border border-line bg-surface-alt p-4">
                  <strong className="text-[13px] font-bold text-navy-950 uppercase tracking-wider block mb-1">
                    Notas y Perfil del Cliente
                  </strong>
                  <p className="m-0 text-[13.5px] text-ink leading-relaxed whitespace-pre-wrap">
                    {contacto.notes}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <button
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-navy-950 px-5 text-[13.5px] font-bold text-white hover:bg-navy-900 transition-colors shadow-xs focus-visible:outline-2 focus-visible:outline-gold-700"
                  type="button"
                  onClick={() => setEditando(true)}
                >
                  <Pencil className="size-4 text-gold-500" />
                  <span>Editar ficha</span>
                </button>
                <button
                  className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 text-[13.5px] font-semibold text-danger hover:bg-danger-bg transition-colors focus-visible:outline-2 focus-visible:outline-gold-700"
                  type="button"
                  onClick={() => setConfirmandoEliminar(true)}
                >
                  <Trash2 className="size-4" />
                  <span>Eliminar</span>
                </button>
              </div>
            </>
          ) : (
            <form className="form-grid" onSubmit={guardar}>
              <label className="span-2 text-[13.5px] font-semibold text-ink">
                Nombre completo
                <input
                  name="fullName"
                  defaultValue={contacto.fullName}
                  required
                  className={CAMPO}
                />
                {errores.fullName && <small className="text-[13px] text-danger">{errores.fullName}</small>}
              </label>
              <label className="text-[13.5px] font-semibold text-ink">
                Teléfono
                <input
                  name="phone"
                  defaultValue={contacto.phoneDisplay ?? contacto.phone ?? ""}
                  className={CAMPO}
                />
                {errores.phone && <small className="text-[13px] text-danger">{errores.phone}</small>}
              </label>
              <label className="text-[13.5px] font-semibold text-ink">
                Correo
                <input
                  name="email"
                  type="email"
                  defaultValue={contacto.email ?? ""}
                  className={CAMPO}
                />
                {errores.email && <small className="text-[13px] text-danger">{errores.email}</small>}
              </label>
              <label className="span-2 text-[13.5px] font-semibold text-ink">
                Canal
                <select
                  name="sourceId"
                  defaultValue={contacto.sourceId ?? ""}
                  className={`${CAMPO} cursor-pointer`}
                >
                  <option value="">Sin especificar</option>
                  {canales.map((canal) => (
                    <option key={canal.id} value={canal.id}>
                      {canal.name}
                    </option>
                  ))}
                </select>
              </label>
              {puedeReasignar && (
                <label className="span-2 text-[13.5px] font-semibold text-ink">
                  Responsable
                  <select
                    name="brokerId"
                    defaultValue={contacto.brokerId ?? ""}
                    className={`${CAMPO} cursor-pointer`}
                  >
                    <option value="" disabled>
                      Sin asignar — elige un broker
                    </option>
                    {brokers.map((broker) => (
                      <option key={broker.id} value={broker.id}>
                        {broker.fullName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="span-2 text-[13.5px] font-semibold text-ink">
                Notas
                <textarea
                  name="notes"
                  defaultValue={contacto.notes ?? ""}
                  className="min-h-24 w-full rounded-xl border border-input-line bg-surface p-3 text-[13.5px] text-ink focus-visible:outline-2 focus-visible:outline-gold-700"
                />
              </label>
              {errores._ && <small className="text-[13px] text-danger">{errores._}</small>}
              <div className="form-actions span-2 pt-2">
                <button
                  className="button min-h-12 px-5 text-[13.5px]"
                  type="button"
                  onClick={() => setEditando(false)}
                >
                  Cancelar
                </button>
                <button
                  className="button primary min-h-12 px-6 text-[13.5px]"
                  type="submit"
                  disabled={guardando}
                >
                  {guardando ? "Guardando…" : "Guardar cambios"}
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

      {/* Modal accesible de confirmación para eliminar (CA-17: sin confirm nativo) */}
      {confirmandoEliminar && (
        <Modal title="Eliminar contacto" onClose={() => setConfirmandoEliminar(false)}>
          <div className="grid gap-4">
            <p className="m-0 text-[13.5px] text-ink leading-relaxed">
              ¿Deseas enviar a <strong>{contacto.fullName}</strong> a la papelera? Podrás verlo y restaurarlo desde la papelera si es necesario.
            </p>
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              <button
                className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-line px-5 text-[13.5px] font-semibold text-ink hover:bg-surface-alt transition-colors focus-visible:outline-2 focus-visible:outline-gold-700"
                type="button"
                onClick={() => setConfirmandoEliminar(false)}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-xl bg-danger px-6 text-[13.5px] font-bold text-white hover:bg-danger/90 disabled:opacity-50 transition-colors focus-visible:outline-2 focus-visible:outline-gold-700"
                type="button"
                onClick={ejecutarEliminar}
                disabled={eliminando}
              >
                {eliminando ? "Eliminando…" : "Confirmar eliminación"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </aside>
  );
}
