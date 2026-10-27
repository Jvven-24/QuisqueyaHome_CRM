/**
 * Casos de uso de Pipeline: cambio de etapa (con el cierre de ocho pasos de
 * `./cierre.ts`), edición del negocio y propiedades de interés.
 *
 * Conservan los efectos heredados; b2 agrega bloqueos, baja logica y outbox.
 * El comportamiento que antes vivía dentro de `api/pipeline/**`, movido tal
 * cual: mismo orden de operaciones, mismos mensajes y mismas filas de auditoría.
 * La autorización (`requireScope`) la hace quien llama, antes; el alcance
 * resultante entra como parámetro donde hace falta.
 *
 * La pieza propia de este módulo es la resolución del `ContextoTransicion` que
 * pide `validarTransicion` (`domain/transicion-etapa.ts`) — cuatro consultas
 * que traducen el estado real del negocio a los booleanos que esa función
 * pura necesita, sin que ella tenga que saber qué es una `activities` o una
 * `deal_properties`.
 *
 * Si `etapaDestino.kind === "won"`, esto no es "un cambio de etapa más": se
 * delega en `cerrarNegocioGanado` (`./cierre.ts`), que hace los ocho pasos de
 * §10.2 dentro de la misma unidad de trabajo abierta aquí.
 */

import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors.ts";
import { reaches, scopeFor, type Actor, type PermissionScope } from "../../domain/rbac.ts";
import {
  validarTransicion,
  type ContextoTransicion,
  type Negocio as NegocioParaTransicion,
} from "../../domain/transicion-etapa.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import { cerrarNegocioGanado } from "./cierre.ts";
import type { CambiosNegocio, Negocio, PropiedadDeNegocio, RepositorioPipeline, ReposPipeline } from "./puertos.ts";
import { asociarPropiedadSchema, cambiarEtapaSchema, editarNegocioSchema, validarEntrada } from "./entrada.ts";

export type DepsPipeline = { unidad: UnidadDeTrabajo<ReposPipeline> };

export type EntradaCambiarEtapa = {
  stageId: number;
  expectedStageId?: number;
  expectedStageChangedAt?: string | null;
  /** Obligatorio cuando la etapa destino es `lost` — lo valida `validarTransicion`, no la ruta: Zod no conoce todavía el `kind` de la etapa. */
  lossReasonId?: number;
  lossComment?: string;
  /** Monto final del cierre. Si no llega, se usa el que ya tenía el negocio (encargo, punto 4.1). */
  amountCents?: number;
  unitId?: number;
  unitCode?: string;
};

