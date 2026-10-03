/**
 * Contenedor de Papelera: arma las `deps` de sus casos de uso (un archivo por módulo,
 * sin contenedor central). Todo ocurre dentro de una transacción, así que las
 * `deps` son solo la unidad de trabajo; la conexión se abre al ejecutar, no al
 * cargar el archivo (`next build` importa las rutas sin variables de base de datos).
 */

import type { DepsPapelera } from "../../application/papelera/casos-de-uso";
import { unidadDeTrabajoDrizzle } from "../db/repos/compartido";
import { reposPapelera } from "../db/repos/papelera";

export function papeleraParaEscritura(): DepsPapelera {
  return { unidad: unidadDeTrabajoDrizzle(reposPapelera) };
}
