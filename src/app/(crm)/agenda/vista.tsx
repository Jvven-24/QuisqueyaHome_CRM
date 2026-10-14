"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import {
  Calendar,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Video,
} from "lucide-react";
import { formatoFechaIcs, generarIcs } from "@/domain/ics";
import { fechaSantoDomingo, horaSantoDomingo, sumarDias } from "@/domain/zona-horaria";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";
import { Avatar, Badge, Modal, PageHeader } from "../_ui/prototipo-ui";

export type CitaFila = {
  id: number;
  title: string;
  description?: string | null;
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

const HORAS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

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

function googleCalendarUrl(cita: CitaFila): string {
  if (!cita.startsAt) return "#";
  const fin = cita.endsAt ?? new Date(cita.startsAt.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: cita.title,
    dates: `${formatoFechaIcs(cita.startsAt)}/${formatoFechaIcs(fin)}`,
    details: `${cita.description ? cita.description + "\n\n" : ""}Actividad Quisqueya Home CRM.\nResponsable: ${
      cita.assigneeName ?? "Sin asignar"
    }.${cita.meetingUrl ? `\nVideollamada: ${cita.meetingUrl}` : ""}`,
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

export function AgendaVista({
  citas,
  personas,
  lunes,
}: {
  citas: CitaFila[];
  personas: PersonaOpcion[];
  lunes: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaFila | null>(null);
  const [slotInicial, setSlotInicial] = useState<{ dia: string; hora: string } | null>(null);

  // 6 días: Lunes a Sábado (jornada inmobiliaria activa)
  const dias = [0, 1, 2, 3, 4, 5].map((offset) => sumarDias(lunes, offset));

  function irASemana(fechaISO: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("semana", fechaISO);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hoy = fechaSantoDomingo(new Date());
  const citasDeHoy = citas.filter(
    (c) => c.startsAt && fechaSantoDomingo(c.startsAt) === hoy,
  );

  function abrirCrearEnSlot(dia: string, horaNum: number) {
    const horaTexto = `${String(horaNum).padStart(2, "0")}:00`;
    setSlotInicial({ dia, hora: horaTexto });
    setCitaSeleccionada(null);
    setModalAbierto(true);
  }

  function abrirEdicion(cita: CitaFila) {
    setCitaSeleccionada(cita);
    setSlotInicial(null);
    setModalAbierto(true);
  }

  function abrirCrearNuevo() {
    setSlotInicial(null);
    setCitaSeleccionada(null);
    setModalAbierto(true);
  }

  return (
    <>
      <PageHeader
        eyebrow="Seguimiento comercial"
        title="Citas y agenda"
        subtitle="Control semanal de visitas, reuniones presenciales y videollamadas del equipo comercial."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              className="button secondary inline-flex items-center gap-2 min-h-[44px] px-4 font-semibold text-[13px]"
              href={`/api/actividades/ics?semana=${lunes}`}
              title="Descargar archivo .ics con las citas de toda la semana"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Exportar semana (.ics)</span>
            </a>
            <button
              className="button primary inline-flex items-center gap-2 min-h-[44px] px-5 font-bold text-[13px]"
              type="button"
              onClick={abrirCrearNuevo}
            >
              <Plus className="w-4 h-4" />
              <span>Nueva cita</span>
            </button>
          </div>
        }
      />

      {/* Barra de navegación de semanas y conteo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 mb-5 bg-white border border-slate-200 rounded-xl shadow-xs">
        <div className="segmented inline-flex p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            className="px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:text-slate-900 rounded-md transition-colors"
            onClick={() => irASemana(sumarDias(lunes, -7))}
          >
            ← Semana anterior
          </button>
          <button
            className="px-3.5 py-1.5 text-[13px] font-bold text-slate-900 bg-white shadow-xs rounded-md"
            type="button"
            onClick={() => irASemana(fechaSantoDomingo(new Date()))}
          >
            Esta semana
          </button>
          <button
            type="button"
            className="px-3 py-1.5 text-[13px] font-semibold text-slate-700 hover:text-slate-900 rounded-md transition-colors"
            onClick={() => irASemana(sumarDias(lunes, 7))}
          >
            Semana siguiente →
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
            <Calendar className="w-4 h-4 text-gold-700" />
            <span>
              Semana del {etiquetaDia(lunes)} al {etiquetaDia(dias[dias.length - 1] ?? lunes)}
            </span>
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-bold bg-gold-100 text-gold-800 border border-gold-300">
            {citasDeHoy.length} {citasDeHoy.length === 1 ? "cita hoy" : "citas hoy"}
          </span>
        </div>
      </div>

      {/* Indicador de citas del día con enlaces directos a Google Calendar y descarga .ics */}
      <section className="mb-6 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-gold-100 border border-gold-300/70 flex items-center justify-center text-gold-800">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-navy-950 m-0">
                Citas de hoy — {nombreDiaCompleto(hoy)}
              </h2>
              <p className="text-[13px] text-slate-500 m-0">
                Acceso directo a calendario y recordatorios rápidos para la jornada.
              </p>
            </div>
          </div>
          {citasDeHoy.length > 0 && (
            <span className="text-[13px] font-semibold text-slate-600 self-start sm:self-center">
              {citasDeHoy.length} programada{citasDeHoy.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {citasDeHoy.length === 0 ? (
          <div className="py-6 px-4 text-center rounded-lg bg-slate-50/70 border border-dashed border-slate-200">
            <p className="text-[13px] text-slate-600 m-0 mb-3">
              No tienes citas programadas para hoy. Mantén el ritmo agendando una nueva actividad.
            </p>
            <button
              type="button"
              className="button secondary inline-flex items-center gap-2 min-h-[44px] px-4 text-[13px] font-semibold"
              onClick={() => abrirCrearEnSlot(hoy, 10)}
            >
              <Plus className="w-4 h-4" />
              <span>Agendar cita para hoy</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {citasDeHoy.map((cita) => {
              const cfg = configTipo(cita.activityType);
              const gcal = googleCalendarUrl(cita);
              return (
                <div
                  key={cita.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-gold-500/50 hover:shadow-xs transition-all flex flex-col justify-between"
                  style={{ borderLeftWidth: "4px", borderLeftColor: cfg.border }}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <span className="inline-flex items-center gap-1 text-[13px] font-bold text-navy-950">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {cita.startsAt ? horaSantoDomingo(cita.startsAt) : "--:--"}
                      </span>
                      <Badge tone={cfg.badgeTone}>{cfg.label}</Badge>
                    </div>
                    <strong className="block text-[14px] font-bold text-navy-950 mb-1 line-clamp-1">
                      {cita.title}
                    </strong>
                    <div className="space-y-1 mb-3 text-[13px] text-slate-600">
                      <p className="flex items-center gap-1.5 m-0 truncate">
                        <Avatar name={cita.assigneeName ?? "Sin asignar"} small />
                        <span className="truncate">{cita.assigneeName ?? "Sin asignar"}</span>
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

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80">
                    <a
                      href={gcal}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[13px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors min-h-[44px]"
                      title="Abrir en Google Calendar"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Google Cal</span>
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

      {/* Calendario semanal interactivo con bloques por hora y código de color */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Cabecera del calendario */}
        <div className="grid grid-cols-[68px_repeat(6,minmax(140px,1fr))] bg-slate-50/90 border-b border-slate-200 overflow-x-auto">
          <div className="p-3 text-[13px] font-bold text-slate-400 text-center border-r border-slate-200 flex items-center justify-center">
            Hora
          </div>
          {dias.map((dia) => {
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
                  <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wider rounded-full bg-gold-600 text-white">
                    Hoy
                  </span>
                )}
              </header>
            );
          })}
        </div>

        {/* Rejilla de horas */}
        <div className="overflow-x-auto max-h-[720px] divide-y divide-slate-100">
          {HORAS.map((hora) => (
            <div
              className="grid grid-cols-[68px_repeat(6,minmax(140px,1fr))] min-h-[82px] hover:bg-slate-50/40 transition-colors"
              key={hora}
            >
              <time className="p-2 text-[13px] font-mono text-slate-500 text-right pr-3 border-r border-slate-200 bg-slate-50/30 flex items-start justify-end select-none">
                {String(hora).padStart(2, "0")}:00
              </time>

              {dias.map((dia) => {
                const eventos = citas.filter((c) => {
                  if (!c.startsAt) return false;
                  const fechaSD = fechaSantoDomingo(c.startsAt);
                  const horaSD = Number(horaSantoDomingo(c.startsAt).split(":")[0]);
                  return fechaSD === dia && horaSD === hora;
                });

                return (
                  <div
                    key={dia}
                    className="relative border-r border-slate-200 last:border-r-0 p-1.5 flex flex-col gap-1.5 group min-h-[82px]"
                  >
                    {/* Botón flotante al hover para crear cita rápida en este slot */}
                    <button
                      type="button"
                      onClick={() => abrirCrearEnSlot(dia, hora)}
                      className="absolute inset-x-1 bottom-1 top-auto hidden group-hover:flex items-center justify-center gap-1 py-1 text-[12px] font-bold text-slate-600 bg-white/90 border border-slate-300 rounded shadow-xs hover:bg-amber-50 hover:text-amber-900 hover:border-amber-400 transition-all z-10"
                      title={`Agendar a las ${hora}:00`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agendar {hora}:00</span>
                    </button>

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
                            <span className="text-[12px] font-bold" style={{ color: cfg.text }}>
                              {cita.startsAt ? horaSantoDomingo(cita.startsAt) : ""}
                            </span>
                            <span
                              className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded"
                              style={{ backgroundColor: "rgba(0,0,0,0.06)", color: cfg.text }}
                            >
                              {cfg.label}
                            </span>
                          </div>
                          <strong className="block text-[13px] font-bold text-navy-950 truncate leading-snug">
                            {cita.title}
                          </strong>
                          <small className="block text-[12px] text-slate-600 truncate mt-0.5">
                            {cita.assigneeName ?? "Sin asignar"}
                          </small>
                          {cita.location && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-500 truncate mt-1">
                              <MapPin className="w-3 h-3 shrink-0" />
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

      {/* Modal unificado y pulido de creación y edición */}
      {modalAbierto && (
        <ModalCita
          cita={citaSeleccionada}
          slotInicial={slotInicial}
          dias={dias}
          personas={personas}
          onClose={() => {
            setModalAbierto(false);
            setCitaSeleccionada(null);
            setSlotInicial(null);
          }}
        />
      )}
    </>
  );
}

function ModalCita({
  cita,
  slotInicial,
  dias,
  personas,
  onClose,
}: {
  cita: CitaFila | null;
  slotInicial: { dia: string; hora: string } | null;
  dias: string[];
  personas: PersonaOpcion[];
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

  const esEdicion = Boolean(cita && cita.id > 0);

  // Valores predeterminados
  const diaPorDefecto = cita?.startsAt
    ? fechaSantoDomingo(cita.startsAt)
    : (slotInicial?.dia ?? dias[0] ?? fechaSantoDomingo(new Date()));

  const horaPorDefecto = cita?.startsAt
    ? horaSantoDomingo(cita.startsAt)
    : (slotInicial?.hora ?? "09:00");

  const [tipoActividad, setTipoActividad] = useState(cita?.activityType ?? "meeting");

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current || submittingRef.current) return;
    submittingRef.current = true;
    setEnviando(true);
    setErrores({});
    setErrorRed(null);

    try {
      const form = new FormData(formRef.current);
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
        assigneeId: form.get("assigneeId") || undefined,
        startsAt: startsAtIso,
        endsAt: endsAtIso,
        location: form.get("location") || undefined,
        meetingUrl: form.get("meetingUrl") || undefined,
        priority: form.get("priority") || "normal",
      };

      const url = esEdicion ? `/api/actividades/${cita!.id}` : "/api/actividades";
      const method = esEdicion ? "PATCH" : "POST";

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
    if (!cita) return;
    setEliminando(true);
    setErrorRed(null);
    try {
      const respuesta = await fetch(`/api/actividades/${cita.id}`, {
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
    <Modal title={esEdicion ? "Editar cita" : "Nueva cita comercial"} onClose={onClose}>
      <form className="form-grid" ref={formRef} onSubmit={guardar} aria-busy={enviando || eliminando}>
        {errorRed && (
          <div className="span-2">
            <AlertaErrorFormulario
              mensaje={errorRed}
              onReintentar={() => formRef.current?.requestSubmit()}
              disabled={enviando || eliminando}
            />
          </div>
        )}

        <label className="span-2">
          Asunto / Título de la cita
          <input
            name="title"
            required
            autoFocus
            defaultValue={cita?.title ?? ""}
            placeholder="Ej. Presentación Cap Cana Lofts con Carlos Gómez"
            className="min-h-[44px] text-[14px]"
          />
          {errores.title && <small className="text-red-600 text-[13px]">{errores.title}</small>}
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
            <option value="call">Llamada telefónica</option>
            <option value="whatsapp">Seguimiento WhatsApp</option>
            <option value="task">Visita a proyecto / Campo</option>
            <option value="email">Correo electrónico</option>
            <option value="note">Nota interna</option>
          </select>
        </label>

        <label>
          Prioridad
          <select
            name="priority"
            defaultValue={cita?.priority ?? "normal"}
            className="min-h-[44px] text-[14px]"
          >
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
          </select>
        </label>

        <label>
          Día
          <select name="day" defaultValue={diaPorDefecto} className="min-h-[44px] text-[14px]">
            {dias.map((dia) => (
              <option key={dia} value={dia}>
                {etiquetaDia(dia)}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-2">
          <label>
            Hora inicio
            <input
              name="time"
              type="time"
              required
              defaultValue={horaPorDefecto}
              className="min-h-[44px] text-[14px]"
            />
          </label>
          <label>
            Duración
            <select name="duration" defaultValue="60" className="min-h-[44px] text-[14px]">
              <option value="30">30 min</option>
              <option value="45">45 min</option>
              <option value="60">1 hora</option>
              <option value="90">1.5 horas</option>
              <option value="120">2 horas</option>
            </select>
          </label>
        </div>

        <label className="span-2">
          Responsable asignado
          <select
            name="assigneeId"
            defaultValue={cita?.assigneeId ? String(cita.assigneeId) : ""}
            className="min-h-[44px] text-[14px]"
          >
            <option value="">Quien la crea (Automático)</option>
            {personas.map((persona) => (
              <option key={persona.id} value={persona.id}>
                {persona.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="span-2">
          Ubicación física (opcional)
          <input
            name="location"
            defaultValue={cita?.location ?? ""}
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
            defaultValue={cita?.description ?? ""}
            placeholder="Puntos a tratar, requerimientos del cliente..."
            rows={2}
            className="min-h-[60px] text-[14px]"
          />
        </label>

        {errores._ && <small className="text-red-600 text-[13px] span-2">{errores._}</small>}

        {/* Zona de botones y acciones secundarias */}
        <div className="span-2 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {esEdicion && !confirmarEliminar ? (
            <button
              type="button"
              onClick={() => setConfirmarEliminar(true)}
              disabled={enviando || eliminando}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg min-h-[44px] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar cita</span>
            </button>
          ) : confirmarEliminar ? (
            <div className="flex items-center gap-2 p-1.5 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-[13px] font-medium text-red-800">¿Eliminar esta cita?</span>
              <button
                type="button"
                onClick={ejecutarEliminar}
                disabled={eliminando}
                className="px-2.5 py-1 text-[13px] font-bold text-white bg-red-600 rounded hover:bg-red-700 min-h-[38px]"
              >
                {eliminando ? "Borrando..." : "Sí, eliminar"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmarEliminar(false)}
                className="px-2 py-1 text-[13px] font-medium text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              className="button secondary min-h-[44px] px-4 text-[13px] font-semibold"
              type="button"
              onClick={onClose}
              disabled={enviando || eliminando}
            >
              Cerrar
            </button>
            <button
              className="button primary min-h-[44px] px-5 text-[13px] font-bold"
              type="submit"
              disabled={enviando || eliminando}
            >
              {enviando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Agendar cita"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
