/**
 * Estado visible del outbox (solo lectura) y su descripción para la UI.
 * Puro: ni base de datos ni React. La consulta real vive en
 * `infrastructure/integraciones/outbox/estado.ts`.
 */

export type EstadoOutbox = {
  pendientes: number;
  enviados: number;
  /** Eventos que agotaron reintentos (`dead_at` no nulo). */
  fallidos: number;
  /**
   * Pendientes cuyo tipo no tiene consumidor registrado. No se reclaman, no se reintentan
   * ni van a la cola muerta: esperan a que su módulo registre el manejador. Subconjunto de `pendientes`.
   */
  sinConsumidor: number;
  ultimoEnviadoAt: Date | null;
};

const formato = new Intl.DateTimeFormat("es-DO", {
  timeZone: "America/Santo_Domingo",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** Comando que dispara el worker; no hay proceso en segundo plano ni cron. */
export const COMANDO_WORKER_OUTBOX = "npm run outbox:worker";

/** Texto honesto de la tarjeta: solo hechos medidos, sin afirmar que haya un worker corriendo. */
export function describirEstadoOutbox(estado: EstadoOutbox | null): string {
  const worker = `Worker manual: ejecuta "${COMANDO_WORKER_OUTBOX}" (no hay proceso en segundo plano).`;
  if (!estado) return `${worker} Estado de la cola no disponible.`;
  const ultimo = estado.ultimoEnviadoAt ? formato.format(estado.ultimoEnviadoAt) : "nunca";
  const base = `${worker} Pendientes: ${estado.pendientes} · enviados: ${estado.enviados} · fallidos: ${estado.fallidos} · último procesado: ${ultimo} · sin consumidor: ${estado.sinConsumidor}.`;
  return estado.sinConsumidor > 0
    ? `${base} Los eventos sin consumidor siguen pendientes e intactos hasta que su módulo registre un manejador.`
    : base;
}
