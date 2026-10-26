import { z } from "zod";
import { normalizarTelefono } from "../../domain/telefono.ts";
import { ValidationError } from "../../domain/errors.ts";

const MENSAJE = "Escribe un teléfono de RD válido o un número internacional con + y código de país.";
export const TelefonoUsuarioInput = z.string().trim().refine((valor) => {
  if (!valor) return true;
  if (!/^[+\d\s().-]+$/.test(valor)) return false;
  const compacto = valor.replace(/[\s().-]/g, "");
  return /^\+?[\d]+$/.test(compacto) &&
    (normalizarTelefono(valor).phone !== null || /^\+[1-9]\d{6,14}$/.test(compacto));
}, MENSAJE).transform((valor) => normalizarTelefono(valor).phone ?? valor.replace(/[\s().-]/g, ""));

export function validarTelefonoUsuario(valor: string | null | undefined): string | null {
  if (valor == null) return null;
  const resultado = TelefonoUsuarioInput.safeParse(valor);
  if (!resultado.success) throw new ValidationError(MENSAJE, { phone: MENSAJE });
  return resultado.data || null;
}
