"use client";

import { useState } from "react";
import { Badge, PageHeader } from "../_ui/prototipo-ui";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (`AcademyView`). M10 · Academy se construye en F4
 * (`docs/F1_ANALISIS_Y_PLAN.md`); sustituye este `useState` local por
 * progreso real por broker.
 */
const courses = [
  ["Manejo de objeciones", "Sesión de lunes", "48 min"],
  ["Presentación de proyectos en planos", "Sesión de lunes", "62 min"],
  ["Cómo dar de alta un alquiler", "Checklist operativo", "8 pasos"],
  ["Proceso de reserva y separación", "Checklist operativo", "6 pasos"],
] as const;

export function AcademyVista() {
  const [done, setDone] = useState([true, true, false, false]);
  const completed = done.filter(Boolean).length;

  function toggle(index: number) {
    setDone((current) => current.map((value, itemIndex) => (itemIndex === index ? !value : value)));
  }

  return (
    <>
      <PageHeader
        eyebrow="C7 · Formación"
        title="Academy"
        subtitle="Sesiones grabadas y procesos operativos para todo el equipo."
      />
      <div className="academy-layout">
        <div>
          <div className="filter-bar">
            <div className="segmented">
              <button className="active" type="button">Todas</button>
              <button type="button">Sesiones</button>
              <button type="button">Checklists</button>
              <button type="button">Pendientes</button>
            </div>
          </div>
          <div className="course-grid">
            {courses.map(([title, type, duration], index) => (
              <article className="course-card" key={title}>
                <div className={`course-cover cover-${index}`}>
                  <span>QH Academy</span>
                  <b>{duration}</b>
                </div>
                <div>
                  <Badge tone={type === "Checklist operativo" ? "blue" : "gold"}>{type}</Badge>
                  <h2>{title}</h2>
                  <div className="progress-line">
                    <span style={{ width: done[index] ? "100%" : index === 2 ? "70%" : "0%" }} />
                  </div>
                  <button className={done[index] ? "button secondary wide" : "button primary wide"} type="button" onClick={() => toggle(index)}>
                    {done[index] ? "Completado" : index === 2 ? "Continuar" : "Comenzar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
        <aside className="panel academy-progress">
          <p className="eyebrow">Tu progreso</p>
          <div className="goal-ring" style={{ "--progress": `${completed * 25}%` } as React.CSSProperties}>
            <strong>{completed * 25}%</strong>
          </div>
          <h2>{completed} de 4 contenidos</h2>
          <p>Completa los procesos pendientes para mantener tu perfil al día.</p>
          <div className="checklist">
            {["Identificar propiedad", "Validar disponibilidad", "Confirmar comisión", "Crear ficha", "Publicar rango"].map(
              (item, index) => (
                <label key={item}>
                  <input type="checkbox" defaultChecked={index < 3} />
                  {item}
                </label>
              ),
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
