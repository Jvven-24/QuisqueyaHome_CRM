"use client";

import { useState, type FormEvent } from "react";
import {
  exportCalendar,
  googleCalendarUrl,
  initialAppointments,
  type Appointment,
} from "../_ui/datos-muestra";
import { Avatar, Modal, PageHeader } from "../_ui/prototipo-ui";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (`AgendaView`), incluida la exportación `.ics` y el enlace a Google
 * Calendar por evento. M4 · Agenda se construye en F2
 * (`docs/F1_ANALISIS_Y_PLAN.md`); sustituye `useState` por citas reales de
 * `activities`.
 */
export function AgendaVista() {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [modalOpen, setModalOpen] = useState(false);
  const days = ["Lun 20", "Mar 21", "Mié 22", "Jue 23", "Vie 24"];

  function addAppointment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setAppointments((current) => [
      ...current,
      {
        time: String(form.get("time")),
        title: String(form.get("title")),
        owner: String(form.get("owner")),
        day: Number(form.get("day")),
      },
    ]);
    setModalOpen(false);
  }

  return (
    <>
      <PageHeader
        eyebrow="C4 · Seguimiento"
        title="Citas y agenda"
        subtitle="La agenda central de Alexandra y el equipo comercial."
        action={
          <div className="header-actions-inline">
            <button className="button secondary" type="button" onClick={() => exportCalendar(appointments)}>
              Exportar .ics
            </button>
            <button className="button primary" type="button" onClick={() => setModalOpen(true)}>
              Nueva cita
            </button>
          </div>
        }
      />
      <div className="filter-bar">
        <div className="segmented">
          <button className="active" type="button">Semana</button>
          <button type="button">Día</button>
          <button type="button">Mes</button>
        </div>
        <div className="broker-filter">
          <Avatar name="Ismael Rosario" small />
          <Avatar name="Yostar Medina" small />
          <Avatar name="Alexandra Núñez" small />
        </div>
        <span>3 citas hoy</span>
      </div>
      <div className="calendar">
        <div className="calendar-time" />
        {days.map((day) => (
          <header key={day}>{day}</header>
        ))}
        {[9, 10, 11, 12, 13, 14, 15, 16].map((hour) => (
          <div className="calendar-row" key={hour}>
            <time>{hour}:00</time>
            {days.map((_, dayIndex) => {
              const event = appointments.find(
                (item) => item.day === dayIndex + 1 && Number(item.time.split(":")[0]) === hour,
              );
              return (
                <div className="calendar-cell" key={dayIndex}>
                  {event && (
                    <a className="calendar-event" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer">
                      <strong>{event.title}</strong>
                      <small>
                        {event.time} · {event.owner}
                      </small>
                      <span>Abrir en Google Calendar</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {modalOpen && (
        <Modal title="Nueva cita" onClose={() => setModalOpen(false)}>
          <form className="form-grid" onSubmit={addAppointment}>
            <label className="span-2">
              Asunto
              <input name="title" required autoFocus placeholder="Cliente y proyecto" />
            </label>
            <label>
              Día
              <select name="day">
                <option value="1">Lunes</option>
                <option value="2">Martes</option>
                <option value="3">Miércoles</option>
                <option value="4">Jueves</option>
                <option value="5">Viernes</option>
              </select>
            </label>
            <label>
              Hora
              <input name="time" type="time" required />
            </label>
            <label className="span-2">
              Responsable
              <select name="owner">
                <option>Alexandra</option>
                <option>Ismael</option>
                <option>Yostar</option>
              </select>
            </label>
            <div className="form-actions">
              <button className="button secondary" type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button className="button primary" type="submit">
                Agendar cita
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
