import type { EntradaN1, Modulo } from "../modulos";

/** Cada hijo conserva su propio permiso; el grupo abre el primer destino autorizado. */
export function visibleEntries(entries: readonly EntradaN1[], modules: readonly Modulo[]): EntradaN1[] {
  return entries.flatMap(entry => {
    const children = (entry.rutasHijas ?? [entry.ruta]).filter(route => modules.some(module => module.ruta === route));
    if (!children.length) return [];
    return [{ ...entry, ruta: children[0]!, ...(entry.rutasHijas ? { rutasHijas: children } : {}) }];
  });
}

export function routeActive(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(route + "/");
}
