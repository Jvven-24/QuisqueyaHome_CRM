/**
 * Vistas guardadas de Negocios (UI-014). Una vista es una consulta de la URL
 * (modo + filtros + orden) con nombre. Las del sistema vienen fijas; las del
 * usuario se guardan en su navegador (falta backend de vistas compartidas).
 * Solo se conservan claves conocidas: nada arbitrario de la URL entra en la vista.
 */

export const CLAVES_VISTA = [
  "vista", "resultado", "brokerId", "projectId", "stageId", "moneda", "montoMin", "montoMax",
  "desde", "hasta", "campoFecha", "orden", "direccion", "q", "origen", "sinAccion", "diasMin", "probMin",
] as const;

export type VistaGuardada = { id: string; nombre: string; consulta: string; sistema?: boolean };

export const MAX_VISTAS = 20;
const MAX_NOMBRE = 60;

export const VISTAS_SISTEMA: VistaGuardada[] = [
  { id: "todas", nombre: "Todo el embudo", consulta: "", sistema: true },
  { id: "activos", nombre: "Negocios activos", consulta: "resultado=open", sistema: true },
  { id: "sin-accion", nombre: "Sin próxima acción", consulta: "resultado=open&sinAccion=1", sistema: true },
  { id: "estancados", nombre: "Estancados 14+ días", consulta: "diasMin=14&resultado=open", sistema: true },
  { id: "ganados", nombre: "Ventas cerradas", consulta: "resultado=won&vista=lista", sistema: true },
  { id: "perdidos", nombre: "No concretados", consulta: "resultado=lost&vista=lista", sistema: true },
];

/** Deja solo claves conocidas, valores cortos y orden alfabético estable (para comparar vistas). */
export function limpiarConsulta(entrada: URLSearchParams | string): string {
  const params = typeof entrada === "string" ? new URLSearchParams(entrada) : entrada;
  const out = new URLSearchParams();
  for (const clave of [...CLAVES_VISTA].sort()) {
    const valor = params.get(clave);
    if (valor && valor.length <= 64) out.set(clave, valor);
  }
  return out.toString();
}

export function leerVistas(texto: string | null): VistaGuardada[] {
  if (!texto) return [];
  try {
    const crudo = JSON.parse(texto) as unknown;
    if (!Array.isArray(crudo)) return [];
    const vistas: VistaGuardada[] = [];
    for (const v of crudo) {
      if (!v || typeof v !== "object") continue;
      const { id, nombre, consulta } = v as Record<string, unknown>;
      if (typeof id !== "string" || !/^u-[a-z0-9-]{1,40}$/.test(id)) continue;
      if (typeof nombre !== "string" || !nombre.trim() || nombre.length > MAX_NOMBRE) continue;
      if (typeof consulta !== "string") continue;
      vistas.push({ id, nombre: nombre.trim(), consulta: limpiarConsulta(consulta) });
    }
    return vistas.slice(0, MAX_VISTAS);
  } catch {
    return [];
  }
}

export type ResultadoVista = { ok: true; vistas: VistaGuardada[] } | { ok: false; error: string };

export function guardarVista(nombre: string, consulta: string, existentes: VistaGuardada[], id: string): ResultadoVista {
  const limpio = nombre.trim();
  if (!limpio) return { ok: false, error: "Escribe un nombre para la vista." };
  if (limpio.length > MAX_NOMBRE) return { ok: false, error: `El nombre admite hasta ${MAX_NOMBRE} caracteres.` };
  const repetido = [...VISTAS_SISTEMA, ...existentes].some((v) => v.nombre.toLocaleLowerCase("es") === limpio.toLocaleLowerCase("es"));
  if (repetido) return { ok: false, error: "Ya existe una vista con ese nombre." };
  if (existentes.length >= MAX_VISTAS) return { ok: false, error: `Puedes guardar hasta ${MAX_VISTAS} vistas. Borra alguna para crear otra.` };
  return { ok: true, vistas: [...existentes, { id, nombre: limpio, consulta: limpiarConsulta(consulta) }] };
}

/** La vista cuya consulta coincide exactamente con la URL actual, si la hay. */
export function vistaActiva(consultaActual: URLSearchParams | string, vistas: VistaGuardada[]): string | null {
  const actual = limpiarConsulta(consultaActual);
  return vistas.find((v) => limpiarConsulta(v.consulta) === actual)?.id ?? null;
}
