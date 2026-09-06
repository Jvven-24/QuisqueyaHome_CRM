/**
 * M1 · Contactos — edición y borrado lógico (`docs/F1_ANALISIS_Y_PLAN.md` paso 3).
 *
 * Mismo patrón que `../route.ts`: `parseInput` → `requireActor` +
 * `requireScope` → `transaction` con `auditar` dentro → `errorResponse`. El
 * alcance del actor filtra qué fila puede tocar (`visibleRows`), igual que en
 * la lectura de `page.tsx` — no se reescribe el filtro a mano.
 */

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { normalizarTelefono } from "@/domain/telefono";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { getDb, transaction } from "@/infrastructure/db/client";
import { contacts } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { visibleRows } from "@/infrastructure/rbac-filter";

/**
 * Edición parcial: todo opcional. `null` explícito borra el campo (por
 * ejemplo, quitarle el correo a un contacto); ausente lo deja como está — la
 * diferencia importa y por eso no se usa el mismo `limpiarVacios` que el alta,
 * que trata "" como "no lo mandó".
 */
const EditarContactoInput = z.object({
  fullName: z
    .string({ error: "Escribe el nombre del contacto." })
    .min(1, "Escribe el nombre del contacto.")
    .optional(),
  phone: z.string().nullable().optional(),
  email: z.union([z.email("Escribe un correo válido."), z.null()]).optional(),
  sourceId: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  notes: z.string().nullable().optional(),
});

/** "" desde un formulario que se vació equivale a `null` (borrar el campo), no a un valor literal vacío. */
function vaciosANull(cuerpo: unknown): unknown {
  if (typeof cuerpo !== "object" || cuerpo === null) return cuerpo;
  const copia: Record<string, unknown> = { ...(cuerpo as Record<string, unknown>) };
  for (const campo of ["phone", "email", "notes", "sourceId"]) {
    if (copia[campo] === "") copia[campo] = null;
  }
  return copia;
}

async function contactoVisible(id: number, actor: Awaited<ReturnType<typeof requireActor>>, scope: Parameters<typeof visibleRows>[1]) {
  const [fila] = await getDb()
    .select()
    .from(contacts)
    .where(and(eq(contacts.id, id), visibleRows(actor, scope, contacts.brokerId, contacts.deletedAt)))
    .limit(1);
  return fila;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(EditarContactoInput, vaciosANull(await request.json().catch(() => ({}))));
    const actor = await requireActor();
    const scope = requireScope(actor, "contacts", "edit");

    const contacto = await transaction(async (tx) => {
      // Se relee dentro de la transacción: el `NotFoundError` cubre a la vez
      // "no existe" y "existe pero fuera de tu alcance" (`domain/errors.ts`),
      // sin distinguir los dos casos al usuario.
      const anterior = await contactoVisible(id, actor, scope);
      if (!anterior) throw new NotFoundError();

      const cambios: Partial<typeof contacts.$inferInsert> = { updatedBy: actor.userId };
      if (datos.fullName !== undefined) cambios.fullName = datos.fullName;
      if ("phone" in datos) {
        const { phone, phoneDisplay } = normalizarTelefono(datos.phone);
        cambios.phone = phone;
        cambios.phoneDisplay = phoneDisplay;
      }
      if ("email" in datos) cambios.email = datos.email;
      if ("sourceId" in datos) cambios.sourceId = datos.sourceId;
      if ("notes" in datos) cambios.notes = datos.notes;

      const [fila] = await tx
        .update(contacts)
        .set(cambios)
        .where(eq(contacts.id, id))
        .returning();

      await auditar(tx, actor, {
        accion: "editar",
        entidad: "contact",
        entidadId: id,
        antes: anterior,
        despues: fila,
      });

      return fila;
    });

    return Response.json({ ok: true, contacto });
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
    const scope = requireScope(actor, "contacts", "delete");

    await transaction(async (tx) => {
      const anterior = await contactoVisible(id, actor, scope);
      if (!anterior) throw new NotFoundError();

      // Borrado lógico: nunca `DELETE` real (§9 del encargo). `visibleRows` ya
      // excluye `deleted_at` no nulo de cualquier lectura futura.
      const [fila] = await tx
        .update(contacts)
        .set({ deletedAt: new Date(), updatedBy: actor.userId })
        .where(eq(contacts.id, id))
        .returning();

      await auditar(tx, actor, {
        accion: "eliminar",
        entidad: "contact",
        entidadId: id,
        antes: anterior,
        despues: fila,
      });
    });

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
