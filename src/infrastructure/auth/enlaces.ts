/**
 * Enlaces de acceso firmados por GoTrue (recuperación, invitación, magic link)
 * generados con la clave de servicio y entregados por nuestro propio correo.
 * GoTrue no queda expuesto: el enlace apunta al CRM, que canjea `token_hash`.
 */
import { adminClient } from "./supabase";
import { enviarCorreo, plantillaEnlace, urlPublica } from "../correo";

type Tipo = "recovery" | "invite" | "magiclink";

export async function hashDeEnlace(tipo: Tipo, email: string): Promise<string> {
  const { data, error } = await adminClient().auth.admin.generateLink({ type: tipo, email } as never);
  if (error || !data?.properties?.hashed_token) throw new Error(error?.message ?? "No se pudo generar el enlace.");
  return data.properties.hashed_token;
}

export function enlaceNuevaClave(hash: string, tipo: "recovery" | "invite"): string {
  return `${urlPublica()}/recuperar/nueva-clave?token_hash=${encodeURIComponent(hash)}&type=${tipo}`;
}

export async function enviarRecuperacion(email: string): Promise<void> {
  const enlace = enlaceNuevaClave(await hashDeEnlace("recovery", email), "recovery");
  await enviarCorreo({ para: email, ...plantillaEnlace(
    "Restablece tu contraseña", "Recibimos una solicitud para cambiar la contraseña de tu cuenta en Quisqueya Home CRM.",
    "Crear nueva contraseña", enlace, "El enlace vence en 1 hora. Si no lo pediste, ignora este correo.") });
}

/** Invita (crea el usuario en Auth) o, si ya existe, reenvía como recuperación. Devuelve el id de Auth. */
export async function enviarInvitacion(email: string): Promise<string | null> {
  const admin = adminClient().auth.admin;
  let r = await admin.generateLink({ type: "invite", email });
  let tipo: "invite" | "recovery" = "invite";
  if (r.error) { r = await admin.generateLink({ type: "recovery", email } as never); tipo = "recovery"; }
  if (r.error || !r.data?.properties?.hashed_token) throw new Error(r.error?.message ?? "No se pudo generar la invitación.");
  const enlace = enlaceNuevaClave(r.data.properties.hashed_token, tipo);
  await enviarCorreo({ para: email, ...plantillaEnlace(
    "Te invitaron a Quisqueya Home CRM", "El administrador creó tu cuenta. Define tu contraseña para entrar; también puedes usar «Iniciar sesión con Google» con este mismo correo.",
    "Activar mi cuenta", enlace, "El enlace vence en 24 horas.") });
  return r.data.user?.id ?? null;
}
