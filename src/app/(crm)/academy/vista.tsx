"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  ListChecks,
  PlayCircle,
  RotateCcw,
  Search,
  WifiOff,
} from "lucide-react";
import { Badge, PageHeader } from "../_ui/prototipo-ui";

export type ChecklistItemVista = {
  id: number;
  academyItemId: number;
  position: number;
  label: string;
  isCompleted: boolean;
};

export type ItemAcademyVista = {
  id: number;
  title: string;
  itemType: "session" | "checklist" | "material";
  description: string | null;
  durationMinutes: number | null;
  videoUrl: string | null;
  position: number;
  category: string;
  progressPercent: number;
  isCompleted: boolean;
  completedAt: string | null;
  checklistItems: ChecklistItemVista[];
};

export type ResumenAcademyVista = {
  totalItems: number;
  completedItems: number;
  percent: number;
  isCertified: boolean;
};

interface AcademyVistaProps {
  initialContenidos: ItemAcademyVista[];
  initialResumen: ResumenAcademyVista;
}

export function AcademyVista({ initialContenidos, initialResumen }: AcademyVistaProps) {
  const [contenidos, setContenidos] = useState<ItemAcademyVista[]>(initialContenidos);
  const [resumen, setResumen] = useState<ResumenAcademyVista>(initialResumen);
  const [filtro, setFiltro] = useState<"todas" | "sesiones" | "checklists" | "pendientes" | "completadas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [mutandoId, setMutandoId] = useState<number | null>(null);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [estaOffline, setEstaOffline] = useState(false);
  const [notificacionExito, setNotificacionExito] = useState<string | null>(null);

  // Detección de conectividad (UX State: Sin Conexión)
  useEffect(() => {
    function handleOnline() {
      setEstaOffline(false);
    }
    function handleOffline() {
      setEstaOffline(true);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setEstaOffline(!window.navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Limpiar notificación tras 4 segundos
  useEffect(() => {
    if (!notificacionExito) return;
    const timer = setTimeout(() => setNotificacionExito(null), 4000);
    return () => clearTimeout(timer);
  }, [notificacionExito]);

  // Recalcular resumen local a partir de la lista
  function recalcularResumen(nuevaLista: ItemAcademyVista[]) {
    const total = nuevaLista.length;
    const completados = nuevaLista.filter((item) => item.isCompleted).length;
    const percent = total > 0 ? Math.round((completados / total) * 100) : 0;
    setResumen({
      totalItems: total,
      completedItems: completados,
      percent,
      isCertified: percent === 100,
    });
  }

  // Filtrado de contenidos
  const contenidosFiltrados = useMemo(() => {
    return contenidos.filter((item) => {
      const matchBusqueda =
        busqueda.trim() === "" ||
        item.title.toLowerCase().includes(busqueda.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(busqueda.toLowerCase())) ||
        item.category.toLowerCase().includes(busqueda.toLowerCase());

      if (!matchBusqueda) return false;

      if (filtro === "sesiones") return item.itemType === "session";
      if (filtro === "checklists") return item.itemType === "checklist";
      if (filtro === "pendientes") return !item.isCompleted;
      if (filtro === "completadas") return item.isCompleted;
      return true;
    });
  }, [contenidos, filtro, busqueda]);

  // Toggle de paso individual en checklist
  async function handleToggleChecklist(checklistItemId: number, estadoActual: boolean) {
    setErrorMensaje(null);
    const nuevoEstado = !estadoActual;

    // Actualización optimista
    const listaAnterior = contenidos;
    const nuevaLista = contenidos.map((item) => {
      const tienePaso = item.checklistItems.some((step) => step.id === checklistItemId);
      if (!tienePaso) return item;

      const updatedSteps = item.checklistItems.map((step) =>
        step.id === checklistItemId ? { ...step, isCompleted: nuevoEstado } : step,
      );

      const completados = updatedSteps.filter((s) => s.isCompleted).length;
      const total = updatedSteps.length;
      const progressPercent = total > 0 ? Math.round((completados / total) * 100) : 0;
      const isCompleted = progressPercent === 100;

      return {
        ...item,
        checklistItems: updatedSteps,
        progressPercent,
        isCompleted,
      };
    });

    setContenidos(nuevaLista);
    recalcularResumen(nuevaLista);

    try {
      const res = await fetch(`/api/academy/checklist/${checklistItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: nuevoEstado }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al actualizar el checklist.");
      }
    } catch (err: unknown) {
      // Rollback optimista
      setContenidos(listaAnterior);
      recalcularResumen(listaAnterior);
      const msg = err instanceof Error ? err.message : "Error de red al guardar el progreso.";
      setErrorMensaje(msg);
    }
  }

  // Marcar contenido completo (video o checklist total)
  async function handleToggleCompletar(itemId: number, estadoActual: boolean) {
    setErrorMensaje(null);
    setMutandoId(itemId);
    const nuevoEstado = !estadoActual;
    const nuevoProgreso = nuevoEstado ? 100 : 0;

    const listaAnterior = contenidos;
    const nuevaLista = contenidos.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        isCompleted: nuevoEstado,
        progressPercent: nuevoProgreso,
        checklistItems: item.checklistItems.map((step) => ({
          ...step,
          isCompleted: nuevoEstado,
        })),
      };
    });

    setContenidos(nuevaLista);
    recalcularResumen(nuevaLista);

    try {
      const res = await fetch(`/api/academy/${itemId}/progreso`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progressPercent: nuevoProgreso,
          isCompleted: nuevoEstado,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Error al actualizar el contenido.");
      }

      if (nuevoEstado) {
        setNotificacionExito("¡Contenido completado con éxito!");
      }
    } catch (err: unknown) {
      setContenidos(listaAnterior);
      recalcularResumen(listaAnterior);
      const msg = err instanceof Error ? err.message : "Error de red al guardar el progreso.";
      setErrorMensaje(msg);
    } finally {
      setMutandoId(null);
    }
  }

  // Reintentar recargar todo desde la API
  async function handleRecargar() {
    setErrorMensaje(null);
    try {
      const res = await fetch("/api/academy");
      if (!res.ok) throw new Error("Error al consultar la academia.");
      const json = await res.json();
      if (json.ok) {
        setContenidos(json.contenidos);
        setResumen(json.resumen);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al recargar.";
      setErrorMensaje(msg);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Formación y certificación de brokers"
        title="Academy"
        subtitle="Sesiones técnicas, protocolos operativos y certificación de ventas inmobiliarias."
      />

      {/* Banner de Estado: Sin Conexión */}
      {estaOffline && (
        <div className="flex items-center gap-2 p-3 mb-4 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-lg">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Modo sin conexión. Los cambios locales se sincronizarán al recuperar la red.</span>
        </div>
      )}

      {/* Banner de Estado: Error con Reintento */}
      {errorMensaje && (
        <div className="flex items-center justify-between gap-2 p-3 mb-4 text-xs font-medium text-red-900 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMensaje}</span>
          </div>
          <button
            onClick={handleRecargar}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-700 bg-white border border-red-300 rounded hover:bg-red-50"
            type="button"
          >
            <RotateCcw className="w-3 h-3" />
            Reintentar
          </button>
        </div>
      )}

      {/* Banner de Estado: Éxito / Certificación */}
      {notificacionExito && (
        <div className="flex items-center gap-2 p-3 mb-4 text-xs font-medium text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notificacionExito}</span>
        </div>
      )}

      <div className="academy-layout">
        <div>
          {/* Barra de Filtros y Búsqueda */}
          <div className="filter-bar flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="segmented">
              <button
                className={filtro === "todas" ? "active" : ""}
                type="button"
                onClick={() => setFiltro("todas")}
              >
                Todas
              </button>
              <button
                className={filtro === "sesiones" ? "active" : ""}
                type="button"
                onClick={() => setFiltro("sesiones")}
              >
                Sesiones
              </button>
              <button
                className={filtro === "checklists" ? "active" : ""}
                type="button"
                onClick={() => setFiltro("checklists")}
              >
                Checklists
              </button>
              <button
                className={filtro === "pendientes" ? "active" : ""}
                type="button"
                onClick={() => setFiltro("pendientes")}
              >
                Pendientes
              </button>
              <button
                className={filtro === "completadas" ? "active" : ""}
                type="button"
                onClick={() => setFiltro("completadas")}
              >
                Completadas
              </button>
            </div>

            <div className="relative flex items-center min-w-[220px]">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar contenido..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Grilla de Contenidos o Estado Vacío */}
          {contenidosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-200 rounded-xl">
              <div className="flex items-center justify-center w-12 h-12 mb-3 bg-slate-50 text-slate-400 rounded-full">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 mb-1">
                No hay contenidos en esta vista
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mb-4">
                No se encontraron capacitaciones ni checklists que coincidan con los filtros aplicados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFiltro("todas");
                  setBusqueda("");
                }}
                className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="course-grid">
              {contenidosFiltrados.map((item, index) => {
                const esChecklist = item.itemType === "checklist";
                const mutandoEste = mutandoId === item.id;

                return (
                  <article className="course-card flex flex-col justify-between" key={item.id}>
                    <div>
                      <div className={`course-cover cover-${index % 4} flex flex-col justify-between p-3.5`}>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="bg-slate-900/60 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                            QH Academy
                          </span>
                          <span className="flex items-center gap-1 bg-slate-900/60 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                            {esChecklist ? (
                              <>
                                <ListChecks className="w-3 h-3" />
                                {item.checklistItems.length} pasos
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" />
                                {item.durationMinutes ?? 45} min
                              </>
                            )}
                          </span>
                        </div>

                        {!esChecklist && (
                          <div className="flex items-center justify-center py-4">
                            <PlayCircle className="w-10 h-10 text-white/90 drop-shadow-md hover:scale-105 transition-transform cursor-pointer" />
                          </div>
                        )}
                      </div>

                      <div className="p-4">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <Badge tone={esChecklist ? "blue" : "gold"}>
                            {esChecklist ? "Checklist operativo" : "Sesión de formación"}
                          </Badge>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                            {item.category}
                          </span>
                        </div>

                        <h2 className="text-sm font-semibold text-slate-900 mb-1 leading-snug">
                          {item.title}
                        </h2>

                        {item.description && (
                          <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        {/* Barra de progreso visual */}
                        <div className="space-y-1 mb-3">
                          <div className="flex justify-between text-[11px] font-mono text-slate-500">
                            <span>Progreso</span>
                            <span>{item.progressPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                item.isCompleted ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${item.progressPercent}%` }}
                            />
                          </div>
                        </div>

                        {/* Pasos interactivos si es un Checklist */}
                        {esChecklist && item.checklistItems.length > 0 && (
                          <div className="space-y-1.5 my-3 pt-3 border-t border-slate-100">
                            {item.checklistItems.map((paso) => (
                              <label
                                key={paso.id}
                                className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:text-slate-900 select-none py-0.5"
                              >
                                <input
                                  type="checkbox"
                                  checked={paso.isCompleted}
                                  onChange={() => handleToggleChecklist(paso.id, paso.isCompleted)}
                                  className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500"
                                />
                                <span className={paso.isCompleted ? "line-through text-slate-400" : ""}>
                                  {paso.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        className={`w-full py-2 px-3 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                          item.isCompleted
                            ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            : "bg-amber-600 text-white hover:bg-amber-700 shadow-xs"
                        }`}
                        type="button"
                        disabled={mutandoEste}
                        onClick={() => handleToggleCompletar(item.id, item.isCompleted)}
                      >
                        {item.isCompleted ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Completado (Reabrir)
                          </>
                        ) : (
                          <>Marcar como completado</>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Aside: Certificación del Broker y Progreso */}
        <aside className="panel academy-progress">
          <p className="eyebrow">Certificación de Broker</p>

          <div
            className="goal-ring my-4"
            style={{ "--progress": `${resumen.percent}%` } as React.CSSProperties}
          >
            <strong>{resumen.percent}%</strong>
          </div>

          <h2 className="text-base font-semibold text-slate-900 mb-1">
            {resumen.completedItems} de {resumen.totalItems} contenidos
          </h2>

          <p className="text-xs text-slate-500 mb-4">
            {resumen.isCertified
              ? "¡Felicidades! Has completado el programa obligatorio de formación Quisqueya Home."
              : "Completa todos los módulos y checklists operativos para validar tu acreditación."}
          </p>

          {/* Insignia de Certificación */}
          <div
            className={`flex items-center gap-2.5 p-3 rounded-lg border text-left text-xs mb-4 ${
              resumen.isCertified
                ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : "bg-slate-50 border-slate-200 text-slate-600"
            }`}
          >
            <div
              className={`p-2 rounded-full ${
                resumen.isCertified ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
              }`}
            >
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold">
                {resumen.isCertified ? "Broker Certificado" : "Certificación en Curso"}
              </p>
              <p className="text-[11px] opacity-80">
                {resumen.isCertified ? "Acreditado oficialmente" : "Pendiente de completar"}
              </p>
            </div>
          </div>

          {/* Resumen de Requisitos Rápidos */}
          <div className="checklist text-xs text-slate-600 space-y-2 pt-3 border-t border-slate-100">
            <p className="font-semibold text-slate-800 text-left mb-1">Requisitos de cumplimiento</p>
            <div className="flex items-center justify-between">
              <span>Ley 158-01 (Confotur)</span>
              <span className="font-mono text-slate-500">Obligatorio</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Protocolo de Reservas</span>
              <span className="font-mono text-slate-500">Operativo</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Prevención Lavado Activos</span>
              <span className="font-mono text-slate-500">Legal RD</span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
