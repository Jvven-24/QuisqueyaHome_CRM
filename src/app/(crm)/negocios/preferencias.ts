/**
 * Preferencias de presentación de Negocios (UI-014): qué muestra la tarjeta,
 * qué etapas se ven en el tablero y qué columnas tiene la lista. Viven en el
 * navegador; nunca ocultan permisos: un campo que el rol no recibe sigue sin
 * pintarse aunque la preferencia diga «mostrar».
 */

export const CAMPOS_TARJETA = ["monto", "proyecto", "proxima", "antiguedad", "broker", "origen", "probabilidad"] as const;
export type CampoTarjeta = (typeof CAMPOS_TARJETA)[number];

export const COLUMNAS_LISTA = ["proyecto", "etapa", "monto", "probabilidad", "broker", "origen", "antiguedad", "proxima", "creado"] as const;
export type ColumnaLista = (typeof COLUMNAS_LISTA)[number];

export const ETIQUETA_CAMPO: Record<CampoTarjeta, string> = {
  monto: "Monto",
  proyecto: "Proyecto y unidad",
  proxima: "Próxima acción",
  antiguedad: "Tiempo en la etapa",
  broker: "Broker responsable",
  origen: "Canal de origen",
  probabilidad: "Probabilidad",
};

export const ETIQUETA_COLUMNA: Record<ColumnaLista, string> = {
  proyecto: "Proyecto",
  etapa: "Etapa",
  monto: "Monto",
  probabilidad: "Probabilidad",
  broker: "Broker",
  origen: "Origen",
  antiguedad: "En etapa",
  proxima: "Próxima acción",
  creado: "Creado",
};

export type Preferencias = {
  tarjeta: Record<CampoTarjeta, boolean>;
  compacta: boolean;
  etapasOcultas: number[];
  columnasLista: Record<ColumnaLista, boolean>;
  ordenColumnas: ColumnaLista[];
};

export const PREFERENCIAS_INICIALES: Preferencias = {
  tarjeta: { monto: true, proyecto: true, proxima: true, antiguedad: true, broker: true, origen: true, probabilidad: false },
  compacta: false,
  etapasOcultas: [],
  ordenColumnas: [...COLUMNAS_LISTA],
  columnasLista: { proyecto: true, etapa: true, monto: true, probabilidad: false, broker: true, origen: false, antiguedad: true, proxima: true, creado: true },
};

function booleanos<K extends string>(claves: readonly K[], crudo: unknown, base: Record<K, boolean>): Record<K, boolean> {
  const out = { ...base };
  if (!crudo || typeof crudo !== "object") return out;
  for (const k of claves) {
    const v = (crudo as Record<string, unknown>)[k];
    if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

/** Lee lo guardado; cualquier valor ausente o con otro tipo cae al valor inicial. */
export function leerPreferencias(texto: string | null): Preferencias {
  if (!texto) return PREFERENCIAS_INICIALES;
  try {
    const crudo = JSON.parse(texto) as Record<string, unknown>;
    if (!crudo || typeof crudo !== "object" || Array.isArray(crudo)) return PREFERENCIAS_INICIALES;
    const ocultas = Array.isArray(crudo.etapasOcultas)
      ? [...new Set(crudo.etapasOcultas.filter((v): v is number => Number.isSafeInteger(v) && (v as number) > 0))].slice(0, 50)
      : [];
    return {
      tarjeta: booleanos(CAMPOS_TARJETA, crudo.tarjeta, PREFERENCIAS_INICIALES.tarjeta),
      compacta: typeof crudo.compacta === "boolean" ? crudo.compacta : false,
      etapasOcultas: ocultas,
      ordenColumnas: normalizarOrdenColumnas(crudo.ordenColumnas),
      columnasLista: booleanos(COLUMNAS_LISTA, crudo.columnasLista, PREFERENCIAS_INICIALES.columnasLista),
    };
  } catch {
    return PREFERENCIAS_INICIALES;
  }
}

/** Alterna una etapa oculta sin permitir ocultarlas todas (el tablero nunca queda vacío por preferencia). */
export function alternarEtapa(prefs: Preferencias, etapaId: number, totalEtapas: number): Preferencias {
  const ocultas = prefs.etapasOcultas.includes(etapaId)
    ? prefs.etapasOcultas.filter((id) => id !== etapaId)
    : [...prefs.etapasOcultas, etapaId];
  if (ocultas.length >= totalEtapas) return prefs;
  return { ...prefs, etapasOcultas: ocultas };
}

export function normalizarOrdenColumnas(valor: unknown): ColumnaLista[] {
  const conocidas = Array.isArray(valor) ? valor.filter((v): v is ColumnaLista => typeof v === "string" && COLUMNAS_LISTA.includes(v as ColumnaLista)) : [];
  return [...new Set([...conocidas, ...COLUMNAS_LISTA])];
}
export function columnasVisibles(p: Preferencias, veMontos: boolean): ColumnaLista[] {
  return normalizarOrdenColumnas(p.ordenColumnas).filter((c) => p.columnasLista[c] && (c !== "monto" || veMontos));
}
export function desplazarColumna(p: Preferencias, c: ColumnaLista, delta: -1 | 1): Preferencias {
  const orden = normalizarOrdenColumnas(p.ordenColumnas); const i = orden.indexOf(c); const j = i + delta;
  if (j < 0 || j >= orden.length) return p;
  [orden[i], orden[j]] = [orden[j]!, orden[i]!];
  return { ...p, ordenColumnas: orden };
}
export function serializarPreferencias(p: Preferencias): string {
  return JSON.stringify(leerPreferencias(JSON.stringify(p)));
}
