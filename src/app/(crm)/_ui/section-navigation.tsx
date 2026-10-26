"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { EntradaN1, Modulo } from "../modulos";
import { routeActive } from "./navigation";

export function SectionNavigation({ entries, modules, sidebar = false }: { entries: readonly EntradaN1[]; modules: readonly Modulo[]; sidebar?: boolean }) {
  const pathname = usePathname();
  if (sidebar) return <div className="private-footer-sections">{entries.filter(item => item.rutasHijas && item.rutasHijas.length > 1).map(item => <details key={`${item.id}-${pathname}`} open={Boolean(item.rutasHijas?.some(route => routeActive(pathname, route)))}><summary className="min-h-11 cursor-pointer px-2 text-[13px] text-sidebar-foreground">Inteligencia &amp; Config</summary><nav aria-label={item.nombre}>{item.rutasHijas?.map(route => {const destination = modules.find(value => value.ruta === route); return destination ? <Link key={route} href={route} prefetch={false} aria-current={routeActive(pathname, route) ? "page" : undefined}>{destination.nombre}</Link> : null;})}</nav></details>)}</div>;
  const entry = entries.find(item => item.rutasHijas?.some(route => routeActive(pathname, route)));
  if (!entry?.rutasHijas || entry.rutasHijas.length < 2) return null;
  return <nav aria-label={"Secciones de " + entry.nombre} className={sidebar ? "private-footer-sections" : "private-section-nav"}>
    {entry.rutasHijas.map(route => {
      const destination = modules.find(item => item.ruta === route);
      if (!destination) return null;
      return <Link key={route} href={route} prefetch={false} aria-current={routeActive(pathname, route) ? "page" : undefined}>{destination.nombre}</Link>;
    })}
  </nav>;
}
