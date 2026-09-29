/**
 * M13 · Usuarios — edición y borrado lógico (`docs/F2_ANALISIS_Y_PLAN.md`
 * paso 4). Mismo patrón que `api/contactos/[id]/route.ts`.
 *
 * Sin `visibleRows`: `users` no tiene responsable por fila, así que se exige
 * alcance `all` (`requireFullScope`). Con `own`, un usuario alcanzaría su propia
 * fila y podría cambiarse el rol.
 */

import { and, count, eq, isNull, ne } from "drizzle-orm";
import { z } from "zod";
import { ConflictError, NotFoundError } from "@/domain/errors";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction, type Db } from "@/infrastructure/db/client";
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

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Sin otro admin activo, quitarle el rol o desactivar a este deja el CRM sin nadie que pueda administrarlo. */
async function exigirOtroAdminActivo(tx: Tx, id: number) {
  const [fila] = await tx
    .select({ total: count() })
    .from(users)
    .innerJoin(roles, eq(users.roleId, roles.id))
    .where(and(eq(roles.slug, "admin"), eq(users.isActive, true), isNull(users.deletedAt), ne(users.id, id)));
  if (!fila?.total) throw new ConflictError("Debe quedar al menos un administrador activo.");
}

async function esAdminActivo(tx: Tx, usuario: typeof users.$inferSelect) {
  if (!usuario.isActive || usuario.deletedAt) return false;
  const [rol] = await tx.select({ slug: roles.slug }).from(roles).where(eq(roles.id, usuario.roleId)).limit(1);
  return rol?.slug === "admin";
}

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
    requireFullScope(actor, "users", "edit");

    const usuario = await transaction(async (tx) => {
      const [anterior] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
      if (!anterior || anterior.deletedAt) throw new NotFoundError();

      let rolSlug: string | undefined;
      if (datos.roleId !== undefined) {
        const [rol] = await tx.select({ slug: roles.slug }).from(roles).where(eq(roles.id, datos.roleId)).limit(1);
        rolSlug = rol?.slug;
      }

      const dejaDeSerAdmin = (datos.roleId !== undefined && rolSlug !== "admin") || datos.isActive === false;
      if (dejaDeSerAdmin && (await esAdminActivo(tx, anterior))) await exigirOtroAdminActivo(tx, id);

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
    requireFullScope(actor, "users", "delete");

    await transaction(async (tx) => {
      const [anterior] = await tx.select().from(users).where(eq(users.id, id)).limit(1);
      if (!anterior || anterior.deletedAt) throw new NotFoundError();
      if (await esAdminActivo(tx, anterior)) await exigirOtroAdminActivo(tx, id);

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
