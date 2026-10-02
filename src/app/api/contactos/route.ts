/**
 * M1 · Contactos — alta (`docs/F1_ANALISIS_Y_PLAN.md` paso 3).
 *
 * Ruta delgada: valida la entrada, autoriza, delega en el caso de uso
 * `crearContacto` (que hace la detección de duplicados de la decisión #19 antes
 * de escribir) y traduce el error una sola vez.
 */

import { z } from "zod";
import { crearContacto } from "@/application/contactos/casos-de-uso";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { contactosParaEscritura } from "@/infrastructure/contenedor/contactos";
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

    // Campo por campo, nunca `...datos`; `crear_igual` (HTTP) pasa a `crearIgual`.
    const contacto = await crearContacto(contactosParaEscritura(), actor, {
      fullName: datos.fullName,
      phone: datos.phone,
      email: datos.email,
      sourceId: datos.sourceId,
      notes: datos.notes,
      crearIgual: datos.crear_igual,
    });

    return Response.json({ ok: true, contacto });
  } catch (error) {
    return errorResponse(error);
  }
}
