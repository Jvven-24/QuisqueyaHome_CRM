/** Canjea el enlace del correo (token_hash) y fija la contraseña en el servidor. */
import { z } from "zod";
import { serverClient } from "@/infrastructure/auth/supabase";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { demasiadasPeticiones, ipCliente, leerJsonLimitado, limiteLoginIp } from "@/infrastructure/limites";

const Entrada = z.object({
  token_hash: z.string({ error: "El enlace no es válido." }).min(10, "El enlace no es válido.").max(512),
  type: z.enum(["recovery", "invite"], { error: "El enlace no es válido." }),
  password: z.string({ error: "Escribe la nueva contraseña." }).min(8, "La contraseña debe tener al menos 8 caracteres.").max(128),
});

export async function POST(request: Request) {
  try {
    const espera = limiteLoginIp.consumir(ipCliente(request));
    if (espera) return demasiadasPeticiones(espera);
    const cuerpo = await leerJsonLimitado(request, 4 * 1024);
    if (cuerpo instanceof Response) return cuerpo;
    const { token_hash, type, password } = parseInput(Entrada, cuerpo);
    const supabase = await serverClient();
    const v = await supabase.auth.verifyOtp({ token_hash, type });
    if (v.error || !v.data.session) return Response.json({ error: "El enlace venció o ya se usó. Pide uno nuevo." }, { status: 400 });
    const u = await supabase.auth.updateUser({ password });
    if (u.error) return Response.json({ error: "No se pudo guardar la contraseña. Prueba con otra más larga." }, { status: 400 });
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
