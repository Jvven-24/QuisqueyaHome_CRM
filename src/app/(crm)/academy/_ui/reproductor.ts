const EXTENSIONES_VIDEO = /\.(mp4|webm|ogg)$/i;

/**
 * Solo se incrusta un video directo servido por https. Cualquier otra URL
 * (iframe, página, esquema desconocido) se ofrece como enlace externo.
 */
export function esVideoDirectoSeguro(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && EXTENSIONES_VIDEO.test(parsed.pathname);
  } catch {
    return false;
  }
}
