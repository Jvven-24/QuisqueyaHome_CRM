/**
 * Clientes de Supabase Auth (T2).
 *
 * Se usa `@supabase/ssr` porque el App Router necesita la sesión **en el
 * servidor**: un componente de servidor tiene que saber quién pregunta antes de
 * consultar nada. La sesión viaja en cookies, no en `localStorage`.
 */

import { createBrowserClient, createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseAnonKey, supabaseUrl } from "../env";

/** Cliente de navegador. Solo para componentes cliente. */
export function browserClient() {
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}

/**
 * Cliente de servidor, ligado a las cookies de la petición.
 *
 * `setAll` puede fallar cuando se llama desde un componente de servidor —
 * Next.js no permite escribir cookies durante el render. Se ignora a propósito:
 * el middleware ya refresca la sesión en cada petición, que es donde sí se puede
 * escribir.
 */
export async function serverClient() {
  const store = await cookies();
  return createServerClient(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {
          // Render de componente de servidor: lo resuelve el middleware.
        }
      },
    },
  });
}
