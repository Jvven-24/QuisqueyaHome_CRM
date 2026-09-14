/**
 * Conversión de fecha a America/Santo_Domingo (issue #24 · decisión #24 de F2
 * adelantada). `docs/contexto/decisiones.md` §20.1: todo se guarda en UTC, la
 * conversión a hora local ocurre en la aplicación — el cierre transaccional
 * (`app/api/pipeline/[id]/etapa/_cierre.ts`) usaba la hora del servidor sin
 * convertir, así que en un VPS en UTC un cierre nocturno contaba en el día (o
 * el mes) siguiente.
 *
 * Sin librería de fechas: `Intl.DateTimeFormat` ya resuelve el offset de la
 * zona (`America/Santo_Domingo` no tiene horario de verano, pero esto sigue
 * siendo correcto si algún día lo tuviera), y la localización `"en-CA"`
 * devuelve `YYYY-MM-DD` directo, sin reordenar nada a mano.
 */
export function fechaSantoDomingo(fecha: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santo_Domingo" }).format(fecha);
}

/**
 * Hora local `HH:MM` de un instante (M4 · Agenda). Mismo `Intl` que
 * `fechaSantoDomingo`, sin librería.
 */
export function horaSantoDomingo(fecha: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Santo_Domingo",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(fecha);
}

/**
 * Instante UTC de la medianoche de `fechaISO` (`YYYY-MM-DD`) en
 * America/Santo_Domingo (M4 · Agenda). Como la zona es siempre UTC-4 (sin
 * horario de verano — ver `fechaSantoDomingo`), la medianoche local es
 * literalmente `T00:00:00-04:00`: no hace falta resolver el offset con
 * `Intl`, escribirlo alcanza.
 */
export function medianocheSantoDomingo(fechaISO: string): Date {
  return new Date(`${fechaISO}T00:00:00-04:00`);
}

/**
 * Lunes (`YYYY-MM-DD`) de la semana que contiene `fechaISO` (M4 · Agenda).
 * Aritmética de calendario pura: no convierte zona horaria, solo cuenta días
 * hacia atrás hasta el lunes — por eso construye la fecha en UTC en vez de
 * con el constructor local de `Date`, que dependería de la zona del proceso.
 */
export function lunesDeLaSemana(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio!, mes! - 1, dia));
  const diaSemana = fecha.getUTCDay(); // 0 = domingo … 6 = sábado
  const diasDesdeElLunes = (diaSemana + 6) % 7;
  fecha.setUTCDate(fecha.getUTCDate() - diasDesdeElLunes);
  return fecha.toISOString().slice(0, 10);
}

/** `fechaISO` más `dias` días (M4 · Agenda), misma aritmética de calendario. */
export function sumarDias(fechaISO: string, dias: number): string {
  const [anio, mes, dia] = fechaISO.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio!, mes! - 1, dia! + dias));
  return fecha.toISOString().slice(0, 10);
}
