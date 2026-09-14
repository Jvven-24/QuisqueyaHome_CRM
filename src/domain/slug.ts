/**
 * `slug` a partir de un nombre (M5 · Propiedades). Función pura, sin
 * dependencias — mismo criterio que `telefono.ts`: diez líneas cubren lo que
 * aquí hace falta, sin una librería de slugify para minúsculas y guiones.
 */
export function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos: "Bávaro" → "Bavaro"
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
