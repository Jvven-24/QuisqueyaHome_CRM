/**
 * M15 · Notificaciones — lectura y marcado de leídas (F4).
 *
 * Expone la campana del top-nav (`CrmHeader`) a notificaciones reales en base de datos.
 * Requiere sesión autenticada (`requireActor`).
 */

import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { notifications } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";

const PatchInput = z.object({
  id: z.coerce.number().int().positive().optional(),
});

export async function GET() {
  try {
    const actor = await requireActor();
    requireScope(actor, "dashboard", "view");
    const db = getDb();

    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, actor.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    const unreadCount = rows.filter((n) => !n.isRead).length;

    return Response.json({
      ok: true,
      notificaciones: rows,
      unreadCount,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "dashboard", "view");
    const datos = parseInput(
      PatchInput,
      await request.json().catch(() => ({})),
    );
    const db = getDb();

    if (datos.id) {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(notifications.id, datos.id),
            eq(notifications.userId, actor.userId),
          ),
        );
    } else {
      await db
        .update(notifications)
        .set({ isRead: true, readAt: new Date() })
        .where(eq(notifications.userId, actor.userId));
    }

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
