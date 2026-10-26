"use client";

import React, { type ReactNode } from "react";
import { EstadoCarga, EstadoError } from "@/app/(crm)/_ui/estados";
import { ModuleTabs, type TabItem } from "@/app/(crm)/_ui/module-tabs";
import { cn } from "@/lib/utils";

export interface ItemResumen {
  etiqueta: string;
  valor: string | number;
  nota?: string;
}

export interface FichaConPestanasProps {
  // 1. Identidad de la Ficha
  identidad: {
    titulo: string;
    subtitulo?: string;
    avatar?: ReactNode;
    insignia?: ReactNode;
    acciones?: ReactNode;
  };

  // 2. Franja de Resumen (44px vertical budget)
  resumen?: ItemResumen[];

  // 3. Barra de Pestañas (36px vertical budget)
  pestanas: TabItem[];
  pestanaActiva: string;
  onPestanaChange: (id: string) => void;
  variantePestanas?: "underline" | "pills";

  // Estados de interfaz
  cargando?: boolean;
  error?: Error | { message?: string; digest?: string } | null;
  onReintentar?: () => void;

  children: ReactNode;
  className?: string;
}

/**
 * Patrón 2: FichaConPestañas (Quisqueya Flat & Compact).
 * Diseñado para vistas de detalle e inspectores 360:
 * - Cabecera de identidad con avatar y acciones
 * - Franja resumen de KPIs (44px)
 * - Barra de pestañas fijas (36px)
 * - Contenido modular con soporte para los 6 estados.
 */
export function FichaConPestanas({
  identidad,
  resumen,
  pestanas,
  pestanaActiva,
  onPestanaChange,
  variantePestanas = "underline",
  cargando = false,
  error = null,
  onReintentar,
  children,
  className,
}: FichaConPestanasProps) {
  return (
    <div className={cn("flex flex-col w-full gap-4", className)}>
      {/* 1. Cabecera de Identidad */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3 min-w-0">
          {identidad.avatar && <div className="shrink-0">{identidad.avatar}</div>}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-heading font-bold text-lg md:text-xl text-navy-950 tracking-tight leading-none m-0">
                {identidad.titulo}
              </h1>
              {identidad.insignia && <div>{identidad.insignia}</div>}
            </div>
            {identidad.subtitulo && (
              <p className="text-xs text-muted-foreground mt-0.5 m-0 truncate">
                {identidad.subtitulo}
              </p>
            )}
          </div>
        </div>

        {identidad.acciones && (
          <div className="shrink-0 flex items-center gap-2">{identidad.acciones}</div>
        )}
      </div>

      {/* 2. Franja de Resumen (44px) */}
      {resumen && resumen.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-surface border border-border rounded-lg p-2 min-h-[44px]">
          {resumen.map((item, index) => (
            <div
              key={index}
              className="flex flex-col justify-center px-3 py-1 border-r border-border last:border-r-0"
            >
              <span className="text-[10.5px] uppercase font-semibold text-muted-foreground tracking-wider">
                {item.etiqueta}
              </span>
              <div className="flex items-baseline gap-1.5">
                <strong className="text-sm font-bold text-navy-950 tabular-nums">
                  {item.valor}
                </strong>
                {item.nota && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {item.nota}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Barra de Pestañas Fijas (36px) */}
      <div className="w-full">
        <ModuleTabs
          tabs={pestanas}
          activeTab={pestanaActiva}
          onTabChange={onPestanaChange}
          variant={variantePestanas}
        />
      </div>

      {/* 4. Contenedor de Contenido con Estados */}
      <div className="w-full pt-1">
        {cargando ? (
          <EstadoCarga tipo="tarjeta" filas={3} />
        ) : error ? (
          <EstadoError error={error} onReintentar={onReintentar} />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
