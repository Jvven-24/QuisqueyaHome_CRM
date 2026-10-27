/** Recuperación de contraseña: solo cuentas creadas por el admin y activas reciben el correo. */

import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { enviarRecuperacion } from "@/infrastructure/auth/enlaces";
import { getDb } from "@/infrastructure/db/client";
import { users } from "@/infrastructure/db/schema";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { demasiadasPeticiones, ipCliente, leerJsonLimitado, limiteRecuperarCorreo, limiteRecuperarIp } from "@/infrastructure/limites";

const RecoverInput = z.object({
  email: z.email({ error: "Escribe un correo válido." }),
});

export async function POST(request: Request) {
  try {
    const espera = limiteRecuperarIp.consumir(ipCliente(request));
    if (espera) return demasiadasPeticiones(espera);
    const cuerpo = await leerJsonLimitado(request, 4 * 1024);
    if (cuerpo instanceof Response) return cuerpo;
    const correo = parseInput(RecoverInput, cuerpo).email.trim().toLowerCase();
    // Siempre `ok`, exista o no: responder distinto delataría quién tiene cuenta.
    if (limiteRecuperarCorreo.consumir(correo)) return Response.json({ ok: true });
    const [u] = await getDb().select({ id: users.id }).from(users)
      .where(and(sql`lower(${users.email}) = ${correo}`, eq(users.isActive, true), isNull(users.deletedAt))).limit(1);
    if (u) {
      try { await enviarRecuperacion(correo); } catch (e) {
        console.error("recuperar: fallo al enviar", e instanceof Error ? e.message : "desconocido");
      }
    }
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
