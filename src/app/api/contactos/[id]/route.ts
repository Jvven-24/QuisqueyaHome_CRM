/**
 * M1 · Contactos — edición y borrado lógico (`docs/F1_ANALISIS_Y_PLAN.md` paso 3).
 *
 * Mismo patrón que `../route.ts`: `parseInput` → `requireActor` +
 * `requireScope` → caso de uso → `errorResponse`. El alcance del actor filtra
 * qué fila puede tocar dentro del repositorio (`visibleRows`) — no se reescribe
 * el filtro a mano.
 */

import { z } from "zod";
import { borrarContacto, editarContacto, type EntradaEditarContacto } from "@/application/contactos/casos-de-uso";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { contactosParaEscritura } from "@/infrastructure/contenedor/contactos";
import { errorResponse, parseInput, vaciosANull } from "@/infrastructure/http";

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
  /** Deuda de F1 (F2, issue #21): reasignar el responsable. Solo alcance `all` — ver el `if` en `PATCH`. */
  brokerId: z.coerce.number().int().positive().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();

    const datos = parseInput(
      EditarContactoInput,
      vaciosANull(await request.json().catch(() => ({})), ["phone", "email", "notes", "sourceId"]),
    );
    const actor = await requireActor();
    const scope = requireScope(actor, "contacts", "edit");

    // La regla de reasignar (solo alcance `all`) vive en `editarContacto`.
    //
    // Se copian solo las claves PRESENTES en `datos`, nunca `...datos` ni
    // `entrada.phone = datos.phone` a secas: para el caso de uso `null` borra el
    // campo y ausente lo deja igual, y `{ phone: undefined }` contaría como
    // presente. Zod ya omite las claves que no llegaron.
    const entrada: EntradaEditarContacto = {};
    if (datos.fullName !== undefined) entrada.fullName = datos.fullName;
    if ("phone" in datos) entrada.phone = datos.phone;
    if ("email" in datos) entrada.email = datos.email;
    if ("sourceId" in datos) entrada.sourceId = datos.sourceId;
    if ("notes" in datos) entrada.notes = datos.notes;
    if (datos.brokerId !== undefined) entrada.brokerId = datos.brokerId;

    const contacto = await editarContacto(contactosParaEscritura(), actor, scope, id, entrada);

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

    await borrarContacto(contactosParaEscritura(), actor, scope, id);

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
