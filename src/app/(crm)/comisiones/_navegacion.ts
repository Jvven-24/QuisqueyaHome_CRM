import type { CommissionStatus } from "@/domain/catalogs";

type EstadoTabComision = CommissionStatus | "todos";

type ConteosComisiones = Record<EstadoTabComision, number>;

const estados: readonly { value: EstadoTabComision; label: string }[] = [
  { value: "todos", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "paid", label: "Pagadas" },
  { value: "void", label: "Anuladas" },
];

export function enlacesEstadoComisiones(
  pathname: string,
  currentSearch: string,
  counts: ConteosComisiones,
) {
  return estados.map(({ value, label }) => {
    const params = new URLSearchParams(currentSearch);
    if (value === "todos") params.delete("estado");
    else params.set("estado", value);
    params.set("tab", value);
    return { href: `${pathname}?${params.toString()}`, label: `${label} (${counts[value]})`, value };
  });
}
