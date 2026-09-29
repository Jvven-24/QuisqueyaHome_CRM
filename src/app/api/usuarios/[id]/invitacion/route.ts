/**
 * M13 · Usuarios — reenviar invitación (decisión #28). Repara el estado que
 * deja un alta cuyo `auth.admin.inviteUserByEmail` falló: el usuario existe
 * en el CRM (`auth_user_id` nulo) pero no puede entrar.
 *
 * Solo tiene sentido sobre un usuario que **todavía no aceptó** ninguna
 * invitación — uno con `auth_user_id` ya resuelto entra normalmente, y
 * reinvitarlo sería confuso (Supabase reenvía el correo de todas formas,
 * pero aquí se responde 409 para que la interfaz no ofrezca el botón sin
 * necesidad).
 */

import { eq } from "drizzle-orm";
import { ConflictError, NotFoundError } from "@/domain/errors";
import { requireFullScope } from "@/domain/rbac";
import { adminClient } from "@/infrastructure/auth/supabase";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema";
import { errorResponse } from "@/infrastructure/http";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const actor = await requireActor();
    requireFullScope(actor, "users", "edit");

    const db = getDb();
    const [usuario] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!usuario || usuario.deletedAt) throw new NotFoundError();
    if (usuario.authUserId) throw new ConflictError("Este usuario ya aceptó su invitación.");

    const { data, error } = await adminClient().auth.admin.inviteUserByEmail(usuario.email);
    if (error) throw error;
    if (data.user) {
      await db.update(users).set({ authUserId: data.user.id }).where(eq(users.id, id));
    }

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
