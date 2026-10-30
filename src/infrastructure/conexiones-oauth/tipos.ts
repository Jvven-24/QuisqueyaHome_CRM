/** Tipos compartidos entre proveedores OAuth. */
export type Fetch = typeof fetch;

export type Tokens = {
  accessToken: string;
  refreshToken?: string;
  /** null = el proveedor no fija caducidad (p. ej. token largo de Meta sin vencimiento). */
  expiresAt: Date | null;
  scopes: string;
};

export type PerfilCuenta = { id: string; etiqueta: string };
export type ResultadoVerificacion = { resumen: string; recursos: number };

/** Error de un proveedor con el código HTTP y el código OAuth (nunca incluye tokens). */
export class ProveedorError extends Error {
  readonly proveedor: string;
  readonly status: number;
  readonly codigo: string;
  constructor(proveedor: string, status: number, codigo: string = "") {
    super(`${proveedor} respondió ${status}${codigo ? ` (${codigo})` : ""}`);
    this.name = "ProveedorError";
    this.proveedor = proveedor;
    this.status = status;
    this.codigo = codigo;
  }
  /** El permiso ya no es válido: hay que volver a pedir el consentimiento. */
  get requiereReconexion(): boolean {
    return this.codigo === "invalid_grant" || this.status === 401 || this.codigo === "OAuthException";
  }
}

/** La conexión necesita que el administrador vuelva a autorizar. */
export class ReconectarError extends Error {
  constructor(mensaje = "La conexión necesita volver a autorizarse.") { super(mensaje); this.name = "ReconectarError"; }
}

export async function leerError(proveedor: string, r: Response): Promise<ProveedorError> {
  let codigo = "";
  try {
    const d = (await r.json()) as { error?: string | { type?: string; code?: number }; };
    codigo = typeof d.error === "string" ? d.error : d.error?.type ?? "";
  } catch { /* cuerpo no JSON */ }
  return new ProveedorError(proveedor, r.status, codigo);
}
