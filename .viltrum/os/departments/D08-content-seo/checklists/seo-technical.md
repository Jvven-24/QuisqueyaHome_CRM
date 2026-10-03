# Checklist — SEO técnico

> Se aplica a toda página pública antes de publicar.
> Firma D02, nunca quien escribió el contenido.

## A. Metadatos por página

- [ ] Título único y fiel al contenido; longitud como criterio editorial, sin tratar un conteo de caracteres como obligación de Google
- [ ] H1 único por página, coincide con el tema real
- [ ] Jerarquía H2/H3 sin saltos ni desorden
- [ ] Meta descripción única, resume el contenido e invita a la acción
- [ ] Canonical presente y apunta a la URL preferida
- [ ] Open Graph y Twitter Card con título, descripción e imagen propios de la página

## B. Rastreo e indexación

- [ ] La página aparece en el sitemap XML si debe indexarse
- [ ] `robots.txt` no bloquea páginas que deben indexarse
- [ ] No se confunde bloqueo de rastreo con desindexación; `noindex` es legible para el crawler donde se use y rutas privadas exigen autorización real
- [ ] URL legible, estable, en minúsculas, sin parámetros innecesarios
- [ ] Sin contenido duplicado compitiendo por la misma intención de búsqueda sin canonical

## C. Internacionalización

- [ ] Hreflang presente si hay más de un idioma o región
- [ ] Cada hreflang apunta a la versión correcta y recíproca de la página

## D. Datos estructurados

- [ ] Tipo de schema.org correcto para el contenido (Organization, Product, Article, FAQPage, BreadcrumbList, LocalBusiness, u otro aplicable)
- [ ] Solo se declara lo que la página muestra visible y verificablemente
- [ ] Sin errores de sintaxis en el marcado estructurado

## E. Rendimiento como factor

Registrar fuente, periodo y muestra; datos de laboratorio son diagnóstico, no percentil 75 de usuarios reales. Sin datos de campo declarar pendiente, coordinado con D15.

- [ ] LCP medido y registrado (objetivo ≤ 2.5s en percentil 75)
- [ ] INP medido y registrado (objetivo ≤ 200ms en percentil 75)
- [ ] CLS medido y registrado (objetivo ≤ 0.1 en percentil 75)
- [ ] Si no cumple, comunicado explícitamente a D15/D09 con los números medidos

## F. Verificación cruzada

- [ ] Texto alternativo de imágenes revisado con D07
- [ ] Formato de números, fechas y moneda revisado con D05/D11

---

## Veredicto

```
APROBADO      — SEO técnico completo, verificado página por página
CONDICIONAL   — excepciones listadas, con dueño y fecha. Nunca con un P0
RECHAZADO     — vuelve a D08 con hallazgos clasificados
```

Firma el revisor (D02), **nunca** quien produjo el SEO técnico.
