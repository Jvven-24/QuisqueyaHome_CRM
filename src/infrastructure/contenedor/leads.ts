/**
 * Contenedor de Leads: arma los adaptadores que usan sus rutas, siguiendo el
 * patrón de `contactos.ts` (un archivo por módulo, sin contenedor central).
 *
 * `getDb()` se llama **dentro** de la fábrica, no al cargar el módulo:
 * `next build` importa todas las rutas para descubrirlas y ahí todavía no hay
 * variables de base de datos.
 */

import type { DepsLeads } from "../../application/leads/casos-de-uso";
import { getDb } from "../db/client";
import { unidadDeTrabajoDrizzle } from "../db/repos/compartido";
import { repositorioLeads, reposLeads } from "../db/repos/leads";

export function leadsParaEscritura(): DepsLeads {
  return {
    // Suelto sobre la conexión: solo lo usan las lecturas previas (duplicados,
    // contacto, candidatos a broker), que van fuera de la transacción.
    leads: repositorioLeads(getDb()),
    unidad: unidadDeTrabajoDrizzle(reposLeads),
  };
}
