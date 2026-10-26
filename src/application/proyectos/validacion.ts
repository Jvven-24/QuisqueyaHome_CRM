import { z } from "zod";

export const nombreProyecto = z.string({ error: "Escribe el nombre del proyecto." })
  .trim().min(1, "Escribe el nombre del proyecto.").max(200, "Usa como máximo 200 caracteres.")
  .refine((nombre) => !/[<>]/.test(nombre), "Escribe el nombre sin etiquetas HTML ni los signos < y >.");

export const fechaProyecto = z.iso.date({ error: "Indica una fecha válida." });
export const monedaProyecto = z.enum(["USD", "DOP"], { error: "Selecciona USD o DOP." });

/** El texto de fixtures identificados no es una descripción comercial. */
export function descripcionComercial(descripcion: string | null | undefined): string | null {
  const texto = descripcion?.trim();
  return !texto || /FIXTURE SIMULADA|Confotur hipotético/i.test(texto) ? null : texto;
}
