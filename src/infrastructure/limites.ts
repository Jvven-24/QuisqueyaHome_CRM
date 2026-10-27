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
    /** Como `consumir`, pero sin gastar intento (para contar solo fallos). */
    bloqueado(clave: string): number | null {
      const actual = ventanas.get(clave);
      const t = ahora();
      if (!actual || t - actual.inicio >= ventanaMs || actual.cuenta < maximo) return null;
      return Math.max(1, Math.ceil((actual.inicio + ventanaMs - t) / 1000));
    },
    consumir(clave: string): number | null {
      const t = ahora();
      if (ventanas.size > 10_000) {
        for (const [k, v] of ventanas) if (t - v.inicio >= ventanaMs) ventanas.delete(k);
        // Si siguen vivas demasiadas, se vacía: mejor perder memoria del límite que la del proceso.
        if (ventanas.size > 10_000) ventanas.clear();
      }
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
  // El último salto lo añade Caddy (proxy de confianza); los anteriores los
  // puede inventar el cliente.
  const reenviada = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim();
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
  const muyGrande = () => Response.json({ error: `El contenido supera el máximo de ${Math.round(maxBytes / 1024)} KB.` }, { status: 413 });
  if (!request.body) {
    const texto = await request.text().catch(() => "");
    if (texto.length > maxBytes) return muyGrande();
    try { return JSON.parse(texto); } catch { return {}; }
  }
  // Lectura por trozos: corta en cuanto se pasa del tope, aunque no haya Content-Length.
  const lector = request.body.getReader();
  const trozos: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) { await lector.cancel().catch(() => {}); return muyGrande(); }
      trozos.push(value);
    }
  } catch { return {}; }
  const unido = new Uint8Array(total);
  let pos = 0;
  for (const t of trozos) { unido.set(t, pos); pos += t.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(unido)); } catch { return {}; }
}

export const limiteLoginIp = crearLimitador(10, 60_000);
export const limiteLoginCorreo = crearLimitador(8, 15 * 60_000);
export const limiteLeadsExterno = crearLimitador(60, 60_000);
export const limiteAudio = crearLimitador(10, 60_000);
export const limiteRecuperarIp = crearLimitador(5, 15 * 60_000);
export const limiteRecuperarCorreo = crearLimitador(3, 60 * 60_000);
export const limiteGoogleLoginIp = crearLimitador(20, 15 * 60_000);
