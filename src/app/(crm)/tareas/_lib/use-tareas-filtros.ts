"use client";
import { useMemo, useState } from "react";
import type { TareaFila, CargaEquipoFila, Urgencia, ModoVista, FiltroEstado } from "./tipos";
import { calcularUrgencia, etiquetaFecha } from "./utilidades";
import { fechaSantoDomingo } from "@/domain/zona-horaria";

export function useTareasVista(tareas: TareaFila[], cargaEquipo: CargaEquipoFila[], personas: any[], muestraCargaEquipo: boolean) {
  const [modoVista, setModoVista] = useState<ModoVista>("lista");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("pending");
  const [filtroUrgencia, setFiltroUrgencia] = useState<"todas" | Urgencia>("todas");
  const [filtroBroker, setFiltroBroker] = useState<number | "todos" | "sin_asignar">("todos");
  const [filtroProyecto, setFiltroProyecto] = useState<number | "todos">("todos");
  const [filtroPrioridad, setFiltroPrioridad] = useState<"todas" | "high" | "normal" | "low">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [seleccionadasIds, setSeleccionadasIds] = useState<number[]>([]);
  const [brokerDestinoLote, setBrokerDestinoLote] = useState<string>("");
  const [procesandoLote, setProcesandoLote] = useState(false);
  const [checklistsAbiertos, setChecklistsAbiertos] = useState<Record<number, boolean>>({});

  const hoy = useMemo(() => fechaSantoDomingo(new Date()), []);

  const tareasConUrgencia = useMemo(
    () =>
      tareas.map((t) => ({
        ...t,
        urgencia: calcularUrgencia(t.startsAt, hoy) as Urgencia,
        etiquetaTiempo: etiquetaFecha(t.startsAt, hoy).texto,
      })),
    [tareas, hoy],
  );

  const tareasPendientes = useMemo(
    () => tareasConUrgencia.filter((t) => (t.status ?? "pending") !== "completed"),
    [tareasConUrgencia],
  );
  const tareasCompletadas = useMemo(
    () => tareasConUrgencia.filter((t) => (t.status ?? "pending") === "completed"),
    [tareasConUrgencia],
  );

  const conteos = useMemo(() => {
    const base = tareasConUrgencia;
    return {
      total: base.length,
      pendientes: base.filter((t) => (t.status ?? "pending") !== "completed").length,
      completadas: base.filter((t) => (t.status ?? "pending") === "completed").length,
      vencidas: base.filter((t) => t.urgencia === "vencidas").length,
      hoy: base.filter((t) => t.urgencia === "hoy").length,
    };
  }, [tareasConUrgencia]);

  const resumenPorBroker = useMemo(() => {
    if (!muestraCargaEquipo) return [];
    return (cargaEquipo || []).map((c) => ({
      id: c.assigneeId,
      nombre: c.assigneeName ?? "Sin asignar",
      total: c.total,
    }));
  }, [cargaEquipo, muestraCargaEquipo]);

  const tareasFiltradas = useMemo(() => {
    let res = filtroEstado === "pending" ? tareasPendientes : filtroEstado === "completed" ? tareasCompletadas : tareasConUrgencia;
    if (filtroUrgencia !== "todas") res = res.filter((t) => t.urgencia === filtroUrgencia);
    if (filtroBroker !== "todos") {
      res = res.filter((t) =>
        filtroBroker === "sin_asignar" ? !t.assigneeId : t.assigneeId === filtroBroker,
      );
    }
    if (filtroProyecto !== "todos") res = res.filter((t) => t.projectId === filtroProyecto);
    if (filtroPrioridad !== "todas") res = res.filter((t) => t.priority === filtroPrioridad);
    const q = busqueda.trim().toLowerCase();
    if (q) {
      res = res.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (t.assigneeName || "").toLowerCase().includes(q) ||
          (t.projectName || "").toLowerCase().includes(q),
      );
    }
    return res;
  }, [tareasPendientes, tareasCompletadas, tareasConUrgencia, filtroEstado, filtroUrgencia, filtroBroker, filtroProyecto, filtroPrioridad, busqueda]);

  const tareasPaginadas = useMemo(() => {
    const start = (pagina - 1) * 25;
    return tareasFiltradas.slice(start, start + 25);
  }, [tareasFiltradas, pagina]);

  return {
    // state
    modoVista, setModoVista,
    filtroEstado, setFiltroEstado,
    filtroUrgencia, setFiltroUrgencia,
    filtroBroker, setFiltroBroker,
    filtroProyecto, setFiltroProyecto,
    filtroPrioridad, setFiltroPrioridad,
    busqueda, setBusqueda,
    pagina, setPagina,
    seleccionadasIds, setSeleccionadasIds,
    brokerDestinoLote, setBrokerDestinoLote,
    procesandoLote, setProcesandoLote,
    checklistsAbiertos, setChecklistsAbiertos,
    // computed
    hoy,
    conteos,
    resumenPorBroker,
    tareasFiltradas,
    tareasPaginadas,
    tareasConUrgencia,
  };
}
