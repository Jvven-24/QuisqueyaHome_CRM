/**
 * Estado optimista del Kanban de Negocios (lógica pura, sin React ni red).
 *
 * La tarjeta aterriza en la columna destino en el mismo instante en que se
 * suelta: el movimiento queda «pendiente» encima de los datos del servidor
 * (`base`) hasta que el servidor lo confirma o lo rechaza. Si lo rechaza, la
 * reversión devuelve la tarjeta a su columna y a su posición exactas.
 *
 * Los totales por etapa y el valor activo también se ajustan con los
 * pendientes, así que contadores y sumas cambian a la vez que la tarjeta.
 *
 * El orden manual dentro de una columna no existe en el esquema (no hay campo
 * de posición en `deals`): se guarda en el navegador, por etapa.
 */
import type { FilaNegocio, ResumenEtapaNegocio } from "@/application/pipeline/puertos";
import type { ColumnaEtapa, Etapa } from "./logica.ts";

export type EstadoPendiente = "enviando" | "dialogo" | "confirmado";

export type MovimientoPendiente = {
  dealId: number;
  desde: number;
  hacia: number;
  estado: EstadoPendiente;
  /** Orden de las dos columnas antes de mover, para revertir a la posición exacta. */
  ordenPrevio: { desde: number[] | undefined; hacia: number[] | undefined };
};

export type OrdenManual = Record<number, number[]>;

export type EstadoKanban = {
  base: FilaNegocio[];
  pendientes: Record<number, MovimientoPendiente>;
  orden: OrdenManual;
};

export type AccionKanban =
  | { tipo: "sincronizar"; negocios: FilaNegocio[] }
  | { tipo: "mover"; dealId: number; hacia: number; indice?: number; estado: "enviando" | "dialogo" }
  | { tipo: "reordenar"; etapaId: number; dealId: number; indice: number }
  | { tipo: "enviar"; dealId: number }
  | { tipo: "confirmar"; dealId: number }
  | { tipo: "revertir"; dealId: number }
  | { tipo: "restaurarOrden"; orden: OrdenManual };

export function crearEstadoKanban(negocios: FilaNegocio[], orden: OrdenManual = {}): EstadoKanban {
  return { base: negocios, pendientes: {}, orden };
}

/** Etapa donde se PINTA el negocio: la del movimiento pendiente o la del servidor. */
export function etapaEfectiva(estado: EstadoKanban, negocio: FilaNegocio): number {
  return estado.pendientes[negocio.id]?.hacia ?? negocio.stageId;
}

/** Ordena según la lista manual; lo que no figura en ella conserva el orden del servidor, detrás. */
export function ordenarSegun<T extends { id: number }>(filas: T[], orden: number[] | undefined): T[] {
  if (!orden || orden.length === 0) return filas;
  const posicion = new Map(orden.map((id, i) => [id, i]));
  const conOrden = filas.filter((f) => posicion.has(f.id)).sort((a, b) => posicion.get(a.id)! - posicion.get(b.id)!);
  const resto = filas.filter((f) => !posicion.has(f.id));
  return [...conOrden, ...resto];
}

/** Ids visibles de una columna, ya con pendientes y orden manual aplicados. */
export function idsDeColumna(estado: EstadoKanban, etapaId: number): number[] {
  const filas = estado.base.filter((n) => etapaEfectiva(estado, n) === etapaId);
  return ordenarSegun(filas, estado.orden[etapaId]).map((n) => n.id);
}

function insertar(lista: number[], id: number, indice: number | undefined): number[] {
  const sin = lista.filter((x) => x !== id);
  const i = Math.max(0, Math.min(indice ?? 0, sin.length));
  return [...sin.slice(0, i), id, ...sin.slice(i)];
}

function restaurar(orden: OrdenManual, etapaId: number, previo: number[] | undefined): OrdenManual {
  const copia = { ...orden };
  if (previo === undefined) delete copia[etapaId];
  else copia[etapaId] = previo;
  return copia;
}

