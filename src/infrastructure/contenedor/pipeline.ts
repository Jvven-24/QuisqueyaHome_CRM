/**
 * Contenedor de Pipeline: arma los adaptadores que usan sus rutas, siguiendo el
 * patrón de `contactos.ts` (un archivo por módulo, sin contenedor central).
 *
 * Todo Pipeline ocurre dentro de una transacción (incluidas las lecturas que
 * resuelven el contexto de la transición, como antes), así que las `deps` son
 * solo la unidad de trabajo: no hay un repositorio "suelto" sobre la conexión.
 * El módulo no importa la conexión aquí: la abre `unidadDeTrabajoDrizzle` al
 * ejecutar, no al cargar el archivo (`next build` importa las rutas sin
 * variables de base de datos).
 */

import type { DepsPipeline } from "../../application/pipeline/casos-de-uso";
import { unidadDeTrabajoDrizzle } from "../db/repos/compartido";
import { reposPipeline } from "../db/repos/pipeline";

export function pipelineParaEscritura(): DepsPipeline {
  return { unidad: unidadDeTrabajoDrizzle(reposPipeline) };
}
