/**
 * Formateo numérico compartido por las vistas del CRM (hallazgo del
 * ponytail-audit: `formatearMonto` estaba repetida en cuatro vistas, cada una
 * con una variante distinta — moneda fija, moneda por parámetro, o `null`
 * para "sin monto todavía").
 */

/**
 * Centavos → moneda en formato dominicano, sin decimales. `cents === null`
 * es un negocio de pipeline sin monto fijado ("Por definir"); `currency` por
 * defecto "USD" porque los reportes de brokers siempre son en dólares.
 */
export function formatearMonto(cents: number | null, currency = "USD"): string {
  if (cents === null) return "Por definir";
  return new Intl.NumberFormat("es-DO", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

/**
 * Convierte enteros de base de datos (centavos) a unidades comerciales (pesos/dólares) para inputs de formulario.
 */
export function centavosAUnidad(cents: number | null | undefined): number | "" {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) return "";
  return Math.round(cents / 100);
}

/**
 * Convierte entrada comercial en unidades (pesos/dólares) a enteros de base de datos (centavos).
 */
export function unidadACentavos(valor: string | number | null | undefined): number | null {
  if (valor === "" || valor === null || valor === undefined) return null;
  const num = typeof valor === "number" ? valor : Number(String(valor).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(num) || num < 0) return null;
  return Math.round(num * 100);
}
