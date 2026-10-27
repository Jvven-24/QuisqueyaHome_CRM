import type { ModuleTabItem } from "../../../../components/modulo/module-tabs";

export type FinanceSection = "comisiones" | "reservas";

const sectionTabs: Record<FinanceSection, readonly ModuleTabItem[]> = {
  comisiones: [
    { href: "/comisiones", label: "Libro de comisiones" },
    { href: "/comisiones/reglas", label: "Reglas y reparto", match: "prefix" },
    { href: "/comisiones/liquidaciones", label: "Liquidaciones", match: "prefix" },
    { href: "/metas", label: "Metas", match: "prefix" },
  ],
  reservas: [
    { href: "/reservas", label: "Reservas" },
    { href: "/reservas/holds", label: "Holds temporales", match: "prefix" },
    { href: "/reservas/cartera", label: "Cartera y planes", match: "prefix" },
    { href: "/reservas/conciliacion", label: "Conciliación", match: "prefix" },
    { href: "/reservas/excepciones", label: "Excepciones", match: "prefix" },
    { href: "/reservas/documentos", label: "Documentos fiscales", match: "prefix" },
  ],
};

export function financeTabsFor(section: FinanceSection): readonly ModuleTabItem[] {
  return sectionTabs[section];
}
