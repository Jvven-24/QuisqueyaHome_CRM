export const AUTOMATIZACIONES_TABS = [
  { id: "constructor", label: "Constructor" },
  { id: "monitor", label: "Monitor real" },
  { id: "copiloto", label: "Copiloto" },
] as const;

export type AutomatizacionesTab = (typeof AUTOMATIZACIONES_TABS)[number]["id"];

export function seleccionarTabAutomatizaciones(value: string | string[] | undefined): AutomatizacionesTab {
  const selected = Array.isArray(value) ? value[0] : value;
  return AUTOMATIZACIONES_TABS.find((tab) => tab.id === selected)?.id ?? "constructor";
}
