/**
 * M6 · Avances de obra — cálculos puros (`docs/F3_ANALISIS_Y_PLAN.md` §3
 * hallazgo 2, §4.3, issue #32). Sin base de datos, se prueba con `node --test`.
 *
 * El resto del módulo (consultas, route handlers, Storage) vive en
 * `app/api/proyectos/[id]/fases/…` y en `app/(crm)/avances/`.
 */

import type { PhaseStatus } from "./catalogs.ts";

/**
 * `projects.progress_percent` es un caché del promedio de las fases (comentario
 * del propio esquema). Se recalcula completo en cada escritura de una fase, no
 * se ajusta de forma incremental: con 8 fases típicas, sumar y dividir de nuevo
 * es más barato de razonar que mantener un acumulador aparte, y no puede
 * desincronizarse.
 */
export function promedioAvance(porcentajes: readonly number[]): number {
  if (porcentajes.length === 0) return 0;
  const suma = porcentajes.reduce((total, valor) => total + valor, 0);
  return Math.round(suma / porcentajes.length);
}

/** Etiqueta en español de `construction_phases.status` (timeline y editor). */
export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  completed: "Completado",
  delayed: "Retrasado",
};

/**
 * Plantilla de fases por defecto (issue #32, §4.3), portada tal cual del
 * prototipo (`referencia-prototipo/app/page.tsx`).
 *
 * ponytail: lista fija en vez de una tabla de plantillas configurable — el
 * número de fases ya es libre por proyecto (se pueden agregar o borrar una a
 * una), así que lo único que esta constante fija es el punto de partida.
 * Techo: si distintas constructoras necesitan plantillas propias, esto se
 * sube a una tabla `phase_templates`; hoy nadie lo pidió.
 */
export const FASES_ESTANDAR = [
  "Movimiento de tierra",
  "Cimientos",
  "Estructura",
  "Muros",
  "Instalaciones",
  "Terminaciones",
  "Áreas comunes",
  "Entrega",
] as const;

const TAMANO_MAXIMO_FOTO_BYTES = 10 * 1024 * 1024;

/**
 * Lista cerrada de MIME de imagen ráster permitidos para fotos de obra, con su
 * extensión de archivo. `image/svg+xml` queda fuera a propósito: un SVG puede
 * llevar `<script>` embebido, y `validarFoto` lo rechazaría igual que un PDF
 * si solo comprobara el prefijo `image/` (revisión de calidad de M6).
 *
 * También sirve para nombrar el objeto en Storage (`fotos/route.ts`): la
 * extensión sale de aquí, nunca del nombre de archivo que manda el cliente.
 */
export const FOTO_MIME_EXTENSIONES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

/**
 * Valida una foto de obra antes de subirla a Storage: solo los MIME de
 * `FOTO_MIME_EXTENSIONES`, ≤ 10 MB (decisión #33). Devuelve el mensaje de
 * error en español, o `null` si la foto es válida — el route handler decide
 * qué hacer con el mensaje (400, `ValidationError`), esta función no conoce
 * HTTP.
 */
export function validarFoto(mimeType: string, sizeBytes: number): string | null {
  if (!(mimeType in FOTO_MIME_EXTENSIONES)) return "Solo se permiten imágenes JPEG, PNG, WEBP o GIF.";
  if (sizeBytes > TAMANO_MAXIMO_FOTO_BYTES) return "Cada foto debe pesar 10 MB o menos.";
  return null;
}
