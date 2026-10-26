/** Recuperación de contraseña (T2). Supabase envía el correo con el enlace. */

import { z } from "zod";
import { serverClient } from "@/infrastructure/auth/supabase";
import { errorResponse, parseInput } from "@/infrastructure/http";

const RecoverInput = z.object({
  email: z.email({ error: "Escribe un correo válido." }),
});

export async function POST(request: Request) {
  try {
    const { email } = parseInput(
      RecoverInput,
      await request.json().catch(() => ({})),
    );

    const supabase = await serverClient();
    const origin = new URL(request.url).origin;
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/recuperar/nueva-clave`,
    });

    // Siempre `ok`, exista o no el correo: responder distinto convertiría esto
    // en un verificador de quién tiene cuenta.
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
