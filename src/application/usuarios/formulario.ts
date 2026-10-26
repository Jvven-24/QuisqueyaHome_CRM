import { z } from "zod";
import { TelefonoUsuarioInput } from "./telefono.ts";

/** Contrato del formulario de invitación/edición; el servidor vuelve a validar. */
const campos = {
  fullName: z.string({ error: "Escribe el nombre completo." }).trim().min(1, "Escribe el nombre completo."),
  roleId: z.coerce.number({ error: "Selecciona un rol válido." }).int("Selecciona un rol válido.").positive("Selecciona un rol válido."),
  jobTitle: z.string().optional(),
  phone: TelefonoUsuarioInput,
  specialty: z.string().optional(),
  handlesRentals: z.boolean().optional(),
  monthlyTargetDeals: z.preprocess(
    (valor) => valor === "" ? undefined : valor,
    z.coerce.number({ error: "Escribe un número entero." }).int("Escribe un número entero.").nonnegative("La meta no puede ser negativa.").optional(),
  ),
};
export const InvitacionFormularioInput = z.object({
  ...campos,
  email: z.email("Escribe un correo válido."),
});
export const EdicionFormularioInput = z.object({ ...campos, isActive: z.boolean() });

/** Máscara RD progresiva. Conserva entradas inválidas para explicar el error al enviar. */
export function enmascararTelefonoUsuario(valor: string): string {
  if (!/^[\d\s().-]*$/.test(valor)) return valor;
  const digitos = valor.replace(/\D/g, "");
  if (!/^(809|829|849)/.test(digitos) || digitos.length > 10) return valor;
  return [digitos.slice(0, 3), digitos.slice(3, 6), digitos.slice(6, 10)].filter(Boolean).join("-");
}
