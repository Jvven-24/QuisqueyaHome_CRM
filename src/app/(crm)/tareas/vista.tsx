"use client";

import { useState } from "react";
import { Avatar, Badge, PageHeader } from "../_ui/prototipo-ui";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (`TasksView`). M4 · Tareas se construye en F2
 * (`docs/F1_ANALISIS_Y_PLAN.md`); sustituye este `useState` local por
 * actividades reales de `activities`.
 */
export function TareasVista() {
  const [tasks, setTasks] = useState([
    { id: 1, label: "Llamar a José Reyes", due: "Hoy, 4:00 PM", done: false },
    { id: 2, label: "Enviar plan de pago a María", due: "Hoy, 5:30 PM", done: false },
    { id: 3, label: "Validar expediente de Laura", due: "Mañana, 9:00 AM", done: true },
  ]);

  function toggle(id: number) {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  }

  return (
    <>
      <PageHeader
        eyebrow="C10 · Operación"
        title="Tareas y actividades"
        subtitle="Seguimientos asociados a contactos y fechas concretas."
        action={
          <button className="button primary" type="button">
            Nueva tarea
          </button>
        }
      />
      <div className="task-layout">
        <section className="panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">Hoy</p>
              <h2>Prioridades</h2>
            </div>
            <span>{tasks.filter((task) => !task.done).length} pendientes</span>
          </div>
          <div className="task-list">
            {tasks.map((task) => (
              <label className={task.done ? "task done" : "task"} key={task.id}>
                <input checked={task.done} onChange={() => toggle(task.id)} type="checkbox" />
                <span>
                  <strong>{task.label}</strong>
                  <small>{task.due}</small>
                </span>
                <Badge tone={task.done ? "green" : "gold"}>{task.done ? "Completada" : "Pendiente"}</Badge>
              </label>
            ))}
          </div>
        </section>
        <aside className="panel">
          <p className="eyebrow">Carga del equipo</p>
          <h2>Actividades abiertas</h2>
          <div className="workload">
            {(
              [
                ["Alexandra", 4],
                ["Ismael", 3],
                ["Yostar", 2],
              ] as const
            ).map(([name, count]) => (
              <div key={name}>
                <Avatar name={name} small />
                <span>
                  <strong>{name}</strong>
                  <small>{count} actividades</small>
                </span>
                <div className="progress-line">
                  <span style={{ width: `${count * 20}%` }} />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </>
  );
}
