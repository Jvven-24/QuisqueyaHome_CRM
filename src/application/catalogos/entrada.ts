import { z } from "zod";
const campos = {
  name: z.string({ error: "Escribe el nombre." }).trim().min(1, "Escribe el nombre."),
  position: z.coerce.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
};
export const CrearEntradaInput = z.object(campos);
export const EditarEntradaInput = CrearEntradaInput.partial().extend({ isActive: z.boolean().optional() });
