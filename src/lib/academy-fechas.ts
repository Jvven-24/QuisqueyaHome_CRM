const zonaAcademy = "America/Santo_Domingo";

/** Partes numéricas: evita depender de separadores y espacios de la versión de ICU. */
function partes(fecha: Date, timeZone: string) {
  return Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(fecha).map(({ type, value }) => [type, value]));
}

export function fechaEmisionAcademy(fecha: Date): string {
  const p = partes(fecha, zonaAcademy);
  return `${Number(p.day)}/${Number(p.month)}/${p.year}`;
}

/** La regla de vencimiento suma meses en UTC; conservar su día de calendario. */
export function fechaVencimientoAcademy(fecha: Date): string {
  const p = partes(fecha, "UTC");
  return `${p.day}/${p.month}/${p.year}`;
}

export function horaSincronizacionAcademy(fecha: Date): string {
  const p = partes(fecha, zonaAcademy);
  const hora = Number(p.hour);
  return `${String(hora % 12 || 12).padStart(2, "0")}:${p.minute} ${hora < 12 ? "a." : "p."}\u00a0m.`;
}