export async function cambiarEtapaDeNegocio(
  deps: DepsPipeline,
  actor: Actor,
  alcance: PermissionScope,
  id: number,
  entrada: EntradaCambiarEtapa,
): Promise<Negocio> {
  entrada = validarEntrada(cambiarEtapaSchema, entrada);
  return deps.unidad.ejecutar(async (repos) => {
    const { pipeline, auditoria } = repos;

    const deal = await pipeline.bloquearNegocio(id);
    if (!deal || deal.deletedAt) throw new NotFoundError();
    // Mismo criterio que `dentroDeAlcance` en `api/leads/[id]/convertir/route.ts`:
    // un id fuera del alcance del actor responde igual que uno inexistente.
    if (!reaches(actor, alcance, deal.brokerId)) throw new NotFoundError();

    if ((entrada.expectedStageId !== undefined && entrada.expectedStageId !== deal.stageId) ||
      ("expectedStageChangedAt" in entrada && entrada.expectedStageChangedAt !== (deal.stageChangedAt?.toISOString() ?? null))) {
      throw new ConflictError("La etapa cambió desde que abriste el negocio. Actualiza antes de moverlo.");
    }

    const etapaActual = await pipeline.buscarEtapa(deal.stageId);
    if (!etapaActual) {
      throw new ConflictError("La etapa actual del negocio no existe en el embudo.");
    }

    const etapaDestino = await pipeline.buscarEtapaActiva(entrada.stageId);
    if (!etapaDestino) throw new NotFoundError("La etapa indicada no existe.");
    if (deal.stageId === etapaDestino.id) return deal;

    // --- Resolver el `ContextoTransicion` que pide `validarTransicion` ----
    const tieneActividadDeContacto = await pipeline.tieneActividadDeContacto(id);

    // La próxima acción vive en `deals.next_activity_id` (sin FK, decisión
    // #8): se resuelve la actividad que apunta, y solo cuenta si sigue
    // pendiente y trae responsable y fecha — una actividad ya completada o
    // cancelada no es una "próxima acción" vigente (eso lo decide el
    // repositorio en `buscarProximaAccionVigente`).
    let proximaAccion: ContextoTransicion["proximaAccion"] = null;
    if (deal.nextActivityId != null) {
      proximaAccion = await pipeline.buscarProximaAccionVigente(deal.nextActivityId, id);
    }

    const propiedades = await pipeline.propiedadesDelNegocio(id);
    // La unidad principal exige `unitId` resuelto, no solo `isPrimary`: el
    // esquema permite un interés a nivel de proyecto sin unidad todavía
    // (`deal_properties.unit_id` nulable), y esa fila no alcanza para
    // marcar nada como `sold`/`reserved` en el paso 3 del cierre.
    let unidadPrincipal = propiedades.find(
      (fila): fila is PropiedadDeNegocio & { unitId: number } => fila.isPrimary && fila.unitId != null,
    );

    // Resolver únicamente al cerrar, dentro de esta transacción y tras autorizar proyecto.
    if (etapaDestino.kind === "won" && (entrada.unitId != null || entrada.unitCode != null)) {
      const principal = propiedades.find(fila => fila.isPrimary);
      if (!principal) throw new ConflictError("Falta el proyecto principal para cerrar el negocio.");
      if (!await pipeline.proyectoVisible(actor, scopeFor(actor, "projects", "view"), principal.projectId)) throw new NotFoundError();
      if (entrada.unitId != null && entrada.unitCode != null) throw new ConflictError("Elige una unidad o indica su código.");
      const unitId = entrada.unitId ?? await pipeline.resolverUnidadDeCierre({ projectId: principal.projectId, code: entrada.unitCode!, actorId: actor.userId });
      if (!await pipeline.bloquearUnidad(unitId, principal.projectId)) throw new NotFoundError();
      await pipeline.fijarUnidadPrincipal({ propiedadId: principal.id, unitId });
      unidadPrincipal = { ...principal, unitId };
    }

    const negocio: NegocioParaTransicion = {
      etapaActualKind: etapaActual.kind,
      // El monto y el motivo de pérdida se resuelven con el valor que trae
      // el body si viene, o el que ya tenía el negocio — así
      // `validarTransicion` valida el estado *después* de aplicar este
      // cambio, no el de antes de que el usuario lo pidiera.
      amountCents: entrada.amountCents ?? deal.amountCents,
      probability: deal.probability,
      commissionBasisPoints: deal.commissionBasisPoints,
      expectedCloseDate: deal.expectedCloseDate,
      lossReasonId: entrada.lossReasonId ?? deal.lossReasonId,
    };
    const contexto: ContextoTransicion = {
      tieneActividadDeContacto,
      proximaAccion,
      cantidadPropiedades: propiedades.length,
      tieneUnidadPrincipal: unidadPrincipal != null,
    };

    // No se duplica la validación aquí: si algo falta, esto lanza
    // `ConflictError` y `errorResponse` lo traduce a 409 con el mensaje
    // exacto que redactó `transicion-etapa.ts`.
    validarTransicion(negocio, { kind: etapaDestino.kind, slug: etapaDestino.slug }, contexto);

    // --- Cierre (won): delega en los ocho pasos de §10.2 ------------------
    if (etapaDestino.kind === "won") {
      // `validarTransicion` ya garantizó `tieneUnidadPrincipal` y
      // `amountCents != null`; estas dos comprobaciones son para que
      // TypeScript lo sepa también, no para volver a decidir nada.
      if (!unidadPrincipal) throw new ConflictError("Falta la unidad principal para cerrar el negocio.");
      if (negocio.amountCents == null) throw new ConflictError("Falta el monto final para cerrar el negocio.");
      if (!await pipeline.proyectoVisible(actor, scopeFor(actor, "projects", "view"), unidadPrincipal.projectId)) throw new NotFoundError();

      return cerrarNegocioGanado(repos, actor, {
        dealId: id,
        etapaDestino,
        unidadPrincipal,
        amountCentsFinal: negocio.amountCents,
        negocioBloqueado: deal,
      });
    }

    if (etapaDestino.kind === "lost") {
      if (!entrada.lossReasonId || !await pipeline.motivoPerdidaActivo(entrada.lossReasonId)) {
        throw new ConflictError("El motivo de pérdida debe estar activo.");
      }
      if (!entrada.lossComment?.trim()) throw new ConflictError("Para marcar el negocio como perdido hace falta un comentario.");
    }

    // --- Cambio simple de etapa (open intermedio, o lost con motivo) -----
    const dealActualizado = await pipeline.aplicarCambioDeEtapa({
      dealId: id,
      etapaDestinoId: etapaDestino.id,
      cuando: new Date(Math.max(Date.now(), (deal.stageChangedAt?.getTime() ?? 0) + 1)),
      perdida:
        etapaDestino.kind === "lost"
          ? { lossReasonId: entrada.lossReasonId, lossComment: entrada.lossComment!.trim() }
          : undefined,
      actorId: actor.userId,
    });

    await pipeline.registrarHistorialDeEtapa({
      dealId: id,
      desdeEtapaId: etapaActual.id,
      hastaEtapaId: etapaDestino.id,
      actorId: actor.userId,
    });

    await auditoria.registrar(actor, {
      accion: etapaDestino.kind === "lost" ? "marcar_perdido" : "cambiar_etapa",
      entidad: "deal",
      entidadId: id,
      antes: deal,
      despues: dealActualizado,
    });
    await repos.outbox.emitir({ tipo: "NegocioCambioEtapa", aggregateId: id, payload: { id, stageId: etapaDestino.id } });

    return dealActualizado;
  });
}

