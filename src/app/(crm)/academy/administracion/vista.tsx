"use client";
import { Checkbox } from "@/components/ui/checkbox";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {cursoSeleccionadoValido} from "../_ui/biblioteca";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BookPlus,
  CheckCircle2,
  ExternalLink,
  Lock,
  Pencil,
  RefreshCw,
  ShieldAlert,
  UserPlus,
  Users,
  WifiOff,
  XCircle,
} from "lucide-react";
import type { UsuarioCrmAcademy } from "@/application/academy/puertos";
import {
  constanciaAcreditaFormacion,
  estadoVigenciaConstancia,
  etiquetaEstadoConstancia,
} from "@/domain/academy-vigencia";
import type {
  CategoriaLms,
  CursoLms,
  EstadoLms,
  ProgresoPersonaCursoLms,
} from "@/application/aprendizaje/puertos";
import type {
  ConstanciaSerializada,
  SolicitudRevisionSerializada,
} from "../vista";

interface AcademyAdministracionVistaProps {
  tienePermisoAdmin: boolean;
  usuarioId: number;
  usuarioNombre: string;
  rol: string;
  saludLms: EstadoLms;
  initialCategorias: CategoriaLms[];
  initialCursos: CursoLms[];
  initialCursoActivoId: number | null;
  initialProgresoPersonas: ProgresoPersonaCursoLms[];
  initialUsuariosCrm: UsuarioCrmAcademy[];
  initialSolicitudes: SolicitudRevisionSerializada[];
  initialConstancias: ConstanciaSerializada[];
}

type TabAdmin = "progreso" | "crear" | "matricular" | "revisiones";

