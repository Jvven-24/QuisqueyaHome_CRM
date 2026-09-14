"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import { formatoFechaIcs } from "@/domain/ics";
import { fechaSantoDomingo, horaSantoDomingo, sumarDias } from "@/domain/zona-horaria";
import { Modal, PageHeader } from "../_ui/prototipo-ui";

export type CitaFila = {
  id: number;
  title: string;
  startsAt: Date | null;
  endsAt: Date | null;
  location: string | null;
  assigneeId: number | null;
  assigneeName: string | null;
};

export type PersonaOpcion = { id: number; fullName: string };

const HORAS = [9, 10, 11, 12, 13, 14, 15, 16];

function etiquetaDia(fechaISO: string): string {
  const fecha = new Date(`${fechaISO}T12:00:00-04:00`); // mediodía: nunca cruza a otro día al formatear
  const texto = new Intl.DateTimeFormat("es-DO", { weekday: "short", day: "numeric", timeZone: "America/Santo_Domingo" }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function googleCalendarUrl(cita: CitaFila): string {
  const fin = cita.endsAt ?? new Date(cita.startsAt!.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: cita.title,
    dates: `${formatoFechaIcs(cita.startsAt!)}/${formatoFechaIcs(fin)}`,
    details: `Actividad de Quisqueya Home CRM. Responsable: ${cita.assigneeName ?? "sin asignar"}.`,
    ctz: "America/Santo_Domingo",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/**
 * M4 · Agenda (F2). Rejilla semanal real sobre `activities` — mismo look que
 * portó T5 (`.calendar`, `.calendar-row`, `.calendar-event`), pero con fechas
 * reales en vez del índice de día `1..5` del prototipo (defecto documentado
 * en `docs/contexto/errores-conocidos.md`). La semana vive en la URL
 * (`?semana=`), navegable con "Anterior"/"Siguiente".
 */
export function AgendaVista({ citas, personas, lunes }: { citas: CitaFila[]; personas: PersonaOpcion[]; lunes: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [creando, setCreando] = useState(false);

  const dias = [0, 1, 2, 3, 4].map((offset) => sumarDias(lunes, offset));

  function irASemana(fechaISO: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("semana", fechaISO);
    router.push(`${pathname}?${params.toString()}`);
  }

  const hoy = fechaSantoDomingo(new Date());
  const citasHoy = citas.filter((c) => c.startsAt && fechaSantoDomingo(c.startsAt) === hoy).length;

  return (
    <>
      <PageHeader
        eyebrow="C4 · Seguimiento"
        title="Citas y agenda"
        subtitle="La agenda central del equipo comercial."
        action={
          <div className="header-actions-inline">
            <a className="button secondary" href={`/api/actividades/ics?semana=${lunes}`}>
              Exportar .ics
            </a>
            <button className="button primary" type="button" onClick={() => setCreando(true)}>
              Nueva cita
            </button>
          </div>
        }
      />
      <div className="filter-bar">
        <div className="segmented">
          <button type="button" onClick={() => irASemana(sumarDias(lunes, -7))}>
            ← Semana anterior
          </button>
          <button className="active" type="button" onClick={() => irASemana(fechaSantoDomingo(new Date()))}>
            Esta semana
          </button>
          <button type="button" onClick={() => irASemana(sumarDias(lunes, 7))}>
            Semana siguiente →
          </button>
        </div>
        <span>{citasHoy} citas hoy</span>
      </div>
      <div className="calendar">
        <div className="calendar-time" />
        {dias.map((dia) => (
          <header key={dia}>{etiquetaDia(dia)}</header>
        ))}
        {HORAS.map((hora) => (
          <div className="calendar-row" key={hora}>
            <time>{hora}:00</time>
            {dias.map((dia) => {
              const eventos = citas.filter(
                (c) => c.startsAt && fechaSantoDomingo(c.startsAt) === dia && Number(horaSantoDomingo(c.startsAt).split(":")[0]) === hora,
              );
              return (
                <div className="calendar-cell" key={dia}>
                  {eventos.map((cita) => (
                    <a className="calendar-event" key={cita.id} href={googleCalendarUrl(cita)} target="_blank" rel="noreferrer">
                      <strong>{cita.title}</strong>
                      <small>
                        {horaSantoDomingo(cita.startsAt!)} · {cita.assigneeName ?? "Sin asignar"}
                      </small>
                      <span>Abrir en Google Calendar</span>
                    </a>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {creando && <FormularioCita dias={dias} personas={personas} onClose={() => setCreando(false)} />}
    </>
  );
}

function FormularioCita({
  dias,
  personas,
  onClose,
}: {
  dias: string[];
  personas: PersonaOpcion[];
  onClose: () => void;
}) {
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
    const dia = String(form.get("day"));
    const hora = String(form.get("time"));
    const datos = {
      activityType: "meeting",
      title: form.get("title"),
      assigneeId: form.get("assigneeId") || undefined,
      startsAt: `${dia}T${hora}:00-04:00`,
      location: form.get("location") || undefined,
    };
    const respuesta = await fetch("/api/actividades", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json().catch(() => ({}));
    setEnviando(false);

    if (!respuesta.ok) {
      setErrores(cuerpo.fields ?? { _: cuerpo.error ?? "No se pudo agendar la cita." });
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <Modal title="Nueva cita" onClose={onClose}>
      <form className="form-grid" ref={formRef} onSubmit={enviar}>
        <label className="span-2">
          Asunto
          <input name="title" required autoFocus placeholder="Cliente y proyecto" />
          {errores.title && <small style={{ color: "#b42318" }}>{errores.title}</small>}
        </label>
        <label>
          Día
          <select name="day" defaultValue={dias[0]}>
            {dias.map((dia) => (
              <option key={dia} value={dia}>
                {etiquetaDia(dia)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Hora
          <input name="time" type="time" required defaultValue="09:00" />
          {errores.startsAt && <small style={{ color: "#b42318" }}>{errores.startsAt}</small>}
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
        <label className="span-2">
          Ubicación (opcional)
          <input name="location" placeholder="Oficina, videollamada…" />
        </label>
        {errores._ && <small style={{ color: "#b42318" }}>{errores._}</small>}
        <div className="form-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" type="submit" disabled={enviando}>
            {enviando ? "Agendando…" : "Agendar cita"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
