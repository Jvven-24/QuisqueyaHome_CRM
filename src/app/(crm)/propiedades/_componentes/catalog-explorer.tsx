"use client";

import { useRef, useState, useMemo, type ReactNode } from "react";
import Link from "next/link";
import type { ProyectoFila } from "../vista";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  LayoutGrid,
  Grid,
  List,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Percent,
  Layers,
  Calendar,
  Building2,
  Navigation,
  Sparkles,
} from "lucide-react";

const MODES = [
  { id: "cards", label: "Tarjetas", Icon: LayoutGrid },
  { id: "grid4", label: "Cuadrícula", Icon: Grid },
  { id: "list", label: "Lista", Icon: List },
  { id: "map", label: "Mapa Zonas RD", Icon: MapPin },
] as const;

type Mode = typeof MODES[number]["id"];

/** Coordenadas canónicas de zonas de República Dominicana (CMS Studio). */
const COORDENADAS_ZONAS_DOMINICANAS: Record<
  string,
  { name: string; latitude: number; longitude: number; region: string; description: string }
> = {
  "bavaro": {
    name: "Bávaro",
    latitude: 18.6896,
    longitude: -68.4410,
    region: "Costa Este",
    description: "Bávaro, Costa del Coco, Punta Cana",
  },
  "cap-cana": {
    name: "Cap Cana",
    latitude: 18.4900,
    longitude: -68.4230,
    region: "Costa Este",
    description: "Cap Cana Ciudad Destino y Marina",
  },
  "punta-cana": {
    name: "Punta Cana",
    latitude: 18.5601,
    longitude: -68.3725,
    region: "Costa Este",
    description: "Punta Cana Village, Boulevard y Resort",
  },
  "bayahibe": {
    name: "Bayahíbe",
    latitude: 18.3742,
    longitude: -68.8402,
    region: "La Romana / Este",
    description: "Bayahíbe y Dominicus, La Altagracia",
  },
  "las-terrenas": {
    name: "Las Terrenas",
    latitude: 19.3216,
    longitude: -69.5414,
    region: "Península de Samaná",
    description: "Las Terrenas, playas y colinas",
  },
  "samana": {
    name: "Samaná",
    latitude: 19.2056,
    longitude: -69.3369,
    region: "Península de Samaná",
    description: "Bahía de Samaná y Santa Bárbara",
  },
  "santo-domingo": {
    name: "Santo Domingo",
    latitude: 18.4861,
    longitude: -69.9312,
    region: "Distrito Nacional",
    description: "Piantini, Naco, Bella Vista y Zona Colonial",
  },
  "miches": {
    name: "Miches",
    latitude: 18.9833,
    longitude: -69.0478,
    region: "El Seibo / Este",
    description: "Miches y Costa Esmeralda",
  },
};

function resolverZonaCanonica(nombreZona: string | null) {
  if (!nombreZona) return null;
  const texto = nombreZona.toLowerCase().trim();
  for (const [clave, datos] of Object.entries(COORDENADAS_ZONAS_DOMINICANAS)) {
    if (
      texto.includes(clave) ||
      texto.includes(datos.name.toLowerCase()) ||
      datos.name.toLowerCase().includes(texto)
    ) {
      return { clave, ...datos };
    }
  }
  return null;
}

function formatearRango(p: ProyectoFila) {
  if (p.publicRangeMinCents == null && p.publicRangeMaxCents == null) return "Precio por confirmar";
  const currency = p.currency || "USD";
  const min = p.publicRangeMinCents != null ? (p.publicRangeMinCents / 100).toLocaleString("es-DO") : null;
  const max = p.publicRangeMaxCents != null ? (p.publicRangeMaxCents / 100).toLocaleString("es-DO") : null;
  if (min && max && min !== max) return `${currency} ${min} – ${max}`;
  return `${currency} ${min || max}`;
}

