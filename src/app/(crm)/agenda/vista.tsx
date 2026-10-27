"use client";
import { Checkbox } from "@/components/ui/checkbox";

import Link from "next/link";
import { SelectorCalendarioGoogle } from "../_ui/google-cuentas";
import { toast } from "sonner";

import { crearSeguimientoVisita } from "@/application/actividades/seguimiento-visita";
import { erroresActividad } from "@/application/actividades/validacion";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  ExternalLink,
  FolderKanban,
  Globe,
  List,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  User,
  Users,
  Video,
} from "lucide-react";
import { formatoFechaIcs, generarIcs } from "@/domain/ics";
import { fechaSantoDomingo, horaSantoDomingo, sumarDias } from "@/domain/zona-horaria";
import { intervalosSeSolapan } from "./_componentes/operaciones";
import { destinoGuardadoCita } from "./_lib/guardado-cita";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import { Avatar, Badge, Modal, PageHeader } from "../_ui/prototipo-ui";

export type CitaFila = {
  id: number;
  title: string;
  description?: string | null;
  contactId?: number | null;
  contactName?: string | null;
  dealId?: number | null;
  dealTitle?: string | null;
  projectId?: number | null;
  projectName?: string | null;
  activityType: string;
  startsAt: Date | null;
  endsAt: Date | null;
  location: string | null;
  meetingUrl?: string | null;
  priority?: string | null;
  status?: string | null;
  assigneeId: number | null;
  assigneeName: string | null;
};

export type PersonaOpcion = { id: number; fullName: string };

export type ProyectoAgendaOpcion = {
  id: number;
  name: string;
  zone: string | null;
};

export type NegocioAgendaOpcion = {
  id: number;
  title: string;
  contactId: number | null;
};

export type ContactoAgendaOpcion = {
  id: number;
  fullName: string;
  phone: string | null;
};

const HORAS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export const CONFIG_TIPOS: Record<
  string,
  { label: string; border: string; bg: string; text: string; badgeTone: "blue" | "green" | "gold" | "red" | "neutral" }
> = {
  meeting: {
    label: "Reunión",
    border: "#2563eb",
    bg: "#eff6ff",
    text: "#1e40af",
    badgeTone: "blue",
  },
  call: {
    label: "Llamada",
    border: "#059669",
    bg: "#ecfdf5",
    text: "#065f46",
    badgeTone: "green",
  },
  whatsapp: {
    label: "WhatsApp",
    border: "#0d9488",
    bg: "#f0fdf4",
    text: "#115e59",
    badgeTone: "green",
  },
  task: {
    label: "Visita / Tarea",
    border: "#d97706",
    bg: "#fefce8",
    text: "#854d0e",
    badgeTone: "gold",
  },
  email: {
    label: "Correo",
    border: "#7c3aed",
    bg: "#f5f3ff",
    text: "#5b21b6",
    badgeTone: "neutral",
  },
  note: {
    label: "Nota",
    border: "#64748b",
    bg: "#f8fafc",
    text: "#334155",
    badgeTone: "neutral",
  },
};

const PLANTILLAS_VISITAS_REA = [
  {
    id: "tour_obra",
    etiqueta: "Tour Presencial en Obra",
    titulo: "Tour VIP en Proyecto y Apartamento Modelo",
    tipo: "task",
    prioridad: "high",
    duracion: "90",
    ubicacion: "Showroom y Obra del Proyecto",
    descripcion:
      "Recorrido guiado por showroom, validación de vistas por nivel, amenidades y sesión de cotización en sala de ventas.",
  },
  {
    id: "zoom_diaspora",
    etiqueta: "Zoom Inversor Diáspora",
    titulo: "Presentación Virtual 360° y Retorno de Renta Corta (Diáspora)",
    tipo: "meeting",
    prioridad: "normal",
    duracion: "60",
    ubicacion: "Videollamada Zoom / Google Meet",
    descripcion:
      "Presentación de masterplan, avance de obra con dron, calculadora ROI Airbnb y proceso de reserva desde el exterior.",
  },
  {
    id: "cierre_confotur",
    etiqueta: "Cierre & Simulación Confotur",
    titulo: "Sesión de Cierre Financiero 10/40/50 y Exención CONFOTUR",
    tipo: "meeting",
    prioridad: "high",
    duracion: "60",
    ubicacion: "Sala Ejecutiva Quisqueya Home",
    descripcion:
      "Revisión de simulación de pagos durante construcción, ahorro del 3% de transferencia + IPI Ley 158-01 y bloqueo de unidad.",
  },
  {
    id: "firma_promesa_cita",
    etiqueta: "Firma Reserva / Promesa",
    titulo: "Firma de Acuerdo de Reserva y Revisión de Promesa de Compraventa",
    tipo: "meeting",
    prioridad: "high",
    duracion: "60",
    ubicacion: "Departamento Legal / Notaría",
    descripcion:
      "Validación de expediente KYC Ley 155-17, comprobante de separación y firma formal del contrato.",
  },
  {
    id: "inspeccion_snag",
    etiqueta: "Inspección Pre-Entrega",
    titulo: "Recorrido Técnico de Pre-Entrega (Snag List) con Comprador",
    tipo: "task",
    prioridad: "normal",
    duracion: "90",
    ubicacion: "Unidad Terminada en Obra",
    descripcion:
      "Verificación de acabados, pruebas hidrosanitarias y eléctricas junto a ingeniería antes de firma de Acta de Entrega.",
  },
] as const;

function configTipo(tipo: string) {
  return (
    CONFIG_TIPOS[tipo] ?? {
      label: tipo || "Cita",
      border: "#64748b",
      bg: "#f8fafc",
      text: "#334155",
      badgeTone: "neutral",
    }
  );
}

