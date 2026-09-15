"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { fechaSantoDomingo, horaSantoDomingo } from "@/domain/zona-horaria";
import { Avatar, Badge, Modal, PageHeader } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";

export type TareaFila = {
  id: number;
  title: string;
  activityType: string;
  priority: string;
  startsAt: Date | null;
  assigneeId: number | null;
  assigneeName: string | null;
};

export type CargaEquipoFila = { assigneeId: number | null; assigneeName: string | null; total: number };
export type PersonaOpcion = { id: number; fullName: string };

function etiquetaFecha(startsAt: Date | null): string {
  if (!startsAt) return "Sin fecha límite";
  const hoy = fechaSantoDomingo(new Date());
  const fecha = fechaSantoDomingo(startsAt);
  const hora = horaSantoDomingo(startsAt);
  if (fecha === hoy) return `Hoy, ${hora}`;
  return `Vencida — ${fecha}, ${hora}`;
}

/**
 * M4 · Tareas (F2). Cola real de `activities` en vez del `useState` local del
 * prototipo. Marcar/desmarcar hecha es un `PATCH` de `status`, y "Carga del
 * equipo" ahora cuenta actividades pendientes reales — no las cifras fijas
 * del mock.
 */
export function TareasVista({
  tareas,
  cargaEquipo,
  personas,
  muestraCargaEquipo,
}: {
  tareas: TareaFila[];
  cargaEquipo: CargaEquipoFila[];
  personas: PersonaOpcion[];
  muestraCargaEquipo: boolean;
}) {
  const router = useRouter();
  const [creando, setCreando] = useState(false);
  const [actualizando, setActualizando] = useState<number | null>(null);

  // La cola solo trae pendientes (`page.tsx` ya filtra `status = 'pending'`):
  // marcarla es siempre completar, nunca reabrir. Reabrir una ya completada
  // es un caso de la ficha de la actividad, no de esta lista.
  async function completar(tarea: TareaFila) {
    setActualizando(tarea.id);
    const respuesta = await fetch(`/api/actividades/${tarea.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    setActualizando(null);
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      alert(cuerpo.error ?? "No se pudo actualizar la tarea.");
      return;
    }
    router.refresh();
  }

  const maxCarga = Math.max(1, ...cargaEquipo.map((fila) => fila.total));

  return (
    <>
      <PageHeader
        eyebrow="C10 · Operación"
        title="Tareas y actividades"
        subtitle="Seguimientos asociados a contactos y fechas concretas."
        action={
          <button className="button primary" type="button" onClick={() => setCreando(true)}>
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
            <span>{tareas.length} pendientes</span>
          </div>
          {tareas.length === 0 ? (
            <Vacio titulo="Sin tareas pendientes" texto="La cola del día está en cero. Registra una con “Nueva tarea”." />
          ) : (
            <div className="task-list">
              {tareas.map((tarea) => (
                <label className="task" key={tarea.id}>
                  <input
                    checked={false}
                    disabled={actualizando === tarea.id}
                    onChange={() => void completar(tarea)}
                    type="checkbox"
                  />
                  <span>
                    <strong>{tarea.title}</strong>
                    <small>
                      {etiquetaFecha(tarea.startsAt)}
                      {tarea.assigneeName ? ` · ${tarea.assigneeName}` : ""}
                    </small>
                  </span>
                  <Badge tone={tarea.priority === "high" ? "red" : "gold"}>Pendiente</Badge>
                </label>
              ))}
            </div>
          )}
        </section>
        {muestraCargaEquipo && (
          <aside className="panel">
            <p className="eyebrow">Carga del equipo</p>
            <h2>Actividades abiertas</h2>
            {cargaEquipo.length === 0 ? (
              <Vacio titulo="Sin actividades abiertas" texto="Nadie tiene pendientes en este momento." />
            ) : (
              <div className="workload">
                {cargaEquipo.map((fila) => (
                  <div key={fila.assigneeId ?? "sin-asignar"}>
                    <Avatar name={fila.assigneeName ?? "Sin asignar"} small />
                    <span>
                      <strong>{fila.assigneeName ?? "Sin asignar"}</strong>
                      <small>{fila.total} actividades</small>
                    </span>
                    <div className="progress-line">
                      <span style={{ width: `${(fila.total / maxCarga) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
      {creando && <FormularioTarea personas={personas} onClose={() => setCreando(false)} />}
    </>
  );
}

function FormularioTarea({ personas, onClose }: { personas: PersonaOpcion[]; onClose: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setEnviando(true);
    setErrores({});

    const form = new FormData(formRef.current);
    const fecha = String(form.get("dueDate") ?? "");
    const datos = {
      activityType: "task",
      title: form.get("title"),
      assigneeId: form.get("assigneeId") || undefined,
      // Fecha sin hora: mediodía local evita que el redondeo a UTC la mueva
      // al día anterior o siguiente en el listado por fecha.
      startsAt: fecha ? `${fecha}T12:00:00-04:00` : undefined,
      priority: form.get("priority"),
    };
    const respuesta = await fetch("/api/actividades", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json().catch(() => ({}));
    setEnviando(false);

    if (!respuesta.ok) {
      setErrores(cuerpo.fields ?? { _: cuerpo.error ?? "No se pudo crear la tarea." });
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <Modal title="Nueva tarea" onClose={onClose}>
      <form className="form-grid" ref={formRef} onSubmit={enviar}>
        <label className="span-2">
          Título
          <input name="title" required autoFocus placeholder="Llamar a…" />
          {errores.title && <small style={{ color: "#b42318" }}>{errores.title}</small>}
        </label>
        <label>
          Fecha límite
          <input name="dueDate" type="date" />
        </label>
        <label>
          Prioridad
          <select name="priority" defaultValue="normal">
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
          </select>
        </label>
        <label className="span-2">
          Responsable
          <select name="assigneeId" defaultValue="">
            <option value="">Quien la crea</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.fullName}
              </option>
            ))}
          </select>
        </label>
        {errores._ && <small style={{ color: "#b42318" }}>{errores._}</small>}
        <div className="form-actions span-2">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" type="submit" disabled={enviando}>
            {enviando ? "Creando…" : "Crear tarea"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
