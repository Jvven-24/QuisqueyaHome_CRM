import { fechaSantoDomingo, horaSantoDomingo } from "../../../../domain/zona-horaria.ts";
import type { Urgencia } from "./tipos";

/** Extrae las líneas de checklist `- [ ] texto` o `- [x] texto` y las notas libres de la descripción. */
export function parsearDescripcionChecklist(description?: string | null): {
  notasLibres: string;
  items: Array<{ indiceLinea: number; texto: string; completado: boolean }>;
} {
  if (!description) return { notasLibres: "", items: [] };
  const lineas = description.split("\n");
  const items: Array<{ indiceLinea: number; texto: string; completado: boolean }> = [];
  const libres: string[] = [];

  lineas.forEach((linea, idx) => {
    const match = linea.match(/^\s*[-*]\s*\[([ xX])\]\s*(.+)$/);
    if (match) {
      items.push({
        indiceLinea: idx,
        completado: match[1]!.toLowerCase() === "x",
        texto: match[2]!.trim(),
      });
    } else {
      libres.push(linea);
    }
  });

  return {
    notasLibres: libres.join("\n").trim(),
    items,
  };
}

/** Construye una descripción combinando notas libres y pasos de checklist To-Do. */
export function serializarDescripcionChecklist(
  notasLibres: string,
  items: ReadonlyArray<{ texto: string; completado: boolean }>,
): string {
  const bloques: string[] = [];
  const notasLimpias = notasLibres.trim();
  if (notasLimpias) {
    bloques.push(notasLimpias);
  }
  const itemsLimpios = items.filter((i) => i.texto.trim().length > 0);
  if (itemsLimpios.length > 0) {
    bloques.push(
      itemsLimpios
        .map((item) => `- [${item.completado ? "x" : " "}] ${item.texto.trim()}`)
        .join("\n"),
    );
  }
  return bloques.join("\n\n");
}

export function calcularUrgencia(startsAt: Date | null, hoy: string): Urgencia {
  if (!startsAt) return "proximas";
  const fecha = fechaSantoDomingo(startsAt);
  if (fecha < hoy) return "vencidas";
  if (fecha === hoy) return "hoy";
  return "proximas";
}

export function etiquetaFecha(
  startsAt: Date | null,
  hoy: string,
): { texto: string; tono: "red" | "gold" | "green" | "neutral" } {
  if (!startsAt) {
    return { texto: "Sin fecha límite", tono: "neutral" };
  }
  const fecha = fechaSantoDomingo(startsAt);
  const hora = horaSantoDomingo(startsAt);
  if (fecha < hoy) {
    return { texto: `Vencida · ${fecha} (${hora})`, tono: "red" };
  }
  if (fecha === hoy) {
    return { texto: `Para hoy · ${hora}`, tono: "gold" };
  }
  return { texto: `Programada · ${fecha} (${hora})`, tono: "green" };
}

export function estiloPrioridad(priority: string): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (priority) {
    case "high":
      return {
        label: "Alta Prioridad",
        bg: "bg-[#fef2f2]",
        text: "text-[#991b1b]",
        border: "border-[#fecaca]",
      };
    case "low":
      return {
        label: "Baja Prioridad",
        bg: "bg-[#f8fafc]",
        text: "text-[#475569]",
        border: "border-[#e2e8f0]",
      };
    default:
      return {
        label: "Prioridad Normal",
        bg: "bg-[#fffbeb]",
        text: "text-[#92400e]",
        border: "border-[#fde68a]",
      };
  }
}
