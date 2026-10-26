"use client";

import { unitFormPayload, availabilitySummary } from "../presentacion";
import { ProjectDossier } from "../_componentes/project-dossier";
import { UnitInspector } from "../_componentes/unit-inspector";
import { FloorMatrix } from "../_componentes/floor-matrix";
import { absorcionUnidades } from "@/domain/unidades";
import { descripcionComercial } from "@/application/proyectos/validacion";
import { fechaLocal } from "@/domain/zona-horaria";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useRef, useState } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { OPERATION_TYPES, PRICE_PERIODS, UNIT_STATUSES } from "@/domain/catalogs";
import type { projects, units } from "@/infrastructure/db/schema";
import { Badge, PageHeader } from "../../_ui/prototipo-ui";
import { AlertaErrorFormulario } from "../../_ui/alerta-error-formulario";
import { centavosAUnidad } from "../../_ui/formato";
import { Vacio } from "../../_ui/estados";
import { ETIQUETAS_TIPO, FormularioProyecto, type BrokerOpcion } from "../_formulario-proyecto";
import { CotizadorConfoturModal } from "@/components/ui/cotizador-confotur-modal";
import {
  ArrowLeft,
  Building2,
  Calculator,
  Calendar,
  Edit3,
  HardHat,
  Layers,
  LayoutGrid,
  Lock,
  MapPin,
  Percent,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Proyecto = typeof projects.$inferSelect;
type Unidad = typeof units.$inferSelect;

const ETIQUETAS_ESTADO: Record<string, { texto: string; tono: "green" | "gold" | "neutral" | "red" }> = {
  available: { texto: "Disponible", tono: "green" },
  reserved: { texto: "Reservada", tono: "gold" },
  sold: { texto: "Vendida", tono: "neutral" },
  unavailable: { texto: "No disponible", tono: "red" },
};

function formatoCents(cents: number | null, currency: string): string {
  return cents == null ? "—" : `${currency} ${(cents / 100).toLocaleString("es-DO")}`;
}

/**
 * Ficha técnica de lujo del proyecto y matriz interactiva de unidades.
 *
 * Características clave:
 * - Doble esquema de precios: precio real interno visible solo si el usuario tiene permiso (Admin).
 * - Badges Confotur de exención fiscal y datos completos del desarrollador.
 * - Matriz interactiva de unidades con filtro dinámico por disponibilidad, buscador y tipología.
 * - Reemplazo de todos los confirm/alert nativos por modales y diálogos accesibles.
 * - Enlace directo a supervisión de avances de obra.
 */
export function PropiedadDetalleVista({
  proyecto,
  unidades,
  brokers,
  puedeEditarProyecto,
  puedeCrearUnidad,
  puedeEditarUnidad,
  puedeEliminarUnidad,
  puedeEditarPrecioReal,
  puedeVerAvances,
  puedeConsultarHolds = false,
}: {
  proyecto: Proyecto;
  unidades: Unidad[];
  brokers: BrokerOpcion[];
  puedeEditarProyecto: boolean;
  puedeCrearUnidad: boolean;
  puedeEditarUnidad: boolean;
  puedeEliminarUnidad: boolean;
  puedeEditarPrecioReal: boolean;
  puedeVerAvances: boolean;
  puedeConsultarHolds?: boolean;
}) {
  const router = useRouter();
  const [inspectingUnit, setInspectingUnit] = useState<Unidad | null>(null);
  const [editandoProyecto, setEditandoProyecto] = useState(false);
  const [creandoUnidad, setCreandoUnidad] = useState(false);
  const [editandoUnidad, setEditandoUnidad] = useState<Unidad | null>(null);

  // Modal accesible para confirmación de eliminación (reemplaza confirm nativo)
  const [unidadAEliminar, setUnidadAEliminar] = useState<Unidad | null>(null);
  const [eliminandoUnidad, setEliminandoUnidad] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState<string | null>(null);

  // Filtros interactivos para la matriz de unidades
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busquedaUnidad, setBusquedaUnidad] = useState<string>("");
  const [filtroHabitaciones, setFiltroHabitaciones] = useState<string>("todas");
  const [vistaInventario, setVistaInventario] = useState<"tabla" | "matriz">("tabla");
  const [cotizandoConfig, setCotizandoConfig] = useState<{
    titulo: string;
    precioCents: number;
    moneda: string;
  } | null>(null);

  // Métricas de disponibilidad
  const totalUnidades = unidades.length;
  const disponibles = unidades.filter((u) => u.status === "available").length;
  const reservadas = unidades.filter((u) => u.status === "reserved").length;
  const vendidas = unidades.filter((u) => u.status === "sold").length;
  const noDisponibles = unidades.filter((u) => u.status === "unavailable").length;

  const porcentajeAbsorcion = absorcionUnidades(totalUnidades, disponibles);

  // Filtrado reactivo de unidades
  const unidadesFiltradas = useMemo(() => {
    return unidades.filter((unidad) => {
      if (filtroEstado !== "todos" && unidad.status !== filtroEstado) return false;
      if (filtroHabitaciones !== "todas") {
        if (filtroHabitaciones === "3+" && (unidad.bedrooms ?? 0) < 3) return false;
        if (filtroHabitaciones !== "3+" && String(unidad.bedrooms ?? "") !== filtroHabitaciones) return false;
      }
      if (busquedaUnidad.trim()) {
        const query = busquedaUnidad.toLowerCase().trim();
        const codeMatch = unidad.code.toLowerCase().includes(query);
        const typeMatch = unidad.unitType?.toLowerCase().includes(query) ?? false;
        if (!codeMatch && !typeMatch) return false;
      }
      return true;
    });
  }, [unidades, filtroEstado, filtroHabitaciones, busquedaUnidad]);

  // La columna "Precio real" solo se pinta si alguna unidad trae el dato
  const muestraColumnaPrecio = unidades.some((u) => u.realPriceCents !== null) || puedeEditarUnidad;

  const esConfotur = false; // No existe expediente de revisión fiscal en el modelo actual.
  const descripcion = descripcionComercial(proyecto.description);

  async function ejecutarEliminarUnidad() {
    if (!unidadAEliminar) return;
    setEliminandoUnidad(true);
    setErrorEliminacion(null);

    try {
      const respuesta = await fetch(`/api/proyectos/${proyecto.id}/unidades/${unidadAEliminar.id}?expectedVersion=${unidadAEliminar.rowVersion}`, {
        method: "DELETE",
      });
      if (!respuesta.ok) {
        const cuerpo = await respuesta.json().catch(() => ({}));
        setErrorEliminacion(cuerpo.error ?? "No se pudo eliminar la unidad.");
        return;
      }
      setUnidadAEliminar(null);
      router.refresh();
    } catch {
      setErrorEliminacion("Error de conexión al eliminar la unidad. Inténtalo de nuevo.");
    } finally {
      setEliminandoUnidad(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Botón de retorno accesible */}
      <Link
        href="/propiedades"
        className="inline-flex items-center gap-2 min-h-[44px] px-3 text-[13px] font-semibold text-muted-foreground hover:text-ink transition-colors rounded-lg hover:bg-surface"
      >
        <ArrowLeft className="size-4" />
        Volver a propiedades
      </Link>

      <PageHeader
        eyebrow="Ficha Técnica · Desarrollo Inmobiliario"
        title={proyecto.name}
        subtitle={`${proyecto.zone ?? "Sin zona"} · ${ETIQUETAS_TIPO[proyecto.projectType] ?? proyecto.projectType}${
          proyecto.estimatedDeliveryDate ? ` · Entrega estimada: ${fechaLocal(proyecto.estimatedDeliveryDate)}` : ""
        }`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={proyecto.publicRangeMinCents == null && proyecto.publicRangeMaxCents == null}
              title={proyecto.publicRangeMinCents == null && proyecto.publicRangeMaxCents == null ? "Sin precio público registrado" : "Cotizar con precio público"}
              onClick={() =>
                setCotizandoConfig({
                  titulo: proyecto.name,
                  precioCents: proyecto.publicRangeMinCents ?? proyecto.publicRangeMaxCents ?? 0,
                  moneda: proyecto.currency,
                })
              }
              className="button secondary min-h-12 px-4 text-[13.5px] font-bold inline-flex items-center gap-2 border border-emerald-500/50 text-emerald-950 bg-emerald-50 hover:bg-emerald-100 transition-colors shadow-xs cursor-pointer"
            >
              <Calculator className="size-4 text-emerald-700" />
              <span>Cotizador Confotur</span>
            </button>
            {puedeVerAvances && (
              <Link
                className="button secondary min-h-12 px-5 text-[13.5px] font-semibold inline-flex items-center gap-2 border border-gold-500/50 text-gold-950 bg-gold-50 hover:bg-gold-100 transition-colors shadow-xs"
                href={`/avances?proyecto=${proyecto.slug}`}
              >
                <HardHat className="size-4 text-gold-700" />
                Supervisión de obra
              </Link>
            )}
            {puedeEditarProyecto && (
              <button
                className="button primary min-h-12 px-5 text-[13.5px] font-semibold inline-flex items-center gap-2"
                type="button"
                onClick={() => setEditandoProyecto(true)}
              >
                <Edit3 className="size-4" />
                Editar proyecto
              </button>
            )}
          </div>
        }
      />

      {/* Ficha técnica completa del proyecto */}
      <div className="rounded-2xl border border-line bg-surface shadow-xs overflow-hidden">
        {/* Banner superior Navy profundo */}
        <div className="bg-[#0c1322] text-white p-6 relative overflow-hidden border-b border-navy-900">
          <div className="absolute inset-0 bg-gradient-to-br from-[#111c36] via-[#0c1322] to-[#070b16] opacity-95" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold">
                  {ETIQUETAS_TIPO[proyecto.projectType] ?? proyecto.projectType}
                </Badge>
                {proyecto.confoturEligible && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-3 py-1 text-[13px] font-semibold tracking-wide">
                    <ShieldCheck className="size-4 text-emerald-400" />
                    Confotur: pendiente de revisión
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-900/90 text-gold-400 border border-gold-500/30 px-3 py-1 text-[13px] font-bold">
                  <Percent className="size-3.5 text-gold-500" />
                  {proyecto.progressPercent}% avance de obra
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">{proyecto.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-[13px] text-slate-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-4 text-gold-400 shrink-0" />
                  {proyecto.zone ?? "Ubicación sin registrar"}
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-4 text-gold-400 shrink-0" />
                  Desarrollador: {proyecto.developer ?? "Independiente"}
                </span>
                {proyecto.estimatedDeliveryDate && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="size-4 text-gold-400 shrink-0" />
                    Entrega: {fechaLocal(proyecto.estimatedDeliveryDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Acceso rápido a avances */}
            {puedeVerAvances && (
              <Link
                href={`/avances?proyecto=${proyecto.slug}`}
                className="shrink-0 min-h-[44px] px-4 py-2.5 rounded-xl bg-gold-600/20 hover:bg-gold-600/30 text-gold-300 border border-gold-500/40 font-semibold text-[13px] flex items-center gap-2 transition-colors"
              >
                <Layers className="size-4 text-gold-400" />
                <span>Ver avance y etapas de la obra</span>
              </Link>
            )}
          </div>
        </div>

        {/* Métricas y especificaciones en Bento técnico */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-surface">
          {/* Métricas de absorción */}
          <div className="p-4 rounded-xl bg-surface-alt/70 border border-line space-y-2">
            <div className="flex justify-between items-center text-[13px]">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Layers className="size-4 text-gold-600" />
                Unidades fuera de venta
              </span>
              <span className="font-bold text-ink tabular-nums text-sm">{porcentajeAbsorcion}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-line overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-600 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${porcentajeAbsorcion}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-2 justify-between items-center text-[13px] text-muted-foreground pt-1">
              <span>{availabilitySummary(vendidas, reservadas, noDisponibles)}</span>
              <span className="font-semibold text-emerald-700">{disponibles} {disponibles === 1 ? "disponible" : "disponibles"}</span>
            </div>
          </div>

          {/* Cronograma de Entrega */}
          <div className="p-4 rounded-xl bg-surface-alt/70 border border-line space-y-1">
            <p className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="size-4 text-gold-600" />
              Fecha estimada de entrega
            </p>
            <p className="text-base font-bold text-ink">
              {proyecto.estimatedDeliveryDate ? fechaLocal(proyecto.estimatedDeliveryDate) : "Por coordinar"}
            </p>
            <p className="text-[13px] text-muted-foreground">
              {proyecto.progressPercent >= 100 ? "Avance declarado completo · entrega pendiente de verificación" : `${100 - proyecto.progressPercent}% restante de obra`}
            </p>
          </div>

          {/* Precio interno real (Doble esquema) */}
          <div className="p-4 rounded-xl bg-surface-alt/70 border border-line space-y-1">
            <p className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Lock className="size-4 text-gold-600" />
              Precio interno confidencial
            </p>
            {proyecto.internalPriceCents != null ? (
              <>
                <p className="text-base font-bold text-gold-950 tabular-nums">
                  {formatoCents(proyecto.internalPriceCents, proyecto.currency)}
                </p>
                <span className="inline-block text-[13px] px-2 py-0.5 rounded bg-gold-100 text-gold-800 font-semibold">
                  Acceso Administrador
                </span>
              </>
            ) : (
              <>
                <p className="text-base font-bold text-muted-foreground">Restringido</p>
                <p className="text-[13px] text-muted-foreground">Confidencial para brokers</p>
              </>
            )}
          </div>

          {/* Rango comercial público */}
          <div className="p-4 rounded-xl bg-surface-alt/70 border border-line space-y-1">
            <p className="text-[13px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="size-4 text-gold-600" />
              Precios para clientes
            </p>
            <p className="text-base font-bold text-ink tabular-nums">
              {formatoCents(proyecto.publicRangeMinCents, proyecto.currency)} – {formatoCents(proyecto.publicRangeMaxCents, proyecto.currency)}
            </p>
            <p className="text-[13px] text-muted-foreground">Rango de precios publicado</p>
          </div>
        </div>

        {(
          <div className="px-6 pb-6 pt-2">
            <div className="p-4 rounded-xl bg-surface-alt/40 border border-line/50 text-[13px] text-ink leading-relaxed">
              <strong className="block text-[13px] font-semibold text-ink mb-1">Descripción del desarrollo</strong>
              {descripcion ?? "Sin descripción comercial verificada."}
            </div>
          </div>
        )}
      </div>

      <ProjectDossier project={proyecto} units={unidades} canEdit={puedeEditarProyecto} />
      <FloorMatrix units={unidades} onInspect={setInspectingUnit} />
      <UnitInspector canReadHolds={puedeConsultarHolds} unit={inspectingUnit} projectName={proyecto.name} onClose={() => setInspectingUnit(null)} onEdit={puedeEditarUnidad ? unit => { setInspectingUnit(null); setEditandoUnidad(unit); } : undefined} />
      {/* Matriz interactiva de unidades */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink flex items-center gap-2">
              Inventario de unidades
              <span className="text-[13px] font-semibold px-2.5 py-0.5 rounded-full bg-surface-alt border border-line text-ink">
                {unidadesFiltradas.length} de {unidades.length}
              </span>
            </h2>
            <p className="text-[13px] text-muted-foreground">
              Consulta la disponibilidad, las características y los precios de cada unidad.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-line bg-surface-alt p-1">
              <button
                type="button"
                onClick={() => setVistaInventario("tabla")}
                className={`min-h-12 px-3.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                  vistaInventario === "tabla"
                    ? "bg-navy-950 text-white shadow-2xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Tabla detallada
              </button>
              <button
                type="button"
                onClick={() => setVistaInventario("matriz")}
                className={`min-h-12 px-3.5 inline-flex items-center gap-1.5 rounded-lg text-[13px] font-bold transition-all cursor-pointer ${
                  vistaInventario === "matriz"
                    ? "bg-navy-950 text-white shadow-2xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <LayoutGrid className="size-4 text-gold-500" />
                <span>Unidades por piso</span>
              </button>
            </div>
            {puedeCrearUnidad && (
              <button
                className="button primary min-h-12 px-5 text-[13.5px] font-semibold inline-flex items-center gap-2 shrink-0"
                type="button"
                onClick={() => setCreandoUnidad(true)}
              >
                <Plus className="size-4" />
                Nueva unidad
              </button>
            )}
          </div>
        </div>

        {/* Barra interactiva de filtros de unidades */}
        <div className="rounded-xl border border-line bg-surface p-4 space-y-3">
          {/* Tabs por estado de disponibilidad */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`min-h-[44px] px-4 rounded-lg text-[13px] font-medium transition-colors ${
                filtroEstado === "todos"
                  ? "bg-navy-950 text-white shadow-xs"
                  : "bg-surface-alt hover:bg-surface-hover text-ink border border-line"
              }`}
              onClick={() => setFiltroEstado("todos")}
            >
              Todas ({totalUnidades})
            </button>
            <button
              type="button"
              className={`min-h-[44px] px-4 rounded-lg text-[13px] font-medium transition-colors ${
                filtroEstado === "available"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
              }`}
              onClick={() => setFiltroEstado("available")}
            >
              Disponibles ({disponibles})
            </button>
            <button
              type="button"
              className={`min-h-[44px] px-4 rounded-lg text-[13px] font-medium transition-colors ${
                filtroEstado === "reserved"
                  ? "bg-gold-700 text-white shadow-xs"
                  : "bg-gold-50 text-gold-900 border border-gold-200 hover:bg-gold-100"
              }`}
              onClick={() => setFiltroEstado("reserved")}
            >
              Reservadas ({reservadas})
            </button>
            <button
              type="button"
              className={`min-h-[44px] px-4 rounded-lg text-[13px] font-medium transition-colors ${
                filtroEstado === "sold"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200"
              }`}
              onClick={() => setFiltroEstado("sold")}
            >
              Vendidas ({vendidas})
            </button>
            {noDisponibles > 0 && (
              <button
                type="button"
                className={`min-h-[44px] px-4 rounded-lg text-[13px] font-medium transition-colors ${
                  filtroEstado === "unavailable"
                    ? "bg-red-800 text-white shadow-xs"
                    : "bg-red-50 text-red-900 border border-red-200 hover:bg-red-100"
                }`}
                onClick={() => setFiltroEstado("unavailable")}
              >
                No disponibles ({noDisponibles})
              </button>
            )}
          </div>

          {/* Fila secundaria: Buscador y filtro de habitaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2 border-t border-line">
            <div className="sm:col-span-8 relative flex items-center">
              <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                className="w-full min-h-[44px] pl-10 pr-4 text-[13px] rounded-lg border border-line bg-canvas focus:bg-surface focus:border-gold-600 focus:outline-none transition-colors"
                placeholder="Buscar por código de unidad (ej. A-102) o tipología (ej. Villa, Suite)…"
                value={busquedaUnidad}
                onChange={(e) => setBusquedaUnidad(e.target.value)}
              />
              {busquedaUnidad && (
                <button
                  type="button"
                  onClick={() => setBusquedaUnidad("")}
                  className="absolute right-3 text-muted-foreground hover:text-ink text-[13px]"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <div className="sm:col-span-4">
              <select
                className="w-full min-h-[44px] px-3 text-[13px] rounded-lg border border-line bg-canvas focus:bg-surface focus:border-gold-600 focus:outline-none transition-colors"
                value={filtroHabitaciones}
                onChange={(e) => setFiltroHabitaciones(e.target.value)}
              >
                <option value="todas">Todas las habitaciones</option>
                <option value="1">1 habitación</option>
                <option value="2">2 habitaciones</option>
                <option value="3+">3 o más habitaciones</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla / Matriz interactiva de unidades */}
        {unidadesFiltradas.length === 0 ? (
          <div className="rounded-xl border border-line bg-surface p-8 text-center">
            <Vacio
              titulo="Sin unidades para los filtros seleccionados"
              texto="Prueba ajustando el estado de disponibilidad o limpiando la búsqueda."
            />
            {(filtroEstado !== "todos" || busquedaUnidad || filtroHabitaciones !== "todas") && (
              <button
                type="button"
                className="button secondary min-h-[44px] px-5 text-[13px] font-semibold mt-3"
                onClick={() => {
                  setFiltroEstado("todos");
                  setBusquedaUnidad("");
                  setFiltroHabitaciones("todas");
                }}
              >
                Restablecer filtros
              </button>
            )}
          </div>
        ) : vistaInventario === "matriz" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {unidadesFiltradas.map((unidad) => {
              const estado = ETIQUETAS_ESTADO[unidad.status] ?? { texto: unidad.status, tono: "neutral" as const };
              const precioCotizar =
                unidad.publicRangeMinCents ??
                unidad.publicRangeMaxCents ??
                proyecto.publicRangeMinCents ??
                0;
              const bordeEstado =
                unidad.status === "available"
                  ? "border-emerald-500/50 bg-emerald-50/15"
                  : unidad.status === "reserved"
                    ? "border-gold-500/60 bg-gold-50/20"
                    : "border-line bg-surface-alt/50 opacity-85";
              return (
                <div
                  key={unidad.id}
                  className={`rounded-xl border p-4 flex flex-col justify-between gap-3 shadow-xs transition-all ${bordeEstado}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <strong className="font-heading text-[16px] font-extrabold text-navy-950">
                        <button type="button" onClick={() => setInspectingUnit(unidad)} className="min-h-11 text-left underline decoration-gold-600 underline-offset-4" aria-label={"Abrir ficha de unidad " + unidad.code}>{unidad.code}</button>
                      </strong>
                      <Badge tone={estado.tono}>{estado.texto}</Badge>
                    </div>
                    <p className="text-[13px] font-semibold text-ink-soft m-0">
                      {unidad.unitType ?? "Unidad residencial"} · {unidad.bedrooms ?? "—"} hab · {unidad.bathrooms ?? "—"} baños
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-1 m-0 tabular-nums">
                      Superficie: {unidad.builtAreaM2 != null ? `${unidad.builtAreaM2} m²` : "Por definir"}
                    </p>
                    <p className="text-[14px] font-bold text-navy-950 mt-2 m-0 tabular-nums">
                      {formatoCents(unidad.publicRangeMinCents, unidad.currency)} –{" "}
                      {formatoCents(unidad.publicRangeMaxCents, unidad.currency)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-line/60">
                    <button
                      type="button"
                      disabled={precioCotizar <= 0}
                      title={precioCotizar > 0 ? "Cotizar con precio público" : "Sin precio público registrado"}
                      onClick={() =>
                        setCotizandoConfig({
                          titulo: `${proyecto.name} · Unidad ${unidad.code}`,
                          precioCents: precioCotizar,
                          moneda: unidad.currency,
                        })
                      }
                      className="min-h-12 flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-navy-950 hover:bg-navy-900 text-white text-[13px] font-bold transition-colors cursor-pointer"
                    >
                      <Calculator className="size-3.5 text-gold-400" />
                      <span>Cotizar plan</span>
                    </button>
                    {puedeEditarUnidad && (
                      <button
                        type="button"
                        onClick={() => setEditandoUnidad(unidad)}
                        aria-label={`Editar unidad ${unidad.code}`}
                        className="min-h-12 min-w-12 inline-flex items-center justify-center rounded-lg border border-line bg-surface hover:bg-surface-alt"
                      >
                        <Edit3 className="size-4 text-ink" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="table-wrap rounded-xl border border-line bg-surface overflow-x-auto shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-alt text-[13px] text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Tipología</th>
                  <th className="py-3 px-4">Habitaciones</th>
                  <th className="py-3 px-4">Baños</th>
                  <th className="py-3 px-4">Construcción</th>
                  {muestraColumnaPrecio && <th className="py-3 px-4">Precio real</th>}
                  <th className="py-3 px-4">Precios para clientes</th>
                  <th className="py-3 px-4">Disponibilidad</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-[13px]">
                {unidadesFiltradas.map((unidad) => {
                  const estado = ETIQUETAS_ESTADO[unidad.status] ?? { texto: unidad.status, tono: "neutral" as const };
                  const precioCotizar =
                    unidad.publicRangeMinCents ??
                    unidad.publicRangeMaxCents ??
                    proyecto.publicRangeMinCents ??
                    0;
                  return (
                    <tr key={unidad.id} className="hover:bg-surface-hover/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-ink"><button type="button" className="min-h-11 underline underline-offset-4" onClick={() => setInspectingUnit(unidad)} aria-label={"Abrir ficha de unidad " + unidad.code}>{unidad.code}</button></td>
                      <td className="py-3 px-4 text-ink font-medium">{unidad.unitType ?? "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{unidad.bedrooms ?? "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{unidad.bathrooms ?? "—"}</td>
                      <td className="py-3 px-4 text-ink font-medium tabular-nums">
                        {unidad.builtAreaM2 != null ? `${unidad.builtAreaM2} m²` : "—"}
                      </td>
                      {muestraColumnaPrecio && (
                        <td className="py-3 px-4 font-bold text-gold-950 tabular-nums">
                          {unidad.realPriceCents != null
                            ? formatoCents(unidad.realPriceCents, unidad.currency)
                            : "Restringido"}
                        </td>
                      )}
                      <td className="py-3 px-4 text-muted-foreground tabular-nums">
                        {formatoCents(unidad.publicRangeMinCents, unidad.currency)} – {formatoCents(unidad.publicRangeMaxCents, unidad.currency)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge tone={estado.tono}>{estado.texto}</Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setCotizandoConfig({
                                titulo: `${proyecto.name} · Unidad ${unidad.code}`,
                                precioCents: precioCotizar,
                                moneda: unidad.currency,
                              })
                            }
                            disabled={precioCotizar <= 0}
                            aria-label={`Cotizar unidad ${unidad.code}`}
                            title={precioCotizar > 0 ? "Abrir cotizador" : "Sin precio público registrado"}
                            className="min-h-12 px-3 inline-flex items-center gap-1.5 rounded-lg border border-gold-500/40 bg-gold-50/40 hover:bg-gold-100/70 text-navy-950 text-[13px] font-bold transition-colors cursor-pointer"
                          >
                            <Calculator className="size-3.5 text-gold-700" />
                            <span>Cotizar</span>
                          </button>
                          {puedeEditarUnidad && (
                            <button
                              className="icon-button min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-surface-alt transition-colors"
                              type="button"
                              onClick={() => setEditandoUnidad(unidad)}
                              aria-label={`Editar unidad ${unidad.code}`}
                            >
                              <Edit3 className="size-4 text-muted-foreground hover:text-ink" />
                            </button>
                          )}
                          {puedeEliminarUnidad && (
                            <button
                              className="icon-button min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-danger-bg transition-colors text-danger"
                              type="button"
                              onClick={() => {
                                setErrorEliminacion(null);
                                setUnidadAEliminar(unidad);
                              }}
                              aria-label={`Eliminar unidad ${unidad.code}`}
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {cotizandoConfig && (
        <CotizadorConfoturModal
          tituloPropiedad={cotizandoConfig.titulo}
          subtituloZona={proyecto.zone}
          precioInicialCents={cotizandoConfig.precioCents}
          monedaInicial={cotizandoConfig.moneda}
          aplicaConfoturInicial={Boolean(esConfotur)}
          onClose={() => setCotizandoConfig(null)}
        />
      )}

      {/* Modal accesible para eliminar unidad (reemplaza confirm/alert nativos) */}
      <Dialog open={Boolean(unidadAEliminar)} onOpenChange={(open) => !open && setUnidadAEliminar(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-ink">
              Eliminar unidad {unidadAEliminar?.code}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground mt-1">
              ¿Estás seguro de que deseas enviar esta unidad a la papelera? Podrás consultarla o recuperarla en el histórico. No se eliminará irreversiblemente.
            </DialogDescription>
          </DialogHeader>
          {errorEliminacion && (
            <div className="p-3 rounded-lg bg-danger-bg text-danger text-[13px] border border-danger/30">
              {errorEliminacion}
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:justify-end pt-3">
            <Button
              variant="outline"
              className="min-h-[44px] text-[13px] px-4"
              onClick={() => setUnidadAEliminar(null)}
              disabled={eliminandoUnidad}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="min-h-[44px] text-[13px] px-5 font-semibold"
              onClick={ejecutarEliminarUnidad}
              disabled={eliminandoUnidad}
            >
              {eliminandoUnidad ? "Eliminando…" : "Eliminar unidad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modales de formulario */}
      {editandoProyecto && (
        <FormularioProyecto
          proyecto={proyecto}
          brokers={brokers}
          puedeEditarPrecioReal={puedeEditarPrecioReal}
          onClose={() => setEditandoProyecto(false)}
        />
      )}
      {creandoUnidad && (
        <FormularioUnidad
          proyectoId={proyecto.id}
          puedeEditarPrecioReal={puedeEditarPrecioReal}
          onClose={() => setCreandoUnidad(false)}
        />
      )}
      {editandoUnidad && (
        <FormularioUnidad
          proyectoId={proyecto.id}
          unidad={editandoUnidad}
          puedeEditarPrecioReal={puedeEditarPrecioReal}
          onClose={() => setEditandoUnidad(null)}
        />
      )}
    </div>
  );
}

function FormularioUnidad({
  proyectoId,
  unidad,
  puedeEditarPrecioReal,
  onClose,
}: {
  proyectoId: number;
  unidad?: Unidad;
  puedeEditarPrecioReal: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);
  const modalRef = useFocusTrap<HTMLElement>({ onClose });
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorRed, setErrorRed] = useState<string | null>(null);
  const editando = Boolean(unidad);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current || submittingRef.current) return;
    submittingRef.current = true;
    setEnviando(true);
    setErrores({});
    setErrorRed(null);

    try {
      const raw = Object.fromEntries(new FormData(formRef.current).entries());
      const datos = unitFormPayload(raw, {editing: editando, canEditRealPrice: puedeEditarPrecioReal, expectedVersion: unidad?.rowVersion});

      const url = editando ? `/api/proyectos/${proyectoId}/unidades/${unidad!.id}` : `/api/proyectos/${proyectoId}/unidades`;
      const respuesta = await fetch(url, {
        method: editando ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(datos),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setErrores(cuerpo.fields ?? {});
        setErrorRed(cuerpo.error ?? "No se pudo guardar la unidad. Revisa los datos ingresados.");
        return;
      }

      router.refresh();
      onClose();
    } catch {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      setErrorRed(
        offline
          ? "Sin conexión a internet. Los datos ingresados se mantienen intactos."
          : "Fallo de conexión de red al guardar la unidad. Tus datos están intactos.",
      );
    } finally {
      submittingRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="unidad-title" ref={modalRef}>
        <div className="drawer-head">
          <h2 id="unidad-title" className="text-lg font-bold text-ink">
            {editando ? `Editar unidad ${unidad!.code}` : "Nueva unidad"}
          </h2>
          <button className="icon-button min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>
        <form className="form-grid" ref={formRef} onSubmit={enviar} aria-busy={enviando}>
          {errorRed && (
            <div className="span-2">
              <AlertaErrorFormulario
                mensaje={errorRed}
                onReintentar={() => formRef.current?.requestSubmit()}
                disabled={enviando}
              />
            </div>
          )}
          <label>
            <span className="text-[13px] font-medium text-ink">Código de unidad *</span>
            <input name="code" defaultValue={unidad?.code} required className="min-h-[44px] text-[13px]" placeholder="Ej. A-101" />
            {errores.code && <small style={{ color: "#b42318", fontSize: "13px" }}>{errores.code}</small>}
          </label>
          <label>
            <span className="text-[13px] font-medium text-ink">Tipología</span>
            <input name="unitType" defaultValue={unidad?.unitType ?? ""} placeholder="Apartamento, Villa…" className="min-h-[44px] text-[13px]" />
          </label>
          <label>
            <span className="text-[13px] font-medium text-ink">Habitaciones</span>
            <input name="bedrooms" type="number" min="0" defaultValue={unidad?.bedrooms ?? ""} className="min-h-[44px] text-[13px]" />
          </label>
          <label>
            <span className="text-[13px] font-medium text-ink">Baños</span>
            <input name="bathrooms" type="number" min="0" step="0.5" defaultValue={unidad?.bathrooms ?? ""} className="min-h-[44px] text-[13px]" />
          </label>
          <label>
            <span className="text-[13px] font-medium text-ink">Construcción (m²)</span>
            <input name="builtAreaM2" type="number" min="0" step="0.01" defaultValue={unidad?.builtAreaM2 ?? ""} className="min-h-[44px] text-[13px]" />
          </label>
          <label>
            <span className="text-[13px] font-medium text-ink">Modalidad de operación</span>
            <select name="operationType" defaultValue={unidad?.operationType ?? "sale"} className="min-h-[44px] text-[13px]">
              {OPERATION_TYPES.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo === "sale" ? "Venta" : "Alquiler"}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-[13px] font-medium text-ink">Periodo de precio</span>
            <select name="pricePeriod" defaultValue={unidad?.pricePeriod ?? "one_time"} className="min-h-[44px] text-[13px]">
              {PRICE_PERIODS.map((periodo) => (
                <option key={periodo} value={periodo}>
                  {periodo === "one_time" ? "Único" : "Mensual"}
                </option>
              ))}
            </select>
          </label>
          {puedeEditarPrecioReal && (
            <label>
              <span className="text-[13px] font-medium text-ink">Precio real interno (Admin)</span>
              <input
                name="realPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 120000"
                defaultValue={unidad?.realPriceCents != null ? centavosAUnidad(unidad.realPriceCents) : ""}
                className="min-h-[44px] text-[13px]"
              />
            </label>
          )}
          <label>
            <span className="text-[13px] font-medium text-ink">Rango público — mínimo (USD)</span>
            <input
              name="publicRangeMin"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 115000"
              defaultValue={unidad?.publicRangeMinCents != null ? centavosAUnidad(unidad.publicRangeMinCents) : ""}
              className="min-h-[44px] text-[13px]"
            />
          </label>
          <label>
            <span className="text-[13px] font-medium text-ink">Rango público — máximo (USD)</span>
            <input
              name="publicRangeMax"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 130000"
              defaultValue={unidad?.publicRangeMaxCents != null ? centavosAUnidad(unidad.publicRangeMaxCents) : ""}
              className="min-h-[44px] text-[13px]"
            />
          </label>
          <label>
            <span className="text-[13px] font-medium text-ink">Estado de disponibilidad</span>
            <select disabled aria-describedby="unit-status-help" defaultValue={unidad?.status ?? "available"} className="min-h-[44px] text-[13px]">
              {UNIT_STATUSES.map((estado) => (
                <option key={estado} value={estado}>
                  {ETIQUETAS_ESTADO[estado]?.texto ?? estado}
                </option>
              ))}
            </select>
            <small id="unit-status-help">Lectura: la disponibilidad se confirma mediante el flujo de holds, reservas o ventas. Una unidad nueva comienza disponible.</small>
          </label>
          {errores._ && <small style={{ color: "#b42318", fontSize: "13px" }}>{errores._}</small>}
          <div className="form-actions span-2 flex items-center justify-end gap-3 pt-3">
            <button className="button min-h-[44px] px-5 text-[13px]" type="button" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button className="button primary min-h-[44px] px-6 text-[13px] font-semibold" type="submit" disabled={enviando}>
              {enviando ? "Guardando…" : editando ? "Guardar cambios" : "Crear unidad"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
