/**
 * ponytail: datos de muestra (mock), portados tal cual de
 * `referencia-prototipo/app/page.tsx`. Alimentan las 15 vistas mientras cada
 * módulo se conecta a datos reales — M1 Contactos, M2 Leads y M3 Negocios en
 * F1 (`docs/F1_ANALISIS_Y_PLAN.md`), el resto en fases posteriores. Cuando un
 * módulo entra en construcción, su `page.tsx` deja de pasarle este mock a la
 * vista y le pasa filas reales de `visibleRows`.
 *
 * Los IDs con `Date.now()` y las comparaciones de broker por nombre literal
 * ("Yostar Medina") son del prototipo tal cual — documentado en
 * `docs/contexto/errores-conocidos.md` §2. El backend real los sustituye por
 * IDs de base de datos y `broker_id`; esta vista no los corrige.
 */

export type Stage =
  | "Nuevo"
  | "Contactado"
  | "Presentación"
  | "Preselección"
  | "Negociación"
  | "Cierre"
  | "Perdido";

export type Lead = {
  id: number;
  name: string;
  project: string;
  source: string;
  broker: string;
  stage: Stage;
  budget: string;
  phone: string;
  next: string;
};

export const stageOrder: Stage[] = [
  "Nuevo",
  "Contactado",
  "Presentación",
  "Preselección",
  "Negociación",
  "Cierre",
];

export const initialLeads: Lead[] = [
  {
    id: 1,
    name: "Ana Peralta",
    project: "Bávaro Beach Lofts",
    source: "Portal web",
    broker: "Yostar Medina",
    stage: "Nuevo",
    budget: "US$145,000",
    phone: "809-555-0184",
    next: "Contactar hoy, 11:30 AM",
  },
  {
    id: 2,
    name: "María Fernández",
    project: "Praderas de Punta Cana",
    source: "YouTube",
    broker: "Ismael Rosario",
    stage: "Preselección",
    budget: "US$165,000",
    phone: "829-555-0139",
    next: "Enviar plan de pago",
  },
  {
    id: 3,
    name: "José Reyes",
    project: "Jardín del Orquídeo",
    source: "WhatsApp",
    broker: "Ismael Rosario",
    stage: "Contactado",
    budget: "US$210,000",
    phone: "849-555-0170",
    next: "Llamar hoy, 4:00 PM",
  },
  {
    id: 4,
    name: "Elisa Méndez",
    project: "Vista Cana Residences",
    source: "Referido",
    broker: "Yostar Medina",
    stage: "Presentación",
    budget: "US$185,000",
    phone: "809-555-0122",
    next: "Cita mañana, 10:00 AM",
  },
  {
    id: 5,
    name: "Carlos Peña",
    project: "Praderas de Punta Cana",
    source: "YouTube",
    broker: "Ismael Rosario",
    stage: "Negociación",
    budget: "US$195,000",
    phone: "829-555-0165",
    next: "Confirmar reserva",
  },
  {
    id: 6,
    name: "Laura Gómez",
    project: "Bávaro Beach Lofts",
    source: "Portal web",
    broker: "Yostar Medina",
    stage: "Cierre",
    budget: "US$132,000",
    phone: "849-555-0106",
    next: "Validar expediente",
  },
];

export const properties = [
  { name: "Praderas de Punta Cana", zone: "Punta Cana", type: "En planos", progress: 35, units: "12/40", price: "US$140,000", public: "US$150K - 180K", broker: "Ismael Rosario" },
  { name: "Jardín del Orquídeo", zone: "Bávaro", type: "Preventa", progress: 12, units: "18/32", price: "US$118,000", public: "US$125K - 155K", broker: "Ismael Rosario" },
  { name: "Vista Cana Residences", zone: "Vista Cana", type: "En construcción", progress: 58, units: "8/24", price: "US$175,000", public: "US$185K - 230K", broker: "Ismael Rosario" },
  { name: "Bávaro Beach Lofts", zone: "Bávaro", type: "Alquiler", progress: 100, units: "6/18", price: "US$125,000", public: "US$130K - 165K", broker: "Yostar Medina" },
];

export type Appointment = { time: string; title: string; owner: string; day: number };

export const initialAppointments: Appointment[] = [
  { time: "9:00", title: "Capacitación semanal de brokers", owner: "Equipo", day: 1 },
  { time: "10:00", title: "Elisa Méndez - Vista Cana", owner: "Yostar", day: 2 },
  { time: "11:30", title: "María Fernández - Praderas", owner: "Ismael", day: 3 },
  { time: "15:00", title: "Seguimiento José Reyes", owner: "Alexandra", day: 4 },
];

export function appointmentDates(appointment: Appointment) {
  const day = 19 + appointment.day;
  const [hour, minute] = appointment.time.split(":").map(Number);
  const start = new Date(
    `2026-07-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-04:00`,
  );
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

export function googleCalendarUrl(appointment: Appointment) {
  const { start, end } = appointmentDates(appointment);
  const format = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(".000", "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: appointment.title,
    dates: `${format(start)}/${format(end)}`,
    details: `Actividad de Quisqueya Home CRM. Responsable: ${appointment.owner}.`,
    ctz: "America/Santo_Domingo",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** ponytail: exporta el `.ics` en el navegador (`Blob` + descarga). Portado tal cual del prototipo. */
export function exportCalendar(appointments: Appointment[]) {
  const format = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(".000", "");
  const events = appointments.map((appointment) => {
    const { start, end } = appointmentDates(appointment);
    return [
      "BEGIN:VEVENT",
      `UID:${appointment.day}-${appointment.time.replace(":", "")}@quisqueyahome.com`,
      `DTSTAMP:${format(new Date())}`,
      `DTSTART:${format(start)}`,
      `DTEND:${format(end)}`,
      `SUMMARY:${appointment.title.replace(/[,;]/g, " ")}`,
      `DESCRIPTION:Responsable: ${appointment.owner}`,
      "END:VEVENT",
    ].join("\r\n");
  });
  const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Quisqueya Home//CRM//ES", ...events, "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([content], { type: "text/calendar;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "agenda-quisqueya-home.ics";
  link.click();
  URL.revokeObjectURL(url);
}
