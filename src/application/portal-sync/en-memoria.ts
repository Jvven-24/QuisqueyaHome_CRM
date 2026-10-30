/** Adaptador y fuente en memoria: son el doble de pruebas del portal real (misma semántica idempotente). */
import type { EntradaPortal, FuenteProyectos, ProyectoPublico, PuertoPortal } from "./tipos.ts";

export function portalEnMemoria(inicial: { proyecto: ProyectoPublico; huella: string }[] = []) {
  const datos = new Map(inicial.map((i) => [i.proyecto.slug, i]));
  const llamadas: { op: "publicar" | "retirar"; slug: string }[] = [];
  const fallar = new Set<string>();
  const puerto: PuertoPortal = {
    async listar(): Promise<EntradaPortal[]> { return [...datos.values()].map((d) => ({ slug: d.proyecto.slug, huella: d.huella })); },
    async publicar(proyecto, huella) { llamadas.push({ op: "publicar", slug: proyecto.slug }); if (fallar.has(proyecto.slug)) throw new Error("Portal no disponible"); datos.set(proyecto.slug, { proyecto, huella }); },
    async retirar(slug) { llamadas.push({ op: "retirar", slug }); if (fallar.has(slug)) throw new Error("Portal no disponible"); datos.delete(slug); },
  };
  return { puerto, datos, llamadas, fallar };
}

export const fuenteEnMemoria = (proyectos: ProyectoPublico[]): FuenteProyectos & { proyectos: ProyectoPublico[] } => ({ proyectos, proyectosPublicables: async () => proyectos });
