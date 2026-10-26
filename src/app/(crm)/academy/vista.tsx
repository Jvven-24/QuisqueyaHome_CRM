"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {filtrarBiblioteca} from "./_ui/biblioteca";
import {
  AlertTriangle,
  Award,
  BookOpen,
  BookPlus,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  ExternalLink,
  FileCheck,
  Lock,
  Pencil,
  RefreshCw,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  WifiOff,
  XCircle,
} from "lucide-react";
import type {
  ChecklistItemAcademy,
  EstadoConstanciaAcademy,
  EstadoSolicitudAcademy,
  ResumenProgresoAcademy,
  TipoContenidoAcademy,
} from "@/application/academy/puertos";
import type { CursoLms, EstadoLms } from "@/application/aprendizaje/puertos";

export type ItemAcademySerializado = {
  id: number;
  title: string;
  itemType: TipoContenidoAcademy;
  description: string | null;
  durationMinutes: number | null;
  videoUrl: string | null;
  position: number;
  category: string;
  progressPercent: number;
  isCompleted: boolean;
  completedAt: string | null;
  checklistItems: ChecklistItemAcademy[];
};

export type EvidenciaLmsSerializada = {
  usuarioId: number;
  moodleUserId?: number;
  cursoId: string | number;
  cursoCodigo?: string;
  completado: boolean;
  calificacion?: number;
  notaMinima?: number;
  progresoPorcentaje: number;
  actividadesCompletadas?: number;
  actividadesTotales?: number;
  sincronizadoEn: string;
  origen: "moodle_local" | "legacy_local";
};

export type CursoAsignadoSerializado = CursoLms & {
  matriculado: boolean;
  evidencia: EvidenciaLmsSerializada | null;
};

export type SolicitudRevisionSerializada = {
  id: number;
  publicId: string;
  brokerId: number;
  brokerNombre: string;
  brokerEmail: string;
  courseCode: string;
  courseName: string;
  moodleCourseId: number;
  progressPercent: number;
  gradePercent: number | null;
  evidenceHash: string;
  evidencePayload: Record<string, unknown>;
  status: EstadoSolicitudAcademy;
  decisionBy: number | null;
  decisionByNombre: string | null;
  decisionReason: string | null;
  decidedAt: string | null;
  createdAt: string;
};

export type ConstanciaSerializada = {
  id: number;
  publicId: string;
  reviewRequestId: number;
  brokerId: number;
  brokerNombre: string;
  brokerEmail: string;
  courseCode: string;
  courseName: string;
  verificationCode: string;
  cryptographicHash: string;
  evidenceSnapshot: Record<string, unknown>;
  approvedBy: number;
  approvedByNombre: string;
  status: EstadoConstanciaAcademy;
  revokedBy: number | null;
  revokedReason: string | null;
  revokedAt: string | null;
  issuedAt: string;
};

interface AcademyVistaProps {
  initialContenidos: ItemAcademySerializado[];
  initialResumen: ResumenProgresoAcademy;
  saludLms: EstadoLms;
  cursosAsignados: CursoAsignadoSerializado[];
  initialSolicitudes: SolicitudRevisionSerializada[];
  initialConstancias: ConstanciaSerializada[];
  proyectosAsignados: Array<{ id: number; name: string; zone: string | null }>;
  moodleUserId: number | null;
  rol: string;
  usuarioId: number;
  usuarioNombre: string;
  usuarioEmail: string;
}

type TabActiva = "cursos" | "checklists" | "constancias";

