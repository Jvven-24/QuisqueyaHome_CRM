import type { OpcionUnidad } from "./propuestas";
export const UNIDADES_EJEMPLO: OpcionUnidad[] = [
  { id: 1, proyecto: "Proyecto de ejemplo", unidad: "A-101", tipo: "Apartamento", m2: 100, habitaciones: 2, banos: 2, piso: 1, vista: "Jardín", moneda: "USD", precioCents: 20000000, gastosCierreCents: 0, mantenimientoMensualCents: 0, entrega: "Por confirmar", disponible: true, plan: { separacionPct: 10, construccionPct: 30, entregaPct: 60 } },
  { id: 2, proyecto: "Proyecto de ejemplo", unidad: "B-202", tipo: "Apartamento", m2: 120, habitaciones: 3, banos: 2, piso: 2, vista: "Ciudad", moneda: "USD", precioCents: 24000000, gastosCierreCents: 0, mantenimientoMensualCents: 0, entrega: "Por confirmar", disponible: true, plan: { separacionPct: 10, construccionPct: 30, entregaPct: 60 } },
];
