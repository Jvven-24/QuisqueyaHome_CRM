/**
 * Doble en memoria del repositorio de Leads.
 *
 * Vive en este módulo y no en `application/testing/` (ver `contactos/en-memoria.ts`).
 * Es `Reversible` para que `unidadDeTrabajoEnMemoria` pueda deshacer lo escrito
 * cuando el caso de uso lanza; sin eso, "un fallo a mitad de la conversión o del
 * webhook no deja nada" pasaría siempre. Revierte las cuatro colecciones: leads,
 * contactos, negocios y la auditoría del webhook (sin actor; la
 * auditoría con actor es el doble de `testing/`).
 *
 * ## Lo que este doble NO puede probar
 *
 * La **atomicidad** de `crearLeadExternoSiNoExiste`. En memoria no hay
 * concurrencia: dos entregas "simultáneas" del mismo `externalId` siempre se
 * serializan y la segunda ve a la primera, así que este doble NO detectaría que
 * el caso de uso compusiera "buscar + crear". Esa garantía la da el
 * `INSERT ... ON CONFLICT DO NOTHING` sobre el índice único parcial
 * `leads_external_id_unq` del adaptador Drizzle
 * (`infrastructure/db/repos/leads.ts`). Lo que el doble sí comprueba es la
 * FORMA: que el caso de uso use ese único método y que, como el upsert, no
 * inserte si ya hay un lead NO borrado con ese `externalId`.
 *
 * El doble imita también la detección por teléfono/correo de contactos vivos.
 */

import type { AuditAction, EntityType } from "../../domain/catalogs.ts";
import type { Reversible } from "../testing/reversible.ts";
import type {
  CandidatoBroker,
  CandidatoDuplicado,
  Contacto,
  DatosNuevoContactoExterno,
  DatosNuevoContactoManual,
  DatosNuevoLead,
  DatosNuevoLeadExterno,
  DatosNuevoNegocioDeLead,
  Lead,
  Negocio,
  RepositorioLeads,
} from "./puertos.ts";

/** Fecha fija: así las pruebas no dependen del reloj. */
const FECHA_FIJA = new Date("2026-01-01T00:00:00Z");

export type AuditoriaSinActorEnMemoria = {
  accion: AuditAction;
  entidad: EntityType;
  entidadId: number;
  despues: unknown;
};

export type SemillaLeads = {
  leads?: readonly Lead[];
  contactos?: readonly Contacto[];
  negocios?: readonly Negocio[];
  candidatosBroker?: readonly CandidatoBroker[];
  /** Ids de etapas abiertas en orden de posición; vacío = "no hay etapa inicial". */
  etapasAbiertas?: readonly number[];
};

export type LeadsEnMemoria = RepositorioLeads &
  Reversible & {
    readonly leads: readonly Lead[];
    readonly contactos: readonly Contacto[];
    readonly negocios: readonly Negocio[];
    readonly auditoriaSinActor: readonly AuditoriaSinActorEnMemoria[];
  };

