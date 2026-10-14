"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NotificacionItem {
  id: number;
  notificationType: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: number | null;
  isRead: boolean;
  createdAt: string;
}
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
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(false);

  useEffect(() => {
    let montado = true;
    async function cargar() {
      try {
        setCargandoNotificaciones(true);
        const res = await fetch("/api/notificaciones");
        if (res.ok) {
          const data = await res.json();
          if (montado && data.ok) {
            setNotificaciones(data.notificaciones ?? []);
            setUnreadNotifications(data.unreadCount ?? 0);
          }
        }
      } catch {
        // Fallo suave de red
      } finally {
        if (montado) setCargandoNotificaciones(false);
      }
    }
    void cargar();
    return () => {
      montado = false;
    };
  }, []);

  async function marcarTodasLeidas() {
    setUnreadNotifications(0);
    setNotificaciones((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/notificaciones", { method: "PATCH" });
    } catch {
      // Ignorar
    }
  }

  async function marcarUnaLeida(id: number) {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadNotifications((prev) => Math.max(0, prev - 1));
    try {
      await fetch("/api/notificaciones", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Ignorar
    }
  }

  // Determine current active module and workspace
  const currentModule = MODULOS.find(
    (m) => pathname === m.ruta || pathname.startsWith(`${m.ruta}/`)
  );
  const currentWorkspace = currentModule
    ? WORKSPACES.find((w) => w.id === currentModule.workspaceId)
    : null;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200/70 bg-white/80 px-4 sm:px-6 backdrop-blur-md">
        {/* Left section: mobile hamburger & breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <SidebarTrigger className="shrink-0 text-slate-600 hover:text-slate-900 focus:outline-none" />

          {/* Breadcrumb path */}
          <nav aria-label="Ruta actual" className="hidden sm:flex items-center gap-1.5 text-xs">
            <span className="font-medium text-slate-400">Quisqueya</span>
            <ChevronRight className="size-3 text-slate-300 shrink-0" />
            {currentWorkspace && (
              <>
                <span className="font-medium text-slate-500">{currentWorkspace.nombre}</span>
                <ChevronRight className="size-3 text-slate-300 shrink-0" />
              </>
            )}
            <span className="font-semibold text-slate-900">
              {currentModule?.nombre ?? "Panel"}
            </span>
          </nav>
        </div>

        {/* Center section: Quick Search trigger button (Ctrl+K) */}
        <div className="flex-1 max-w-sm mx-2 sm:mx-4">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="w-full flex items-center justify-between h-8 px-2.5 text-xs bg-slate-100/70 hover:bg-slate-100/90 border border-slate-200/60 rounded-md text-slate-500 hover:text-slate-800 transition-all cursor-pointer group"
            aria-label="Buscar en el CRM (Ctrl+K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="size-3.5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
              <span className="truncate text-[12px]">Buscar en el CRM...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded shadow-2xs">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right section: Quick actions, notifications */}
        <div className="flex items-center gap-2 shrink-0">
          {etiquetaRol ? (
            <span className="hidden lg:inline-flex items-center px-2 py-0.5 text-[11px] font-medium text-slate-600 bg-slate-100 rounded-md border border-slate-200/80">
              {etiquetaRol}
            </span>
          ) : null}
          {/* Quick Action button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-md shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="size-3.5 text-slate-600" />
                <span className="hidden sm:inline">Nueva acción</span>
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
                className="relative flex size-8 items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer"
                aria-label="Notificaciones del sistema"
              >
                <Bell className="size-3.5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-gold-600 text-[9px] font-bold text-navy-950 border border-white">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 bg-white border border-slate-200 shadow-xl rounded-xl p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                <span className="text-xs font-semibold text-slate-900">
                  Notificaciones
                </span>
                {unreadNotifications > 0 && (
                  <button
                    type="button"
                    onClick={marcarTodasLeidas}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {cargandoNotificaciones && notificaciones.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Cargando notificaciones...
                  </div>
                ) : notificaciones.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No tienes notificaciones pendientes.
                  </div>
                ) : (
                  notificaciones.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && marcarUnaLeida(n.id)}
                      className={`p-3 transition-colors cursor-pointer ${
                        n.isRead ? "bg-white hover:bg-slate-50/60 opacity-80" : "bg-gold-50/20 hover:bg-gold-50/40"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`size-2 rounded-full mt-1.5 shrink-0 ${
                            n.isRead
                              ? "bg-slate-300"
                              : n.notificationType.includes("lead")
                              ? "bg-gold-600"
                              : n.notificationType.includes("meeting")
                              ? "bg-sky-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <strong className="text-xs text-slate-900 block font-medium truncate">
                            {n.title}
                          </strong>
                          {n.body && (
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                              {n.body}
                            </p>
                          )}
                          <small className="text-[10px] text-slate-400 block mt-1 font-mono">
                            {new Date(n.createdAt).toLocaleDateString("es-DO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-slate-100 text-center bg-slate-50/50">
                <Link
                  href="/inicio"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Ver actividad en el Dashboard
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Global Command Palette modal */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
