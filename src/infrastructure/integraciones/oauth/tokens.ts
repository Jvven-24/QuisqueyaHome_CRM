/**
 * Token vigente de una conexión, con renovación automática. Lógica pura: recibe
 * la fila ya descifrada y las operaciones del proveedor; el repositorio persiste.
 */
import { ProveedorError, ReconectarError, type Tokens } from "./tipos.ts";
import type { ProveedorId } from "./servicios.ts";

export type FilaToken = { proveedor: ProveedorId; accessToken: string; refreshToken: string | null; expiresAt: Date | null; scopes: string };
export type OpsProveedor = {
  refrescarGoogle: (refreshToken: string) => Promise<Tokens>;
  renovarMeta: (accessToken: string, scopes: string) => Promise<Tokens>;
};
/** Meta: se renueva cuando faltan menos de 7 días. */
export const VENTANA_RENOVACION_META_MS = 7 * 24 * 3600 * 1000;
const MARGEN_GOOGLE_MS = 60 * 1000;

export type TokenVigente = { accessToken: string; renovado?: Tokens };

export async function tokenVigente(fila: FilaToken, ops: OpsProveedor, ahora = new Date()): Promise<TokenVigente> {
  const t = ahora.getTime();
  if (fila.proveedor === "google") {
    if (fila.expiresAt && fila.expiresAt.getTime() - MARGEN_GOOGLE_MS > t) return { accessToken: fila.accessToken };
    if (!fila.refreshToken) throw new ReconectarError("Google no entregó permiso offline: hay que reconectar la cuenta.");
    try {
      const n = await ops.refrescarGoogle(fila.refreshToken);
      return { accessToken: n.accessToken, renovado: { ...n, scopes: n.scopes || fila.scopes } };
    } catch (e) {
      if (e instanceof ProveedorError && e.requiereReconexion) throw new ReconectarError("Google revocó o venció el permiso: hay que reconectar la cuenta.");
      throw e;
    }
  }
  // Meta
  if (!fila.expiresAt || fila.expiresAt.getTime() - VENTANA_RENOVACION_META_MS > t) return { accessToken: fila.accessToken };
  const vencido = fila.expiresAt.getTime() <= t;
  try {
    const n = await ops.renovarMeta(fila.accessToken, fila.scopes);
    return { accessToken: n.accessToken, renovado: { ...n, scopes: fila.scopes } };
  } catch (e) {
    if (vencido || (e instanceof ProveedorError && e.requiereReconexion)) throw new ReconectarError("El token de Meta venció o fue revocado: hay que reconectar la cuenta.");
    // Aún sirve unos días: se usa y se reintentará la renovación en la próxima lectura.
    return { accessToken: fila.accessToken };
  }
}