/**
 * Guardia compartido por la edición del negocio y las propiedades de interés
 * (deuda de F1, issue #21).
 *
 * Editar el monto, la comisión o las unidades de interés después del cierre
 * desincroniza el negocio con la comisión que el cierre transaccional ya
 * generó (`./cierre.ts`, paso 6) — ese número no se recalcula solo. Un
 * negocio ganado o perdido se edita por su propia vía (reabrir la etapa,
 * nunca este formulario).
 *
 * Devuelve el negocio completo (para auditar). Lee sin bloquear, como antes.
 */
async function negocioAbiertoVisible(
  pipeline: RepositorioPipeline,
  dealId: number,
  actor: Actor,
  alcance: PermissionScope,
): Promise<Negocio> {
  await pipeline.bloquearNegocio(dealId);
  const fila = await pipeline.buscarNegocioConEtapa(dealId);

  if (!fila || fila.negocio.deletedAt || !reaches(actor, alcance, fila.negocio.brokerId)) throw new NotFoundError();
  if (fila.etapaKind !== "open") throw new ConflictError("Este negocio ya está cerrado; no se puede editar.");

  return fila.negocio;
}

/**
 * Edición parcial del negocio (deuda de F1, issue #21): sin esto, un negocio no
 * podía cumplir por su cuenta los requisitos de §10.1 para → Negociación
 * (monto, probabilidad, comisión, fecha estimada) desde la interfaz. No toca
 * `stageId`, `brokerId` ni los campos de cierre/pérdida — esos tienen su propia
 * vía (`cambiarEtapaDeNegocio`).
 *
 * Como en Contactos, "ausente" y `null` son distintos: `null` borra el campo y
 * ausente lo deja como está. Quien construya la entrada debe OMITIR la clave,
 * no pasar `undefined`.
 */
export type EntradaEditarNegocio = {
  amountCents?: number | null;
  probability?: number | null;
  commissionBasisPoints?: number | null;
  expectedCloseDate?: string | null;
};

export async function editarNegocio(
  deps: DepsPipeline,
  actor: Actor,
  alcance: PermissionScope,
  id: number,
  entrada: EntradaEditarNegocio,
): Promise<Negocio> {
  entrada = validarEntrada(editarNegocioSchema, entrada);
  if ("commissionBasisPoints" in entrada && (actor.roleSlug !== "admin" || scopeFor(actor, "commissions", "view") === "none")) throw new ForbiddenError("Campo restringido.");
  if ("amountCents" in entrada && actor.roleSlug !== "admin" && actor.roleSlug !== "broker") throw new ForbiddenError("Campo restringido.");
  return deps.unidad.ejecutar(async ({ pipeline, auditoria }) => {
    const anterior = await negocioAbiertoVisible(pipeline, id, actor, alcance);

    const cambios: CambiosNegocio = { updatedBy: actor.userId };
    if ("amountCents" in entrada) cambios.amountCents = entrada.amountCents;
    if ("probability" in entrada) cambios.probability = entrada.probability;
    if ("commissionBasisPoints" in entrada) cambios.commissionBasisPoints = entrada.commissionBasisPoints;
    if ("expectedCloseDate" in entrada) cambios.expectedCloseDate = entrada.expectedCloseDate;

    const fila = await pipeline.actualizarNegocio(id, cambios);

    await auditoria.registrar(actor, { accion: "editar", entidad: "deal", entidadId: id, antes: anterior, despues: fila });

    return fila;
  });
}

export type EntradaAsociarPropiedad = {
  projectId: number;
  unitId?: number;
  isPrimary?: boolean;
};

