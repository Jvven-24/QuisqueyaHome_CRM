"use client";

import React, { type ReactNode } from "react";
import { Filter, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EstadoCarga, EstadoError, SinResultados, Vacio } from "@/app/(crm)/_ui/estados";
import { PageHeader } from "@/app/(crm)/_ui/prototipo-ui";
import { cn } from "@/lib/utils";

export interface VistaGuardada {
  id: string;
  etiqueta: string;
  conteo?: number;
}

export interface ChipFiltro {
  id: string;
  etiqueta: string;
  valor: string;
  onQuitar: () => void;
}

export interface ListaConFiltrosProps {
  // Cabecera compacta (44px)
  titulo: string;
  eyebrow?: string;
  subtitulo?: string;
  accionPrincipal?: ReactNode;

  // Vistas guardadas (pills rápidas en barra superior)
  vistasGuardadas?: VistaGuardada[];
  vistaActivaId?: string;
  onSeleccionarVista?: (id: string) => void;

  // Barra de filtros fija (40px)
  busqueda?: string;
  onBusquedaChange?: (valor: string) => void;
  placeholderBusqueda?: string;
  filtrosInline?: ReactNode;
  filtrosAdicionales?: ReactNode;

  // Chips de filtros activos
  chips?: ChipFiltro[];
  onLimpiarFiltros?: () => void;

  // Conteo total
  total?: number;
  etiquetaTotal?: string;

  // Control de estados de interfaz
  cargando?: boolean;
  error?: Error | { message?: string; digest?: string } | null;
  onReintentar?: () => void;
  esVacio?: boolean;
  mensajeVacio?: { titulo: string; texto: string; accion?: ReactNode };

  children: ReactNode;
  className?: string;
}

/**
 * Patrón 1: ListaConFiltros (Quisqueya Flat & Compact).
 * Garantiza el presupuesto vertical:
 * - Header de página: ≤ 44px
 * - Barra de filtros fija: 40px
 * - Chips de filtros (opcionales): 28px
 * - Contenido tabular/grid con manejo de 6 estados canónicos.
 */
export function ListaConFiltros({
  titulo,
  eyebrow,
  subtitulo,
  accionPrincipal,
  vistasGuardadas,
  vistaActivaId,
  onSeleccionarVista,
  busqueda,
  onBusquedaChange,
  placeholderBusqueda = "Buscar registros...",
  filtrosInline,
  filtrosAdicionales,
  chips,
  onLimpiarFiltros,
  total,
  etiquetaTotal = "registros",
  cargando = false,
  error = null,
  onReintentar,
  esVacio = false,
  mensajeVacio,
  children,
  className,
}: ListaConFiltrosProps) {
  const tieneFiltrosActivos = (chips && chips.length > 0) || (busqueda && busqueda.trim().length > 0);

  return (
    <div className={cn("flex flex-col w-full", className)}>
      {/* 1. Cabecera Compacta (44px vertical budget) */}
      <PageHeader
        eyebrow={eyebrow}
        title={titulo}
        subtitle={subtitulo}
        action={accionPrincipal}
      />

      {/* 2. Barra de Filtros Fija (40px) */}
      <div className="filter-bar flex items-center justify-between gap-2.5 bg-surface border border-border rounded-lg px-3 py-1.5 min-h-[40px] mb-3">
        {/* Lado izquierdo: Vistas guardadas + Búsqueda */}
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
          {vistasGuardadas && vistasGuardadas.length > 0 && (
            <div className="flex items-center gap-1 p-0.5 bg-surface-alt border border-border rounded-md mr-1 shrink-0">
              {vistasGuardadas.map((vg) => {
                const activa = vg.id === vistaActivaId;
                return (
                  <button
                    key={vg.id}
                    type="button"
                    onClick={() => onSeleccionarVista?.(vg.id)}
                    className={cn(
                      "px-2 py-0.5 text-xs rounded transition-colors cursor-pointer",
                      activa
                        ? "bg-surface font-semibold text-navy-950 border border-border"
                        : "text-muted-foreground hover:text-ink"
                    )}
                  >
                    <span>{vg.etiqueta}</span>
                    {vg.conteo !== undefined && (
                      <span className="ml-1 text-[10px] font-mono opacity-70">
                        ({vg.conteo})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Campo de búsqueda rápida */}
          {onBusquedaChange && (
            <div className="relative flex items-center min-w-[200px] max-w-xs flex-1">
              <Search className="absolute left-2.5 size-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={busqueda ?? ""}
                onChange={(e) => onBusquedaChange(e.target.value)}
                placeholder={placeholderBusqueda}
                className="w-full h-8 pl-8 pr-2.5 text-xs bg-surface-alt border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-600 transition-colors"
              />
            </div>
          )}

          {/* Selects inline */}
          {filtrosInline && <div className="flex items-center gap-2 flex-wrap">{filtrosInline}</div>}

          {/* Popover "+ Más filtros" */}
          {filtrosAdicionales && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium border border-border bg-surface hover:bg-surface-alt text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer shrink-0"
                >
                  <Filter className="size-3.5" />
                  <span>+ Más filtros</span>
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80 bg-surface border border-border shadow-md rounded-lg p-3">
                <div className="text-xs font-semibold text-navy-950 mb-2">Filtros Avanzados</div>
                <div className="flex flex-col gap-2.5">{filtrosAdicionales}</div>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Lado derecho: Total y limpiar */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {total !== undefined && (
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {total} {etiquetaTotal}
            </span>
          )}

          {tieneFiltrosActivos && onLimpiarFiltros && (
            <button
              type="button"
              onClick={onLimpiarFiltros}
              className="text-xs text-gold-700 hover:text-gold-600 font-semibold cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* 3. Tira de Chips Activos (28px) */}
      {chips && chips.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3 px-0.5">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Filtros:</span>
          {chips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-surface-alt border border-border text-slate-800"
            >
              <span className="text-muted-foreground">{chip.etiqueta}:</span>
              <strong>{chip.valor}</strong>
              <button
                type="button"
                onClick={chip.onQuitar}
                className="hover:text-navy-950 text-slate-400 cursor-pointer ml-0.5"
                aria-label={`Quitar filtro ${chip.etiqueta}`}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 4. Contenedor de Datos con Estados Canónicos */}
      <div className="w-full">
        {cargando ? (
          <EstadoCarga />
        ) : error ? (
          <EstadoError error={error} onReintentar={onReintentar} />
        ) : esVacio && !tieneFiltrosActivos ? (
          <Vacio
            titulo={mensajeVacio?.titulo ?? "Sin registros"}
            texto={mensajeVacio?.texto ?? "Aún no se han creado registros en este módulo."}
            accion={mensajeVacio?.accion}
          />
        ) : esVacio && tieneFiltrosActivos ? (
          <SinResultados
            onLimpiar={onLimpiarFiltros}
            chips={chips?.map((c) => `${c.etiqueta}: ${c.valor}`)}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
