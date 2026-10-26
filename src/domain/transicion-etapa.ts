/**
 * Reglas de negocio de cambio de etapa (M3a, `MAPEO_FRONTEND_CRM.md` §10.1).
 * Lógica pura, sin base de datos: recibe todo lo que necesita ya resuelto —
 * el route handler del paso 6 (M3b) hace las consultas antes de llamar aquí y
 * decide qué hacer con el `ConflictError` que esta función lanza.
 *
 * Igual que `rbac.ts`, este archivo no importa nada de `infrastructure/`, ni
 * de Drizzle ni de Next: se prueba entero con `node --test`.
 *
 * ## Por qué se engancha a `kind` y a `position`, nunca al nombre de la etapa
 *
 * Decisión #1 (`MAPEO_FRONTEND_CRM.md` §9): las etapas viven en la tabla
 * `pipeline_stages` y son renombrables desde M13. Un `if (etapa.name ===
 * "Contactado")` se rompe el día que alguien le cambie el nombre a "Primer
 * contacto" en Configuración, y se rompe en silencio porque el `if` deja de
 * cumplirse sin que nadie lo note en un `WHERE` ni en un tipo.
 *
 * `kind` (`open`/`won`/`lost`) distingue de sobra Cierre y Perdido. Pero las
 * cuatro etapas intermedias del embudo (Contactado, Presentación,
 * Preselección, Negociación) son todas `kind: "open"` — `kind` no alcanza
 * para distinguirlas entre sí. Lo que sí es estructural y no depende del
 * nombre es su **posición** en el embudo: la que hoy se llama "Contactado" es,
 * y seguirá siendo mientras el embudo tenga esta forma, la segunda etapa
 * (`position` inmediatamente posterior a la primera). Por eso las constantes
 * de abajo se documentan con la posición real sembrada en `db/seed.sql`, no
 * con el nombre.
 */

import { ConflictError } from "./errors.ts";
import type { StageKind } from "./catalogs.ts";

/**
 * Posiciones de las etapas abiertas intermedias, tal como las siembra
 * `db/seed.sql`: 1 Nuevo, 2 Contactado, 3 Presentación, 4 Preselección,
 * 5 Negociación, 6 Cierre (`won`), 7 Perdido (`lost`). Si algún día se inserta
 * una etapa nueva entre medio, estas posiciones se corren y hay que revisar
 * `db/seed.sql` de nuevo — es el mismo costo que tendría corregir un nombre,
 * pero aquí el compilador no puede avisar porque es un dato, no un tipo.
 */
const STAGE_POSITION = {
  /** "Contactado": exige actividad de contacto (§10.1, fila 1). */
  contacto: 2,
  /** "Presentación": exige próxima acción con responsable y fecha. */
  presentacion: 3,
  /** "Preselección": exige al menos una propiedad de interés. */
  preseleccion: 4,
  /** "Negociación": exige monto, probabilidad, comisión y fecha estimada. */
  negociacion: 5,
} as const;

/**
 * Próxima acción del negocio: quién la hace y cuándo. Vive en `deals` como
 * `next_activity_id` (sin FK, decisión #8) o se resuelve en el contexto —
 * a esta función le da igual de dónde salga, solo necesita el resultado.
 */
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
  position: number;
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

  // etapaDestino.kind === "open": el requisito depende de en qué punto del
  // embudo cae, no de su nombre — ver la nota de posiciones arriba.
  switch (etapaDestino.position) {
    case STAGE_POSITION.contacto:
      if (!contexto.tieneActividadDeContacto) {
        throw new ConflictError(
          "Para mover el negocio a esta etapa hace falta registrar al menos una actividad de contacto.",
        );
      }
      return;

    case STAGE_POSITION.presentacion:
      if (contexto.proximaAccion == null) {
        throw new ConflictError(
          "Para mover el negocio a esta etapa hace falta una próxima acción con responsable y fecha.",
        );
      }
      return;

    case STAGE_POSITION.preseleccion:
      if (contexto.cantidadPropiedades < 1) {
        throw new ConflictError(
          "Para mover el negocio a esta etapa hace falta al menos una propiedad de interés.",
        );
      }
      return;

    case STAGE_POSITION.negociacion:
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
      // Posición 1 ("Nuevo") u otra etapa abierta sin requisito propio en
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
