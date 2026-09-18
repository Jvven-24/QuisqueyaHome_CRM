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
