export const PERMISSION_MODULES = [
  { id: "comercial", label: "Comercial", resources: ["dashboard", "leads", "contacts", "deals", "activities"] },
  { id: "inventario", label: "Propiedades e inventario", resources: ["projects", "units", "unit_real_price", "construction_phases"] },
  { id: "equipo", label: "Equipo y desempeño", resources: ["brokers", "academy", "goals"] },
  { id: "finanzas", label: "Finanzas", resources: ["commissions", "holds", "reservations", "payment_plans", "payments", "payment_verifications", "reconciliations", "financial_approvals", "refunds", "commission_rules", "commission_entries", "payouts", "financial_jobs"] },
  { id: "comunicacion", label: "Comunicación y análisis", resources: ["communications", "reports", "global_metrics"] },
  { id: "administracion", label: "Administración", resources: ["settings", "users", "roles", "audit_log", "integrations"] },
] as const;

export type PermissionModuleId = (typeof PERMISSION_MODULES)[number]["id"];

export function agruparRecursosPorModulo(resources: readonly string[]) {
  const pendientes = new Set(resources);
  const grupos: { id: string; label: string; resources: string[] }[] = PERMISSION_MODULES.map((modulo) => ({
    id: modulo.id,
    label: modulo.label,
    resources: modulo.resources.filter((resource) => {
      if (!pendientes.has(resource)) return false;
      pendientes.delete(resource);
      return true;
    }),
  })).filter((modulo) => modulo.resources.length > 0);

  if (pendientes.size > 0) {
    grupos.push({
      id: "otros" as const,
      label: "Otros recursos",
      resources: [...pendientes],
    });
  }

  return grupos;
}
