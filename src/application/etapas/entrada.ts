import { z } from "zod";
import { STAGE_KINDS } from "../../domain/catalogs.ts";
const campos = {
  name: z.string().trim().min(1, "Escribe el nombre de la etapa.").max(120),
  position: z.coerce.number().int().positive().max(2147483647),
  kind: z.enum(STAGE_KINDS),
  defaultProbability: z.coerce.number().int().min(0).max(100).nullable(),
  isActive: z.boolean(),
};
export const crearEtapaSchema = z.object(campos).strict();
export const editarEtapaSchema = z.object(campos).partial().strict();
