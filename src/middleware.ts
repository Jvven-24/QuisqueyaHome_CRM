/**
 * Middleware de sesión y guardia de rutas (T2).
 *
 * Hace dos cosas, y las dos importan:
 *
 *  1. Refresca el token de Supabase y reescribe las cookies. Sin esto la sesión
 *     caduca a mitad de la jornada sin que nadie sepa por qué.
 *  2. **Privado por defecto.** Se listan las rutas públicas, no las privadas.
 *     Al revés, cada módulo nuevo nacería abierto y el olvido sería una fuga.
 *
 * Esto no sustituye a T3: el middleware decide si hay sesión, no qué puede ver
 * quien la tiene. El permiso se comprueba en cada caso de uso (§16, criterio #1).
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Rutas accesibles sin sesión. Todo lo demás exige estar dentro.
 *
 * `/api/leads/externo` se suma aquí por la decisión #20
 * (`docs/contexto/decisiones.md`): es la única entrada pública del sistema, se
 * autentica con un token compartido en cabecera (`infrastructure/env.ts`,
 * `leadsWebhookToken`) y no con sesión de Supabase — sin esta excepción, el
 * middleware la redirigiría a `/login` antes de que su propio código llegara
 * a comprobar el token.
 */
const PUBLIC_PATHS = ["/login", "/recuperar", "/api/auth", "/api/leads/externo"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // `getUser` y no `getSession`: el segundo lee la cookie sin verificarla contra
  // Supabase, así que una cookie manipulada pasaría.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some(
    (p) => path === p || path.startsWith(`${p}/`),
  );

  if (!user && !isPublic) {
    // Un route handler de /api espera JSON, no un 302: si se le deja seguir el
    // redirect, recibe el HTML de /login con 200 y `!respuesta.ok` nunca se
    // dispara — el cliente sigue como si la petición hubiera tenido éxito.
    if (path.startsWith("/api")) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Para volver a donde iba después de entrar.
    url.searchParams.set("destino", path);
    return NextResponse.redirect(url);
  }

  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/inicio";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Todo salvo estáticos de Next y archivos con extensión.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
