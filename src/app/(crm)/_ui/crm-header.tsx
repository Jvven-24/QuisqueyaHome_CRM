"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Plus,
  Bell,
  ChevronRight,
  ExternalLink,
  UserPlus,
  CalendarPlus,
  CheckCircle,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MODULOS, WORKSPACES } from "../modulos";
import { CommandPalette } from "./command-palette";

interface CrmHeaderProps {
  etiquetaRol: string;
}

export function CrmHeader({
  etiquetaRol,
}: CrmHeaderProps) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);

  // Determine current active module and workspace
  const currentModule = MODULOS.find(
    (m) => pathname === m.ruta || pathname.startsWith(`${m.ruta}/`)
  );
  const currentWorkspace = currentModule
    ? WORKSPACES.find((w) => w.id === currentModule.workspaceId)
    : null;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-line bg-surface/95 px-3 sm:px-6 backdrop-blur-md">
        {/* Left section: mobile hamburger & breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <SidebarTrigger className="shrink-0 text-navy-900 hover:text-gold-600 focus:outline-none" />

          {/* Breadcrumb path */}
          <nav aria-label="Ruta actual" className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-ink-muted">Quisqueya Desk</span>
            <ChevronRight className="size-3 text-line shrink-0" />
            {currentWorkspace && (
              <>
                <span className="font-medium text-ink-muted/80">{currentWorkspace.nombre}</span>
                <ChevronRight className="size-3 text-line shrink-0" />
              </>
            )}
            <span className="font-bold text-navy-950 font-heading">
              {currentModule?.nombre ?? "Panel"}
            </span>
          </nav>
        </div>

        {/* Center section: Quick Search trigger button (Ctrl+K) */}
        <div className="flex-1 max-w-md mx-2 sm:mx-4">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="w-full flex items-center justify-between h-9 px-3 text-xs bg-surface-alt hover:bg-surface-hover border border-line rounded-lg text-ink-muted hover:text-ink transition-all shadow-2xs group cursor-pointer"
            aria-label="Buscar en el CRM (Ctrl+K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="size-3.5 text-ink-muted group-hover:text-gold-700 transition-colors shrink-0" />
              <span className="truncate">Buscar en el CRM...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white text-ink-muted border border-line rounded shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right section: Quick actions, notifications & user status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Quick Action button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-9 px-3 text-xs font-bold text-navy-950 bg-gold-600 hover:bg-gold-500 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
                <span className="hidden md:inline">Acción Rápida</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-surface border border-line shadow-xl rounded-xl p-1">
              <DropdownMenuLabel className="text-[11px] font-bold text-ink-muted uppercase tracking-wider px-2 py-1.5">
                Creación Inmediata
              </DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link
                  href="/leads"
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-ink hover:bg-surface-hover rounded-lg cursor-pointer"
                >
                  <UserPlus className="size-4 text-gold-700 shrink-0" />
                  <span>Registrar Nuevo Lead</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/agenda"
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-ink hover:bg-surface-hover rounded-lg cursor-pointer"
                >
                  <CalendarPlus className="size-4 text-info shrink-0" />
                  <span>Agendar Nueva Cita</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/tareas"
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-ink hover:bg-surface-hover rounded-lg cursor-pointer"
                >
                  <CheckCircle className="size-4 text-success shrink-0" />
                  <span>Crear Tarea de Seguimiento</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-line" />
              <DropdownMenuItem asChild>
                <a
                  href="https://quisqueyahome.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-2.5 py-2 text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-hover rounded-lg cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="size-3.5" />
                    Portal Público
                  </span>
                  <span className="text-[10px] text-ink-muted/80">.com</span>
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications Flyout Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative flex size-9 items-center justify-center rounded-lg border border-line bg-surface hover:bg-surface-hover text-navy-900 transition-colors shadow-2xs"
                aria-label="Notificaciones del sistema"
              >
                <Bell className="size-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-gold-600 text-[10px] font-bold text-navy-950 border border-surface shadow-xs">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 bg-surface border border-line shadow-2xl rounded-2xl p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface-alt">
                <span className="text-xs font-bold text-navy-950 uppercase tracking-wider">
                  Notificaciones
                </span>
                {unreadNotifications > 0 && (
                  <button
                    type="button"
                    onClick={() => setUnreadNotifications(0)}
                    className="text-[11px] font-semibold text-gold-700 hover:underline cursor-pointer"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-line/60">
                <div className="p-3 hover:bg-surface-hover transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className="size-2 rounded-full bg-gold-600 mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-xs text-navy-950 block">
                        Nuevo Lead desde el Portal
                      </strong>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Interesado en proyecto Bávaro Beach Lofts.
                      </p>
                      <small className="text-[10px] text-ink-muted/80 block mt-1">
                        Hace 12 minutos
                      </small>
                    </div>
                  </div>
                </div>
                <div className="p-3 hover:bg-surface-hover transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className="size-2 rounded-full bg-info mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-xs text-navy-950 block">
                        Cita programada hoy
                      </strong>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Reunión virtual con comprador internacional a las 4:00 PM.
                      </p>
                      <small className="text-[10px] text-ink-muted/80 block mt-1">
                        Hace 45 minutos
                      </small>
                    </div>
                  </div>
                </div>
                <div className="p-3 hover:bg-surface-hover transition-colors">
                  <div className="flex items-start gap-2.5">
                    <span className="size-2 rounded-full bg-success mt-1.5 shrink-0" />
                    <div>
                      <strong className="text-xs text-navy-950 block">
                        Actualización de obra
                      </strong>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Fase 3 validada por ingeniería en Punta Cana Hills.
                      </p>
                      <small className="text-[10px] text-ink-muted/80 block mt-1">
                        Hoy 10:20 AM
                      </small>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-2 border-t border-line text-center bg-surface-alt">
                <Link
                  href="/inicio"
                  className="text-xs font-semibold text-navy-900 hover:text-gold-700 transition-colors"
                >
                  Ver actividad completa en el Dashboard
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* User role pill badge */}
          <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-line">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-navy-950 text-gold-400 border border-gold-600/30 shadow-2xs">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {etiquetaRol}
            </span>
          </div>
        </div>
      </header>

      {/* Global Command Palette modal */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
