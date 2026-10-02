/** Adaptador de Usuarios (`application/usuarios/puertos.ts`; R3.5; decisiones #28 y #41). */

import { and, count, eq, isNull, ne } from "drizzle-orm";
import type { RepositorioUsuarios, Rol, Usuario } from "../../../application/usuarios/puertos";
import type { Db } from "../client";
import { brokerProfiles, roles, users } from "../schema";
import { auditoriaDrizzle, type Tx } from "./compartido";

type Ejecutor = Pick<Tx | Db, "select" | "insert" | "update">;

export function repositorioUsuarios(ejecutor: Ejecutor): RepositorioUsuarios {
  return {
    async buscarActivoPorCorreo(email) {
      const [fila] = await ejecutor
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.email, email), isNull(users.deletedAt)))
        .limit(1);
      return fila;
    },
    async buscarRol(id): Promise<Rol | undefined> {
      const [fila] = await ejecutor
        .select()
        .from(roles)
        .where(eq(roles.id, id))
        .limit(1);
      return fila;
    },
    async crear(datos): Promise<Usuario> {
      const [fila] = await ejecutor
        .insert(users)
        .values({
          roleId: datos.roleId,
          authUserId: null,
          fullName: datos.fullName,
          email: datos.email,
          jobTitle: datos.jobTitle,
          phone: datos.phone,
          initials: datos.initials,
        })
        .returning();
      return fila!;
    },
    async crearPerfilBroker(datos) {
      await ejecutor
        .insert(brokerProfiles)
        .values({
          userId: datos.userId,
          specialty: datos.specialty,
          handlesRentals: datos.handlesRentals,
          level: datos.level,
          monthlyTargetDeals: datos.monthlyTargetDeals,
        });
    },
    async buscar(id) {
      const [fila] = await ejecutor
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return fila;
    },
    async contarOtrosAdminsActivos(id) {
      const [fila] = await ejecutor
        .select({ total: count() })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(
          and(
            eq(roles.slug, "admin"),
            eq(users.isActive, true),
            isNull(users.deletedAt),
            ne(users.id, id),
          ),
        );
      return fila?.total ?? 0;
    },
    async actualizar(id, cambios) {
      const set: Partial<typeof users.$inferInsert> = {};
      if (cambios.fullName !== undefined) set.fullName = cambios.fullName;
      if (cambios.roleId !== undefined) set.roleId = cambios.roleId;
      if ("jobTitle" in cambios) set.jobTitle = cambios.jobTitle;
      if ("phone" in cambios) set.phone = cambios.phone;
      if (cambios.isActive !== undefined) set.isActive = cambios.isActive;
      const [fila] = await ejecutor
        .update(users)
        .set(set)
        .where(eq(users.id, id))
        .returning();
      return fila!;
    },
    async buscarPerfilBroker(userId) {
      const [fila] = await ejecutor
        .select({ userId: brokerProfiles.userId })
        .from(brokerProfiles)
        .where(eq(brokerProfiles.userId, userId))
        .limit(1);
      return fila;
    },
    async actualizarPerfilBroker(userId, cambios) {
      const set: Partial<typeof brokerProfiles.$inferInsert> = {};
      if ("specialty" in cambios) set.specialty = cambios.specialty;
      if (cambios.handlesRentals !== undefined) set.handlesRentals = cambios.handlesRentals;
      if (cambios.monthlyTargetDeals !== undefined) set.monthlyTargetDeals = cambios.monthlyTargetDeals;
      await ejecutor
        .update(brokerProfiles)
        .set(set)
        .where(eq(brokerProfiles.userId, userId));
    },
    async marcarBorrado(id, cuando) {
      const [fila] = await ejecutor
        .update(users)
        .set({
          deletedAt: cuando,
          isActive: false,
        })
        .where(eq(users.id, id))
        .returning();
      return fila!;
    },
    async actualizarAuthUserId(id, authUserId) {
      await ejecutor
        .update(users)
        .set({ authUserId })
        .where(eq(users.id, id));
    },
    async esAdminActivo(usuario) {
      if (!usuario.isActive || usuario.deletedAt) return false;
      const [rol] = await ejecutor
        .select({ slug: roles.slug })
        .from(roles)
        .where(eq(roles.id, usuario.roleId))
        .limit(1);
      return rol?.slug === "admin";
    },
  };
}

export function reposUsuarios(tx: Tx) {
  return { usuarios: repositorioUsuarios(tx), auditoria: auditoriaDrizzle(tx) };
}
