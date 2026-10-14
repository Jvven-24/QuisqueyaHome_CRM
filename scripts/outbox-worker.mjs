// Disparador local del outbox. Uso:
//   npm run outbox:worker -- --once            una pasada y sale (código 1 si falla)
//   npm run outbox:worker                      bucle; --interval=<s> (30), --limit=<n> (100)
// Solo contra bases locales salvo --allow-remote. No imprime credenciales ni mensajes de error del driver.
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { setTimeout as dormir } from 'node:timers/promises';

const root = new URL('../', import.meta.url);

// Resuelve '@/…' y los imports relativos sin extensión, igual que scripts/test-db/loader.mjs.
registerHooks({
  resolve(specifier, context, nextResolve) {
    let candidate;
    if (specifier.startsWith('@/')) candidate = new URL(`src/${specifier.slice(2)}`, root);
    else if (specifier.startsWith('.') && context.parentURL?.startsWith(root.href)) candidate = new URL(specifier, context.parentURL);
    if (candidate && !/\.[a-z]+$/i.test(candidate.pathname) && existsSync(new URL(`${candidate.href}.ts`))) {
      return nextResolve(`${candidate.href}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});

if (!process.env.DATABASE_URL && existsSync(new URL('.env', root))) process.loadEnvFile(new URL('.env', root));

const { leerOpcionesWorker, esDestinoLocal, correrWorker } = await import('../src/infrastructure/integraciones/outbox/ejecutor.ts');

let opciones;
try {
  opciones = leerOpcionesWorker(process.argv.slice(2));
} catch (error) {
  console.error(`outbox: ${error instanceof Error ? error.message : 'argumentos inválidos'}`);
  process.exit(2);
}
if (!process.env.DATABASE_URL) {
  console.error('outbox: falta DATABASE_URL (ver .env.example).');
  process.exit(2);
}
if (!opciones.permitirRemoto && !esDestinoLocal(process.env.DATABASE_URL)) {
  console.error('outbox: DATABASE_URL no es local; usa --allow-remote solo si es intencional.');
  process.exit(2);
}

const { ejecutarLoteOutbox } = await import('../src/infrastructure/integraciones/outbox/runtime.ts');

let parar = false;
const controlador = new AbortController();
for (const senal of ['SIGINT', 'SIGTERM']) {
  process.once(senal, () => { parar = true; controlador.abort(); });
}

try {
  const resumen = await correrWorker({
    lote: ejecutarLoteOutbox,
    dormir: (ms) => dormir(ms, undefined, { signal: controlador.signal }).catch(() => undefined),
    detenido: () => parar,
    log: (mensaje) => console.log(`${new Date().toISOString()} ${mensaje}`),
  }, opciones);
  console.log(`outbox: terminado (${resumen.pasadas} pasadas, ${resumen.procesados} procesados, ${resumen.fallos} fallos).`);
  process.exit(0);
} catch {
  // correrWorker ya registró el código del error; el mensaje del driver no se imprime.
  process.exit(1);
}
