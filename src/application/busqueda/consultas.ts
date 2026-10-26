import { scopeFor, type Actor, type PermissionScope } from "../../domain/rbac.ts";

export type TipoEntidadBusqueda = "lead" | "contacto" | "negocio" | "propiedad" | "tarea";

export type ItemResultadoBusqueda = {
  id: number;
  tipo: TipoEntidadBusqueda;
  titulo: string;
  subtitulo: string;
  etiqueta: string;
  ruta: string;
};

export type ResultadosBusquedaGlobal = {
  leads: ItemResultadoBusqueda[];
  contactos: ItemResultadoBusqueda[];
  negocios: ItemResultadoBusqueda[];
  propiedades: ItemResultadoBusqueda[];
  tareas: ItemResultadoBusqueda[];
};

export type AlcancesBusquedaGlobal = {
  leads: PermissionScope;
  contacts: PermissionScope;
  deals: PermissionScope;
  properties: PermissionScope;
  tasks: PermissionScope;
};

export interface RepositorioBusquedaGlobal {
  buscar(
    actor: Actor,
    termino: string,
    alcances: AlcancesBusquedaGlobal,
  ): Promise<ResultadosBusquedaGlobal>;
}

const VACIO: ResultadosBusquedaGlobal = {
  leads: [],
  contactos: [],
  negocios: [],
  propiedades: [],
  tareas: [],
};

export async function buscarEnCrm(
  deps: { busqueda: RepositorioBusquedaGlobal },
  actor: Actor,
  terminoRaw: string,
): Promise<ResultadosBusquedaGlobal> {
  const termino = terminoRaw.trim().slice(0, 80);
  if (termino.length < 2) {
    return VACIO;
  }

  const alcances: AlcancesBusquedaGlobal = {
    leads: scopeFor(actor, "leads", "view"),
    contacts: scopeFor(actor, "contacts", "view"),
    deals: scopeFor(actor, "deals", "view"),
    properties: scopeFor(actor, "projects", "view"),
    tasks: scopeFor(actor, "activities", "view"),
  };

  return deps.busqueda.buscar(actor, termino, alcances);
}

/** Rechaza una respuesta incompleta antes de que llegue a map/filter de la paleta. */
export function esResultadoBusqueda(value: unknown): value is ResultadosBusquedaGlobal {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return ["leads", "contactos", "negocios", "propiedades", "tareas"].every(key =>
    Array.isArray(record[key]) && record[key].every((item: unknown) => {
      if (!item || typeof item !== "object") return false;
      const row = item as Record<string, unknown>;
      return Number.isSafeInteger(row.id) && ["lead", "contacto", "negocio", "propiedad", "tarea"].includes(String(row.tipo)) &&
        ["titulo", "subtitulo", "etiqueta", "ruta"].every(field => typeof row[field] === "string") &&
        /^\/(?![/\\])/.test(String(row.ruta));
    }));
}

export function mensajeErrorBusqueda(status: number | null, offline: boolean): string {
  if (status === 403) return "No tienes permiso para buscar en esta secci\u00f3n.";
  if (status === 401) return "Tu sesi\u00f3n ha caducado. Vuelve a iniciar sesi\u00f3n.";
  return offline ? "Sin conexi\u00f3n a internet. Reintenta al recuperar la conexi\u00f3n." : "No pudimos cargar los resultados. Reintenta la b\u00fasqueda.";
}
