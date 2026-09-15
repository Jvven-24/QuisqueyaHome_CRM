/**
 * M13 · Usuarios — alta con invitación (`docs/F2_ANALISIS_Y_PLAN.md` paso 4,
 * decisión #28).
 *
 * El esquema ya lo previó: `users.auth_user_id` nace nulo "mientras el
 * usuario existe en el CRM pero aún no ha sido invitado". Dos pasos, no uno:
 *
 *  1. `INSERT` en `users` (y en `broker_profiles` si el rol es broker),
 *     transaccional y auditado — igual que cualquier alta de F1/F2.
 *  2. Fuera de la transacción, `auth.admin.inviteUserByEmail`. Si falla (SMTP
 *     caído, límite de Supabase), el usuario queda creado en el CRM sin poder
 *     entrar — un estado reparable con `POST .../invitacion` — en vez de
 *     revertir el alta y perder los datos que el administrador ya escribió.
 */

import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { ConflictError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { BROKER_LEVELS } from "@/domain/catalogs";
import { adminClient } from "@/infrastructure/auth/supabase";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { getDb, transaction } from "@/infrastructure/db/client";
import { brokerProfiles, roles, users } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";

const CrearUsuarioInput = z.object({
  fullName: z.string({ error: "Escribe el nombre completo." }).min(1, "Escribe el nombre completo."),
  email: z.email("Escribe un correo válido."),
  roleId: z.coerce.number().int().positive(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
  // Perfil de broker (§4.3): solo aplica si el rol elegido es "broker" — se
  // ignora si no, en vez de rechazar el campo cuando llega vacío del formulario.
  specialty: z.string().optional(),
  handlesRentals: z.coerce.boolean().optional(),
  monthlyTargetDeals: z.coerce.number().int().nonnegative().optional(),
});

function limpiarVacios(cuerpo: unknown): unknown {
  if (typeof cuerpo !== "object" || cuerpo === null) return cuerpo;
  const copia: Record<string, unknown> = { ...(cuerpo as Record<string, unknown>) };
  for (const campo of ["jobTitle", "phone", "specialty", "monthlyTargetDeals"]) {
    if (copia[campo] === "") delete copia[campo];
  }
  return copia;
}

export async function POST(request: Request) {
  try {
    const datos = parseInput(CrearUsuarioInput, limpiarVacios(await request.json().catch(() => ({}))));
    const actor = await requireActor();
    requireScope(actor, "users", "create");

    const db = getDb();

    const [existente] = await db.select({ id: users.id }).from(users).where(and(eq(users.email, datos.email), isNull(users.deletedAt))).limit(1);
    if (existente) throw new ConflictError("Ya existe un usuario activo con ese correo.");

    const [rol] = await db.select({ id: roles.id, slug: roles.slug }).from(roles).where(eq(roles.id, datos.roleId)).limit(1);
    if (!rol) throw new ConflictError("El rol indicado no existe.");

    const usuario = await transaction(async (tx) => {
      const [fila] = await tx
        .insert(users)
        .values({
          roleId: rol.id,
          authUserId: null, // nace sin invitar; lo resuelve el paso 2, o "reenviar invitación" si falla
          fullName: datos.fullName,
          email: datos.email,
          jobTitle: datos.jobTitle ?? null,
          phone: datos.phone ?? null,
          initials: datos.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
        })
        .returning();

      if (rol.slug === "broker") {
        await tx.insert(brokerProfiles).values({
          userId: fila!.id,
          specialty: datos.specialty ?? null,
          handlesRentals: datos.handlesRentals ?? false,
          level: BROKER_LEVELS[0], // "junior": nadie nace con historial de ventas
          monthlyTargetDeals: datos.monthlyTargetDeals ?? 0,
        });
      }

      await auditar(tx, actor, { accion: "crear", entidad: "user", entidadId: fila!.id, despues: fila });

      return fila!;
    });

    let invitado = true;
    let motivoError: string | undefined;
    try {
      const { data, error } = await adminClient().auth.admin.inviteUserByEmail(datos.email);
      if (error) throw error;
      if (data.user) {
        await getDb().update(users).set({ authUserId: data.user.id }).where(eq(users.id, usuario.id));
      }
    } catch (error) {
      // No se revierte el alta (ver comentario de arriba): el usuario queda
      // creado, reparable con `POST /api/usuarios/[id]/invitacion`.
      invitado = false;
      motivoError = error instanceof Error ? error.message : "No se pudo enviar la invitación.";
    }

    return Response.json({ ok: true, usuario, invitado, motivoError });
  } catch (error) {
    return errorResponse(error);
  }
}
