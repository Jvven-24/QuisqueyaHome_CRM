"use client";

import { describirEstadoOutbox, type EstadoOutbox } from "@/application/compartido/outbox-estado";
import { Badge } from "../_ui/prototipo-ui";
import { ShieldCheck, Zap } from "lucide-react";

export type IntegracionFila = {
  id: number;
  provider: string;
  status: string;
  lastSyncedAt: Date | null;
  lastError: string | null;
};

const TARJETAS = [
  {
    provider: "crm_mirror",
    name: "Réplica CRM (Open Source)",
    text: "Espejo transaccional de contactos, negocios y actividades mediante el puerto CrmPort y eventos Outbox.",
    motivo: "Motor local: solo registra en consola. No hay réplica externa conectada",
  },
  {
    provider: "outbox",
    name: "Outbox Engine (VRE-OS)",
    text: "Cola de eventos de dominio con reintento exponencial; entrega idempotente cuando se ejecuta el worker.",
    motivo: "",
  },
  {
    provider: "google_calendar",
    name: "Google Calendar",
    text: "Cada cita puede abrirse en Google Calendar y toda la agenda puede exportarse como archivo .ics.",
    motivo: "Ya disponible desde Agenda",
  },
  {
    provider: "whatsapp_business",
    name: "WhatsApp Business",
    text: "El CRM abre conversaciones directas vía enlace HTTPS desde la ficha del lead.",
    motivo: "Click-to-chat activo; plantillas en fase posterior",
  },
  {
    provider: "youtube",
    name: "YouTube",
    text: "Los proyectos y avances de obra aceptan URL de video para reproducción integrada.",
    motivo: "Enlace manual, sin validación externa de contenido",
  },
  {
    provider: "zoom",
    name: "Zoom / Google Meet",
    text: "La agenda puede almacenar y compartir enlaces directos de reunión virtual.",
    motivo: "Enlace manual activo",
  },
  {
    provider: "moodle",
    name: "Moodle 4.5 LMS Local",
    text: "Sincronización de cursos, avance formativo y emisión auditada de constancias.",
    motivo: "Sincronización activa con Quisqueya Academy",
  },
  {
    provider: "meta_lead_ads",
    name: "Meta Lead Ads",
    text: "Captura de leads mediante webhook con validación de firma HMAC y reglas de asignación.",
    motivo: "Fase posterior: requiere endpoint público verificado",
  },
  {
    provider: "google_calendar_2way",
    name: "Google Calendar (2 vías)",
    text: "Sincronización bidireccional mediante OAuth 2.0 y almacenamiento cifrado de tokens.",
    motivo: "Fase posterior — sin OAuth todavía",
  },
];

export function IntegracionesPanel({
  integraciones,
  estadoOutbox = null,
}: {
  integraciones: IntegracionFila[];
  estadoOutbox?: EstadoOutbox | null;
}) {
  const porProveedor = new Map(integraciones.map((i) => [i.provider, i]));

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <p className="eyebrow" style={{ margin: "0 0 4px", fontSize: "12px" }}>Ecosistema & APIs</p>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "var(--navy-950)" }}>
            Integraciones y Conectores
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--muted)" }}>
            Estado de los conectores externos, réplica de eventos y arquitectura transaccional Outbox.
          </p>
        </div>
      </div>

      <div
        className="integration-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px",
          marginTop: "16px",
        }}
      >
        {TARJETAS.map((tarjeta) => {
          const cuenta = porProveedor.get(tarjeta.provider);
          const estado = cuenta?.status ?? (tarjeta.provider === "outbox" || tarjeta.provider === "moodle" ? "connected" : "disconnected");
          const tono = estado === "connected" ? "green" : estado === "pending" ? "gold" : "neutral";

          return (
            <article
              className="integration-card"
              key={tarjeta.provider}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <strong style={{ fontSize: "15px", color: "var(--navy-950)" }}>{tarjeta.name}</strong>
                  <Badge tone={tono}>
                    {estado === "connected" ? "Activo" : estado === "pending" ? "Pendiente" : "Sin configurar"}
                  </Badge>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--ink)", lineHeight: 1.5 }}>
                  {tarjeta.text}
                </p>
              </div>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "10px" }}>
                <span style={{ fontSize: "13px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Zap size={14} color="var(--gold-700)" />
                  <span>{tarjeta.provider === "outbox" ? describirEstadoOutbox(estadoOutbox) : tarjeta.motivo}</span>
                </span>
              </div>
            </article>
          );
        })}
      </div>

      <div
        className="integration-guard"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginTop: "24px",
          padding: "16px",
          borderRadius: "12px",
          background: "#F8FAFC",
          border: "1px solid var(--line)",
          fontSize: "13px",
        }}
      >
        <ShieldCheck size={24} color="var(--gold-700)" className="shrink-0" />
        <div>
          <strong style={{ display: "block", color: "var(--navy-950)", fontSize: "14px" }}>
            Arquitectura de Seguridad sin Exposición de Secretos
          </strong>
          <span style={{ color: "var(--muted)" }}>
            La sincronización con servicios de terceros y tokens OAuth se gestiona en el backend seguro. Jamás se exponen tokens ni claves `service_role` en el cliente.
          </span>
        </div>
      </div>
    </>
  );
}
