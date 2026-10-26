"use client";

import React, { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { cn } from "@/lib/utils";

export interface HojaLateralProps {
  abierto: boolean;
  onClose: () => void;
  titulo: string;
  subtitulo?: string;
  ancho?: "normal" | "amplio";
  accionesPie?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Patrón 3: HojaLateral (Quisqueya Flat & Compact Drawer/Sheet).
 * Dimensiones y distribución estándar:
 * - Ancho: 420px (normal) o 540px (amplio)
 * - Header fijo: 44px
 * - Cuerpo con scroll independiente
 * - Footer fijo de acciones: 48px
 * - Borde plano, sin sombras difusas.
 */
export function HojaLateral({
  abierto,
  onClose,
  titulo,
  subtitulo,
  ancho = "normal",
  accionesPie,
  children,
  className,
}: HojaLateralProps) {
  const containerRef = useFocusTrap<HTMLElement>({ onClose });

  // Escape key handler
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && abierto) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, onClose]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-navy-950/40 animate-in fade-in duration-150"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hoja-lateral-titulo"
        className={cn(
          "h-full bg-surface border-l border-border flex flex-col shadow-none outline-none animate-in slide-in-from-right duration-200",
          ancho === "amplio" ? "w-full sm:w-[540px]" : "w-full sm:w-[420px]",
          className
        )}
      >
        {/* Header Fijo (44px) */}
        <header className="h-11 px-4 border-b border-border bg-surface flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <h2
              id="hoja-lateral-titulo"
              className="text-sm font-bold text-navy-950 truncate m-0 font-heading"
            >
              {titulo}
            </h2>
            {subtitulo && (
              <p className="text-[11px] text-muted-foreground truncate m-0">{subtitulo}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-7 rounded-md border border-border bg-surface hover:bg-surface-alt text-muted-foreground hover:text-navy-950 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar panel lateral"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Cuerpo Scrolleable */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Footer Fijo (48px) */}
        {accionesPie && (
          <footer className="min-h-12 px-4 py-2 border-t border-border bg-surface flex items-center justify-end gap-2 shrink-0">
            {accionesPie}
          </footer>
        )}
      </section>
    </div>
  );
}
