"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Calendar,
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

  const isActive = (ruta: string) =>
    pathname === ruta || (ruta !== "/inicio" && pathname.startsWith(`${ruta}/`));

  return (
    <>
      {/* Fixed bottom navigation bar for mobile (<768px) */}
      <nav
        aria-label="Navegación móvil rápida"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line px-2 pt-1 pb-[max(0.35rem,var(--sab))] pl-[max(0.5rem,var(--sal))] pr-[max(0.5rem,var(--sar))]"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* 1. Inicio */}
          <Link
            href="/inicio"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition-all ${
              isActive("/inicio")
                ? "bg-gold-100 text-navy-950 font-bold"
                : "text-ink-muted hover:text-navy-950 font-medium"
            }`}
          >
            <div className="relative">
              <LayoutDashboard
                className={`size-5 transition-transform ${
                  isActive("/inicio") ? "text-navy-950 stroke-[2.2]" : ""
                }`}
              />
              {isActive("/inicio") && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-gold-600" />
              )}
            </div>
            <span className="text-[13px] mt-1 leading-none">Inicio</span>
          </Link>

          {/* 2. Leads */}
          <Link
            href="/leads"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition-all ${
              isActive("/leads")
                ? "bg-gold-100 text-navy-950 font-bold"
                : "text-ink-muted hover:text-navy-950 font-medium"
            }`}
          >
            <div className="relative">
              <UserPlus
                className={`size-5 transition-transform ${
                  isActive("/leads") ? "text-navy-950 stroke-[2.2]" : ""
                }`}
              />
              {isActive("/leads") && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-gold-600" />
              )}
            </div>
            <span className="text-[13px] mt-1 leading-none">Leads</span>
          </Link>

          {/* 3. Center Elevated Action Button (FAB) */}
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex items-center justify-center size-12 -mt-3 rounded-full bg-gold-600 text-navy-950 border-2 border-surface"
            aria-label="Abrir buscador global de CRM"
          >
            <Search className="size-5 stroke-[2.5]" />
          </button>

          {/* 4. Agenda */}
          <Link
            href="/agenda"
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition-all ${
              isActive("/agenda")
                ? "bg-gold-100 text-navy-950 font-bold"
                : "text-ink-muted hover:text-navy-950 font-medium"
            }`}
          >
            <div className="relative">
              <Calendar
                className={`size-5 transition-transform ${
                  isActive("/agenda") ? "text-navy-950 stroke-[2.2]" : ""
                }`}
              />
              {isActive("/agenda") && (
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-1 rounded-full bg-gold-600" />
              )}
            </div>
            <span className="text-[13px] mt-1 leading-none">Agenda</span>
          </Link>

          {/* 5. Más Módulos (Drawer Trigger) */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-1 rounded-xl transition-all ${
              drawerOpen
                ? "bg-gold-100 text-navy-950 font-bold"
                : "text-ink-muted hover:text-navy-950 font-medium"
            }`}
            aria-label="Ver todos los módulos"
          >
            <Grid className="size-5" />
            <span className="text-[13px] mt-1 leading-none">Más</span>
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
            className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-surface rounded-t-3xl border-t border-line shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
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
                  <div key={workspace.id} className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[13px] font-semibold text-navy-950">
                        {workspace.nombre}
                      </span>
                      <small className="text-[13px] text-ink-muted">
                        {modulesInWs.length} módulos
                      </small>
                    </div>

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
                  </div>
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
