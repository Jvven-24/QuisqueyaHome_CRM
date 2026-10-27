/** Inicia "Iniciar sesión con Google" (solo identidad: openid + email). Mismo redirect URI registrado. */
import { configuradoGoogle, crearState, LOGIN_COOKIE, urlConsentimiento } from "@/infrastructure/google-cuentas";
import { demasiadasPeticiones, ipCliente, limiteGoogleLoginIp } from "@/infrastructure/limites";

export async function GET(request: Request) {
  const espera = limiteGoogleLoginIp.consumir(ipCliente(request));
  if (espera) return demasiadasPeticiones(espera);
  if (configuradoGoogle().length) {
    return new Response(null, { status: 302, headers: { Location: "/login?error=google-no-configurado" } });
  }
  const { state, nonce } = crearState(0);
  return new Response(null, { status: 302, headers: {
    Location: urlConsentimiento(state, process.env, "login"),
    "Set-Cookie": `${LOGIN_COOKIE}=${nonce}; Path=/api/integraciones/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
  } });
}
