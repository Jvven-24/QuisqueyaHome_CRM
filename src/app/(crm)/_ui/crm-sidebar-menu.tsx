"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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
    <div className="space-y-4 py-2">
      {/* Quick sidebar filter */}
      <div className="px-3">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-sidebar-meta pointer-events-none" />
          <input
            type="text"
            placeholder="Filtrar módulos..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full h-8 pl-8 pr-2 text-xs bg-white/5 border border-white/10 rounded-lg text-sidebar-foreground placeholder:text-sidebar-meta focus:outline-none focus:border-gold-600/60 focus:bg-white/10 transition-colors"
          />
        </div>
      </div>

      {/* Workspaces sections */}
      {WORKSPACES.map((ws) => {
        const items = filtered.filter((m) => m.workspaceId === ws.id);
        if (items.length === 0) return null;

        return (
          <SidebarGroup key={ws.id} className="py-1 px-2">
            <SidebarGroupLabel className="px-2 text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold-500/90 font-heading">
              {ws.nombre}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {items.map((modulo) => {
                  const activo =
                    pathname === modulo.ruta ||
                    (modulo.ruta !== "/inicio" && pathname.startsWith(`${modulo.ruta}/`));

                  return (
                    <SidebarMenuItem key={modulo.ruta}>
                      <SidebarMenuButton
                        asChild
                        isActive={activo}
                        tooltip={modulo.nombre}
                        className={`h-9 px-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                          activo
                            ? "bg-gold-600 font-bold text-navy-950 shadow-sm border border-gold-500/40"
                            : "text-sidebar-foreground hover:bg-white/8 hover:text-white"
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

                          {modulo.atajo && (
                            <span
                              className={`text-[9px] font-mono px-1 py-0.2 rounded transition-opacity ${
                                activo
                                  ? "text-navy-950/80 bg-white/20 font-bold"
                                  : "text-sidebar-meta bg-white/5 opacity-60"
                              }`}
                            >
                              {modulo.atajo}
                            </span>
                          )}
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
  );
}
