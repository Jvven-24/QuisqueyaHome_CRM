const usd = new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" });
const compact = new Intl.NumberFormat("es-DO", { notation: "compact", maximumFractionDigits: 1 });
const number = new Intl.NumberFormat("es-DO", { maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("es-DO", { timeZone: "America/Santo_Domingo", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

/** Importes del contrato en centavos; una única instancia para las gráficas. */
export function formatUsd(cents: number): string { return usd.format(cents / 100); }
export function formatAxis(value: number, money = false): string { return compact.format(money ? value / 100 : value); }
export function formatNumber(value: number): string { return number.format(value); }
export function formatActivity(value: string): string { return date.format(new Date(value)); }