export function AcademyVista({
  initialContenidos,
  initialResumen,
  saludLms,
  cursosAsignados,
  initialSolicitudes,
  initialConstancias,
  proyectosAsignados,
  moodleUserId,
  rol,
  usuarioId,
  usuarioNombre,
  usuarioEmail,
}: AcademyVistaProps) {
  const esAdmin = rol === "admin";
  const [busquedaCurso,setBusquedaCurso]=useState("");
  const [categoriaCurso,setCategoriaCurso]=useState("");
  const [soloMatriculados,setSoloMatriculados]=useState(false);
  const cursosVisibles=filtrarBiblioteca(cursosAsignados,busquedaCurso,categoriaCurso,soloMatriculados);
  const [tabActiva, setTabActiva] = useState<TabActiva>("cursos");
  const [contenidos, setContenidos] = useState<ItemAcademySerializado[]>(initialContenidos);
  const [resumen, setResumen] = useState<ResumenProgresoAcademy>(initialResumen);
  const [solicitudes, setSolicitudes] = useState<SolicitudRevisionSerializada[]>(initialSolicitudes);
  const [constancias, setConstancias] = useState<ConstanciaSerializada[]>(initialConstancias);

  const [cargandoAccion, setCargandoAccion] = useState<string | null>(null);
  const [errorUi, setErrorUi] = useState<string | null>(null);
  const [exitoUi, setExitoUi] = useState<string | null>(null);
  const [sinConexionRed, setSinConexionRed] = useState<boolean>(false);
  const [motivoPorSolicitud, setMotivoPorSolicitud] = useState<Record<number, string>>({});
  const [motivoPorConstancia, setMotivoPorConstancia] = useState<Record<number, string>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSinConexionRed(!window.navigator.onLine);
    const onOffline = () => setSinConexionRed(true);
    const onOnline = () => setSinConexionRed(false);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const promedioAvanceLms = useMemo(() => {
    if (cursosAsignados.length === 0) return 0;
    const suma = cursosAsignados.reduce(
      (acc, c) => acc + (c.evidencia?.progresoPorcentaje ?? 0),
      0,
    );
    return Math.round(suma / cursosAsignados.length);
  }, [cursosAsignados]);

  const constanciasVigentes = useMemo(
    () => constancias.filter((c) => c.status === "vigente").length,
    [constancias],
  );

  const solicitudesPendientes = useMemo(
    () => solicitudes.filter((s) => s.status === "pendiente").length,
    [solicitudes],
  );

  async function solicitarRevisionCurso(codigoCurso: string) {
    setErrorUi(null);
    setExitoUi(null);
    setCargandoAccion(`solicitar-${codigoCurso}`);
    try {
      const res = await fetch("/api/academy/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseCode: codigoCurso }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo registrar la solicitud de revisión.");
      }
      const nueva: SolicitudRevisionSerializada = data.solicitud;
      setSolicitudes((prev) => {
        const filtradas = prev.filter((s) => s.id !== nueva.id);
        return [nueva, ...filtradas];
      });
      setExitoUi(
        `Solicitud de revisión registrada para ${nueva.courseCode} (avance verificado: ${nueva.progressPercent} % · hash SHA-256: ${nueva.evidenceHash.slice(0, 12)}…).`,
      );
      setTabActiva("constancias");
    } catch (err) {
      setErrorUi(err instanceof Error ? err.message : "Error de red al solicitar revisión.");
    } finally {
      setCargandoAccion(null);
    }
  }

  async function decidirSolicitud(solicitudId: number, decision: "aprobado" | "rechazado") {
    setErrorUi(null);
    setExitoUi(null);
    const motivo =
      (motivoPorSolicitud[solicitudId] || "").trim() ||
      (decision === "aprobado"
        ? "Evidencia de Moodle verificada conforme al estándar de Quisqueya Academy."
        : "No alcanza el 80 % mínimo requerido en la evaluación de Moodle.");

    setCargandoAccion(`decidir-${solicitudId}`);
    try {
      const res = await fetch("/api/academy/revisiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitudId,
          decision,
          motivo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo registrar la decisión administrativa.");
      }

      const actualizada: SolicitudRevisionSerializada = data.solicitud;
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === actualizada.id ? actualizada : s)),
      );

      if (data.constancia) {
        const cert: ConstanciaSerializada = data.constancia;
        setConstancias((prev) => [cert, ...prev.filter((c) => c.id !== cert.id)]);
        setExitoUi(
          `Constancia emitida (${cert.verificationCode}) con huella SHA-256 en servidor: ${cert.cryptographicHash.slice(0, 16)}…`,
        );
      } else {
        setExitoUi(`Solicitud #${actualizada.id} marcada como rechazada y registrada en auditoría.`);
      }
    } catch (err) {
      setErrorUi(err instanceof Error ? err.message : "Error al procesar la decisión.");
    } finally {
      setCargandoAccion(null);
    }
  }

  async function revocarConstancia(constanciaId: number) {
    setErrorUi(null);
    setExitoUi(null);
    const motivo =
      (motivoPorConstancia[constanciaId] || "").trim() ||
      "Revocada por actualización del programa normativo CONFOTUR / PLAFT.";

    setCargandoAccion(`revocar-${constanciaId}`);
    try {
      const res = await fetch("/api/academy/revisiones", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          constanciaId,
          motivo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo revocar la constancia.");
      }
      const actualizada: ConstanciaSerializada = data.constancia;
      setConstancias((prev) =>
        prev.map((c) => (c.id === actualizada.id ? actualizada : c)),
      );
      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === actualizada.reviewRequestId ? { ...s, status: "revocado" } : s,
        ),
      );
      setExitoUi(
        `Constancia ${actualizada.verificationCode} revocada y registrada en audit_log.`,
      );
    } catch (err) {
      setErrorUi(err instanceof Error ? err.message : "Error al revocar la constancia.");
    } finally {
      setCargandoAccion(null);
    }
  }

  async function alternarPasoChecklist(itemId: number, stepId: number, actual: boolean) {
    setErrorUi(null);
    setExitoUi(null);
    const nuevoEstado = !actual;
    setCargandoAccion(`step-${stepId}`);
    try {
      const res = await fetch(`/api/academy/checklist/${stepId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: nuevoEstado }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo actualizar el paso del checklist.");
      }

      setContenidos((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const nuevosPasos = item.checklistItems.map((p) =>
            p.id === stepId ? { ...p, isCompleted: nuevoEstado } : p,
          );
          const completados = nuevosPasos.filter((p) => p.isCompleted).length;
          const pct =
            nuevosPasos.length > 0
              ? Math.round((completados / nuevosPasos.length) * 100)
              : item.progressPercent;
          return {
            ...item,
            checklistItems: nuevosPasos,
            progressPercent: pct,
            isCompleted: pct === 100,
          };
        }),
      );
      setResumen((prev) => ({
        ...prev,
        percent: Math.min(100, prev.percent),
      }));
      setExitoUi("Progreso de checklist guardado en base de datos.");
    } catch (err) {
      setErrorUi(
        err instanceof Error ? err.message : "No fue posible guardar el cambio del checklist.",
      );
    } finally {
      setCargandoAccion(null);
    }
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Encabezado ejecutivo con identidad real y enlaces a Moodle / Administración UI-066 */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Quisqueya Academy · LMS Inmobiliario
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                Rol: <strong className="uppercase">{rol}</strong>
              </span>
              {moodleUserId ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Enlazado con Moodle (ID #{moodleUserId})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-medium text-amber-800">
                  Sin enlace externo en Moodle
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Ruta de Formación y Certificación — {usuarioNombre}
            </h1>
            <p className="text-sm text-slate-600">
              {usuarioEmail ? `${usuarioEmail} · ` : ""}
              Moodle 4.5 LTS aporta el avance real y las calificaciones de cuestionarios; el CRM
              gobierna la revisión administrativa y las constancias con huella SHA-256 (Regla Q-C1-03).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {esAdmin ? (
              <>
                <a
                  href={saludLms.urlCrearCurso || `${saludLms.url}/course/edit.php?category=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <BookPlus className="w-4 h-4 text-amber-600" />
                  <span>Crear curso en Moodle</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
                <Link
                  href="/academy/administracion"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>Administración de Cursos y Matrículas (UI-066)</span>
                </Link>
              </>
            ) : (
              <div
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-600"
                title="Creación de cursos y aprobación de constancias reservadas al rol Administrador"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Vista de asesor (Aprobación reservada a Administración)</span>
              </div>
            )}
          </div>
        </div>

        {/* Proyectos asignados al broker en el CRM */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            Proyectos asignados en CRM:
          </span>
          {proyectosAsignados.length > 0 ? (
            proyectosAsignados.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800"
              >
                {p.name}
                {p.zone ? <span className="text-slate-500">({p.zone})</span> : null}
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">
              Sin proyectos asignados directamente a este usuario.
            </span>
          )}
        </div>
      </div>

      {/* Estado Sin Conexión (Red del navegador o Moodle local caído) */}
      {(sinConexionRed || !saludLms.disponible) && (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 flex items-start gap-3 text-amber-950"
        >
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm space-y-1">
            <p className="font-semibold">
              {sinConexionRed
                ? "Sin conexión de red en el navegador"
                : "Modo degradado: Instancia local de Moodle LMS sin conexión"}
            </p>
            <p className="text-amber-800">
              {sinConexionRed
                ? "Verifica tu conexión local antes de enviar solicitudes de revisión."
                : `${saludLms.mensaje || "No se pudo contactar a Moodle en 127.0.0.1:9330."} Las constancias y solicitudes existentes en el CRM siguen disponibles.`}
            </p>
          </div>
        </div>
      )}

      {/* Estado de Error */}
      {errorUi && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start justify-between gap-3 text-red-900"
        >
          <div className="flex items-start gap-2.5 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Error en la operación de Academy</p>
              <p className="text-red-800 mt-0.5">{errorUi}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorUi(null)}
            className="min-h-[36px] px-2.5 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Estado de Éxito */}
      {exitoUi && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start justify-between gap-3 text-emerald-950"
        >
          <div className="flex items-start gap-2.5 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Operación completada</p>
              <p className="text-emerald-800 mt-0.5">{exitoUi}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExitoUi(null)}
            className="min-h-[36px] px-2.5 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Tarjetas de métricas reales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Cursos Asignados (Moodle)</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{cursosAsignados.length}</p>
          <p className="mt-1 text-xs text-slate-600">
            Avance medio LMS: <strong>{promedioAvanceLms} %</strong>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Estado LMS (Moodle 4.5)</p>
          <p className="mt-1 text-sm font-bold text-slate-900 truncate">{saludLms.version}</p>
          <p className="mt-1 text-xs text-slate-600 truncate">
            {saludLms.disponible ? "Conectado a 127.0.0.1:9330" : "Sin conexión con LMS"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Solicitudes en Revisión</p>
          <p className="mt-1 text-2xl font-bold text-amber-700">{solicitudesPendientes}</p>
          <p className="mt-1 text-xs text-slate-600">
            Total histórico: {solicitudes.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Constancias Vigentes (SHA-256)</p>
          <p className="mt-1 text-2xl font-bold text-emerald-700">{constanciasVigentes}</p>
          <p className="mt-1 text-xs text-slate-600">
            Emitidas por Administración en CRM
          </p>
        </div>
      </div>

      {/* Navegación por pestañas alcanzable a 320 px (G4-09) */}
      <div
        role="tablist"
        aria-label="Secciones de Quisqueya Academy"
        className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 rounded-xl bg-slate-100 p-1.5 overflow-x-auto"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === "cursos"}
          onClick={() => setTabActiva("cursos")}
          className={`flex-1 min-w-[140px] min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
            tabActiva === "cursos"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span>Cursos en Moodle ({cursosAsignados.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === "constancias"}
          onClick={() => setTabActiva("constancias")}
          className={`flex-1 min-w-[140px] min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
            tabActiva === "constancias"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          <span>
            Revisiones y Constancias ({solicitudes.length + constancias.length})
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === "checklists"}
          onClick={() => setTabActiva("checklists")}
          className={`flex-1 min-w-[140px] min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
            tabActiva === "checklists"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ClipboardCheck className="w-4 h-4 shrink-0" />
          <span>Checklists Operativos ({contenidos.length})</span>
        </button>
      </div>

      {tabActiva === "cursos" && <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap gap-3"><label className="grid gap-1 text-sm">Buscar curso<input className="min-h-11 rounded border border-slate-300 p-2" type="search" value={busquedaCurso} onChange={event=>setBusquedaCurso(event.target.value)}/></label><label className="grid gap-1 text-sm">Categoría<select className="min-h-11 rounded border border-slate-300 p-2" value={categoriaCurso} onChange={event=>setCategoriaCurso(event.target.value)}><option value="">Todas las categorías</option>{Array.from(new Set(cursosAsignados.map(c=>c.categoria))).map(c=><option key={c}>{c}</option>)}</select></label><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={soloMatriculados} onChange={event=>setSoloMatriculados(event.target.checked)}/>Sólo matriculados</label></div><p className="mt-2 text-sm text-slate-600">La evidencia procede del LMS; completar un curso no emite una constancia automáticamente. La decisión independiente permanece en el CRM.</p>{cursosAsignados.length>0&&cursosVisibles.length===0&&<p role="status">Sin cursos para estos filtros. Limpia la búsqueda o cambia categoría.</p>}</section>}
      {/* PESTAÑA 1: Cursos asignados en Moodle */}
      {tabActiva === "cursos" && (
        <div className="space-y-4">
          {cursosAsignados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
              <h2 className="text-base font-bold text-slate-900">
                No hay cursos asignados disponibles en este momento
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                {saludLms.disponible
                  ? "Todavía no tienes cursos matriculados en Quisqueya Academy LMS."
                  : "La instancia local de Moodle no está accesible en 127.0.0.1:9330."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {cursosVisibles.map((curso) => {
                const ev = curso.evidencia;
                const avance = ev?.progresoPorcentaje;
                const calificacion = ev?.calificacion;
                const notaMinima = ev?.notaMinima ?? curso.notaMinima;
                const solicitudExistente = solicitudes.find(
                  (s) =>
                    s.courseCode === curso.codigo &&
                    s.brokerId === usuarioId &&
                    (s.status === "pendiente" || s.status === "aprobado"),
                );
                const constanciaVigente = constancias.find(
                  (c) =>
                    c.courseCode === curso.codigo &&
                    c.brokerId === usuarioId &&
                    c.status === "vigente",
                );

                return (
                  <div
                    key={String(curso.id)}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-slate-900 px-2.5 py-0.5 text-xs font-mono font-semibold text-amber-300">
                            {curso.codigo}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {curso.categoria}
                          </span>
                          <span className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                            Nota mínima: {notaMinima == null ? "Sin configurar" : `${notaMinima} %`}
                          </span>
                          {curso.matriculado && (
                            <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              Matriculado en Moodle
                            </span>
                          )}
                        </div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900">
                          {curso.nombre}
                        </h2>
                        {curso.resumen && (
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            {curso.resumen}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {esAdmin && (
                          <a
                            href={
                              curso.urlEdicion ||
                              `${saludLms.url}/course/edit.php?id=${curso.id}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5 text-slate-600" />
                            <span>Editar curso en Moodle</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          </a>
                        )}

                        {curso.urlLanzamiento && (
                          <a
                            href={curso.urlLanzamiento}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                          >
                            <span>Continuar curso en Moodle</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                          </a>
                        )}

                        {constanciaVigente ? (
                          <span className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-800">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            Certificado ({constanciaVigente.verificationCode})
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={cargandoAccion === `solicitar-${curso.codigo}`}
                            onClick={() => solicitarRevisionCurso(curso.codigo)}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50 transition-colors"
                          >
                            {cargandoAccion === `solicitar-${curso.codigo}` ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            <span>
                              {solicitudExistente?.status === "pendiente"
                                ? "Actualizar solicitud con evidencia Moodle"
                                : "Solicitar revisión de constancia"}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Barra de progreso y evidencia leída de Moodle */}
                    <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-4 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-slate-700">
                          Avance verificado en Moodle:{" "}
                          <strong className="text-slate-900">{avance == null ? "Sin evidencia sincronizada" : `${avance} %`}</strong>
                          {ev?.actividadesTotales !== undefined && ev.actividadesTotales > 0
                            ? ` (${ev.actividadesCompletadas ?? 0}/${ev.actividadesTotales} actividades)`
                            : ""}
                        </span>
                        <span className="font-semibold text-slate-700">
                          Calificación cuestionario:{" "}
                          <strong
                            className={
                              calificacion !== undefined && notaMinima !== undefined && calificacion >= notaMinima
                                ? "text-emerald-700"
                                : "text-slate-900"
                            }
                          >
                            {calificacion !== undefined && calificacion !== null
                              ? `${calificacion} %`
                              : "Pendiente de intento"}
                          </strong>
                        </span>
                      </div>

                      <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (avance ?? 0) >= 100 ? "bg-emerald-600" : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, avance ?? 0))}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        <span>
                          Estado en Moodle:{" "}
                          {ev?.completado
                            ? "Curso completado en LMS"
                            : "En curso — completa las 4 secciones y aprueba el cuestionario (≥ 80 %)"}
                        </span>
                        {ev?.sincronizadoEn && (
                          <span>
                            Sincronizado:{" "}
                            {new Date(ev.sincronizadoEn).toLocaleTimeString("es-DO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: Revisiones y Constancias Persistidas (Regla Q-C1-03) */}
      {tabActiva === "constancias" && (
        <div className="space-y-6">
          {/* Aviso de gobernanza Q-C1-03 y permiso insuficiente para no-admins */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-700 space-y-1">
              <p className="font-semibold text-slate-900">
                Gobernanza de Certificación Quisqueya Academy (Regla Q-C1-03)
              </p>
              <p>
                Ningún asesor puede autoaprobar su certificación. Al solicitar revisión, el
                servidor captura tu progreso y nota desde Moodle y genera una huella SHA-256. Un
                Administrador distinto revisa la solicitud, aprueba o rechaza con motivo auditado
                en <code>audit_log</code>, y emite la constancia verificable.
              </p>
            </div>
          </div>

          {/* Lista de Solicitudes de Revisión */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Solicitudes de Revisión de Completado ({solicitudes.length})
              </h2>
            </div>

            {solicitudes.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center space-y-1.5">
                <Clock className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">
                  No hay solicitudes de revisión registradas
                </p>
                <p className="text-xs text-slate-500">
                  En la pestaña «Cursos en Moodle», pulsa «Solicitar revisión de constancia» para
                  enviar tu avance de Moodle a revisión administrativa.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {solicitudes.map((sol) => {
                  const esPropia = sol.brokerId === usuarioId;
                  return (
                    <div
                      key={sol.id}
                      className="rounded-xl border border-slate-200 p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-mono text-amber-300">
                              {sol.courseCode}
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              {sol.courseName}
                            </span>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                sol.status === "aprobado"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : sol.status === "rechazado" || sol.status === "revocado"
                                    ? "bg-red-50 text-red-800 border border-red-200"
                                    : "bg-amber-50 text-amber-900 border border-amber-200"
                              }`}
                            >
                              {sol.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            Solicitante: <strong>{sol.brokerNombre}</strong> ({sol.brokerEmail}) ·
                            Avance Moodle: <strong>{sol.progressPercent} %</strong> · Nota:{" "}
                            <strong>
                              {sol.gradePercent !== null ? `${sol.gradePercent} %` : "Sin nota"}
                            </strong>
                          </p>
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5 break-all">
                            Huella evidencia SHA-256: {sol.evidenceHash}
                          </p>
                          {sol.decisionReason && (
                            <p className="text-xs text-slate-700 mt-1">
                              Dictamen ({sol.decisionByNombre || "Administración"}):{" "}
                              <em>{sol.decisionReason}</em>
                            </p>
                          )}
                        </div>
                      </div>

                      {sol.status === "pendiente" && esAdmin && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          {esPropia ? (
                            <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              Regla Q-C1-03: No puedes aprobar tu propia solicitud de certificación.
                              Debe decidirla otro Administrador.
                            </p>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                placeholder="Motivo o dictamen de revisión (auditado en audit_log)…"
                                value={motivoPorSolicitud[sol.id] ?? ""}
                                onChange={(e) =>
                                  setMotivoPorSolicitud((prev) => ({
                                    ...prev,
                                    [sol.id]: e.target.value,
                                  }))
                                }
                                className="flex-1 min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                              />
                              <button
                                type="button"
                                disabled={cargandoAccion === `decidir-${sol.id}`}
                                onClick={() => decidirSolicitud(sol.id, "aprobado")}
                                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Aprobar y emitir constancia
                              </button>
                              <button
                                type="button"
                                disabled={cargandoAccion === `decidir-${sol.id}`}
                                onClick={() => decidirSolicitud(sol.id, "rechazado")}
                                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                Rechazar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lista de Constancias Emitidas con Hash SHA-256 */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Constancias Oficiales Verificables ({constancias.length})
            </h2>

            {constancias.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center space-y-1.5">
                <FileCheck className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-sm font-semibold text-slate-800">
                  Aún no hay constancias emitidas
                </p>
                <p className="text-xs text-slate-500">
                  Las constancias aparecen aquí una vez que Administración aprueba una solicitud de
                  revisión y el servidor registra una huella SHA-256 de la constancia.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {constancias.map((cert) => (
                  <div
                    key={cert.id}
                    className="rounded-xl border border-slate-200 p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-950">
                          {cert.verificationCode}
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {cert.courseName} ({cert.courseCode})
                        </span>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          cert.status === "vigente"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                      >
                        {cert.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Titular: <strong>{cert.brokerNombre}</strong> · Aprobada por:{" "}
                      <strong>{cert.approvedByNombre}</strong> · Fecha:{" "}
                      {new Date(cert.issuedAt).toLocaleDateString("es-DO")}
                    </p>

                    <p className="text-[11px] font-mono text-slate-500 break-all">
                      Firma SHA-256 servidor: {cert.cryptographicHash}
                    </p>

                    {cert.revokedReason && (
                      <p className="text-xs text-red-700">
                        Motivo de revocación: <em>{cert.revokedReason}</em>
                      </p>
                    )}

                    {cert.status === "vigente" && esAdmin && cert.brokerId !== usuarioId && (
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Motivo de revocación (auditado)…"
                          value={motivoPorConstancia[cert.id] ?? ""}
                          onChange={(e) =>
                            setMotivoPorConstancia((prev) => ({
                              ...prev,
                              [cert.id]: e.target.value,
                            }))
                          }
                          className="flex-1 min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-900"
                        />
                        <button
                          type="button"
                          disabled={cargandoAccion === `revocar-${cert.id}`}
                          onClick={() => revocarConstancia(cert.id)}
                          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Revocar constancia
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PESTAÑA 3: Checklists operativos persistidos en DB (sin IDs negativos falsos) */}
      {tabActiva === "checklists" && (
        <div className="space-y-4">
          {contenidos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center space-y-2">
              <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto" />
              <h2 className="text-base font-bold text-slate-900">
                No hay checklists operativos registrados en la tabla local
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                La ruta formativa principal se cursa directamente en Moodle LMS en la pestaña
                «Cursos en Moodle» ({cursosAsignados.length} curso(s) activo(s)). Cuando se
                publiquen checklists adicionales en <code>academy_items</code>, aparecerán aquí
                con avance general ({resumen.completedItems}/{resumen.totalItems}).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contenidos.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-amber-800">
                        {item.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                      {item.description && (
                        <p className="text-xs text-slate-600 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {item.progressPercent} %
                    </span>
                  </div>

                  {item.checklistItems.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {item.checklistItems.map((paso) => (
                        <button
                          key={paso.id}
                          type="button"
                          disabled={cargandoAccion === `step-${paso.id}`}
                          onClick={() =>
                            alternarPasoChecklist(item.id, paso.id, paso.isCompleted)
                          }
                          className="w-full min-h-[44px] flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 text-left text-xs sm:text-sm hover:bg-slate-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={paso.isCompleted}
                            readOnly
                            className="h-4 w-4 rounded border-slate-300 text-amber-600"
                          />
                          <span
                            className={
                              paso.isCompleted
                                ? "line-through text-slate-400"
                                : "text-slate-800 font-medium"
                            }
                          >
                            {paso.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
