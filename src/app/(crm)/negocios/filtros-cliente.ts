/**
 * Filtros avanzados que el contrato de lectura todavía no acepta (UI-014):
 * texto libre, origen, sin próxima acción, días en etapa y probabilidad.
 * Se aplican sobre los negocios YA cargados en la página y la vista lo dice;
 * los filtros de servidor (etapa, broker, proyecto, monto, fechas, moneda) van
 * por la URL al contrato real.
 */
import type { FilaNegocio } from "@/application/pipeline/puertos";
import { diasEnEtapa } from "./antiguedad.ts";

export type FiltrosCliente = { q: string; origen: string; sinAccion: boolean; diasMin: number | null; probMin: number | null };

export const FILTROS_CLIENTE_VACIOS: FiltrosCliente = { q: "", origen: "", sinAccion: false, diasMin: null, probMin: null };

function entero(valor: string | null, max: number): number | null {
  if (!valor || !/^\d{1,4}$/.test(valor)) return null;
  const n = Number(valor);
  return n >= 0 && n <= max ? n : null;
}

export function leerFiltrosCliente(leer: (clave: string) => string | null): FiltrosCliente {
  return {
    q: (leer("q") ?? "").slice(0, 64),
    origen: (leer("origen") ?? "").slice(0, 64),
    sinAccion: leer("sinAccion") === "1",
    diasMin: entero(leer("diasMin"), 3650),
    probMin: entero(leer("probMin"), 100),
  };
}

export function hayFiltrosCliente(f: FiltrosCliente): boolean {
  return Boolean(f.q.trim() || f.origen || f.sinAccion || f.diasMin !== null || f.probMin !== null);
}

/** Minúsculas y sin tildes, para que «Almonte» encuentre «almonté» y viceversa. */
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase("es").trim();
}

export const SIN_ORIGEN = "Directo";

export function aplicarFiltrosCliente(filas: FilaNegocio[], f: FiltrosCliente, ahora = new Date()): FilaNegocio[] {
  const q = normalizar(f.q);
  return filas.filter((n) => {
    if (q) {
      const texto = normalizar([n.contactName, n.proyectoPrincipal?.projectName, n.proyectoPrincipal?.unitCode, n.brokerName, n.contactPhone].filter(Boolean).join(" "));
      if (!texto.includes(q)) return false;
    }
    if (f.origen && (n.sourceName ?? SIN_ORIGEN) !== f.origen) return false;
    if (f.sinAccion && n.nextActivityTitle) return false;
    if (f.diasMin !== null) {
      const dias = diasEnEtapa(n.stageChangedAt, ahora);
      if (dias === null || dias < f.diasMin) return false;
    }
    if (f.probMin !== null && (n.probability === null || n.probability < f.probMin)) return false;
    return true;
  });
}

export function origenesDisponibles(filas: FilaNegocio[]): string[] {
  return [...new Set(filas.map((n) => n.sourceName ?? SIN_ORIGEN))].sort((a, b) => a.localeCompare(b, "es"));
}

/** CSV de las filas elegidas (acción masiva «Exportar»). Solo columnas que el DTO del rol trae. */
export function filasACsv(filas: FilaNegocio[], nombreEtapa: (id: number) => string): string {
  const conMonto = filas.some((n) => n.amountCents !== undefined);
  const cabecera = ["Contacto", "Teléfono", "Etapa", "Proyecto", "Unidad", ...(conMonto ? ["Moneda", "Monto"] : []), "Probabilidad", "Broker", "Origen", "Próxima acción", "Creado"];
  const celda = (v: string | number | null | undefined) => {
    const t = v === null || v === undefined ? "" : String(v);
    // Comillas dobles y prevención de fórmulas al abrir en una hoja de cálculo.
    const seguro = /^[=+\-@]/.test(t) ? `'${t}` : t;
    return `"${seguro.replace(/"/g, '""')}"`;
  };
  const lineas = filas.map((n) => [
    n.contactName, n.contactPhoneDisplay ?? n.contactPhone, nombreEtapa(n.stageId), n.proyectoPrincipal?.projectName,
    n.proyectoPrincipal?.unitCode, ...(conMonto ? [n.currency, n.amountCents == null ? "" : (n.amountCents / 100).toFixed(2)] : []),
    n.probability, n.brokerName, n.sourceName ?? SIN_ORIGEN, n.nextActivityTitle, new Date(n.createdAt).toISOString().slice(0, 10),
  ].map(celda).join(","));
  return [cabecera.map(celda).join(","), ...lineas].join("\r\n");
}
