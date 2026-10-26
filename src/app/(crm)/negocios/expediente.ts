/**
 * Expediente de oportunidad (UI-015) y cierre (UI-018), lógica pura sobre los
 * datos reales que ya entrega el servidor (DTO por rol). Nada se inventa: un
 * dato que el rol no recibe queda «no visible», no «pendiente».
 */
import type { FilaNegocio, InteresNegocio } from "@/application/pipeline/puertos";
import type { Etapa } from "./logica.ts";

export type EstadoRequisito = "ok" | "falta" | "no-visible";
export type Requisito = { id: string; etiqueta: string; estado: EstadoRequisito; ayuda: string };

export type ReservaResumen = { status: string };

/**
 * Checklist de cierre: lo que `validarTransicion` exigirá al pasar a Negociación
 * y a Cierre, más la próxima acción (cada negocio activo la necesita) y, si el
 * rol puede verlas, la reserva confirmada.
 */
export function checklistCierre(negocio: FilaNegocio, propiedades: InteresNegocio[], reservas: ReservaResumen[] | null): Requisito[] {
  const principal = propiedades.find((p) => p.isPrimary);
  const req = (id: string, etiqueta: string, estado: EstadoRequisito, ayuda: string): Requisito => ({ id, etiqueta, estado, ayuda });
  const lista: Requisito[] = [
    req("proyecto", "Proyecto principal", principal ? "ok" : "falta", principal ? principal.projectName : "Agrega un proyecto de interés y márcalo como principal."),
    req("unidad", "Unidad concreta", principal?.unitId ? "ok" : "falta", principal?.unitCode ? `Unidad ${principal.unitCode}` : "Una reserva y un cierre identifican una unidad concreta."),
    negocio.amountCents === undefined
      ? req("monto", "Monto comercial", "no-visible", "Tu rol no recibe montos.")
      : req("monto", "Monto comercial", negocio.amountCents !== null ? "ok" : "falta", negocio.amountCents !== null ? "Definido" : "Indica el monto en «Editar»."),
    req("probabilidad", "Probabilidad", negocio.probability !== null ? "ok" : "falta", negocio.probability !== null ? `${negocio.probability}%` : "Indica la probabilidad en «Editar»."),
    negocio.commissionBasisPoints === undefined
      ? req("comision", "Comisión pactada", "no-visible", "Solo administración ve la comisión.")
      : req("comision", "Comisión pactada", negocio.commissionBasisPoints !== null ? "ok" : "falta", negocio.commissionBasisPoints !== null ? `${(negocio.commissionBasisPoints / 100).toFixed(2)}%` : "Indica la comisión en «Editar»."),
    req("fecha", "Fecha estimada de cierre", negocio.expectedCloseDate ? "ok" : "falta", negocio.expectedCloseDate ?? "Indica la fecha estimada en «Editar»."),
    req("proxima", "Próxima acción", negocio.nextActivityTitle ? "ok" : "falta", negocio.nextActivityTitle ?? "Cada negocio activo necesita una próxima acción o una excepción motivada."),
  ];
  if (reservas === null) lista.push(req("reserva", "Reserva confirmada", "no-visible", "Tu rol no consulta reservas."));
  else {
    const confirmada = reservas.some((r) => r.status === "confirmada");
    lista.push(req("reserva", "Reserva confirmada", confirmada ? "ok" : "falta", confirmada ? "Hay una reserva confirmada." : "Sin reserva confirmada para este negocio."));
  }
  return lista;
}

export function avanceChecklist(lista: Requisito[]): { cumplidos: number; evaluables: number; porcentaje: number } {
  const evaluables = lista.filter((r) => r.estado !== "no-visible").length;
  const cumplidos = lista.filter((r) => r.estado === "ok").length;
  return { cumplidos, evaluables, porcentaje: evaluables ? Math.round((cumplidos / evaluables) * 100) : 0 };
}

export type Paso = { id: number; nombre: string; estado: "hecho" | "actual" | "pendiente" };

/** Recorrido del embudo por posición. Un negocio cerrado muestra todas las etapas abiertas como hechas. */
export function pasosEmbudo(etapas: Etapa[], negocio: Pick<FilaNegocio, "stageId" | "stageKind">): Paso[] {
  const abiertas = [...etapas].filter((e) => e.kind === "open").sort((a, b) => a.position - b.position);
  const actual = etapas.find((e) => e.id === negocio.stageId);
  const pasos: Paso[] = abiertas.map((e) => ({
    id: e.id,
    nombre: e.name,
    estado: negocio.stageKind !== "open" ? "hecho" : e.id === negocio.stageId ? "actual" : actual && e.position < actual.position ? "hecho" : "pendiente",
  }));
  if (negocio.stageKind !== "open" && actual) pasos.push({ id: actual.id, nombre: actual.name, estado: "actual" });
  return pasos;
}

/** Valor ponderado de un negocio (monto × probabilidad), o null si falta uno de los dos o el rol no ve montos. */
export function valorPonderadoNegocio(n: Pick<FilaNegocio, "amountCents" | "probability">): number | null {
  if (n.amountCents === undefined || n.amountCents === null || n.probability === null) return null;
  return Math.round((n.amountCents * n.probability) / 100);
}
