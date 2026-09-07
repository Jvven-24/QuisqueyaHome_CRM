"use client";

import { useState } from "react";
import { PageHeader } from "../_ui/prototipo-ui";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (`ProgressView`). M6 · Avances de obra se construye en F3
 * (`docs/F1_ANALISIS_Y_PLAN.md`); sustituye este `useState` local por
 * `construction_phases` real, incluida la carga de fotos (hoy solo botón
 * decorativo, sin backend de archivos).
 */
const phases = [
  "Movimiento de tierra",
  "Cimientos",
  "Estructura",
  "Muros",
  "Instalaciones",
  "Terminaciones",
  "Áreas comunes",
  "Entrega",
];

export function AvancesVista() {
  const [progress, setProgress] = useState(60);
  const [selected, setSelected] = useState(2);

  return (
    <>
      <PageHeader
        eyebrow="C13 · Gestión manual"
        title="Avances de obra"
        subtitle="Praderas de Punta Cana · 8 fases · Entrega diciembre 2027"
        action={
          <button className="button primary" type="button">
            Publicar en el portal
          </button>
        }
      />
      <div className="phase-timeline">
        {phases.map((phase, index) => (
          <button
            className={index === selected ? "active" : index < 2 ? "complete" : ""}
            key={phase}
            type="button"
            onClick={() => setSelected(index)}
          >
            <span>{index < 2 ? "✓" : index + 1}</span>
            <strong>{phase}</strong>
            <small>{index < 2 ? "Completado" : index === 2 ? `En curso ${progress}%` : "Pendiente"}</small>
          </button>
        ))}
      </div>
      <div className="progress-editor">
        <section className="panel">
          <p className="eyebrow">Fase {selected + 1}</p>
          <h2>{phases[selected]}</h2>
          <div className="form-grid">
            <label>
              Estado
              <select defaultValue={selected < 2 ? "Completado" : selected === 2 ? "En curso" : "Pendiente"}>
                <option>Pendiente</option>
                <option>En curso</option>
                <option>Completado</option>
                <option>Retrasado</option>
              </select>
            </label>
            <label>
              Fecha de actualización
              <input type="date" defaultValue="2026-07-24" />
            </label>
            <label className="span-2">
              Porcentaje de avance <output>{progress}%</output>
              <input
                className="range"
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={(event) => setProgress(Number(event.target.value))}
              />
            </label>
            <label className="span-2">
              URL de video de YouTube
              <input type="url" placeholder="https://youtube.com/watch?v=" />
            </label>
            <label className="span-2">
              Nota pública
              <textarea defaultValue="La estructura del tercer nivel avanza según el cronograma previsto." />
            </label>
          </div>
        </section>
        <aside className="panel upload-panel">
          <p className="eyebrow">Evidencia</p>
          <h2>Fotos de obra</h2>
          <div className="photo-grid">
            <div>Frente</div>
            <div>Estructura</div>
            <div>Detalle</div>
            <button type="button">Agregar fotos</button>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>Responsable</dt>
              <dd>Alexandra Núñez</dd>
            </div>
            <div>
              <dt>Última edición</dt>
              <dd>Hoy, 9:42 AM</dd>
            </div>
          </dl>
          <p className="helper">El comprador verá la nota, el porcentaje y las fotografías en el portal público.</p>
        </aside>
      </div>
    </>
  );
}
