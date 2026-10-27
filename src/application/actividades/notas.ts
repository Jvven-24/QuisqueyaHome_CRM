import { z } from "zod";
import { ForbiddenError, NotFoundError } from "../../domain/errors.ts";
import { requireScope, scopeFor, type Actor } from "../../domain/rbac.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { Auditoria } from "../compartido/auditoria.ts";

export const contextoNotaSchema = z.object({ entidad: z.enum(["lead", "deal"]), entidadId: z.coerce.number().int().positive() });
export const textoNotaSchema = z.string().trim().min(1, "Escribe la nota.").max(10000, "La nota admite hasta 10000 caracteres.");
export type ContextoNota = z.infer<typeof contextoNotaSchema>;
export type Nota = { id: number; title: string; description: string | null; createdBy: number | null; author: string | null; createdAt: Date; updatedAt: Date };
export type ReferenciaNota = { contactId: number; leadId: number | null; dealId: number | null };
export interface RepositorioNotas {
  contextoVisible(actor: Actor, contexto: ContextoNota): Promise<ReferenciaNota | undefined>;
  listar(referencia: ReferenciaNota): Promise<Nota[]>;
  buscar(referencia: ReferenciaNota, id: number): Promise<Nota | undefined>;
  crear(referencia: ReferenciaNota, texto: string, actorId: number): Promise<Nota>;
  editar(id: number, texto: string, actorId: number): Promise<Nota>;
  borrar(id: number, actorId: number): Promise<void>;
}
export type ReposNotas = { notas: RepositorioNotas; auditoria: Auditoria };

export function puedeModificarNota(actor: Actor, nota: Pick<Nota, "createdBy">, accion: "edit" | "delete"): boolean {
  const scope = scopeFor(actor, "activities", accion);
  return scope === "all" || (scope !== "none" && nota.createdBy === actor.userId);
}

export async function leerNotas(repo: RepositorioNotas, actor: Actor, contexto: ContextoNota) {
  requireScope(actor, "activities", "view");
  const referencia = await repo.contextoVisible(actor, contexto);
  if (!referencia) throw new NotFoundError();
  const notas = await repo.listar(referencia);
  return { puedeCrear: scopeFor(actor, "activities", "create") !== "none", notas: notas.map(nota => ({ ...nota, puedeEditar: puedeModificarNota(actor, nota, "edit"), puedeBorrar: puedeModificarNota(actor, nota, "delete") })) };
}

export async function escribirNota(unidad: UnidadDeTrabajo<ReposNotas>, actor: Actor, contexto: ContextoNota, accion: "create" | "edit" | "delete", id?: number, texto?: string): Promise<void> {
  requireScope(actor, "activities", accion);
  const contenido = accion === "delete" ? "" : textoNotaSchema.parse(texto);
  await unidad.ejecutar(async ({ notas, auditoria }) => {
    const referencia = await notas.contextoVisible(actor, contexto);
    if (!referencia) throw new NotFoundError();
    const anterior = accion === "create" ? undefined : await notas.buscar(referencia, id!);
    if (accion !== "create" && !anterior) throw new NotFoundError();
    if (anterior && accion !== "create" && !puedeModificarNota(actor, anterior, accion)) throw new ForbiddenError("Solo el autor o un usuario con permiso global puede modificar esta nota.");
    if (accion === "delete") {
      await notas.borrar(id!, actor.userId);
      await auditoria.registrar(actor, { accion: "eliminar", entidad: "activity", entidadId: id!, antes: anterior });
    } else {
      const despues = accion === "create" ? await notas.crear(referencia, contenido, actor.userId) : await notas.editar(id!, contenido, actor.userId);
      await auditoria.registrar(actor, { accion: accion === "create" ? "crear" : "editar", entidad: "activity", entidadId: despues.id, antes: anterior, despues });
    }
  });
}
