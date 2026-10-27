import { randomUUID } from "node:crypto";
import { ConflictError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { CambiosEtapa, Etapa, NuevaEtapa, ReposEtapas, RepositorioEtapas } from "./puertos.ts";
import { crearEtapaSchema, editarEtapaSchema } from "./entrada.ts";

export type DepsEtapas = { unidad: UnidadDeTrabajo<ReposEtapas> };
async function ordenar(repo: RepositorioEtapas, fila: Etapa, posicion: number) {
  const resto = (await repo.listar()).filter(e => e.id !== fila.id).sort((a, b) => a.position - b.position || a.id - b.id);
  resto.splice(Math.min(posicion - 1, resto.length), 0, fila);
  for (const [i, etapa] of resto.entries()) {
    if (etapa.position !== i + 1) await repo.actualizar(etapa.id, { position: i + 1 });
  }
}
export async function crearEtapa(deps: DepsEtapas, actor: Actor, entrada: Omit<NuevaEtapa, "slug">): Promise<Etapa> {
  const result = crearEtapaSchema.safeParse(entrada);
  if (!result.success) throw new ValidationError("Revisa los datos de la etapa.");
  return deps.unidad.ejecutar(async ({ etapas, auditoria }) => {
    await etapas.bloquearCatalogo();
    const datos = result.data;
    // Identidad técnica independiente del nombre; no colisiona con reglas del catálogo inicial.
    const fila = await etapas.crear({ slug: `etapa-${randomUUID()}`, name: datos.name, position: datos.position,
      kind: datos.kind, defaultProbability: datos.defaultProbability, isActive: datos.isActive });
    await ordenar(etapas, fila, datos.position);
    const actual = (await etapas.buscar(fila.id))!;
    await auditoria.registrar(actor, { accion: "crear", entidad: "pipeline_stage", entidadId: fila.id, despues: actual });
    return actual;
  });
}
export async function editarEtapa(deps: DepsEtapas, actor: Actor, id: number, entrada: CambiosEtapa): Promise<Etapa> {
  const result = editarEtapaSchema.safeParse(entrada);
  if (!result.success) throw new ValidationError("Revisa los datos de la etapa.");
  return deps.unidad.ejecutar(async ({ etapas, auditoria }) => {
    await etapas.bloquearCatalogo();
    const anterior = await etapas.buscar(id);
    if (!anterior) throw new NotFoundError();
    const datos = result.data;
    if (datos.kind !== undefined && datos.kind !== anterior.kind && await etapas.estaEnUso(id)) {
      throw new ConflictError("Esta etapa tiene negocios o historial. Crea otra etapa para cambiar su tipo sin alterar el pasado.");
    }
    const cambios: CambiosEtapa = {};
    if (datos.name !== undefined) cambios.name = datos.name;
    if (datos.position !== undefined) cambios.position = datos.position;
    if (datos.kind !== undefined) cambios.kind = datos.kind;
    if ("defaultProbability" in datos) cambios.defaultProbability = datos.defaultProbability;
    if (datos.isActive !== undefined) cambios.isActive = datos.isActive;
    const fila = await etapas.actualizar(id, cambios);
    if (datos.position !== undefined) await ordenar(etapas, fila, datos.position);
    const actual = (await etapas.buscar(id))!;
    await auditoria.registrar(actor, { accion: "editar", entidad: "pipeline_stage", entidadId: id, antes: anterior, despues: actual });
    return actual;
  });
}
