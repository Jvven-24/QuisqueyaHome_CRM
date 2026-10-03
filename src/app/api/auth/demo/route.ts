/**
 * Acceso Rápido de Demostración Local (solo desarrollo).
 *
 * Permite alternar de rol y verificar la navegación y permisos del CRM
 * sin depender de un servidor externo de Auth.
 */

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { role } = await request.json().catch(() => ({}));
    const roleSlug = ["admin", "broker", "assistant"].includes(role) ? role : "admin";

    const cookieStore = await cookies();
    cookieStore.set("qh_dev_role", roleSlug, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      httpOnly: false,
      sameSite: "lax",
    });

    return NextResponse.json({ ok: true, role: roleSlug });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("qh_dev_role");
  return NextResponse.json({ ok: true });
}
