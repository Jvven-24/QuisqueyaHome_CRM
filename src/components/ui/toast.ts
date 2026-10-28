"use client";

import { toast as sonnerToast } from "sonner";

export type TipoToast = "success" | "error" | "info" | "warning";

/** ID estable: Sonner actualiza el aviso existente cuando se repite el mismo evento. */
export function idToast(tipo: TipoToast, mensaje: string): string {
  let primero = 0x811c9dc5;
  let segundo = 0x9e3779b9;
  for (let index = 0; index < mensaje.length; index += 1) {
    const code = mensaje.charCodeAt(index);
    primero = Math.imul(primero ^ code, 0x01000193);
    segundo = Math.imul(segundo ^ (code + index), 0x85ebca6b);
  }
  return `qh:${tipo}:${mensaje.length}:${(primero >>> 0).toString(36)}:${(segundo >>> 0).toString(36)}`;
}

export function mostrarToast(tipo: TipoToast, mensaje: string): void {
  if (!mensaje.trim()) return;
  sonnerToast[tipo](mensaje, {
    id: idToast(tipo, mensaje),
    duration: tipo === "error" ? 6000 : 4500,
  });
}
