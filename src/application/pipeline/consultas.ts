import { z } from "zod";
import { NotFoundError, ValidationError } from "../../domain/errors.ts";
import { scopeFor, type Actor } from "../../domain/rbac.ts";
import { STAGE_KINDS } from "../../domain/catalogs.ts";
import { assertMonetaryTotals } from "../reportes/consultas.ts";
import type { CatalogosNegocios, CursorNegocios, FichaNegocio, FilaNegocio, FiltrosNegocios, LecturaPipeline, ListaNegocios, OrdenNegocios } from "./puertos.ts";

// Límites técnicos provisionales S-309; no cifras de negocio ni constantes en la vista.
export const PAGINA_NEGOCIOS = 50;
export const MAX_PAGINA_NEGOCIOS = 200;
export const ORDEN_NEGOCIOS: OrdenNegocios = { campo: "createdAt", direccion: "desc" };
export const ZONA_NEGOCIOS = "America/Santo_Domingo";
const id = z.number().int().positive().max(2147483647);
const dinero = z.number().int().nonnegative().safe();
const fecha = z.iso.date();
const filtrosSchema = z.object({
  historicasSinUnidad: z.boolean().optional(),
  projectId: id.optional(), brokerId: id.optional(), stageId: id.optional(),
  resultado: z.enum(STAGE_KINDS).optional(), moneda: z.string().regex(/^[A-Z]{3}$/).optional(),
  montoMin: dinero.optional(), montoMax: dinero.optional(), desde: fecha.optional(), hasta: fecha.optional(),
  campoFecha: z.enum(["createdAt", "closedAt", "expectedCloseDate"]).optional(),
}).strict().refine(f => !(f.desde && f.hasta && f.desde > f.hasta))
  .refine(f => !(f.montoMin !== undefined && f.montoMax !== undefined && f.montoMin > f.montoMax));
