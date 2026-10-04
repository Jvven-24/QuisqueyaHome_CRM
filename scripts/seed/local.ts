import { databaseUrl } from '../../src/infrastructure/env.ts';

/** Falla cerrado incluso si se pasa una configuración cloud por accidente. */
export function assertLocalDestination(url: string) {
  const parsed = new URL(url);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname) || parsed.port !== '5432' || parsed.pathname !== '/quisqueyahome_crm') {
    throw new Error('Destino rechazado: solo quisqueyahome_crm en loopback:5432');
  }
  // Opciones de conexión en query podrían cambiar el destino efectivo.
  if (parsed.search || parsed.hash) throw new Error('Opciones de conexión no autorizadas');
  return parsed;
}
export function localDatabaseUrl() {
  try { process.loadEnvFile('.env'); } catch { /* El host puede inyectar la configuración. */ }
  const url = databaseUrl();
  assertLocalDestination(url);
  return url;
}

/** Nunca emitir mensajes del driver, queries, parámetros o cadenas de conexión. */
export function safeFailure(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' && /^[A-Z0-9_]{1,30}$/.test(error.code) ? error.code : 'VALIDATION_OR_CONFIGURATION';
  console.error(`Operación local abortada (${code}); no se imprimen detalles sensibles.`);
  // Errores propios (assert/Error sin código del driver): su mensaje lo escribimos nosotros y no lleva datos.
  if (code === 'VALIDATION_OR_CONFIGURATION' && error instanceof Error) {
    console.error(`Motivo: ${error.message.replace(/\b\w+:\/\/\S+/g, '<url>').slice(0, 240)}`);
  }
  process.exitCode = 1;
}
