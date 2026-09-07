/**
 * Normalización de teléfono a E.164 para República Dominicana (M1).
 *
 * Función pura, sin dependencias — decisión #19 de `docs/contexto/decisiones.md`
 * descarta `libphonenumber-js` (~500 KB para 200 países que este CRM no usa) a
 * favor de las diez líneas que hacen falta para los tres códigos de área de RD.
 *
 * Solo se normaliza lo que puede normalizarse con certeza: RD es `+1` con área
 * 809/829/849. Cualquier otro número (de otro país, o con menos/más dígitos de
 * los que un número de RD tiene) se guarda como `null` en `phone` — no se
 * inventa una normalización para un país que no se puede distinguir con solo
 * diez dígitos. `phoneDisplay` conserva siempre el texto tal como lo escribió
 * el usuario, se haya podido normalizar o no.
 */

const CODIGOS_AREA_RD = ["809", "829", "849"];

export type TelefonoNormalizado = {
  /** E.164 (`+1XXXXXXXXXX`) cuando el área es de RD; `null` en cualquier otro caso. */
  phone: string | null;
  /** El texto tal como lo escribió el usuario. `null` solo si no escribió nada. */
  phoneDisplay: string | null;
};

export function normalizarTelefono(
  entrada: string | null | undefined,
): TelefonoNormalizado {
  const texto = entrada?.trim();
  if (!texto) return { phone: null, phoneDisplay: null };

  const digitos = texto.replace(/\D/g, "");
  // Acepta con o sin el "1" de código de país: 10 dígitos (área + número) u
  // 11 que empiecen por "1" (que se descarta, es el código de país de RD y EE.UU.).
  const diezDigitos =
    digitos.length === 11 && digitos.startsWith("1") ? digitos.slice(1) : digitos;

  const esDeRD =
    diezDigitos.length === 10 && CODIGOS_AREA_RD.includes(diezDigitos.slice(0, 3));

  return {
    phone: esDeRD ? `+1${diezDigitos}` : null,
    phoneDisplay: texto,
  };
}
