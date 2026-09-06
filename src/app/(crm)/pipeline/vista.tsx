"use client";

import { useState } from "react";
import { initialLeads, properties, stageOrder, type Lead, type Stage } from "../_ui/datos-muestra";
import { Avatar, PageHeader } from "../_ui/prototipo-ui";
import { LeadInspector } from "../_ui/lead-inspector";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (`PipelineView`), incluido el arrastre nativo con `dataTransfer` (sin
 * librería). M3 · Pipeline (F1, `docs/F1_ANALISIS_Y_PLAN.md`) la sustituye
 * por el Kanban real conectado a `deals`, con `validarTransicion` por etapa y
 * columna para `Perdido` (defecto conocido del prototipo,
 * `docs/contexto/errores-conocidos.md`).
 */
export function PipelineVista({ roleSlug }: { roleSlug: string }) {
  const isBroker = roleSlug === "broker";
  const [leads, setLeads] = useState<Lead[]>(
    isBroker ? initialLeads.filter((lead) => lead.broker === "Yostar Medina") : initialLeads,
  );
  const [selected, setSelected] = useState<Lead | null>(null);

  function moveLead(id: number, stage: Stage) {
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, stage } : lead)));
    setSelected((current) => (current && current.id === id ? { ...current, stage } : current));
  }

  return (
    <>
      <PageHeader
        eyebrow="C3 · Ventas"
        title="Pipeline"
        subtitle="Mueve cada oportunidad y mantén visible la siguiente acción."
        action={
          <div className="pipeline-total">
            <span>Valor activo</span>
            <strong>US$2.8M</strong>
          </div>
        }
      />
      <div className="filter-bar">
        <select>
          <option>Todos los brokers</option>
          <option>Ismael Rosario</option>
          <option>Yostar Medina</option>
        </select>
        <select>
          <option>Todos los proyectos</option>
          {properties.map((property) => (
            <option key={property.name}>{property.name}</option>
          ))}
        </select>
        <span>Arrastra para cambiar de etapa</span>
      </div>
      <div className={selected ? "pipeline-layout inspector-open" : "pipeline-layout"}>
        <div className="kanban">
          {stageOrder.map((stage) => {
            const stageLeads = leads.filter((lead) => lead.stage === stage);
            return (
              <section
                className="kanban-column"
                key={stage}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => moveLead(Number(event.dataTransfer.getData("leadId")), stage)}
              >
                <header>
                  <span>{stage}</span>
                  <strong>{stageLeads.length}</strong>
                </header>
                <div>
                  {stageLeads.map((lead) => (
                    <button
                      className="deal-card"
                      draggable
                      key={lead.id}
                      onDragStart={(event) => event.dataTransfer.setData("leadId", String(lead.id))}
                      onClick={() => setSelected(lead)}
                    >
                      <span className="deal-source">{lead.source}</span>
                      <strong>{lead.name}</strong>
                      <small>{lead.project}</small>
                      <b>{lead.budget}</b>
                      <span>{lead.next}</span>
                      <footer>
                        <Avatar name={lead.broker} small />
                        <small>{lead.broker.split(" ")[0]}</small>
                      </footer>
                    </button>
                  ))}
                  {!stageLeads.length && <div className="kanban-empty">Suelta aquí</div>}
                </div>
              </section>
            );
          })}
        </div>
        {selected && <LeadInspector lead={selected} onMove={moveLead} onClose={() => setSelected(null)} />}
      </div>
    </>
  );
}
