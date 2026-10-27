/**
 * Inicio de sesión (T2).
 *
 * Escritura por route handler, según la decisión de `MAPEO_FRONTEND_CRM.md`
 * §20.2. Este archivo es además el ejemplo del patrón que siguen todas las
 * escrituras: validar la entrada, hacer el trabajo, traducir el error una vez.
 */

import { eq } from "drizzle-orm";
import { z } from "zod";
import { UnauthorizedError } from "@/domain/errors";
import { serverClient } from "@/infrastructure/auth/supabase";
import { getDb } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { demasiadasPeticiones, ipCliente, leerJsonLimitado, limiteLoginCorreo, limiteLoginIp } from "@/infrastructure/limites";

// El segundo mensaje no es redundante: `min` cubre la cadena vacía, `error`
// cubre que el campo llegue ausente o con otro tipo. Sin él, Zod responde su
// texto por defecto, en inglés, y eso acaba en la pantalla del usuario.
const LoginInput = z.object({
  email: z.email("Escribe un correo válido."),
  password: z
    .string({ error: "Escribe tu contraseña." })
    .min(1, "Escribe tu contraseña."),
});

export async function POST(request: Request) {
  try {
    const espera = limiteLoginIp.consumir(ipCliente(request));
    if (espera) return demasiadasPeticiones(espera);
    const cuerpo = await leerJsonLimitado(request, 8 * 1024);
    if (cuerpo instanceof Response) return cuerpo;
    const { email, password } = parseInput(LoginInput, cuerpo);
    const esperaCorreo = limiteLoginCorreo.consumir(email.trim().toLowerCase());
    if (esperaCorreo) return demasiadasPeticiones(esperaCorreo);

    const supabase = await serverClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      // Mensaje único a propósito: distinguir "no existe" de "contraseña mala"
      // convierte el login en un verificador de correos registrados.
      throw new UnauthorizedError("Correo o contraseña incorrectos.");
    }

    await getDb()
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.authUserId, data.user.id));

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