export function leadsEnMemoria(semilla: SemillaLeads = {}): LeadsEnMemoria {
  let leads: Lead[] = [...(semilla.leads ?? [])];
  let contactos: Contacto[] = [...(semilla.contactos ?? [])];
  let negocios: Negocio[] = [...(semilla.negocios ?? [])];
  let auditoriaSinActor: AuditoriaSinActorEnMemoria[] = [];
  const candidatos = [...(semilla.candidatosBroker ?? [])];
  const etapasAbiertas = [...(semilla.etapasAbiertas ?? [])];
  let siguienteLead = Math.max(0, ...leads.map((f) => f.id)) + 1;
  let siguienteContacto = Math.max(0, ...contactos.map((f) => f.id)) + 1;
  let siguienteNegocio = Math.max(0, ...negocios.map((f) => f.id)) + 1;

  function reemplazarLead(id: number, cambios: Partial<Lead>): Lead {
    const actual = leads.find((f) => f.id === id);
    // Error de programación, no de usuario: el caso de uso ya leyó el lead.
    if (!actual) throw new Error(`leadsEnMemoria: no existe el lead ${id}.`);
    const fila = { ...actual, ...cambios, updatedAt: FECHA_FIJA };
    leads = leads.map((f) => (f.id === id ? fila : f));
    return fila;
  }

  function nuevoLead(id: number, datos: DatosNuevoLead | DatosNuevoLeadExterno): Lead {
    return {
      id,
      contactId: datos.contactId,
      sourceId: datos.sourceId,
      projectId: datos.projectId,
      projectInterestText: datos.projectInterestText,
      zoneInterest: datos.zoneInterest,
      operationType: datos.operationType,
      currency: datos.currency,
      budgetMinCents: datos.budgetMinCents,
      budgetMaxCents: datos.budgetMaxCents,
      bedrooms: null,
      status: "new",
      brokerId: null,
      suggestedBrokerId: datos.suggestedBrokerId,
      sourceVideoUrl: datos.sourceVideoUrl,
      campaign: datos.campaign,
      utmSource: datos.utmSource,
      utmMedium: datos.utmMedium,
      utmCampaign: datos.utmCampaign,
      originalMessage: datos.originalMessage,
      externalId: "externalId" in datos ? datos.externalId : null,
      receivedAt: FECHA_FIJA,
      firstContactedAt: null,
      convertedDealId: null,
      discardReason: null,
      createdAt: FECHA_FIJA,
      updatedAt: FECHA_FIJA,
      createdBy: "createdBy" in datos ? datos.createdBy : null,
      updatedBy: "updatedBy" in datos ? datos.updatedBy : null,
      deletedAt: null,
    };
  }

  function nuevoContacto(id: number, parcial: Partial<Contacto> & Pick<Contacto, "fullName">): Contacto {
    return {
      id,
      phone: null,
      phoneDisplay: null,
      email: null,
      country: null,
      city: null,
      sourceId: null,
      brokerId: null,
      notes: null,
      lastInteractionAt: null,
      consentAt: null,
      consentSource: null,
      createdAt: FECHA_FIJA,
      updatedAt: FECHA_FIJA,
      createdBy: null,
      updatedBy: null,
      deletedAt: null,
      ...parcial,
    };
  }

  function contactosVivosCoincidentes(phone: string | null, email: string | null): Contacto[] {
    return contactos.filter((f) => f.deletedAt === null && ((phone && f.phone === phone) || (email && f.email === email)));
  }

  return {
    get leads() {
      return leads;
    },
    get contactos() {
      return contactos;
    },
    get negocios() {
      return negocios;
    },
    get auditoriaSinActor() {
      return auditoriaSinActor;
    },

    async candidatosDuplicados({ phone, email }): Promise<CandidatoDuplicado[]> {
      // Ignora el alcance a propósito, como el adaptador real (decisión #19).
      return contactosVivosCoincidentes(phone, email).map((f) => ({
        id: f.id,
        fullName: f.fullName,
        phone: f.phone,
        phoneDisplay: f.phoneDisplay,
        email: f.email,
      }));
    },

    async contactoExiste(id) {
      return contactos.some((f) => f.id === id && f.deletedAt === null);
    },

    async candidatosBroker() {
      return [...candidatos];
    },

    async buscarLead(id) {
      return leads.find((f) => f.id === id);
    },

    async buscarContactoPorTelefonoOCorreo({ phone, email }) {
      const primero = contactosVivosCoincidentes(phone, email)[0];
      return primero ? { id: primero.id } : undefined;
    },

    async crearContactoManual(datos: DatosNuevoContactoManual) {
      const fila = nuevoContacto(siguienteContacto++, {
        fullName: datos.fullName,
        phone: datos.phone,
        phoneDisplay: datos.phoneDisplay,
        email: datos.email,
        sourceId: datos.sourceId,
        brokerId: datos.brokerId,
        createdBy: datos.createdBy,
        updatedBy: datos.updatedBy,
      });
      contactos = [...contactos, fila];
      return fila;
    },

    async crearContactoExterno(datos: DatosNuevoContactoExterno) {
      const fila = nuevoContacto(siguienteContacto++, {
        fullName: datos.fullName,
        phone: datos.phone,
        phoneDisplay: datos.phoneDisplay,
        email: datos.email,
        sourceId: datos.sourceId,
        consentAt: datos.consentAt,
        consentSource: datos.consentSource,
      });
      contactos = [...contactos, fila];
      return fila;
    },

    async crearLead(datos: DatosNuevoLead) {
      const fila = nuevoLead(siguienteLead++, datos);
      leads = [...leads, fila];
      return fila;
    },

    /**
     * Se comporta como el upsert del adaptador: si hay un lead NO borrado con ese
     * `externalId`, lo devuelve con `creado: false` sin insertar (el índice único
     * es parcial: un lead en la papelera no cuenta). La atomicidad frente a
     * entregas simultáneas NO se prueba aquí (ver la cabecera del archivo).
     */
    async crearLeadExternoSiNoExiste(datos: DatosNuevoLeadExterno) {
      const existente = leads.find((f) => f.externalId === datos.externalId && f.deletedAt === null);
      if (existente) return { lead: existente, creado: false };
      const fila = nuevoLead(siguienteLead++, datos);
      leads = [...leads, fila];
      return { lead: fila, creado: true };
    },

    async asignarResponsable(id, brokerId, actorId) {
      return reemplazarLead(id, { brokerId, updatedBy: actorId });
    },

    async marcarDescartado(id, motivo, actorId) {
      return reemplazarLead(id, { status: "discarded", discardReason: motivo, updatedBy: actorId });
    },

    async marcarConvertido(id, negocioId, actorId) {
      return reemplazarLead(id, { status: "converted", convertedDealId: negocioId, updatedBy: actorId });
    },

    async primeraEtapaAbierta() {
      const id = etapasAbiertas[0];
      return id === undefined ? undefined : { id };
    },

    async crearNegocioDeLead(datos: DatosNuevoNegocioDeLead) {
      const fila: Negocio = {
        id: siguienteNegocio++,
        contactId: datos.contactId,
        leadId: datos.leadId,
        title: null,
        stageId: datos.stageId,
        sourceId: datos.sourceId,
        brokerId: datos.brokerId,
        operationType: datos.operationType,
        currency: datos.currency,
        amountCents: null,
        probability: null,
        commissionBasisPoints: null,
        expectedCloseDate: null,
        nextActivityId: null,
        stageChangedAt: datos.stageChangedAt,
        closedAt: null,
        lossReasonId: null,
        lossComment: null,
        notes: null,
        createdAt: FECHA_FIJA,
        updatedAt: FECHA_FIJA,
        createdBy: datos.createdBy,
        updatedBy: datos.updatedBy,
        deletedAt: null,
      };
      negocios = [...negocios, fila];
      return fila;
    },

    async registrarAuditoriaSinActor(registro) {
      auditoriaSinActor = [...auditoriaSinActor, { ...registro }];
    },

    instantanea() {
      // Las colecciones se reasignan en vez de mutarse: la copia es inmutable y
      // restaurarla es devolver la referencia. Los contadores de ids no se
      // restauran: una secuencia de Postgres tampoco retrocede tras un rollback.
      const copia = { leads, contactos, negocios, auditoriaSinActor };
      return () => {
        leads = copia.leads;
        contactos = copia.contactos;
        negocios = copia.negocios;
        auditoriaSinActor = copia.auditoriaSinActor;
      };
    },
  };
}
