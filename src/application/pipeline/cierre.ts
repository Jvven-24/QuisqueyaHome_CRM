/**
 * M3b · Pipeline — cierre transaccional (`MAPEO_FRONTEND_CRM.md` §10.2,
 * `docs/F1_ANALISIS_Y_PLAN.md` paso 6).
 *
 * Los ocho pasos, en el orden del mapeo. Vive aparte de `casos-de-uso.ts`
 * porque el cambio de etapa ya hace bastante resolviendo el
 * `ContextoTransicion` de `validarTransicion` — separar "cambio simple de
 * etapa" de "cerrar el negocio" en dos funciones es más fácil de leer que un
 * único `if` gigante con las dos ramas mezcladas.
 *
 * **Todo esto corre dentro de la unidad de trabajo que abre el caso de uso.**
 * Esta función recibe el juego de repositorios ya ligado a esa transacción,
 * nunca abre la suya: si cualquiera de los ocho pasos falla, la base revierte
 * los anteriores porque comparten la misma transacción — no hay lógica de
 * "deshacer" escrita a mano en ningún sitio de este archivo, y no debería hacer
 * falta.
 *
 * Las reglas de cálculo (`calcularComision`, `evaluarNivelBroker`, los repartos
 * por defecto, `fechaSantoDomingo`) son del dominio y se reutilizan tal cual.
 */

