/**
 * Puerto de almacenamiento de archivos (fotos de obra).
 *
 * La subida es una llamada de red aparte: no puede meterse dentro del `BEGIN` de
 * Postgres. Por eso el puerto queda **fuera** de la unidad de trabajo y el caso
 * de uso es quien compensa: si el `INSERT` en `files` falla después de subir,
 * llama a `borrar` con las rutas ya subidas. De ahí que `borrar` sea de mejor
 * esfuerzo y nunca lance: un fallo al limpiar no debe tapar el error real que ya
 * se va a responder.
 *
 * La ruta la compone el caso de uso a partir de datos validados (ids y la
 * extensión del MIME), nunca del nombre que manda el cliente: ese nombre solo
 * sirve para el mensaje de error.
 */

export type ArchivoASubir = {
  /** Ruta del objeto dentro del bucket. La compone el caso de uso, nunca el cliente. */
  ruta: string;
  contenido: Blob;
  tipoMime: string;
  /** Nombre que escribió el usuario. Solo para el mensaje de error. */
  nombreVisible: string;
};

export interface AlmacenamientoArchivos {
  /** Lanza ConflictError con el mensaje `No se pudo subir "<nombreVisible>": <motivo>`. */
  subir(archivo: ArchivoASubir): Promise<void>;
  /** Mejor esfuerzo: nunca lanza, ni con rutas inexistentes. */
  borrar(rutas: readonly string[]): Promise<void>;
  /** Una entrada por ruta, en el mismo orden; `null` donde no se pudo firmar. Lanza ConflictError si falla la llamada entera. */
  urlsFirmadas(rutas: readonly string[], segundosDeVida: number): Promise<(string | null)[]>;
}
