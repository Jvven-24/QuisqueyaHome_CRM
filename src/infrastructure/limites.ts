/**
 * Límites básicos de frecuencia y tamaño (auditoría 27/10/2026): login,
 * webhook de leads y transcripción de audio no tenían ninguno.
 *
 * Ventana fija en memoria del proceso: la app corre en un solo contenedor, así
 * que basta como primera barrera. No sustituye un WAF.
 */

type Ventana = { inicio: number; cuenta: number };

export function crearLimitador(maximo: number, ventanaMs: number, ahora: () => number = Date.now) {
  const ventanas = new Map<string, Ventana>();
  return {
    /** `null` si se permite; si no, segundos hasta poder reintentar. */
    consumir(clave: string): number | null {
      const t = ahora();
      if (ventanas.size > 10_000) for (const [k, v] of ventanas) if (t - v.inicio >= ventanaMs) ventanas.delete(k);
      const actual = ventanas.get(clave);
      if (!actual || t - actual.inicio >= ventanaMs) {
        ventanas.set(clave, { inicio: t, cuenta: 1 });
        return null;
      }
      if (actual.cuenta >= maximo) return Math.max(1, Math.ceil((actual.inicio + ventanaMs - t) / 1000));
      actual.cuenta++;
      return null;
    },
  };
}

export function ipCliente(request: Request): string {
  const reenviada = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return reenviada || request.headers.get("x-real-ip") || "desconocida";
}

export function demasiadasPeticiones(segundos: number): Response {
  return Response.json(
    { error: `Demasiados intentos. Espera ${segundos} s y vuelve a intentarlo.` },
    { status: 429, headers: { "Retry-After": String(segundos) } },
  );
}

/** Rechaza por `Content-Length` antes de leer el cuerpo. */
export function cuerpoDemasiadoGrande(request: Request, maxBytes: number): Response | null {
  const largo = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(largo) && largo > maxBytes) {
    return Response.json({ error: `El contenido supera el máximo de ${Math.round(maxBytes / 1024)} KB.` }, { status: 413 });
  }
  return null;
}

/** Lee el cuerpo como JSON con tope real de bytes (aunque falte Content-Length). */
export async function leerJsonLimitado(request: Request, maxBytes: number): Promise<unknown | Response> {
  const grande = cuerpoDemasiadoGrande(request, maxBytes);
  if (grande) return grande;
  const texto = await request.text().catch(() => "");
  if (Buffer.byteLength(texto) > maxBytes) return cuerpoDemasiadoGrande(new Request("http://x", { headers: { "content-length": String(maxBytes + 1) } }), maxBytes)!;
  try { return JSON.parse(texto); } catch { return {}; }
}

export const limiteLoginIp = crearLimitador(10, 60_000);
export const limiteLoginCorreo = crearLimitador(8, 15 * 60_000);
export const limiteLeadsExterno = crearLimitador(60, 60_000);
export const limiteAudio = crearLimitador(10, 60_000);
