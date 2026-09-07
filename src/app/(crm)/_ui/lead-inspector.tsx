"use client";

import { stageOrder, type Lead, type Stage } from "./datos-muestra";
import { Avatar } from "./prototipo-ui";

/**
 * Ficha lateral de un lead, compartida por Leads, Contactos y Pipeline en el
 * prototipo (`referencia-prototipo/app/page.tsx`, `LeadInspector`). Portada
 * tal cual — incluido el enlace de WhatsApp con el prefijo `1` fijo, que
 * asume República Dominicana igual que el prototipo.
 */
export function LeadInspector({
  lead,
  onMove,
  onClose,
}: {
  lead: Lead;
  onMove: (id: number, stage: Stage) => void;
  onClose: () => void;
}) {
  return (
    <aside className="inspector">
      <div className="drawer-head">
        <div>
          <p className="eyebrow">Ficha de lead</p>
          <h2>{lead.name}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar detalle">
          ×
        </button>
      </div>
      <div className="contact-hero">
        <Avatar name={lead.name} />
        <div>
          <strong>{lead.phone}</strong>
          <small>
            {lead.source} · {lead.project}
          </small>
        </div>
      </div>
      <dl className="detail-grid">
        <div>
          <dt>Presupuesto</dt>
          <dd>{lead.budget}</dd>
        </div>
        <div>
          <dt>Responsable</dt>
          <dd>{lead.broker}</dd>
        </div>
        <div>
          <dt>Etapa</dt>
          <dd>{lead.stage}</dd>
        </div>
        <div>
          <dt>Próxima acción</dt>
          <dd>{lead.next}</dd>
        </div>
      </dl>
      <label>
        Estado del negocio
        <select value={lead.stage} onChange={(event) => onMove(lead.id, event.target.value as Stage)}>
          {stageOrder.map((stage) => (
            <option key={stage}>{stage}</option>
          ))}
          <option>Perdido</option>
        </select>
      </label>
      <label>
        Nota de seguimiento
        <textarea defaultValue="Interesada en una unidad de dos habitaciones. Consulta opciones de separación y financiamiento." />
      </label>
      <div className="inspector-actions">
        <button
          className="button primary"
          onClick={() => onMove(lead.id, lead.stage === "Nuevo" ? "Contactado" : lead.stage)}
        >
          Registrar contacto
        </button>
        <a className="button whatsapp" href={`https://wa.me/1${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
          Abrir WhatsApp
        </a>
      </div>
      <div className="activity-log">
        <h3>Historial</h3>
        <div>
          <span>Hoy, 10:32</span>
          <p>Lead capturado desde {lead.source}.</p>
        </div>
        <div>
          <span>Hoy, 10:34</span>
          <p>Asignado a {lead.broker} por especialidad.</p>
        </div>
      </div>
    </aside>
  );
}
