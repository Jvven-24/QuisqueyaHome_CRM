/** Reglas por kind y slug: reordenar o renombrar el catálogo no cambia requisitos. */
import { ConflictError } from "./errors.ts";
import type { StageKind } from "./catalogs.ts";

export type ProximaAccion = {
  responsableId: number;
  fecha: string;
};

/**
 * Los campos de `deals` que estas reglas necesitan — deliberadamente no los
 * ~20 que tiene la tabla completa (`src/infrastructure/db/schema.ts`).
 * `etapaActualKind` es el `kind` de la etapa en la que el negocio está HOY,
 * antes de la transición que se está validando.
 */
export type Negocio = {
  etapaActualKind: StageKind;
  amountCents: number | null;
  probability: number | null;
  commissionBasisPoints: number | null;
  expectedCloseDate: string | null;
  lossReasonId: number | null;
};

/** La etapa a la que se quiere mover el negocio. Solo lo que estas reglas leen. */
export type EtapaDestino = {
  kind: StageKind;
  slug: string;
};

/**
 * Hechos que el route handler (paso 6) resuelve con consultas antes de llamar
 * a `validarTransicion` — esta función no sabe hacer ninguna de esas consultas
 * ni le hace falta:
 *
 * - `tieneActividadDeContacto`: ¿existe al menos una `activities` de contacto
 *   para este negocio? (no hay tabla de actividades en dominio puro).
 * - `proximaAccion`: la próxima acción vigente del negocio, o `null` si no hay.
 * - `cantidadPropiedades`: cuántas filas tiene en `deal_properties`.
 * - `tieneUnidadPrincipal`: ¿hay una fila en `deal_properties` con
 *   `isPrimary: true`?
 */
export type ContextoTransicion = {
  tieneActividadDeContacto: boolean;
  proximaAccion: ProximaAccion | null;
  cantidadPropiedades: number;
  tieneUnidadPrincipal: boolean;
};

/**
 * Valida que el negocio cumpla el requisito de §10.1 para entrar a
 * `etapaDestino`. No devuelve nada si la transición es válida; lanza
 * `ConflictError` con un mensaje en español que dice exactamente qué falta si
 * no lo es.
 *
 * **Un negocio ya cerrado no retrocede.** Un negocio en `kind: "won"` o
 * `kind: "lost"` es un hecho consumado: el cierre ya disparó la transacción de
 * §10.2 (meta, comisión, unidad vendida) y "reabrirlo" moviéndolo a otra etapa
 * dejaría esos efectos sueltos, sin una regla que los deshaga. Se decide
 * bloquearlo aquí, con un `ConflictError` explícito, en vez de confiar en que
 * el paso 6 filtre este caso antes de llamar: es una línea de código y evita
 * que un futuro punto de entrada (otro route handler, un script de
 * corrección) reabra un negocio cerrado por descuido.
 */
export function validarTransicion(
  negocio: Negocio,
  etapaDestino: EtapaDestino,
  contexto: ContextoTransicion,
): void {
  if (negocio.etapaActualKind !== "open") {
    throw new ConflictError(
      "Este negocio ya está cerrado (ganado o perdido) y no puede cambiar de etapa.",
    );
  }

  if (etapaDestino.kind === "won") {
    // Cierre: monto final y unidad principal son requisitos independientes
    // (§10.1) — que sobre uno no suple la falta del otro.
    if (negocio.amountCents == null) {
      throw new ConflictError(
        "Para cerrar el negocio hace falta el monto final.",
      );
    }
    if (!contexto.tieneUnidadPrincipal) {
      throw new ConflictError(
        "Para cerrar el negocio hace falta definir la unidad principal entre las propiedades de interés.",
      );
    }
    return;
  }

  if (etapaDestino.kind === "lost") {
    if (negocio.lossReasonId == null) {
      throw new ConflictError(
        "Para marcar el negocio como perdido hace falta un motivo del catálogo de motivos de pérdida.",
      );
    }
    return;
  }

  // Una etapa intermedia nueva no hereda reglas de la posición que ocupa.
  switch (etapaDestino.slug) {
    case "contactado":
      if (!contexto.tieneActividadDeContacto) {
        throw new ConflictError(
          "Para mover el negocio a esta etapa hace falta registrar al menos una actividad de contacto.",
        );
      }
      return;

    case "presentacion":
      if (contexto.proximaAccion == null) {
        throw new ConflictError(
          "Para mover el negocio a esta etapa hace falta una próxima acción con responsable y fecha.",
        );
      }
      return;

    case "preseleccion":
      if (contexto.cantidadPropiedades < 1) {
        throw new ConflictError(
          "Para mover el negocio a esta etapa hace falta al menos una propiedad de interés.",
        );
      }
      return;

    case "negociacion":
      // Los cuatro campos son requisitos independientes: cada uno se reporta
      // por separado para que el usuario sepa exactamente cuál falta, en vez
      // de un mensaje genérico de "datos incompletos".
      if (negocio.amountCents == null) {
        throw new ConflictError(
          "Para mover el negocio a esta etapa hace falta el monto.",
        );
      }
      if (negocio.probability == null) {
        throw new ConflictError(
          "Para mover el negocio a esta etapa hace falta la probabilidad.",
        );
      }
      if (negocio.commissionBasisPoints == null) {
        throw new ConflictError(
          "Para mover el negocio a esta etapa hace falta el porcentaje de comisión.",
        );
      }
      if (negocio.expectedCloseDate == null) {
        throw new ConflictError(
          "Para mover el negocio a esta etapa hace falta la fecha estimada de cierre.",
        );
      }
      return;

    default:
      // "Nuevo" u otra etapa abierta sin requisito propio en
      // §10.1: la transición no exige nada especial.
      return;
  }
}

/**
 * Fuera de alcance a propósito (§10.1, "regla adicional"): "todo negocio en
 * etapa abierta sin próxima acción entra en la cola de riesgo" no es una
 * regla de transición — es una *consulta* de listado para un panel (Inicio o
 * Reportes, fases posteriores a F1) que recorre negocios ya guardados y no
 * tiene nada que validar en el momento de cambiar de etapa. No se implementa
 * aquí ni en ningún otro archivo de este paso.
 */
