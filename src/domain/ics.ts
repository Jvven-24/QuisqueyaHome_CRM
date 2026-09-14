/**
 * Generación de `.ics` (M4 · Agenda, decisión #25). Un `VEVENT` son ~15
 * líneas de texto con formato fijo — `ics`/`ical-generator` como dependencia
 * para exportar una agenda semanal no se justifica.
 *
 * `UID = activity-{id}@quisqueyahome.com`: la clave primaria de `activities`
 * **es** el identificador estable que R11 pide para no duplicar eventos al
 * resincronizar — el `{day}-{time}@…` del prototipo no tenía esa garantía.
 */

export type EventoIcs = {
  id: number;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
};

/** RFC 5545 §3.3.11: escapa `\`, `,`, `;` y convierte saltos de línea. */
function escaparTexto(texto: string): string {
  return texto.replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

/** `YYYYMMDDTHHMMSSZ` — mismo formato que usa la URL de "Agendar en Google Calendar" (`agenda/vista.tsx`). */
export function formatoFechaIcs(fecha: Date): string {
  return fecha.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function generarIcs(eventos: EventoIcs[]): string {
  const lineas = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Quisqueya Home CRM//ES", "CALSCALE:GREGORIAN"];

  for (const evento of eventos) {
    const fin = evento.endsAt ?? new Date(evento.startsAt.getTime() + 60 * 60 * 1000); // sin hora de fin: se asume una hora
    lineas.push(
      "BEGIN:VEVENT",
      `UID:activity-${evento.id}@quisqueyahome.com`,
      `DTSTAMP:${formatoFechaIcs(new Date())}`,
      `DTSTART:${formatoFechaIcs(evento.startsAt)}`,
      `DTEND:${formatoFechaIcs(fin)}`,
      `SUMMARY:${escaparTexto(evento.title)}`,
    );
    if (evento.location) lineas.push(`LOCATION:${escaparTexto(evento.location)}`);
    lineas.push("END:VEVENT");
  }

  lineas.push("END:VCALENDAR");
  return lineas.join("\r\n") + "\r\n";
}