import { ConflictError, NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import {
  calcularComision,
  evaluarNivelBroker,
  DEFAULT_AGENCY_SHARE_BASIS_POINTS,
  DEFAULT_BROKER_SHARE_BASIS_POINTS,
} from "../../domain/cierre-negocio.ts";
import { fechaSantoDomingo } from "../../domain/zona-horaria.ts";
import type { EtapaPipeline, Negocio, PropiedadDeNegocio, ReposPipeline } from "./puertos.ts";

/**
 * Cierra un negocio como ganado. El caso de uso ya llamó a `validarTransicion`
 * con los datos leídos al principio de la transacción — pero entre esa lectura y
 * este punto puede haber pasado una fracción de segundo en la que **otra**
 * petición para el mismo negocio hizo exactamente lo mismo (dos clientes
 * arrastrando la misma tarjeta casi a la vez, o un doble clic). Por eso el
 * primer paso de aquí no es de los ocho de §10.2: es la segunda defensa contra
 * el doble cierre (la primera es `validarTransicion` bloqueando un negocio que
 * ya no está `open`; la tercera es `commissions_deal_unq` en la base).
 */
export async function cerrarNegocioGanado(
  { pipeline, auditoria }: ReposPipeline,
  actor: Actor,
  params: {
    dealId: number;
    etapaDestino: EtapaPipeline;
    /** Fila de `deal_properties` con `isPrimary: true` y `unitId` resuelto — ya la validó `validarTransicion` vía `tieneUnidadPrincipal`. */
    unidadPrincipal: PropiedadDeNegocio & { unitId: number };
    /** `amountCents` ya resuelto (el del body si vino, si no el que ya tenía el negocio). `validarTransicion` garantiza que no es `null`. */
    amountCentsFinal: number;
  },
): Promise<Negocio> {
  const { dealId, etapaDestino, unidadPrincipal, amountCentsFinal } = params;

  // --- Defensa 2 contra el doble cierre ------------------------------------
  // `bloquearNegocio` es el `SELECT ... FOR UPDATE` del puerto: bloquea la fila
  // hasta que esta transacción termine. Si dos peticiones llegaron casi juntas,
  // la segunda espera aquí a que la primera confirme (o revierta) — y cuando
  // por fin lee, ve la etapa *real*, no la que leyó el caso de uso antes de que
  // la otra petición ganara la carrera. Por eso NO se usa `buscarNegocio`, que
  // lee sin bloquear: sería una defensa que solo parece estar.
  const dealBloqueado = await pipeline.bloquearNegocio(dealId);
  if (!dealBloqueado || dealBloqueado.deletedAt) throw new NotFoundError();

  const etapaActual = await pipeline.buscarEtapa(dealBloqueado.stageId);
  if (!etapaActual || etapaActual.kind !== "open") {
    throw new ConflictError(
      "Este negocio ya fue cerrado o marcado como perdido por otra operación mientras se procesaba este cambio.",
    );
  }

  // Guardia adicional, fuera de `validarTransicion` a propósito: la tabla
  // `commissions.commission_basis_points` es `NOT NULL` (`db/schema.ts`), así
  // que sin este dato el paso 6 rompería con un error de Postgres poco claro
  // en vez de un 409 que el usuario entiende. `validarTransicion` solo exige
  // `commissionBasisPoints` para *entrar* a Negociación (§10.1); un negocio
  // puede saltarse esa etapa y llegar a Cierre sin haber pasado por ahí.
  if (dealBloqueado.commissionBasisPoints == null) {
    throw new ConflictError(
      "Para cerrar el negocio hace falta el porcentaje de comisión.",
    );
  }

  const now = new Date();
  // Hora de Santo Domingo, no la del servidor (issue #24): en un VPS en UTC,
  // un cierre nocturno contaría en el día o el mes siguiente.
  const fechaCierre = fechaSantoDomingo(now);
  const [anio, mes] = fechaCierre.split("-").map(Number) as [number, number];

  // --- Paso 1: sellar closed_at y el monto final ---------------------------
  const dealCerrado = await pipeline.sellarCierre({
    dealId,
    etapaDestinoId: etapaDestino.id,
    cuando: now,
    amountCents: amountCentsFinal,
    actorId: actor.userId,
  });

  // --- Paso 2: deal_stage_history -------------------------------------------
  await pipeline.registrarHistorialDeEtapa({
    dealId,
    desdeEtapaId: etapaActual.id,
    hastaEtapaId: etapaDestino.id,
    actorId: actor.userId,
  });

  // --- Paso 3: unidad principal → sold / reserved --------------------------
  // Un alquiler no "se vende": la unidad queda reservada para el inquilino, no
  // fuera del inventario disponible de forma permanente como una venta. Una
  // venta sí agota la unidad del inventario vendible. Es la lectura más
  // simple de `operation_type` sobre `unit_status` que no inventa un tercer
  // estado que el esquema (congelado) no tiene.
  const estadoUnidad = dealCerrado.operationType === "rent" ? "reserved" : "sold";
  await pipeline.marcarUnidad({ unitId: unidadPrincipal.unitId, estado: estadoUnidad, actorId: actor.userId });

  // --- Paso 4: metas del broker y de la compañía ---------------------------
  // Dos filas distintas, cada una con su propio índice único parcial en el
  // esquema (`goals_broker_period_unq`, `goals_company_period_unq`) — el
  // `INSERT ... ON CONFLICT` del adaptador es atómico en Postgres: no hay
  // ventana entre "leer si existe" y "escribir" en la que dos cierres del mismo
  // periodo se pisen entre sí, que es justo el problema que un `SELECT` +
  // `UPDATE` manual tendría aquí. Por eso el puerto expone UN método y este
  // archivo no compone "buscar meta" + "crear/actualizar meta".
  if (dealCerrado.brokerId != null) {
    await pipeline.incrementarMetaAlcanzada({
      brokerId: dealCerrado.brokerId,
      anio,
      mes,
      amountCents: amountCentsFinal,
      actorId: actor.userId,
    });
  }
  await pipeline.incrementarMetaAlcanzada({
    brokerId: null,
    anio,
    mes,
    amountCents: amountCentsFinal,
    actorId: actor.userId,
  });

  // --- Paso 5: broker_profiles.annual_sales_cents + nivel ------------------
  if (dealCerrado.brokerId != null) {
    const perfil = await pipeline.buscarPerfilDeBroker(dealCerrado.brokerId);
    // Un usuario con rol distinto de "broker" (p. ej. quien cierra el negocio
    // es el administrador, actuando por un broker sin perfil creado) no tiene
    // fila en `broker_profiles` — el esquema lo permite (no hay perfil para
    // todos los `users`). No hay nada que recalcular en ese caso; el cierre
    // no debe fallar por la ausencia de un perfil que no le corresponde tener.
    if (perfil) {
      // Recalculado con un SUM en vez de incrementado (issue #24): nadie
      // reiniciaba `annual_sales_cents`, así que acumulaba de por vida y el
      // nivel del broker solo podía subir. El `SUM` (en SQL, con la zona
      // horaria de Santo Domingo, dentro del adaptador) ya ve este negocio
      // (paso 1 lo dejó `closedAt: now` dentro de esta misma transacción), así
      // que no hace falta sumarle `amountCentsFinal` aparte.
      const nuevoAnual = await pipeline.totalGanadoDelAnio(dealCerrado.brokerId, anio);
      await pipeline.actualizarPerfilDeBroker({
        brokerId: dealCerrado.brokerId,
        annualSalesCents: nuevoAnual,
        nivel: evaluarNivelBroker(nuevoAnual),
      });
    }
  }

  // --- Paso 6: commissions, estado pending ---------------------------------
  const { totalCommissionCents, brokerAmountCents, agencyAmountCents } = calcularComision({
    saleAmountCents: amountCentsFinal,
    commissionBasisPoints: dealCerrado.commissionBasisPoints!,
    brokerShareBasisPoints: DEFAULT_BROKER_SHARE_BASIS_POINTS,
    agencyShareBasisPoints: DEFAULT_AGENCY_SHARE_BASIS_POINTS,
  });
  await pipeline.crearComision({
    dealId,
    brokerId: dealCerrado.brokerId,
    currency: dealCerrado.currency,
    saleAmountCents: amountCentsFinal,
    commissionBasisPoints: dealCerrado.commissionBasisPoints!,
    totalCommissionCents,
    brokerShareBasisPoints: DEFAULT_BROKER_SHARE_BASIS_POINTS,
    agencyShareBasisPoints: DEFAULT_AGENCY_SHARE_BASIS_POINTS,
    brokerAmountCents,
    agencyAmountCents,
    status: "pending",
    closedDate: fechaCierre,
    createdBy: actor.userId,
    updatedBy: actor.userId,
  });
  // Si dos cierres llegaran a ejecutar este `insert` para el mismo `dealId`
  // (no debería pasar: la defensa 2 de arriba ya lo impide), `commissions_deal_unq`
  // —índice único ya existente en el esquema— es quien lo detiene en último
  // término, a nivel de base de datos y no de una condición que alguien podría
  // desactivar sin darse cuenta.

  // --- Paso 7: cancelar actividades futuras pendientes ---------------------
  // `startsAt` es nulable: una pendiente sin fecha no es "pasada", así que
  // "posterior a ahora" sola la deja viva para siempre. El adaptador la trata
  // como futura.
  await pipeline.cancelarActividadesFuturasPendientes({ dealId, ahora: now, actorId: actor.userId });

  // --- Paso 8: auditoría -----------------------------------------------------
  await auditoria.registrar(actor, {
    accion: "cerrar",
    entidad: "deal",
    entidadId: dealId,
    antes: dealBloqueado,
    despues: dealCerrado,
  });

  return dealCerrado;
}
