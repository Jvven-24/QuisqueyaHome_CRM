/**
 * M15 · Notificaciones — lectura y marcado de leídas (F4).
 *
 * Expone la campana del top-nav (`CrmHeader`) a notificaciones reales en base de datos.
 * Requiere sesión autenticada (`requireActor`).
 */

import { desc, eq } from "drizzle-orm";
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

    let rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, actor.userId))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    // Si el usuario aún no tiene notificaciones, poblar 3 de bienvenida operativas
    if (rows.length === 0) {
      const semillas = [
        {
          userId: actor.userId,
          notificationType: "lead_assigned",
          title: "Nuevo Lead desde Portal Web",
          body: "Elena Ramirez asignada a tu cartera · Interés en Araya Punta Cana",
          entityType: "lead" as const,
          isRead: false,
        },
        {
          userId: actor.userId,
          notificationType: "meeting_scheduled",
          title: "Cita programada hoy",
          body: "Reunión virtual con comprador internacional a las 4:00 PM",
          entityType: "activity" as const,
          isRead: false,
        },
        {
          userId: actor.userId,
          notificationType: "construction_update",
          title: "Actualización de obra",
          body: "Fase 3 validada por ingeniería en Bávaro Beach Lofts",
          entityType: "project" as const,
          isRead: false,
        },
      ];

      await db.insert(notifications).values(semillas);

      rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, actor.userId))
        .orderBy(desc(notifications.createdAt))
        .limit(20);
    }

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
        .where(eq(notifications.id, datos.id));
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
