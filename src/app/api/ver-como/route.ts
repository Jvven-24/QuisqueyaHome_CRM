import { z } from "zod";
import { cookies } from "next/headers";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { ForbiddenError, UnauthorizedError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { brokerPreview, getAuthenticatedActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { scopeCondition } from "@/infrastructure/rbac-filter";
import { roles, users } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";

async function operator() {
  const actor = await getAuthenticatedActor();
  if (!actor) throw new UnauthorizedError();
  requireScope(actor, "brokers", "view");
  if (!["admin", "manager"].includes(actor.roleSlug)) throw new ForbiddenError("Esta vista requiere administrador o gerente.");
  return actor;
}

export async function GET() {
  try {
    const actor = await operator();
    const scope = requireScope(actor, "brokers", "view");
    const brokers = await getDb().select({ id: users.id, name: users.fullName }).from(users).innerJoin(roles, eq(roles.id, users.roleId))
      .where(and(eq(roles.slug, "broker"), eq(users.isActive, true), isNull(users.deletedAt), scopeCondition(actor, scope, users.id), actor.roleSlug === "manager" ? inArray(users.id, [actor.userId, ...(actor.teamUserIds ?? [])]) : undefined)).orderBy(users.fullName);
    return Response.json({ ok: true, brokers });
  } catch (error) { return errorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const actor = await operator();
    const { brokerId } = parseInput(z.object({ brokerId: z.number().int().positive().max(2147483647) }).strict(), await request.json().catch(() => ({})));
    await brokerPreview(actor, brokerId);
    (await cookies()).set("qh_view_as", String(brokerId), { httpOnly: true, sameSite: "strict", path: "/" });
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}

export async function DELETE() {
  try {
    if (!await getAuthenticatedActor()) throw new UnauthorizedError();
    (await cookies()).delete("qh_view_as");
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
