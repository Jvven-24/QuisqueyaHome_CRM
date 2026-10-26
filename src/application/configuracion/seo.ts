export function urlSeoSegura(valor: string): string | null {
  try { const u = new URL(valor); return ["https:", "http:"].includes(u.protocol) && !u.username && !u.password ? u.href : null; } catch { return null; }
}
export function prepararSeo(titulo: string, descripcion: string, url: string) {
  const canonica = urlSeoSegura(url);
  return { titulo: titulo.trim().slice(0, 160), descripcion: descripcion.trim().slice(0, 320), canonica,
    schema: canonica ? JSON.stringify({ "@context": "https://schema.org", "@type": "RealEstateListing", name: titulo.trim(), description: descripcion.trim(), url: canonica }, null, 2) : null };
}