const ordenSchema = z.object({ campo: z.enum(["createdAt", "amountCents", "id"]), direccion: z.enum(["asc", "desc"]) }).strict();
const cursorSchema = z.object({ id, valor: z.union([z.iso.datetime(), z.number().int().safe().min(-1)]), orden: ordenSchema }).strict();
export function filtrosNegocios(entrada: FiltrosNegocios = {}): FiltrosNegocios {
  const result = filtrosSchema.safeParse(entrada);
  if (!result.success) throw new ValidationError("Filtros de negocios inválidos.");
  return result.data;
}
/** Política única de proyección; el adaptador la aplica ANTES del SELECT. */
export function camposNegocios(actor: Actor) {
  const admin = actor.roleSlug === "admin";
  return {
    monto: admin || actor.roleSlug === "broker",
    precio: admin && scopeFor(actor, "unit_real_price", "view") !== "none",
    comision: admin && scopeFor(actor, "commissions", "view") !== "none",
  };
}
/** Defensa del DTO ante un puerto incorrecto: whitelist, sin spread de la fila. */
export function proyectarNegocio(actor: Actor, n: FilaNegocio): FilaNegocio {
  const dto: FilaNegocio = {
    id: n.id, contactId: n.contactId, contactName: n.contactName, contactPhone: n.contactPhone,
    contactPhoneDisplay: n.contactPhoneDisplay, sourceName: n.sourceName, brokerId: n.brokerId,
    brokerName: n.brokerName, stageId: n.stageId, stageKind: n.stageKind, operationType: n.operationType,
    currency: n.currency, probability: n.probability, expectedCloseDate: n.expectedCloseDate,
    nextActivityTitle: n.nextActivityTitle, nextActivityStartsAt: n.nextActivityStartsAt,
    stageChangedAt: n.stageChangedAt, closedAt: n.closedAt, lossReasonId: n.lossReasonId,
    lossComment: n.lossComment, notes: n.notes, createdAt: n.createdAt,
    proyectoPrincipal: n.proyectoPrincipal ? { dealId: n.id, projectName: n.proyectoPrincipal.projectName,
      unitCode: n.proyectoPrincipal.unitCode, unitId: n.proyectoPrincipal.unitId } : null,
  };
  const campos = camposNegocios(actor);
  if (campos.monto) dto.amountCents = n.amountCents;
  if (campos.comision) { dto.commissionBasisPoints = n.commissionBasisPoints; dto.totalCommissionCents = n.totalCommissionCents; }
  assertMonetaryTotals(dto);
  return dto;
}
function validarConsulta(actor: Actor, entrada: FiltrosNegocios, orden: OrdenNegocios) {
  const filtros = filtrosNegocios(entrada);
  if (!ordenSchema.safeParse(orden).success) throw new ValidationError("Orden de negocios inválido.");
  if (!camposNegocios(actor).monto && (orden.campo === "amountCents" || filtros.montoMin !== undefined || filtros.montoMax !== undefined)) {
    throw new ValidationError("Filtro financiero no autorizado.");
  }
  return filtros;
}
export async function resumirNegocios(repo: LecturaPipeline, actor: Actor, entrada: FiltrosNegocios = {}) {
  const filtros = validarConsulta(actor, entrada, ORDEN_NEGOCIOS);
  const scope = scopeFor(actor, "deals", "view");
  if (scope === "none") return [];
  const filas = await repo.resumir(actor, scope, filtros);
  const result = filas.map(n => camposNegocios(actor).monto
    ? { stageId: n.stageId, kind: n.kind, currency: n.currency, count: n.count, amountCents: n.amountCents }
    : { stageId: n.stageId, kind: n.kind, currency: n.currency, count: n.count });
  assertMonetaryTotals(result);
  return result;
}
export async function consultarListaNegocios(repo: LecturaPipeline, actor: Actor, entrada: FiltrosNegocios = {}, orden: OrdenNegocios = ORDEN_NEGOCIOS, cursor: CursorNegocios | null = null, limite = PAGINA_NEGOCIOS): Promise<ListaNegocios> {
  const filtros = validarConsulta(actor, entrada, orden);
  if (!Number.isInteger(limite) || limite < 1 || limite > MAX_PAGINA_NEGOCIOS) throw new ValidationError("Límite de negocios inválido.");
  if (cursor !== null && (!cursorSchema.safeParse(cursor).success || cursor.orden.campo !== orden.campo || cursor.orden.direccion !== orden.direccion ||
    (orden.campo === "createdAt" ? typeof cursor.valor !== "string" : typeof cursor.valor !== "number") ||
    (orden.campo === "id" && cursor.valor !== cursor.id))) throw new ValidationError("Cursor de negocios inválido.");
  const scope = scopeFor(actor, "deals", "view");
  if (scope === "none") return { filas: [], siguiente: null, resumen: [] };
  const [rows, resumen] = await Promise.all([
    repo.listar(actor, scope, filtros, orden, cursor, limite + 1), resumirNegocios(repo, actor, filtros),
  ]);
  const filas = rows.slice(0, limite).map(n => proyectarNegocio(actor, n));
  const last = filas.at(-1);
  const siguiente = rows.length > limite && last ? { id: last.id, orden, valor:
    orden.campo === "createdAt" ? last.createdAt.toISOString() : orden.campo === "id" ? last.id : last.amountCents ?? -1 } : null;
  return { filas, siguiente, resumen };
}
/** Tablero consume el mismo contrato acotado; el cursor evita cortes silenciosos. */
export async function consultarTableroNegocios(repo: LecturaPipeline, actor: Actor, filtros: FiltrosNegocios = {}, cursor: CursorNegocios | null = null) {
  return consultarListaNegocios(repo, actor, filtros, ORDEN_NEGOCIOS, cursor, MAX_PAGINA_NEGOCIOS);
}
/** S-303-H: legado ganado sin fila en unit_sales; paginado y con el DTO por rol. */
export async function consultarVentasHistoricasSinUnidad(repo: LecturaPipeline, actor: Actor, cursor: CursorNegocios | null = null, limite = PAGINA_NEGOCIOS): Promise<ListaNegocios> {
  return consultarListaNegocios(repo, actor, { historicasSinUnidad: true }, { campo: "id", direccion: "asc" }, cursor, limite);
}
export async function consultarCatalogosNegocios(repo: LecturaPipeline, actor: Actor): Promise<CatalogosNegocios> {
  const scope = scopeFor(actor, "deals", "view");
  return scope === "none" ? { etapas: [], motivos: [], brokers: [], proyectos: [] } : repo.catalogos(actor, scope);
}
export async function consultarFichaNegocio(repo: LecturaPipeline, actor: Actor, negocioId: number): Promise<FichaNegocio> {
  if (!id.safeParse(negocioId).success) throw new ValidationError("Identificador de negocio inválido.");
  const scope = scopeFor(actor, "deals", "view");
  const ficha = scope === "none" ? undefined : await repo.ficha(actor, scope, negocioId);
  if (!ficha) throw new NotFoundError();
  const propiedades = ficha.propiedades.map(p => {
    const dto = { id: p.id, projectId: p.projectId, projectName: p.projectName, unitId: p.unitId, unitCode: p.unitCode, isPrimary: p.isPrimary };
    return camposNegocios(actor).precio ? { ...dto, realPriceCents: p.realPriceCents } : dto;
  });
  const dto = { historialEtapas: (ficha.historialEtapas ?? []).map(h => ({ id: h.id, desde: h.desde, hasta: h.hasta, autor: h.autor, fecha: h.fecha })), negocio: proyectarNegocio(actor, ficha.negocio), propiedades, proyectosDisponibles: ficha.proyectosDisponibles.map(p => ({ id: p.id, name: p.name, unidades: p.unidades.map(u => ({ id: u.id, code: u.code })) })) };
  assertMonetaryTotals(dto);
  return dto;
}
