import { z } from "zod";

/** Cero explícito significa «sin meta»; un valor vacío nunca se convierte en cero. */
export const FijarMetaInput = z.object({
  brokerId: z.number({ error: "Selecciona un broker válido." }).int("Selecciona un broker válido.").positive("Selecciona un broker válido.").nullable(),
  year: z.number({ error: "Escribe un año válido." }).int("Escribe un año válido.").min(2000, "El año mínimo es 2000.").max(2100, "El año máximo es 2100."),
  month: z.number({ error: "Selecciona un mes válido." }).int("Selecciona un mes válido.").min(1, "Selecciona un mes válido.").max(12, "Selecciona un mes válido."),
  targetDeals: z.number({ error: "Escribe la cantidad de negocios objetivo." })
    .int("Escribe un número entero.").min(0, "La meta no puede ser negativa.")
    .max(2147483647, "La meta supera el máximo permitido."),
  targetAmountCents: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
});

export function leerObjetivoFormulario(texto: string): number | undefined {
  return texto.trim() === "" ? undefined : Number(texto);
}
