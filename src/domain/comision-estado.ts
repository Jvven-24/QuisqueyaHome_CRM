/**
 * M9 · Comisiones — transiciones de estado (`docs/F3_ANALISIS_Y_PLAN.md` §3
 * hallazgo 6, decisión #36). Lógica pura, mismo estilo que
 * `transicion-etapa.ts`: sin base de datos, sin importar `infrastructure/`,
 * se prueba entera con `node --test`. El route handler
 * (`app/api/comisiones/[id]/route.ts`) hace las consultas y decide qué hacer
 * con el `ConflictError` que estas funciones lanzan.
 *
 * `commissions.status`: `pending → approved → paid`, y `pending|approved →
 * void`. Cualquier otra combinación —incluido quedarse en el mismo estado, o
 * mover `paid`/`void` a cualquier lado— choca con el estado actual del
 * registro, no con el formato de la entrada: por eso es un 409
 * (`ConflictError`), no un 400 de validación.
 */

import { ConflictError } from "./errors.ts";
import type { CommissionStatus } from "./catalogs.ts";

const TRANSICIONES_VALIDAS: Record<CommissionStatus, readonly CommissionStatus[]> = {
  pending: ["approved", "void"],
  approved: ["paid", "void"],
  paid: [],
  void: [],
};

/** Etiqueta en español para pantalla y CSV (`comisiones/vista.tsx`, `api/comisiones/export`); en minúscula alimenta los mensajes de `ConflictError` de aquí abajo. */
export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  paid: "Pagada",
  void: "Anulada",
};

/**
 * Valida que pasar una comisión de `actual` a `destino` sea una transición
 * permitida. No devuelve nada si lo es; lanza `ConflictError` con un mensaje
 * en español si no.
 */
export function validarTransicionComision(actual: CommissionStatus, destino: CommissionStatus): void {
  if (!TRANSICIONES_VALIDAS[actual].includes(destino)) {
    throw new ConflictError(
      `No se puede pasar una comisión ${COMMISSION_STATUS_LABELS[actual].toLowerCase()} a ${COMMISSION_STATUS_LABELS[destino].toLowerCase()}.`,
    );
  }
}

/**
 * El reparto broker/agencia solo es editable mientras la comisión está
 * `pending` (decisión #36): una vez aprobada, cambiar el reparto alteraría un
 * monto que ya se comunicó o que ya empezó a pagarse.
 */
export function validarRepartoEditable(estado: CommissionStatus): void {
  if (estado !== "pending") {
    throw new ConflictError(
      `El reparto solo se puede editar mientras la comisión está pendiente (esta está ${COMMISSION_STATUS_LABELS[estado].toLowerCase()}).`,
    );
  }
}
