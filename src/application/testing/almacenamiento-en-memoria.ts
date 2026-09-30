/**
 * Doble en memoria del puerto de almacenamiento. Imita las dos rarezas de
 * Supabase Storage que un caso de uso tiene que tolerar: sin `upsert` una ruta
 * ocupada se rechaza, y firmar una ruta inexistente no falla, devuelve `null` en
 * su posición.
 *
 * Guarda solo metadatos (tipo, tamaño, nombre visible), no los bytes: las
 * pruebas comprueban qué se subió y dónde, no el contenido.
 */

import { ConflictError } from "../../domain/errors.ts";
import type { AlmacenamientoArchivos } from "../compartido/almacenamiento.ts";
import type { Reversible } from "./reversible.ts";

type Objeto = { tipoMime: string; bytes: number; nombreVisible: string };

export function almacenamientoEnMemoria(
  opciones: { fallarAlSubirCon?: string; fallarAlFirmarCon?: string } = {},
): AlmacenamientoArchivos & Reversible & { readonly objetos: ReadonlyMap<string, Objeto> } {
  const objetos = new Map<string, Objeto>();

  return {
    objetos,
    async subir({ ruta, contenido, tipoMime, nombreVisible }) {
      const motivo = opciones.fallarAlSubirCon ?? (objetos.has(ruta) ? "El objeto ya existe." : undefined);
      if (motivo !== undefined) throw new ConflictError(`No se pudo subir "${nombreVisible}": ${motivo}`);
      objetos.set(ruta, { tipoMime, bytes: contenido.size, nombreVisible });
    },
    async borrar(rutas) {
      for (const ruta of rutas) objetos.delete(ruta);
    },
    async urlsFirmadas(rutas, segundosDeVida) {
      if (opciones.fallarAlFirmarCon !== undefined) throw new ConflictError(opciones.fallarAlFirmarCon);
      return rutas.map((ruta) => (objetos.has(ruta) ? `memoria://${ruta}?exp=${segundosDeVida}` : null));
    },
    instantanea() {
      const copia = new Map(objetos);
      return () => {
        objetos.clear();
        for (const [ruta, objeto] of copia) objetos.set(ruta, objeto);
      };
    },
  };
}
