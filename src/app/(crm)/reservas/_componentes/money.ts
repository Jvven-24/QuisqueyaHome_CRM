/** Presentación exacta del DTO en centavos. No convierte importes a coma flotante. */
export function money(cents: string | bigint, currency: string): string { const n = BigInt(cents); const abs = n < 0n ? -n : n; return (n < 0n ? "−" : "") + currency + " " + new Intl.NumberFormat("es-DO").format(abs / 100n) + "." + (abs % 100n).toString().padStart(2, "0"); }
export function decimalToCents(value: string): string { if (!/^(0|[1-9]\d*)([.,]\d{1,2})?$/.test(value.trim()))
    throw new Error("Escribe un importe sin separadores de miles y con hasta dos decimales."); const [whole, fraction = ""] = value.trim().replace(",", ".").split("."); const cents = BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, "0")); if (cents > 9223372036854775807n)
    throw new Error("El importe supera el límite admitido."); return cents.toString(); }
export function agingBucket(due: string, today: string): string { const days = Math.floor((Date.parse(today + "T00:00:00Z") - Date.parse(due + "T00:00:00Z")) / 86400000); return days <= 0 ? "Al día" : days <= 30 ? "1–30 días" : days <= 60 ? "31–60 días" : days <= 90 ? "61–90 días" : "Más de 90 días"; }
