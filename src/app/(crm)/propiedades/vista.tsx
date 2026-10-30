"use client";

import { CatalogExplorer } from "./_componentes/catalog-explorer";
import { filtrarProyectos } from "@/application/proyectos/filtros";
import { absorcionUnidades } from "@/domain/unidades";
import { fechaLocal } from "@/domain/zona-horaria";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PROJECT_TYPES } from "@/domain/catalogs";
import { Avatar, Badge, PageHeader } from "../_ui/prototipo-ui";
import { SinResultados, Vacio } from "../_ui/estados";
import { ETIQUETAS_TIPO, FormularioProyecto, type BrokerOpcion } from "./_formulario-proyecto";
import {
  ArrowRight,
  Building2,
  Calendar,
  Layers,
  Lock,
  MapPin,
  Percent,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";

export type ProyectoFila = {
  id: number;
  slug: string;
  name: string;
  zone: string | null;
  projectType: string;
  progressPercent: number;
  internalPriceCents: number | null;
  publicRangeMinCents: number | null;
  publicRangeMaxCents: number | null;
  currency: string;
  brokerId: number | null;
  brokerName: string | null;
  unidadesDisponibles: number;
  unidadesTotal: number;
  unidadesReservadas?: number;
  unidadesVendidas?: number;
  confoturEligible?: boolean | null;
  developer?: string | null;
  estimatedDeliveryDate?: string | null;
  description?: string | null;
};

function formatoRango(minCents: number | null, maxCents: number | null, currency: string): string {
  if (minCents == null && maxCents == null) return "Consultar rango";
  const fmt = (cents: number) => `${currency} ${(cents / 100).toLocaleString("es-DO")}`;
  if (minCents != null && maxCents != null) return `${fmt(minCents)} – ${fmt(maxCents)}`;
  return fmt((minCents ?? maxCents)!);
}

/**
 * Catálogo visual Bento Grid de proyectos con portadas en Navy profundo,
 * badges Confotur de exención fiscal y barras de absorción de unidades.
 *
 * Doble esquema de precios:
 * - Precio interno confidencial visible solo para Administrador (cuando `internalPriceCents !== null`).
 * - Rango comercial público para brokers.
 */
export function PropiedadesVista({
  proyectos,
  brokers,
  filtros,
  puedeCrear,
  puedeEditarPrecioReal,
}: {
  proyectos: ProyectoFila[];
  brokers: BrokerOpcion[];
  filtros: { zone: string; type?: string };
  puedeCrear: boolean;
  puedeEditarPrecioReal: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [creando, setCreando] = useState(false);
  const [terminoBusqueda, setTerminoBusqueda] = useState(filtros.zone);

  function irCon(cambios: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    router.push(params.size ? `${pathname}?${params.toString()}` : pathname);
  }

  useEffect(() => setTerminoBusqueda(filtros.zone), [filtros.zone]);
  useEffect(() => {
    if (terminoBusqueda === filtros.zone) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (terminoBusqueda.trim()) params.set("zone", terminoBusqueda.trim());
      else params.delete("zone");
      router.replace(params.size ? pathname + "?" + params : pathname, { scroll: false });
    }, 350);
    return () => clearTimeout(timer);
  }, [terminoBusqueda, filtros.zone, pathname, router, searchParams]);
  const proyectosVisibles = filtrarProyectos(proyectos, terminoBusqueda, filtros.type);
  const hayFiltro = Boolean(terminoBusqueda.trim() || filtros.type);

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Private Desk · Catálogo Exclusivo"
        title="Propiedades internas"
        subtitle="Inventario de desarrollos de lujo, análisis de absorción comercial y disponibilidad en tiempo real."
        action={
          puedeCrear ? (
            <button
              className="button primary min-h-[44px] px-5 text-[13px] font-semibold inline-flex items-center gap-2"
              type="button"
              onClick={() => setCreando(true)}
            >
              <Plus className="size-4" />
              Nuevo proyecto
            </button>
          ) : undefined
        }
      />

      {/* Banner de confidencialidad: una línea en móvil, detalle en escritorio */}
      <div className="rounded-xl border border-line bg-surface px-3 py-2.5 shadow-xs flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="size-9 rounded-lg bg-navy-950 text-[var(--gold-600)] flex items-center justify-center shrink-0 border border-[var(--gold-600)]/30">
            <ShieldCheck className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="m-0 text-[13px] font-bold text-ink">Precios con doble esquema</p>
            <p className="m-0 hidden text-[13px] text-muted-foreground sm:block">
              El precio real interno solo lo ven perfiles autorizados; los brokers ven el rango comercial público.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-surface-alt px-2.5 py-1 text-[13px] text-ink-muted tabular-nums">
          <span className="font-semibold text-ink">{proyectos.length}</span> proyecto{proyectos.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Barra de filtros accesible con min-h-[44px] */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-surface p-3 rounded-xl border border-line sm:gap-3">
        <div className="sm:col-span-8 relative flex items-center">
          <Search className="absolute left-3.5 size-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            className="w-full min-h-[44px] pl-10 pr-4 text-[13px] rounded-lg border border-line bg-canvas focus:bg-surface focus:border-gold-600 focus:outline-none transition-colors"
            placeholder="Buscar por zona (Bávaro, Cap Cana…)"
            aria-label="Buscar proyectos por zona"
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") irCon({ zone: terminoBusqueda.trim() || undefined });
            }}
          />
          {terminoBusqueda && terminoBusqueda !== filtros.zone && (
            <button
              type="button"
              onClick={() => irCon({ zone: terminoBusqueda.trim() || undefined })}
              className="absolute right-2 px-3 min-h-[36px] text-[13px] font-medium text-gold-700 bg-gold-100 hover:bg-gold-200 rounded-md transition-colors"
            >
              Aplicar
            </button>
          )}
        </div>
        <div className="sm:col-span-4">
          <select
            aria-label="Filtrar por tipo de desarrollo"
            className="w-full min-h-[44px] px-3 text-[13px] rounded-lg border border-line bg-canvas focus:bg-surface focus:border-gold-600 focus:outline-none transition-colors"
            value={filtros.type ?? ""}
            onChange={(event) => irCon({ type: event.target.value || undefined, zone: terminoBusqueda.trim() || undefined })}
          >
            <option value="">Todos los tipos de desarrollo</option>
            {PROJECT_TYPES.map((tipo) => (
              <option key={tipo} value={tipo}>
                {ETIQUETAS_TIPO[tipo]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {proyectosVisibles.length === 0 ? (
        hayFiltro ? (
          <SinResultados onLimpiar={() => {
            setTerminoBusqueda("");
            irCon({ zone: undefined, type: undefined });
          }} />
        ) : (
          <Vacio titulo="Sin proyectos todavía" texto="Registra el primer desarrollo inmobiliario con “Nuevo proyecto”." />
        )
      ) : (
        /* Catálogo operativo: tarjetas, lista y mapa con permisos de la consulta original. */
        <CatalogExplorer projects={proyectosVisibles}><div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr">
          {proyectosVisibles.map((proyecto) => {
            const esConfotur = proyecto.confoturEligible === true;

            const total = proyecto.unidadesTotal;
            const disponibles = proyecto.unidadesDisponibles;
            const porcentajeAbsorcion = absorcionUnidades(total, disponibles);

            return (
              <Link
                key={proyecto.id}
                href={`/propiedades/${proyecto.slug}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-line/90 bg-surface shadow-xs hover:border-gold-500/50 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Portada en Navy profundo */}
                <div className="relative min-h-[132px] bg-[#0c1322] p-4 flex flex-col justify-between overflow-hidden text-white border-b border-navy-900">
                  {/* Gradiente sutil y patrón visual */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#101b33] via-[#0c1322] to-[#080d18] opacity-95" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gold-500/10 via-transparent to-transparent pointer-events-none" />

                  {/* Fila superior: Logo Quisqueya Home + Badges */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Image
                        src="/brand/app-icon-192.png"
                        alt="Quisqueya Home"
                        width={36}
                        height={36}
                        className="size-9 rounded-xl object-contain shadow-md border border-gold-500/40 bg-navy-950 p-0.5"
                      />
                      {esConfotur && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 px-3 py-1 text-[13px] font-semibold tracking-wide backdrop-blur-xs shadow-xs">
                          <ShieldCheck className="size-3.5 text-emerald-400" />
                          <span title="Confotur: pendiente de revisión">Confotur<span className="sr-only">: pendiente de revisión</span></span>
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-900/90 text-gold-400 border border-gold-500/30 px-3 py-1 text-[13px] font-bold backdrop-blur-xs shadow-xs">
                      <Percent className="size-3 text-gold-500" />
                      {proyecto.progressPercent}% obra
                    </span>
                  </div>

                  {/* Fila inferior de portada: Nombre y ubicación */}
                  <div className="relative z-10 pt-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge tone="gold">
                        {ETIQUETAS_TIPO[proyecto.projectType] ?? proyecto.projectType}
                      </Badge>
                      {proyecto.developer && (
                        <span className="hidden items-center gap-1 text-[13px] text-slate-300 truncate max-w-[180px] sm:inline-flex">
                          <Building2 className="size-3.5 text-gold-400 shrink-0" />
                          {proyecto.developer}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-white group-hover:text-gold-300 transition-colors line-clamp-1">
                      {proyecto.name}
                    </h2>
                    <div className="flex items-center gap-1 text-[13px] text-slate-300 mt-1">
                      <MapPin className="size-3.5 text-gold-400 shrink-0" />
                      <span>{proyecto.zone ?? "Ubicación sin especificar"}</span>
                    </div>
                  </div>
                </div>

                {/* Cuerpo de la tarjeta Bento */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  {/* Barra de absorción de unidades */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="font-semibold text-ink flex items-center gap-1.5">
                        <Layers className="size-4 text-gold-700" />
                        Absorción
                      </span>
                      <span className="font-bold text-ink tabular-nums text-[13px]">
                        {porcentajeAbsorcion}%
                      </span>
                    </div>

                    {/* Barra de progreso con gradiente */}
                    <div className="h-2 w-full rounded-full bg-line/80 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${porcentajeAbsorcion}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-muted-foreground">
                        {disponibles} de {total} disponibles
                      </span>
                      <span className={`font-semibold ${disponibles > 0 ? "text-emerald-700" : "text-amber-800"}`}>
                        {disponibles > 0 ? "En venta" : total > 0 ? "Agotado" : "Sin inventario"}
                      </span>
                    </div>
                  </div>

                  {/* Doble esquema de precios */}
                  {proyecto.internalPriceCents != null ? (
                    <div className="rounded-xl p-3 bg-gradient-to-br from-gold-50/90 to-amber-50/50 border border-gold-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="inline-flex items-center gap-1.5 font-bold text-gold-950">
                          <Lock className="size-3.5 text-gold-700" />
                          Precio interno
                        </span>
                        <span className="font-bold text-ink tabular-nums text-sm">
                          {proyecto.currency} {(proyecto.internalPriceCents / 100).toLocaleString("es-DO")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[13px] text-muted-foreground pt-1.5 border-t border-gold-200/60">
                        <span>Rango público</span>
                        <span className="font-semibold text-ink tabular-nums">
                          {formatoRango(proyecto.publicRangeMinCents, proyecto.publicRangeMaxCents, proyecto.currency)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl p-3 bg-surface-alt border border-line space-y-1.5">
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-medium text-muted-foreground">Rango comercial</span>
                        <span className="font-bold text-ink tabular-nums text-sm">
                          {formatoRango(proyecto.publicRangeMinCents, proyecto.publicRangeMaxCents, proyecto.currency)}
                        </span>
                      </div>
                      <div className="hidden items-center gap-1.5 text-[13px] text-muted-foreground pt-1.5 border-t border-line sm:flex">
                        <Lock className="size-3 text-muted-foreground/70" />
                        <span>Precio interno reservado</span>
                      </div>
                    </div>
                  )}

                  {/* Pie de tarjeta: Broker asignado y CTA */}
                  <div className="pt-3 border-t border-line flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={proyecto.brokerName ?? "Sin asignar"} small />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-ink truncate">
                          {proyecto.brokerName ?? "Sin broker"}
                        </p>
                        {proyecto.estimatedDeliveryDate && (
                          <p className="text-[13px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="size-3 text-gold-700" />
                            Entrega {fechaLocal(proyecto.estimatedDeliveryDate)}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex items-center justify-center gap-1 min-h-[44px] px-3.5 rounded-lg bg-navy-950 text-white font-medium text-[13px] group-hover:bg-gold-700 transition-colors shrink-0">
                      Ficha <ArrowRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div></CatalogExplorer>
      )}

      {creando && (
        <FormularioProyecto
          brokers={brokers}
          puedeEditarPrecioReal={puedeEditarPrecioReal}
          onClose={() => setCreando(false)}
        />
      )}
    </div>
  );
}