export function AcademyAdministracionVista({
  tienePermisoAdmin,
  usuarioId,
  usuarioNombre,
  rol,
  saludLms,
  initialCategorias,
  initialCursos,
  initialCursoActivoId,
  initialProgresoPersonas,
  initialUsuariosCrm,
  initialSolicitudes,
  initialConstancias,
}: AcademyAdministracionVistaProps) {
  const [tabActiva, setTabActiva] = useState<TabAdmin>("progreso");
  const [categorias] = useState<CategoriaLms[]>(initialCategorias);
  const [cursos, setCursos] = useState<CursoLms[]>(initialCursos);
  const [cursoActivoId, setCursoActivoId] = useState<number | null>(initialCursoActivoId);
  const [progresoPersonas, setProgresoPersonas] =
    useState<ProgresoPersonaCursoLms[]>(initialProgresoPersonas);
  const [usuariosCrm] = useState<UsuarioCrmAcademy[]>(initialUsuariosCrm);
  const [solicitudes, setSolicitudes] =
    useState<SolicitudRevisionSerializada[]>(initialSolicitudes);
  const [constancias, setConstancias] =
    useState<ConstanciaSerializada[]>(initialConstancias);

  // Estados de formulario Crear Curso
  const [nombreCurso, setNombreCurso] = useState("");
  const [codigoCurso, setCodigoCurso] = useState("");
  const [categoriaIdCurso, setCategoriaIdCurso] = useState<number>(
    initialCategorias[0]?.id ?? 0,
  );
  const [notaMinimaCurso, setNotaMinimaCurso] = useState<number>(80);
  const [resumenCurso, setResumenCurso] = useState("");

  // Estados de formulario Matricular
  const [cursoMatriculaId, setCursoMatriculaId] = useState<number>(
    initialCursoActivoId ?? (typeof initialCursos[0]?.id === "number" ? initialCursos[0].id : 0),
  );
  const [modoMatricula, setModoMatricula] = useState<"rol" | "persona">("rol");
  const [rolMatricula, setRolMatricula] = useState<"broker" | "assistant" | "admin">("broker");
  const [rolCursoMoodle, setRolCursoMoodle] = useState<"student" | "editingteacher">("student");
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<number[]>([]);

  // Estados UX (carga, error, éxito, sin conexión)
  const [cargando, setCargando] = useState<string | null>(null);
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

  const cursoActivo = useMemo(
    () => cursos.find((c) => Number(c.id) === Number(cursoActivoId)) ?? null,
    [cursos, cursoActivoId],
  );

  // Estado 6: Permiso insuficiente cuando un usuario sin rol admin visita /academy/administracion
  if (!tienePermisoAdmin) {
    return (
      <div className="space-y-6 pb-10">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-3">
            <Lock className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                Permiso insuficiente · Rol actual: {rol}
              </span>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                Administración de Quisqueya Academy reservada a Administradores
              </h1>
              <p className="text-xs sm:text-sm text-slate-700">
                Hola, <strong>{usuarioNombre}</strong>. La creación de cursos en Moodle, la
                matrícula masiva de asesores y la aprobación de constancias bajo la regla Q-C1-03
                requieren alcance administrativo completo (<code>academy:edit</code> con alcance{" "}
                <code>all</code>).
              </p>
            </div>
          </div>
          <div>
            <Link
              href="/academy"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a mi ruta formativa en Academy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  async function cambiarCursoProgreso(nuevoCursoId: number) {
    setCursoActivoId(nuevoCursoId);
    setErrorUi(null);
    setCargando("progreso");
    try {
      const res = await fetch(`/api/academy/cursos?cursoId=${nuevoCursoId}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo consultar el progreso del curso.");
      }
      setProgresoPersonas(data.progresoPersonas ?? []);
    } catch (err) {
      setErrorUi(
        err instanceof Error ? err.message : "Error al cargar el progreso por persona.",
      );
    } finally {
      setCargando(null);
    }
  }

  async function manejarCrearCurso(e: React.FormEvent) {
    e.preventDefault();
    setErrorUi(null);
    setExitoUi(null);
    setCargando("crear-curso");
    try {
      const catObj = categorias.find((c) => c.id === categoriaIdCurso);
      if (!catObj) throw new Error("Selecciona una categoría real de Moodle antes de crear el curso.");
      const res = await fetch("/api/academy/cursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreCurso,
          codigo: codigoCurso,
          resumen: resumenCurso,
          categoriaId: categoriaIdCurso,
          categoriaNombre: catObj?.nombre,
          notaMinima: Number(notaMinimaCurso),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No fue posible crear el curso en Moodle.");
      }
      const nuevo: CursoLms = data.curso;
      setCursos((prev) => [nuevo, ...prev.filter((c) => c.codigo !== nuevo.codigo)]);
      if (typeof nuevo.id === "number") {
        setCursoActivoId(nuevo.id);
        setCursoMatriculaId(nuevo.id);
      }
      setNombreCurso("");
      setCodigoCurso("");
      setResumenCurso("");
      setExitoUi(
        `Curso «${nuevo.nombre}» (${nuevo.codigo}) creado en Moodle LMS (ID #${nuevo.id}) con nota mínima ${nuevo.notaMinima ?? notaMinimaCurso} %.`,
      );
      setTabActiva("matricular");
    } catch (err) {
      setErrorUi(err instanceof Error ? err.message : "Error al crear el curso en Moodle.");
    } finally {
      setCargando(null);
    }
  }

  async function manejarMatricular(e: React.FormEvent) {
    e.preventDefault();
    setErrorUi(null);
    setExitoUi(null);
    if (!cursoSeleccionadoValido(cursoMatriculaId,cursos)) {setErrorUi("Selecciona un curso real del catálogo antes de matricular.");return;}
    if (sinConexionRed) {setErrorUi("Sin conexión. No se solicita una matrícula.");return;}
    setCargando("matricular");
    try {
      const payload =
        modoMatricula === "rol"
          ? {
              cursoId: Number(cursoMatriculaId),
              modo: "rol" as const,
              roleSlug: rolMatricula,
              rolCurso: rolCursoMoodle,
            }
          : {
              cursoId: Number(cursoMatriculaId),
              modo: "persona" as const,
              userIds: usuariosSeleccionados,
              rolCurso: rolCursoMoodle,
            };

      const res = await fetch("/api/academy/matriculas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "No se pudo completar la matrícula en Moodle.");
      }

      setCursoActivoId(Number(cursoMatriculaId));
      setProgresoPersonas(data.progresoPersonas ?? []);
      setExitoUi(
        `Se matricularon ${data.matriculados} usuario(s) del CRM en el curso #${cursoMatriculaId} y se sincronizaron sus vínculos en external_refs.`,
      );
      setTabActiva("progreso");
    } catch (err) {
      setErrorUi(err instanceof Error ? err.message : "Error al matricular usuarios.");
    } finally {
      setCargando(null);
    }
  }

  async function decidirSolicitud(solicitudId: number, decision: "aprobado" | "rechazado") {
    setErrorUi(null);
    setExitoUi(null);
    const motivo =
      (motivoPorSolicitud[solicitudId] || "").trim() ||
      (decision === "aprobado"
        ? "Evidencia de Moodle verificada y aprobada por Administración."
        : "Evidencia insuficiente en cuestionario de Moodle.");

    setCargando(`decidir-${solicitudId}`);
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
        throw new Error(data.error || "No se pudo procesar la decisión.");
      }
      const actualizada: SolicitudRevisionSerializada = data.solicitud;
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === actualizada.id ? actualizada : s)),
      );
      if (data.constancia) {
        const cert: ConstanciaSerializada = data.constancia;
        setConstancias((prev) => [cert, ...prev.filter((c) => c.id !== cert.id)]);
        setExitoUi(
          `Constancia ${cert.verificationCode} emitida con huella SHA-256: ${cert.cryptographicHash.slice(0, 16)}…`,
        );
      } else {
        setExitoUi(`Solicitud #${actualizada.id} rechazada y auditada.`);
      }
    } catch (err) {
      setErrorUi(err instanceof Error ? err.message : "Error al decidir solicitud.");
    } finally {
      setCargando(null);
    }
  }

  async function revocarConstancia(constanciaId: number) {
    setErrorUi(null);
    setExitoUi(null);
    const motivo =
      (motivoPorConstancia[constanciaId] || "").trim() ||
      "Revocada por actualización reglamentaria de Quisqueya Academy.";

    setCargando(`revocar-${constanciaId}`);
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
      setExitoUi(`Constancia ${actualizada.verificationCode} revocada y registrada en audit_log.`);
    } catch (err) {
      setErrorUi(err instanceof Error ? err.message : "Error al revocar constancia.");
    } finally {
      setCargando(null);
    }
  }

  function alternarSeleccionUsuario(id: number) {
    setUsuariosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Encabezado UI-066 con enlaces directos a Crear curso y Editar curso en Moodle */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/academy"
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver a Academy (UI-065)
              </Link>
              <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                UI-066 · Administración LMS Moodle
              </span>
              <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-800">
                Administrador: {usuarioNombre}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Administración de Cursos, Matrículas y Progreso por Persona
            </h1>
            <p className="text-sm text-slate-600">
              Los cursos se crean y editan en Moodle 4.5 LTS; desde el CRM se listan los cursos
              reales, se matriculan usuarios por rol o por persona y se consulta el estado de
              finalización y evidencias para emitir constancias.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={saludLms.urlCrearCurso || `${saludLms.url}/course/edit.php?category=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <BookPlus className="w-4 h-4 text-amber-400" />
              <span>Crear curso en Moodle</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
            </a>

            {cursoActivo && (
              <a
                href={
                  cursoActivo.urlEdicion ||
                  `${saludLms.url}/course/edit.php?id=${cursoActivo.id}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-600" />
                <span>Editar curso en Moodle</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Estado Sin Conexión */}
      {(sinConexionRed || !saludLms.disponible) && (
        <div
          role="status"
          className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3 text-amber-950"
        >
          <WifiOff className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-semibold">
              {sinConexionRed
                ? "Sin conexión de red en el navegador"
                : "Moodle LMS local no disponible"}
            </p>
            <p className="text-amber-800 mt-0.5">
              {saludLms.mensaje ||
                "Verifica que Moodle esté activo en http://127.0.0.1:9330 para crear cursos o matricular."}
            </p>
          </div>
        </div>
      )}

      {/* Estado Error */}
      {errorUi && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start justify-between gap-3 text-red-900"
        >
          <div className="flex items-start gap-2.5 text-xs sm:text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">No se pudo completar la acción</p>
              <p className="text-red-800 mt-0.5">{errorUi}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setErrorUi(null)}
            className="min-h-[44px] px-2.5 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-100"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Estado Éxito */}
      {exitoUi && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start justify-between gap-3 text-emerald-950"
        >
          <div className="flex items-start gap-2.5 text-xs sm:text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Cambio aplicado en Moodle / CRM</p>
              <p className="text-emerald-800 mt-0.5">{exitoUi}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExitoUi(null)}
            className="min-h-[44px] px-2.5 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Pestañas responsivas alcanzables a 320 px */}
      <div
        role="tablist"
        aria-label="Secciones de administración de Academy"
        className="flex flex-nowrap items-center gap-1.5 rounded-xl bg-slate-100 p-1.5 overflow-x-auto scroll-smooth snap-x snap-mandatory overscroll-x-contain"
      >
        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === "progreso"}
          onClick={() => setTabActiva("progreso")}
          className={`snap-start flex-1 min-w-[140px] min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
            tabActiva === "progreso"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4 shrink-0" />
          <span>Progreso por Persona ({progresoPersonas.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === "matricular"}
          onClick={() => setTabActiva("matricular")}
          className={`snap-start flex-1 min-w-[140px] min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
            tabActiva === "matricular"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <UserPlus className="w-4 h-4 shrink-0" />
          <span>Matricular Usuarios</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === "crear"}
          onClick={() => setTabActiva("crear")}
          className={`snap-start flex-1 min-w-[140px] min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
            tabActiva === "crear"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <BookPlus className="w-4 h-4 shrink-0" />
          <span>Catálogo y Autoría Moodle</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={tabActiva === "revisiones"}
          onClick={() => setTabActiva("revisiones")}
          className={`snap-start flex-1 min-w-[140px] min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all ${
            tabActiva === "revisiones"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4 shrink-0" />
          <span>
            Revisiones y Constancias ({solicitudes.length})
          </span>
        </button>
      </div>

      {/* TAB 1: Progreso por persona en vivo desde Moodle */}
      {tabActiva === "progreso" && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Estado de Finalización y Progreso por Persona (Moodle Web Services)
              </h2>
              <p className="text-xs text-slate-600">
                Datos leídos en tiempo real vía <code>core_completion_get_course_completion_status</code>,{" "}
                <code>core_completion_get_activities_completion_status</code> y{" "}
                <code>gradereport_user_get_grade_items</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="select-curso-progreso" className="text-xs font-semibold text-slate-700">
                Curso:
              </label>
              <select
                id="select-curso-progreso"
                value={cursoActivoId ?? ""}
                onChange={(e) => cambiarCursoProgreso(Number(e.target.value))}
                className="min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-900"
              >
                {cursos.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.codigo} — {c.nombre}
                  </option>
                ))}
              </select>

              {cursoActivoId && (
                <button
                  type="button"
                  disabled={cargando === "progreso"}
                  onClick={() => cambiarCursoProgreso(cursoActivoId)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${cargando === "progreso" ? "animate-spin" : ""}`}
                  />
                  <span>Actualizar</span>
                </button>
              )}
            </div>
          </div>

          {cursoActivo && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900">
                  {cursoActivo.nombre} ({cursoActivo.codigo})
                </p>
                <p className="text-slate-600">
                  Categoría: {cursoActivo.categoria} · Nota mínima de aprobación:{" "}
                  <strong>{cursoActivo.notaMinima == null ? "Sin configurar" : `${cursoActivo.notaMinima} %`}</strong>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={
                    cursoActivo.urlEdicion ||
                    `${saludLms.url}/course/edit.php?id=${cursoActivo.id}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-600" />
                  <span>Editar curso en Moodle</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                </a>
                {cursoActivo.urlLanzamiento && (
                  <a
                    href={cursoActivo.urlLanzamiento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                  >
                    <span>Ver curso en Moodle</span>
                    <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  </a>
                )}
              </div>
            </div>
          )}

          {progresoPersonas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-2">
              <Users className="w-7 h-7 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-900">
                No hay personas matriculadas en este curso todavía
              </p>
              <p className="text-xs text-slate-500">
                Usa la pestaña «Matricular Usuarios» para inscribir brokers por rol o por persona.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-3 pr-4">Persona</th>
                    <th className="py-3 px-3">Rol en Moodle</th>
                    <th className="py-3 px-3">Actividades</th>
                    <th className="py-3 px-3">Avance</th>
                    <th className="py-3 px-3">Nota Cuestionario</th>
                    <th className="py-3 pl-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {progresoPersonas.map((p) => (
                    <tr key={p.moodleUserId} className="hover:bg-slate-50/80">
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-slate-900">{p.nombreCompleto}</p>
                        <p className="text-xs text-slate-500">
                          {p.email} · Moodle ID #{p.moodleUserId}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {p.rolCurso === "editingteacher" ? "Profesor editor" : "Estudiante"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {p.actividadesCompletadas} / {p.actividadesTotales}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 min-w-[110px]">
                          <div className="h-2 flex-1 rounded-full bg-slate-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                p.progresoPorcentaje >= 100 ? "bg-emerald-600" : "bg-amber-500"
                              }`}
                              style={{ width: `${p.progresoPorcentaje}%` }}
                            />
                          </div>
                          <span className="font-semibold text-slate-900">
                            {p.progresoPorcentaje} %
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {p.calificacion !== null ? `${p.calificacion} %` : "Sin intentos"}
                      </td>
                      <td className="py-3 pl-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            p.completado
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-900 border border-amber-200"
                          }`}
                        >
                          {p.completado ? "Completado" : "En progreso"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Catálogo de cursos reales de Moodle y enlaces a Crear / Editar curso */}
      {tabActiva === "crear" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Cursos Reales en Moodle 4.5 LTS ({cursos.length})
                </h2>
                <p className="text-xs text-slate-600">
                  Los cursos, sus secciones, lecturas y cuestionarios se crean y editan en Moodle;
                  usa los enlaces directos o registra la ficha base desde aquí.
                </p>
              </div>
              <a
                href={saludLms.urlCrearCurso || `${saludLms.url}/course/edit.php?category=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-400"
              >
                <BookPlus className="w-4 h-4" />
                <span>Crear curso en Moodle</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {cursos.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-500 py-4 text-center">
                No hay cursos listados en Moodle actualmente.
              </p>
            ) : (
              <div className="space-y-3">
                {cursos.map((c) => (
                  <div
                    key={String(c.id)}
                    className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-mono text-amber-300">
                          {c.codigo}
                        </span>
                        <span className="text-sm font-bold text-slate-900">{c.nombre}</span>
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                          Nota mínima: {c.notaMinima == null ? "Sin configurar" : `${c.notaMinima} %`}
                        </span>
                      </div>
                      {c.resumen && <p className="text-xs text-slate-600">{c.resumen}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <a
                        href={c.urlEdicion || `${saludLms.url}/course/edit.php?id=${c.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                      >
                        <Pencil className="w-3.5 h-3.5 text-slate-600" />
                        <span>Editar curso</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      </a>
                      {c.urlLanzamiento && (
                        <a
                          href={c.urlLanzamiento}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          <span>Abrir en Moodle</span>
                          <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={manejarCrearCurso}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4"
          >
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Alta Rápida de Ficha de Curso vía Web Service (<code>core_course_create_courses</code>)
              </h2>
              <p className="text-xs text-slate-600">
                Crea la estructura base del curso en Moodle con seguimiento de finalización
                habilitado para luego editar sus secciones y cuestionarios en Moodle.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="curso-nombre" className="block text-xs font-semibold text-slate-800">
                  Nombre completo del curso *
                </label>
                <input
                  id="curso-nombre"
                  type="text"
                  required
                  minLength={4}
                  placeholder="Ej. Cierre Fiscal CONFOTUR y Fideicomisos en Cap Cana"
                  value={nombreCurso}
                  onChange={(e) => setNombreCurso(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="curso-codigo" className="block text-xs font-semibold text-slate-800">
                  Código corto (shortname en Moodle) *
                </label>
                <input
                  id="curso-codigo"
                  type="text"
                  required
                  minLength={3}
                  placeholder="Ej. QHA-CONFOTUR-2026"
                  value={codigoCurso}
                  onChange={(e) => setCodigoCurso(e.target.value.toUpperCase())}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm font-mono text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="curso-categoria"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Categoría oficial en Moodle *
                </label>
                <select
                  id="curso-categoria"
                  value={categoriaIdCurso}
                  onChange={(e) => setCategoriaIdCurso(Number(e.target.value))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900"
                >
                  {categorias.length > 0 ? (
                    categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nombre} ({cat.codigo})
                      </option>
                    ))
                  ) : (
                    <option value={1}>Formación Comercial e Inmobiliaria</option>
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="curso-nota" className="block text-xs font-semibold text-slate-800">
                  Nota mínima de aprobación (%) *
                </label>
                <input
                  id="curso-nota"
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={notaMinimaCurso}
                  onChange={(e) => setNotaMinimaCurso(Number(e.target.value))}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2 text-xs sm:text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="curso-resumen" className="block text-xs font-semibold text-slate-800">
                Resumen y objetivos de aprendizaje *
              </label>
              <textarea
                id="curso-resumen"
                required
                minLength={10}
                rows={3}
                placeholder="Describe el alcance normativo, comercial y los requisitos de evaluación del curso…"
                value={resumenCurso}
                onChange={(e) => setResumenCurso(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3.5 text-xs sm:text-sm text-slate-900"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={cargando === "crear-curso"}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {cargando === "crear-curso" ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <BookPlus className="w-4 h-4 text-amber-400" />
                )}
                <span>Crear curso en Moodle LMS</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Matricular usuarios del CRM por rol o por persona */}
      {tabActiva === "matricular" && (
        <form
          onSubmit={manejarMatricular}
          className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5"
        >
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Matricular Usuarios del CRM en Curso de Moodle
            </h2>
            <p className="text-xs text-slate-600">
              Sincroniza automáticamente el usuario con Moodle (<code>core_user_create_users</code>)
              y registra su vínculo en <code>external_refs</code> antes de ejecutar{" "}
              <code>enrol_manual_enrol_users</code>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label
                htmlFor="matricula-curso"
                className="block text-xs font-semibold text-slate-800"
              >
                Curso destino en Moodle *
              </label>
              <select
                id="matricula-curso"
                value={cursoMatriculaId}
                onChange={(e) => setCursoMatriculaId(Number(e.target.value))}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900"
              >
                {cursos.map((c) => (
                  <option key={String(c.id)} value={String(c.id)}>
                    {c.codigo} — {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="matricula-modo"
                className="block text-xs font-semibold text-slate-800"
              >
                Modo de asignación *
              </label>
              <select
                id="matricula-modo"
                value={modoMatricula}
                onChange={(e) => setModoMatricula(e.target.value as "rol" | "persona")}
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900"
              >
                <option value="rol">Por rol del CRM (masivo)</option>
                <option value="persona">Por persona (selección individual)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="matricula-rol-moodle"
                className="block text-xs font-semibold text-slate-800"
              >
                Rol dentro del curso en Moodle *
              </label>
              <select
                id="matricula-rol-moodle"
                value={rolCursoMoodle}
                onChange={(e) =>
                  setRolCursoMoodle(e.target.value as "student" | "editingteacher")
                }
                className="w-full min-h-[44px] rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900"
              >
                <option value="student">Estudiante (student)</option>
                <option value="editingteacher">Profesor editor (editingteacher)</option>
              </select>
            </div>
          </div>

          {modoMatricula === "rol" ? (
            <div className="space-y-1.5">
              <label
                htmlFor="matricula-rol-crm"
                className="block text-xs font-semibold text-slate-800"
              >
                Seleccionar rol del CRM a matricular *
              </label>
              <select
                id="matricula-rol-crm"
                value={rolMatricula}
                onChange={(e) =>
                  setRolMatricula(e.target.value as "broker" | "assistant" | "admin")
                }
                className="w-full sm:w-80 min-h-[44px] rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs sm:text-sm text-slate-900"
              >
                <option value="broker">Brokers / Asesores comerciales</option>
                <option value="assistant">Asistentes operativos</option>
                <option value="admin">Administradores</option>
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-800">
                Selecciona las personas del CRM a matricular ({usuariosSeleccionados.length}{" "}
                seleccionada(s)):
              </p>
              <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                {usuariosCrm.map((u) => {
                  const marcado = usuariosSeleccionados.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className="min-h-[44px] flex items-center justify-between gap-3 px-4 py-2.5 text-xs sm:text-sm hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={marcado} onCheckedChange={() => alternarSeleccionUsuario(u.id)} />
                        <div>
                          <span className="font-semibold text-slate-900">{u.fullName}</span>
                          <span className="text-slate-500 ml-2">{u.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700 uppercase">
                          {u.roleSlug}
                        </span>
                        {u.moodleUserId ? (
                          <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-emerald-800">
                            Moodle #{u.moodleUserId}
                          </span>
                        ) : (
                          <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-amber-800">
                            Se creará en Moodle
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={
                cargando === "matricular" ||
                (modoMatricula === "persona" && usuariosSeleccionados.length === 0)
              }
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {cargando === "matricular" ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>Sincronizar y matricular en Moodle</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: Bandeja administrativa de revisión y constancias (Regla Q-C1-03) */}
      {tabActiva === "revisiones" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-700">
              <p className="font-semibold text-slate-900">
                Control de Gobernanza Q-C1-03 y Auditoría Transaccional
              </p>
              <p className="mt-0.5">
                Toda aprobación emite una constancia en <code>academy_certificates</code> con hash
                SHA-256 calculado en el servidor y registra la decisión en <code>audit_log</code>.
                El sistema bloquea en aplicación y base de datos que un usuario apruebe su propia
                solicitud.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Solicitudes Recibidas ({solicitudes.length})
            </h2>

            {solicitudes.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-500 py-4 text-center">
                No hay solicitudes de revisión registradas en este momento.
              </p>
            ) : (
              <div className="space-y-3">
                {solicitudes.map((sol) => {
                  const esPropia = sol.brokerId === usuarioId;
                  return (
                    <div
                      key={sol.id}
                      className="rounded-xl border border-slate-200 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-mono text-amber-300">
                            {sol.courseCode}
                          </span>
                          <span className="text-sm font-bold text-slate-900">
                            {sol.brokerNombre} ({sol.brokerEmail})
                          </span>
                        </div>
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

                      <p className="text-xs text-slate-600">
                        Curso: <strong>{sol.courseName}</strong> · Avance Moodle:{" "}
                        <strong>{sol.progressPercent} %</strong> · Calificación:{" "}
                        <strong>
                          {sol.gradePercent !== null ? `${sol.gradePercent} %` : "Sin calificación"}
                        </strong>
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 break-all">
                        Evidencia SHA-256: {sol.evidenceHash}
                      </p>

                      {sol.status === "pendiente" && (
                        <div className="pt-2 border-t border-slate-100">
                          {esPropia ? (
                            <p className="text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                              Regla Q-C1-03: No puedes decidir tu propia solicitud.
                            </p>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                placeholder="Dictamen administrativo (mín. 3 caracteres)…"
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
                                disabled={cargando === `decidir-${sol.id}`}
                                onClick={() => decidirSolicitud(sol.id, "aprobado")}
                                className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Aprobar y emitir constancia
                              </button>
                              <button
                                type="button"
                                disabled={cargando === `decidir-${sol.id}`}
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

          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Constancias Emitidas ({constancias.length})
            </h2>

            {constancias.length === 0 ? (
              <p className="text-xs sm:text-sm text-slate-500 py-4 text-center">
                Aún no se han emitido constancias.
              </p>
            ) : (
              <div className="space-y-3">
                {constancias.map((cert) => (
                  <div
                    key={cert.id}
                    className="rounded-xl border border-slate-200 p-4 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-950">
                        {cert.verificationCode}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          estadoVigenciaConstancia({ status: cert.status, issuedAt: new Date(cert.issuedAt) }, new Date()) === "vigente"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : estadoVigenciaConstancia({ status: cert.status, issuedAt: new Date(cert.issuedAt) }, new Date()) === "por_vencer"
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : "bg-red-50 text-red-800 border border-red-200"
                        }`}
                      >
                        {etiquetaEstadoConstancia(estadoVigenciaConstancia({ status: cert.status, issuedAt: new Date(cert.issuedAt) }, new Date()))}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">
                      Broker: <strong>{cert.brokerNombre}</strong> · Curso:{" "}
                      <strong>{cert.courseName}</strong> · Aprobado por:{" "}
                      <strong>{cert.approvedByNombre}</strong>
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 break-all">
                      Hash SHA-256: {cert.cryptographicHash}
                    </p>

                    {constanciaAcreditaFormacion(estadoVigenciaConstancia({ status: cert.status, issuedAt: new Date(cert.issuedAt) }, new Date())) && cert.brokerId !== usuarioId && (
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Motivo de revocación…"
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
                          disabled={cargando === `revocar-${cert.id}`}
                          onClick={() => revocarConstancia(cert.id)}
                          className="min-h-[44px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-100"
                        >
                          <XCircle className="w-4 h-4" />
                          Revocar
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
    </div>
  );
}
