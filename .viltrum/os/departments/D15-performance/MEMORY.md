# D15 — Memoria

> Lo que se aprende y no se escribe, se vuelve a pagar.
> Entradas nuevas arriba. Cada una lleva fecha, qué pasó y qué cambió.

## Formato

```
### YYYY-MM-DD — Título corto
**Qué pasó:** hecho observado
**Por qué:** causa real, no síntoma
**Qué cambió:** skill nueva / SOP / checklist / práctica deprecada
**Evidencia:** enlace
```

### 2026-09-30 — Estrategia de Caché en 3 Niveles para Portales Inmobiliarios y CMS
**Qué pasó:** El portal realizaba consultas redundantes y descargas completas de catálogo en cada navegación, sin aprovechar cabeceras condicionales ni inmutabilidad de bundler.
**Por qué:** Se aplicaba `no-store` indistintamente en la API pública y no existía diferenciación de caché entre activos estáticos con hash y contenido editorial mutable.
**Qué cambió:** Establecida arquitectura de caché en 3 niveles:
  1. Proxy Inverso (Caddy): `immutable` para `dist/assets/*`, SWR para imágenes WebP y compresión zstd/gzip.
  2. Capa Backend (Node): Serialización memoizada con ETag (SHA-256 base64url) respondiendo 304 Not Modified; invalidación activa tras mutaciones.
  3. Navegador / Cliente: `stale-while-revalidate` y preservación de guardados locales en IndexedDB/localStorage.
**Evidencia:** `deploy/Caddyfile`, `server/catalog-cache.mjs`, pruebas de rendimiento en QuisqueyaHome.
