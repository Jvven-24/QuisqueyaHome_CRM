"use client";

import { useState } from "react";
import { PageHeader } from "../_ui/prototipo-ui";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (`CommunicationsView`). M11 · Comunicaciones se construye en F4
 * (`docs/F1_ANALISIS_Y_PLAN.md`); sustituye estas plantillas locales por
 * plantillas reales y el envío por integración de WhatsApp Business.
 */
export function ComunicacionesVista() {
  const [template, setTemplate] = useState(
    "Hola {nombre}, gracias por tu interés en {proyecto}. ¿Te gustaría coordinar una llamada?",
  );
  const [name, setName] = useState("Ana");
  const [project, setProject] = useState("Bávaro Beach Lofts");
  const preview = template.replace("{nombre}", name).replace("{proyecto}", project);

  return (
    <>
      <PageHeader
        eyebrow="C11 · WhatsApp"
        title="Comunicaciones"
        subtitle="Plantillas consistentes con el contexto de cada lead."
      />
      <div className="communications-layout">
        <section className="panel template-list">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Plantillas</p>
              <h2>Mensajes guardados</h2>
            </div>
            <button className="text-button" type="button">
              Nueva
            </button>
          </div>
          {["Primer contacto", "Confirmación de cita", "Seguimiento de proyecto"].map((item, index) => (
            <button className={index === 0 ? "active" : ""} key={item} type="button">
              <strong>{item}</strong>
              <small>{index === 0 ? "Lead nuevo" : index === 1 ? "Agenda" : "Seguimiento"}</small>
            </button>
          ))}
        </section>
        <section className="panel message-editor">
          <p className="eyebrow">Vista previa</p>
          <label>
            Nombre
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            Proyecto
            <input value={project} onChange={(event) => setProject(event.target.value)} />
          </label>
          <label>
            Mensaje
            <textarea value={template} onChange={(event) => setTemplate(event.target.value)} />
          </label>
          <div className="phone-preview">
            <span>WhatsApp Business</span>
            <p>{preview}</p>
            <small>10:42 AM</small>
          </div>
          <button className="button primary" type="button">
            Abrir en WhatsApp
          </button>
        </section>
      </div>
    </>
  );
}
