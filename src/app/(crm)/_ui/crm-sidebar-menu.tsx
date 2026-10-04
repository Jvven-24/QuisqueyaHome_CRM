"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X, ChevronRight } from "lucide-react";
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

/** Badges sutiles y refinados para datos de interés */
const BADGES_MAP: Record<string, string> = {
  "/leads": "12",
  "/pipeline": "$2.4M",
  "/propiedades": "Confotur",
  "/comisiones": "50/50",
};

export function CrmSidebarMenu({ modulosVisibles }: CrmSidebarMenuProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [filterQuery, setFilterQuery] = useState("");

  const q = filterQuery.trim().toLowerCase();

  const filtered = q
    ? modulosVisibles.filter(
        (m) =>
          m.nombre.toLowerCase().includes(q) ||
          m.descripcion.toLowerCase().includes(q)
      )
    : modulosVisibles;

  return (
    <div className="flex flex-col gap-3 py-1 font-sans">
      {/* Search Bar sutil estilo arunjdass */}
      <div className="px-2">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-slate-400/70 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-7 text-xs bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.08] border border-white/[0.08] rounded-md text-slate-200 placeholder:text-slate-400/60 focus:outline-none focus:border-white/20 transition-all"
          />
          {filterQuery ? (
            <button
              type="button"
              onClick={() => setFilterQuery("")}
              className="absolute right-2 p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3" />
            </button>
          ) : (
            <kbd className="absolute right-2 text-[10px] font-mono text-slate-400/50 pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Workspaces sections */}
      <div className="flex flex-col gap-3.5 px-1">
        {WORKSPACES.map((ws) => {
          const items = filtered.filter((m) => m.workspaceId === ws.id);
          if (items.length === 0) return null;

          return (
            <SidebarGroup key={ws.id} className="p-0">
              <div className="px-2.5 mb-1 text-[11px] font-medium tracking-wider text-slate-400/60 uppercase select-none flex items-center justify-between">
                <span>{ws.nombre}</span>
              </div>

              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5 list-none pl-0 m-0">
                  {items.map((modulo) => {
                    const activo =
                      pathname === modulo.ruta ||
                      (modulo.ruta !== "/inicio" && pathname.startsWith(`${modulo.ruta}/`));

                    const badge = BADGES_MAP[modulo.ruta];

                    return (
                      <SidebarMenuItem key={modulo.ruta} className="list-none">
                        <SidebarMenuButton
                          asChild
                          isActive={activo}
                          tooltip={modulo.nombre}
                          className={`h-8 px-2.5 rounded-md text-[13px] font-medium transition-all select-none ${
                            activo
                              ? "bg-white/[0.12] text-white shadow-2xs font-semibold"
                              : "text-slate-300/80 hover:bg-white/[0.06] hover:text-white"
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
                                  activo ? "text-gold-400" : "text-slate-400/80 group-hover:text-slate-200"
                                }`}
                              >
                                <ModuloIcon name={modulo.icono} className="size-4" strokeWidth={1.75} />
                              </span>
                              <span className="truncate">{modulo.nombre}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {badge && (
                                <span
                                  className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full leading-tight ${
                                    activo
                                      ? "bg-gold-500/20 text-gold-300"
                                      : "bg-white/[0.08] text-slate-400"
                                  }`}
                                >
                                  {badge}
                                </span>
                              )}

                              {modulo.atajo && !badge && (
                                <span className="hidden group-hover:inline-block text-[9px] font-mono text-slate-500">
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
            </SidebarGroup>
          );
        })}
      </div>
    </div>
  );
}
