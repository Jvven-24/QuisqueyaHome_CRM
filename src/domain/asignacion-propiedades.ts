/**
 * M7 · Brokers — diff puro de "Asignar propiedades" (`docs/F3_ANALISIS_Y_PLAN.md`
 * §4.4, decisión #38, issue #33).
 *
 * El route handler (`api/brokers/[id]/proyectos/route.ts`) sabe qué proyectos
 * están asignados hoy y cuáles pidió el formulario; lo único que vale la pena
 * probar sin base de datos es esta resta de conjuntos, para no actualizar
 * filas que ya estaban como deben quedar (criterio del issue: "solo
 * actualizar filas cuyo broker_id realmente cambia").
 */
export function diffAsignacion(
  asignadosActualmente: readonly number[],
  seleccionados: readonly number[],
): { aAsignar: number[]; aQuitar: number[] } {
  const actuales = new Set(asignadosActualmente);
  const elegidos = new Set(seleccionados);
  return {
    aAsignar: seleccionados.filter((id) => !actuales.has(id)),
    aQuitar: asignadosActualmente.filter((id) => !elegidos.has(id)),
  };
}
