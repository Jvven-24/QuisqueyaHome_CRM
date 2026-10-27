/**
 * Casos de uso de M8 por alcance: metas de proyecto/equipo, equipos y regla
 * versionada de atribución. Todos exigen alcance `all` de `goals:edit`
 * (Administrador): son decisiones de la compañía, no de un broker.
 */
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import { leerConfigAtribucion, siguienteVersion, slugEquipo } from "../../domain/metas-alcances.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { Equipo, MetaAlcance, ReglaAtribucion, ReposMetasAlcance } from "./alcances-puertos.ts";
import {
  EliminarMetaAlcanceInput,
  FijarMetaAlcanceInput,
  GuardarEquipoInput,
  PublicarReglaInput,
  type EntradaEquipo,
  type EntradaMetaAlcance,
  type EntradaRegla,
} from "./alcances-validacion.ts";
import type { z } from "zod";

export type DepsMetasAlcance = { unidad: UnidadDeTrabajo<ReposMetasAlcance>; ahora?: () => Date };

function soloCompania(alcance: PermissionScope): void {
  if (alcance !== "all") throw new ForbiddenError("Solo la administración puede gestionar esta configuración de metas.");
}

function validar<T>(esquema: z.ZodType<T>, entrada: unknown): T {
  const r = esquema.safeParse(entrada);
  if (r.success) return r.data;
  const fields: Record<string, string> = {};
  for (const issue of r.error.issues) fields[String(issue.path[0] ?? "_")] ??= issue.message;
  throw new ValidationError("Revisa los campos.", fields);
}

export async function fijarMetaAlcance(deps: DepsMetasAlcance, actor: Actor, alcance: PermissionScope, entrada: EntradaMetaAlcance): Promise<MetaAlcance> {
  soloCompania(alcance);
  const datos = validar(FijarMetaAlcanceInput, entrada);
  return deps.unidad.ejecutar(async ({ alcances, auditoria }) => {
    if (!(await alcances.existeAlcance(datos.scopeType, datos.scopeId))) {
      throw new NotFoundError(datos.scopeType === "project" ? "El proyecto no existe." : "El equipo no existe o está inactivo.");
    }
    const { anterior, meta } = await alcances.fijarMetaAlcance({
      scopeType: datos.scopeType,
      scopeId: datos.scopeId,
      year: datos.year,
      month: datos.month,
      targetDeals: datos.targetDeals,
      targetAmountCents: datos.targetAmountCents ?? null,
      currency: datos.currency,
      actorId: actor.userId,
    });
    await auditoria.registrar(actor, { accion: anterior ? "editar" : "crear", entidad: "scoped_goal", entidadId: meta.id, antes: anterior, despues: meta });
    return meta;
  });
}

export async function eliminarMetaAlcance(deps: DepsMetasAlcance, actor: Actor, alcance: PermissionScope, entrada: { id: number }): Promise<void> {
  soloCompania(alcance);
  const { id } = validar(EliminarMetaAlcanceInput, entrada);
  await deps.unidad.ejecutar(async ({ alcances, auditoria }) => {
    const borrada = await alcances.eliminarMetaAlcance(id);
    if (!borrada) throw new NotFoundError("La meta ya no existe.");
    await auditoria.registrar(actor, { accion: "eliminar", entidad: "scoped_goal", entidadId: id, antes: borrada });
  });
}

export async function guardarEquipo(deps: DepsMetasAlcance, actor: Actor, alcance: PermissionScope, entrada: EntradaEquipo): Promise<Equipo> {
  soloCompania(alcance);
  const datos = validar(GuardarEquipoInput, entrada);
  const miembros = [...new Set(datos.memberIds)];
  const leaderId = datos.leaderId ?? null;
  if (leaderId != null && !miembros.includes(leaderId)) miembros.push(leaderId);
  const slug = slugEquipo(datos.name);
  if (!slug) throw new ValidationError("Revisa los campos.", { name: "El nombre debe tener letras o números." });
  return deps.unidad.ejecutar(async ({ alcances, auditoria }) => {
    const anterior = datos.id != null ? await alcances.buscarEquipo(datos.id) : undefined;
    if (datos.id != null && !anterior) throw new NotFoundError("El equipo no existe.");
    if (await alcances.existeSlugEquipo(slug, datos.id)) throw new ConflictError("Ya existe un equipo con ese nombre.");
    const invalidos = await alcances.noBrokers(miembros);
    if (invalidos.length) throw new ValidationError("Revisa los campos.", { memberIds: "Solo se pueden agregar usuarios con perfil de broker." });
    const equipo = await alcances.guardarEquipo({ ...(datos.id != null ? { id: datos.id } : {}), name: datos.name, slug, leaderId, memberIds: miembros, actorId: actor.userId });
    await auditoria.registrar(actor, { accion: anterior ? "editar" : "crear", entidad: "team", entidadId: equipo.id, antes: anterior, despues: equipo });
    return equipo;
  });
}

export async function publicarReglaAtribucion(deps: DepsMetasAlcance, actor: Actor, alcance: PermissionScope, entrada: EntradaRegla): Promise<ReglaAtribucion> {
  soloCompania(alcance);
  const datos = validar(PublicarReglaInput, entrada);
  const cuando = deps.ahora?.() ?? new Date();
  return deps.unidad.ejecutar(async ({ alcances, auditoria }) => {
    const version = siguienteVersion(await alcances.versionesDeRegla());
    const { anterior, regla } = await alcances.publicarRegla({
      version,
      scope: datos.scope,
      rule: datos.rule,
      config: leerConfigAtribucion({ equipo: datos.equipo }),
      actorId: actor.userId,
      cuando,
    });
    await auditoria.registrar(actor, { accion: "crear", entidad: "attribution_rule", entidadId: regla.id, antes: anterior, despues: regla });
    return regla;
  });
}
