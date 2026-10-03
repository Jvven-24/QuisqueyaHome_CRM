/**
 * Contenedor de los puertos compartidos, y el patrón que siguen los demás.
 *
 * El "contenedor" son funciones fábrica simples, un archivo por módulo
 * (`contenedor/<modulo>.ts`), sin librería de inyección y **sin un contenedor
 * central**. Eso último es lo que evita que dos agentes editen el mismo archivo
 * al migrar módulos distintos en paralelo: cada módulo arma sus adaptadores en
 * su propio archivo y las rutas importan solo ese.
 *
 * Trampa que evitan estas fábricas: `adminClient()` lanza si falta
 * `SUPABASE_SERVICE_ROLE_KEY`, y `next build` importa todos los módulos para
 * descubrir las rutas. Por eso el cliente se construye **dentro de cada
 * método**, no al crear la fábrica. Si lanza, se traduce a `ConflictError` con
 * su mensaje (ya viene en español desde `env.ts`), como hacía la ruta de fotos,
 * para que no caiga al 500 genérico que lo cambiaría por "Ocurrió un error
 * inesperado".
 */

import type { AdminAuth } from "../../application/compartido/admin-auth";
import type { AlmacenamientoArchivos } from "../../application/compartido/almacenamiento";
import { ConflictError } from "../../domain/errors";
import { adminClient } from "../auth/supabase";

function clienteAdmin(): ReturnType<typeof adminClient> {
  try {
    return adminClient();
  } catch (error) {
    throw new ConflictError(error instanceof Error ? error.message : "No se pudo preparar el cliente administrativo.");
  }
}

export function almacenamientoSupabase(bucket: string): AlmacenamientoArchivos {
  return {
    async subir({ ruta, contenido, tipoMime, nombreVisible }) {
      const { error } = await clienteAdmin().storage.from(bucket).upload(ruta, contenido, { contentType: tipoMime });
      if (error) throw new ConflictError(`No se pudo subir "${nombreVisible}": ${error.message}`);
    },

    async borrar(rutas) {
      if (rutas.length === 0) return;
      // Mejor esfuerzo: tampoco debe lanzar si falta la clave de servicio.
      try {
        await clienteAdmin().storage.from(bucket).remove([...rutas]);
      } catch {
        // Un fallo al limpiar no debe tapar el error real que ya se va a responder.
      }
    },

    async urlsFirmadas(rutas, segundosDeVida) {
      if (rutas.length === 0) return [];
      const { data, error } = await clienteAdmin().storage.from(bucket).createSignedUrls([...rutas], segundosDeVida);
      if (error) throw new ConflictError(error.message);
      return rutas.map((_, i) => data[i]?.signedUrl ?? null);
    },
  };
}

export function adminAuthSupabase(): AdminAuth {
  return {
    async invitarPorCorreo(email) {
      const { data, error } = await clienteAdmin().auth.admin.inviteUserByEmail(email);
      if (error) throw new ConflictError(error.message);
      return data.user?.id ?? null;
    },
  };
}
