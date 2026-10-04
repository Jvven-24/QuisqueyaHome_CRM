"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { Avatar } from "../_ui/prototipo-ui";
import { ETIQUETAS_ESTADO, type BrokerOpcion, type LeadFila } from "./vista";

/**
 * Ficha lateral de un lead (M2).
 *
 * `LeadInspector` de `../_ui/lead-inspector.tsx` se pensó para la forma `Lead`
 * del prototipo (`stage` como texto de las 7 columnas del Kanban, `broker`
 * como nombre literal, `onMove` que reescribe la etapa en memoria) — nada de
 * eso aplica a un lead real: un lead no tiene etapa de pipeline, tiene
 * `status` (`new/assigned/contacted/converted/discarded`) y dos acciones de
 * negocio propias, convertir y descartar, que van al servidor y no a un
 * `setState` local. Igual que M1 decidió con `ContactoInspector` frente al
 * inspector del prototipo: un panel propio y pequeño, con los campos que sí
 * tiene `leads`, es más simple que adaptar `onMove`/`stage` a algo que no son.
 */
export function LeadInspector({
  lead,
  brokers,
  historial,
  onClose,
}: {
  lead: LeadFila;
  brokers: BrokerOpcion[];
  historial: React.ReactNode;
  onClose: () => void;
}) {
  const router = useRouter();
  const inspectorRef = useFocusTrap<HTMLElement>({ onClose });
  const accionandoRef = useRef(false);
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [descartando, setDescartando] = useState(false);
  const [motivoDescarte, setMotivoDescarte] = useState("");
  const [mostrarDescarte, setMostrarDescarte] = useState(false);
  const [asignando, setAsignando] = useState(false);
  const [brokerElegido, setBrokerElegido] = useState(
    String(lead.brokerId ?? lead.suggestedBrokerId ?? ""),
  );
  const [error, setError] = useState<string | null>(null);

  const puedeActuar = lead.status !== "converted" && lead.status !== "discarded";

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

  async function convertir() {
    if (accionandoRef.current) return;
    if (!confirm(`¿Convertir a ${lead.contactName} en negocio? Se creará en la primera etapa del embudo.`)) return;
    accionandoRef.current = true;
    setConvirtiendo(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/leads/${lead.id}/convertir`, { method: "POST" });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo convertir el lead.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de red o conexión al convertir el lead.");
    } finally {
      accionandoRef.current = false;
      setConvirtiendo(false);
    }
  }

  async function descartar() {
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

  return (
    <aside
      className="inspector"
      ref={inspectorRef}
      tabIndex={-1}
      role="region"
      aria-label="Ficha de lead"
    >
      <div className="drawer-head">
        <div>
          <p className="eyebrow">Ficha de lead</p>
          <h2>{lead.contactName}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar detalle">
          ×
        </button>
      </div>
      <div className="contact-hero">
        <Avatar name={lead.contactName} />
        <div>
          <strong>{lead.contactPhoneDisplay ?? lead.contactPhone ?? "Sin teléfono"}</strong>
          <small>
            {lead.sourceName ?? "Origen sin especificar"}
            {lead.projectName ? ` · ${lead.projectName}` : ""}
          </small>
        </div>
      </div>
      <dl className="detail-grid">
        <div>
          <dt>Interés</dt>
          <dd>{lead.projectName ?? lead.projectInterestText ?? lead.zoneInterest ?? "—"}</dd>
        </div>
        <div>
          <dt>Responsable</dt>
          <dd>
            {lead.brokerName ??
              (lead.suggestedBrokerName ? `Sugerido: ${lead.suggestedBrokerName}` : "Sin asignar")}
            {puedeActuar && brokers.length > 0 && (
              <span className="form-actions" style={{ marginTop: 8 }}>
                <select
                  aria-label="Elegir broker a asignar"
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
                  className="button"
                  type="button"
                  disabled={asignando || !brokerElegido}
                  onClick={asignar}
                >
                  {asignando ? "Asignando…" : "Asignar"}
                </button>
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{ETIQUETAS_ESTADO[lead.status]}</dd>
        </div>
        <div>
          <dt>Recibido</dt>
          <dd>{new Date(lead.receivedAt).toLocaleDateString("es-DO")}</dd>
        </div>
      </dl>
      {lead.discardReason && (
        <p>
          <strong>Motivo del descarte:</strong> {lead.discardReason}
        </p>
      )}
      {error && (
        <p role="alert" style={{ color: "#b42318" }}>
          {error}
        </p>
      )}
      {puedeActuar && (
        <div className="inspector-actions">
          <button className="button primary" type="button" disabled={convirtiendo} onClick={convertir}>
            {convirtiendo ? "Convirtiendo…" : "Convertir a negocio"}
          </button>
          {lead.contactPhone && (
            <a
              className="button whatsapp"
              href={`https://wa.me/${lead.contactPhone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
            >
              Abrir WhatsApp
            </a>
          )}
          <button className="button" type="button" onClick={() => setMostrarDescarte((v) => !v)}>
            Descartar
          </button>
        </div>
      )}
      {mostrarDescarte && (
        <div className="form-grid">
          <label className="span-2">
            Motivo del descarte
            <textarea
              value={motivoDescarte}
              onChange={(event) => setMotivoDescarte(event.target.value)}
              placeholder="Ej. Dejó de responder, presupuesto fuera de rango…"
            />
          </label>
          <div className="form-actions">
            <button className="button" type="button" onClick={() => setMostrarDescarte(false)}>
              Cancelar
            </button>
            <button className="button primary" type="button" disabled={descartando} onClick={descartar}>
              {descartando ? "Descartando…" : "Confirmar descarte"}
            </button>
          </div>
        </div>
      )}
      {historial}
    </aside>
  );
}
