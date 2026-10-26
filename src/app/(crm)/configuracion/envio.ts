/** Bloqueo síncrono: dos submits comparten la operación en curso. */
export function crearEnvioUnico() {
  let ocupado = false;
  return async (enviar: () => Promise<void>): Promise<void> => {
    if (ocupado) return;
    ocupado = true;
    try { await enviar(); } finally { ocupado = false; }
  };
}
