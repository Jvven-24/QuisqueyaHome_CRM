/** PKCE (RFC 7636) con método S256. */
import { createHash, randomBytes } from "node:crypto";

const b64url = (b: Buffer) => b.toString("base64url");

/** Verificador de 43 caracteres (32 bytes aleatorios en base64url). */
export const crearVerificador = (): string => b64url(randomBytes(32));
export const desafioS256 = (verificador: string): string => b64url(createHash("sha256").update(verificador).digest());
