/**
 * Contenedor de Metas: arma las `deps` de sus casos de uso (un archivo por módulo,
 * sin contenedor central). Todo ocurre dentro de una transacción, así que las
 * `deps` son solo la unidad de trabajo; la conexión se abre al ejecutar, no al
 * cargar el archivo (`next build` importa las rutas sin variables de base de datos).
 */

import type { DepsMetas } from "../../application/metas/casos-de-uso";
import { unidadDeTrabajoDrizzle } from "../db/repos/compartido";
import { reposMetas } from "../db/repos/metas";

export function metasParaEscritura(): DepsMetas {
  return { unidad: unidadDeTrabajoDrizzle(reposMetas) };
}
