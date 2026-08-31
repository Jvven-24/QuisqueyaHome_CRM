"use client";

import { FormEvent, useEffect, useState } from "react";

type Role = "admin" | "assistant" | "broker";
type ModuleId =
  | "inicio"
  | "leads"
  | "contactos"
  | "pipeline"
  | "agenda"
  | "propiedades"
  | "brokers"
  | "academy"
  | "metas"
  | "comisiones"
  | "tareas"
  | "comunicaciones"
  | "reportes"
  | "avances"
  | "configuracion";
type Stage =
  | "Nuevo"
  | "Contactado"
  | "Presentación"
  | "Preselección"
  | "Negociación"
  | "Cierre"
  | "Perdido";

type Lead = {
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

type Appointment = {
  time: string;
  title: string;
  owner: string;
  day: number;
};

function appointmentDates(appointment: Appointment) {
  const day = 19 + appointment.day;
  const [hour, minute] = appointment.time.split(":").map(Number);
  const start = new Date(`2026-07-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00-04:00`);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { start, end };
}

function googleCalendarUrl(appointment: Appointment) {
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

function exportCalendar(appointments: Appointment[]) {
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

const modules: Array<{
  id: ModuleId;
  label: string;
  brokerLabel?: string;
  roles: Role[];
}> = [
  { id: "inicio", label: "Inicio", brokerLabel: "Mi panel", roles: ["admin", "assistant", "broker"] },
  { id: "leads", label: "Leads", brokerLabel: "Mis leads", roles: ["admin", "assistant", "broker"] },
  { id: "contactos", label: "Contactos", roles: ["admin", "assistant"] },
  { id: "pipeline", label: "Pipeline", brokerLabel: "Mi pipeline", roles: ["admin", "broker"] },
  { id: "agenda", label: "Citas y agenda", brokerLabel: "Mi agenda", roles: ["admin", "assistant", "broker"] },
  { id: "propiedades", label: "Propiedades internas", brokerLabel: "Mis propiedades", roles: ["admin", "broker"] },
  { id: "brokers", label: "Brokers", roles: ["admin"] },
  { id: "academy", label: "Academy", roles: ["admin", "broker"] },
  { id: "metas", label: "Metas y desempeño", brokerLabel: "Mis metas", roles: ["admin", "broker"] },
  { id: "comisiones", label: "Comisiones", roles: ["admin"] },
  { id: "tareas", label: "Tareas y actividades", roles: ["admin", "assistant"] },
  { id: "comunicaciones", label: "Comunicaciones", roles: ["admin", "assistant"] },
  { id: "reportes", label: "Reportes y BI", roles: ["admin"] },
  { id: "avances", label: "Avances de obra", roles: ["admin", "assistant"] },
  { id: "configuracion", label: "Configuración y permisos", roles: ["admin"] },
];

const stageOrder: Stage[] = [
  "Nuevo",
  "Contactado",
  "Presentación",
  "Preselección",
  "Negociación",
  "Cierre",
];

const initialLeads: Lead[] = [
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

const properties = [
  { name: "Praderas de Punta Cana", zone: "Punta Cana", type: "En planos", progress: 35, units: "12/40", price: "US$140,000", public: "US$150K - 180K", broker: "Ismael Rosario" },
  { name: "Jardín del Orquídeo", zone: "Bávaro", type: "Preventa", progress: 12, units: "18/32", price: "US$118,000", public: "US$125K - 155K", broker: "Ismael Rosario" },
  { name: "Vista Cana Residences", zone: "Vista Cana", type: "En construcción", progress: 58, units: "8/24", price: "US$175,000", public: "US$185K - 230K", broker: "Ismael Rosario" },
  { name: "Bávaro Beach Lofts", zone: "Bávaro", type: "Alquiler", progress: 100, units: "6/18", price: "US$125,000", public: "US$130K - 165K", broker: "Yostar Medina" },
];

const roleCopy: Record<Role, { name: string; title: string; initials: string }> = {
  admin: { name: "Ismael Rosario", title: "Administrador", initials: "IR" },
  assistant: { name: "Alexandra Núñez", title: "Asistente", initials: "AN" },
  broker: { name: "Yostar Medina", title: "Broker", initials: "YM" },
};

function Brand() {
  return (
    <div className="brand-lockup" aria-label="Quisqueya Home">
      <span className="brand-mark">QH</span>
      <span>
        <strong>Quisqueya</strong>
        <small>Home CRM</small>
      </span>
    </div>
  );
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span className={small ? "avatar avatar-small" : "avatar"} aria-hidden="true">
      {name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
    </span>
  );
}

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "gold" | "green" | "red" | "blue" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<Role>("admin");
  const [active, setActive] = useState<ModuleId>("inicio");
  const [leads, setLeads] = useState(initialLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"lead" | "appointment" | "lost" | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState("");
  const [tasks, setTasks] = useState([
    { id: 1, label: "Llamar a José Reyes", due: "Hoy, 4:00 PM", done: false },
    { id: 2, label: "Enviar plan de pago a María", due: "Hoy, 5:30 PM", done: false },
    { id: 3, label: "Validar expediente de Laura", due: "Mañana, 9:00 AM", done: true },
  ]);
  const [appointments, setAppointments] = useState([
    { time: "9:00", title: "Capacitación semanal de brokers", owner: "Equipo", day: 1 },
    { time: "10:00", title: "Elisa Méndez - Vista Cana", owner: "Yostar", day: 2 },
    { time: "11:30", title: "María Fernández - Praderas", owner: "Ismael", day: 3 },
    { time: "15:00", title: "Seguimiento José Reyes", owner: "Alexandra", day: 4 },
  ]);
  const [academyDone, setAcademyDone] = useState([true, true, false, false]);
  const [phaseProgress, setPhaseProgress] = useState(60);
  const [settingsTab, setSettingsTab] = useState("Usuarios y roles");

  const allowedModules = modules.filter((item) => item.roles.includes(role));
  const visibleLeads = leads.filter((lead) => {
    const roleMatch = role !== "broker" || lead.broker === "Yostar Medina";
    const query = search.toLowerCase();
    return roleMatch && (!query || `${lead.name} ${lead.project} ${lead.source}`.toLowerCase().includes(query));
  });

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function navigate(id: ModuleId) {
    setActive(id);
    setSelectedLead(null);
    setMobileNav(false);
  }

  function changeRole(nextRole: Role) {
    setRole(nextRole);
    setActive("inicio");
    setSelectedLead(null);
  }

  function moveLead(id: number, stage: Stage) {
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, stage } : lead)));
    setSelectedLead((current) => (current?.id === id ? { ...current, stage } : current));
    setToast(stage === "Cierre" ? "Cierre registrado. Metas y comisiones actualizadas." : `Negocio movido a ${stage}.`);
  }

  function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lead: Lead = {
      id: Date.now(),
      name: String(form.get("name")),
      phone: String(form.get("phone")),
      project: String(form.get("project")),
      source: String(form.get("source")),
      broker: String(form.get("broker")),
      stage: "Nuevo",
      budget: String(form.get("budget") || "Por definir"),
      next: "Contactar hoy",
    };
    setLeads((current) => [lead, ...current]);
    setModal(null);
    setToast("Lead registrado y listo para seguimiento.");
  }

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
    setModal(null);
    setToast("Cita agregada a la agenda.");
  }

  if (!loggedIn) {
    return (
      <main className="login-page">
        <section className="login-brand">
          <Brand />
          <div>
            <p className="eyebrow">Operación inmobiliaria privada</p>
            <h1>Tu equipo, cada oportunidad y el avance de obra en un solo lugar.</h1>
            <p>Un entorno de trabajo para dar seguimiento desde YouTube y WhatsApp hasta el cierre.</p>
          </div>
          <small>Acceso exclusivo para el equipo de Quisqueya Home</small>
        </section>
        <section className="login-panel">
          <form
            className="login-form"
            onSubmit={(event) => {
              event.preventDefault();
              setLoggedIn(true);
            }}
          >
            <p className="eyebrow">Bienvenido</p>
            <h2>Iniciar sesión</h2>
            <label>
              Correo electrónico
              <input defaultValue="ismael@quisqueyahome.com" type="email" required />
            </label>
            <label>
              Contraseña
              <input defaultValue="demo2026" type="password" required minLength={6} />
            </label>
            <label>
              Perfil para la demostración
              <select value={role} onChange={(event) => changeRole(event.target.value as Role)}>
                <option value="admin">Administrador - Ismael</option>
                <option value="assistant">Asistente - Alexandra</option>
                <option value="broker">Broker - Yostar</option>
              </select>
            </label>
            <button className="button primary wide" type="submit">Entrar al CRM</button>
            <button className="text-button" type="button">¿Olvidaste tu contraseña?</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className={mobileNav ? "app-sidebar open" : "app-sidebar"}>
        <div className="sidebar-head">
          <Brand />
          <button className="icon-button mobile-only" onClick={() => setMobileNav(false)} aria-label="Cerrar navegación">×</button>
        </div>
        <nav aria-label="Módulos del CRM">
          {allowedModules.map((item) => (
            <button
              className={active === item.id ? "nav-link active" : "nav-link"}
              key={item.id}
              onClick={() => navigate(item.id)}
              type="button"
            >
              <span>{item.id === "inicio" ? "00" : String(modules.findIndex((module) => module.id === item.id)).padStart(2, "0")}</span>
              {role === "broker" && item.brokerLabel ? item.brokerLabel : item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-profile">
          <Avatar name={roleCopy[role].name} />
          <span>
            <strong>{roleCopy[role].name}</strong>
            <small>{roleCopy[role].title}</small>
          </span>
          <button className="icon-button" onClick={() => setLoggedIn(false)} aria-label="Cerrar sesión">↗</button>
        </div>
      </aside>

      <section className="workspace">
        <header className="app-header">
          <button className="icon-button mobile-only" onClick={() => setMobileNav(true)} aria-label="Abrir navegación">☰</button>
          <label className="global-search">
            <span className="sr-only">Buscar</span>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar contacto, proyecto o teléfono" />
            <kbd>Ctrl K</kbd>
          </label>
          <div className="header-actions">
            <label className="role-switch">
              <span>Vista</span>
              <select value={role} onChange={(event) => changeRole(event.target.value as Role)}>
                <option value="admin">Administrador</option>
                <option value="assistant">Asistente</option>
                <option value="broker">Broker</option>
              </select>
            </label>
            <button className="notification-button" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Notificaciones">
              <span aria-hidden="true">3</span>
              Actividad
            </button>
          </div>
        </header>

        <section className="page">
          {active === "inicio" && (
            <Dashboard role={role} leads={visibleLeads} onOpenLead={(lead) => { setSelectedLead(lead); setActive("leads"); }} />
          )}
          {active === "leads" && (
            <LeadsView
              leads={visibleLeads}
              role={role}
              selected={selectedLead}
              onSelect={setSelectedLead}
              onAdd={() => setModal("lead")}
              onMove={moveLead}
              onClose={() => setSelectedLead(null)}
            />
          )}
          {active === "contactos" && <ContactsView leads={visibleLeads} selected={selectedLead} onSelect={setSelectedLead} onClose={() => setSelectedLead(null)} />}
          {active === "pipeline" && <PipelineView leads={visibleLeads} selected={selectedLead} onSelect={setSelectedLead} onMove={moveLead} onClose={() => setSelectedLead(null)} />}
          {active === "agenda" && <AgendaView appointments={appointments} onAdd={() => setModal("appointment")} />}
          {active === "propiedades" && <PropertiesView role={role} onOpenProgress={() => setActive("avances")} />}
          {active === "brokers" && <BrokersView />}
          {active === "academy" && <AcademyView done={academyDone} onToggle={(index) => setAcademyDone((current) => current.map((value, itemIndex) => itemIndex === index ? !value : value))} />}
          {active === "metas" && <GoalsView role={role} />}
          {active === "comisiones" && <CommissionsView />}
          {active === "tareas" && <TasksView tasks={tasks} onToggle={(id) => setTasks((current) => current.map((task) => task.id === id ? { ...task, done: !task.done } : task))} />}
          {active === "comunicaciones" && <CommunicationsView onSend={() => setToast("Mensaje abierto en WhatsApp con la plantilla aplicada.")} />}
          {active === "reportes" && <ReportsView />}
          {active === "avances" && <ProgressView progress={phaseProgress} onChange={setPhaseProgress} onPublish={() => setToast("Avance publicado en el portal público.")} />}
          {active === "configuracion" && <SettingsView tab={settingsTab} onTab={setSettingsTab} onSave={() => setToast("Cambios de configuración guardados.")} />}
        </section>
      </section>

      {notificationsOpen && (
        <aside className="notification-drawer" aria-label="Actividad reciente">
          <div className="drawer-head">
            <div><p className="eyebrow">Actividad</p><h2>Notificaciones</h2></div>
            <button className="icon-button" onClick={() => setNotificationsOpen(false)} aria-label="Cerrar">×</button>
          </div>
          {[
            ["Nuevo lead desde el portal", "Ana Peralta - Alquiler en Bávaro", "Ahora"],
            ["Cita próxima", "María Fernández en 30 minutos", "10:30 AM"],
            ["Avance de obra actualizado", "Alexandra cargó contenido de Fase 3", "Ayer"],
            ["Negocio movido a cierre", "Laura Gómez - Bávaro Beach Lofts", "Ayer"],
          ].map(([title, text, time], index) => (
            <button className="notification-item" key={title} onClick={() => setNotificationsOpen(false)}>
              <span className={index < 3 ? "unread" : ""} />
              <span><strong>{title}</strong><small>{text}</small></span>
              <time>{time}</time>
            </button>
          ))}
          <button className="button secondary wide" onClick={() => setToast("Todas las notificaciones fueron marcadas como leídas.")}>Marcar todas como leídas</button>
        </aside>
      )}

      {modal === "lead" && (
        <Modal title="Registrar lead manual" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={addLead}>
            <label>Nombre completo<input name="name" required autoFocus /></label>
            <label>Teléfono<input name="phone" type="tel" required /></label>
            <label>Proyecto de interés<select name="project">{properties.map((property) => <option key={property.name}>{property.name}</option>)}</select></label>
            <label>Origen<select name="source"><option>YouTube</option><option>WhatsApp</option><option>Portal web</option><option>Referido</option></select></label>
            <label>Presupuesto<input name="budget" placeholder="US$150,000" /></label>
            <label>Broker responsable<select name="broker"><option>Ismael Rosario</option><option>Yostar Medina</option><option>Sin asignar</option></select></label>
            <div className="form-actions"><button className="button secondary" type="button" onClick={() => setModal(null)}>Cancelar</button><button className="button primary" type="submit">Registrar lead</button></div>
          </form>
        </Modal>
      )}

      {modal === "appointment" && (
        <Modal title="Nueva cita" onClose={() => setModal(null)}>
          <form className="form-grid" onSubmit={addAppointment}>
            <label className="span-2">Asunto<input name="title" required autoFocus placeholder="Cliente y proyecto" /></label>
            <label>Día<select name="day"><option value="1">Lunes</option><option value="2">Martes</option><option value="3">Miércoles</option><option value="4">Jueves</option><option value="5">Viernes</option></select></label>
            <label>Hora<input name="time" type="time" required /></label>
            <label className="span-2">Responsable<select name="owner"><option>Alexandra</option><option>Ismael</option><option>Yostar</option></select></label>
            <div className="form-actions"><button className="button secondary" type="button" onClick={() => setModal(null)}>Cancelar</button><button className="button primary" type="submit">Agendar cita</button></div>
          </form>
        </Modal>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

function PageHeader({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {action}
    </header>
  );
}

function Dashboard({ role, leads, onOpenLead }: { role: Role; leads: Lead[]; onOpenLead: (lead: Lead) => void }) {
  const isBroker = role === "broker";
  const isAssistant = role === "assistant";
  return (
    <>
      <PageHeader
        eyebrow={isBroker ? "Mi operación" : "Resumen operativo"}
        title={isBroker ? "Hola, Yostar" : isAssistant ? "Hola, Alexandra" : "Buenos días, Ismael"}
        subtitle={isBroker ? "Tu cartera y próximas acciones de hoy." : "Prioridades, actividad comercial y decisiones pendientes."}
        action={<div className="date-chip">24 julio 2026</div>}
      />
      <section className="metrics-row">
        {isBroker ? (
          <>
            <Metric label="Mis leads" value="5" note="2 requieren seguimiento" />
            <Metric label="Citas esta semana" value="3" note="Próxima a las 10:00 AM" />
            <Metric label="Meta del mes" value="2 / 4" note="50% de cumplimiento" />
            <Metric label="Mi nivel" value="Junior" note="US$415K para Senior" />
          </>
        ) : isAssistant ? (
          <>
            <Metric label="Leads sin asignar" value="2" note="1 de alquiler sugerido a Yostar" />
            <Metric label="Citas de hoy" value="3" note="Primera a las 10:00 AM" />
            <Metric label="Tareas pendientes" value="4" note="1 vencida" />
            <Metric label="Avances por revisar" value="1" note="Praderas, Fase 3" />
          </>
        ) : (
          <>
            <Metric label="Leads del mes" value="48" note="+12% frente a junio" />
            <Metric label="Negocios activos" value="21" note="US$2.8M en pipeline" />
            <Metric label="Cierres del mes" value="7" note="Meta del equipo: 10" />
            <Metric label="Conversión" value="14.6%" note="+2.1 puntos este mes" />
          </>
        )}
      </section>
      <section className="dashboard-grid">
        <div className="panel span-2">
          <div className="panel-title"><div><p className="eyebrow">Acción inmediata</p><h2>{isBroker ? "Mis leads recientes" : "Leads que requieren atención"}</h2></div><span>{leads.length} visibles</span></div>
          <div className="compact-list">
            {leads.slice(0, 4).map((lead) => (
              <button key={lead.id} className="lead-row" onClick={() => onOpenLead(lead)}>
                <Avatar name={lead.name} small />
                <span><strong>{lead.name}</strong><small>{lead.project} · {lead.source}</small></span>
                <Badge tone={lead.stage === "Nuevo" ? "gold" : "blue"}>{lead.stage}</Badge>
                <span className="row-next">{lead.next}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title"><div><p className="eyebrow">{isBroker ? "Mi avance" : "Embudo"}</p><h2>{isBroker ? "Meta mensual" : "Conversión por etapa"}</h2></div></div>
          {isBroker ? (
            <div className="goal-ring-wrap">
              <div className="goal-ring" style={{ "--progress": "50%" } as React.CSSProperties}><strong>50%</strong></div>
              <p>2 de 4 negocios cerrados</p>
              <div className="progress-line"><span style={{ width: "17%" }} /></div>
              <small>US$85,000 de US$500,000 para nivel Senior</small>
            </div>
          ) : (
            <div className="funnel">
              {[["Nuevo", 48, 100], ["Contactado", 38, 79], ["Presentación", 24, 50], ["Preselección", 14, 29], ["Negociación", 10, 21], ["Cierre", 7, 15]].map(([label, value, width]) => (
                <div key={String(label)}><span>{label}</span><div><i style={{ width: `${width}%` }} /></div><strong>{value}</strong></div>
              ))}
            </div>
          )}
        </div>
        <div className="panel">
          <div className="panel-title"><div><p className="eyebrow">Agenda</p><h2>Próximas actividades</h2></div></div>
          <div className="timeline-list">
            <div><time>10:00</time><span><strong>Presentación con Elisa</strong><small>Vista Cana · Yostar</small></span></div>
            <div><time>11:30</time><span><strong>Cita con María</strong><small>Praderas · Ismael</small></span></div>
            <div><time>15:00</time><span><strong>Seguimiento a José</strong><small>Llamada · Alexandra</small></span></div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title"><div><p className="eyebrow">{isBroker ? "Academy" : "Demanda"}</p><h2>{isBroker ? "Continúa tu capacitación" : "Proyectos más consultados"}</h2></div></div>
          {isBroker ? (
            <div className="course-mini"><div className="course-art">QH Academy</div><strong>Cómo dar de alta un alquiler</strong><div className="progress-line"><span style={{ width: "70%" }} /></div><small>70% completado</small></div>
          ) : (
            <div className="ranking">
              {properties.slice(0, 3).map((property, index) => <div key={property.name}><span>{index + 1}</span><strong>{property.name}</strong><small>{[18, 14, 9][index]} leads</small></div>)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function LeadsView({ leads, role, selected, onSelect, onAdd, onMove, onClose }: { leads: Lead[]; role: Role; selected: Lead | null; onSelect: (lead: Lead) => void; onAdd: () => void; onMove: (id: number, stage: Stage) => void; onClose: () => void }) {
  return (
    <>
      <PageHeader eyebrow="C1 · Captación" title={role === "broker" ? "Mis leads" : "Bandeja de leads"} subtitle="Origen, asignación y próxima acción de cada prospecto." action={role !== "broker" ? <button className="button primary" onClick={onAdd}>Registrar lead</button> : undefined} />
      <div className="filter-bar">
        <select aria-label="Filtrar por origen"><option>Todos los orígenes</option><option>YouTube</option><option>Portal web</option><option>WhatsApp</option></select>
        <select aria-label="Filtrar por estado"><option>Todos los estados</option>{stageOrder.map((stage) => <option key={stage}>{stage}</option>)}</select>
        {role !== "broker" && <select aria-label="Filtrar por broker"><option>Todos los brokers</option><option>Ismael Rosario</option><option>Yostar Medina</option><option>Sin asignar</option></select>}
        <span>{leads.length} leads</span>
      </div>
      <div className={selected ? "split-view inspector-open" : "split-view"}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Lead</th><th>Proyecto</th><th>Origen</th><th>Responsable</th><th>Estado</th><th>Próxima acción</th></tr></thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className={selected?.id === lead.id ? "selected" : ""} onClick={() => onSelect(lead)}>
                  <td><span className="table-person"><Avatar name={lead.name} small /><span><strong>{lead.name}</strong><small>{lead.phone}</small></span></span></td>
                  <td>{lead.project}</td><td>{lead.source}</td><td>{lead.broker}</td>
                  <td><Badge tone={lead.stage === "Nuevo" ? "gold" : lead.stage === "Cierre" ? "green" : "blue"}>{lead.stage}</Badge></td>
                  <td>{lead.next}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!leads.length && <Empty title="No hay leads con estos filtros" text="Prueba otra búsqueda o registra un lead manualmente." />}
        </div>
        {selected && <LeadInspector lead={selected} onMove={onMove} onClose={onClose} />}
      </div>
    </>
  );
}

function LeadInspector({ lead, onMove, onClose }: { lead: Lead; onMove: (id: number, stage: Stage) => void; onClose: () => void }) {
  return (
    <aside className="inspector">
      <div className="drawer-head"><div><p className="eyebrow">Ficha de lead</p><h2>{lead.name}</h2></div><button className="icon-button" onClick={onClose} aria-label="Cerrar detalle">×</button></div>
      <div className="contact-hero"><Avatar name={lead.name} /><div><strong>{lead.phone}</strong><small>{lead.source} · {lead.project}</small></div></div>
      <dl className="detail-grid">
        <div><dt>Presupuesto</dt><dd>{lead.budget}</dd></div><div><dt>Responsable</dt><dd>{lead.broker}</dd></div><div><dt>Etapa</dt><dd>{lead.stage}</dd></div><div><dt>Próxima acción</dt><dd>{lead.next}</dd></div>
      </dl>
      <label>Estado del negocio<select value={lead.stage} onChange={(event) => onMove(lead.id, event.target.value as Stage)}>{stageOrder.map((stage) => <option key={stage}>{stage}</option>)}<option>Perdido</option></select></label>
      <label>Nota de seguimiento<textarea defaultValue="Interesada en una unidad de dos habitaciones. Consulta opciones de separación y financiamiento." /></label>
      <div className="inspector-actions"><button className="button primary" onClick={() => onMove(lead.id, lead.stage === "Nuevo" ? "Contactado" : lead.stage)}>Registrar contacto</button><a className="button whatsapp" href={`https://wa.me/1${lead.phone.replace(/\D/g, "")}`} target="_blank">Abrir WhatsApp</a></div>
      <div className="activity-log"><h3>Historial</h3><div><span>Hoy, 10:32</span><p>Lead capturado desde {lead.source}.</p></div><div><span>Hoy, 10:34</span><p>Asignado a {lead.broker} por especialidad.</p></div></div>
    </aside>
  );
}

function ContactsView({ leads, selected, onSelect, onClose }: { leads: Lead[]; selected: Lead | null; onSelect: (lead: Lead) => void; onClose: () => void }) {
  return (
    <>
      <PageHeader eyebrow="C2 · Relación" title="Contactos" subtitle="Historial consolidado de clientes y proyectos de interés." action={<button className="button primary">Nuevo contacto</button>} />
      <div className="filter-bar"><select><option>Todos los canales</option><option>YouTube</option><option>WhatsApp</option><option>Portal web</option></select><select><option>Con negocio activo</option><option>Sin negocio</option></select><span>312 contactos</span></div>
      <div className={selected ? "split-view inspector-open" : "split-view"}>
        <div className="table-wrap">
          <table><thead><tr><th>Contacto</th><th>Canal</th><th>Proyecto de interés</th><th>Broker</th><th>Última interacción</th></tr></thead>
            <tbody>{leads.map((lead) => <tr key={lead.id} onClick={() => onSelect(lead)}><td><span className="table-person"><Avatar name={lead.name} small /><span><strong>{lead.name}</strong><small>{lead.phone}</small></span></span></td><td>{lead.source}</td><td>{lead.project}</td><td>{lead.broker}</td><td>Hoy</td></tr>)}</tbody>
          </table>
        </div>
        {selected && <LeadInspector lead={selected} onMove={() => undefined} onClose={onClose} />}
      </div>
    </>
  );
}

function PipelineView({ leads, selected, onSelect, onMove, onClose }: { leads: Lead[]; selected: Lead | null; onSelect: (lead: Lead) => void; onMove: (id: number, stage: Stage) => void; onClose: () => void }) {
  return (
    <>
      <PageHeader eyebrow="C3 · Ventas" title="Pipeline" subtitle="Mueve cada oportunidad y mantén visible la siguiente acción." action={<div className="pipeline-total"><span>Valor activo</span><strong>US$2.8M</strong></div>} />
      <div className="filter-bar"><select><option>Todos los brokers</option><option>Ismael Rosario</option><option>Yostar Medina</option></select><select><option>Todos los proyectos</option>{properties.map((property) => <option key={property.name}>{property.name}</option>)}</select><span>Arrastra para cambiar de etapa</span></div>
      <div className={selected ? "pipeline-layout inspector-open" : "pipeline-layout"}>
        <div className="kanban">
          {stageOrder.map((stage) => {
            const stageLeads = leads.filter((lead) => lead.stage === stage);
            return (
              <section className="kanban-column" key={stage} onDragOver={(event) => event.preventDefault()} onDrop={(event) => onMove(Number(event.dataTransfer.getData("leadId")), stage)}>
                <header><span>{stage}</span><strong>{stageLeads.length}</strong></header>
                <div>
                  {stageLeads.map((lead) => (
                    <button className="deal-card" draggable key={lead.id} onDragStart={(event) => event.dataTransfer.setData("leadId", String(lead.id))} onClick={() => onSelect(lead)}>
                      <span className="deal-source">{lead.source}</span><strong>{lead.name}</strong><small>{lead.project}</small><b>{lead.budget}</b><span>{lead.next}</span><footer><Avatar name={lead.broker} small /><small>{lead.broker.split(" ")[0]}</small></footer>
                    </button>
                  ))}
                  {!stageLeads.length && <div className="kanban-empty">Suelta aquí</div>}
                </div>
              </section>
            );
          })}
        </div>
        {selected && <LeadInspector lead={selected} onMove={onMove} onClose={onClose} />}
      </div>
    </>
  );
}

function AgendaView({ appointments, onAdd }: { appointments: Appointment[]; onAdd: () => void }) {
  const days = ["Lun 20", "Mar 21", "Mié 22", "Jue 23", "Vie 24"];
  return (
    <>
      <PageHeader eyebrow="C4 · Seguimiento" title="Citas y agenda" subtitle="La agenda central de Alexandra y el equipo comercial." action={<div className="header-actions-inline"><button className="button secondary" onClick={() => exportCalendar(appointments)}>Exportar .ics</button><button className="button primary" onClick={onAdd}>Nueva cita</button></div>} />
      <div className="filter-bar"><div className="segmented"><button className="active">Semana</button><button>Día</button><button>Mes</button></div><div className="broker-filter"><Avatar name="Ismael Rosario" small /><Avatar name="Yostar Medina" small /><Avatar name="Alexandra Núñez" small /></div><span>3 citas hoy</span></div>
      <div className="calendar">
        <div className="calendar-time" />
        {days.map((day) => <header key={day}>{day}</header>)}
        {[9, 10, 11, 12, 13, 14, 15, 16].map((hour) => (
          <div className="calendar-row" key={hour}>
            <time>{hour}:00</time>
            {days.map((_, dayIndex) => {
              const event = appointments.find((item) => item.day === dayIndex + 1 && Number(item.time.split(":")[0]) === hour);
              return <div className="calendar-cell" key={dayIndex}>{event && <a className="calendar-event" href={googleCalendarUrl(event)} target="_blank" rel="noreferrer"><strong>{event.title}</strong><small>{event.time} · {event.owner}</small><span>Abrir en Google Calendar</span></a>}</div>;
            })}
          </div>
        ))}
      </div>
    </>
  );
}

function PropertiesView({ role, onOpenProgress }: { role: Role; onOpenProgress: () => void }) {
  const [selected, setSelected] = useState<(typeof properties)[number] | null>(null);
  const visible = role === "broker" ? properties.filter((property) => property.broker === "Yostar Medina") : properties;
  if (selected) {
    return (
      <>
        <button className="back-button" onClick={() => setSelected(null)}>← Volver a propiedades</button>
        <PageHeader eyebrow="Inventario privado" title={selected.name} subtitle={`${selected.zone} · ${selected.type} · Entrega estimada diciembre 2027`} action={<button className="button primary" onClick={onOpenProgress}>Actualizar avance</button>} />
        <div className="project-summary"><div className="property-visual large"><span>QH</span><strong>{selected.progress}%</strong></div><dl className="detail-grid"><div><dt>Desarrollador</dt><dd>Grupo Punta Cana Norte</dd></div><div><dt>Unidades disponibles</dt><dd>{selected.units}</dd></div><div><dt>Precio interno</dt><dd>{role === "admin" ? selected.price : "Restringido"}</dd></div><div><dt>Rango público</dt><dd>{selected.public}</dd></div></dl></div>
        <div className="table-wrap"><table><thead><tr><th>Unidad</th><th>Tipología</th><th>Hab.</th><th>Baños</th><th>Construcción</th>{role === "admin" && <th>Precio real</th>}<th>Rango público</th><th>Estado</th></tr></thead><tbody>
          {[["B4", "Apartamento", "2", "2", "85 m²", "US$165,000", "US$170K - 185K", "Disponible"], ["C2", "Penthouse", "3", "2.5", "110 m²", "US$210,000", "US$220K - 240K", "Reservada"], ["A1", "Apartamento", "1", "1", "60 m²", "US$118,000", "US$125K - 140K", "Vendida"]].map((row) => <tr key={row[0]}>{row.slice(0, 5).map((cell) => <td key={cell}>{cell}</td>)}{role === "admin" && <td>{row[5]}</td>}<td>{row[6]}</td><td><Badge tone={row[7] === "Disponible" ? "green" : row[7] === "Reservada" ? "gold" : "neutral"}>{row[7]}</Badge></td></tr>)}
        </tbody></table></div>
      </>
    );
  }
  return (
    <>
      <PageHeader eyebrow="C5 · Inventario privado" title={role === "broker" ? "Mis propiedades" : "Propiedades internas"} subtitle="Inventario, disponibilidad y rangos comerciales del equipo." action={role === "admin" ? <button className="button primary">Nuevo proyecto</button> : undefined} />
      <div className="privacy-banner"><strong>Inventario interno</strong><span>Visible únicamente según los permisos de cada perfil.</span></div>
      <div className="filter-bar"><select><option>Todas las zonas</option><option>Punta Cana</option><option>Bávaro</option></select><select><option>Todos los tipos</option><option>En planos</option><option>Alquiler</option></select><select><option>Todos los estados</option><option>Preventa</option><option>En construcción</option></select></div>
      <div className="property-grid">
        {visible.map((property, index) => (
          <button className="property-card" key={property.name} onClick={() => setSelected(property)}>
            <div className={`property-visual visual-${index}`}><span>QH</span><div><small>Avance de obra</small><strong>{property.progress}%</strong></div></div>
            <div className="property-body"><div><Badge tone="blue">{property.type}</Badge><small>{property.zone}</small></div><h2>{property.name}</h2><dl><div><dt>Disponibles</dt><dd>{property.units}</dd></div><div><dt>{role === "admin" ? "Precio real" : "Rango asignado"}</dt><dd>{role === "admin" ? property.price : property.public}</dd></div></dl><footer><Avatar name={property.broker} small /><span>{property.broker}</span><b>Ver detalle →</b></footer></div>
          </button>
        ))}
      </div>
    </>
  );
}

function BrokersView() {
  const brokers = [
    ["Ismael Rosario", "Administrador", "Proyectos en planos", "Top Producer", "US$1,240,000", "15", 82],
    ["Yostar Medina", "Broker", "Alquileres", "Junior", "US$85,000", "5", 50],
    ["Luis García", "Broker en formación", "General", "Junior", "US$0", "2", 20],
  ];
  return (
    <>
      <PageHeader eyebrow="C6 · Equipo" title="Brokers" subtitle="Asignación, especialidad y desarrollo del equipo comercial." action={<button className="button primary">Invitar broker</button>} />
      <div className="level-scale"><span>Junior</span><i /><span>Senior</span><i /><span>Senior+</span><i /><span>Top Producer</span><i /><span>Top Leader</span></div>
      <div className="broker-grid">{brokers.map(([name, role, specialty, level, sales, deals, progress]) => <article className="broker-card" key={String(name)}><div className="broker-card-head"><Avatar name={String(name)} /><div><h2>{name}</h2><p>{role}</p></div><Badge tone={level === "Top Producer" ? "gold" : "blue"}>{level}</Badge></div><dl className="detail-grid"><div><dt>Especialidad</dt><dd>{specialty}</dd></div><div><dt>Ventas del año</dt><dd>{sales}</dd></div><div><dt>Negocios activos</dt><dd>{deals}</dd></div><div><dt>Meta mensual</dt><dd>{progress}%</dd></div></dl><div className="progress-line"><span style={{ width: `${progress}%` }} /></div><footer><button className="button secondary">Ver perfil</button><button className="text-button">Asignar propiedades</button></footer></article>)}</div>
    </>
  );
}

function AcademyView({ done, onToggle }: { done: boolean[]; onToggle: (index: number) => void }) {
  const courses = [["Manejo de objeciones", "Sesión de lunes", "48 min"], ["Presentación de proyectos en planos", "Sesión de lunes", "62 min"], ["Cómo dar de alta un alquiler", "Checklist operativo", "8 pasos"], ["Proceso de reserva y separación", "Checklist operativo", "6 pasos"]];
  const completed = done.filter(Boolean).length;
  return (
    <>
      <PageHeader eyebrow="C7 · Formación" title="Academy" subtitle="Sesiones grabadas y procesos operativos para todo el equipo." />
      <div className="academy-layout"><div><div className="filter-bar"><div className="segmented"><button className="active">Todas</button><button>Sesiones</button><button>Checklists</button><button>Pendientes</button></div></div><div className="course-grid">{courses.map(([title, type, duration], index) => <article className="course-card" key={title}><div className={`course-cover cover-${index}`}><span>QH Academy</span><b>{duration}</b></div><div><Badge tone={type === "Checklist operativo" ? "blue" : "gold"}>{type}</Badge><h2>{title}</h2><div className="progress-line"><span style={{ width: done[index] ? "100%" : index === 2 ? "70%" : "0%" }} /></div><button className={done[index] ? "button secondary wide" : "button primary wide"} onClick={() => onToggle(index)}>{done[index] ? "Completado" : index === 2 ? "Continuar" : "Comenzar"}</button></div></article>)}</div></div>
        <aside className="panel academy-progress"><p className="eyebrow">Tu progreso</p><div className="goal-ring" style={{ "--progress": `${completed * 25}%` } as React.CSSProperties}><strong>{completed * 25}%</strong></div><h2>{completed} de 4 contenidos</h2><p>Completa los procesos pendientes para mantener tu perfil al día.</p><div className="checklist">{["Identificar propiedad", "Validar disponibilidad", "Confirmar comisión", "Crear ficha", "Publicar rango"].map((item, index) => <label key={item}><input type="checkbox" defaultChecked={index < 3} />{item}</label>)}</div></aside>
      </div>
    </>
  );
}

function GoalsView({ role }: { role: Role }) {
  const rows = role === "broker" ? [["Yostar Medina", "4", "2", "50%", "Junior"]] : [["Ismael Rosario", "6", "5", "83%", "Top Producer"], ["Yostar Medina", "4", "2", "50%", "Junior"], ["Luis García", "2", "0", "0%", "Junior"]];
  return (
    <>
      <PageHeader eyebrow="C8 · Rendimiento" title={role === "broker" ? "Mis metas" : "Metas y desempeño"} subtitle="Cierres del pipeline contra los objetivos mensuales." action={<select className="header-select"><option>Julio 2026</option><option>Junio 2026</option></select>} />
      <div className="goal-hero"><div className="goal-ring" style={{ "--progress": role === "broker" ? "50%" : "70%" } as React.CSSProperties}><strong>{role === "broker" ? "50%" : "70%"}</strong></div><div><p className="eyebrow">{role === "broker" ? "Meta personal" : "Meta del negocio"}</p><h2>{role === "broker" ? "2 de 4 negocios logrados" : "7 de 10 negocios logrados"}</h2><p>Los cierres alimentan esta meta automáticamente, sin doble captura.</p></div></div>
      <div className="performance-grid"><div className="table-wrap"><table><thead><tr><th>Broker</th><th>Meta</th><th>Logrados</th><th>Cumplimiento</th><th>Nivel</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}><td><span className="table-person"><Avatar name={row[0]} small /><strong>{row[0]}</strong></span></td><td>{row[1]}</td><td>{row[2]}</td><td><div className="table-progress"><span style={{ width: row[3] }} /></div><small>{row[3]}</small></td><td><Badge tone={row[4] === "Top Producer" ? "gold" : "blue"}>{row[4]}</Badge></td></tr>)}</tbody></table></div><div className="panel annual-chart"><h2>Cierres por mes</h2><div className="bar-chart">{[5, 7, 8, 6, 10, 9, 7, 0, 0, 0, 0, 0].map((value, index) => <div key={index}><i style={{ height: `${value * 8}px` }} className={value >= 10 ? "hit" : ""} /><span>{["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][index]}</span></div>)}</div></div></div>
    </>
  );
}

function CommissionsView() {
  const rows = [["Laura Gómez · Bávaro Beach Lofts", "US$132,000", "5%", "50% broker / 50% agencia", "Yostar Medina", "Aprobada"], ["Carlos Peña · Praderas", "US$195,000", "5%", "60% broker / 40% agencia", "Ismael Rosario", "Pendiente"], ["Marta Solís · Vista Cana", "US$220,000", "4%", "50% broker / 50% agencia", "Ismael Rosario", "Pagada"]];
  return (
    <>
      <PageHeader eyebrow="C9 · Finanzas internas" title="Comisiones" subtitle="Comisiones de Quisqueya Home, sin colaboración con agencias externas." action={<button className="button secondary">Exportar reporte</button>} />
      <section className="metrics-row three"><Metric label="Comisiones del mes" value="US$48,500" note="6 negocios cerrados" /><Metric label="Pendientes de pago" value="US$12,300" note="2 por aprobar" /><Metric label="Pagadas" value="US$36,200" note="Actualizado hoy" /></section>
      <div className="filter-bar"><select><option>Todos los brokers</option><option>Ismael Rosario</option><option>Yostar Medina</option></select><select><option>Julio 2026</option><option>Junio 2026</option></select><select><option>Todos los estados</option><option>Pendiente</option><option>Aprobada</option><option>Pagada</option></select></div>
      <div className="table-wrap"><table><thead><tr><th>Negocio</th><th>Monto de venta</th><th>Comisión</th><th>Reparto interno</th><th>Broker</th><th>Estado</th></tr></thead><tbody>{rows.map((row) => <tr key={row[0]}>{row.slice(0, 5).map((cell) => <td key={cell}>{cell}</td>)}<td><Badge tone={row[5] === "Pagada" ? "green" : row[5] === "Aprobada" ? "gold" : "neutral"}>{row[5]}</Badge></td></tr>)}</tbody></table></div>
    </>
  );
}

function TasksView({ tasks, onToggle }: { tasks: Array<{ id: number; label: string; due: string; done: boolean }>; onToggle: (id: number) => void }) {
  return (
    <>
      <PageHeader eyebrow="C10 · Operación" title="Tareas y actividades" subtitle="Seguimientos asociados a contactos y fechas concretas." action={<button className="button primary">Nueva tarea</button>} />
      <div className="task-layout"><section className="panel"><div className="panel-title"><div><p className="eyebrow">Hoy</p><h2>Prioridades</h2></div><span>{tasks.filter((task) => !task.done).length} pendientes</span></div><div className="task-list">{tasks.map((task) => <label className={task.done ? "task done" : "task"} key={task.id}><input checked={task.done} onChange={() => onToggle(task.id)} type="checkbox" /><span><strong>{task.label}</strong><small>{task.due}</small></span><Badge tone={task.done ? "green" : "gold"}>{task.done ? "Completada" : "Pendiente"}</Badge></label>)}</div></section><aside className="panel"><p className="eyebrow">Carga del equipo</p><h2>Actividades abiertas</h2><div className="workload">{[["Alexandra", 4], ["Ismael", 3], ["Yostar", 2]].map(([name, count]) => <div key={String(name)}><Avatar name={String(name)} small /><span><strong>{name}</strong><small>{count} actividades</small></span><div className="progress-line"><span style={{ width: `${Number(count) * 20}%` }} /></div></div>)}</div></aside></div>
    </>
  );
}

function CommunicationsView({ onSend }: { onSend: () => void }) {
  const [template, setTemplate] = useState("Hola {nombre}, gracias por tu interés en {proyecto}. ¿Te gustaría coordinar una llamada?");
  const [name, setName] = useState("Ana");
  const [project, setProject] = useState("Bávaro Beach Lofts");
  const preview = template.replace("{nombre}", name).replace("{proyecto}", project);
  return (
    <>
      <PageHeader eyebrow="C11 · WhatsApp" title="Comunicaciones" subtitle="Plantillas consistentes con el contexto de cada lead." />
      <div className="communications-layout"><section className="panel template-list"><div className="panel-title"><div><p className="eyebrow">Plantillas</p><h2>Mensajes guardados</h2></div><button className="text-button">Nueva</button></div>{["Primer contacto", "Confirmación de cita", "Seguimiento de proyecto"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item}><strong>{item}</strong><small>{index === 0 ? "Lead nuevo" : index === 1 ? "Agenda" : "Seguimiento"}</small></button>)}</section><section className="panel message-editor"><p className="eyebrow">Vista previa</p><label>Nombre<input value={name} onChange={(event) => setName(event.target.value)} /></label><label>Proyecto<input value={project} onChange={(event) => setProject(event.target.value)} /></label><label>Mensaje<textarea value={template} onChange={(event) => setTemplate(event.target.value)} /></label><div className="phone-preview"><span>WhatsApp Business</span><p>{preview}</p><small>10:42 AM</small></div><button className="button primary" onClick={onSend}>Abrir en WhatsApp</button></section></div>
    </>
  );
}

function ReportsView() {
  return (
    <>
      <PageHeader eyebrow="C12 · Solo administrador" title="Reportes y BI" subtitle="Conversión, canales, demanda y proyección comercial." action={<div className="header-actions-inline"><select className="header-select"><option>Últimos 90 días</option><option>Este año</option></select><button className="button secondary">Exportar a Excel</button></div>} />
      <div className="report-grid">
        <article className="panel report-large"><p className="eyebrow">Conversión del embudo</p><h2>De lead a cierre</h2><div className="report-funnel">{[["48", "Leads"], ["38", "Contactados"], ["24", "Presentaciones"], ["14", "Preselección"], ["10", "Negociación"], ["7", "Cierres"]].map(([value, label], index) => <div style={{ width: `${100 - index * 10}%` }} key={label}><strong>{value}</strong><span>{label}</span></div>)}</div></article>
        <article className="panel"><p className="eyebrow">Leads por canal</p><h2>Origen de captación</h2><div className="donut"><strong>48</strong><span>leads</span></div><div className="legend"><span><i className="gold" />YouTube 58%</span><span><i className="navy" />Web 22%</span><span><i className="blue" />WhatsApp 14%</span><span><i className="gray" />Referidos 6%</span></div></article>
        <article className="panel"><p className="eyebrow">Zonas calientes</p><h2>Interés por ubicación</h2><div className="horizontal-bars">{[["Punta Cana", 88], ["Bávaro", 68], ["Cap Cana", 45], ["Las Terrenas", 28]].map(([label, value]) => <div key={String(label)}><span>{label}</span><div><i style={{ width: `${value}%` }} /></div><strong>{value}</strong></div>)}</div></article>
        <article className="panel"><p className="eyebrow">Motivos de pérdida</p><h2>Por qué no avanzan</h2><div className="loss-list">{[["Precio", 12], ["No responde", 8], ["Compró otro", 5], ["Sin financiamiento", 4]].map(([label, value]) => <div key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}</div></article>
        <article className="panel report-large"><p className="eyebrow">Proyección de cierre</p><h2>Pipeline ponderado</h2><div className="projection"><div className="projection-line" /><div className="projection-area" /><span>Jul</span><span>Ago</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dic</span></div><div className="projection-total"><span>Proyección trimestral</span><strong>US$1.42M</strong><small>Confianza estimada 72%</small></div></article>
      </div>
    </>
  );
}

function ProgressView({ progress, onChange, onPublish }: { progress: number; onChange: (value: number) => void; onPublish: () => void }) {
  const phases = ["Movimiento de tierra", "Cimientos", "Estructura", "Muros", "Instalaciones", "Terminaciones", "Áreas comunes", "Entrega"];
  const [selected, setSelected] = useState(2);
  return (
    <>
      <PageHeader eyebrow="C13 · Gestión manual" title="Avances de obra" subtitle="Praderas de Punta Cana · 8 fases · Entrega diciembre 2027" action={<button className="button primary" onClick={onPublish}>Publicar en el portal</button>} />
      <div className="phase-timeline">{phases.map((phase, index) => <button className={index === selected ? "active" : index < 2 ? "complete" : ""} key={phase} onClick={() => setSelected(index)}><span>{index < 2 ? "✓" : index + 1}</span><strong>{phase}</strong><small>{index < 2 ? "Completado" : index === 2 ? `En curso ${progress}%` : "Pendiente"}</small></button>)}</div>
      <div className="progress-editor"><section className="panel"><p className="eyebrow">Fase {selected + 1}</p><h2>{phases[selected]}</h2><div className="form-grid"><label>Estado<select defaultValue={selected < 2 ? "Completado" : selected === 2 ? "En curso" : "Pendiente"}><option>Pendiente</option><option>En curso</option><option>Completado</option><option>Retrasado</option></select></label><label>Fecha de actualización<input type="date" defaultValue="2026-07-24" /></label><label className="span-2">Porcentaje de avance <output>{progress}%</output><input className="range" type="range" min="0" max="100" value={progress} onChange={(event) => onChange(Number(event.target.value))} /></label><label className="span-2">URL de video de YouTube<input type="url" placeholder="https://youtube.com/watch?v=" /></label><label className="span-2">Nota pública<textarea defaultValue="La estructura del tercer nivel avanza según el cronograma previsto." /></label></div></section><aside className="panel upload-panel"><p className="eyebrow">Evidencia</p><h2>Fotos de obra</h2><div className="photo-grid"><div>Frente</div><div>Estructura</div><div>Detalle</div><button>Agregar fotos</button></div><dl className="detail-grid"><div><dt>Responsable</dt><dd>Alexandra Núñez</dd></div><div><dt>Última edición</dt><dd>Hoy, 9:42 AM</dd></div></dl><p className="helper">El comprador verá la nota, el porcentaje y las fotografías en el portal público.</p></aside></div>
    </>
  );
}

function SettingsView({ tab, onTab, onSave }: { tab: string; onTab: (tab: string) => void; onSave: () => void }) {
  const tabs = ["Usuarios y roles", "Etapas del pipeline", "Metas", "Comisiones", "Plantillas de WhatsApp", "Integraciones", "Marca"];
  const permissionLabels = ["Leads", "Contactos", "Pipeline", "Propiedades", "Precios reales", "Métricas globales", "Comisiones", "Configuración"];
  const [permissions, setPermissions] = useState([
    [true, true, true],
    [true, true, false],
    [true, false, true],
    [true, false, true],
    [true, false, false],
    [true, false, false],
    [true, false, false],
    [true, false, false],
  ]);

  function togglePermission(row: number, column: number) {
    if (column === 0) return;
    setPermissions((current) => current.map((values, rowIndex) =>
      rowIndex === row ? values.map((value, columnIndex) => columnIndex === column ? !value : value) : values
    ));
  }

  return (
    <>
      <PageHeader eyebrow="C14 · Administración" title="Configuración y permisos" subtitle="Controla quién puede ver y modificar cada área." action={<button className="button primary" onClick={onSave}>Guardar cambios</button>} />
      <div className="settings-layout"><nav className="settings-nav">{tabs.map((item) => <button className={tab === item ? "active" : ""} onClick={() => onTab(item)} key={item}>{item}</button>)}</nav><section className="panel settings-content">
        {tab === "Usuarios y roles" ? (
          <>
            <div className="panel-title"><div><p className="eyebrow">RBAC</p><h2>Usuarios y roles</h2></div><button className="button secondary">Invitar usuario</button></div>
            <div className="table-wrap"><table className="permission-table"><thead><tr><th>Módulo o dato</th><th>Administrador</th><th>Asistente</th><th>Broker</th></tr></thead><tbody>{permissionLabels.map((label, row) => <tr key={label}><td>{label}</td>{permissions[row].map((value, column) => <td key={column}><button className={value ? "toggle on" : "toggle"} aria-label={`${label} ${value ? "permitido" : "bloqueado"}`} aria-pressed={value} disabled={column === 0} onClick={() => togglePermission(row, column)}><span /></button></td>)}</tr>)}</tbody></table></div>
            <div className="permission-note"><strong>Protección del perfil Broker</strong><p>No puede ver métricas globales, precios reales ni datos de otros brokers.</p></div>
          </>
        ) : tab === "Integraciones" ? (
          <IntegrationCenter />
        ) : (
          <><p className="eyebrow">{tab}</p><h2>Configuración de {tab.toLowerCase()}</h2><p className="section-intro">Esta sección conserva el alcance definido para el CRM y permite ajustar sus valores operativos.</p>{tab === "Etapas del pipeline" && <div className="stage-settings">{stageOrder.map((stage, index) => <div key={stage}><span>{index + 1}</span><strong>{stage}</strong><button className="text-button">Editar</button></div>)}</div>}{tab === "Marca" && <div className="brand-settings"><div><span className="swatch navy" /><strong>Azul Quisqueya</strong><small>#1D2B53</small></div><div><span className="swatch gold" /><strong>Oro Quisqueya</strong><small>#C7990E</small></div></div>}{!["Etapas del pipeline", "Marca"].includes(tab) && <Empty title={`${tab} listo para configurar`} text="Los valores de demostración permanecen activos y pueden modificarse aquí." />}</>
        )}
      </section></div>
    </>
  );
}

function IntegrationCenter() {
  const integrations = [
    { name: "Google Calendar", status: "Disponible", tone: "green" as const, text: "Cada cita puede abrirse en Google Calendar y toda la agenda puede exportarse como archivo .ics.", action: "Usar desde Agenda" },
    { name: "WhatsApp Business", status: "Activo", tone: "green" as const, text: "El CRM abre conversaciones desde la ficha del lead y aplica plantillas con contexto.", action: "Click-to-chat" },
    { name: "YouTube", status: "Preparado", tone: "gold" as const, text: "Los proyectos y avances aceptan URL de video. Falta guardar y validar el contenido en el backend.", action: "Enlace manual" },
    { name: "Zoom / Google Meet", status: "Preparado", tone: "gold" as const, text: "La agenda puede almacenar enlaces de reunión cuando exista persistencia de citas.", action: "Enlace manual" },
    { name: "Meta Lead Ads", status: "Fase siguiente", tone: "neutral" as const, text: "Requiere webhook, validación de firma, consentimiento y reglas de asignación.", action: "Requiere backend" },
    { name: "Google Calendar 2 vías", status: "Fase siguiente", tone: "neutral" as const, text: "Requiere usuarios reales, OAuth 2.0, almacenamiento cifrado de tokens y webhooks HTTPS.", action: "Requiere OAuth" },
  ];
  return (
    <>
      <p className="eyebrow">Conectividad</p>
      <h2>Integraciones</h2>
      <p className="section-intro">Capacidades activas hoy y conexiones preparadas para la fase con autenticación y base de datos.</p>
      <div className="integration-grid">
        {integrations.map((integration) => (
          <article className="integration-card" key={integration.name}>
            <div><strong>{integration.name}</strong><Badge tone={integration.tone}>{integration.status}</Badge></div>
            <p>{integration.text}</p>
            <small>{integration.action}</small>
          </article>
        ))}
      </div>
      <div className="integration-guard"><strong>Seguridad primero</strong><p>La sincronización bidireccional se habilita después de implementar identidad real, permisos de servidor y almacenamiento cifrado. No se guardarán tokens OAuth en el navegador.</p></div>
    </>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="drawer-head"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Cerrar">×</button></div>{children}</section>
    </div>
  );
}
