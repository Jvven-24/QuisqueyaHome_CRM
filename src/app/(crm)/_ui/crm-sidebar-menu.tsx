"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, X, ChevronDown } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { ENTRADAS_N1, type EntradaN1, type Modulo } from "../modulos";
import { ModuloIcon } from "./icon-resolver";

interface CrmSidebarMenuProps {
  entradasVisibles?: readonly EntradaN1[];
  modulosVisibles?: readonly Modulo[];
}

export function CrmSidebarMenu({
  entradasVisibles,
  modulosVisibles,
}: CrmSidebarMenuProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const [filterQuery, setFilterQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setPendingRoute(null);
    setExpanded({});
  }

  const activePath = pendingRoute ?? pathname;

  useEffect(() => {
    if (!pendingRoute) return;
    const timer = window.setTimeout(() => setPendingRoute(null), 2500);
    return () => window.clearTimeout(timer);
  }, [pendingRoute]);

  const handleNavigate = (ruta: string) => {
    if (ruta !== pathname) {
      setPendingRoute(ruta);
    } else {
      setPendingRoute(null);
    }
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  // Si se proveen entradas N1, se usan directamente; si se pasa modulosVisibles por compatibilidad,
  // filtramos ENTRADAS_N1 según los recursos visibles.
  const baseEntradas =
    entradasVisibles ??
    (modulosVisibles
      ? ENTRADAS_N1.filter((n1) => modulosVisibles.some((m) => m.recurso === n1.recurso))
      : ENTRADAS_N1);

  const q = filterQuery.trim().toLowerCase();

  const filtered = q
    ? baseEntradas.filter(
        (m) =>
          m.nombre.toLowerCase().includes(q) ||
          m.descripcion.toLowerCase().includes(q) ||
          m.rutasHijas?.some(route => modulosVisibles?.find(child => child.ruta === route)?.nombre.toLowerCase().includes(q))
      )
    : baseEntradas;

  return (
    <div className="flex flex-col gap-2 py-1 font-sans">
      {/* Search Bar sutil plano */}
      <div className="px-2">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 size-3.5 text-slate-400/70 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar módulo..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            suppressHydrationWarning
            className="w-full h-11 pl-8 pr-7 text-xs bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.08] border border-white/[0.1] rounded-md text-slate-200 placeholder:text-slate-400/60 focus:outline-none focus:border-white/20 transition-colors"
          />
          {filterQuery ? (
            <button
              type="button"
              onClick={() => setFilterQuery("")}
              className="absolute right-0 size-11 inline-flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2 text-[10px] font-mono text-slate-400/50 pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Lista consolidada N1 (9 accesos directos por rol) */}
      <div className="flex flex-col px-1">
        <SidebarGroup className="p-0">
          <div className="px-2.5 mb-1 text-[13px] font-semibold text-sidebar-foreground select-none">
            Navegación Principal
          </div>

          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5 list-none pl-0 m-0">
              {filtered.map((entrada) => {
                const activo =
                  activePath === entrada.ruta ||
                  (entrada.rutasHijas
                    ? entrada.rutasHijas.some(
                        (r) => activePath === r || activePath.startsWith(`${r}/`)
                      )
                    : entrada.ruta !== "/inicio" && activePath.startsWith(`${entrada.ruta}/`));

                const enSubRutaHija = Boolean(
                  entrada.rutasHijas?.some(
                    (r) => r !== entrada.ruta && (activePath === r || activePath.startsWith(`${r}/`))
                  )
                );
                const subMenuAbierto = expanded[entrada.id] ?? (enSubRutaHija || Boolean(q));

                return (
                  <SidebarMenuItem key={entrada.id} className="list-none">
                    <div className="flex items-center">
                    <SidebarMenuButton
                      asChild
                      isActive={activo}
                      tooltip={entrada.nombre}
                      className={`min-h-11 h-auto px-2.5 rounded-lg text-[13px] font-medium transition-colors select-none ${
                        activo
                          ? "bg-gold-600 text-navy-950 font-semibold shadow-none data-[active=true]:bg-gold-600 data-[active=true]:text-navy-950 data-[active=true]:font-semibold hover:bg-gold-500 hover:text-navy-950"
                          : "text-slate-300/80 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      <Link
                        href={entrada.ruta}
                        prefetch={false}
                        aria-current={activePath === entrada.ruta ? "page" : undefined}
                        onClick={() => handleNavigate(entrada.ruta)}
                        className="flex items-center justify-between w-full"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`shrink-0 transition-colors ${
                              activo
                                ? "text-navy-950"
                                : "text-slate-400/80 group-hover:text-slate-200"
                            }`}
                          >
                            <ModuloIcon name={entrada.icono} className="size-4" strokeWidth={1.75} />
                          </span>
                          <span className="truncate">{entrada.nombre}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {entrada.atajo && (
                            <span
                              className={`hidden group-hover:inline-block text-[9px] font-mono ${
                                activo ? "text-navy-950/70" : "text-slate-500"
                              }`}
                            >
                              {entrada.atajo}
                            </span>
                          )}
                        </div>
                      </Link>
                    </SidebarMenuButton>
                    {entrada.rutasHijas && entrada.rutasHijas.length > 1 && <button type="button" aria-label={"Mostrar secciones de " + entrada.nombre} aria-expanded={subMenuAbierto} aria-controls={"sections-" + entrada.id} className="private-nav-toggle" onClick={() => setExpanded(value => ({...value, [entrada.id]: !subMenuAbierto}))}><ChevronDown className="size-4" /></button>}
                    </div>
                    {entrada.rutasHijas && subMenuAbierto && <nav id={"sections-" + entrada.id} aria-label={entrada.nombre} className="private-nav-children">
                      {entrada.rutasHijas.map(route => { const child = modulosVisibles?.find(module => module.ruta === route); return child ? <Link key={route} href={route} prefetch={false} aria-current={activePath === route || activePath.startsWith(route + "/") ? "page" : undefined} onClick={() => handleNavigate(route)}>{child.nombre}</Link> : null; })}
                    </nav>}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </div>
    </div>
  );
}

/**
 * Accesos secundarios anclados en el pie del Sidebar (Academy y Configuración).
 */
export function CrmSidebarFooterNav({
  pieVisibles,
}: {
  pieVisibles: readonly EntradaN1[];
}) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  if (!pieVisibles || pieVisibles.length === 0) return null;

  return (
    <nav aria-label="Accesos del sistema" className="flex flex-col gap-0.5 pb-1 mb-1 border-b border-white/10">
      {pieVisibles.map((entrada) => {
        const activo =
          pathname === entrada.ruta ||
          pathname.startsWith(`${entrada.ruta}/`) ||
          Boolean(entrada.rutasHijas?.some((r) => pathname === r || pathname.startsWith(`${r}/`)));

        return (
          <Link
            key={entrada.id}
            href={entrada.ruta}
            prefetch={false}
            aria-current={pathname === entrada.ruta ? "page" : undefined}
            onClick={() => {
              if (isMobile) setOpenMobile(false);
            }}
            className={`flex items-center justify-between min-h-11 px-2.5 rounded-md text-[13px] font-medium transition-colors select-none ${
              activo
                ? "bg-gold-600 text-navy-950 font-semibold shadow-none"
                : "text-slate-300/80 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`shrink-0 transition-colors ${
                  activo ? "text-navy-950" : "text-slate-400/80 group-hover:text-slate-200"
                }`}
              >
                <ModuloIcon name={entrada.icono} className="size-4" strokeWidth={1.75} />
              </span>
              <span className="truncate">{entrada.nombre}</span>
            </div>

            {entrada.atajo && (
              <span
                className={`hidden group-hover:inline-block text-[9px] font-mono ${
                  activo ? "text-navy-950/70" : "text-slate-500"
                }`}
              >
                {entrada.atajo}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
