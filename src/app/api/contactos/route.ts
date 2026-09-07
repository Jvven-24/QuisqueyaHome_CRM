/**
 * M1 · Contactos — alta (`docs/F1_ANALISIS_Y_PLAN.md` paso 3).
 *
 * Sigue el patrón de `src/infrastructure/README.md` al pie de la letra: valida
 * la entrada, autoriza, hace el trabajo (con la detección de duplicados de la
 * decisión #19 antes de escribir), y traduce el error una sola vez.
 */

import { and, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { ConflictError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { normalizarTelefono } from "@/domain/telefono";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { getDb, transaction } from "@/infrastructure/db/client";
import { contacts } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";

/**
 * `.min(1, "…")` solo traduce el error de cadena vacía, no el de campo
 * ausente (`docs/contexto/errores-conocidos.md`) — por eso `fullName` lleva
 * también el mensaje en `error` del `z.string()`, igual que la contraseña en
 * `api/auth/login/route.ts`.
 */
const CrearContactoInput = z.object({
  fullName: z
    .string({ error: "Escribe el nombre del contacto." })
    .min(1, "Escribe el nombre del contacto."),
  phone: z.string().optional(),
  email: z.email("Escribe un correo válido.").optional(),
  sourceId: z.coerce.number().int().positive().optional(),
  notes: z.string().optional(),
  /** Forzar la creación pese a candidatos de duplicado (decisión #19). */
  crear_igual: z.boolean().optional(),
});

/**
 * Un campo opcional vacío ("" desde un formulario sin rellenar) no es lo mismo
 * que ausente: sin esto, `z.email()` rechazaría un `email: ""` con un mensaje
 * que no aplica — el usuario no escribió un correo inválido, no escribió nada.
 */
function limpiarVacios(cuerpo: unknown): unknown {
  if (typeof cuerpo !== "object" || cuerpo === null) return cuerpo;
  const copia: Record<string, unknown> = { ...(cuerpo as Record<string, unknown>) };
  for (const campo of ["phone", "email", "notes", "sourceId"]) {
    if (copia[campo] === "") delete copia[campo];
  }
  return copia;
}

export async function POST(request: Request) {
  try {
    const datos = parseInput(
      CrearContactoInput,
      limpiarVacios(await request.json().catch(() => ({}))),
    );
    const actor = await requireActor();
    requireScope(actor, "contacts", "create");

    const { phone, phoneDisplay } = normalizarTelefono(datos.phone ?? null);

    // Detección de duplicados (decisión #19): se busca en toda la cartera, no
    // solo en lo que el actor puede ver — dos contactos idénticos repartidos
    // entre brokers distintos siguen siendo el mismo duplicado. Se avisa, no
    // se bloquea: sin `crear_igual`, un candidato responde 409 en vez de crear.
    if (!datos.crear_igual && (phone || datos.email)) {
      const candidatos = await getDb()
        .select({
          id: contacts.id,
          fullName: contacts.fullName,
          phone: contacts.phone,
          phoneDisplay: contacts.phoneDisplay,
          email: contacts.email,
        })
        .from(contacts)
        .where(
          and(
            isNull(contacts.deletedAt),
            or(
              phone ? eq(contacts.phone, phone) : undefined,
              datos.email ? eq(contacts.email, datos.email) : undefined,
            ),
          ),
        );

      if (candidatos.length > 0) {
        throw new ConflictError(
          "Ya existe un contacto con ese teléfono o correo. Confirma si quieres crearlo de todas formas.",
          { candidatos },
        );
      }
    }

    const contacto = await transaction(async (tx) => {
      const [fila] = await tx
        .insert(contacts)
        .values({
          fullName: datos.fullName,
          phone,
          phoneDisplay,
          email: datos.email ?? null,
          sourceId: datos.sourceId ?? null,
          notes: datos.notes ?? null,
          // El responsable por defecto es quien lo crea: sin esto, un broker
          // con alcance `own` no volvería a ver el contacto que acaba de dar
          // de alta (`rbac-filter.ts`), y quedaría huérfano de responsable.
          brokerId: actor.userId,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        })
        .returning();

      // `.returning()` de un `insert` con un único `values()` siempre trae
      // una fila; el tipo de Drizzle la marca opcional porque la firma es
      // genérica para lotes de varias filas.
      await auditar(tx, actor, {
        accion: "crear",
        entidad: "contact",
        entidadId: fila!.id,
        despues: fila,
      });

      return fila!;
    });

    return Response.json({ ok: true, contacto });
  } catch (error) {
    return errorResponse(error);
  }
}
