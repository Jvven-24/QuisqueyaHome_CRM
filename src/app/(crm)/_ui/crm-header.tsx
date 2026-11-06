"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

const NotificacionesPayload = z.object({
  ok: z.literal(true),
  notificaciones: z.array(z.object({
    id: z.number().int().positive(),
    notificationType: z.string(),
    title: z.string(),
    body: z.string().nullable(),
    entityType: z.string().nullable(),
    entityId: z.number().nullable(),
    isRead: z.boolean(),
    createdAt: z.string(),
  })),
  unreadCount: z.number().int().nonnegative().optional(),
});

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
  RefreshCw,
  X,
  Inbox,
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
  const revisionLecturas = useRef(0);
  const conocidas = useRef<Set<number> | null>(null);
  const [bandejaAbierta, setBandejaAbierta] = useState(false);
  const [soloSinLeer, setSoloSinLeer] = useState(false);

  // A foreground inbox: pause hidden/offline tabs, refresh when returning.
  // This does not register system push or request notification permission.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refrescar = () => {
      if (document.visibilityState === "visible" && navigator.onLine && !marcadoEnCurso.current) {
        setIntentoCarga(value => value + 1);
      }
    };
    const timer = window.setInterval(refrescar, 30_000);
    window.addEventListener("focus", refrescar);
    window.addEventListener("online", refrescar);
    document.addEventListener("visibilitychange", refrescar);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refrescar);
      window.removeEventListener("online", refrescar);
      document.removeEventListener("visibilitychange", refrescar);
    };
  }, []);

  useEffect(() => {
    let montado = true;
    const controller = new AbortController();
    const revision = revisionLecturas.current;
    const timeout = globalThis.setTimeout(() => controller.abort(), 15_000);
    async function cargar() {
      try {
        setCargandoNotificaciones(true);
        setErrorNotificaciones(null);
        const res = await fetch("/api/notificaciones", { signal: controller.signal, cache: "no-store" });
        if (!res.ok) throw new Error("No se pudieron cargar las notificaciones.");
        const data = NotificacionesPayload.parse(await res.json());
        if (montado && revision === revisionLecturas.current && !marcadoEnCurso.current) {
          const recibidas = data.notificaciones;
          const nuevas = conocidas.current === null ? [] : recibidas.filter(n => !n.isRead && !conocidas.current!.has(n.id));
          conocidas.current = new Set([...(conocidas.current ?? []), ...recibidas.map(n => n.id)].slice(-200));
          const primera = nuevas[0];
          if (primera) {
            toast.info(nuevas.length === 1 ? primera.title : `${nuevas.length} notificaciones nuevas`, {
              id: "crm-nuevas-notificaciones",
              description: nuevas.length === 1 ? primera.body ?? undefined : "Revisa las novedades en tu bandeja.",
              duration: 5000,
              action: { label: "Ver", onClick: () => { setSoloSinLeer(true); setBandejaAbierta(true); } },
            });
          }
          setNotificaciones(data.notificaciones);
          setUnreadNotifications(data.unreadCount ?? 0);
        }
      } catch {
        if (montado && revision === revisionLecturas.current && !marcadoEnCurso.current) setErrorNotificaciones("No se pudieron cargar las notificaciones. Vuelve a intentarlo.");
      } finally {
        globalThis.clearTimeout(timeout);
        if (montado) setCargandoNotificaciones(false);
      }
    }
    void cargar();
    return () => {
      montado = false;
      globalThis.clearTimeout(timeout);
      controller.abort();
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
    revisionLecturas.current += 1;
    setMarcando(true);
    setErrorMarcado(null);
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), 15_000);
    try {
      const res = await fetch("/api/notificaciones", {
        method: "PATCH",
        signal: controller.signal,
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
      globalThis.clearTimeout(timeout);
      revisionLecturas.current += 1;
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
          <Popover open={bandejaAbierta} onOpenChange={open => { setBandejaAbierta(open); if (open) setIntentoCarga(value => value + 1); }}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative flex size-11 items-center justify-center rounded-md border border-border bg-surface hover:bg-surface-hover text-muted-foreground transition-colors shadow-none cursor-pointer"
                aria-label="Notificaciones del sistema"
                aria-describedby={unreadNotifications > 0 ? "unread-notifications-count" : undefined}
              >
                <Bell className="size-4" aria-hidden="true" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-white bg-gold-600 px-1 text-xs font-bold text-navy-950">
                    <span aria-hidden="true">{unreadNotifications > 99 ? "99+" : unreadNotifications}</span>
                  </span>
                )}
                {unreadNotifications > 0 && <span id="unread-notifications-count" className="sr-only">{unreadNotifications} sin leer</span>}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" collisionPadding={16} aria-label="Bandeja de notificaciones" className="flex w-[420px] max-w-[calc(100vw-2rem)] max-h-[var(--radix-popover-content-available-height)] flex-col bg-surface border border-border shadow-lg rounded-xl p-0 overflow-hidden">
              <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2 border-b border-line">
                <div className="min-w-0"><h2 className="text-base font-semibold text-ink">Notificaciones</h2><p className="text-[13px] text-ink-muted">Tus 20 avisos más recientes</p></div>
                <div className="flex shrink-0">
                  <button type="button" aria-label="Actualizar notificaciones" disabled={cargandoNotificaciones || marcando} onClick={() => setIntentoCarga(value => value + 1)} className="flex size-11 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt disabled:opacity-50"><RefreshCw className={`size-4 ${cargandoNotificaciones ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden="true" /></button>
                  <button type="button" aria-label="Cerrar notificaciones" onClick={() => setBandejaAbierta(false)} className="flex size-11 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt"><X className="size-4" aria-hidden="true" /></button>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-1 border-b border-line bg-surface-alt px-3 py-1">
                <div role="group" aria-label="Filtrar notificaciones" className="flex gap-1">
                  {[false, true].map(value => <button key={String(value)} type="button" aria-pressed={soloSinLeer === value} onClick={() => setSoloSinLeer(value)} className={`min-h-11 rounded-lg px-3 text-[13px] font-medium ${soloSinLeer === value ? "bg-navy-100 text-navy-900" : "text-ink-muted hover:bg-surface"}`}>{value ? `Sin leer (${unreadNotifications})` : "Todas"}</button>)}
                </div>
                {unreadNotifications > 0 && <button type="button" onClick={marcarTodasLeidas} disabled={marcando} aria-busy={marcando} className="min-h-11 rounded-lg px-2 text-[13px] font-medium text-navy-900 hover:bg-surface disabled:opacity-50">{marcando ? "Marcando…" : "Marcar leídas"}</button>}
              </div>
              {errorMarcado && <p role="alert" className="shrink-0 px-4 py-2 text-[13px] text-danger">{errorMarcado}</p>}
              <div className="min-h-0 max-h-[min(28rem,60dvh)] overflow-y-auto overscroll-contain divide-y divide-line">
                {errorNotificaciones && (
                  <div className="p-4 text-[13px] text-danger">
                    <p role="alert">{errorNotificaciones}</p>
                    <button type="button" className="mt-2 min-h-11 underline" onClick={() => setIntentoCarga((prev) => prev + 1)}>
                      Reintentar
                    </button>
                  </div>
                )}
                {cargandoNotificaciones && notificaciones.length === 0 ? (
                  <div role="status" className="space-y-3 p-4 text-sm text-ink-muted">
                    <span>Cargando notificaciones…</span><div className="h-3 w-4/5 animate-pulse rounded bg-surface-alt motion-reduce:animate-none" /><div className="h-3 w-3/5 animate-pulse rounded bg-surface-alt motion-reduce:animate-none" />
                  </div>
                ) : !errorNotificaciones && notificaciones.filter(n => !soloSinLeer || !n.isRead).length === 0 ? (
                  <div role="status" className="flex flex-col items-center gap-2 px-5 py-8 text-center text-sm text-ink-muted">
                    <Inbox className="mb-1 size-6" aria-hidden="true" /><strong className="font-semibold text-ink">{soloSinLeer ? "Todo al día" : "Tu bandeja está vacía"}</strong>
                    <p>{soloSinLeer ? "No quedan avisos sin leer en esta bandeja." : "Aquí aparecerán tus asignaciones y novedades."}</p>
                  </div>
                ) : (
                  notificaciones.filter(n => !soloSinLeer || !n.isRead).map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 transition-colors ${
                        n.isRead ? "bg-surface" : "bg-surface-alt"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`size-2 rounded-full mt-1.5 shrink-0 ${
                            n.isRead
                              ? "bg-line"
                              : n.notificationType.includes("lead")
                              ? "bg-gold-600"
                              : n.notificationType.includes("meeting")
                              ? "bg-sky-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <strong className="text-sm text-ink block font-semibold break-words">
                            {n.title}
                          </strong>
                          {n.body && (
                            <p className="text-[13px] leading-relaxed text-ink-muted mt-1 break-words">
                              {n.body}
                            </p>
                          )}
                          <small className="text-[13px] text-ink-muted block mt-2">
                            {new Date(n.createdAt).toLocaleDateString("es-DO", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </small>
                          {!n.isRead && <button type="button" disabled={marcando} aria-label={"Marcar como leída: " + n.title} onClick={() => marcarUnaLeida(n.id)} className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-[13px] font-medium text-navy-900 hover:bg-navy-100 disabled:opacity-50"><CheckCircle className="size-4" aria-hidden="true" />Marcar como leída</button>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {modulosVisibles.some(item => item.ruta === "/aprobaciones") && <div className="shrink-0 p-2 border-t border-line text-center bg-surface-alt">
                <Link
                  href="/aprobaciones"
                  className="inline-flex min-h-11 items-center justify-center text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
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
