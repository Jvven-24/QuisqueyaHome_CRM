"use client";

import React, { useEffect, useRef, useState } from "react";
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
import { WORKSPACES, type Modulo } from "../modulos";
import { CommandPalette } from "./command-palette";

interface CrmHeaderProps {
  etiquetaRol: string;
  modulosVisibles?: readonly Modulo[];
}

export function CrmHeader({
  etiquetaRol,
  modulosVisibles = [],
}: CrmHeaderProps) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificaciones, setNotificaciones] = useState<NotificacionItem[]>([]);
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(true);
  const [errorNotificaciones, setErrorNotificaciones] = useState<string | null>(null);
  const [errorMarcado, setErrorMarcado] = useState<string | null>(null);
  const [intentoCarga, setIntentoCarga] = useState(0);
  const [marcando, setMarcando] = useState(false);
  const marcadoEnCurso = useRef(false);

  useEffect(() => {
    let montado = true;
    async function cargar() {
      try {
        setCargandoNotificaciones(true);
        setErrorNotificaciones(null);
        const res = await fetch("/api/notificaciones");
        if (!res.ok) throw new Error("No se pudieron cargar las notificaciones.");
        const data = await res.json();
        if (data.ok !== true || !Array.isArray(data.notificaciones)) throw new Error("Respuesta inválida.");
        if (montado) {
          setNotificaciones(data.notificaciones);
          setUnreadNotifications(data.unreadCount ?? 0);
        }
      } catch {
        if (montado) setErrorNotificaciones("No se pudieron cargar las notificaciones. Vuelve a intentarlo.");
      } finally {
        if (montado) setCargandoNotificaciones(false);
      }
    }
    void cargar();
    return () => {
      montado = false;
    };
  }, [intentoCarga]);

  async function marcarTodasLeidas() {
    await marcarLeidas();
  }

  async function marcarUnaLeida(id: number) {
    if (!notificaciones.some((n) => n.id === id && !n.isRead)) return;
    await marcarLeidas(id);
  }

  async function marcarLeidas(id?: number) {
    if (marcadoEnCurso.current) return;
    marcadoEnCurso.current = true;
    setMarcando(true);
    setErrorMarcado(null);
    try {
      const res = await fetch("/api/notificaciones", {
        method: "PATCH",
        ...(id === undefined ? {} : {
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id }),
        }),
      });
      if (!res.ok || (await res.json()).ok !== true) throw new Error("No se pudo confirmar la lectura.");
      setNotificaciones((prev) => prev.map((n) => id === undefined || n.id === id ? { ...n, isRead: true } : n));
      setUnreadNotifications((prev) => id === undefined ? 0 : Math.max(0, prev - 1));
    } catch {
      setErrorMarcado("No se pudieron marcar como leídas. Se conserva el estado anterior; vuelve a intentarlo.");
    } finally {
      marcadoEnCurso.current = false;
      setMarcando(false);
    }
  }

  // Un solo dueño del atajo global: evita abrir dos paletas (header y dock).
  useEffect(() => {
    if (typeof window === "undefined") return;
    let prefixAt = 0;
    function handleShortcut(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(value => !value); return; }
      const target = event.target as HTMLElement;
      if (target.closest("input,textarea,select,[contenteditable=true],[role=dialog]") || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() === "g") { prefixAt = Date.now(); return; }
      if (Date.now() - prefixAt > 1000) return;
      prefixAt = 0;
      const destination = modulosVisibles.find(item => item.atajo?.split(" ")[1]?.toLowerCase() === event.key.toLowerCase());
      if (destination) { event.preventDefault(); window.location.assign(destination.ruta); }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [modulosVisibles]);

  // Determine current active module and workspace
  const currentModule = modulosVisibles.find(
    (m) => pathname === m.ruta || pathname.startsWith(`${m.ruta}/`)
  );
  const currentWorkspace = currentModule
    ? WORKSPACES.find((w) => w.id === currentModule.workspaceId)
    : null;

  return (
    <>
      <header className="private-command-bar sticky top-0 z-30 flex min-h-14 w-full items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
        {/* Left section: mobile hamburger & breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <SidebarTrigger className="min-h-11 min-w-11 shrink-0 text-slate-600 hover:text-slate-900 focus:outline-none" />

          {/* Breadcrumb path */}
          <nav aria-label="Ruta actual" className="hidden sm:flex min-w-0 items-center gap-1.5 text-xs">
            <span className="hidden xl:inline font-medium text-muted-foreground">Quisqueya</span>
            <ChevronRight className="hidden xl:block size-3 text-muted-foreground shrink-0" />
            {currentWorkspace && (
              <>
                <span className="hidden lg:inline font-medium text-muted-foreground">{currentWorkspace.nombre}</span>
                <ChevronRight className="hidden lg:block size-3 text-muted-foreground shrink-0" />
              </>
            )}
            <span className="truncate font-semibold text-slate-900" title={currentModule?.nombre ?? "Panel"}>
              {currentModule?.nombre ?? "Panel"}
            </span>
          </nav>
        </div>

        {/* Center section: Quick Search trigger button (Ctrl+K) */}
        <div className="flex-1 min-w-0 max-w-sm mx-2 sm:mx-4">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="w-full flex items-center justify-between min-h-11 px-2.5 text-xs bg-surface-alt hover:bg-surface-hover border border-border rounded-md text-muted-foreground hover:text-ink transition-colors cursor-pointer group"
            aria-label="Buscar en el CRM (Ctrl+K)"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="size-3.5 text-muted-foreground group-hover:text-ink transition-colors shrink-0" />
              <span className="truncate text-[12px]">Buscar en el CRM...</span>
            </div>
            <kbd className="hidden lg:inline-flex shrink-0 items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground bg-white border border-line rounded">
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
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 px-2.5 text-xs font-medium text-ink bg-surface hover:bg-surface-hover border border-border rounded-md shadow-none transition-colors cursor-pointer"
                aria-label="Nueva acción"
              >
                <Plus className="size-3.5 text-slate-600" />
                <span className="hidden sm:inline">Nueva acción</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-surface border border-border shadow-md rounded-lg p-1">
              <DropdownMenuLabel className="text-[11px] font-bold text-ink-muted uppercase tracking-wider px-2 py-1.5">
                Creación Inmediata
              </DropdownMenuLabel>
              {modulosVisibles.some(module => module.ruta === "/leads") && <DropdownMenuItem asChild>
                <Link
                  href="/leads"
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-ink hover:bg-surface-hover rounded-lg cursor-pointer"
                >
                  <UserPlus className="size-4 text-gold-700 shrink-0" />
                  <span>Registrar Nuevo Lead</span>
                </Link>
              </DropdownMenuItem>}
              {modulosVisibles.some(module => module.ruta === "/agenda") && <DropdownMenuItem asChild>
                <Link
                  href="/agenda"
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-ink hover:bg-surface-hover rounded-lg cursor-pointer"
                >
                  <CalendarPlus className="size-4 text-info shrink-0" />
                  <span>Agendar Nueva Cita</span>
                </Link>
              </DropdownMenuItem>}
              {modulosVisibles.some(module => module.ruta === "/tareas") && <DropdownMenuItem asChild>
                <Link
                  href="/tareas"
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold text-ink hover:bg-surface-hover rounded-lg cursor-pointer"
                >
                  <CheckCircle className="size-4 text-success shrink-0" />
                  <span>Crear Tarea de Seguimiento</span>
                </Link>
              </DropdownMenuItem>}
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
                className="relative flex size-11 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-hover text-muted-foreground transition-colors shadow-none cursor-pointer"
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
            <PopoverContent align="end" className="w-80 bg-surface border border-border shadow-md rounded-lg p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/70">
                <span className="text-xs font-semibold text-slate-900">
                  Notificaciones
                </span>
                {unreadNotifications > 0 && (
                  <button
                    type="button"
                    onClick={marcarTodasLeidas}
                    disabled={marcando}
                    aria-busy={marcando}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {marcando ? "Marcando…" : "Marcar leídas"}
                  </button>
                )}
              </div>
              {errorMarcado && <p role="alert" className="px-4 py-2 text-xs text-red-700">{errorMarcado}</p>}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {errorNotificaciones ? (
                  <div className="p-4 text-center text-xs text-red-700">
                    <p role="alert">{errorNotificaciones}</p>
                    <button type="button" className="mt-2 underline" onClick={() => setIntentoCarga((prev) => prev + 1)}>
                      Reintentar
                    </button>
                  </div>
                ) : cargandoNotificaciones && notificaciones.length === 0 ? (
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
                      role="button"
                      tabIndex={0}
                      aria-disabled={marcando || n.isRead}
                      aria-label={"Marcar como leída: " + n.title}
                      onKeyDown={event => {if ((event.key === "Enter" || event.key === " ") && !marcando && !n.isRead) {event.preventDefault(); void marcarUnaLeida(n.id);}}}
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
              {modulosVisibles.some(item => item.ruta === "/aprobaciones") && <div className="p-2 border-t border-slate-100 text-center bg-slate-50/50">
                <Link
                  href="/aprobaciones"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Abrir centro de aprobaciones
                </Link>
              </div>}
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Global Command Palette modal */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} modulosVisibles={modulosVisibles} />
    </>
  );
}
