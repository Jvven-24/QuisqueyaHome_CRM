/**
 * M2 · Leads — alta manual (`docs/F1_ANALISIS_Y_PLAN.md` paso 4).
 *
 * Mismo patrón que `app/api/contactos/route.ts`: `parseInput` → `requireActor`
 * + `requireScope` → detección de duplicados (decisión #19) → `transaction`
 * con `auditar` dentro → `errorResponse`.
 *
 * Un lead nace de un contacto: si no llega `contactId`, esta ruta crea el
 * contacto en la misma operación — es lo que dice el encargo ("un lead nuevo
 * normalmente crea o enlaza un contact"). La detección de duplicados se hace
 * sobre ese contacto, exactamente como en M1: se avisa con 409 y candidatos,
 * no se bloquea, y `crear_igual: true` fuerza la creación.
 */

import { and, eq, isNull, or } from "drizzle-orm";
import { z } from "zod";
import { OPERATION_TYPES } from "@/domain/catalogs";
import { ConflictError, NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { sugerirBroker } from "@/domain/asignacion-lead";
import { normalizarTelefono } from "@/domain/telefono";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { getDb, transaction } from "@/infrastructure/db/client";
import { contacts, leads } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { candidatosBroker } from "./_broker-candidatos";

const CrearLeadInput = z
  .object({
    /** Lead de un contacto ya existente. Si no llega, se crea uno nuevo con los tres campos siguientes. */
    contactId: z.coerce.number().int().positive().optional(),
    fullName: z.string().optional(),
    phone: z.string().optional(),
    email: z.email("Escribe un correo válido.").optional(),

    sourceId: z.coerce.number().int().positive().optional(),
    projectId: z.coerce.number().int().positive().optional(),
    projectInterestText: z.string().optional(),
    zoneInterest: z.string().optional(),
    operationType: z.enum(OPERATION_TYPES).optional(),
    budgetMinCents: z.coerce.number().int().nonnegative().optional(),
    budgetMaxCents: z.coerce.number().int().nonnegative().optional(),
    currency: z.string().optional(),

    campaign: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
    originalMessage: z.string().optional(),
    sourceVideoUrl: z.string().optional(),

    /** Forzar la creación del contacto pese a candidatos de duplicado (decisión #19). */
    crear_igual: z.boolean().optional(),
  })
  // `contactId` XOR los datos para crear uno: sin esto, un `fullName` vacío
  // con un `contactId` presente pasaría desapercibido hasta el `insert`.
  .refine((datos) => Boolean(datos.contactId) || Boolean(datos.fullName?.trim()), {
    message: "Indica un contacto existente o el nombre para crear uno nuevo.",
    path: ["fullName"],
  });

/** Igual que en `api/contactos/route.ts`: "" desde un formulario vacío no es un valor. */
function limpiarVacios(cuerpo: unknown): unknown {
  if (typeof cuerpo !== "object" || cuerpo === null) return cuerpo;
  const copia: Record<string, unknown> = { ...(cuerpo as Record<string, unknown>) };
  for (const campo of [
    "phone",
    "email",
    "sourceId",
    "projectId",
    "projectInterestText",
    "zoneInterest",
    "operationType",
    "budgetMinCents",
    "budgetMaxCents",
    "currency",
    "campaign",
    "utmSource",
    "utmMedium",
    "utmCampaign",
    "originalMessage",
    "sourceVideoUrl",
  ]) {
    if (copia[campo] === "") delete copia[campo];
  }
  return copia;
}

export async function POST(request: Request) {
  try {
    const datos = parseInput(CrearLeadInput, limpiarVacios(await request.json().catch(() => ({}))));
    const actor = await requireActor();
    requireScope(actor, "leads", "create");

    const db = getDb();

    // Detección de duplicados de contacto (decisión #19), solo cuando el lead
    // trae los datos para crear uno nuevo — un `contactId` explícito ya es una
    // decisión tomada por quien llama, no hay nada que avisar.
    const contactId = datos.contactId;
    if (!contactId) {
      const { phone } = normalizarTelefono(datos.phone ?? null);

      if (!datos.crear_igual && (phone || datos.email)) {
        const candidatos = await db
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
    } else {
      // Un `contactId` que no existe (o que fue borrado) es un 404, no un
      // contacto fantasma dentro de la transacción.
      const [existe] = await db
        .select({ id: contacts.id })
        .from(contacts)
        .where(and(eq(contacts.id, contactId), isNull(contacts.deletedAt)))
        .limit(1);
      if (!existe) throw new NotFoundError("El contacto indicado no existe.");
    }

    // La sugerencia de broker (decisión #21) se calcula antes de escribir: es
    // dominio puro, no necesita estar dentro de la transacción.
    const candidatos = await candidatosBroker(db);
    const suggestedBrokerId = sugerirBroker(
      {
        projectInterestText: datos.projectInterestText ?? null,
        zoneInterest: datos.zoneInterest ?? null,
        operationType: datos.operationType ?? null,
      },
      candidatos,
    );

    const resultado = await transaction(async (tx) => {
      let idContacto = contactId;

      if (!idContacto) {
        const { phone, phoneDisplay } = normalizarTelefono(datos.phone ?? null);
        const [contacto] = await tx
          .insert(contacts)
          .values({
            fullName: datos.fullName!.trim(),
            phone,
            phoneDisplay,
            email: datos.email ?? null,
            sourceId: datos.sourceId ?? null,
            createdBy: actor.userId,
            updatedBy: actor.userId,
          })
          .returning();

        await auditar(tx, actor, {
          accion: "crear",
          entidad: "contact",
          entidadId: contacto!.id,
          despues: contacto,
        });
        idContacto = contacto!.id;
      }

      const [lead] = await tx
        .insert(leads)
        .values({
          contactId: idContacto,
          sourceId: datos.sourceId ?? null,
          projectId: datos.projectId ?? null,
          projectInterestText: datos.projectInterestText ?? null,
          zoneInterest: datos.zoneInterest ?? null,
          operationType: datos.operationType ?? null,
          currency: datos.currency ?? "USD",
          budgetMinCents: datos.budgetMinCents ?? null,
          budgetMaxCents: datos.budgetMaxCents ?? null,
          // Decisión #21: nunca se escribe `brokerId` por esta regla, solo la
          // sugerencia — alguien confirma la asignación.
          suggestedBrokerId,
          campaign: datos.campaign ?? null,
          utmSource: datos.utmSource ?? null,
          utmMedium: datos.utmMedium ?? null,
          utmCampaign: datos.utmCampaign ?? null,
          originalMessage: datos.originalMessage ?? null,
          sourceVideoUrl: datos.sourceVideoUrl ?? null,
          createdBy: actor.userId,
          updatedBy: actor.userId,
        })
        .returning();

      await auditar(tx, actor, {
        accion: "crear",
        entidad: "lead",
        entidadId: lead!.id,
        despues: lead,
      });

      return lead!;
    });

    return Response.json({ ok: true, lead: resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
