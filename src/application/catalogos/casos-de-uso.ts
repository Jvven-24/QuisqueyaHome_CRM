/**
 * Casos de uso de Catálogos: alta y edición de una entrada de motivos de
 * pérdida o canales. Es el comportamiento que vivía en `api/catalogos/[tipo]/**`,
 * movido tal cual. Un solo juego de funciones para los dos tipos.
 */

import type { EntityType } from "../../domain/catalogs.ts";
import { NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { slugify } from "../../domain/slug.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { CambiosEntradaCatalogo, EntradaCatalogo, ReposCatalogos, TipoCatalogo } from "./puertos.ts";

export type DepsCatalogos = { unidad: UnidadDeTrabajo<ReposCatalogos> };

/** Entidad de auditoría de cada tipo. */
const ENTIDAD_CATALOGO: Record<TipoCatalogo, EntityType> = {
  "motivos-perdida": "loss_reason",
  canales: "lead_source",
};

/** `true` si `tipo` (lo que llega en la URL) es un catálogo conocido. */
export function esTipoCatalogo(tipo: string): tipo is TipoCatalogo {
  return Object.hasOwn(ENTIDAD_CATALOGO, tipo);
}

export type EntradaCrearCatalogo = { name: string; position?: number };

export async function crearEntradaCatalogo(
  deps: DepsCatalogos,
  actor: Actor,
  tipo: TipoCatalogo,
  entrada: EntradaCrearCatalogo,
): Promise<EntradaCatalogo> {
  return deps.unidad.ejecutar(async ({ catalogos, auditoria }) => {
    const base = slugify(entrada.name) || "elemento";
    // Mismo criterio que `api/proyectos/route.ts`: catálogos pequeños,
    // administrados por una sola persona a la vez, no hace falta más que
    // contar coincidencias dentro de la transacción.
    const existentes = await catalogos.slugsParecidos(tipo, base);
    const slug = existentes.length === 0 ? base : `${base}-${existentes.length + 1}`;

    const fila = await catalogos.crear(tipo, { slug, name: entrada.name, position: entrada.position ?? 0 });

    await auditoria.registrar(actor, { accion: "crear", entidad: ENTIDAD_CATALOGO[tipo], entidadId: fila.id, despues: fila });

    return fila;
  });
}

export async function editarEntradaCatalogo(
  deps: DepsCatalogos,
  actor: Actor,
  tipo: TipoCatalogo,
  id: number,
  entrada: CambiosEntradaCatalogo,
): Promise<EntradaCatalogo> {
  return deps.unidad.ejecutar(async ({ catalogos, auditoria }) => {
    const anterior = await catalogos.buscar(tipo, id);
    if (!anterior) throw new NotFoundError();

    const cambios: CambiosEntradaCatalogo = {};
    if (entrada.name !== undefined) cambios.name = entrada.name;
    if (entrada.position !== undefined) cambios.position = entrada.position;
    if (entrada.isActive !== undefined) cambios.isActive = entrada.isActive;

    const fila = await catalogos.actualizar(tipo, id, cambios);

    await auditoria.registrar(actor, { accion: "editar", entidad: ENTIDAD_CATALOGO[tipo], entidadId: id, antes: anterior, despues: fila });

    return fila;
  });
}
