"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { WORKSPACES, type Modulo } from "../modulos";
import { ModuloIcon } from "./icon-resolver";

interface CrmSidebarMenuProps {
  modulosVisibles: readonly Modulo[];
}

/** Badges de especialidad inmobiliaria para dar nivel Pro al menú */
const BADGES_INMOBILIARIOS: Record<string, { texto: string; estilo: string }> = {
  "/leads": {
    texto: "12",
    estilo: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
  },
  "/pipeline": {
    texto: "$2.4M",
    estilo: "bg-gold-500/20 text-gold-300 border border-gold-500/30",
  },
  "/propiedades": {
    texto: "Confotur",
    estilo: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  },
  "/comisiones": {
    texto: "50/50",
    estilo: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  },
  "/academy": {
    texto: "Pro",
    estilo: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
  },
};

export function CrmSidebarMenu({ modulosVisibles }: CrmSidebarMenuProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [filterQuery, setFilterQuery] = useState("");

  // Estado para colapsar/expandir cada workspace (todos abiertos por defecto)
  const [openWorkspaces, setOpenWorkspaces] = useState<Record<string, boolean>>({
    comercial: true,
    operaciones: true,
    brokerage: true,
    herramientas: true,
  });

  const toggleWorkspace = (wsId: string) => {
    setOpenWorkspaces((prev) => ({
      ...prev,
      [wsId]: !prev[wsId],
    }));
  };

  const q = filterQuery.trim().toLowerCase();

  const filtered = q
    ? modulosVisibles.filter(
        (m) =>
          m.nombre.toLowerCase().includes(q) ||
          m.descripcion.toLowerCase().includes(q)
      )
    : modulosVisibles;

  return (
    <div className="space-y-3 py-2">
      {/* Quick sidebar filter with shortcut indicator */}
      <div className="px-3">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Filtrar módulos..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-7 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:border-gold-500/60 focus:bg-white/10 transition-colors"
          />
          {filterQuery ? (
            <button
              type="button"
              onClick={() => setFilterQuery("")}
              className="absolute right-2 p-0.5 text-slate-400 hover:text-white transition-colors"
              aria-label="Limpiar filtro"
            >
              <X className="size-3" />
            </button>
          ) : (
            <kbd className="absolute right-2 text-[9px] font-mono text-slate-400/80 bg-white/5 px-1 py-0.5 rounded border border-white/10 pointer-events-none">
              /
            </kbd>
          )}
        </div>
        {q && (
          <div className="mt-1 px-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>Resultados: {filtered.length}</span>
            <button
              type="button"
              onClick={() => setFilterQuery("")}
              className="text-gold-400 hover:underline"
            >
              Restablecer
            </button>
          </div>
        )}
      </div>

      {/* Workspaces sections with Accordion */}
      {WORKSPACES.map((ws) => {
        const items = filtered.filter((m) => m.workspaceId === ws.id);
        if (items.length === 0) return null;

        const isExpanded = q ? true : (openWorkspaces[ws.id] ?? true);

        return (
          <SidebarGroup key={ws.id} className="py-0.5 px-2">
            <button
              type="button"
              onClick={() => toggleWorkspace(ws.id)}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold-400/90 font-heading hover:bg-white/5 transition-colors cursor-pointer group"
              aria-expanded={isExpanded}
            >
              <span className="flex items-center gap-1.5 truncate">
                {ws.nombre}
                <span className="text-[9px] font-mono font-normal text-slate-400/70 group-hover:text-gold-300">
                  ({items.length})
                </span>
              </span>
              <ChevronDown
                className={`size-3 text-gold-400/60 transition-transform duration-200 ${
                  isExpanded ? "rotate-0" : "-rotate-90 opacity-60"
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <SidebarGroupContent className="pt-0.5">
                    <SidebarMenu className="gap-0.5 list-none pl-0 m-0">
                      {items.map((modulo) => {
                        const activo =
                          pathname === modulo.ruta ||
                          (modulo.ruta !== "/inicio" && pathname.startsWith(`${modulo.ruta}/`));

                        const badgeInfo = BADGES_INMOBILIARIOS[modulo.ruta];

                        return (
                          <SidebarMenuItem key={modulo.ruta} className="list-none">
                            <SidebarMenuButton
                              asChild
                              isActive={activo}
                              tooltip={modulo.nombre}
                              className={`h-9 px-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                                activo
                                  ? "bg-gradient-to-r from-gold-600 to-gold-500 font-bold text-navy-950 shadow-sm border-l-4 border-gold-300 shadow-gold-950/20"
                                  : "text-slate-300 hover:bg-white/8 hover:text-white"
                              }`}
                            >
                              <Link
                                href={modulo.ruta}
                                aria-current={activo ? "page" : undefined}
                                onClick={() => setOpenMobile(false)}
                                className="flex items-center justify-between w-full"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className={`shrink-0 transition-colors ${
                                      activo ? "text-navy-950" : "text-gold-500/80"
                                    }`}
                                  >
                                    <ModuloIcon name={modulo.icono} className="size-4" />
                                  </span>
                                  <span className="truncate">{modulo.nombre}</span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {badgeInfo && (
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-tight ${
                                        activo
                                          ? "bg-navy-950/20 text-navy-950 border border-navy-950/30"
                                          : badgeInfo.estilo
                                      }`}
                                    >
                                      {badgeInfo.texto}
                                    </span>
                                  )}

                                  {modulo.atajo && (
                                    <span
                                      className={`text-[9px] font-mono px-1 py-0.2 rounded transition-opacity ${
                                        activo
                                          ? "text-navy-950/80 bg-white/20 font-bold"
                                          : "text-slate-400 bg-white/5 opacity-60"
                                      }`}
                                    >
                                      {modulo.atajo}
                                    </span>
                                  )}
                                </div>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </motion.div>
              )}
            </AnimatePresence>
          </SidebarGroup>
        );
      })}
    </div>
  );
}