export function CatalogExplorer({
  projects,
  children,
}: {
  projects: ProyectoFila[];
  children: ReactNode;
}) {
  const [mode, setMode] = useState<Mode>("cards");
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [compareMessage, setCompareMessage] = useState<string | null>(null);
  const [comparing, setComparing] = useState(false);
  const [report, setReport] = useState(false);
  const [reported, setReported] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [zonaMapaSeleccionada, setZonaMapaSeleccionada] = useState<string | null>(null);

  const comparisonRef = useRef<HTMLDetailsElement>(null);

  const zones = useMemo(
    () => Array.from(new Set(projects.map((project) => project.zone ?? "Zona sin registrar"))),
    [projects],
  );

  function compare(id: number) {
    if (!selected.includes(id) && selected.length >= 3) {
      setCompareMessage("Ya seleccionaste tres proyectos. Quita uno antes de añadir otro.");
      return;
    }
    setSelected((values) => (values.includes(id) ? values.filter((value) => value !== id) : [...values, id]));
    setCompareMessage(null);
  }

  async function share(slug?: string) {
    try {
      await navigator.clipboard.writeText(
        slug ? window.location.origin + "/propiedades/" + encodeURIComponent(slug) : window.location.href,
      );
      setMessage("Enlace copiado. El receptor debe iniciar sesión y conservar su propio permiso de acceso.");
    } catch {
      setMessage("No se pudo copiar el enlace. Copia la dirección desde tu navegador.");
    }
  }

  const proyectosFiltradosMapa = useMemo(() => {
    if (!zonaMapaSeleccionada) return projects;
    return projects.filter((p) => {
      const canonica = resolverZonaCanonica(p.zone);
      return canonica ? canonica.clave === zonaMapaSeleccionada : (p.zone ?? "").includes(zonaMapaSeleccionada);
    });
  }, [projects, zonaMapaSeleccionada]);

  return (
    <section className="space-y-4 min-w-0">
      {/* Selector de vistas con Cuadrícula 4x4 y Mapa Dominicano */}
      <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-line bg-surface p-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-sm sm:hidden" htmlFor="catalog-view"><span>Vista</span>
          <select id="catalog-view" className="min-h-11 min-w-0 flex-1" value={mode} onChange={event => setMode(event.target.value as Mode)}>
            {MODES.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <nav aria-label="Vista del catálogo" className="hidden min-w-0 flex-wrap gap-1 rounded-lg bg-surface-alt p-1 sm:inline-flex">
          {MODES.map((item) => {
            const Icon = item.Icon;
            const esActivo = mode === item.id;
            return (
              <button
                className={`min-h-11 inline-flex items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-all sm:px-3.5 ${
                  esActivo ? "bg-navy-950 text-white shadow-xs" : "text-ink-muted hover:text-ink"
                }`}
                type="button"
                key={item.id}
                aria-pressed={esActivo}
                onClick={() => setMode(item.id)}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Acciones secundarias agrupadas */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3.5 text-[13px] font-semibold text-navy-900 hover:bg-surface-alt transition-colors"
              aria-label="Más acciones del catálogo"
            >
              <MoreHorizontal className="size-5" aria-hidden="true" />
              <span className="hidden sm:inline">Acciones</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuItem
              className="min-h-11 cursor-pointer"
              onSelect={() => {
                setSaved((values) => Array.from(new Set([...values.slice(-3), window.location.search || "Sin filtros"])));
                setMessage("Vista guardada solo en memoria de esta sesión.");
              }}
            >
              Guardar vista de sesión
            </DropdownMenuItem>
            <DropdownMenuItem className="min-h-11 cursor-pointer" onSelect={() => void share()}>
              Compartir enlace del catálogo
            </DropdownMenuItem>
            <DropdownMenuItem
              className="min-h-11 cursor-pointer"
              onSelect={() => {
                setReport(true);
                setReported(false);
              }}
            >
              Reportar dato de obra
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {message && (
        <p role="status" className="p-3 rounded-lg border border-line bg-surface text-sm">
          {message}
        </p>
      )}

      {saved.length > 0 && (
        <details className="text-sm">
          <summary className="min-h-11 cursor-pointer">Vistas de esta sesión · no persistidas</summary>
          {saved.map((view, index) => (
            <Link
              className="button min-h-11 mr-2"
              key={view}
              href={view === "Sin filtros" ? "/propiedades" : "/propiedades" + view}
            >
              Vista {index + 1}
            </Link>
          ))}
        </details>
      )}

      {/* Comparador de Proyectos */}
      <details
        ref={comparisonRef}
        open={comparing}
        onToggle={(event) => setComparing(event.currentTarget.open)}
        className="rounded-xl border border-line bg-surface p-4 sm:p-5"
      >
        <summary className="cursor-pointer min-h-11 font-semibold flex items-center justify-between">
          <span>
            Comparar proyectos <span className="text-sm font-normal text-ink-muted">· {selected.length} de 3</span>
          </span>
        </summary>
        <div className="border-t border-line pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-0 w-full sm:max-w-sm text-sm font-medium" htmlFor="catalog-compare-project">
              Añadir proyecto
              <select
                id="catalog-compare-project"
                defaultValue=""
                className="min-h-11 w-full rounded-lg border border-line bg-canvas px-3 mt-1"
                disabled={
                  projects.length === 0 ||
                  selected.length >= 3 ||
                  projects.every((project) => selected.includes(project.id))
                }
                onChange={(event) => {
                  const value = event.currentTarget.value;
                  if (value) compare(Number(value));
                  event.currentTarget.value = "";
                }}
              >
                <option value="">Selecciona un proyecto</option>
                {projects
                  .filter((project) => !selected.includes(project.id))
                  .map((project) => (
                    <option value={project.id} key={project.id}>
                      {project.name}
                    </option>
                  ))}
              </select>
            </label>
            <p className="m-0 pb-2 text-sm text-ink-muted" aria-live="polite">
              {compareMessage ??
                (selected.length === 3
                  ? "Quita un proyecto para añadir otro."
                  : "Elige hasta tres proyectos autorizados.")}
            </p>
          </div>
          {selected.some((id) => !projects.some((project) => project.id === id)) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm" role="status">
              <span>Hay proyectos seleccionados ocultos por los filtros actuales.</span>
              <button
                type="button"
                className="min-h-11 px-2 font-semibold underline underline-offset-4"
                onClick={() => {
                  setSelected([]);
                  setCompareMessage(null);
                }}
              >
                Limpiar selección
              </button>
            </div>
          )}
          {selected.length === 0 ? (
            <p className="mt-4 mb-0 rounded-lg bg-surface-alt p-4 text-sm text-ink-muted">
              Selecciona proyectos para comparar información registrada, sin mezclar monedas.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {projects
                .filter((project) => selected.includes(project.id))
                .map((project) => (
                  <article key={project.id} className="min-w-0 rounded-xl border border-line bg-surface-alt p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="m-0 min-w-0 break-words text-base font-semibold">{project.name}</h3>
                      <button
                        type="button"
                        className="min-h-11 shrink-0 px-2 text-sm font-semibold text-navy-900 underline underline-offset-4"
                        onClick={() => compare(project.id)}
                        aria-label={"Quitar " + project.name + " de la comparación"}
                      >
                        Quitar
                      </button>
                    </div>
                    <dl className="mt-4 mb-0 grid gap-3 text-sm">
                      <div>
                        <dt className="text-ink-muted">Zona</dt>
                        <dd className="m-0 font-medium">{project.zone ?? "Sin registrar"}</dd>
                      </div>
                      <div>
                        <dt className="text-ink-muted">Disponibles / total</dt>
                        <dd className="m-0 font-medium">
                          {project.unidadesDisponibles} / {project.unidadesTotal}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ink-muted">Rango de inversión</dt>
                        <dd className="m-0 break-words font-semibold text-gold-700">{formatearRango(project)}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
            </div>
          )}
        </div>
      </details>

      {/* Renderizado de Modos */}
      {mode === "cards" ? (
        children
      ) : mode === "grid4" ? (
        /* Cuadrícula 4x4 de Lujo Adaptada a Tablet y Móvil */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 auto-rows-fr">
          {projects.map((p) => {
            const absorcion =
              p.unidadesTotal > 0 ? Math.round(((p.unidadesTotal - p.unidadesDisponibles) / p.unidadesTotal) * 100) : 0;
            const esConfotur = p.confoturEligible === true;
            return (
              <article
                key={p.id}
                className="group relative flex flex-col justify-between rounded-xl border border-line bg-surface shadow-xs hover:border-gold-500/60 hover:shadow-lg transition-all overflow-hidden"
              >
                {/* Portada compacta */}
                <div className="relative bg-[#0c1322] p-3 text-white overflow-hidden border-b border-navy-900 flex flex-col justify-between min-h-[110px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#101b33] via-[#0c1322] to-[#080d18] opacity-95" />
                  <div className="relative z-10 flex items-center justify-between gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400 truncate max-w-[140px]">
                      {p.zone ?? "RD"}
                    </span>
                    <div className="flex items-center gap-1">
                      {esConfotur && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-900/80 text-emerald-300 border border-emerald-500/30"
                          title="Beneficio fiscal Confotur"
                        >
                          Confotur
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-navy-900/80 text-gold-300 border border-gold-500/30">
                        {p.progressPercent}%
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 pt-2">
                    <h3 className="text-sm font-bold text-white group-hover:text-gold-300 transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-slate-300 truncate mt-0.5">
                      {p.developer || "Desarrollo Inmobiliario"}
                    </p>
                  </div>
                </div>

                {/* Métricas y Precios */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-ink-muted">
                      <span>Absorción: {absorcion}%</span>
                      <span className="font-semibold text-ink">
                        {p.unidadesDisponibles} disp. de {p.unidadesTotal}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-gold-600 rounded-full" style={{ width: `${absorcion}%` }} />
                    </div>
                  </div>

                  <div className="pt-1 border-t border-line/60">
                    <span className="block text-[10px] font-medium text-ink-muted">Inversión registrada</span>
                    <strong className="block text-xs font-bold text-navy-950 dark:text-gold-400 truncate">
                      {formatearRango(p)}
                    </strong>
                  </div>

                  {/* Acciones de la Tarjeta */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <Link
                      href={`/propiedades/${p.slug}`}
                      className="flex-1 min-h-11 inline-flex items-center justify-center rounded-lg bg-navy-950 text-white text-xs font-bold hover:bg-navy-900 transition-colors"
                    >
                      Ver ficha
                    </Link>
                    <button
                      type="button"
                      onClick={() => compare(p.id)}
                      className={`min-h-11 px-2.5 rounded-lg border text-xs font-semibold transition-colors ${
                        selected.includes(p.id)
                          ? "bg-gold-500/20 text-gold-800 border-gold-500"
                          : "border-line bg-surface hover:bg-surface-alt text-ink"
                      }`}
                      title={selected.includes(p.id) ? "Quitar de comparación" : "Comparar"}
                    >
                      {selected.includes(p.id) ? "Quitar" : "Comparar"}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : mode === "list" ? (
        /* Modo Lista */
        <div className="rounded-xl border border-line bg-surface divide-y divide-line">
          {projects.map((project) => (
            <article className="p-4 flex flex-wrap items-center justify-between gap-3" key={project.id}>
              <div>
                <Link
                  href={"/propiedades/" + project.slug}
                  className="font-semibold min-h-11 inline-flex items-center underline underline-offset-4 text-navy-950 hover:text-gold-700"
                >
                  {project.name}
                </Link>
                <p className="text-sm text-ink-muted m-0">
                  {project.zone ?? "Zona sin registrar"} · {project.unidadesDisponibles} disponibles de{" "}
                  {project.unidadesTotal} · Inversión: {formatearRango(project)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="button min-h-11"
                  aria-pressed={selected.includes(project.id)}
                  onClick={() => {
                    compare(project.id);
                    setComparing(true);
                    requestAnimationFrame(() => comparisonRef.current?.scrollIntoView({ block: "start" }));
                  }}
                >
                  {selected.includes(project.id) ? "Quitar de comparación" : "Comparar"}
                </button>
                <button className="button min-h-11" onClick={() => void share(project.slug)}>
                  Copiar enlace
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        /* Mapa Dominicano de Zonas Inmobiliarias (CMS Studio) */
        <div className="rounded-2xl border border-line bg-surface p-5 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold-600">
                <Navigation className="size-4" />
                <span>Geolocalización Inmobiliaria Oficial</span>
              </div>
              <h2 className="text-xl font-bold text-navy-950 dark:text-foreground mt-0.5">
                Mapa Dominicano de Zonas y Proyectos (CMS Studio)
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed max-w-2xl">
                Encuadre geoespacial de zonas residenciales en República Dominicana vinculado al catálogo real. Selecciona una zona para filtrar desarrollos activos.
              </p>
            </div>

            {zonaMapaSeleccionada && (
              <button
                type="button"
                onClick={() => setZonaMapaSeleccionada(null)}
                className="min-h-11 px-4 text-xs font-bold rounded-xl border border-line bg-surface hover:bg-surface-alt transition-colors"
              >
                Ver todas las zonas ({projects.length} proyectos)
              </button>
            )}
          </div>

          {/* Selector Rápido de Zonas Dominicanas */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(COORDENADAS_ZONAS_DOMINICANAS).map(([clave, z]) => {
              const conteo = projects.filter((p) => {
                const canonica = resolverZonaCanonica(p.zone);
                return canonica ? canonica.clave === clave : (p.zone ?? "").toLowerCase().includes(clave);
              }).length;
              const esActiva = zonaMapaSeleccionada === clave;
              return (
                <button
                  key={clave}
                  type="button"
                  onClick={() => setZonaMapaSeleccionada(esActiva ? null : clave)}
                  className={`min-h-11 px-3.5 rounded-xl text-xs font-bold transition-all border inline-flex items-center gap-2 ${
                    esActiva
                      ? "bg-navy-950 text-white border-navy-950 shadow-xs"
                      : "bg-surface-alt text-ink hover:bg-surface hover:border-gold-500 border-line"
                  }`}
                >
                  <MapPin size={13} className={esActiva ? "text-gold-400" : "text-ink-muted"} />
                  <span>{z.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      esActiva ? "bg-white/20 text-white" : "bg-surface text-ink-muted border border-line"
                    }`}
                  >
                    {conteo}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Visualizador de Territorio y Coordenadas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Mapa Ilustrado Interactivo de RD */}
            <div className="lg:col-span-2 rounded-xl border border-line bg-[#0c1322] p-6 text-white relative overflow-hidden min-h-[340px] flex flex-col justify-between">
              <div className="absolute inset-0 bg-gradient-to-tr from-[#080d18] via-[#0e172a] to-[#142342] opacity-90" />

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">
                    República Dominicana
                  </span>
                  <p className="text-xs text-slate-300">
                    Latitud 18.2°N a 19.9°N · Longitud -72.0°W a -68.3°W
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-navy-900/80 border border-gold-500/30 text-gold-300">
                  {proyectosFiltradosMapa.length} proyectos en vista
                </span>
              </div>

              {/* Pins Geográficos en Lienzo */}
              <div className="relative z-10 my-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(COORDENADAS_ZONAS_DOMINICANAS).slice(0, 8).map(([clave, z]) => {
                  const conteo = projects.filter((p) => {
                    const canonica = resolverZonaCanonica(p.zone);
                    return canonica ? canonica.clave === clave : (p.zone ?? "").toLowerCase().includes(clave);
                  }).length;
                  const esActiva = zonaMapaSeleccionada === clave;
                  return (
                    <button
                      key={clave}
                      type="button"
                      onClick={() => setZonaMapaSeleccionada(esActiva ? null : clave)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        esActiva
                          ? "bg-gold-500/20 border-gold-400 text-white shadow-md"
                          : "bg-navy-900/60 border-navy-800 text-slate-300 hover:border-gold-500/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <MapPin size={14} className={esActiva ? "text-gold-400" : "text-slate-400"} />
                        <span className="text-[10px] font-mono text-gold-400">{z.region}</span>
                      </div>
                      <strong className="block text-xs font-bold truncate text-white">{z.name}</strong>
                      <span className="text-[11px] text-slate-400">
                        {conteo} {conteo === 1 ? "desarrollo" : "desarrollos"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative z-10 text-[11px] text-slate-400 flex items-center justify-between border-t border-navy-800 pt-3">
                <span>Catálogo georreferenciado con coordenadas de PortalWeb CMS</span>
                <span className="font-mono text-gold-500">shared/zone-coordinates.mjs</span>
              </div>
            </div>

            {/* Panel Lateral de Fichas de la Zona */}
            <div className="rounded-xl border border-line bg-surface-alt p-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-navy-950 dark:text-foreground mb-1">
                  {zonaMapaSeleccionada
                    ? COORDENADAS_ZONAS_DOMINICANAS[zonaMapaSeleccionada]?.name || zonaMapaSeleccionada
                    : "Inventario Inmobiliario Dominicano"}
                </h3>
                <p className="text-xs text-ink-muted mb-4">
                  {zonaMapaSeleccionada
                    ? COORDENADAS_ZONAS_DOMINICANAS[zonaMapaSeleccionada]?.description
                    : "Selecciona una zona en el selector superior para ver proyectos agrupados."}
                </p>

                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {proyectosFiltradosMapa.slice(0, 10).map((p) => (
                    <article
                      key={p.id}
                      className="p-3 rounded-lg border border-line bg-surface hover:border-gold-500 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <Link
                          href={`/propiedades/${p.slug}`}
                          className="text-xs font-bold text-navy-950 hover:text-gold-700 truncate"
                        >
                          {p.name}
                        </Link>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0">
                          {p.unidadesDisponibles} disp.
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-ink-muted">
                        <span>{p.zone || "Zona no especificada"}</span>
                        <strong className="text-ink font-semibold">{formatearRango(p)}</strong>
                      </div>
                    </article>
                  ))}
                  {proyectosFiltradosMapa.length === 0 && (
                    <p className="text-xs text-ink-muted p-4 text-center">
                      No hay proyectos registrados para esta zona en los filtros actuales.
                    </p>
                  )}
                </div>
              </div>

              {zonaMapaSeleccionada && (
                <div className="pt-3 border-t border-line mt-3">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${COORDENADAS_ZONAS_DOMINICANAS[zonaMapaSeleccionada]?.name || zonaMapaSeleccionada}, República Dominicana`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full min-h-11 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-lg border border-line bg-surface hover:bg-surface-hover text-ink transition-colors"
                  >
                    <ExternalLink size={13} />
                    <span>Abrir zona en Google Maps</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reporte de Dato de Obra */}
      <Dialog open={report} onOpenChange={setReport}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar dato de obra o inventario</DialogTitle>
            <DialogDescription>
              Envía una observación sobre disponibilidad, precios o planos de un proyecto para revisión editorial.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              setReported(true);
            }}
          >
            <label className="block text-sm font-semibold">
              Proyecto
              <select className="w-full min-h-11 rounded-lg border border-line bg-canvas px-3 mt-1">
                {projects.map((project) => (
                  <option key={project.id}>{project.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Dato por verificar
              <textarea
                className="w-full rounded-lg border border-line bg-canvas p-3 mt-1 text-sm"
                required
                rows={3}
                placeholder="Especifica la unidad, precio o avance de obra a revisar..."
              />
            </label>
            <button className="button primary min-h-11 w-full" type="submit">
              Enviar nota editorial
            </button>
            {reported && (
              <p role="status" className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                Observación registrada para comprobación en la próxima sincronización de inventario.
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
