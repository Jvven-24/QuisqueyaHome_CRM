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
} from "lucide-react";
import { MODULOS, WORKSPACES, type Modulo } from "../modulos";
import { ModuloIcon } from "./icon-resolver";

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
    description: "Registrar un prospecto calificado en la base de datos",
    ruta: "/leads",
    icon: PlusCircle,
    badge: "Comercial",
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
    title: "Ver Pipeline de Negocios",
    description: "Consultar etapas de negociación y oportunidades activas",
    ruta: "/pipeline",
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
    title: "Explorar Catálogo de Propiedades",
    description: "Inventario de proyectos, tipologías y listas de precios",
    ruta: "/propiedades",
    icon: Building,
    badge: "Activos",
  },
];

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
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (open && e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Autofocus input on open
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const q = query.trim().toLowerCase();

  const filteredActions = q
    ? QUICK_ACTIONS.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.badge.toLowerCase().includes(q)
      )
    : QUICK_ACTIONS;

  const filteredModules = q
    ? modulosVisibles.filter(
        (m) =>
          m.nombre.toLowerCase().includes(q) ||
          m.descripcion.toLowerCase().includes(q) ||
          m.ruta.toLowerCase().includes(q) ||
          (m.atajo && m.atajo.toLowerCase().includes(q))
      )
    : modulosVisibles;

  const allItems: Array<
    | { type: "action"; data: QuickAction }
    | { type: "module"; data: Modulo }
  > = [
    ...filteredActions.map((a) => ({ type: "action" as const, data: a })),
    ...filteredModules.map((m) => ({ type: "module" as const, data: m })),
  ];

  const handleSelect = (index: number) => {
    const item = allItems[index];
    if (!item) return;

    onOpenChange(false);
    if (item.type === "action") {
      router.push(item.data.ruta);
    } else {
      router.push(item.data.ruta);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(0, allItems.length - 1) : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSelect(selectedIndex);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 md:pt-20 bg-navy-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos del CRM"
      >
        {/* Search header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line bg-surface">
          <Search className="size-5 text-ink-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar por módulo, prospecto, acción rápida o atajo (ej. Leads, Citas, G P)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent border-0 outline-none text-sm md:text-base text-ink placeholder:text-ink-muted/70 font-medium h-9 p-0 focus:ring-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-ink-muted hover:text-ink rounded-md transition-colors"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-semibold text-ink-muted bg-surface-alt border border-line rounded">
            ESC
          </kbd>
        </div>

        {/* Results container */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-line/40">
          {allItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Sparkles className="size-8 mx-auto text-gold-600/70 mb-2" />
              <p className="font-semibold text-ink text-sm">
                No se encontraron resultados para &ldquo;{query}&rdquo;
              </p>
              <small className="text-xs text-ink-muted block mt-1">
                Intenta buscar &ldquo;Leads&rdquo;, &ldquo;Pipeline&rdquo;, &ldquo;Propiedades&rdquo;, &ldquo;Agenda&rdquo; o &ldquo;Metas&rdquo;.
              </small>
            </div>
          ) : (
            <>
              {/* Quick actions group */}
              {filteredActions.length > 0 && (
                <div className="pb-2">
                  <div className="px-3 py-1.5 text-[11px] font-bold text-gold-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="size-3 text-gold-600" />
                    Acciones Rápidas
                  </div>
                  <div className="space-y-0.5">
                    {filteredActions.map((action) => {
                      const itemIndex = allItems.findIndex(
                        (i) => i.type === "action" && i.data.id === action.id
                      );
                      const isSelected = itemIndex === selectedIndex;
                      const Icon = action.icon;
                      return (
                        <div
                          key={action.id}
                          onClick={() => handleSelect(itemIndex)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? "bg-navy-950 text-white shadow-sm"
                              : "text-ink hover:bg-surface-hover"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`p-1.5 rounded-lg shrink-0 ${
                                isSelected
                                  ? "bg-gold-600/20 text-gold-500"
                                  : "bg-surface-alt text-ink-muted"
                              }`}
                            >
                              <Icon className="size-4" />
                            </span>
                            <div className="truncate">
                              <span className="text-sm font-semibold block truncate">
                                {action.title}
                              </span>
                              <small
                                className={`text-xs block truncate ${
                                  isSelected ? "text-slate-300" : "text-ink-muted"
                                }`}
                              >
                                {action.description}
                              </small>
                            </div>
                          </div>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
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
                  <div className="px-3 py-1.5 text-[11px] font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Command className="size-3" />
                    Módulos del Sistema
                  </div>
                  <div className="space-y-0.5">
                    {filteredModules.map((modulo) => {
                      const itemIndex = allItems.findIndex(
                        (i) => i.type === "module" && i.data.id === modulo.id && i.data.ruta === modulo.ruta
                      );
                      const isSelected = itemIndex === selectedIndex;
                      const ws = WORKSPACES.find((w) => w.id === modulo.workspaceId);
                      return (
                        <div
                          key={modulo.ruta}
                          onClick={() => handleSelect(itemIndex)}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${
                            isSelected
                              ? "bg-navy-950 text-white shadow-sm"
                              : "text-ink hover:bg-surface-hover"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`p-1.5 rounded-lg shrink-0 ${
                                isSelected
                                  ? "bg-gold-600 text-navy-950"
                                  : "bg-surface-alt text-navy-900 border border-line/60"
                              }`}
                            >
                              <ModuloIcon name={modulo.icono} className="size-4" />
                            </span>
                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold">
                                  {modulo.nombre}
                                </span>
                                <span
                                  className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
                                    isSelected
                                      ? "text-gold-400 bg-white/10"
                                      : "text-ink-muted bg-surface-alt"
                                  }`}
                                >
                                  {ws?.nombre}
                                </span>
                              </div>
                              <small
                                className={`text-xs block truncate ${
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
                                className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${
                                  isSelected
                                    ? "bg-white/15 text-gold-300 border-white/20"
                                    : "bg-surface-alt text-ink-muted border-line"
                                }`}
                              >
                                {modulo.atajo}
                              </kbd>
                            )}
                            <ArrowRight
                              className={`size-3.5 transition-transform ${
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
        <div className="flex items-center justify-between px-4 py-2 bg-surface-alt border-t border-line text-[11px] text-ink-muted">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="font-semibold text-ink">↑↓</kbd> Navegar
            </span>
            <span>
              <kbd className="font-semibold text-ink">↵</kbd> Seleccionar
            </span>
            <span>
              <kbd className="font-semibold text-ink">esc</kbd> Cerrar
            </span>
          </div>
          <span className="font-medium text-navy-950">
            Quisqueya Home Private Desk
          </span>
        </div>
      </div>
    </div>
  );
}
