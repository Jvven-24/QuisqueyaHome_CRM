import { z } from "zod";
import { ALCANCES_META, MONEDAS_META } from "../../domain/metas-alcances.ts";

const anio = z.number({ error: "Escribe un año válido." }).int("Escribe un año válido.").min(2000, "El año mínimo es 2000.").max(2100, "El año máximo es 2100.");
const mes = z.number({ error: "Selecciona un mes válido." }).int("Selecciona un mes válido.").min(1, "Selecciona un mes válido.").max(12, "Selecciona un mes válido.");
const id = (mensaje: string) => z.number({ error: mensaje }).int(mensaje).positive(mensaje);

export const FijarMetaAlcanceInput = z.object({
  scopeType: z.enum(ALCANCES_META, { error: "Elige si la meta es de proyecto o de equipo." }),
  scopeId: id("Selecciona el proyecto o el equipo."),
  year: anio,
  month: mes,
  targetDeals: z.number({ error: "Escribe la cantidad de negocios objetivo." }).int("Escribe un número entero.").min(0, "La meta no puede ser negativa.").max(100000, "La meta supera el máximo permitido."),
  targetAmountCents: z.number({ error: "Escribe un monto válido." }).int("Escribe un monto válido.").nonnegative("El monto no puede ser negativo.").max(Number.MAX_SAFE_INTEGER, "El monto supera el máximo permitido.").nullable().optional(),
  currency: z.enum(MONEDAS_META, { error: "Elige USD o DOP." }),
});
export type EntradaMetaAlcance = z.infer<typeof FijarMetaAlcanceInput>;

export const EliminarMetaAlcanceInput = z.object({ id: id("Meta no válida.") });

export const ReiniciarMetaInput = z.object({
  brokerId: id("Selecciona un broker válido.").nullable(),
  year: anio,
  month: mes,
});
export type EntradaReiniciarMeta = z.infer<typeof ReiniciarMetaInput>;

export const GuardarEquipoInput = z.object({
  id: id("Equipo no válido.").optional(),
  name: z.string({ error: "Escribe el nombre del equipo." }).trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(80, "El nombre admite hasta 80 caracteres."),
  leaderId: id("Selecciona un líder válido.").nullable().optional(),
  memberIds: z.array(id("Miembro no válido."), { error: "Selecciona los miembros." }).max(100, "Máximo 100 miembros por equipo."),
});
export type EntradaEquipo = z.infer<typeof GuardarEquipoInput>;

export const PublicarReglaInput = z.object({
  scope: z.string({ error: "Describe el alcance de la regla." }).trim().min(3, "Describe el alcance de la regla.").max(200, "El alcance admite hasta 200 caracteres."),
  rule: z.string({ error: "Escribe el texto de la regla." }).trim().min(20, "La regla debe tener al menos 20 caracteres.").max(2000, "La regla admite hasta 2000 caracteres."),
  equipo: z.enum(["equipo_del_broker_al_cierre", "sin_equipo"], { error: "Elige cómo se atribuye el equipo." }),
});
export type EntradaRegla = z.infer<typeof PublicarReglaInput>;
