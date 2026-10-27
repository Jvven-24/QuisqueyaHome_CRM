/** Inicia OAuth para conectar una cuenta Google (otra más si ya hay). State firmado + cookie httpOnly. */
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse } from "@/infrastructure/http";
import { configuradoGoogle, crearState, STATE_COOKIE, urlConsentimiento } from "@/infrastructure/google-cuentas";

export async function GET() {
  try {
    const actor = await requireActor();
    requireScope(actor, "activities", "view");
    const falta = configuradoGoogle();
    if (falta.length) return Response.json({ error: `Google sin configurar: falta ${falta.join(", ")}.` }, { status: 503 });
    const { state, nonce } = crearState(actor.userId);
    return new Response(null, { status: 302, headers: {
      Location: urlConsentimiento(state),
      "Set-Cookie": `${STATE_COOKIE}=${nonce}; Path=/api/integraciones/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    } });
  } catch (error) {
    return errorResponse(error);
  }
}
