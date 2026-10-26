import { z } from "zod";
import { normalizarTelefono } from "../../domain/telefono.ts";

const sinVacio = (value: unknown) => value === "" ? undefined : value;
export const textoOpcional = z.preprocess(sinVacio, z.string({ error: "Escribe un texto v\u00e1lido." }).trim().optional());
export const idOpcional = z.preprocess(sinVacio, z.coerce.number({ error: "Elige una opci\u00f3n v\u00e1lida." }).int("Elige una opción válida.").positive("Elige una opción válida.").max(2147483647, "El identificador supera el rango permitido.").optional());
export const telefonoOpcional = z.preprocess(sinVacio, z.string({ error: "Escribe un tel\u00e9fono v\u00e1lido." }).trim().refine(
  value => /^[+\d\s().-]+$/.test(value) && normalizarTelefono(value).phone !== null,
  "Escribe un teléfono válido con su prefijo internacional.",
).optional());
export const correoOpcional = z.preprocess(sinVacio, z.email("Escribe un correo válido.").optional());
export const nombreContacto = z.string({ error: "Escribe el nombre del contacto." }).trim().min(1, "Escribe el nombre del contacto.");

/** Una frontera compartida por el formulario y la API; Zod descarta campos ajenos. */
export const CrearContactoInput = z.object({
  fullName: nombreContacto,
  phone: telefonoOpcional,
  email: correoOpcional,
  sourceId: idOpcional,
  notes: textoOpcional,
  crear_igual: z.boolean({ error: "Confirma si deseas crear el duplicado." }).optional(),
});

export function erroresDeCampos(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "_");
    fields[field] ??= issue.message;
  }
  return fields;
}
