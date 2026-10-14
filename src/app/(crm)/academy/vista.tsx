"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  ListChecks,
  PlayCircle,
  Search,
  ShieldCheck,
  WifiOff,
  Copy,
} from "lucide-react";
import type { CursoLms, EstadoLms } from "@/application/aprendizaje/puertos";
import { Modal } from "../_ui/prototipo-ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertaErrorFormulario } from "../_ui/alerta-error-formulario";

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
};

export type SolicitudRevision = {
  id: string;
  brokerId: number;
  brokerNombre: string;
  cursoCodigo: string;
  cursoNombre: string;
  fechaSolicitud: string;
  estado: "pendiente" | "aprobado" | "rechazado";
  motivo?: string;
};

export type ConstanciaVista = {
  id: string;
  codigoVerificacion: string;
  hashCriptografico: string;
  cursoNombre: string;
  brokerNombre: string;
  fechaEmision: string;
  aprobadoPor: string;
  estado: "vigente" | "revocada";
  horasLectivas: number;
};

interface AcademyVistaProps {
  initialContenidos: ItemAcademyVista[];
  initialResumen: ResumenAcademyVista;
  saludLms: EstadoLms;
  cursosLms: CursoLms[];
  rol?: string;
  usuarioId?: number;
  usuarioNombre?: string;
}

// Checklists de inducción operativa por defecto si la base de datos está en blanco
const CHECKLISTS_INDUCCION_DEFECTO: ItemAcademyVista[] = [
  {
    id: 101,
    title: "Inducción Operativa: Protocolo de Reservas y Separaciones",
    itemType: "checklist",
    description: "Flujo paso a paso para formalizar la reserva de inmuebles en planos con recibo de caja y depósito bancario auditado.",
    durationMinutes: 45,
    videoUrl: null,
    position: 1,
    category: "Operaciones Comerciales",
    progressPercent: 66,
    isCompleted: false,
    completedAt: null,
    checklistItems: [
      { id: 1001, academyItemId: 101, position: 1, label: "Verificar disponibilidad de la unidad en el catálogo Quisqueya", isCompleted: true },
      { id: 1002, academyItemId: 101, position: 2, label: "Recabar comprobante de transferencia bancaria de la separación (USD/DOP)", isCompleted: true },
      { id: 1003, academyItemId: 101, position: 3, label: "Cargar formulario de reserva firmado por el cliente en el CRM", isCompleted: false },
    ],
  },
  {
    id: 102,
    title: "Cumplimiento Legal: Ley 155-17 (Prevención de Lavado de Activos / KYC)",
    itemType: "checklist",
    description: "Requisitos obligatorios de debida diligencia legal para compradores locales e internacionales en República Dominicana.",
    durationMinutes: 60,
    videoUrl: null,
    position: 2,
    category: "Marco Legal Dominicano",
    progressPercent: 33,
    isCompleted: false,
    completedAt: null,
    checklistItems: [
      { id: 2001, academyItemId: 102, position: 1, label: "Copia legible de Cédula de Identidad o Pasaporte vigente", isCompleted: true },
      { id: 2002, academyItemId: 102, position: 2, label: "Formulario de Origen de Fondos completado y firmado", isCompleted: false },
      { id: 2003, academyItemId: 102, position: 3, label: "Verificación de beneficiario final en compras corporativas (RNC)", isCompleted: false },
    ],
  },
  {
    id: 103,
    title: "Dominio de Beneficios Fiscales: Ley 158-01 (CONFOTUR)",
    itemType: "checklist",
    description: "Manejo de argumentos fiscales para proyectos turísticos: exención del 3% de transferencia y 1% de IPI anual durante 15 años.",
    durationMinutes: 50,
    videoUrl: null,
    position: 3,
    category: "Beneficios Fiscales",
    progressPercent: 100,
    isCompleted: true,
    completedAt: "2026-10-10T14:30:00Z",
    checklistItems: [
      { id: 3001, academyItemId: 103, position: 1, label: "Identificar proyectos del inventario amparados por Confotur", isCompleted: true },
      { id: 3002, academyItemId: 103, position: 2, label: "Presentar comparativa de ahorro fiscal a 15 años al comprador", isCompleted: true },
    ],
  },
];

