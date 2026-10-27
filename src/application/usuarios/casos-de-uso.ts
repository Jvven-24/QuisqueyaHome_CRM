/** Casos de uso de Usuarios (`docs/R_ANALISIS_Y_PLAN.md` §7 R3.5; decisión #28). */

import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors.ts";
import { BROKER_LEVELS } from "../../domain/catalogs.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import type { AdminAuth } from "../compartido/admin-auth.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { EntradaCrearUsuario, EntradaEditarUsuario, RepositorioUsuarios, ReposUsuarios, Usuario } from "./puertos.ts";

export async function crearUsuario(
  deps: { usuarios: RepositorioUsuarios; unidad: UnidadDeTrabajo<ReposUsuarios>; adminAuth: AdminAuth },
  actor: Actor,
  entrada: EntradaCrearUsuario,
): Promise<{ usuario: Usuario; invitado: boolean; motivoError?: string }> {
  const existente = await deps.usuarios.buscarActivoPorCorreo(entrada.email);
  if (existente) throw new ConflictError("Ya existe un usuario activo con ese correo.");
  const rol = await deps.usuarios.buscarRol(entrada.roleId);
  if (!rol) throw new ConflictError("El rol indicado no existe.");

  const usuario = await deps.unidad.ejecutar(async ({ usuarios, auditoria }) => {
    const fila = await usuarios.crear({
      roleId: rol.id,
      fullName: entrada.fullName,
      email: entrada.email,
      jobTitle: entrada.jobTitle ?? null,
      phone: entrada.phone ?? null,
      initials: entrada.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
    });
    if (rol.slug === "broker") {
      await usuarios.crearPerfilBroker({
        userId: fila.id,
        specialty: entrada.specialty ?? null,
        handlesRentals: entrada.handlesRentals ?? false,
        level: BROKER_LEVELS[0],
        monthlyTargetDeals: entrada.monthlyTargetDeals ?? 0,
      });
    }
    await auditoria.registrar(actor, { accion: "crear", entidad: "user", entidadId: fila.id, despues: fila });
    return fila;
  });

  let invitado = true;
  let motivoError: string | undefined;
  try {
    const authUserId = await deps.adminAuth.invitarPorCorreo(entrada.email);
    if (authUserId) await deps.usuarios.actualizarAuthUserId(usuario.id, authUserId);
  } catch (error) {
    invitado = false;
    motivoError = error instanceof Error ? error.message : "No se pudo enviar la invitación.";
  }
  return { usuario, invitado, motivoError };
}

export async function editarUsuario(
  deps: { unidad: UnidadDeTrabajo<ReposUsuarios> },
  actor: Actor,
  alcance: PermissionScope,
  id: number,
  entrada: EntradaEditarUsuario,
): Promise<Usuario> {
  if (alcance !== "all") throw new ForbiddenError("Solo un alcance total permite edit sobre users.");
  return deps.unidad.ejecutar(async ({ usuarios, auditoria }) => {
    const anterior = await usuarios.buscar(id);
    if (!anterior || anterior.deletedAt) throw new NotFoundError();
    let rolSlug: string | undefined;
    if (entrada.roleId !== undefined) rolSlug = (await usuarios.buscarRol(entrada.roleId))?.slug;
    const dejaDeSerAdmin = (entrada.roleId !== undefined && rolSlug !== "admin") || entrada.isActive === false;
    if (dejaDeSerAdmin && (await usuarios.esAdminActivo(anterior))) {
      // Protección de auditoría del 29/09/2026: debe quedar otro administrador
      // activo antes de editar; quitarla puede dejar el CRM sin quien administre.
      const total = await usuarios.contarOtrosAdminsActivos(id);
      if (!total) {
        throw new ConflictError("Debe quedar al menos un administrador activo.");
      }
    }
    const fila = await usuarios.actualizar(id, entrada);
    if (entrada.specialty !== undefined || entrada.handlesRentals !== undefined || entrada.monthlyTargetDeals !== undefined || rolSlug === "broker") {
      const perfil = await usuarios.buscarPerfilBroker(id);
      const cambios: { specialty?: string | null; handlesRentals?: boolean; monthlyTargetDeals?: number } = {};
      if ("specialty" in entrada) cambios.specialty = entrada.specialty;
      if (entrada.handlesRentals !== undefined) cambios.handlesRentals = entrada.handlesRentals;
      if (entrada.monthlyTargetDeals !== undefined) cambios.monthlyTargetDeals = entrada.monthlyTargetDeals;
      if (perfil) {
        if (Object.keys(cambios).length > 0) await usuarios.actualizarPerfilBroker(id, cambios);
      } else if (rolSlug === "broker") {
        await usuarios.crearPerfilBroker({ userId: id, specialty: entrada.specialty ?? null, handlesRentals: entrada.handlesRentals ?? false, level: BROKER_LEVELS[0], monthlyTargetDeals: entrada.monthlyTargetDeals ?? 0 });
      }
    }
    await auditoria.registrar(actor, { accion: "editar", entidad: "user", entidadId: id, antes: anterior, despues: fila });
    return fila;
  });
}

export async function borrarUsuario(
  deps: { unidad: UnidadDeTrabajo<ReposUsuarios> },
  actor: Actor,
  alcance: PermissionScope,
  id: number,
): Promise<void> {
  if (alcance !== "all") throw new ForbiddenError("Solo un alcance total permite delete sobre users.");
  await deps.unidad.ejecutar(async ({ usuarios, auditoria }) => {
    const anterior = await usuarios.buscar(id);
    if (!anterior || anterior.deletedAt) throw new NotFoundError();
    if (await usuarios.esAdminActivo(anterior)) {
      // La misma guarda se ejecuta antes del borrado: sin ella nadie podría
      // volver a administrar el CRM si se elimina su último administrador.
      const total = await usuarios.contarOtrosAdminsActivos(id);
      if (!total) {
        throw new ConflictError("Debe quedar al menos un administrador activo.");
      }
    }
    const fila = await usuarios.marcarBorrado(id, new Date());
    await auditoria.registrar(actor, { accion: "eliminar", entidad: "user", entidadId: id, antes: anterior, despues: fila });
  });
}

export async function reenviarInvitacion(
  deps: { usuarios: RepositorioUsuarios; adminAuth: AdminAuth },
  id: number,
): Promise<void> {
  const usuario = await deps.usuarios.buscar(id);
  if (!usuario || usuario.deletedAt) throw new NotFoundError();
  if (usuario.authUserId) throw new ConflictError("Este usuario ya aceptó su invitación.");
  const authUserId = await deps.adminAuth.invitarPorCorreo(usuario.email);
  if (authUserId) await deps.usuarios.actualizarAuthUserId(id, authUserId);
}
