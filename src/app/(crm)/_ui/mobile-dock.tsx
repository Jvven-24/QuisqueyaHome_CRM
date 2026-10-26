"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid,
  Search,
  ExternalLink,
  X,
} from "lucide-react";
import { WORKSPACES, type Modulo } from "../modulos";
import { ModuloIcon } from "./icon-resolver";
import { CommandPalette } from "./command-palette";

interface MobileDockProps {
  modulosVisibles: readonly Modulo[];
  etiquetaRol: string;
}

export function MobileDock({
  modulosVisibles,
  etiquetaRol,
}: MobileDockProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('button,a[href],summary') ?? []).filter(element => element.getClientRects().length > 0);
    focusable()?.[0]?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setDrawerOpen(false); }
      if (event.key !== "Tab") return;
      const nodes = focusable(); if (!nodes?.length) return;
      const first = nodes[0]!; const last = nodes[nodes.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
    }
    document.addEventListener("keydown", onKey);
    return () => {document.removeEventListener("keydown", onKey); previous?.focus();};
  }, [drawerOpen]);

  const isActive = (ruta: string) =>
    pathname === ruta || (ruta !== "/inicio" && pathname.startsWith(`${ruta}/`));

  return (
    <>
      {/* Fixed bottom navigation bar for mobile (<768px) */}
      <nav aria-label="Navegación móvil rápida" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line px-2 pt-1 pb-[max(0.35rem,var(--sab))]">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {["/inicio", "/leads", "/propiedades", "/agenda"].map((ruta) => {
            const modulo = modulosVisibles.find((item) => item.ruta === ruta);
            if (!modulo) return null;
            return <Link key={ruta} href={ruta} aria-current={isActive(ruta) ? "page" : undefined} className={`flex min-w-0 flex-1 flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl ${isActive(ruta) ? "bg-gold-100 text-navy-950 font-bold" : "text-ink-muted font-medium"}`}>
              <ModuloIcon name={modulo.icono} className="size-5" />
              <span className="text-[13px] mt-1 leading-none">{ruta === "/propiedades" ? "Inventario" : modulo.nombre}</span>
            </Link>;
          })}
          <button type="button" onClick={() => setDrawerOpen(true)} aria-expanded={drawerOpen} aria-controls="mobile-modules-menu" className="flex min-w-0 flex-1 flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl text-ink-muted" aria-label="Ver todos los módulos">
            <Grid className="size-5" /><span className="text-[13px] mt-1 leading-none">Más</span>
          </button>
        </div>
      </nav>

      {/* Sliding Bottom Drawer for "Más Módulos" */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-navy-950/70"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            id="mobile-modules-menu"
            ref={drawerRef} role="dialog" aria-modal="true" aria-label="Todos los módulos del CRM"
            className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-surface rounded-t-3xl border-t border-line shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => { setDrawerOpen(false); setCommandOpen(true); }} className="min-h-12 flex items-center gap-2 px-5" aria-label="Abrir buscador global de CRM"><Search className="size-5" />Buscar en el CRM</button>
            <div className="px-4 py-2 border-t border-line"><p className="text-sm font-semibold m-0">Acciones de campo</p><div className="flex flex-wrap gap-2">{[{route: "/leads", label: "Capturar lead"}, {route: "/agenda", label: "Programar visita"}, {route: "/tareas", label: "Seguimiento"}].filter(action => modulosVisibles.some(module => module.ruta === action.route)).map(action => <Link className="private-text-action" key={action.route} href={action.route} onClick={() => setDrawerOpen(false)}>{action.label}</Link>)}</div></div>
            {/* Drawer Header */}
            <div className="px-5 pt-3 pb-3 border-b border-line flex items-center justify-between bg-surface-alt">
              <div className="flex items-center gap-2.5">
                <div className="size-2 rounded-full bg-gold-600" />
                <h3 className="font-heading font-bold text-navy-950 text-sm tracking-wide">
                  Espacios de Trabajo CRM
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="size-12 inline-flex items-center justify-center rounded-lg text-ink-muted hover:text-ink hover:bg-surface transition-colors"
                aria-label="Cerrar menú"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Workspaces & Modules Grid Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-[max(2rem,env(safe-area-inset-bottom))]">
              {WORKSPACES.map((workspace) => {
                const modulesInWs = modulosVisibles.filter(
                  (m) => m.workspaceId === workspace.id
                );
                if (modulesInWs.length === 0) return null;

                return (
                  <details key={workspace.id} className="space-y-2" open={modulesInWs.some(module => isActive(module.ruta))}>
                    <summary className="flex min-h-12 cursor-pointer items-center justify-between px-1">
                      <span className="text-[13px] font-semibold text-navy-950">
                        {workspace.nombre}
                      </span>
                      <small className="text-[13px] text-ink-muted">
                        {modulesInWs.length} módulos
                      </small>
                    </summary>

                    <div className="grid grid-cols-2 gap-2">
                      {modulesInWs.map((modulo) => {
                        const active = isActive(modulo.ruta);
                        return (
                          <Link
                            key={modulo.ruta}
                            href={modulo.ruta}
                            onClick={() => setDrawerOpen(false)}
                            className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                              active
                                ? "bg-navy-950 text-white border-navy-950 shadow-xs"
                                : "bg-surface-alt/70 hover:bg-surface-alt text-ink border-line"
                            }`}
                          >
                            <span
                              className={`p-1.5 rounded-lg shrink-0 ${
                                active
                                  ? "bg-gold-600 text-navy-950"
                                  : "bg-surface text-navy-900 border border-line"
                              }`}
                            >
                              <ModuloIcon name={modulo.icono} className="size-4" />
                            </span>
                            <div className="truncate">
                              <strong className="text-[13px] font-semibold block truncate leading-tight">
                                {modulo.nombre}
                              </strong>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                );
              })}

              {/* Bottom user badge inside drawer */}
              <div className="pt-2 border-t border-line flex items-center justify-between text-[13px] text-ink-muted">
                <span className="font-semibold text-navy-950">
                  Rol: {etiquetaRol}
                </span>
                <a
                  href="https://quisqueyahome.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center gap-1 font-semibold text-navy-900"
                >
                  <ExternalLink className="size-3" />
                  Portal Web
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global Command Palette modal */}
      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        modulosVisibles={modulosVisibles}
      />
    </>
  );
}