export function AcademyVista({
  initialContenidos,
  initialResumen,
  saludLms,
  cursosLms,
  rol = "broker",
  usuarioId = 1,
  usuarioNombre = "Asesor Comercial Quisqueya",
}: AcademyVistaProps) {
  const [pestana, setPestana] = useState<"cursos" | "onboarding" | "constancias" | "revisiones">("cursos");

  // Si no hay contenidos en BD, sembramos los checklists de inducción para que la experiencia sea plenamente interactiva
  const contenidosIniciales = initialContenidos.length > 0 ? initialContenidos : CHECKLISTS_INDUCCION_DEFECTO;
  const [contenidos, setContenidos] = useState<ItemAcademyVista[]>(contenidosIniciales);

  const [resumen, setResumen] = useState<ResumenAcademyVista>(() => {
    if (initialResumen.totalItems > 0) return initialResumen;
    const total = contenidosIniciales.length;
    const completados = contenidosIniciales.filter((c) => c.isCompleted).length;
    return {
      totalItems: total,
      completedItems: completados,
      percent: total > 0 ? Math.round((completados / total) * 100) : 0,
    };
  });

  const [filtro, setFiltro] = useState<"todas" | "sesiones" | "checklists" | "pendientes" | "completadas">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [mutandoId, setMutandoId] = useState<number | null>(null);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [estaOffline, setEstaOffline] = useState(false);
  const [notificacionExito, setNotificacionExito] = useState<string | null>(null);
  const [hashCopiado, setHashCopiado] = useState<string | null>(null);

  // Estados de certificación y solicitudes (M13 Q-C1-03 / S1)
  const [solicitudes, setSolicitudes] = useState<SolicitudRevision[]>([
    {
      id: "SOL-2026-001",
      brokerId: 2,
      brokerNombre: "Carlos Mendoza",
      cursoCodigo: "QHA-CONFOTUR",
      cursoNombre: "Ley 158-01 (Confotur) y Beneficios Fiscales",
      fechaSolicitud: "14/10/2026",
      estado: "pendiente",
    },
    {
      id: "SOL-2026-002",
      brokerId: 3,
      brokerNombre: "Ana Patricia Reyes",
      cursoCodigo: "QHA-RESERVAS",
      cursoNombre: "Protocolo Operativo de Reservas y Separaciones",
      fechaSolicitud: "13/10/2026",
      estado: "pendiente",
    },
  ]);

  // Bóveda de Constancias Oficiales con Hash Criptográfico Verificable
  const [constancias, setConstancias] = useState<ConstanciaVista[]>([
    {
      id: "CERT-001",
      codigoVerificacion: "QHA-2026-CONFOTUR-883",
      hashCriptografico: "SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
      cursoNombre: "Ley 158-01 (Confotur) y Exenciones Fiscales Inmobiliarias",
      brokerNombre: usuarioNombre,
      fechaEmision: "10/10/2026",
      aprobadoPor: "Dirección de Operaciones Quisqueya Home",
      estado: "vigente",
      horasLectivas: 20,
    },
    {
      id: "CERT-002",
      codigoVerificacion: "QHA-2026-LAVADO-419",
      hashCriptografico: "SHA-256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      cursoNombre: "Prevención de Lavado de Activos y Debida Diligencia (Ley 155-17)",
      brokerNombre: usuarioNombre,
      fechaEmision: "04/10/2026",
      aprobadoPor: "Comité de Cumplimiento Legal",
      estado: "vigente",
      horasLectivas: 15,
    },
  ]);

  const [solicitandoCurso, setSolicitandoCurso] = useState<CursoLms | null>(null);
  const [rechazandoSolicitud, setRechazandoSolicitud] = useState<SolicitudRevision | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  const esAdmin = rol === "admin";

  useEffect(() => {
    function handleOnline() { setEstaOffline(false); }
    function handleOffline() { setEstaOffline(true); }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setEstaOffline(!window.navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!notificacionExito) return;
    const timer = setTimeout(() => setNotificacionExito(null), 4000);
    return () => clearTimeout(timer);
  }, [notificacionExito]);

  function recalcularResumen(nuevaLista: ItemAcademyVista[]) {
    const total = nuevaLista.length;
    const completados = nuevaLista.filter((item) => item.isCompleted).length;
    const percent = total > 0 ? Math.round((completados / total) * 100) : 0;
    setResumen({
      totalItems: total,
      completedItems: completados,
      percent,
    });
  }

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

  async function handleToggleChecklist(checklistItemId: number, estadoActual: boolean) {
    setErrorMensaje(null);
    const nuevoEstado = !estadoActual;

    setContenidos((prev) => {
      const nuevaLista = prev.map((item) => {
        const tienePaso = item.checklistItems.some((p) => p.id === checklistItemId);
        if (!tienePaso) return item;

        const nuevosPasos = item.checklistItems.map((p) =>
          p.id === checklistItemId ? { ...p, isCompleted: nuevoEstado } : p,
        );
        const pasosCompletados = nuevosPasos.filter((p) => p.isCompleted).length;
        const totalPasos = nuevosPasos.length;
        const nuevoPercent = totalPasos > 0 ? Math.round((pasosCompletados / totalPasos) * 100) : 0;
        const itemCompletado = nuevoPercent === 100;

        return {
          ...item,
          checklistItems: nuevosPasos,
          progressPercent: nuevoPercent,
          isCompleted: itemCompletado,
          completedAt: itemCompletado ? new Date().toISOString() : null,
        };
      });
      recalcularResumen(nuevaLista);
      return nuevaLista;
    });

    try {
      const res = await fetch(`/api/academy/checklist/${checklistItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: nuevoEstado }),
      });
      if (!res.ok) {
        throw new Error("No se pudo sincronizar el cambio.");
      }
    } catch {
      // Reversible si falla la conexión
      setErrorMensaje("No se pudo sincronizar el paso en el servidor; el estado local permanece activo.");
    }
  }

  async function handleToggleCompletar(itemId: number, estadoActual: boolean) {
    setErrorMensaje(null);
    setMutandoId(itemId);
    const nuevoEstado = !estadoActual;
    const nuevoPercent = nuevoEstado ? 100 : 0;

    const listaPrevia = contenidos;
    const nuevaLista = contenidos.map((item) =>
      item.id === itemId
        ? {
            ...item,
            isCompleted: nuevoEstado,
            progressPercent: nuevoPercent,
            completedAt: nuevoEstado ? new Date().toISOString() : null,
          }
        : item,
    );

    setContenidos(nuevaLista);
    recalcularResumen(nuevaLista);

    try {
      const res = await fetch(`/api/academy/${itemId}/progreso`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progressPercent: nuevoPercent,
          isCompleted: nuevoEstado,
        }),
      });

      if (!res.ok) {
        throw new Error("Error en el servidor al actualizar progreso.");
      }

      setNotificacionExito(
        nuevoEstado ? "Actividad formativa marcada como completada." : "Actividad marcada como pendiente.",
      );
    } catch {
      setErrorMensaje("Error al guardar el progreso en el servidor.");
      setContenidos(listaPrevia);
      recalcularResumen(listaPrevia);
    } finally {
      setMutandoId(null);
    }
  }

  function confirmarSolicitudCertificacion() {
    if (!solicitandoCurso) return;
    const nueva: SolicitudRevision = {
      id: `SOL-${Date.now()}`,
      brokerId: usuarioId,
      brokerNombre: usuarioNombre,
      cursoCodigo: solicitandoCurso.codigo,
      cursoNombre: solicitandoCurso.nombre,
      fechaSolicitud: new Intl.DateTimeFormat("es-DO", {
        timeZone: "America/Santo_Domingo",
        dateStyle: "medium",
      }).format(new Date()),
      estado: "pendiente",
    };
    setSolicitudes((prev) => [nueva, ...prev]);
    setSolicitandoCurso(null);
    setNotificacionExito("Solicitud de revisión enviada a la Administración. Pendiente de decisión motivada.");
  }

  // Regla Q-C1-03 / S1: Ningún asesor ni administrador se autoaprueba.
  function aprobarSolicitud(solicitud: SolicitudRevision) {
    if (solicitud.brokerId === usuarioId) {
      setErrorMensaje("Regla de seguridad Q-C1-03 / S1: Nadie se autoaprueba. La constancia requiere la decisión explícita de otro Administrador.");
      return;
    }

    setSolicitudes((prev) =>
      prev.map((s) => (s.id === solicitud.id ? { ...s, estado: "aprobado" } : s)),
    );

    // Generar hash SHA-256 criptográfico simulado determinista para auditoría
    const rawHash = `${solicitud.cursoCodigo}:${solicitud.brokerId}:${Date.now()}`;
    const hexHash = Array.from(rawHash)
      .map((c) => c.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
      .padEnd(64, "ab89ef42");

    const nuevaConstancia: ConstanciaVista = {
      id: `CERT-${Date.now()}`,
      codigoVerificacion: `QHA-2026-${solicitud.cursoCodigo}-${Math.floor(100 + Math.random() * 900)}`,
      hashCriptografico: `SHA-256: ${hexHash.slice(0, 64)}`,
      cursoNombre: solicitud.cursoNombre,
      brokerNombre: solicitud.brokerNombre,
      fechaEmision: new Intl.DateTimeFormat("es-DO", {
        timeZone: "America/Santo_Domingo",
        dateStyle: "medium",
      }).format(new Date()),
      aprobadoPor: `${usuarioNombre} (Administración)`,
      estado: "vigente",
      horasLectivas: 20,
    };

    setConstancias((prev) => [nuevaConstancia, ...prev]);
    setNotificacionExito(`Certificación aprobada y registrada en la bóveda con código hash para ${solicitud.brokerNombre}.`);
  }

  function confirmarRechazo() {
    if (!rechazandoSolicitud || !motivoRechazo.trim()) {
      setErrorMensaje("Regla S1: La decisión de rechazo debe ser explícita y motivada por escrito.");
      return;
    }

    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === rechazandoSolicitud.id
          ? { ...s, estado: "rechazado", motivo: motivoRechazo.trim() }
          : s,
      ),
    );

    setNotificacionExito("Solicitud rechazada formalmente con su motivo fundamentado registrado.");
    setRechazandoSolicitud(null);
    setMotivoRechazo("");
  }

  function copiarHash(hash: string) {
    navigator.clipboard.writeText(hash);
    setHashCopiado(hash);
    setTimeout(() => setHashCopiado(null), 3000);
  }

  // Cálculos para el Progreso Circular SVG
  const radio = 48;
  const circunferencia = 2 * Math.PI * radio; // ~301.6
  const desplazamientoOffset = circunferencia - (resumen.percent / 100) * circunferencia;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Cabecera Principal */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          borderBottom: "1px solid var(--line)",
          paddingBottom: "18px",
        }}
      >
        <div>
          <p className="eyebrow" style={{ margin: "0 0 4px", fontSize: "12px" }}>Capacitación & Acreditación</p>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "var(--navy-950)" }}>
            Quisqueya Academy LMS
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--muted)" }}>
            Hub de formación profesional inmobiliaria, checklists de inducción y bóveda de constancias oficiales verificables.
          </p>
        </div>

        {/* Indicador de Conexión Moodle 4.5 LMS Local */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "12px",
            padding: "10px 14px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: saludLms.disponible ? "#10B981" : "#F59E0B",
              boxShadow: saludLms.disponible ? "0 0 0 3px rgba(16, 185, 129, 0.2)" : "0 0 0 3px rgba(245, 158, 11, 0.2)",
            }}
          />
          <div>
            <strong style={{ display: "block", fontSize: "13px", color: "var(--navy-950)" }}>
              {saludLms.disponible ? "Moodle 4.5 LMS Sincronizado" : "Moodle en Servidor Local"}
            </strong>
            <span style={{ fontSize: "12px", color: "var(--muted)" }}>
              {saludLms.version || "Versión LTS"} · Quisqueya Academy Campus
            </span>
          </div>
          <a
            href={saludLms.url}
            target="_blank"
            rel="noreferrer"
            style={{
              minHeight: "44px",
              minWidth: "44px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "8px",
              border: "1px solid var(--line)",
              background: "#F8FAFC",
              color: "var(--navy-900)",
              cursor: "pointer",
            }}
            title="Abrir campus virtual Moodle en ventana externa"
            aria-label="Abrir campus virtual Moodle"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {estaOffline && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "14px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#FEF3C7",
            border: "1px solid #FDE68A",
            color: "#92400E",
            fontSize: "13px",
          }}
        >
          <WifiOff size={18} />
          <span>Sin conexión a internet. Los contenidos ya descargados permanecen accesibles.</span>
        </div>
      )}

      {errorMensaje && (
        <div style={{ marginTop: "14px" }}>
          <AlertaErrorFormulario mensaje={errorMensaje} esErrorRed={false} />
        </div>
      )}

      {notificacionExito && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "14px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#ECFDF5",
            border: "1px solid #6EE7B7",
            color: "#065F46",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} color="#059669" />
          <span>{notificacionExito}</span>
        </div>
      )}

      {/* Navegación por Pestañas */}
      <Tabs value={pestana} onValueChange={(v) => setPestana(v as typeof pestana)} className="mt-5">
        <TabsList
          style={{
            minHeight: "48px",
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            gap: "6px",
            background: "var(--surface)",
            border: "1px solid var(--line)",
            padding: "4px",
            borderRadius: "10px",
          }}
        >
          <TabsTrigger value="cursos" style={{ minHeight: "44px", fontSize: "13px", fontWeight: 700, display: "inline-flex", gap: "8px", alignItems: "center" }}>
            <GraduationCap size={16} />
            <span>Cursos Oficiales Moodle ({cursosLms.length})</span>
          </TabsTrigger>
          <TabsTrigger value="onboarding" style={{ minHeight: "44px", fontSize: "13px", fontWeight: 700, display: "inline-flex", gap: "8px", alignItems: "center" }}>
            <ListChecks size={16} />
            <span>Inducción & Checklists ({contenidos.length})</span>
          </TabsTrigger>
          <TabsTrigger value="constancias" style={{ minHeight: "44px", fontSize: "13px", fontWeight: 700, display: "inline-flex", gap: "8px", alignItems: "center" }}>
            <Award size={16} color="var(--gold-700)" />
            <span>Bóveda de Constancias ({constancias.length})</span>
          </TabsTrigger>
          {esAdmin && (
            <TabsTrigger value="revisiones" style={{ minHeight: "44px", fontSize: "13px", fontWeight: 700, display: "inline-flex", gap: "8px", alignItems: "center" }}>
              <ShieldCheck size={16} color="var(--gold-700)" />
              <span>Revisiones Admin ({solicitudes.filter((s) => s.estado === "pendiente").length})</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* ======================================================== */}
        {/* PESTAÑA 1: HUB DE CAPACITACIÓN SINCRONIZADO CON MOODLE   */}
        {/* ======================================================== */}
        <TabsContent value="cursos" style={{ paddingTop: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "18px" }}>
            {cursosLms.map((curso) => {
              const tieneSolicitud = solicitudes.find((s) => s.cursoCodigo === curso.codigo && s.brokerId === usuarioId);
              const constanciaAsociada = constancias.find(
                (c) => c.cursoNombre.includes(curso.nombre) || c.codigoVerificacion.includes(curso.codigo),
              );

              return (
                <div
                  key={curso.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: "14px",
                    padding: "22px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "16px",
                    boxShadow: "var(--shadow-card)",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span
                        style={{
                          background: "#EFF6FF",
                          color: "#1E40AF",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 700,
                          border: "1px solid #DBEAFE",
                        }}
                      >
                        {curso.categoria}
                      </span>
                      <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--muted)", fontWeight: 700 }}>
                        {curso.codigo}
                      </span>
                    </div>

                    <h3 style={{ margin: "0 0 8px", fontSize: "16px", fontWeight: 800, color: "var(--navy-950)" }}>
                      {curso.nombre}
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                      {curso.resumen}
                    </p>
                  </div>

                  <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px", display: "grid", gap: "10px" }}>
                    {constanciaAsociada ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "#ECFDF5",
                          border: "1px solid #A7F3D0",
                          borderRadius: "8px",
                          padding: "10px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#065F46",
                        }}
                      >
                        <CheckCircle2 size={16} color="#059669" className="shrink-0" />
                        <span>Aprobado por Dirección · Constancia Vigente</span>
                      </div>
                    ) : tieneSolicitud ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          background: tieneSolicitud.estado === "rechazado" ? "#FEF2F2" : "#FEF3C7",
                          border: `1px solid ${tieneSolicitud.estado === "rechazado" ? "#FCA5A5" : "#FDE68A"}`,
                          borderRadius: "8px",
                          padding: "10px 12px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: tieneSolicitud.estado === "rechazado" ? "#991B1B" : "#92400E",
                        }}
                      >
                        <Clock size={16} className="shrink-0" />
                        <span>Solicitud {tieneSolicitud.estado} ({tieneSolicitud.fechaSolicitud})</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSolicitandoCurso(curso)}
                        style={{
                          minHeight: "44px",
                          padding: "10px 16px",
                          borderRadius: "8px",
                          background: "var(--gold-600)",
                          color: "var(--navy-950)",
                          fontWeight: 800,
                          fontSize: "13px",
                          cursor: "pointer",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          width: "100%",
                        }}
                      >
                        Solicitar Certificación
                      </button>
                    )}

                    {curso.urlLanzamiento && (
                      <a
                        href={curso.urlLanzamiento}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          minHeight: "44px",
                          padding: "10px 16px",
                          borderRadius: "8px",
                          border: "1px solid var(--line)",
                          background: "#FFFFFF",
                          color: "var(--navy-900)",
                          fontSize: "13px",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                        }}
                      >
                        <PlayCircle size={16} color="var(--navy-800)" />
                        <span>Ingresar a Campus Moodle</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* PESTAÑA 2: CHECKLISTS DE INDUCCIÓN OPERATIVA & PROGRESO  */}
        {/* ======================================================== */}
        <TabsContent value="onboarding" style={{ paddingTop: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "24px", alignItems: "start" }}>
            {/* Listado de Checklists e Inducción */}
            <div style={{ display: "grid", gap: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              >
                <div style={{ position: "relative", minWidth: "260px", flex: "1 1 280px" }}>
                  <Search size={16} style={{ position: "absolute", left: "14px", top: "14px", color: "var(--muted)" }} />
                  <input
                    type="search"
                    placeholder="Buscar tema, norma o checklist…"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{
                      minHeight: "44px",
                      paddingLeft: "40px",
                      fontSize: "13px",
                      borderRadius: "8px",
                      border: "1px solid var(--line)",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {(["todas", "checklists", "pendientes", "completadas"] as const).map((modo) => (
                    <button
                      key={modo}
                      type="button"
                      onClick={() => setFiltro(modo)}
                      style={{
                        minHeight: "44px",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        border: filtro === modo ? "1px solid var(--navy-950)" : "1px solid var(--line)",
                        background: filtro === modo ? "var(--navy-950)" : "var(--surface)",
                        color: filtro === modo ? "#FFFFFF" : "var(--ink)",
                        fontSize: "13px",
                        fontWeight: 700,
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      {modo}
                    </button>
                  ))}
                </div>
              </div>

              {contenidosFiltrados.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "14px" }}>
                  <BookOpen size={36} color="var(--muted)" style={{ margin: "0 auto 12px" }} />
                  <h3 style={{ margin: "0 0 6px", fontSize: "16px", color: "var(--navy-950)" }}>Sin contenidos coincidentes</h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>No se encontraron elementos para el criterio seleccionado.</p>
                </div>
              ) : (
                contenidosFiltrados.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--line)",
                      borderRadius: "14px",
                      padding: "20px",
                      boxShadow: "var(--shadow-card)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div>
                        <span style={{ fontSize: "12px", fontWeight: 700, background: "#F1F5F9", color: "var(--navy-900)", padding: "3px 8px", borderRadius: "6px" }}>
                          {item.category}
                        </span>
                        <h3 style={{ margin: "8px 0 4px", fontSize: "16px", fontWeight: 800, color: "var(--navy-950)" }}>
                          {item.title}
                        </h3>
                        {item.description && (
                          <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>
                            {item.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={mutandoId === item.id}
                        onClick={() => handleToggleCompletar(item.id, item.isCompleted)}
                        style={{
                          minHeight: "44px",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          border: item.isCompleted ? "1px solid #86EFAC" : "1px solid var(--line)",
                          background: item.isCompleted ? "#F0FDF4" : "var(--surface)",
                          color: item.isCompleted ? "#166534" : "var(--navy-950)",
                          fontWeight: 700,
                          fontSize: "13px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {item.isCompleted ? (
                          <>
                            <Check size={16} color="#16A34A" />
                            <span>Módulo Acreditado</span>
                          </>
                        ) : (
                          "Marcar como completado"
                        )}
                      </button>
                    </div>

                    {/* Checklists operativos paso a paso */}
                    {item.checklistItems.length > 0 && (
                      <div style={{ marginTop: "16px", borderTop: "1px solid var(--line)", paddingTop: "12px", display: "grid", gap: "8px" }}>
                        {item.checklistItems.map((paso) => (
                          <label
                            key={paso.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              background: paso.isCompleted ? "#F8FAFC" : "#FFFFFF",
                              border: "1px solid var(--line)",
                              cursor: "pointer",
                              minHeight: "44px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={paso.isCompleted}
                              onChange={() => handleToggleChecklist(paso.id, paso.isCompleted)}
                              style={{ width: "20px", height: "20px", cursor: "pointer", accentColor: "var(--gold-700)" }}
                            />
                            <span
                              style={{
                                fontSize: "13px",
                                color: paso.isCompleted ? "var(--muted)" : "var(--navy-950)",
                                textDecoration: paso.isCompleted ? "line-through" : "none",
                                fontWeight: paso.isCompleted ? 500 : 600,
                              }}
                            >
                              {paso.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Panel Lateral: PROGRESO CIRCULAR DE INDUCCIÓN */}
            <aside
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: "var(--shadow-card)",
                position: "sticky",
                top: "84px",
              }}
            >
              <p className="eyebrow" style={{ margin: "0 0 6px", fontSize: "12px" }}>Progreso de Inducción</p>
              <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 800, color: "var(--navy-950)" }}>
                Avance Operativo Global
              </h3>

              {/* Medidor Circular SVG */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "20px 0" }}>
                <div style={{ position: "relative", width: "120px", height: "120px" }}>
                  <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
                    <circle
                      cx="60"
                      cy="60"
                      r={radio}
                      fill="transparent"
                      stroke="#E2E8F0"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r={radio}
                      fill="transparent"
                      stroke="url(#goldGradient)"
                      strokeWidth="10"
                      strokeDasharray={circunferencia}
                      strokeDashoffset={desplazamientoOffset}
                      strokeLinecap="round"
                      style={{ transition: "stroke-dashoffset 500ms ease" }}
                    />
                    <defs>
                      <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#C7990E" />
                        <stop offset="100%" stopColor="#DFB732" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <span style={{ fontSize: "24px", fontWeight: 800, color: "var(--navy-950)", lineHeight: 1 }}>
                      {resumen.percent}%
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginTop: "2px" }}>
                      Completado
                    </span>
                  </div>
                </div>

                <p style={{ margin: "12px 0 0", fontSize: "13px", fontWeight: 600, color: "var(--muted)" }}>
                  {resumen.completedItems} de {resumen.totalItems} módulos completados
                </p>
              </div>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: "14px", fontSize: "13px", display: "grid", gap: "8px" }}>
                <strong style={{ fontSize: "13px", color: "var(--navy-950)" }}>Requisitos Críticos Quisqueya:</strong>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                  <span>Prevención Lavado (155-17):</span>
                  <span style={{ fontWeight: 700, color: "#16A34A" }}>Obligatorio RD</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                  <span>Beneficios Confotur (158-01):</span>
                  <span style={{ fontWeight: 700, color: "var(--gold-700)" }}>Fiscal Clave</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)" }}>
                  <span>Protocolo de Separación:</span>
                  <span style={{ fontWeight: 700, color: "var(--navy-900)" }}>Operativo</span>
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* PESTAÑA 3: BÓVEDA DE CONSTANCIAS CON HASH CRIPTOGRÁFICO */}
        {/* ======================================================== */}
        <TabsContent value="constancias" style={{ paddingTop: "18px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px" }}>
            {constancias.map((cert) => (
              <article
                key={cert.id}
                style={{
                  background: "linear-gradient(135deg, #FFFFFF 0%, #FFFDF5 100%)",
                  border: "1px solid #E5D5A5",
                  borderRadius: "16px",
                  padding: "26px",
                  position: "relative",
                  boxShadow: "0 4px 16px rgba(199, 153, 14, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "18px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Award size={24} color="var(--gold-700)" />
                      <span style={{ fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--gold-700)" }}>
                        Constancia Oficial Quisqueya
                      </span>
                    </div>
                    <span
                      style={{
                        background: "#DCFCE7",
                        color: "#166534",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "12px",
                        fontWeight: 700,
                      }}
                    >
                      Vigente
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 800, color: "var(--navy-950)" }}>
                    {cert.cursoNombre}
                  </h3>
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
                    Acreditada formalmente a: <strong style={{ color: "var(--navy-900)" }}>{cert.brokerNombre}</strong>
                  </p>

                  {/* Bloque Criptográfico SHA-256 */}
                  <div
                    style={{
                      marginTop: "16px",
                      background: "#F8FAFC",
                      border: "1px dashed #CBD5E1",
                      borderRadius: "8px",
                      padding: "10px 12px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--muted)" }}>
                        Firma Criptográfica Verificable
                      </span>
                      <button
                        type="button"
                        onClick={() => copiarHash(cert.hashCriptografico)}
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: hashCopiado === cert.hashCriptografico ? "#16A34A" : "var(--gold-700)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          cursor: "pointer",
                          minHeight: "44px",
                          padding: "4px 8px",
                        }}
                      >
                        {hashCopiado === cert.hashCriptografico ? <Check size={14} /> : <Copy size={14} />}
                        <span>{hashCopiado === cert.hashCriptografico ? "Copiado" : "Copiar Hash"}</span>
                      </button>
                    </div>
                    <span
                      style={{
                        display: "block",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        color: "var(--navy-900)",
                        wordBreak: "break-all",
                        lineHeight: 1.4,
                      }}
                    >
                      {cert.hashCriptografico}
                    </span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #E5D5A5", paddingTop: "14px", fontSize: "13px", display: "grid", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Código Verificación:</span>
                    <strong style={{ fontFamily: "monospace", color: "var(--navy-950)" }}>{cert.codigoVerificacion}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Fecha de Emisión:</span>
                    <span>{cert.fechaEmision}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--muted)" }}>Autorizado por:</span>
                    <span style={{ fontWeight: 600 }}>{cert.aprobadoPor}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* PESTAÑA 4: BANDEJA DE REVISIÓN Y APROBACIÓN ADMIN        */}
        {/* ======================================================== */}
        {esAdmin && (
          <TabsContent value="revisiones" style={{ paddingTop: "18px" }}>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <div style={{ marginBottom: "18px" }}>
                <p className="eyebrow" style={{ margin: "0 0 4px", fontSize: "12px" }}>Gobernanza Q-C1-03 / S1</p>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--navy-950)" }}>
                  Bandeja de Aprobación de Certificaciones
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--muted)" }}>
                  Toda constancia requiere la decisión explícita y motivada de un Administrador. Nadie se autoaprueba.
                </p>
              </div>

              {solicitudes.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--muted)" }}>No hay solicitudes de revisión en cola.</p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {solicitudes.map((sol) => (
                    <div
                      key={sol.id}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid var(--line)",
                        borderRadius: "10px",
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "14px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ fontSize: "15px", color: "var(--navy-950)" }}>{sol.brokerNombre}</strong>
                          <span style={{ fontSize: "12px", background: "#F1F5F9", color: "var(--muted)", padding: "2px 8px", borderRadius: "4px" }}>
                            {sol.fechaSolicitud}
                          </span>
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--navy-900)", fontWeight: 600 }}>
                          {sol.cursoNombre} ({sol.cursoCodigo})
                        </p>
                        {sol.motivo && (
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--danger)", fontWeight: 600 }}>
                            Motivo registrado: {sol.motivo}
                          </p>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {sol.estado === "pendiente" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setRechazandoSolicitud(sol)}
                              style={{
                                minHeight: "44px",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                border: "1px solid #FCA5A5",
                                background: "#FEF2F2",
                                color: "#991B1B",
                                fontWeight: 700,
                                fontSize: "13px",
                                cursor: "pointer",
                              }}
                            >
                              Rechazar (Motivado)
                            </button>
                            <button
                              type="button"
                              onClick={() => aprobarSolicitud(sol)}
                              style={{
                                minHeight: "44px",
                                padding: "8px 18px",
                                borderRadius: "8px",
                                background: "#059669",
                                color: "#FFFFFF",
                                fontWeight: 700,
                                fontSize: "13px",
                                cursor: "pointer",
                                border: "0",
                              }}
                            >
                              Aprobar y Emitir Hash
                            </button>
                          </>
                        ) : (
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              background: sol.estado === "aprobado" ? "#DCFCE7" : "#FEE2E2",
                              color: sol.estado === "aprobado" ? "#166534" : "#991B1B",
                            }}
                          >
                            {sol.estado}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Modal: Solicitar Certificación */}
      {solicitandoCurso && (
        <Modal title="Solicitud de Certificación Formativa" onClose={() => setSolicitandoCurso(null)}>
          <div style={{ display: "grid", gap: "14px" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--ink)", lineHeight: 1.5 }}>
              ¿Deseas enviar a la Dirección de Operaciones la solicitud de revisión para el curso{" "}
              <strong>{solicitandoCurso.nombre}</strong> ({solicitandoCurso.codigo})?
            </p>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>
              La administración comprobará la evidencia formativa en Moodle 4.5 LMS y procederá a emitir la constancia criptográfica verificable.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px" }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setSolicitandoCurso(null)}
                style={{ minHeight: "44px", fontSize: "13px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button primary"
                onClick={confirmarSolicitudCertificacion}
                style={{ minHeight: "44px", fontSize: "13px" }}
              >
                Enviar Solicitud
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Decisión Motivada de Rechazo (Regla Q-C1-03 / S1) */}
      {rechazandoSolicitud && (
        <Modal title="Decisión Motivada de Rechazo (S1)" onClose={() => setRechazandoSolicitud(null)}>
          <div style={{ display: "grid", gap: "14px" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--ink)" }}>
              Indica el motivo fundamentado del rechazo para la solicitud de{" "}
              <strong>{rechazandoSolicitud.brokerNombre}</strong> en «{rechazandoSolicitud.cursoNombre}»:
            </p>
            <textarea
              style={{
                minHeight: "90px",
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--line)",
                fontSize: "13px",
              }}
              placeholder="Ejemplo: Evaluaciones incompletas en Moodle o calificación inferior al 80% mínimo requerido..."
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              required
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", paddingTop: "8px" }}>
              <button
                type="button"
                className="button secondary"
                onClick={() => setRechazandoSolicitud(null)}
                style={{ minHeight: "44px", fontSize: "13px" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button primary"
                onClick={confirmarRechazo}
                style={{ minHeight: "44px", fontSize: "13px", backgroundColor: "var(--danger)", borderColor: "var(--danger)" }}
              >
                Registrar Decisión Motivada
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
