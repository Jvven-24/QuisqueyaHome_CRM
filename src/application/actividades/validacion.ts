import { z } from "zod";

export const tituloActividad = z.string({ error: "Escribe el título." }).trim().min(1, "Escribe el título.").max(300, "Usa como máximo 300 caracteres.");

/** Compartida por los formularios: no depende de la validación nativa del navegador. */
export function erroresActividad(datos: { title: unknown; day?: string; time?: string }): Record<string, string> {
  const errores: Record<string, string> = {};
  const titulo = tituloActividad.safeParse(datos.title);
  if (!titulo.success) errores.title = titulo.error.issues[0]!.message;
  if (datos.day !== undefined && !z.iso.date().safeParse(datos.day).success) errores.day = "Indica una fecha válida.";
  if (datos.time !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(datos.time)) errores.time = "Indica una hora válida.";
  return errores;
}
