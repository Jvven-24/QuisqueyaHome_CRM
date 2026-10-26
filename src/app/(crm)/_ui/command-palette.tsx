"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ArrowRight,
  Sparkles,
  Command,
  PlusCircle,
  CalendarPlus,
  CheckCircle2,
  TrendingUp,
  Building,
  Users,
  Briefcase,
  UserPlus,
  Loader2,
  Mic,
} from "lucide-react";
import { MODULOS, WORKSPACES, type Modulo } from "../modulos";
import { ModuloIcon } from "./icon-resolver";
import { esResultadoBusqueda, mensajeErrorBusqueda } from "@/application/busqueda/consultas";
import type {
  ItemResultadoBusqueda,
  ResultadosBusquedaGlobal,
  TipoEntidadBusqueda,
} from "@/application/busqueda/consultas";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  ruta: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "act-new-lead",
    title: "Crear Nuevo Lead",
    description: "Registrar un prospecto calificado con teléfono y máscara internacional",
    ruta: "/leads",
    icon: PlusCircle,
    badge: "Comercial",
  },
  {
    id: "act-voice-lead",
    title: "Capturar Lead por Nota de Voz IA",
    description: "Dictar o transcribir nota de voz de campo con extracción automática",
    ruta: "/leads?voz=1",
    icon: Mic,
    badge: "IA Copiloto",
  },
  {
    id: "act-new-apt",
    title: "Agendar Nueva Cita",
    description: "Programar visita presencial o reunión virtual con cliente",
    ruta: "/agenda",
    icon: CalendarPlus,
    badge: "Agenda",
  },
  {
    id: "act-pipeline",
    title: "Ver Negocios",
    description: "Consultar etapas de negociación, cotizador Confotur y oportunidades activas",
    ruta: "/negocios",
    icon: TrendingUp,
    badge: "Funnel",
  },
  {
    id: "act-task",
    title: "Nueva Tarea de Seguimiento",
    description: "Crear actividad de seguimiento o recordatorio a broker",
    ruta: "/tareas",
    icon: CheckCircle2,
    badge: "Operaciones",
  },
  {
    id: "act-props",
    title: "Explorar Catálogo y Matriz de Disponibilidad",
    description: "Inventario de proyectos, matriz por piso/torre y simulador Confotur",
    ruta: "/propiedades",
    icon: Building,
    badge: "Activos",
  },
];

const CONFIG_ENTIDAD: Record<
  TipoEntidadBusqueda,
  { tituloGrupo: string; icono: React.ComponentType<{ className?: string }> }
> = {
  lead: { tituloGrupo: "Leads / Prospectos", icono: UserPlus },
  contacto: { tituloGrupo: "Contactos Patrimoniales", icono: Users },
  negocio: { tituloGrupo: "Negocios Activos", icono: Briefcase },
  propiedad: { tituloGrupo: "Proyectos Inmobiliarios", icono: Building },
  tarea: { tituloGrupo: "Tareas y Seguimientos", icono: CheckCircle2 },
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modulosVisibles?: readonly Modulo[];
}