export function reducirKanban(estado: EstadoKanban, accion: AccionKanban): EstadoKanban {
  switch (accion.tipo) {
    case "sincronizar": {
      const porId = new Map(accion.negocios.map((n) => [n.id, n]));
      const pendientes: Record<number, MovimientoPendiente> = {};
      for (const p of Object.values(estado.pendientes)) {
        const n = porId.get(p.dealId);
        // El servidor ya refleja el cambio (o el negocio salió de esta página): se suelta el pendiente.
        if (!n || n.stageId === p.hacia) continue;
        // Confirmado pero el servidor dice otra cosa: manda el servidor.
        if (p.estado === "confirmado") continue;
        pendientes[p.dealId] = p;
      }
      return { ...estado, base: accion.negocios, pendientes };
    }
    case "mover": {
      const negocio = estado.base.find((n) => n.id === accion.dealId);
      if (!negocio || estado.pendientes[accion.dealId]) return estado;
      const desde = etapaEfectiva(estado, negocio);
      if (desde === accion.hacia) return estado;
      const listaDesde = idsDeColumna(estado, desde).filter((id) => id !== accion.dealId);
      const listaHacia = insertar(idsDeColumna(estado, accion.hacia), accion.dealId, accion.indice);
      return {
        ...estado,
        orden: { ...estado.orden, [desde]: listaDesde, [accion.hacia]: listaHacia },
        pendientes: {
          ...estado.pendientes,
          [accion.dealId]: {
            dealId: accion.dealId,
            desde,
            hacia: accion.hacia,
            estado: accion.estado,
            ordenPrevio: { desde: estado.orden[desde], hacia: estado.orden[accion.hacia] },
          },
        },
      };
    }
    case "reordenar": {
      const actual = idsDeColumna(estado, accion.etapaId);
      if (!actual.includes(accion.dealId)) return estado;
      const nueva = insertar(actual, accion.dealId, accion.indice);
      if (nueva.every((id, i) => id === actual[i])) return estado;
      return { ...estado, orden: { ...estado.orden, [accion.etapaId]: nueva } };
    }
    case "enviar":
    case "confirmar": {
      const p = estado.pendientes[accion.dealId];
      if (!p) return estado;
      const nuevoEstado: EstadoPendiente = accion.tipo === "enviar" ? "enviando" : "confirmado";
      return { ...estado, pendientes: { ...estado.pendientes, [accion.dealId]: { ...p, estado: nuevoEstado } } };
    }
    case "revertir": {
      const p = estado.pendientes[accion.dealId];
      if (!p) return estado;
      const pendientes = { ...estado.pendientes };
      delete pendientes[accion.dealId];
      const orden = restaurar(restaurar(estado.orden, p.desde, p.ordenPrevio.desde), p.hacia, p.ordenPrevio.hacia);
      return { ...estado, pendientes, orden };
    }
    case "restaurarOrden":
      return { ...estado, orden: { ...accion.orden, ...estado.orden } };
  }
}

/* ------------------------------ selectores ------------------------------ */

/** Resumen del servidor con los pendientes aplicados: cuenta y monto pasan de una etapa a otra. */
export function resumenOptimista(resumen: ResumenEtapaNegocio[], estado: EstadoKanban, etapas: Etapa[]): ResumenEtapaNegocio[] {
  const filas = resumen.map((r) => ({ ...r }));
  const kindDe = new Map(etapas.map((e) => [e.id, e.kind]));
  for (const p of Object.values(estado.pendientes)) {
    const n = estado.base.find((x) => x.id === p.dealId);
    if (!n) continue;
    const monto = n.amountCents ?? 0;
    const origen = filas.find((r) => r.stageId === p.desde && r.currency === n.currency);
    if (!origen) continue;
    origen.count -= 1;
    if (origen.amountCents !== undefined) origen.amountCents -= monto;
    let destino = filas.find((r) => r.stageId === p.hacia && r.currency === n.currency);
    if (!destino) {
      destino = { stageId: p.hacia, kind: kindDe.get(p.hacia) ?? "open", currency: n.currency, count: 0 };
      if (origen.amountCents !== undefined) destino.amountCents = 0;
      filas.push(destino);
    }
    destino.count += 1;
    if (destino.amountCents !== undefined) destino.amountCents += monto;
  }
  return filas.filter((r) => r.count > 0);
}

