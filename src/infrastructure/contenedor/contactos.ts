/**
 * Contenedor de Contactos: arma los adaptadores que usan sus rutas y su página,
 * siguiendo el patrón de `compartido.ts` (un archivo por módulo, sin contenedor
 * central).
 *
 * `getDb()` se llama **dentro** de las fábricas, no al cargar el módulo:
 * `next build` importa todas las rutas para descubrirlas y ahí todavía no hay
 * variables de base de datos.
 */

import type { UnidadDeTrabajo } from "../../application/compartido/unidad-de-trabajo";
import type { LecturaContactos, RepositorioContactos, ReposContactos } from "../../application/contactos/puertos";
import { getDb } from "../db/client";
import { lecturaContactos, repositorioContactos, reposContactos } from "../db/repos/contactos";
import { unidadDeTrabajoDrizzle } from "../db/repos/compartido";

export function contactosParaEscritura(): { contactos: RepositorioContactos; unidad: UnidadDeTrabajo<ReposContactos> } {
  return {
    // Suelto sobre la conexión: solo lo usa la detección de duplicados, que va
    // fuera de la transacción.
    contactos: repositorioContactos(getDb()),
    unidad: unidadDeTrabajoDrizzle(reposContactos),
  };
}

export function contactosParaLectura(): LecturaContactos {
  return lecturaContactos(getDb());
}
