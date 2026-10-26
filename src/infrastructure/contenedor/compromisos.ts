/**
 * Contenedor de Compromisos: arma los adaptadores para la autoridad de inventario
 * y compromisos (M40 b1i3a / b2a).
 *
 * Sigue el patrón de los demás contenedores (un archivo por módulo, sin contenedor central).
 * Todo ocurre dentro de una transacción, así que las `deps` son solo la unidad de trabajo.
 */

import type { UnidadDeTrabajo } from "../../application/compartido/unidad-de-trabajo";
import type { ReposCompromisos } from "../../application/compromisos/puertos";
import { unidadDeTrabajoDrizzle } from "../db/repos/compartido";
import { reposCompromisos } from "../db/repos/compromisos";

export type DepsCompromisos = {
  unidad: UnidadDeTrabajo<ReposCompromisos>;
};

export function compromisosParaEscritura(): DepsCompromisos {
  return { unidad: unidadDeTrabajoDrizzle(reposCompromisos) };
}
