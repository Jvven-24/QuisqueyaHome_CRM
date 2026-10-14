"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  MapPin,
  Plus,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { fechaSantoDomingo, horaSantoDomingo } from "@/domain/zona-horaria";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import { Avatar, Badge, Modal, PageHeader } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";

export type TareaFila = {
  id: number;
  title: string;
  description?: string | null;
  activityType: string;
  priority: string;
  startsAt: Date | null;
  location?: string | null;
  assigneeId: number | null;
  assigneeName: string | null;
};

export type CargaEquipoFila = {
  assigneeId: number | null;
  assigneeName: string | null;
  total: number;
};

export type PersonaOpcion = { id: number; fullName: string };

type Urgencia = "vencidas" | "hoy" | "proximas";

function calcularUrgencia(startsAt: Date | null, hoy: string): Urgencia {
  if (!startsAt) return "proximas";
  const fecha = fechaSantoDomingo(startsAt);
  if (fecha < hoy) return "vencidas";
  if (fecha === hoy) return "hoy";
  return "proximas";
}

function etiquetaFecha(startsAt: Date | null, hoy: string): { texto: string; tono: "red" | "gold" | "green" | "neutral" } {
  if (!startsAt) {
    return { texto: "Sin fecha límite asignada", tono: "neutral" };
  }
  const fecha = fechaSantoDomingo(startsAt);
  const hora = horaSantoDomingo(startsAt);
  if (fecha < hoy) {
    return { texto: `Vencida · ${fecha}, ${hora}`, tono: "red" };
  }
  if (fecha === hoy) {
    return { texto: `Hoy · ${hora}`, tono: "gold" };
  }
  return { texto: `Próxima · ${fecha}, ${hora}`, tono: "green" };
}

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
  const hoy = fechaSantoDomingo(new Date());

  const [creando, setCreando] = useState(false);
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);
  const [completadas, setCompletadas] = useState<Set<number>>(new Set());

  // Filtros
  const [filtroUrgencia, setFiltroUrgencia] = useState<"todas" | Urgencia>("todas");
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>("todas");
  const [filtroResponsable, setFiltroResponsable] = useState<number | "todos">("todos");
  const [busqueda, setBusqueda] = useState("");

  // Notificaciones sin alert nativo
  const [mensajeToast, setMensajeToast] = useState<{ texto: string; tipo: "exito" | "error" } | null>(null);

  // Clasificación por semáforo
  const tareasConUrgencia = useMemo(() => {
    return tareas.map((t) => ({
      ...t,
      urgencia: calcularUrgencia(t.startsAt, hoy),
    }));
  }, [tareas, hoy]);

  const conteoVencidas = useMemo(
    () => tareasConUrgencia.filter((t) => t.urgencia === "vencidas" && !completadas.has(t.id)).length,
    [tareasConUrgencia, completadas],
  );

  const conteoHoy = useMemo(
    () => tareasConUrgencia.filter((t) => t.urgencia === "hoy" && !completadas.has(t.id)).length,
    [tareasConUrgencia, completadas],
  );

  const conteoProximas = useMemo(
    () => tareasConUrgencia.filter((t) => t.urgencia === "proximas" && !completadas.has(t.id)).length,
    [tareasConUrgencia, completadas],
  );

  const conteoTotalPendientes = useMemo(
    () => tareasConUrgencia.filter((t) => !completadas.has(t.id)).length,
    [tareasConUrgencia, completadas],
  );

  // Tareas filtradas para la lista
  const tareasFiltradas = useMemo(() => {
    return tareasConUrgencia.filter((tarea) => {
      if (filtroUrgencia !== "todas" && tarea.urgencia !== filtroUrgencia) {
        return false;
      }
      if (filtroPrioridad !== "todas" && tarea.priority !== filtroPrioridad) {
        return false;
      }
      if (filtroResponsable !== "todos" && tarea.assigneeId !== filtroResponsable) {
        return false;
      }
      if (busqueda.trim() !== "") {
        const query = busqueda.toLowerCase();
        const coincideTitulo = tarea.title.toLowerCase().includes(query);
        const coincideResponsable = (tarea.assigneeName ?? "").toLowerCase().includes(query);
        const coincideUbicacion = (tarea.location ?? "").toLowerCase().includes(query);
        if (!coincideTitulo && !coincideResponsable && !coincideUbicacion) {
          return false;
        }
      }
      return true;
    });
  }, [tareasConUrgencia, filtroUrgencia, filtroPrioridad, filtroResponsable, busqueda]);

  // Completar tarea con tachado suave y animación
  async function completar(tarea: TareaFila) {
    if (actualizandoId !== null || completadas.has(tarea.id)) return;

    setActualizandoId(tarea.id);
    // Optimistic tachado suave
    setCompletadas((prev) => new Set(prev).add(tarea.id));

    try {
      const respuesta = await fetch(`/api/actividades/${tarea.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}));
        throw new Error(cuerpo.error ?? "No se pudo actualizar la tarea.");
      }

      setMensajeToast({
        texto: `Tarea completada: "${tarea.title.slice(0, 32)}..."`,
        tipo: "exito",
      });

      // Breve pausa para que el usuario aprecie el tachado suave antes de refrescar
      setTimeout(() => {
        router.refresh();
      }, 700);
    } catch (err) {
      // Revertir estado optimista
      setCompletadas((prev) => {
        const copia = new Set(prev);
        copia.delete(tarea.id);
        return copia;
      });
      setMensajeToast({
        texto: err instanceof Error ? err.message : "Error al completar la tarea.",
        tipo: "error",
      });
    } finally {
      setActualizandoId(null);
      setTimeout(() => setMensajeToast(null), 4000);
    }
  }

  const maxCarga = Math.max(1, ...cargaEquipo.map((f) => f.total));
  const sumaTotalCargaEquipo = cargaEquipo.reduce((acc, f) => acc + f.total, 0);

  return (
    <>
      <PageHeader
        eyebrow="Operación diaria"
        title="Tareas y actividades"
        subtitle="Checklist operativo, semáforo de urgencia y balance de carga del equipo de ventas."
        action={
          <button
            className="button primary inline-flex items-center gap-2 min-h-[44px] px-5 font-bold text-[13px]"
            type="button"
            onClick={() => setCreando(true)}
          >
            <Plus className="w-4 h-4" />
            <span>Nueva tarea</span>
          </button>
        }
      />

      {/* Toast no intrusivo sin alert nativo */}
      {mensajeToast && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 p-3.5 mb-5 rounded-xl border text-[13px] font-semibold transition-all ${
            mensajeToast.tipo === "exito"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs"
              : "bg-red-50 border-red-300 text-red-950 shadow-xs"
          }`}
        >
          <div className="flex items-center gap-2">
            {mensajeToast.tipo === "exito" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{mensajeToast.texto}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeToast(null)}
            className="text-slate-400 hover:text-slate-700 min-h-[32px] p-1"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Semáforo de urgencia interactivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setFiltroUrgencia("todas")}
          className={`p-3.5 rounded-xl border text-left transition-all min-h-[64px] ${
            filtroUrgencia === "todas"
              ? "bg-navy-950 text-white border-navy-950 shadow-sm"
              : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold uppercase tracking-wider opacity-80">
              Todas
            </span>
            <Calendar className="w-4 h-4 opacity-60" />
          </div>
          <div className="text-xl font-extrabold">{conteoTotalPendientes}</div>
        </button>

        <button
          type="button"
          onClick={() => setFiltroUrgencia("vencidas")}
          className={`p-3.5 rounded-xl border text-left transition-all min-h-[64px] ${
            filtroUrgencia === "vencidas"
              ? "bg-red-600 text-white border-red-600 shadow-sm"
              : "bg-red-50/60 text-red-950 border-red-200 hover:bg-red-50"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-500 animate-pulse" />
              Vencidas
            </span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold">{conteoVencidas}</div>
        </button>

        <button
          type="button"
          onClick={() => setFiltroUrgencia("hoy")}
          className={`p-3.5 rounded-xl border text-left transition-all min-h-[64px] ${
            filtroUrgencia === "hoy"
              ? "bg-amber-600 text-white border-amber-600 shadow-sm"
              : "bg-amber-50/60 text-amber-950 border-amber-200 hover:bg-amber-50"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              Para Hoy
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold">{conteoHoy}</div>
        </button>

        <button
          type="button"
          onClick={() => setFiltroUrgencia("proximas")}
          className={`p-3.5 rounded-xl border text-left transition-all min-h-[64px] ${
            filtroUrgencia === "proximas"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-emerald-50/60 text-emerald-950 border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              Próximas
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold">{conteoProximas}</div>
        </button>
      </div>

      <div className="task-layout">
        {/* Panel Principal: Checklist Operativo */}
        <section className="panel bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
            <div>
              <p className="eyebrow text-gold-700 text-[11px] font-bold uppercase tracking-wider mb-1">
                Checklist Operativo
              </p>
              <h2 className="text-lg font-bold text-navy-950 m-0">
                Cola de Prioridades ({tareasFiltradas.length})
              </h2>
            </div>

            {/* Barra de Búsqueda y Filtro de Prioridad */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar tarea..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-[13px] border border-slate-200 rounded-lg min-h-[44px] bg-white focus:outline-none focus:ring-2 focus:ring-gold-700 w-44 sm:w-56"
                />
              </div>

              <select
                value={filtroPrioridad}
                onChange={(e) => setFiltroPrioridad(e.target.value)}
                className="py-1.5 px-3 text-[13px] border border-slate-200 rounded-lg min-h-[44px] bg-white font-medium text-slate-700"
              >
                <option value="todas">Prioridad: Todas</option>
                <option value="high">Alta prioridad</option>
                <option value="normal">Prioridad normal</option>
                <option value="low">Baja prioridad</option>
              </select>

              {filtroResponsable !== "todos" && (
                <button
                  type="button"
                  onClick={() => setFiltroResponsable("todos")}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[12px] font-semibold text-gold-900 bg-gold-100 border border-gold-300 rounded-lg min-h-[44px]"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Quitar filtro</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {tareasFiltradas.length === 0 ? (
            <Vacio
              titulo="No hay tareas en esta vista"
              texto="No se encontraron tareas con los filtros aplicados. Puedes crear una nueva tarea con el botón superior."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {tareasFiltradas.map((tarea) => {
                const completada = completadas.has(tarea.id);
                const actualizando = actualizandoId === tarea.id;
                const infoFecha = etiquetaFecha(tarea.startsAt, hoy);

                return (
                  <div
                    key={tarea.id}
                    className={`group flex items-start gap-3 py-3.5 px-2 rounded-xl transition-all duration-300 ${
                      completada
                        ? "opacity-45 line-through bg-emerald-50/40 translate-x-1"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Control interactivo de completado (mínimo 44px de click target) */}
                    <button
                      type="button"
                      disabled={actualizando || completada}
                      onClick={() => void completar(tarea)}
                      className={`size-11 shrink-0 rounded-xl border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-gold-700 ${
                        completada
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                          : "bg-white border-slate-300 hover:border-gold-600 text-transparent hover:text-gold-600"
                      }`}
                      aria-label={`Completar tarea: ${tarea.title}`}
                    >
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    </button>

                    {/* Contenido de la tarea */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <strong
                          className={`text-[14px] font-bold text-navy-950 transition-all ${
                            completada ? "line-through text-slate-500" : ""
                          }`}
                        >
                          {tarea.title}
                        </strong>

                        {tarea.priority === "high" && (
                          <Badge tone="red">
                            <Flame className="w-3 h-3 text-red-500" />
                            Alta
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-600">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            infoFecha.tono === "red"
                              ? "text-red-700"
                              : infoFecha.tono === "gold"
                              ? "text-amber-800"
                              : infoFecha.tono === "green"
                              ? "text-emerald-800"
                              : "text-slate-500"
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          {infoFecha.texto}
                        </span>

                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Avatar name={tarea.assigneeName ?? "Sin asignar"} small />
                          <span>{tarea.assigneeName ?? "Sin asignar"}</span>
                        </span>

                        {tarea.location && (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{tarea.location}</span>
                          </span>
                        )}
                      </div>

                      {tarea.description && (
                        <p className="text-[13px] text-slate-500 mt-1.5 m-0 leading-relaxed line-clamp-2">
                          {tarea.description}
                        </p>
                      )}
                    </div>

                    {/* Semáforo indicador lateral */}
                    <div className="shrink-0 pt-1">
                      {tarea.urgencia === "vencidas" && (
                        <span className="size-2.5 rounded-full bg-red-500 block" title="Vencida" />
                      )}
                      {tarea.urgencia === "hoy" && (
                        <span className="size-2.5 rounded-full bg-amber-500 block" title="Vence hoy" />
                      )}
                      {tarea.urgencia === "proximas" && (
                        <span className="size-2.5 rounded-full bg-emerald-500 block" title="Próxima" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Panel Lateral: Widget de Balance de Carga del Equipo */}
        <aside className="panel bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gold-700" />
                <p className="eyebrow text-gold-700 text-[11px] font-bold uppercase tracking-wider m-0">
                  Balance Operativo
                </p>
              </div>
              {muestraCargaEquipo && (
                <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {sumaTotalCargaEquipo} abiertas
                </span>
              )}
            </div>

            <h2 className="text-base font-bold text-navy-950 mb-1">
              {muestraCargaEquipo ? "Carga del Equipo" : "Mi Balance Personal"}
            </h2>
            <p className="text-[13px] text-slate-500 mb-4 leading-relaxed">
              {muestraCargaEquipo
                ? "Distribución de actividades abiertas por integrante. Haz clic para filtrar."
                : "Resumen de tus actividades asignadas y cumplimiento de tiempos."}
            </p>

            {muestraCargaEquipo ? (
              cargaEquipo.length === 0 ? (
                <Vacio titulo="Sin pendientes" texto="Nadie del equipo tiene actividades pendientes." />
              ) : (
                <div className="space-y-3">
                  {cargaEquipo.map((fila) => {
                    const seleccionado = filtroResponsable === fila.assigneeId;
                    const porcentaje = Math.round((fila.total / maxCarga) * 100);

                    // Indicador de nivel de carga
                    let nivelTexto = "Óptima";
                    let nivelClase = "text-emerald-700 bg-emerald-50 border-emerald-200";
                    if (fila.total > 10) {
                      nivelTexto = "Alta";
                      nivelClase = "text-red-700 bg-red-50 border-red-200";
                    } else if (fila.total >= 5) {
                      nivelTexto = "Moderada";
                      nivelClase = "text-amber-700 bg-amber-50 border-amber-200";
                    }

                    return (
                      <button
                        key={fila.assigneeId ?? "sin-asignar"}
                        type="button"
                        onClick={() =>
                          setFiltroResponsable(
                            seleccionado ? "todos" : (fila.assigneeId ?? "todos"),
                          )
                        }
                        className={`w-full p-3 rounded-xl border text-left transition-all min-h-[48px] ${
                          seleccionado
                            ? "bg-gold-50/80 border-gold-400 shadow-xs ring-1 ring-gold-500"
                            : "bg-slate-50/60 border-slate-200 hover:bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 truncate">
                            <Avatar name={fila.assigneeName ?? "Sin asignar"} small />
                            <span className="text-[13px] font-bold text-navy-950 truncate">
                              {fila.assigneeName ?? "Sin asignar"}
                            </span>
                          </div>
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${nivelClase}`}
                          >
                            {nivelTexto}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[12px] text-slate-600 mb-1.5 font-medium">
                          <span>{fila.total} actividad{fila.total === 1 ? "" : "es"}</span>
                          <span>{porcentaje}% cap</span>
                        </div>

                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              fila.total > 10
                                ? "bg-red-500"
                                : fila.total >= 5
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-600">Total asignadas</span>
                  <strong className="font-bold text-navy-950">{conteoTotalPendientes}</strong>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-red-700 font-semibold">Vencidas</span>
                  <strong className="font-bold text-red-700">{conteoVencidas}</strong>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-amber-800 font-semibold">Para hoy</span>
                  <strong className="font-bold text-amber-800">{conteoHoy}</strong>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-emerald-800 font-semibold">Próximas</span>
                  <strong className="font-bold text-emerald-800">{conteoProximas}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="text-[12px] text-slate-400 m-0 text-center font-medium">
              Zona horaria: America/Santo_Domingo (UTC-4)
            </p>
          </div>
        </aside>
      </div>

      {creando && <FormularioTarea personas={personas} onClose={() => setCreando(false)} />}
    </>
  );
}

function FormularioTarea({
  personas,
  onClose,
}: {
  personas: PersonaOpcion[];
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorRed, setErrorRed] = useState<string | null>(null);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setEnviando(true);
    setErrores({});
    setErrorRed(null);

    try {
      const form = new FormData(formRef.current);
      const fecha = String(form.get("dueDate") ?? "");
      const hora = String(form.get("dueTime") ?? "12:00");

      const startsAt = fecha ? `${fecha}T${hora}:00-04:00` : undefined;

      const datos = {
        activityType: form.get("activityType") || "task",
        title: form.get("title"),
        description: form.get("description") || undefined,
        assigneeId: form.get("assigneeId") || undefined,
        startsAt,
        priority: form.get("priority") || "normal",
        location: form.get("location") || undefined,
      };

      const respuesta = await fetch("/api/actividades", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(datos),
      });

      const cuerpo = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setErrores(cuerpo.fields ?? {});
        setErrorRed(cuerpo.error ?? "No se pudo crear la tarea. Revisa los datos.");
        return;
      }

      router.refresh();
      onClose();
    } catch {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setErrorRed(
        offline
          ? "Sin conexión a internet. Los datos de la tarea se mantienen intactos."
          : "Fallo de conexión al crear la tarea. Tus datos están intactos.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal title="Nueva tarea operativa" onClose={onClose}>
      <form className="form-grid" ref={formRef} onSubmit={enviar} aria-busy={enviando}>
        {errorRed && (
          <div className="span-2">
            <AlertaErrorFormulario
              mensaje={errorRed}
              onReintentar={() => formRef.current?.requestSubmit()}
              disabled={enviando}
            />
          </div>
        )}

        <label className="span-2">
          Título de la tarea
          <input
            name="title"
            required
            autoFocus
            placeholder="Ej. Enviar propuesta Cap Cana a Lic. Fernández"
            className="min-h-[44px] text-[14px]"
          />
          {errores.title && <small className="text-red-600 text-[13px]">{errores.title}</small>}
        </label>

        <label>
          Tipo de tarea
          <select name="activityType" defaultValue="task" className="min-h-[44px] text-[14px]">
            <option value="task">Tarea general</option>
            <option value="call">Llamada telefónica</option>
            <option value="whatsapp">Seguimiento WhatsApp</option>
            <option value="email">Envío de correo</option>
            <option value="meeting">Reunión</option>
            <option value="note">Revisión documental</option>
          </select>
        </label>

        <label>
          Prioridad
          <select name="priority" defaultValue="normal" className="min-h-[44px] text-[14px]">
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta (Urgente)</option>
          </select>
        </label>

        <label>
          Fecha límite
          <input name="dueDate" type="date" className="min-h-[44px] text-[14px]" />
        </label>

        <label>
          Hora límite
          <input name="dueTime" type="time" defaultValue="12:00" className="min-h-[44px] text-[14px]" />
        </label>

        <label className="span-2">
          Responsable asignado
          <select name="assigneeId" defaultValue="" className="min-h-[44px] text-[14px]">
            <option value="">Quien la crea (Automático)</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="span-2">
          Lugar / Proyecto (opcional)
          <input
            name="location"
            placeholder="Ej. Proyecto Las Terrenas o Santo Domingo"
            className="min-h-[44px] text-[14px]"
          />
        </label>

        <label className="span-2">
          Descripción o instrucciones
          <textarea
            name="description"
            rows={2}
            placeholder="Detalles sobre documentos a adjuntar o puntos a consultar..."
            className="min-h-[60px] text-[14px]"
          />
        </label>

        {errores._ && <small className="text-red-600 text-[13px] span-2">{errores._}</small>}

        <div className="form-actions span-2 pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            className="button secondary min-h-[44px] px-4 text-[13px] font-semibold"
            type="button"
            onClick={onClose}
            disabled={enviando}
          >
            Cancelar
          </button>
          <button
            className="button primary min-h-[44px] px-5 text-[13px] font-bold"
            type="submit"
            disabled={enviando}
          >
            {enviando ? "Creando…" : "Crear tarea"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
