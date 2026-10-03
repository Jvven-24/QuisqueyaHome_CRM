/**
 * Acceso Rápido de Demostración Local (solo desarrollo).
 *
 * Permite alternar de rol y verificar la navegación y permisos del CRM
 * sin depender de un servidor externo de Auth.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getEvaluationActor } from "@/infrastructure/auth/actor";
import { evaluationLoginAllowed } from "@/infrastructure/env";

const input = z.object({ role: z.string().min(1).max(64) }).strict();

export async function POST(request: Request) {
  if (!evaluationLoginAllowed(request.headers.get("host"))) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  try {
    const parsed = input.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
    }
    const actor = await getEvaluationActor(parsed.data.role);
    if (!actor) {
      return NextResponse.json({ error: "Rol de evaluación no disponible." }, { status: 400 });
    }
    const roleSlug = actor.roleSlug;

    const cookieStore = await cookies();
    cookieStore.set("qh_dev_role", roleSlug, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      httpOnly: true,
      sameSite: "lax",
    });

    return NextResponse.json({ ok: true, role: roleSlug });
  } catch {
    return NextResponse.json({ error: "No se pudo iniciar la evaluación." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!evaluationLoginAllowed(request.headers.get("host"))) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }
  const cookieStore = await cookies();
  cookieStore.delete("qh_dev_role");
  return NextResponse.json({ ok: true });
}
