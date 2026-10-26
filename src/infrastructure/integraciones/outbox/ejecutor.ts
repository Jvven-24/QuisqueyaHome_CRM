/**
 * Bucle del disparador local del outbox (`npm run outbox:worker`).
 *
 * Aquí solo hay control de flujo: la lógica de entrega es `ejecutarLoteOutbox`
 * (`runtime.ts`), que se inyecta. Así el modo `--once`, el intervalo, la parada
 * y el tratamiento de fallos se prueban sin base de datos ni reloj.
 */

export type OpcionesWorker = {
  once: boolean;
  intervaloMs: number;
  limite: number;
  permitirRemoto: boolean;
};

const INTERVALO_POR_DEFECTO_S = 30;
const LIMITE_POR_DEFECTO = 100;

function entero(valor: string, nombre: string, min: number, max: number): number {
  if (!/^\d+$/.test(valor)) throw new RangeError(`${nombre} debe ser un entero.`);
  const n = Number(valor);
  if (n < min || n > max) throw new RangeError(`${nombre} debe estar entre ${min} y ${max}.`);
  return n;
}

/** `--once`, `--interval=<segundos>`, `--limit=<1..1000>`, `--allow-remote`. Lo demás se rechaza. */
export function leerOpcionesWorker(argv: readonly string[]): OpcionesWorker {
  const opciones: OpcionesWorker = {
    once: false,
    intervaloMs: INTERVALO_POR_DEFECTO_S * 1000,
    limite: LIMITE_POR_DEFECTO,
    permitirRemoto: false,
  };
  for (const arg of argv) {
    if (arg === "--once") opciones.once = true;
    else if (arg === "--allow-remote") opciones.permitirRemoto = true;
    else if (arg.startsWith("--interval=")) opciones.intervaloMs = entero(arg.slice(11), "--interval", 1, 3600) * 1000;
    else if (arg.startsWith("--limit=")) opciones.limite = entero(arg.slice(8), "--limit", 1, 1000);
    else throw new RangeError(`Argumento desconocido: ${arg.split("=")[0]}`);
  }
  return opciones;
}

/** El worker local solo toca bases locales salvo `--allow-remote` explícito. */
export function esDestinoLocal(databaseUrl: string): boolean {
  try {
    const { hostname } = new URL(databaseUrl);
    return ["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname);
  } catch {
    return false;
  }
}

/** Código del error sin mensaje: el de un driver puede llevar la cadena de conexión. */
function codigoDe(error: unknown): string {
  const causa = error instanceof Error && "cause" in error && error.cause ? error.cause : error;
  if (typeof causa === "object" && causa !== null && "code" in causa) return String((causa as { code: unknown }).code);
  return error instanceof Error ? error.name : "ERROR";
}

export type DepsWorker = {
  lote: (limite: number) => Promise<number>;
  dormir: (ms: number) => Promise<void>;
  /** `true` cuando llegó SIGINT/SIGTERM. */
  detenido: () => boolean;
  log: (mensaje: string) => void;
};

export async function correrWorker(
  deps: DepsWorker,
  opciones: Pick<OpcionesWorker, "once" | "intervaloMs" | "limite">,
): Promise<{ pasadas: number; procesados: number; fallos: number }> {
  let pasadas = 0;
  let procesados = 0;
  let fallos = 0;
  while (!deps.detenido()) {
    pasadas++;
    let n = 0;
    try {
      n = await deps.lote(opciones.limite);
      procesados += n;
      deps.log(`outbox: pasada ${pasadas}, procesados ${n}`);
    } catch (error) {
      fallos++;
      deps.log(`outbox: pasada ${pasadas} falló (${codigoDe(error)})`);
      if (opciones.once) throw error;
    }
    if (opciones.once) break;
    // Lote lleno: probablemente queda cola, se sigue sin dormir.
    if (n < opciones.limite) await deps.dormir(opciones.intervaloMs);
  }
  return { pasadas, procesados, fallos };
}
