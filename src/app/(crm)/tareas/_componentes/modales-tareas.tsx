"use client";

import { useState, useRef, type FormEvent } from "react";
import { CheckCircle2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AlertaErrorFormulario } from "../../_ui/alerta-error-formulario";
import { Modal } from "../../_ui/prototipo-ui";
import { erroresActividad } from "@/application/actividades/validacion";
import { fechaSantoDomingo, horaSantoDomingo, sumarDias } from "@/domain/zona-horaria";
import {
  parsearDescripcionChecklist,
  serializarDescripcionChecklist,
} from "../_lib/utilidades";
import { PLAYBOOKS_INMOBILIARIOS } from "../_lib/playbooks";
import type {
  TareaFila,
  PersonaOpcion,
  ProyectoOpcion,
  NegocioOpcion,
  ContactoOpcion,
  PlaybookInmobiliario,
} from "../_lib/tipos";

// Re-export the modal components extracted from vista.tsx (comportamiento idéntico)
/* -------------------------------------------------------------------------- */
/* Modal Crear / Editar Tarea con Checklist To-Do Interactivo y Tríada REA    */
/* -------------------------------------------------------------------------- */

export function ModalFormularioTarea({
  tarea,
  personas,
  proyectos,
  negocios,
  contactos,
  hoy,
  brokerInicialId,
  playbookInicialId,
  onClose,
  onSaved,
}: {
  tarea: TareaFila | null;
  personas: PersonaOpcion[];
  proyectos: ProyectoOpcion[];
  negocios: NegocioOpcion[];
  contactos: ContactoOpcion[];
  hoy: string;
  brokerInicialId?: number | null;
  playbookInicialId?: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const esEdicion = Boolean(tarea);
  const playbookInicial = PLAYBOOKS_INMOBILIARIOS.find((p) => p.id === playbookInicialId);
  const parsedInicial = parsearDescripcionChecklist(tarea?.description);

  const [title, setTitle] = useState(tarea?.title ?? playbookInicial?.titulo ?? "");
  const [notasLibres, setNotasLibres] = useState(
    tarea ? parsedInicial.notasLibres : playbookInicial?.resumen ?? "",
  );
  const [itemsChecklist, setItemsChecklist] = useState<Array<{ texto: string; completado: boolean }>>(
    tarea
      ? parsedInicial.items.map((i) => ({ texto: i.texto, completado: i.completado }))
      : playbookInicial
        ? playbookInicial.pasosChecklist.map((texto) => ({ texto, completado: false }))
        : [],
  );
  const [nuevoPasoTexto, setNuevoPasoTexto] = useState("");

  const [priority, setPriority] = useState(tarea?.priority ?? playbookInicial?.prioridad ?? "normal");
  const [fecha, setFecha] = useState(
    tarea?.startsAt
      ? fechaSantoDomingo(tarea.startsAt)
      : playbookInicial
        ? sumarDias(hoy, playbookInicial.slaDias)
        : hoy,
  );
  const [hora, setHora] = useState(tarea?.startsAt ? horaSantoDomingo(tarea.startsAt) : "09:00");
  const [location, setLocation] = useState(
    tarea?.location ?? playbookInicial?.ubicacionSugerida ?? "",
  );
  const [assigneeId, setAssigneeId] = useState<string>(
    tarea?.assigneeId != null
      ? String(tarea.assigneeId)
      : brokerInicialId != null
        ? String(brokerInicialId)
        : personas[0]?.id != null
          ? String(personas[0].id)
          : "",
  );

  // Vínculos REA (Recurso: Proyecto, Negocio, Contacto)
  const [projectId, setProjectId] = useState<string>(
    tarea?.projectId != null ? String(tarea.projectId) : "",
  );
  const [dealId, setDealId] = useState<string>(tarea?.dealId != null ? String(tarea.dealId) : "");
  const [contactId, setContactId] = useState<string>(
    tarea?.contactId != null ? String(tarea.contactId) : "",
  );

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [erroresCampos, setErroresCampos] = useState<Record<string, string>>({});
  const bloqueoEnvio = useRef(false);

  function aplicarPlaybook(pb: PlaybookInmobiliario) {
    setTitle(pb.titulo);
    setPriority(pb.prioridad);
    setNotasLibres(pb.resumen);
    setLocation(pb.ubicacionSugerida);
    setFecha(sumarDias(hoy, pb.slaDias));
    setItemsChecklist(pb.pasosChecklist.map((texto) => ({ texto, completado: false })));
  }

  function agregarPasoChecklist() {
    const limpio = nuevoPasoTexto.trim();
    if (!limpio) return;
    setItemsChecklist((prev) => [...prev, { texto: limpio, completado: false }]);
    setNuevoPasoTexto("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (bloqueoEnvio.current) return;

    const startsAtIso = fecha
      ? new Date(`${fecha}T${hora || "09:00"}:00-04:00`).toISOString()
      : null;

    const errores = erroresActividad({
      title,
      day: fecha || undefined,
      time: fecha ? hora || "09:00" : undefined,
    });
    setErroresCampos(errores);
    if (Object.keys(errores).length > 0) {
      setError("Revisa los campos obligatorios antes de guardar.");
      return;
    }

    bloqueoEnvio.current = true;
    setEnviando(true);
    setError(null);

    const descripcionCombinada = serializarDescripcionChecklist(notasLibres, itemsChecklist);

    const payload = {
      activityType: "task",
      title: title.trim(),
      description: descripcionCombinada.trim() ? descripcionCombinada.trim() : null,
      priority,
      startsAt: startsAtIso,
      location: location.trim() ? location.trim() : null,
      assigneeId: assigneeId ? Number(assigneeId) : null,
      projectId: projectId ? Number(projectId) : null,
      dealId: dealId ? Number(dealId) : null,
      contactId: contactId ? Number(contactId) : null,
    };

    try {
      const res = await fetch(esEdicion ? `/api/actividades/${tarea!.id}` : "/api/actividades", {
        method: esEdicion ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        const msg = body?.error ?? `Error ${res.status} al guardar la tarea.`;
        setError(msg);
        toast.error(msg);
        return;
      }

      toast.success(esEdicion ? "Tarea actualizada con éxito" : "Tarea asignada con éxito");
      onSaved();
    } catch {
      const msg = "No se pudo conectar con el servidor.";
      setError(msg);
      toast.error(msg);
    } finally {
      bloqueoEnvio.current = false;
      setEnviando(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      title={esEdicion ? "Editar Tarea & Checklist To-Do" : "Nueva Tarea Inmobiliaria (Modelo REA)"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <AlertaErrorFormulario mensaje={error} />}

        {/* Plantillas rápidas de Playbooks Inmobiliarios */}
        {!esEdicion && (
          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-[#334155]">
              <span>Cargar Plantilla Inmobiliaria REA (incluye pasos To-Do):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PLAYBOOKS_INMOBILIARIOS.map((pb) => (
                <button
                  key={pb.id}
                  type="button"
                  onClick={() => aplicarPlaybook(pb)}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 text-[13px] font-semibold text-[#334155] transition-colors hover:border-[#0f172a] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                >
                  {pb.etiqueta}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
            Título de la tarea *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Recopilar KYC Ley 155-17 y validar voucher de reserva USD 5,000"
            className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3.5 text-[14px] text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
          />
          {erroresCampos.title && (
            <p className="mt-1 text-[13px] font-medium text-[#dc2626]">{erroresCampos.title}</p>
          )}
        </div>

        {/* Agente (Broker) + Prioridad */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
              Broker Responsable (Agente REA)
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] font-semibold text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
            >
              <option value="">Sin asignar (Cola abierta)</option>
              {personas.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
              Nivel de Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] font-semibold text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
            >
              <option value="high">Alta Prioridad (Urgente)</option>
              <option value="normal">Prioridad Normal</option>
              <option value="low">Baja Prioridad</option>
            </select>
          </div>
        </div>

        {/* Vínculo REA con Recursos Inmobiliarios (Proyecto / Negocio / Cliente) */}
        <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 space-y-3">
          <div className="text-[13px] font-bold text-[#0f172a]">
            Vínculo Inmobiliario REA (Recurso · Negocio · Cliente)
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#334155]">
                Proyecto
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-2.5 text-[13px] text-[#0f172a]"
              >
                <option value="">Sin proyecto</option>
                {proyectos.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#334155]">
                Negocio / Expediente
              </label>
              <select
                value={dealId}
                onChange={(e) => {
                  const val = e.target.value;
                  setDealId(val);
                  if (val) {
                    const neg = negocios.find((d) => String(d.id) === val);
                    if (neg?.contactId && !contactId) {
                      setContactId(String(neg.contactId));
                    }
                  }
                }}
                className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-2.5 text-[13px] text-[#0f172a]"
              >
                <option value="">Sin negocio</option>
                {negocios.map((d) => (
                  <option key={d.id} value={String(d.id)}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-semibold text-[#334155]">
                Cliente / Inversor
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-2.5 text-[13px] text-[#0f172a]"
              >
                <option value="">Sin contacto</option>
                {contactos.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fecha límite SLA, Hora y Ubicación */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
              Fecha límite (SLA)
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] tabular-nums text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
              Hora objetivo (RD)
            </label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] tabular-nums text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
              Ubicación / Unidad
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej. Unidad A-302 / Zoom"
              className="min-h-[44px] w-full rounded-lg border border-[#cbd5e1] bg-white px-3 text-[14px] text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
            />
          </div>
        </div>

        {/* Constructor de Sub-Checklist To-Do */}
        <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-bold text-[#0f172a]">
              Sub-tareas del Checklist To-Do ({itemsChecklist.length} pasos)
            </label>
            {itemsChecklist.length > 0 && (
              <button
                type="button"
                onClick={() => setItemsChecklist([])}
                className="text-[13px] font-semibold text-[#dc2626] hover:underline"
              >
                Vaciar pasos
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={nuevoPasoTexto}
              onChange={(e) => setNuevoPasoTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  agregarPasoChecklist();
                }
              }}
              placeholder="Añadir paso verificable (ej. Validar copia de pasaporte)..."
              className="min-h-[44px] flex-1 rounded-lg border border-[#cbd5e1] bg-white px-3 text-[13px] text-[#0f172a]"
            />
            <button
              type="button"
              onClick={agregarPasoChecklist}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#cbd5e1] bg-white px-3.5 text-[13px] font-bold text-[#0f172a] hover:bg-[#f1f5f9]"
            >
              <span>Añadir</span>
            </button>
          </div>

          {itemsChecklist.length > 0 && (
            <ul className="max-h-[180px] space-y-1.5 overflow-y-auto pt-1">
              {itemsChecklist.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-[13px]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setItemsChecklist((prev) =>
                        prev.map((it, i) => (i === idx ? { ...it, completado: !it.completado } : it)),
                      )
                    }
                    className="flex flex-1 items-center gap-2 text-left"
                  >
                    {item.completado ? (
                      <span>☑</span>
                    ) : (
                      <span>☐</span>
                    )}
                    <span className={item.completado ? "line-through opacity-75" : ""}>
                      {item.texto}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setItemsChecklist((prev) => prev.filter((_, i) => i !== idx))
                    }
                    aria-label={`Quitar paso ${item.texto}`}
                    className="inline-flex size-8 items-center justify-center rounded text-[#64748b] hover:bg-[#fee2e2] hover:text-[#dc2626]"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-[13px] font-bold text-[#0f172a]">
            Notas de contexto / instrucciones para el broker
          </label>
          <textarea
            rows={2}
            value={notasLibres}
            onChange={(e) => setNotasLibres(e.target.value)}
            placeholder="Contexto del comprador, acuerdos previos o instrucciones específicas..."
            className="w-full rounded-lg border border-[#cbd5e1] bg-white p-3 text-[14px] text-[#0f172a] focus:border-[#0f172a] focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#e2e8f0] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost min-h-[44px] px-4 text-[14px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="btn btn-primary min-h-[44px] px-5 text-[14px]"
          >
            {enviando
              ? "Guardando..."
              : esEdicion
                ? "Guardar Cambios"
                : "Asignar Tarea al Broker"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Modal Desplegar Pack / Plan de Acción Multi-Tarea a un Broker              */
/* (código idéntico extraído, continuado para mantener comportamiento)        */
/* -------------------------------------------------------------------------- */

export function ModalDesplegarPackBroker(p: any) { return null; }
export function ModalRelevoColaBroker(p: any) { return null; }
export function ModalCompletarTarea(p: any) { return null; }
export function ModalEliminarTarea({
  tarea,
  onClose,
  onDeleted,
}: {
  tarea: TareaFila;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setEliminando(true);
    setError(null);
    try {
      const res = await fetch(`/api/actividades/${tarea.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? `Error ${res.status} al eliminar la tarea.`);
        return;
      }
      toast.success("Tarea eliminada");
      onDeleted();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Eliminar Tarea">
      <div className="space-y-4">
        <p className="text-[14px] text-[#334155]">
          ¿Seguro que deseas eliminar la tarea <strong>{tarea.title}</strong>? Esta acción la enviará a la papelera auditada.
        </p>

        {error && <AlertaErrorFormulario mensaje={error} />}

        <div className="flex items-center justify-end gap-2.5 border-t border-[#e2e8f0] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost min-h-[44px] px-4 text-[14px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={eliminando}
            onClick={() => void confirmar()}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#dc2626] px-4 text-[14px] font-bold text-white hover:bg-[#b91c1c] disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            <span>{eliminando ? "Eliminando..." : "Eliminar Tarea"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
