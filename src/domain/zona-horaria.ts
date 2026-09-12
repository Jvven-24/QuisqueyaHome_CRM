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
