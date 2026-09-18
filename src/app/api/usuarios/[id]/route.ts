/**
 * M13 · Usuarios — edición y borrado lógico (`docs/F2_ANALISIS_Y_PLAN.md`
 * paso 4). Mismo patrón que `api/contactos/[id]/route.ts`.
 *
 * Sin `visibleRows`: no hay alcance `own` sobre `users` en el seed (solo el
 * administrador tiene permiso sobre este recurso) — un actor que llega aquí
 * ya puede ver cualquier usuario, no solo "los suyos".
 */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { brokerProfiles, roles, users } from "@/infrastructure/db/schema";
import { errorResponse, parseInput, vaciosANull } from "@/infrastructure/http";

const EditarUsuarioInput = z.object({
  fullName: z.string().min(1, "Escribe el nombre completo.").optional(),
  roleId: z.coerce.number().int().positive().optional(),
  jobTitle: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  specialty: z.string().nullable().optional(),
  handlesRentals: z.boolean().optional(),
  monthlyTargetDeals: z.coerce.number().int().nonnegative().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(
      EditarUsuarioInput,
      vaciosANull(await request.json().catch(() => ({})), ["jobTitle", "phone", "specialty"]),
    );
    const actor = await requireActor();
    requireScope(actor, "users", "edit");

    const usuario = await transaction(async (tx) => {
      const [anterior] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
      if (!anterior || anterior.deletedAt) throw new NotFoundError();

      let rolSlug: string | undefined;
      if (datos.roleId !== undefined) {
        const [rol] = await tx.select({ slug: roles.slug }).from(roles).where(eq(roles.id, datos.roleId)).limit(1);
        rolSlug = rol?.slug;
      }

      const cambios: Partial<typeof users.$inferInsert> = {};
      if (datos.fullName !== undefined) cambios.fullName = datos.fullName;
      if (datos.roleId !== undefined) cambios.roleId = datos.roleId;
      if ("jobTitle" in datos) cambios.jobTitle = datos.jobTitle;
      if ("phone" in datos) cambios.phone = datos.phone;
      if (datos.isActive !== undefined) cambios.isActive = datos.isActive;

      const [fila] = await tx.update(users).set(cambios).where(eq(users.id, id)).returning();

      // Perfil de broker: se actualiza si vino algún campo suyo, o se crea si
      // el usuario acaba de pasar a ser broker y todavía no tenía fila.
      if (datos.specialty !== undefined || datos.handlesRentals !== undefined || datos.monthlyTargetDeals !== undefined || rolSlug === "broker") {
        const [perfil] = await tx.select({ userId: brokerProfiles.userId }).from(brokerProfiles).where(eq(brokerProfiles.userId, id)).limit(1);
        const cambiosPerfil: Partial<typeof brokerProfiles.$inferInsert> = {};
        if ("specialty" in datos) cambiosPerfil.specialty = datos.specialty;
        if (datos.handlesRentals !== undefined) cambiosPerfil.handlesRentals = datos.handlesRentals;
        if (datos.monthlyTargetDeals !== undefined) cambiosPerfil.monthlyTargetDeals = datos.monthlyTargetDeals;

        if (perfil) {
          if (Object.keys(cambiosPerfil).length > 0) {
            await tx.update(brokerProfiles).set(cambiosPerfil).where(eq(brokerProfiles.userId, id));
          }
        } else if (rolSlug === "broker") {
          await tx.insert(brokerProfiles).values({ userId: id, ...cambiosPerfil });
        }
      }

      await auditar(tx, actor, { accion: "editar", entidad: "user", entidadId: id, antes: anterior, despues: fila });

      return fila;
    });

    return Response.json({ ok: true, usuario });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const actor = await requireActor();
    requireScope(actor, "users", "delete");

    await transaction(async (tx) => {
      const [anterior] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
      if (!anterior || anterior.deletedAt) throw new NotFoundError();

      const [fila] = await tx
        .update(users)
        .set({ deletedAt: new Date(), isActive: false })
        .where(eq(users.id, id))
        .returning();

      await auditar(tx, actor, { accion: "eliminar", entidad: "user", entidadId: id, antes: anterior, despues: fila });
    });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
