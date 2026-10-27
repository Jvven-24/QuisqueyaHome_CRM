"use client";
import { ModuleTabs } from "@/components/modulo";
import { financeTabsFor, type FinanceSection } from "./_navegacion";

export function NavegacionFinanzas({ section }: { section: FinanceSection }) {
  return <ModuleTabs label={section === "comisiones" ? "Secciones de comisiones" : "Secciones de reservas"} items={financeTabsFor(section)} className="mb-4" />;
}
