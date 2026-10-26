/**
 * Contrato de los dobles en memoria que participan en una transacción simulada.
 *
 * Existe para que `unidadDeTrabajoEnMemoria` pueda deshacer lo escrito cuando el
 * callback lanza: sin una instantánea que restaurar, una prueba de "si falla, no
 * queda nada" pasaría siempre, porque el doble no tendría cómo dejar algo.
 */
export interface Reversible {
  /** Toma una instantánea y devuelve la función que la restaura. */
  instantanea(): () => void;
}
