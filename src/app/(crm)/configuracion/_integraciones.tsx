"use client";

import { describirEstadoOutbox, type EstadoOutbox } from "@/application/compartido/outbox-estado";
import { Badge } from "../_ui/prototipo-ui";

export type IntegracionFila = {
  id: number;
  provider: string;
  status: string;
  lastSyncedAt: Date | null;
  lastError: string | null;
};

/**
 * M13 · Integraciones (`docs/F2_ANALISIS_Y_PLAN.md` §4.3). Solo lectura: el
 * estado real de `integration_accounts` (vacía hoy — nada está conectado
 * todavía) más las seis tarjetas informativas que ya traía el prototipo, con
 * sus botones deshabilitados y el motivo por el que lo están (§16 #8: un
 * control visible sin explicación no es interfaz).
 */
const TARJETAS = [
  { provider: "crm_mirror", name: "Réplica CRM (Open Source)", text: "Espejo transaccional de contactos, negocios y actividades mediante el puerto CrmPort y eventos Outbox.", motivo: "Motor local: solo registra en consola. No hay réplica externa conectada" },
  // El motivo de `outbox` no es fijo: se calcula con el estado real de la cola (ver `describirEstadoOutbox`).
  { provider: "outbox", name: "Outbox Engine (VRE-OS)", text: "Cola de eventos de dominio con reintento exponencial; entrega idempotente cuando se ejecuta el worker.", motivo: "" },
  { provider: "google_calendar", name: "Google Calendar", text: "Cada cita puede abrirse en Google Calendar y toda la agenda puede exportarse como .ics.", motivo: "Ya disponible desde Agenda" },
  { provider: "whatsapp_business", name: "WhatsApp Business", text: "El CRM abre conversaciones desde la ficha del lead.", motivo: "Click-to-chat, sin plantillas todavía (M11)" },
  { provider: "youtube", name: "YouTube", text: "Los proyectos y avances aceptan URL de video.", motivo: "Enlace manual, sin validación de contenido" },
  { provider: "zoom", name: "Zoom / Google Meet", text: "La agenda puede almacenar enlaces de reunión.", motivo: "Enlace manual" },
  { provider: "moodle", name: "Moodle LMS (Open Source)", text: "Sincronización de cursos, progreso formativo y constancias de certificación.", motivo: "Fase posterior (Ficha I02)" },
  { provider: "meta_lead_ads", name: "Meta Lead Ads", text: "Requiere webhook, validación de firma y reglas de asignación.", motivo: "Fase posterior" },
  { provider: "google_calendar_2way", name: "Google Calendar (2 vías)", text: "Requiere OAuth 2.0 y almacenamiento cifrado de tokens.", motivo: "Fase posterior — sin OAuth todavía" },
];

export function IntegracionesPanel({
  integraciones,
  estadoOutbox = null,
}: {
  integraciones: IntegracionFila[];
  /** Conteos reales de `outbox`; `null` si no se pudieron leer. */
  estadoOutbox?: EstadoOutbox | null;
}) {
  const porProveedor = new Map(integraciones.map((i) => [i.provider, i]));

  return (
    <>
      <p className="eyebrow">Conectividad</p>
      <h2>Integraciones</h2>
      <p className="section-intro">Capacidades activas hoy y conexiones preparadas para fases posteriores.</p>
      <div className="integration-grid">
        {TARJETAS.map((tarjeta) => {
          const cuenta = porProveedor.get(tarjeta.provider);
          const estado = cuenta?.status ?? "disconnected";
          const tono = estado === "connected" ? "green" : estado === "pending" ? "gold" : "neutral";
          return (
            <article className="integration-card" key={tarjeta.provider}>
              <div>
                <strong>{tarjeta.name}</strong>
                <Badge tone={tono}>{estado === "connected" ? "Conectado" : estado === "pending" ? "Pendiente" : "Sin configurar"}</Badge>
              </div>
              <p>{tarjeta.text}</p>
              <small>{tarjeta.provider === "outbox" ? describirEstadoOutbox(estadoOutbox) : tarjeta.motivo}</small>
            </article>
          );
        })}
      </div>
      <div className="integration-guard">
        <strong>Seguridad primero</strong>
        <p>La sincronización bidireccional se habilita después de OAuth y almacenamiento cifrado de tokens. No se guardan tokens en el navegador.</p>
      </div>
    </>
  );
}
