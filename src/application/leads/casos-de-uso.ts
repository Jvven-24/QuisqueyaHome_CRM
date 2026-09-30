/**
 * Casos de uso de Leads: alta manual, asignación de responsable, descarte y
 * captura externa (webhook). La conversión a negocio, que es la operación
 * grande, vive aparte en `./conversion.ts`.
 *
 * Son el comportamiento que antes vivía dentro de `api/leads/**`, movido tal
 * cual: mismo orden de operaciones, mismos mensajes y mismas filas de auditoría.
 * La autorización (`requireScope`) la hace quien llama, antes; el alcance
 * resultante entra como parámetro donde hace falta. La captura externa es la
 * excepción: es pública y no tiene actor (ver `capturarLeadExterno`).
 */

import { sugerirBroker } from "../../domain/asignacion-lead.ts";
import { ConflictError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import { reaches, type Actor, type PermissionScope } from "../../domain/rbac.ts";
import { normalizarTelefono } from "../../domain/telefono.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { DatosCapturaLead, Lead, RepositorioLeads, ReposLeads, TipoOperacion } from "./puertos.ts";

/**
 * El repositorio "suelto" (sobre la conexión) es para las lecturas que van FUERA
 * de la transacción, como antes: la detección de duplicados, la comprobación del
 * contacto, la lista de candidatos a broker.
 */
export type DepsLeads = { leads: RepositorioLeads; unidad: UnidadDeTrabajo<ReposLeads> };

/** Lo que el alta manual y el webhook comparten. */
type EntradaCaptura = {
  sourceId?: number;
  projectId?: number;
  projectInterestText?: string;
  zoneInterest?: string;
  operationType?: TipoOperacion;
  budgetMinCents?: number;
  budgetMaxCents?: number;
  currency?: string;
  campaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  originalMessage?: string;
  sourceVideoUrl?: string;
};

/** Campo por campo, nunca `...entrada`. `contactId` y `suggestedBrokerId` los decide quien llama. */
function datosDeCaptura(
  entrada: EntradaCaptura,
  contactId: number,
  suggestedBrokerId: number | null,
): DatosCapturaLead {
  return {
    contactId,
    sourceId: entrada.sourceId ?? null,
    projectId: entrada.projectId ?? null,
    projectInterestText: entrada.projectInterestText ?? null,
    zoneInterest: entrada.zoneInterest ?? null,
    operationType: entrada.operationType ?? null,
    currency: entrada.currency ?? "USD",
    budgetMinCents: entrada.budgetMinCents ?? null,
    budgetMaxCents: entrada.budgetMaxCents ?? null,
    // Decisión #21: nunca se escribe `brokerId` por esta regla, solo la
    // sugerencia — alguien confirma la asignación.
    suggestedBrokerId,
    campaign: entrada.campaign ?? null,
    utmSource: entrada.utmSource ?? null,
    utmMedium: entrada.utmMedium ?? null,
    utmCampaign: entrada.utmCampaign ?? null,
    originalMessage: entrada.originalMessage ?? null,
    sourceVideoUrl: entrada.sourceVideoUrl ?? null,
  };
}

/** La sugerencia de broker (decisión #21) es dominio puro: se calcula antes de escribir, fuera de la transacción. */
async function sugerirBrokerPara(leads: RepositorioLeads, entrada: EntradaCaptura): Promise<number | null> {
  const candidatos = await leads.candidatosBroker();
  return sugerirBroker(
    {
      projectInterestText: entrada.projectInterestText ?? null,
      zoneInterest: entrada.zoneInterest ?? null,
      operationType: entrada.operationType ?? null,
    },
    candidatos,
  );
}

// ---------------------------------------------------------------------------
// Alta manual
// ---------------------------------------------------------------------------

export type EntradaCrearLead = EntradaCaptura & {
  /** Lead de un contacto ya existente. Si no llega, se crea uno nuevo con `fullName`, `phone` y `email`. */
  contactId?: number;
  fullName?: string;
  phone?: string;
  email?: string;
  /** Forzar la creación del contacto pese a candidatos de duplicado (decisión #19). */
  crearIgual?: boolean;
};

export async function crearLead(deps: DepsLeads, actor: Actor, entrada: EntradaCrearLead): Promise<Lead> {
  // Detección de duplicados de contacto (decisión #19), solo cuando el lead trae
  // los datos para crear uno nuevo — un `contactId` explícito ya es una decisión
  // tomada por quien llama, no hay nada que avisar. Se avisa con 409 y
  // candidatos, no se bloquea, y `crearIgual` fuerza la creación.
  //
  // Va FUERA de la transacción, igual que antes: es un aviso, no una garantía.
  const contactId = entrada.contactId;
  if (!contactId) {
    const { phone } = normalizarTelefono(entrada.phone ?? null);

    if (!entrada.crearIgual && (phone || entrada.email)) {
      const candidatos = await deps.leads.candidatosDuplicados({ phone, email: entrada.email ?? null });
      if (candidatos.length > 0) {
        throw new ConflictError(
          "Ya existe un contacto con ese teléfono o correo. Confirma si quieres crearlo de todas formas.",
          { candidatos },
        );
      }
    }
  } else if (!(await deps.leads.contactoExiste(contactId))) {
    // Un `contactId` que no existe (o que fue borrado) es un 404, no un
    // contacto fantasma dentro de la transacción.
    throw new NotFoundError("El contacto indicado no existe.");
  }

  const suggestedBrokerId = await sugerirBrokerPara(deps.leads, entrada);

  return deps.unidad.ejecutar(async ({ leads, auditoria }) => {
    let idContacto = contactId;

    if (!idContacto) {
      // La ruta ya lo exige con Zod; esto solo protege al caso de uso de una
      // entrada que no pasó por ella.
      const nombre = entrada.fullName?.trim();
      if (!nombre) {
        throw new ValidationError("Indica un contacto existente o el nombre para crear uno nuevo.", {
          fullName: "Indica un contacto existente o el nombre para crear uno nuevo.",
        });
      }

      const { phone, phoneDisplay } = normalizarTelefono(entrada.phone ?? null);
      const contacto = await leads.crearContactoManual({
        fullName: nombre,
        phone,
        phoneDisplay,
        email: entrada.email ?? null,
        sourceId: entrada.sourceId ?? null,
        // Mismo criterio que Contactos: sin dueño por defecto, un broker con
        // alcance `own` no vería el contacto que acaba de crear al dar de alta
        // este lead (issue #22).
        brokerId: actor.userId,
        createdBy: actor.userId,
        updatedBy: actor.userId,
      });

      await auditoria.registrar(actor, {
        accion: "crear",
        entidad: "contact",
        entidadId: contacto.id,
        despues: contacto,
      });
      idContacto = contacto.id;
    }

    const lead = await leads.crearLead({
      ...datosDeCaptura(entrada, idContacto, suggestedBrokerId),
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });

    await auditoria.registrar(actor, { accion: "crear", entidad: "lead", entidadId: lead.id, despues: lead });

    return lead;
  });
}

// ---------------------------------------------------------------------------
// Asignar responsable
// ---------------------------------------------------------------------------

/**
 * Asigna el responsable de un lead (issue #22).
 *
 * El broker tiene que ser un candidato válido (activo, con perfil de broker):
 * se reutiliza la misma lista que arma la sugerencia en vez de escribir una
 * segunda condición "es broker activo". Esa comprobación va ANTES de leer el
 * lead, como antes: un broker inválido responde 422 aunque el lead no exista.
 *
 * **H16 (`docs/R_HALLAZGOS.md`) — conservado a propósito.** Aquí el alcance solo
 * se usa con `reaches` sobre el lead actual: reasignar un lead PROPIO a otro
 * broker NO exige alcance `all`, mientras que en Contactos sí (issue #21). Es una
 * inconsistencia conocida y una decisión de producto pendiente; este commit no
 * cambia comportamiento, así que no se "arregla" ni se iguala a Contactos.
 */
export async function asignarResponsableDeLead(
  deps: DepsLeads,
  actor: Actor,
  alcance: PermissionScope,
  id: number,
  entrada: { brokerId: number },
): Promise<Lead> {
  const candidatos = await deps.leads.candidatosBroker();
  if (!candidatos.some((candidato) => candidato.userId === entrada.brokerId)) {
    throw new ValidationError("Ese usuario no es un broker activo.", {
      brokerId: "Elige un broker activo.",
    });
  }

  return deps.unidad.ejecutar(async ({ leads, auditoria }) => {
    const lead = await leads.buscarLead(id);
    if (!lead || lead.deletedAt) throw new NotFoundError();
    // El `SELECT` ya ocurrió por `id`: el alcance se comprueba en memoria con
    // `reaches`. Fuera de alcance responde igual que inexistente.
    if (!reaches(actor, alcance, lead.brokerId)) throw new NotFoundError();

    const actualizado = await leads.asignarResponsable(id, entrada.brokerId, actor.userId);

    await auditoria.registrar(actor, {
      accion: "asignar",
      entidad: "lead",
      entidadId: id,
      antes: lead,
      despues: actualizado,
    });

    return actualizado;
  });
}

// ---------------------------------------------------------------------------
// Descartar
// ---------------------------------------------------------------------------

/**
 * Descarte con motivo. `motivo` llega ya recortado y no vacío: la ruta lo valida
 * antes de autenticar, como antes. A diferencia de "eliminar" (borrado lógico de
 * un registro que no debió existir), descartar es una transición de negocio: el
 * lead sí existió y no prosperó, y el motivo alimenta cualquier reporte futuro
 * de "por qué se pierden leads".
 */
export async function descartarLead(
  deps: Pick<DepsLeads, "unidad">,
  actor: Actor,
  alcance: PermissionScope,
  id: number,
  motivo: string,
): Promise<Lead> {
  return deps.unidad.ejecutar(async ({ leads, auditoria }) => {
    const lead = await leads.buscarLead(id);
    if (!lead || lead.deletedAt) throw new NotFoundError();
    if (!reaches(actor, alcance, lead.brokerId)) throw new NotFoundError();

    if (lead.status === "converted") {
      throw new ConflictError("Este lead ya fue convertido a negocio; no se puede descartar.");
    }
    if (lead.status === "discarded") {
      throw new ConflictError("Este lead ya está descartado.");
    }

    const actualizado = await leads.marcarDescartado(id, motivo, actor.userId);

    await auditoria.registrar(actor, {
      accion: "descartar",
      entidad: "lead",
      entidadId: id,
      antes: lead,
      despues: actualizado,
    });

    return actualizado;
  });
}

// ---------------------------------------------------------------------------
// Captura externa (webhook)
// ---------------------------------------------------------------------------

export type EntradaLeadExterno = EntradaCaptura & {
  /** La clave de idempotencia (decisión #20). */
  externalId: string;
  fullName: string;
  phone?: string;
  email?: string;
};

/**
 * Captura externa idempotente (decisión #20). No recibe actor: es la única
 * entrada pública del sistema (la protege el token de la ruta, que NO se
 * mueve aquí) y su auditoría se escribe sin usuario
 * (`registrarAuditoriaSinActor`).
 *
 * La idempotencia es UNA llamada atómica al repositorio
 * (`crearLeadExternoSiNoExiste`): no se compone con una búsqueda previa.
 */
export async function capturarLeadExterno(
  deps: DepsLeads,
  entrada: EntradaLeadExterno,
): Promise<{ lead: Lead; creado: boolean }> {
  const { phone, phoneDisplay } = normalizarTelefono(entrada.phone ?? null);

  // La sugerencia de broker es dominio puro; se calcula antes de la
  // transacción igual que en el alta manual.
  const suggestedBrokerId = await sugerirBrokerPara(deps.leads, entrada);

  return deps.unidad.ejecutar(async ({ leads }) => {
    // Reutiliza un contacto existente por teléfono o correo en vez de crear uno
    // nuevo en cada entrega: a diferencia del alta manual (decisión #19, que
    // avisa porque hay un humano que puede confirmar), aquí no hay nadie a
    // quien preguntarle "¿de todas formas?" — un webhook no puede responder un
    // 409. El criterio #5 sigue cumplido: no se pierde el duplicado, se enlaza
    // al contacto que ya lo representa.
    let idContacto: number | undefined;
    if (phone || entrada.email) {
      const existente = await leads.buscarContactoPorTelefonoOCorreo({ phone, email: entrada.email ?? null });
      idContacto = existente?.id;
    }

    if (!idContacto) {
      const contacto = await leads.crearContactoExterno({
        fullName: entrada.fullName.trim(),
        phone,
        phoneDisplay,
        email: entrada.email ?? null,
        sourceId: entrada.sourceId ?? null,
        consentAt: new Date(),
        consentSource: "portal_externo",
      });

      // Sin `Actor`: `auditar()` exige uno humano. Sigue yendo dentro de la
      // misma transacción que el cambio (§18.1 / criterio #2).
      await leads.registrarAuditoriaSinActor({
        accion: "crear",
        entidad: "contact",
        entidadId: contacto.id,
        despues: contacto,
      });
      idContacto = contacto.id;
    }

    const resultado = await leads.crearLeadExternoSiNoExiste({
      ...datosDeCaptura(entrada, idContacto, suggestedBrokerId),
      externalId: entrada.externalId,
    });

    // Ya existía: se devuelve el lead existente, sin auditoría nueva — no hubo
    // cambio que registrar.
    if (resultado.creado) {
      await leads.registrarAuditoriaSinActor({
        accion: "crear",
        entidad: "lead",
        entidadId: resultado.lead.id,
        despues: resultado.lead,
      });
    }

    return resultado;
  });
}
