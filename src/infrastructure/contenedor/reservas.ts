/**
 * Contenedor de Reservas: arma los adaptadores para la autoridad de reservas (M40 b2b).
 *
 * Sigue el patrón de los demás contenedores (un archivo por módulo, sin contenedor central).
 * Todo ocurre dentro de una transacción, así que las `deps` son solo la unidad de trabajo.
 */

import type { UnidadDeTrabajo } from "../../application/compartido/unidad-de-trabajo";
import type { ReposReservas } from "../../application/reservas/puertos";
import { unidadDeTrabajoDrizzle } from "../db/repos/compartido";
import { reposReservas } from "../db/repos/reservas";

export type DepsReservas = {
  unidad: UnidadDeTrabajo<ReposReservas>;
};

export function reservasParaEscritura(): DepsReservas {
  return { unidad: unidadDeTrabajoDrizzle(reposReservas) };
}
