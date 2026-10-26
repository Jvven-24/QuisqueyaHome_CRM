export type Moneda = "USD" | "DOP";
function centavosExactos(cents: string | bigint | number): bigint {
 if (typeof cents === "number" && !Number.isSafeInteger(cents)) {
  throw new RangeError("Importe en centavos no seguro: use texto decimal o bigint para conservar la precisión.");
 }
 return BigInt(cents);
}
export function montoExacto(cents: string | bigint | number, currency: string): string {
 const value = centavosExactos(cents); const abs = value < 0n ? -value : value;
 return currency + " " + (value < 0n ? "−" : "") + (abs / 100n).toLocaleString("es-DO") + "." + (abs % 100n).toString().padStart(2, "0");
}
export function centavosEntrada(value: string): string | undefined {
 if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) return undefined;
 const [whole, fraction = ""] = value.trim().replace(",", ".").split(".");
 return (BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, "0"))).toString();
}
export function cuentaRegresiva(expiresAt: string, now: number, createdAt?: string) {
 const remaining = Math.max(0, Date.parse(expiresAt) - now);
 const duration = createdAt ? Date.parse(expiresAt) - Date.parse(createdAt) : 0;
 return { remaining, seconds: Math.ceil(remaining / 1000), threshold: remaining === 0 ? "Expirado" : remaining < 3600000 ? "Menos de una hora" : remaining < 86400000 ? "Por vencer en menos de 24 horas" : "Vigente", progress: duration > 0 ? Math.min(100, remaining / duration * 100) : 0 };
}
export function totalesMoneda<T extends { currency: string }>(rows: readonly T[], amount: (row: T) => string | number | bigint) {
 const totals = new Map<string, bigint>();
 for (const row of rows) totals.set(row.currency, (totals.get(row.currency) ?? 0n) + centavosExactos(amount(row)));
 return [...totals].map(([currency, cents]) => ({ currency, cents: cents.toString() }));
}
export function antiguedad(dueDate: string, now: string): "al_dia" | "0-30" | "31-60" | "61-90" | "+90" {
 const days = Math.floor((Date.parse(now) - Date.parse(dueDate)) / 86400000);
 return days < 0 ? "al_dia" : days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "+90";
}
export type LineaLote = { id: number; brokerId: number | null; brokerName: string | null; currency: string; brokerAmountCents: number; status: string };
export function agruparLotes(rows: readonly LineaLote[]) {
 const groups = new Map<string, { id: string; brokerName: string; currency: string; cents: string; lines: number[]; blocked: boolean }>();
 for (const row of rows.filter(row => row.status === "approved")) {
 const id = String(row.brokerId ?? "sin-beneficiario") + "-" + row.currency;
 const g = groups.get(id) ?? { id, brokerName: row.brokerName ?? "Sin beneficiario", currency: row.currency, cents: "0", lines: [], blocked: row.brokerId === null };
 g.cents = (BigInt(g.cents) + centavosExactos(row.brokerAmountCents)).toString(); g.lines.push(row.id); groups.set(id,g);
 } return [...groups.values()];
}