export function CommandPalette({
  open,
  onOpenChange,
  modulosVisibles = MODULOS,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [buscandoRemoto, setBuscandoRemoto] = useState(false);
  const [resultadosRemotos, setResultadosRemotos] = useState<ResultadosBusquedaGlobal | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [reintento, setReintento] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const savedViews = useRef<string[]>([]);
  // Solo memoria de esta instancia: no se almacenan consultas personales en el navegador.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery(""); setSelectedIndex(0); setResultadosRemotos(null);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onOpenChange(false); }
      if (event.key !== "Tab") return;
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input,a[href],[tabindex="0"]');
      if (!nodes?.length) return;
      const first = nodes[0]!; const last = nodes[nodes.length - 1]!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", handleKey);
    return () => { window.clearTimeout(timer); document.removeEventListener("keydown", handleKey); previous?.focus(); };
  }, [open, onOpenChange]);

  // Live federated search against /api/busqueda
  useEffect(() => {
    if (!open) return;
    const termino = query.trim();
    setErrorBusqueda(null);
    setResultadosRemotos(null);
    if (termino.length < 2) {
      setResultadosRemotos(null);
      setBuscandoRemoto(false);
      return;
    }

    setBuscandoRemoto(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setBuscandoRemoto(true);
      try {
        const res = await fetch(`/api/busqueda?q=${encodeURIComponent(termino)}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          if (!controller.signal.aborted) setErrorBusqueda(mensajeErrorBusqueda(res.status, !navigator.onLine));
          return;
        }
        const data = (await res.json()) as { resultados?: ResultadosBusquedaGlobal };
        if (!esResultadoBusqueda(data.resultados)) throw new Error("Respuesta de b\u00fasqueda inv\u00e1lida");
        if (!controller.signal.aborted) {
          setResultadosRemotos(data.resultados);
        }
      } catch {
        if (!controller.signal.aborted) setErrorBusqueda(mensajeErrorBusqueda(null, !navigator.onLine));
      } finally {
        if (!controller.signal.aborted) {
          setBuscandoRemoto(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, reintento]);

  const q = query.trim().toLowerCase();

  const itemsEntidades: ItemResultadoBusqueda[] = resultadosRemotos
    ? [
        ...resultadosRemotos.leads,
        ...resultadosRemotos.negocios,
        ...resultadosRemotos.contactos,
        ...resultadosRemotos.propiedades,
        ...resultadosRemotos.tareas,
      ]
    : [];

  const filteredActions = q
    ? QUICK_ACTIONS.filter((a) => modulosVisibles.some(m => a.ruta.split("?")[0] === m.ruta)).filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.badge.toLowerCase().includes(q),
      )
    : QUICK_ACTIONS.filter(a => modulosVisibles.some(m => a.ruta.split("?")[0] === m.ruta));

  const filteredModules = q
    ? modulosVisibles.filter(
        (m) =>
          m.nombre.toLowerCase().includes(q) ||
          m.descripcion.toLowerCase().includes(q) ||
          m.ruta.toLowerCase().includes(q) ||
          (m.atajo && m.atajo.toLowerCase().includes(q)),
      )
    : modulosVisibles;

  const allItems: Array<
    | { type: "entity"; data: ItemResultadoBusqueda }
    | { type: "action"; data: QuickAction }
    | { type: "module"; data: Modulo }
  > = [
    ...itemsEntidades.map((e) => ({ type: "entity" as const, data: e })),
    ...filteredActions.map((a) => ({ type: "action" as const, data: a })),
    ...filteredModules.map((m) => ({ type: "module" as const, data: m })),
  ];

  const handleSelect = (index: number) => {
    const item = allItems[index];
    if (!item) return;

    onOpenChange(false);
    router.push(item.data.ruta);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(0, allItems.length - 1) : prev - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  if (!open) return null;

  const ordenTipos: TipoEntidadBusqueda[] = ["lead", "negocio", "contacto", "propiedad", "tarea"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:pt-16 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos y búsqueda global del CRM"
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line bg-surface">
          {buscandoRemoto ? (
            <Loader2 className="size-5 text-gold-600 shrink-0 animate-spin" />
          ) : (
            <Search className="size-5 text-ink-muted shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            aria-label="Buscar registros y módulos"
            placeholder="Buscar cliente, teléfono, negocio, proyecto (ej. Cap Cana, 809...) o comando..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent border-0 outline-none text-[14px] md:text-[15px] text-ink placeholder:text-ink-muted/70 font-medium min-w-0 min-h-12 p-0 focus:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="min-h-12 min-w-12 inline-flex items-center justify-center text-ink-muted hover:text-ink rounded-lg transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" />
            </button>
          )}
          <kbd className="inline-flex items-center gap-0.5 px-2.5 py-1 text-[13px] font-semibold text-ink-muted bg-surface-alt border border-line rounded-md">
            ESC
          </kbd>
        </div>

        <div className="px-4 py-2 border-b border-line text-[13px]">
          <div className="flex flex-wrap items-center gap-2"><span>Vistas de esta sesión</span><button type="button" className="private-text-action" disabled={query.trim().length < 2 || (savedViews.current ?? []).includes(query.trim())} onClick={() => { savedViews.current = [...(savedViews.current ?? []).slice(-4), query.trim()]; setReintento(value => value + 1); }}>Guardar búsqueda</button></div>
          <p className="text-ink-muted m-0">Vista previa · falta persistencia de vistas por usuario. Se borran al cerrar la página.</p>
          {(savedViews.current ?? []).map(view => <button type="button" key={view} onClick={() => { setQuery(view); setSelectedIndex(0); }} className="private-saved-view">{view}</button>)}
        </div>
        {/* Results container */}
        <div className="flex-1 overflow-y-auto p-2.5 divide-y divide-line/40">
          {errorBusqueda && <div role="alert" className="rounded-xl border border-danger/40 bg-danger-bg p-3 text-sm text-danger"><p>{errorBusqueda}</p><button type="button" className="button min-h-12" onClick={() => setReintento(value => value + 1)}>Reintentar</button></div>}
          {buscandoRemoto && <p role="status" className="p-3 text-sm">Buscando registros…</p>}
          {allItems.length === 0 && !buscandoRemoto && !errorBusqueda ? (
            <div className="py-12 px-4 text-center">
              <Sparkles className="size-8 mx-auto text-gold-600/70 mb-2" />
              <p className="font-semibold text-ink text-[14px]">
                No se encontraron resultados para &ldquo;{query}&rdquo;
              </p>
              <small className="text-[13px] text-ink-muted block mt-1">
                Intenta buscar por nombre de cliente, teléfono, proyecto (&ldquo;Cap Cana&rdquo;), negocio o módulo.
              </small>
            </div>
          ) : (
            <>
              {/* Live CRM Records Group */}
              {itemsEntidades.length > 0 && (
                <div className="pb-2 space-y-2">
                  {ordenTipos.map((tipo) => {
                    const grupo = itemsEntidades.filter((item) => item.tipo === tipo);
                    if (grupo.length === 0) return null;
                    const cfg = CONFIG_ENTIDAD[tipo];
                    const IconoGrupo = cfg.icono;
                    return (
                      <div key={tipo}>
                        <div className="px-3 py-1.5 text-[13px] font-bold text-gold-700 uppercase tracking-wider flex items-center gap-1.5">
                          <IconoGrupo className="size-3.5 text-gold-600" />
                          {cfg.tituloGrupo} ({grupo.length})
                        </div>
                        <div className="space-y-0.5">
                          {grupo.map((entidad) => {
                            const itemIndex = allItems.findIndex(
                              (i) =>
                                i.type === "entity" &&
                                i.data.tipo === entidad.tipo &&
                                i.data.id === entidad.id,
                            );
                            const isSelected = itemIndex === selectedIndex;
                            return (
                              <div
                                key={`${entidad.tipo}-${entidad.id}`}
                                onClick={() => handleSelect(itemIndex)}
                                onMouseEnter={() => setSelectedIndex(itemIndex)}
                                className={`flex items-center justify-between min-h-12 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-navy-950 text-white shadow-sm"
                                    : "text-ink hover:bg-surface-hover"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span
                                    className={`p-2 rounded-lg shrink-0 ${
                                      isSelected
                                        ? "bg-gold-600/20 text-gold-400"
                                        : "bg-surface-alt text-navy-900 border border-line/60"
                                    }`}
                                  >
                                    <IconoGrupo className="size-4" />
                                  </span>
                                  <div className="truncate">
                                    <span className="text-[14px] font-semibold block truncate">
                                      {entidad.titulo}
                                    </span>
                                    <small
                                      className={`text-[13px] block truncate ${
                                        isSelected ? "text-slate-300" : "text-ink-muted"
                                      }`}
                                    >
                                      {entidad.subtitulo}
                                    </small>
                                  </div>
                                </div>
                                <span
                                  className={`text-[13px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 border ${
                                    isSelected
                                      ? "bg-white/10 text-gold-300 border-gold-500/30"
                                      : "bg-surface-alt text-ink-muted border-line"
                                  }`}
                                >
                                  {entidad.etiqueta}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick actions group */}
              {filteredActions.length > 0 && (
                <div className="py-2">
                  <div className="px-3 py-1.5 text-[13px] font-bold text-gold-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-gold-600" />
                    Acciones Rápidas
                  </div>
                  <div className="space-y-0.5">
                    {filteredActions.map((action) => {
                      const itemIndex = allItems.findIndex(
                        (i) => i.type === "action" && i.data.id === action.id,
                      );
                      const isSelected = itemIndex === selectedIndex;
                      const Icon = action.icon;
                      return (
                        <div
                          key={action.id}
                          onClick={() => handleSelect(itemIndex)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`flex items-center justify-between min-h-12 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? "bg-navy-950 text-white shadow-sm"
                              : "text-ink hover:bg-surface-hover"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`p-2 rounded-lg shrink-0 ${
                                isSelected
                                  ? "bg-gold-600/20 text-gold-500"
                                  : "bg-surface-alt text-ink-muted"
                              }`}
                            >
                              <Icon className="size-4" />
                            </span>
                            <div className="truncate">
                              <span className="text-[14px] font-semibold block truncate">
                                {action.title}
                              </span>
                              <small
                                className={`text-[13px] block truncate ${
                                  isSelected ? "text-slate-300" : "text-ink-muted"
                                }`}
                              >
                                {action.description}
                              </small>
                            </div>
                          </div>
                          <span
                            className={`text-[13px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 border ${
                              isSelected
                                ? "bg-white/10 text-gold-400 border-gold-500/30"
                                : "bg-surface-alt text-ink-muted border-line"
                            }`}
                          >
                            {action.badge}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modules group */}
              {filteredModules.length > 0 && (
                <div className="pt-2">
                  <div className="px-3 py-1.5 text-[13px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Command className="size-3.5" />
                    Módulos del Sistema
                  </div>
                  <div className="space-y-0.5">
                    {filteredModules.map((modulo) => {
                      const itemIndex = allItems.findIndex(
                        (i) =>
                          i.type === "module" &&
                          i.data.id === modulo.id &&
                          i.data.ruta === modulo.ruta,
                      );
                      const isSelected = itemIndex === selectedIndex;
                      const ws = WORKSPACES.find((w) => w.id === modulo.workspaceId);
                      return (
                        <div
                          key={modulo.ruta}
                          onClick={() => handleSelect(itemIndex)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`flex items-center justify-between min-h-12 px-3 py-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? "bg-navy-950 text-white shadow-sm"
                              : "text-ink hover:bg-surface-hover"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`p-2 rounded-lg shrink-0 ${
                                isSelected
                                  ? "bg-gold-600 text-navy-950"
                                  : "bg-surface-alt text-navy-900 border border-line/60"
                              }`}
                            >
                              <ModuloIcon name={modulo.icono} className="size-4" />
                            </span>
                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <span className="text-[14px] font-semibold">
                                  {modulo.nombre}
                                </span>
                                <span
                                  className={`text-[13px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                                    isSelected
                                      ? "text-gold-400 bg-white/10"
                                      : "text-ink-muted bg-surface-alt"
                                  }`}
                                >
                                  {ws?.nombre}
                                </span>
                              </div>
                              <small
                                className={`text-[13px] block truncate ${
                                  isSelected ? "text-slate-300" : "text-ink-muted"
                                }`}
                              >
                                {modulo.descripcion}
                              </small>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {modulo.atajo && (
                              <kbd
                                className={`text-[13px] font-mono font-semibold px-2 py-0.5 rounded border ${
                                  isSelected
                                    ? "bg-white/15 text-gold-300 border-white/20"
                                    : "bg-surface-alt text-ink-muted border-line"
                                }`}
                              >
                                {modulo.atajo}
                              </kbd>
                            )}
                            <ArrowRight
                              className={`size-4 transition-transform ${
                                isSelected
                                  ? "translate-x-0.5 text-gold-500"
                                  : "text-line opacity-0"
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex flex-wrap gap-2 items-center justify-between px-4 py-2.5 bg-surface-alt border-t border-line text-[13px] text-ink-muted">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-semibold text-ink">↑↓</kbd> Navegar
            </span>
            <span>
              <kbd className="font-semibold text-ink">↵</kbd> Abrir
            </span>
            <span>
              <kbd className="font-semibold text-ink">esc</kbd> Cerrar
            </span>
          </div>
          <span className="font-medium text-navy-950">
            Quisqueya Home Private Desk · Búsqueda Global ⌘K
          </span>
        </div>
      </div>
    </div>
  );
}