function etiquetaDia(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T12:00:00-04:00`);
  const texto = new Intl.DateTimeFormat("es-DO", {
    weekday: "short",
    day: "numeric",
    timeZone: "America/Santo_Domingo",
  }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function nombreDiaCompleto(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T12:00:00-04:00`);
  const texto = new Intl.DateTimeFormat("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Santo_Domingo",
  }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearHoraZona(fecha: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("es-DO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(fecha);
}

function googleCalendarUrl(cita: CitaFila): string {
  if (!cita.startsAt) return "#";
  const fin = cita.endsAt ?? new Date(cita.startsAt.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: cita.title,
    dates: `${formatoFechaIcs(cita.startsAt)}/${formatoFechaIcs(fin)}`,
    details: `${cita.description ? cita.description + "\n\n" : ""}Actividad Quisqueya Home CRM.\nResponsable: ${
      cita.assigneeName ?? "Sin asignar"
    }.${cita.projectName ? `\nProyecto: ${cita.projectName}` : ""}${
      cita.meetingUrl ? `\nVideollamada: ${cita.meetingUrl}` : ""
    }`,
    ctz: "America/Santo_Domingo",
  });
  if (cita.location) {
    params.set("location", cita.location);
  }
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function descargarIcsCita(cita: CitaFila) {
  if (!cita.startsAt) return;
  const textoIcs = generarIcs([
    {
      id: cita.id,
      title: cita.title,
      startsAt: cita.startsAt,
      endsAt: cita.endsAt,
      location: cita.location,
    },
  ]);
  const blob = new Blob([textoIcs], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cita-${cita.id}-${cita.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type ModoAgenda = "semana" | "dia" | "brokers" | "lista";

export function AgendaVista({
  citas,
  personas,
  asignables = [],
  puedeCrear = false,
  lunes,
  proyectos = [],
  negocios = [],
  contactos = [],
  muestraEquipo = false,
}: {
  citas: CitaFila[];
  /** Consulta (filtro y «Por Broker»): alcance de ver. */
  personas: PersonaOpcion[];
  /** Selector de responsable: alcance de crear (ver `_lib/personas-agenda.ts`). */
  asignables?: PersonaOpcion[];
  puedeCrear?: boolean;
  lunes: string;
  proyectos?: ProyectoAgendaOpcion[];
  negocios?: NegocioAgendaOpcion[];
  contactos?: ContactoAgendaOpcion[];
  muestraEquipo?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [modoAgenda, setModoAgenda] = useState<ModoAgenda>("semana");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaFila | null>(null);
  const [citaParaResultado, setCitaParaResultado] = useState<CitaFila | null>(null);
  const [slotInicial, setSlotInicial] = useState<{
    dia: string;
    hora: string;
    brokerId?: number | null;
  } | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("all");
  const [filtroBroker, setFiltroBroker] = useState<number | "todos">("todos");
  const [filtroProyecto, setFiltroProyecto] = useState<number | "todos">("todos");

  // 7 días completos: Lunes a Domingo (cubre visitas de fin de semana a proyectos)
  const dias = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].map((offset) => sumarDias(lunes, offset)),
    [lunes],
  );

  const hoy = fechaSantoDomingo(new Date());
  const [diaEnfocado, setDiaEnfocado] = useState<string>(
    dias.includes(hoy) ? hoy : (dias[0] ?? hoy),
  );

  function irASemana(fechaISO: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("semana", fechaISO);
    router.push(`${pathname}?${params.toString()}`);
  }

  const citasFiltradas = useMemo(() => {
    return citas.filter((c) => {
      if (filtroTipo !== "all" && c.activityType !== filtroTipo) return false;
      if (filtroBroker !== "todos" && c.assigneeId !== filtroBroker) return false;
      if (filtroProyecto !== "todos" && c.projectId !== filtroProyecto) return false;
      return true;
    });
  }, [citas, filtroTipo, filtroBroker, filtroProyecto]);

  const citasDeHoy = citasFiltradas.filter(
    (c) => c.startsAt && fechaSantoDomingo(c.startsAt) === hoy,
  );

  // Detectar citas que caen fuera de la franja 07:00 - 20:00 para que nunca sean invisibles
  const citasFueraDeFranja = useMemo(
    () =>
      citasFiltradas.filter((c) => {
        if (!c.startsAt) return false;
        const h = Number(horaSantoDomingo(c.startsAt).split(":")[0]);
        return h < HORAS[0]! || h > HORAS[HORAS.length - 1]!;
      }),
    [citasFiltradas],
  );

  function abrirCrearEnSlot(dia: string, horaNum: number, brokerId?: number | null) {
    const horaTexto = `${String(horaNum).padStart(2, "0")}:00`;
    setSlotInicial({
      dia,
      hora: horaTexto,
      brokerId: brokerId ?? (typeof filtroBroker === "number" ? filtroBroker : null),
    });
    setCitaSeleccionada(null);
    setModalAbierto(true);
  }

  function abrirEdicion(cita: CitaFila) {
    setCitaSeleccionada(cita);
    setSlotInicial(null);
    setModalAbierto(true);
  }

  function abrirCrearNuevo(brokerId?: number | null) {
    setSlotInicial(
      brokerId != null
        ? { dia: hoy, hora: "10:00", brokerId }
        : typeof filtroBroker === "number"
          ? { dia: hoy, hora: "10:00", brokerId: filtroBroker }
          : null,
    );
    setCitaSeleccionada(null);
    setModalAbierto(true);
  }

  const diasParaRejilla = modoAgenda === "dia" ? [diaEnfocado] : dias;
  const idsAsignables = useMemo(() => new Set(puedeCrear ? asignables.map((p) => p.id) : []), [asignables, puedeCrear]);

  return (
    <>
      <PageHeader
        eyebrow="Seguimiento comercial & Visitas REA · 7 días"
        title="Agenda de Visitas, Showrooms y Citas por Broker"
        subtitle="Control integral de visitas a obra, recorridos VIP, cierres Confotur y videollamadas con compradores locales y de diáspora, vinculadas por Broker, Proyecto y Negocio."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/tareas"
              className="button secondary inline-flex min-h-[44px] items-center gap-2 px-4 text-[13px] font-semibold"
            >
              <ClipboardCheck className="w-4 h-4 text-[#059669]" />
              <span>Ir a To-Do por Broker</span>
            </Link>
            <a
              className="button secondary inline-flex items-center gap-2 min-h-[44px] px-4 font-semibold text-[13px]"
              href={`/api/actividades/ics?semana=${lunes}`}
              download={`agenda-${lunes}.ics`}
              title="Descargar archivo .ics con las citas de toda la semana"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Exportar semana (.ics)</span>
            </a>
            {puedeCrear && (
              <button
                className="button primary inline-flex items-center gap-2 min-h-[44px] px-5 font-bold text-[13px]"
                type="button"
                onClick={() => abrirCrearNuevo()}
              >
                <Plus className="w-4 h-4" />
                <span>Nueva cita / visita</span>
              </button>
            )}
          </div>
        }
      />

      {/* Barra de navegación de semanas, selector de vista y filtros REA (Broker / Proyecto / Tipo) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-3.5 mb-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="segmented inline-flex p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              className="min-h-[44px] px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:text-slate-900 rounded-md transition-colors"
              onClick={() => irASemana(sumarDias(lunes, -7))}
            >
              ← Anterior
            </button>
            <button
              className="min-h-[44px] px-3.5 py-1.5 text-[13px] font-bold text-slate-900 bg-white shadow-xs rounded-md"
              type="button"
              onClick={() => irASemana(fechaSantoDomingo(new Date()))}
            >
              Esta semana
            </button>
            <button
              type="button"
              className="min-h-[44px] px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:text-slate-900 rounded-md transition-colors"
              onClick={() => irASemana(sumarDias(lunes, 7))}
            >
              Siguiente →
            </button>
          </div>

          <Link className="button secondary min-h-[44px] text-[13px]" href="/agenda/calendario">
            Mes y disponibilidad
          </Link>

          {/* Selector de vista: Semana / Día / Por Broker / Lista */}
          <div className="inline-flex flex-wrap p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setModoAgenda("semana")}
              className={`min-h-[44px] px-3 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
                modoAgenda === "semana"
                  ? "bg-navy-950 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semana (Lun–Dom)
            </button>
            <button
              type="button"
              onClick={() => setModoAgenda("dia")}
              className={`min-h-[44px] px-3 py-1.5 text-[13px] font-bold rounded-md transition-colors ${
                modoAgenda === "dia"
                  ? "bg-navy-950 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Vista Día
            </button>
            <button
              type="button"
              onClick={() => setModoAgenda("brokers")}
              className={`min-h-[44px] px-3 py-1.5 text-[13px] font-bold rounded-md inline-flex items-center gap-1.5 transition-colors ${
                modoAgenda === "brokers"
                  ? "bg-navy-950 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="size-4" />
              <span>Por Broker ({personas.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setModoAgenda("lista")}
              className={`min-h-[44px] px-3 py-1.5 text-[13px] font-bold rounded-md inline-flex items-center gap-1.5 transition-colors ${
                modoAgenda === "lista"
                  ? "bg-navy-950 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <List className="size-4" />
              <span>Lista ({citasFiltradas.length})</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filtro por Broker */}
          {(muestraEquipo || personas.length > 1) && (
            <select
              aria-label="Filtrar agenda por Broker"
              value={filtroBroker === "todos" ? "todos" : String(filtroBroker)}
              onChange={(e) =>
                setFiltroBroker(e.target.value === "todos" ? "todos" : Number(e.target.value))
              }
              className="min-h-[44px] px-3 text-[13px] font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
            >
              <option value="todos">Todos los Brokers ({personas.length})</option>
              {personas.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  Broker: {p.fullName}
                </option>
              ))}
            </select>
          )}

          {/* Filtro por Proyecto REA */}
          {proyectos.length > 0 && (
            <select
              aria-label="Filtrar agenda por Proyecto"
              value={filtroProyecto === "todos" ? "todos" : String(filtroProyecto)}
              onChange={(e) =>
                setFiltroProyecto(e.target.value === "todos" ? "todos" : Number(e.target.value))
              }
              className="min-h-[44px] px-3 text-[13px] font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
            >
              <option value="todos">Todos los Proyectos</option>
              {proyectos.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <select
            aria-label="Filtrar por tipo de cita"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="min-h-[44px] px-3 text-[13px] font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
          >
            <option value="all">Todos los tipos ({citas.length})</option>
            <option value="meeting">Reuniones</option>
            <option value="task">Visitas a proyecto</option>
            <option value="call">Llamadas</option>
            <option value="whatsapp">WhatsApp</option>
          </select>

          {(filtroBroker !== "todos" || filtroProyecto !== "todos" || filtroTipo !== "all") && (
            <button
              type="button"
              onClick={() => {
                setFiltroBroker("todos");
                setFiltroProyecto("todos");
                setFiltroTipo("all");
              }}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RotateCcw className="size-3.5" />
              <span>Limpiar</span>
            </button>
          )}

          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 tabular-nums">
            <Calendar className="w-4 h-4 text-gold-700" />
            <span>
              {etiquetaDia(lunes)} al {etiquetaDia(dias[dias.length - 1] ?? lunes)}
            </span>
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-bold tabular-nums bg-gold-100 text-gold-800 border border-gold-300">
            {citasDeHoy.length} {citasDeHoy.length === 1 ? "cita hoy" : "citas hoy"}
          </span>
        </div>
      </div>

      {/* Selector de día rápido cuando está en modo Día */}
      {modoAgenda === "dia" && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {dias.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDiaEnfocado(d)}
              className={`min-h-[44px] px-4 rounded-xl text-[13px] font-bold border transition-colors ${
                diaEnfocado === d
                  ? "bg-navy-950 text-white border-gold-500 shadow-xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {etiquetaDia(d)} {d === hoy ? "• Hoy" : ""}
            </button>
          ))}
        </div>
      )}

      {/* Indicador de citas del día con botón de Registrar Resultado */}
      <section className="mb-6 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-lg bg-gold-100 border border-gold-300/70 flex items-center justify-center text-gold-800">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-950 m-0">
                Citas de hoy — {nombreDiaCompleto(hoy)}
              </h2>
              <p className="text-[13px] text-slate-500 m-0">
                Registra la asistencia, temperatura comercial y tarea automática de seguimiento al concluir cada visita o llamada.
              </p>
            </div>
          </div>
          {citasDeHoy.length > 0 && (
            <span className="text-[13px] font-semibold tabular-nums text-slate-600 self-start sm:self-center">
              {citasDeHoy.length} programada{citasDeHoy.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {citasDeHoy.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-lg bg-slate-50/70 border border-dashed border-slate-200">
            <p className="text-[13px] text-slate-600 m-0 mb-3">
              No hay citas programadas para hoy con los filtros actuales.{puedeCrear ? " Mantén el ritmo agendando un Tour de Obra o Videollamada." : ""}
            </p>
            {puedeCrear && (
              <button
                type="button"
                className="button secondary inline-flex items-center gap-2 min-h-[44px] px-4 text-[13px] font-semibold"
                onClick={() => abrirCrearEnSlot(hoy, 10)}
              >
                <Plus className="w-4 h-4" />
                <span>Agendar cita para hoy</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {citasDeHoy.map((cita) => {
              const cfg = configTipo(cita.activityType);
              const gcal = googleCalendarUrl(cita);
              const completada = cita.status === "completed";
              return (
                <div
                  key={cita.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-gold-500/50 hover:shadow-xs transition-all flex flex-col justify-between"
                  style={{ borderLeftWidth: "4px", borderLeftColor: cfg.border }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="inline-flex items-center gap-1 text-[13px] font-bold tabular-nums text-navy-950">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {cita.startsAt ? horaSantoDomingo(cita.startsAt) : "--:--"}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {completada && <Badge tone="green">Completada</Badge>}
                        <Badge tone={cfg.badgeTone}>{cfg.label}</Badge>
                      </div>
                    </div>
                    <strong className="block text-[14px] font-bold text-navy-950 mb-1.5 line-clamp-1">
                      {cita.title}
                    </strong>

                    {/* Etiquetas REA (Proyecto / Negocio / Cliente) */}
                    {(cita.projectName || cita.dealTitle || cita.contactName) && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {cita.projectName && (
                          <span className="inline-flex items-center gap-1 rounded bg-[#eff6ff] px-2 py-0.5 text-[13px] font-semibold text-[#1e40af]">
                            <Building2 className="size-3.5 shrink-0" />
                            <span className="truncate max-w-[150px]">{cita.projectName}</span>
                          </span>
                        )}
                        {cita.dealTitle && (
                          <span className="inline-flex items-center gap-1 rounded bg-[#fffbeb] px-2 py-0.5 text-[13px] font-semibold text-[#92400e]">
                            <FolderKanban className="size-3.5 shrink-0" />
                            <span className="truncate max-w-[150px]">{cita.dealTitle}</span>
                          </span>
                        )}
                        {cita.contactName && (
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[13px] font-medium text-slate-700">
                            <User className="size-3.5 shrink-0" />
                            <span className="truncate max-w-[150px]">{cita.contactName}</span>
                          </span>
                        )}
                      </div>
                    )}

                    <div className="space-y-1 mb-3 text-[13px] text-slate-600">
                      <p className="flex items-center gap-1.5 m-0 truncate">
                        <Avatar name={cita.assigneeName ?? "Sin asignar"} small />
                        <span className="truncate font-semibold">{cita.assigneeName ?? "Sin asignar"}</span>
                      </p>
                      {cita.location && (
                        <p className="flex items-center gap-1.5 m-0 truncate text-slate-500">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{cita.location}</span>
                        </p>
                      )}
                      {cita.meetingUrl && (
                        <p className="flex items-center gap-1.5 m-0 truncate text-blue-600">
                          <Video className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                          <a
                            href={cita.meetingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline text-[13px]"
                          >
                            Unirse a videollamada
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/80">
                    <button
                      type="button"
                      onClick={() => setCitaParaResultado(cita)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[13px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors min-h-[44px]"
                      title="Registrar asistencia, interés y siguiente paso"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>Resultado</span>
                    </button>
                    <a
                      href={gcal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[13px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors min-h-[44px]"
                      title="Abrir en Google Calendar"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>GCal</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => descargarIcsCita(cita)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[13px] font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors min-h-[44px]"
                      title="Descargar archivo .ics individual"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>.ics</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirEdicion(cita)}
                      className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 text-[13px] font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors min-h-[44px]"
                    >
                      <Pencil className="w-3.5 h-3.5 text-slate-500" />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Banner de citas en horario nocturno o madrugador (Fuera de franja 07:00 - 20:00) */}
      {citasFueraDeFranja.length > 0 && (
        <section className="mb-5 p-3.5 rounded-xl border border-amber-300 bg-amber-50/70 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[13px] font-bold text-amber-950">
            <AlertTriangle className="size-4 text-amber-700 shrink-0" />
            <span>
              Citas en horario especial (antes de 07:00 o después de 20:00):
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {citasFueraDeFranja.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => abrirEdicion(c)}
                className="min-h-[44px] px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-[13px] font-bold text-navy-950 hover:bg-amber-100 transition-colors"
              >
                {c.startsAt ? `${etiquetaDia(fechaSantoDomingo(c.startsAt))} ${horaSantoDomingo(c.startsAt)}` : ""} · {c.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* VISTA 1: AGENDA SEMANAL POR BROKER (DISPONIBILIDAD Y CITAS DE EQUIPO) */}
      {modoAgenda === "brokers" ? (
        <section
          aria-label="Agenda semanal desglosada por Broker"
          className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
        >
          {personas.map((broker) => {
            const citasBroker = citasFiltradas.filter((c) => c.assigneeId === broker.id);
            const visitasObra = citasBroker.filter((c) => c.activityType === "task").length;
            const reuniones = citasBroker.filter((c) => c.activityType === "meeting").length;
            const completadas = citasBroker.filter((c) => c.status === "completed").length;

            return (
              <article
                key={broker.id}
                className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div>
                  <header className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={broker.fullName} />
                      <div className="min-w-0">
                        <h3 className="truncate text-[15px] font-bold text-navy-950">
                          {broker.fullName}
                        </h3>
                        <p className="text-[13px] text-slate-500 tabular-nums">
                          {citasBroker.length} citas esta semana · {completadas} completadas
                        </p>
                      </div>
                    </div>
                    <Badge tone={citasBroker.length > 0 ? "blue" : "neutral"}>
                      {visitasObra} visitas · {reuniones} reuniones
                    </Badge>
                  </header>

                  <div className="mt-3 space-y-2">
                    {citasBroker.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-3 py-6 text-center text-[13px] text-slate-500">
                        Disponibilidad total en la semana actual.
                      </div>
                    ) : (
                      <ul className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                        {citasBroker.map((c) => {
                          const cfg = configTipo(c.activityType);
                          return (
                            <li
                              key={c.id}
                              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5"
                              style={{ borderLeftWidth: "4px", borderLeftColor: cfg.border }}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-[13px] font-bold tabular-nums text-navy-950">
                                  <span>
                                    {c.startsAt
                                      ? `${etiquetaDia(fechaSantoDomingo(c.startsAt))} · ${horaSantoDomingo(c.startsAt)}`
                                      : "Sin hora"}
                                  </span>
                                  <span className="text-slate-400">·</span>
                                  <span style={{ color: cfg.text }}>{cfg.label}</span>
                                </div>
                                <div className="truncate text-[13px] font-semibold text-slate-800">
                                  {c.title}
                                </div>
                                {(c.projectName || c.location) && (
                                  <div className="mt-0.5 truncate text-[13px] text-slate-500">
                                    {c.projectName ? `🏢 ${c.projectName}` : ""}{" "}
                                    {c.location ? `· 📍 ${c.location}` : ""}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setCitaParaResultado(c)}
                                  title="Registrar resultado de visita"
                                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                >
                                  <ClipboardCheck className="size-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => abrirEdicion(c)}
                                  title="Editar cita"
                                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                                >
                                  <Pencil className="size-4" />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                {idsAsignables.has(broker.id) && (
                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => abrirCrearNuevo(broker.id)}
                      className="button secondary inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 text-[13px] font-bold"
                    >
                      <Plus className="size-4 text-[#059669]" />
                      <span>Agendar Visita / Cita a {broker.fullName.split(" ")[0]}</span>
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ) : modoAgenda === "lista" ? (
        /* VISTA 2: LISTA DE AGENDA */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs divide-y divide-slate-100">
          {citasFiltradas.length === 0 ? (
            <div className="p-10 text-center text-[14px] text-slate-500">
              No hay citas registradas en esta semana con el filtro seleccionado.
            </div>
          ) : (
            citasFiltradas.map((cita) => {
              const cfg = configTipo(cita.activityType);
              return (
                <div
                  key={cita.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="px-3 py-1.5 rounded-xl text-center min-w-[96px] border"
                      style={{ backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.text }}
                    >
                      <div className="text-[13px] font-extrabold uppercase">
                        {cita.startsAt ? etiquetaDia(fechaSantoDomingo(cita.startsAt)) : "—"}
                      </div>
                      <div className="text-[14px] font-bold tabular-nums">
                        {cita.startsAt ? horaSantoDomingo(cita.startsAt) : "--:--"}
                      </div>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-[14px] font-bold text-navy-950">{cita.title}</strong>
                        <Badge tone={cfg.badgeTone}>{cfg.label}</Badge>
                        {cita.status === "completed" && <Badge tone="green">Completada</Badge>}
                      </div>
                      <p className="text-[13px] text-slate-600 mt-1">
                        Responsable: <strong>{cita.assigneeName ?? "Sin asignar"}</strong>
                        {cita.projectName ? ` · 🏢 ${cita.projectName}` : ""}
                        {cita.dealTitle ? ` · 📁 ${cita.dealTitle}` : ""}
                        {cita.contactName ? ` · 👤 ${cita.contactName}` : ""}
                        {cita.location ? ` · 📍 ${cita.location}` : ""}
                      </p>
                      {cita.description && (
                        <p className="text-[13px] text-slate-500 mt-1 line-clamp-2">{cita.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCitaParaResultado(cita)}
                      className="button secondary text-[13px] font-bold min-h-[44px] px-3.5"
                    >
                      Registrar resultado
                    </button>
                    <button
                      type="button"
                      onClick={() => abrirEdicion(cita)}
                      className="button secondary text-[13px] font-semibold min-h-[44px] px-3.5"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* VISTA 3 & 4: CALENDARIO INTERACTIVO (SEMANA 7 DÍAS O DÍA ENFOCADO) */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Cabecera del calendario */}
          <div
            className="grid bg-slate-50/90 border-b border-slate-200 overflow-x-auto"
            style={{
              gridTemplateColumns: `72px repeat(${diasParaRejilla.length}, minmax(136px, 1fr))`,
            }}
          >
            <div className="p-3 text-[13px] font-bold text-slate-400 text-center border-r border-slate-200 flex items-center justify-center">
              Hora
            </div>
            {diasParaRejilla.map((dia) => {
              const esHoy = dia === hoy;
              return (
                <header
                  key={dia}
                  className={`p-3 text-center border-r border-slate-200 last:border-r-0 ${
                    esHoy ? "bg-amber-50/60 font-bold" : ""
                  }`}
                >
                  <div className="text-[14px] font-bold text-navy-950">{etiquetaDia(dia)}</div>
                  {esHoy && (
                    <span className="inline-block mt-1 px-2.5 py-0.5 text-[13px] font-extrabold uppercase tracking-wider rounded-full bg-gold-600 text-white">
                      Hoy
                    </span>
                  )}
                </header>
              );
            })}
          </div>

          {citasFiltradas.length === 0 && (
            <div role="status" className="m-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
              <p className="m-0 text-[14px] font-semibold text-slate-700">
                No hay citas para esta semana con los filtros seleccionados.
              </p>
              {puedeCrear && (
                <button
                  type="button"
                  onClick={() => abrirCrearEnSlot(diaEnfocado, 9)}
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-navy-950 px-4 text-[13px] font-bold text-white hover:bg-navy-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-700"
                >
                  <Plus className="size-4" />
                  Crear cita
                </button>
              )}
            </div>
          )}

          {/* Rejilla de horas */}
          <div className="overflow-x-auto max-h-[720px] divide-y divide-slate-100">
            {HORAS.map((hora) => (
              <div
                className="grid min-h-[86px] hover:bg-slate-50/40 transition-colors"
                style={{
                  gridTemplateColumns: `72px repeat(${diasParaRejilla.length}, minmax(136px, 1fr))`,
                }}
                key={hora}
              >
                <time className="p-2 text-[13px] font-mono tabular-nums text-slate-500 text-right pr-3 border-r border-slate-200 bg-slate-50/30 flex items-start justify-end select-none">
                  {String(hora).padStart(2, "0")}:00
                </time>

                {diasParaRejilla.map((dia) => {
                  const eventos = citasFiltradas.filter((c) => {
                    if (!c.startsAt) return false;
                    const fechaSD = fechaSantoDomingo(c.startsAt);
                    const horaSD = Number(horaSantoDomingo(c.startsAt).split(":")[0]);
                    return fechaSD === dia && horaSD === hora;
                  });

                  const hayChoque = eventos.length > 1;

                  return (
                    <div
                      key={dia}
                      className="relative border-r border-slate-200 last:border-r-0 p-1.5 flex flex-col gap-1.5 group min-h-[86px]"
                    >
                      {/* Botón flotante al hover para crear cita rápida en este slot */}
                      {puedeCrear && (
                      <button
                        type="button"
                        onClick={() => abrirCrearEnSlot(dia, hora)}
                        className="absolute inset-x-1 bottom-1 top-auto hidden group-hover:flex items-center justify-center gap-1 py-1.5 text-[13px] font-bold text-slate-700 bg-white/95 border border-slate-300 rounded-lg shadow-xs hover:bg-amber-50 hover:text-amber-900 hover:border-amber-400 transition-all z-10"
                        title={`Agendar a las ${hora}:00`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agendar {hora}:00</span>
                      </button>
                      )}

                      {puedeCrear && eventos.length === 0 && (
                        <button
                          type="button"
                          onClick={() => abrirCrearEnSlot(dia, hora)}
                          className="sm:hidden inline-flex min-h-11 w-full items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white/80 px-2 text-[13px] font-semibold text-slate-600 active:bg-amber-50 active:text-amber-900"
                          aria-label={`Crear cita el ${dia} a las ${hora}:00`}
                        >
                          <Plus className="size-4" />
                          Crear cita
                        </button>
                      )}

                      {hayChoque && (
                        <span className="text-[13px] font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5">
                          ⚠ {eventos.length} citas simultáneas
                        </span>
                      )}

                      {eventos.map((cita) => {
                        const cfg = configTipo(cita.activityType);
                        return (
                          <div
                            key={cita.id}
                            onClick={() => abrirEdicion(cita)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                abrirEdicion(cita);
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            className="w-full text-left p-2 rounded-lg border transition-all cursor-pointer shadow-xs hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gold-700"
                            style={{
                              backgroundColor: cfg.bg,
                              borderColor: cfg.border,
                              borderLeftWidth: "4px",
                            }}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className="text-[13px] font-bold tabular-nums"
                                style={{ color: cfg.text }}
                              >
                                {cita.startsAt ? horaSantoDomingo(cita.startsAt) : ""}
                              </span>
                              <span
                                className="text-[13px] font-bold px-1.5 py-0.2 rounded"
                                style={{ backgroundColor: "rgba(0,0,0,0.06)", color: cfg.text }}
                              >
                                {cfg.label}
                              </span>
                            </div>
                            <strong className="block text-[13px] font-bold text-navy-950 truncate leading-snug">
                              {cita.title}
                            </strong>
                            <small className="block text-[13px] text-slate-600 truncate mt-0.5">
                              {cita.assigneeName ?? "Sin asignar"}
                            </small>
                            {cita.projectName && (
                              <span className="block text-[13px] font-medium text-blue-800 truncate mt-0.5">
                                🏢 {cita.projectName}
                              </span>
                            )}
                            {cita.location && (
                              <span className="flex items-center gap-1 text-[13px] text-slate-500 truncate mt-0.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{cita.location}</span>
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal unificado y pulido de creación y edición con Detector de Choques, REA y Conversor Diáspora */}
      {modalAbierto && (
        <ModalCita
          cita={citaSeleccionada}
          citasSemana={citas}
          slotInicial={slotInicial}
          dias={dias}
          personas={asignables}
          puedeCrear={puedeCrear}
          proyectos={proyectos}
          negocios={negocios}
          contactos={contactos}
          onAbrirResultado={(c) => {
            setModalAbierto(false);
            setCitaParaResultado(c);
          }}
          onClose={() => {
            setModalAbierto(false);
            setCitaSeleccionada(null);
            setSlotInicial(null);
          }}
        />
      )}

      {/* Modal de Registro de Resultado Post-Visita */}
      {citaParaResultado && (
        <ModalResultadoVisita
          cita={citaParaResultado}
          personas={asignables}
          onClose={() => setCitaParaResultado(null)}
        />
      )}
    </>
  );
}

function ModalCita({
  cita,
  citasSemana,
  slotInicial,
  dias,
  personas,
  puedeCrear,
  proyectos,
  negocios,
  contactos,
  onAbrirResultado,
  onClose,
}: {
  cita: CitaFila | null;
  citasSemana: CitaFila[];
  slotInicial: { dia: string; hora: string; brokerId?: number | null } | null;
  dias: string[];
  /** Solo personas asignables (alcance de crear). */
  personas: PersonaOpcion[];
  puedeCrear: boolean;
  proyectos: ProyectoAgendaOpcion[];
  negocios: NegocioAgendaOpcion[];
  contactos: ContactoAgendaOpcion[];
  onAbrirResultado: (cita: CitaFila) => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);

  const [enviando, setEnviando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorRed, setErrorRed] = useState<string | null>(null);
  const [avisoParcial, setAvisoParcial] = useState<string | null>(null);

  // Si el POST creó la cita pero falló Google, el modal pasa a editar ese id:
  // un segundo «Guardar» no puede volver a crearla.
  const destino = destinoGuardadoCita(cita?.id, null);
  const esEdicion = destino.method === "PATCH";
  const bloqueadoCrear = !esEdicion && !puedeCrear;

  const diaPorDefecto = cita?.startsAt
    ? fechaSantoDomingo(cita.startsAt)
    : (slotInicial?.dia ?? dias[0] ?? fechaSantoDomingo(new Date()));

  const horaPorDefecto = cita?.startsAt
    ? horaSantoDomingo(cita.startsAt)
    : (slotInicial?.hora ?? "09:00");

  const [tituloCita, setTituloCita] = useState(cita?.title ?? "");
  const [tipoActividad, setTipoActividad] = useState(cita?.activityType ?? "meeting");
  const [prioridadCita, setPrioridadCita] = useState(cita?.priority ?? "normal");
  const [duracionCita, setDuracionCita] = useState("60");
  const [ubicacionCita, setUbicacionCita] = useState(cita?.location ?? "");
  const [descripcionCita, setDescripcionCita] = useState(cita?.description ?? "");
  const [diaElegido, setDiaElegido] = useState(diaPorDefecto);
  const [horaElegida, setHoraElegida] = useState(horaPorDefecto);
  const [asignadoId, setAsignadoId] = useState(
    cita?.assigneeId
      ? String(cita.assigneeId)
      : slotInicial?.brokerId && personas.some((p) => p.id === slotInicial.brokerId)
        ? String(slotInicial.brokerId)
        : "",
  );
  const [projectId, setProjectId] = useState(cita?.projectId ? String(cita.projectId) : "");
  const [dealId, setDealId] = useState(cita?.dealId ? String(cita.dealId) : "");
  const [contactId, setContactId] = useState(cita?.contactId ? String(cita.contactId) : "");

  // Vista previa de husos horarios para compradores de diáspora (NY/Miami y Madrid)
  const equivalenciaHoraria = useMemo(() => {
    try {
      const fechaObj = new Date(`${diaElegido}T${horaElegida}:00-04:00`);
      if (Number.isNaN(fechaObj.getTime())) return null;
      return {
        santoDomingo: formatearHoraZona(fechaObj, "America/Santo_Domingo"),
        nuevaYork: formatearHoraZona(fechaObj, "America/New_York"),
        madrid: formatearHoraZona(fechaObj, "Europe/Madrid"),
      };
    } catch {
      return null;
    }
  }, [diaElegido, horaElegida]);

  // Detector de choques mediante el intervalo completo de cada cita.
  const citasEnConflicto = useMemo(() => {
    const inicioElegido = new Date(`${diaElegido}T${horaElegida}:00-04:00`).getTime();
    const duracionMs = Math.max(1, Number(duracionCita) || 60) * 60_000;
    const finElegido = inicioElegido + duracionMs;
    if (!Number.isFinite(inicioElegido) || !Number.isFinite(finElegido)) return [];
    return citasSemana.filter((c) => {
      if (cita && c.id === cita.id) return false;
      if (!c.startsAt) return false;
      if (c.status === "cancelled") return false;
      if (asignadoId && c.assigneeId && String(c.assigneeId) !== asignadoId) return false;
      const inicioExistente = new Date(c.startsAt).getTime();
      const finExistente = c.endsAt
        ? new Date(c.endsAt).getTime()
        : inicioExistente + 60 * 60_000;
      return Number.isFinite(inicioExistente) && Number.isFinite(finExistente) &&
        intervalosSeSolapan(inicioElegido, finElegido, inicioExistente, finExistente);
    });
  }, [citasSemana, cita, diaElegido, horaElegida, duracionCita, asignadoId]);

  function aplicarPlantillaVisita(pl: (typeof PLANTILLAS_VISITAS_REA)[number]) {
    setTituloCita(pl.titulo);
    setTipoActividad(pl.tipo);
    setPrioridadCita(pl.prioridad);
    setDuracionCita(pl.duracion);
    setUbicacionCita(pl.ubicacion);
    setDescripcionCita(pl.descripcion);
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current || submittingRef.current || bloqueadoCrear) return;
    const form = new FormData(formRef.current);
    const erroresCliente = erroresActividad({
      title: form.get("title"),
      day: String(form.get("day") ?? ""),
      time: String(form.get("time") ?? ""),
    });
    setErrores(erroresCliente);
    if (Object.keys(erroresCliente).length) {
      (formRef.current.elements.namedItem(Object.keys(erroresCliente)[0]!) as HTMLElement)?.focus();
      return;
    }
    submittingRef.current = true;
    setEnviando(true);
    setErrores({});
    setErrorRed(null);
    setAvisoParcial(null);

    try {
      const dia = String(form.get("day"));
      const hora = String(form.get("time"));
      const duracionMins = Number(form.get("duration") || 60);

      const startsAtIso = `${dia}T${hora}:00-04:00`;
      const startDate = new Date(startsAtIso);
      const endDate = new Date(startDate.getTime() + duracionMins * 60 * 1000);
      const endsAtIso = endDate.toISOString();

      const datos = {
        activityType: form.get("activityType"),
        title: form.get("title"),
        description: form.get("description") || undefined,
        assigneeId: form.get("assigneeId") ? Number(form.get("assigneeId")) : undefined,
        projectId: projectId ? Number(projectId) : null,
        dealId: dealId ? Number(dealId) : null,
        contactId: contactId ? Number(contactId) : null,
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        location: form.get("location") || undefined,
        meetingUrl: form.get("meetingUrl") || undefined,
        priority: form.get("priority") || "normal",
        ...(esEdicion ? {} : { googleCalendarId: form.get("googleCalendarId") || undefined }),
      };

      const { url, method } = destino;

      const respuesta = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(datos),
      });

      const cuerpo = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setErrores(cuerpo.fields ?? {});
        setErrorRed(cuerpo.error ?? "No se pudo guardar la cita. Revisa los datos.");
        return;
      }

      if (typeof cuerpo.google?.error === "string") {
        if (method === "POST") {
          // La cita ya existe: se cierra el modal para no duplicarla ni exigir permiso de edición (PATCH).
          toast.warning("Cita creada en la agenda; Google no respondió. Reintenta la sincronización desde la cita.");
          router.refresh();
          onClose();
          return;
        }
        setAvisoParcial("La cita se guardó en la agenda, pero Google no respondió. La cita sigue disponible en el CRM; revisa la integración antes de reintentar la sincronización.");
        toast.warning("Cita guardada; Google no respondió.");
        router.refresh();
        return;
      }

      toast.success("Cita guardada y vinculada en la agenda.");
      router.refresh();
      onClose();
    } catch {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setErrorRed(
        offline
          ? "Sin conexión a internet. Los datos de la cita se mantienen intactos."
          : "Fallo de conexión al procesar la cita. Los datos están intactos.",
      );
    } finally {
      submittingRef.current = false;
      setEnviando(false);
    }
  }

  async function ejecutarEliminar() {
    if (destino.id === null) return;
    setEliminando(true);
    setErrorRed(null);
    try {
      const respuesta = await fetch(`/api/actividades/${destino.id}`, {
        method: "DELETE",
      });
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}));
        throw new Error(cuerpo.error || "No se pudo eliminar la cita.");
      }
      router.refresh();
      onClose();
    } catch (err) {
      setErrorRed(err instanceof Error ? err.message : "Error al eliminar la cita.");
    } finally {
      setEliminando(false);
    }
  }

  return (
    <Modal title={esEdicion ? "Editar cita / visita" : "Nueva cita o visita inmobiliaria (REA)"} onClose={onClose}>
      <form noValidate className="form-grid" ref={formRef} onSubmit={guardar} aria-busy={enviando || eliminando}>
        {errorRed && (
          <div className="span-2">
            <AlertaErrorFormulario
              mensaje={errorRed}
              onReintentar={() => formRef.current?.requestSubmit()}
              disabled={enviando || eliminando}
            />
          </div>
        )}

        {avisoParcial && (
          <p role="status" className="span-2 m-0 rounded-xl border border-amber-300 bg-amber-50 p-3 text-[13px] font-medium text-amber-950">
            {avisoParcial}
          </p>
        )}

        {/* Plantillas Rápidas de Visita Inmobiliaria REA */}
        {!esEdicion && (
          <div className="span-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-navy-950">
              <Sparkles className="size-4 text-amber-600" />
              <span>Plantillas de Visita / Cita Inmobiliaria REA:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PLANTILLAS_VISITAS_REA.map((pl) => (
                <button
                  key={pl.id}
                  type="button"
                  onClick={() => aplicarPlantillaVisita(pl)}
                  className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 bg-white px-3 py-1 text-[13px] font-semibold text-slate-700 hover:border-navy-950 hover:bg-slate-100"
                >
                  {pl.etiqueta}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Alerta proactiva de choque de horario */}
        {citasEnConflicto.length > 0 && (
          <div className="span-2 rounded-xl bg-amber-50 border border-amber-300 p-3 text-[13px] text-amber-950 flex items-start gap-2">
            <AlertTriangle className="size-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>Posible solapamiento detectado:</strong> El intervalo se cruza con{" "}
              {citasEnConflicto.map((c) => `«${c.title}»`).join(", ")}.
            </div>
          </div>
        )}

        <label className="span-2">
          Asunto / Título de la cita *
          <input
            name="title"
            aria-required="true"
            aria-invalid={Boolean(errores.title)}
            aria-describedby={errores.title ? "cita-titulo-error" : undefined}
            required
            autoFocus
            value={tituloCita}
            onChange={(e) => setTituloCita(e.target.value)}
            placeholder="Ej. Tour VIP Cap Cana Lofts con Carlos Gómez"
            className="min-h-[44px] text-[14px]"
          />
          {errores.title && (
            <small id="cita-titulo-error" role="alert" className="text-red-600 text-[13px]">
              {errores.title}
            </small>
          )}
        </label>

        <label>
          Tipo de actividad
          <select
            name="activityType"
            value={tipoActividad}
            onChange={(e) => setTipoActividad(e.target.value)}
            className="min-h-[44px] text-[14px]"
          >
            <option value="meeting">Reunión presencial / Virtual</option>
            <option value="task">Visita a proyecto / Campo</option>
            <option value="call">Llamada telefónica</option>
            <option value="whatsapp">Seguimiento WhatsApp</option>
            <option value="email">Correo electrónico</option>
            <option value="note">Nota interna</option>
          </select>
        </label>

        <label>
          Prioridad
          <select
            name="priority"
            value={prioridadCita}
            onChange={(e) => setPrioridadCita(e.target.value)}
            className="min-h-[44px] text-[14px]"
          >
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
          </select>
        </label>

        <label>
          Día (Lun–Dom)
          <select
            name="day"
            value={diaElegido}
            onChange={(e) => setDiaElegido(e.target.value)}
            className="min-h-[44px] text-[14px]"
          >
            {dias.map((dia) => (
              <option key={dia} value={dia}>
                {etiquetaDia(dia)}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label>
            Hora inicio *
            <input
              name="time"
              aria-invalid={Boolean(errores.time)}
              aria-describedby={errores.time ? "cita-hora-error" : undefined}
              type="time"
              required
              value={horaElegida}
              onChange={(e) => setHoraElegida(e.target.value)}
              className="min-h-[44px] text-[14px] tabular-nums"
            />
          </label>
          <label>
            Duración
            <select
              name="duration"
              value={duracionCita}
              onChange={(e) => setDuracionCita(e.target.value)}
              className="min-h-[44px] text-[14px]"
            >
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hora</option>
              <option value="90">1.5 horas</option>
              <option value="120">2 horas</option>
            </select>
          </label>
        </div>

        {/* Conversor de Huso Horario para Inversores de Diáspora */}
        {equivalenciaHoraria && (
          <div className="span-2 rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-[13px]">
            <span className="font-bold text-navy-950 inline-flex items-center gap-1.5">
              <Globe className="size-4 text-gold-700" />
              Huso Horario Diáspora:
            </span>
            <div className="flex flex-wrap items-center gap-3 font-medium tabular-nums text-slate-700">
              <span>
                🇩🇴 Santo Domingo: <strong>{equivalenciaHoraria.santoDomingo}</strong>
              </span>
              <span>
                🇺🇸 NY / Miami: <strong>{equivalenciaHoraria.nuevaYork}</strong>
              </span>
              <span>
                🇪🇸 Madrid: <strong>{equivalenciaHoraria.madrid}</strong>
              </span>
            </div>
          </div>
        )}

        <label className="span-2">
          Broker Responsable (Agente REA)
          <select
            name="assigneeId"
            value={asignadoId}
            onChange={(e) => setAsignadoId(e.target.value)}
            className="min-h-[44px] text-[14px]"
            disabled={bloqueadoCrear}
          >
            <option value="">Quien la crea (Automático)</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.fullName}
              </option>
            ))}
          </select>
        </label>

        {/* Vínculos REA (Proyecto / Negocio / Contacto) */}
        <div className="span-2 rounded-xl border border-slate-200 bg-slate-50 p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <label className="text-[13px] font-semibold text-slate-700">
            Proyecto (Recurso REA)
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 min-h-[44px] w-full text-[13px]"
            >
              <option value="">Sin proyecto</option>
              {proyectos.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-[13px] font-semibold text-slate-700">
            Negocio vinculado
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
              className="mt-1 min-h-[44px] w-full text-[13px]"
            >
              <option value="">Sin negocio</option>
              {negocios.map((d) => (
                <option key={d.id} value={String(d.id)}>
                  {d.title}
                </option>
              ))}
            </select>
          </label>

          <label className="text-[13px] font-semibold text-slate-700">
            Cliente / Inversor
            <select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              className="mt-1 min-h-[44px] w-full text-[13px]"
            >
              <option value="">Sin contacto</option>
              {contactos.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </label>
        </div>

        {!esEdicion && <SelectorCalendarioGoogle />}

        <label className="span-2">
          Ubicación física (opcional)
          <input
            name="location"
            value={ubicacionCita}
            onChange={(e) => setUbicacionCita(e.target.value)}
            placeholder="Oficina central, Showroom Punta Cana, Obra..."
            className="min-h-[44px] text-[14px]"
          />
        </label>

        <label className="span-2">
          Enlace videollamada (opcional)
          <input
            name="meetingUrl"
            type="url"
            defaultValue={cita?.meetingUrl ?? ""}
            placeholder="https://meet.google.com/... o Zoom"
            className="min-h-[44px] text-[14px]"
          />
        </label>

        <label className="span-2">
          Notas / Descripción (opcional)
          <textarea
            name="description"
            value={descripcionCita}
            onChange={(e) => setDescripcionCita(e.target.value)}
            placeholder="Puntos a tratar, unidades a mostrar o requerimientos del cliente..."
            rows={2}
            className="min-h-[60px] text-[14px]"
          />
        </label>

        {errores._ && <small className="text-red-600 text-[13px] span-2">{errores._}</small>}

        {/* Zona de botones y acciones secundarias */}
        <div className="span-2 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {esEdicion && !confirmarEliminar ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmarEliminar(true)}
                className="button inline-flex items-center gap-1.5 text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 min-h-[44px] px-3.5 text-[13px] font-semibold"
                disabled={enviando || eliminando}
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
              {cita && (
                <button
                  type="button"
                  onClick={() => onAbrirResultado(cita)}
                  className="button secondary inline-flex items-center gap-1.5 min-h-[44px] px-3.5 text-[13px] font-semibold"
                >
                  <ClipboardCheck className="w-4 h-4 text-emerald-700" />
                  <span>Registrar resultado</span>
                </button>
              )}
            </div>
          ) : esEdicion && confirmarEliminar ? (
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
              <span className="text-[13px] font-bold text-red-800">¿Confirmar eliminación?</span>
              <button
                type="button"
                onClick={ejecutarEliminar}
                disabled={eliminando}
                className="min-h-[44px] px-3 bg-red-600 text-white text-[13px] font-bold rounded hover:bg-red-700"
              >
                {eliminando ? "Borrando…" : "Sí, borrar"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmarEliminar(false)}
                disabled={eliminando}
                className="min-h-[44px] px-3 text-[13px] font-semibold text-slate-600 hover:text-slate-900"
              >
                No
              </button>
            </div>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2 ml-auto">
            {esEdicion && cita && (
              <>
                <a
                  href={googleCalendarUrl(cita)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button secondary inline-flex items-center gap-1.5 min-h-[44px] px-3 text-[13px]"
                  title="Añadir a Google Calendar"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Google Cal</span>
                </a>
                <button
                  type="button"
                  onClick={() => descargarIcsCita(cita)}
                  className="button secondary inline-flex items-center gap-1.5 min-h-[44px] px-3 text-[13px]"
                  title="Descargar archivo .ics"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>.ics</span>
                </button>
              </>
            )}

            <button
              className="button secondary min-h-[44px] px-4 text-[13px]"
              type="button"
              onClick={onClose}
              disabled={enviando || eliminando}
            >
              Cancelar
            </button>
            <button
              className="button primary min-h-[44px] px-5 text-[13px] font-bold"
              type="submit"
              disabled={enviando || eliminando || bloqueadoCrear}
            >
              {enviando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Agendar cita"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/**
 * Modal de Registro de Resultado Post-Visita (Asistencia, Temperatura del Comprador,
 * Acuerdos/Objeciones y creación opcional de Tarea To-Do de Seguimiento asignada al Broker).
 */
function ModalResultadoVisita({
  cita,
  personas,
  onClose,
}: {
  cita: CitaFila;
  personas: PersonaOpcion[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [asistencia, setAsistencia] = useState<"asistio" | "reprogramo" | "no_asistio">("asistio");
  const [interes, setInteres] = useState<"caliente" | "tibio" | "frio">("caliente");
  const [conclusion, setConclusion] = useState("");
  const [crearSeguimiento, setCrearSeguimiento] = useState(true);
  const [tituloSeguimiento, setTituloSeguimiento] = useState(
    `Enviar cotización Confotur y bloqueo 48h tras: ${cita.title}`,
  );
  const [brokerSeguimientoId, setBrokerSeguimientoId] = useState<string>(
    cita.assigneeId ? String(cita.assigneeId) : "",
  );
  const [diasSeguimiento, setDiasSeguimiento] = useState(2);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resultadoEnviandoRef = useRef(false);
  const resultadoGuardadoRef = useRef(false);
  async function guardarResultado(e: FormEvent) {
    e.preventDefault();
    if (resultadoEnviandoRef.current) return;
    resultadoEnviandoRef.current = true;
    setGuardando(true);
    setError(null);

    try {
      const etiquetaAsistencia =
        asistencia === "asistio"
          ? "Asistió puntualmente"
          : asistencia === "reprogramo"
            ? "Solicitó reprogramación"
            : "No asistió (No-show)";
      const etiquetaInteres =
        interes === "caliente"
          ? "Interés ALTO (Listo para reserva/cotización)"
          : interes === "tibio"
            ? "Interés MEDIO (Evaluando opciones)"
            : "Interés BAJO";

      const bitacora = [
        cita.description?.trim(),
        `[RESULTADO DE CITA]: ${etiquetaAsistencia} · ${etiquetaInteres}.`,
        conclusion.trim() ? `Acuerdos / Objeciones: ${conclusion.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      if (!resultadoGuardadoRef.current) {
        const resPatch = await fetch(`/api/actividades/${cita.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            // "No asistió" cierra la cita (cancelada) en lugar de devolverla a
            // pendiente; solo "Solicitó reprogramación" la deja abierta.
            status: asistencia === "asistio" ? "completed" : asistencia === "no_asistio" ? "cancelled" : "pending",
            description: bitacora,
          }),
        });

        if (!resPatch.ok) {
          const body = await resPatch.json().catch(() => ({}));
          throw new Error(body.error ?? "No se pudo registrar el resultado de la cita.");
        }

        resultadoGuardadoRef.current = true;
      }

      if (crearSeguimiento && tituloSeguimiento.trim()) {
        const fechaVenc = sumarDias(fechaSantoDomingo(new Date()), diasSeguimiento);
        await crearSeguimientoVisita(
          (datos) =>
            fetch("/api/actividades", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(datos),
            }),
          {
            titulo: tituloSeguimiento,
            fecha: fechaVenc,
            prioridad: interes === "caliente" ? "high" : "normal",
            assigneeId: brokerSeguimientoId ? Number(brokerSeguimientoId) : (cita.assigneeId ?? undefined),
            contactId: cita.contactId ?? undefined,
            dealId: cita.dealId ?? undefined,
            projectId: cita.projectId ?? undefined,
          },
        );
      }

      toast.success("Resultado de visita registrado y tarea de seguimiento asignada.");
      router.refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el resultado.");
    } finally {
      resultadoEnviandoRef.current = false;
      setGuardando(false);
    }
  }

  return (
    <Modal title="Registrar resultado de visita / cita" onClose={onClose}>
      <form className="form-grid" onSubmit={guardarResultado}>
        {error && (
          <div className="span-2">
            <AlertaErrorFormulario mensaje={error} disabled={guardando} />
          </div>
        )}

        <div className="span-2 rounded-xl bg-slate-50 border border-slate-200 p-3 text-[13px]">
          <div className="font-bold text-navy-950 text-[14px]">{cita.title}</div>
          <div className="text-slate-600 mt-0.5">
            Responsable: {cita.assigneeName ?? "Sin asignar"}
            {cita.projectName ? ` · Proyecto: ${cita.projectName}` : ""}
          </div>
        </div>

        <label>
          Asistencia del prospecto
          <select
            value={asistencia}
            onChange={(e) => setAsistencia(e.target.value as "asistio" | "reprogramo" | "no_asistio")}
            className="min-h-[44px] text-[14px]"
          >
            <option value="asistio">✓ Asistió a la cita</option>
            <option value="reprogramo">↻ Solicitó reprogramar</option>
            <option value="no_asistio">✕ No asistió (No-show)</option>
          </select>
        </label>

        <label>
          Temperatura comercial
          <select
            value={interes}
            onChange={(e) => setInteres(e.target.value as "caliente" | "tibio" | "frio")}
            className="min-h-[44px] text-[14px]"
          >
            <option value="caliente">🔥 Caliente — Listo para propuesta</option>
            <option value="tibio">☀️ Tibio — Evaluando unidades</option>
            <option value="frio">❄️ Frío — Largo plazo</option>
          </select>
        </label>

        <label className="span-2">
          Acuerdos, unidades de interés u objeciones
          <textarea
            rows={3}
            value={conclusion}
            onChange={(e) => setConclusion(e.target.value)}
            placeholder="Ej. Le interesó el Penthouse B-402 con vista al mar, solicitó simulación Confotur 10/40/50..."
            className="text-[14px]"
          />
        </label>

        <div className="span-2 rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-3">
          <label className="flex items-center gap-2 text-[13px] font-bold text-emerald-950 cursor-pointer">
            <Checkbox checked={crearSeguimiento} onCheckedChange={(checked) => setCrearSeguimiento(checked)} />
            <CheckCircle2 className="size-4 text-emerald-700" />
            <span>Programar automáticamente tarea To-Do de siguiente paso para el Broker</span>
          </label>

          {crearSeguimiento && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <label className="sm:col-span-3 text-[13px] font-semibold text-slate-700">
                Acción de seguimiento (To-Do)
                <input
                  value={tituloSeguimiento}
                  onChange={(e) => setTituloSeguimiento(e.target.value)}
                  className="min-h-[44px] text-[13px] mt-1"
                />
              </label>
              <label className="sm:col-span-2 text-[13px] font-semibold text-slate-700">
                Broker asignado al seguimiento
                <select
                  value={brokerSeguimientoId}
                  onChange={(e) => setBrokerSeguimientoId(e.target.value)}
                  className="min-h-[44px] text-[13px] mt-1"
                >
                  <option value="">Mismo responsable de la visita</option>
                  {personas.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[13px] font-semibold text-slate-700">
                Plazo SLA
                <select
                  value={diasSeguimiento}
                  onChange={(e) => setDiasSeguimiento(Number(e.target.value))}
                  className="min-h-[44px] text-[13px] mt-1"
                >
                  <option value={1}>Mañana (24h)</option>
                  <option value={2}>En 2 días</option>
                  <option value={3}>En 3 días</option>
                  <option value={7}>En 1 semana</option>
                </select>
              </label>
            </div>
          )}
        </div>

        <div className="span-2 flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="button secondary min-h-[44px] px-4 text-[13px]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="button primary min-h-[44px] px-5 text-[13px] font-bold"
          >
            {guardando ? "Registrando…" : "Guardar resultado"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
