/** Código corto de un enlace de seguimiento: aparece en `/v/<codigo>` y, para WhatsApp, en el texto prellenado. */
import { randomBytes } from "node:crypto";

/** Sin 0/o/1/i/l para que se pueda dictar o leer sin errores. */
export const ALFABETO = "abcdefghjkmnpqrstuvwxyz23456789";
export const LONGITUD_CODIGO = 7;
export const CODIGO_RE = /^[a-hj-km-np-z2-9]{7}$/;
const EN_TEXTO_RE = /\bQH-([a-hj-km-np-z2-9]{7})\b/i;

export function generarCodigo(aleatorios: (n: number) => Uint8Array = (n) => randomBytes(n)): string {
  let salida = "";
  const limite = 256 - (256 % ALFABETO.length); // descarta el resto para no sesgar el alfabeto
  while (salida.length < LONGITUD_CODIGO) {
    for (const b of aleatorios(16)) {
      if (b < limite && salida.length < LONGITUD_CODIGO) salida += ALFABETO[b % ALFABETO.length];
    }
  }
  return salida;
}

export function normalizarCodigo(valor: string): string | null {
  const c = valor.trim().toLowerCase();
  return CODIGO_RE.test(c) ? c : null;
}

/** Marca visible que se añade al mensaje de WhatsApp: «[QH-abc2345]». */
export const marcaWhatsApp = (codigo: string): string => `[QH-${codigo}]`;

/** Busca la marca en el primer mensaje que escribe la persona. */
export function extraerCodigoDeTexto(texto: string): string | null {
  const m = EN_TEXTO_RE.exec(texto);
  return m ? m[1]!.toLowerCase() : null;
}
