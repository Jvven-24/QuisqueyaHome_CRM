/**
 * M1 · Contactos — alta (`docs/F1_ANALISIS_Y_PLAN.md` paso 3).
 *
 * Ruta delgada: valida la entrada, autoriza, delega en el caso de uso
 * `crearContacto` (que hace la detección de duplicados de la decisión #19 antes
 * de escribir) y traduce el error una sola vez.
 */

import { CrearContactoInput } from "@/application/contactos/entrada";
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
export async function POST(request: Request) {
  try {
    const datos = parseInput(
      CrearContactoInput,
      await request.json().catch(() => ({})),
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
