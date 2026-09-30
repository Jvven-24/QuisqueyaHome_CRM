/**
 * Puerto de transacción: la unidad de trabajo.
 *
 * El caso de uso no recibe un `tx` de Drizzle ni abre transacciones por su
 * cuenta: recibe, dentro del callback, el juego de repositorios `R` **ya ligado
 * a la transacción abierta**. Así no puede escribir fuera de ella por descuido
 * (un repositorio "suelto" usaría otra conexión y el cambio quedaría a medias) y
 * tampoco conoce el tipo de Drizzle, que le está vetado a `application/`.
 *
 * Todo o nada: si `fn` lanza, no queda nada escrito, y el error original se
 * propaga tal cual. Es la garantía que necesitan operaciones como el cierre de
 * negocio de ocho pasos, donde un fallo parcial no da error: deja metas y
 * comisiones incorrectas en silencio.
 */
export interface UnidadDeTrabajo<R> {
  ejecutar<T>(fn: (repos: R) => Promise<T>): Promise<T>;
}