/** Columnas del tablero con pendientes, orden manual y totales ajustados. */
export function columnasOptimistas(etapas: Etapa[], estado: EstadoKanban, resumen: ResumenEtapaNegocio[]): ColumnaEtapa[] {
  const ajustado = resumenOptimista(resumen, estado, etapas);
  return etapas.map((etapa) => {
    const totales = new Map<string, { currency: string; count: number; amountCents?: number }>();
    for (const r of ajustado) {
      if (r.stageId !== etapa.id) continue;
      const previo = totales.get(r.currency) ?? { currency: r.currency, count: 0 };
      previo.count += r.count;
      if (r.amountCents !== undefined) previo.amountCents = (previo.amountCents ?? 0) + r.amountCents;
      totales.set(r.currency, previo);
    }
    const lista = [...totales.values()];
    const filas = ordenarSegun(estado.base.filter((n) => etapaEfectiva(estado, n) === etapa.id), estado.orden[etapa.id]);
    return { etapa, filas, total: lista.reduce((s, t) => s + t.count, 0), totales: lista };
  });
}

/* --------------------------- vista previa al arrastrar --------------------------- */

export type Arrastre = { dealId: number; hacia: number; indice: number };

/**
 * Hueco donde caerá la tarjeta mientras se arrastra entre columnas: la mueve
 * solo en la vista (sin tocar totales ni pendientes).
 */
export function previsualizarArrastre(columnas: ColumnaEtapa[], arrastre: Arrastre | null): ColumnaEtapa[] {
  if (!arrastre) return columnas;
  const origen = columnas.find((c) => c.filas.some((f) => f.id === arrastre.dealId));
  if (!origen || origen.etapa.id === arrastre.hacia) return columnas;
  const fila = origen.filas.find((f) => f.id === arrastre.dealId)!;
  return columnas.map((c) => {
    if (c === origen) return { ...c, filas: c.filas.filter((f) => f.id !== arrastre.dealId) };
    if (c.etapa.id !== arrastre.hacia) return c;
    const i = Math.max(0, Math.min(arrastre.indice, c.filas.length));
    return { ...c, filas: [...c.filas.slice(0, i), fila, ...c.filas.slice(i)] };
  });
}

/** `arrayMove` sin dependencia: posición final de un elemento tras soltarlo sobre otro. */
export function moverEnLista<T>(lista: T[], desde: number, hasta: number): T[] {
  if (desde < 0 || desde >= lista.length) return [...lista];
  const copia = [...lista];
  const [x] = copia.splice(desde, 1);
  copia.splice(Math.max(0, Math.min(hasta, copia.length)), 0, x!);
  return copia;
}

/* ------------------------- persistencia del orden manual ------------------------- */

const MAX_IDS_POR_ETAPA = 400;

export function serializarOrden(orden: OrdenManual): string {
  const limpio: OrdenManual = {};
  for (const [etapa, ids] of Object.entries(orden)) limpio[Number(etapa)] = ids.slice(0, MAX_IDS_POR_ETAPA);
  return JSON.stringify(limpio);
}

/** Lee lo guardado en el navegador; cualquier cosa ilegible o con forma extraña se descarta. */
export function leerOrden(texto: string | null): OrdenManual {
  if (!texto) return {};
  try {
    const crudo = JSON.parse(texto) as unknown;
    if (!crudo || typeof crudo !== "object" || Array.isArray(crudo)) return {};
    const out: OrdenManual = {};
    for (const [clave, valor] of Object.entries(crudo as Record<string, unknown>)) {
      const etapa = Number(clave);
      if (!Number.isSafeInteger(etapa) || etapa <= 0 || !Array.isArray(valor)) continue;
      const ids = valor.filter((v): v is number => Number.isSafeInteger(v) && (v as number) > 0);
      out[etapa] = [...new Set(ids)].slice(0, MAX_IDS_POR_ETAPA);
    }
    return out;
  } catch {
    return {};
  }
}
