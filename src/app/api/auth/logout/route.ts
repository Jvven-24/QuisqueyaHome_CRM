import { serverClient } from "@/infrastructure/auth/supabase";
import { errorResponse } from "@/infrastructure/http";

/** Cierre de sesión (T2). Borra las cookies de Supabase en el servidor. */
export async function POST() {
  try {
    const supabase = await serverClient();
    await supabase.auth.signOut();
    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