/**
 * Asociar unidad o proyecto de interés (deuda de F1, issue #21). Sin esto, un
 * negocio no podía cumplir por su cuenta el requisito de §10.1 para →
 * Preselección («al menos una fila en `deal_properties`»).
 *
 * `unitId` es opcional (el esquema permite interés a nivel de proyecto sin
 * unidad, decisión #4); marcar `isPrimary` en la misma llamada desmarca
 * cualquier otra fila del negocio que ya lo fuera — un negocio tiene como
 * mucho una unidad principal, nunca dos.
 *
 * `projectId` y `unitId` se verifican antes de insertar (hallazgo P2): sin
 * esto, un `unitId` de otro proyecto pasaba tal cual, y el cierre transaccional
 * (`./cierre.ts` paso 3) marca esa unidad como vendida solo por su id —
 * cerraría un negocio contra el inventario equivocado.
 *
 * El proyecto además tiene que estar dentro del alcance del actor sobre
 * `projects` (`alcanceProyectos`, R6), no solo existir (hallazgo de la revisión
 * del PR #29): `deals:edit` autoriza a tocar el negocio, no a usar
 * proyectos ajenos — un broker con `projects:view own` no debe poder asociar
 * a su negocio el proyecto de otro solo porque sabe su id.
 */
export async function asociarPropiedad(
  deps: DepsPipeline,
  actor: Actor,
  alcance: PermissionScope,
  alcanceProyectos: PermissionScope,
  dealId: number,
  entrada: EntradaAsociarPropiedad,
): Promise<PropiedadDeNegocio> {
  entrada = validarEntrada(asociarPropiedadSchema, entrada);
  return deps.unidad.ejecutar(async ({ pipeline, auditoria }) => {
    await negocioAbiertoVisible(pipeline, dealId, actor, alcance);

    const proyecto = await pipeline.proyectoVisible(actor, alcanceProyectos, entrada.projectId);
    if (!proyecto) throw new NotFoundError("El proyecto indicado no existe.");

    // La unidad debe existir y pertenecer *a este* proyecto — sin la
    // segunda condición, un `unitId` de otro proyecto se insertaría tal
    // cual, y el cierre marcaría como vendida la unidad equivocada.
    if (entrada.unitId != null) {
      const unidad = await pipeline.unidadDelProyecto(entrada.unitId, entrada.projectId);
      if (!unidad) throw new NotFoundError("La unidad indicada no existe en ese proyecto.");
    }

    if (entrada.isPrimary) {
      await pipeline.desmarcarPrincipales(dealId);
    }

    const fila = await pipeline.crearPropiedad({
      dealId,
      projectId: entrada.projectId,
      unitId: entrada.unitId ?? null,
      isPrimary: entrada.isPrimary ?? false,
      createdBy: actor.userId,
    });

    await auditoria.registrar(actor, { accion: "crear", entidad: "deal_property", entidadId: fila.id, despues: fila });

    return fila;
  });
}

/** Marcar unidad principal: misma regla que `asociarPropiedad`, marcar `isPrimary` desmarca cualquier otra fila del negocio. */
export async function marcarPropiedadPrincipal(
  deps: DepsPipeline,
  actor: Actor,
  alcance: PermissionScope,
  dealId: number,
  propId: number,
): Promise<PropiedadDeNegocio> {
  return deps.unidad.ejecutar(async ({ pipeline, auditoria }) => {
    await negocioAbiertoVisible(pipeline, dealId, actor, alcance);

    const anterior = await pipeline.buscarPropiedad(dealId, propId);
    if (!anterior) throw new NotFoundError();

    await pipeline.desmarcarPrincipales(dealId);
    const actualizada = await pipeline.marcarPrincipal(propId);

    await auditoria.registrar(actor, {
      accion: "editar",
      entidad: "deal_property",
      entidadId: propId,
      antes: anterior,
      despues: actualizada,
    });

    return actualizada;
  });
}

/** Retirada logica con motivo y principal sustituta; conserva el vinculo historico. */
export async function quitarPropiedad(
  deps: DepsPipeline,
  actor: Actor,
  alcance: PermissionScope,
  dealId: number,
  propId: number,
  motivo: string,
): Promise<void> {
  if (!motivo?.trim()) throw new ConflictError("Para retirar el interés hace falta un motivo.");
  await deps.unidad.ejecutar(async ({ pipeline, auditoria }) => {
    await negocioAbiertoVisible(pipeline, dealId, actor, alcance);

    const anterior = await pipeline.buscarPropiedad(dealId, propId);
    if (!anterior) throw new NotFoundError();
    if (anterior.isPrimary) throw new ConflictError("Selecciona otra propiedad principal antes de retirar este interés.");
    const intereses = await pipeline.propiedadesDelNegocio(dealId);
    const negocio = await pipeline.buscarNegocio(dealId);
    const etapa = negocio && await pipeline.buscarEtapa(negocio.stageId);
    if (etapa?.kind === "open" && ["preseleccion", "negociacion"].includes(etapa.slug) && intereses.length <= 1) throw new ConflictError("Esta etapa requiere conservar un interés activo.");

    await pipeline.eliminarPropiedad(propId, actor.userId, motivo.trim());

    await auditoria.registrar(actor, { accion: "eliminar", entidad: "deal_property", entidadId: propId, antes: anterior });
  });
}
