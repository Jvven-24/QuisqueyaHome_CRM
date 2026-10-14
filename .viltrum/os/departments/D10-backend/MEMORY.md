# D10 — Memoria

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

### 2026-10-06 — Error de validación sin campo ni clave de mensaje
**Qué pasó:** En Quisqueya un formulario con obligatorios sin marca y Guardar deshabilitado sin motivo (hecho del mandato). Qué devolvía el servidor no está documentado: hipótesis, no verificado, de que el rechazo fuera genérico y el cliente no pudiera señalar el campo.
**Por qué:** El perfil fijaba RFC 9457 pero no un contrato de error por campo ni claves de mensaje (verificado en el texto del perfil); que el cliente fuera la única capa que "explicaba" es hipótesis.
**Qué cambió:** `AGENTS.md` (puntos 2 y 7) y `sops/delivery.md`: 422 con extensión propia `errors[]` = `{field, code, messageKey, params}`, claves de catálogo (P2), prueba de contrato que puede fallar, `field` público y sin fuga por `code`/`messageKey`/`params`, anti-enumeración extendida, validación servidor independiente (R4/R5 en `core/doctrine/ux-states.md`); caso de eval nuevo. RFC 9457 verificado 2026-10-06: extensiones permitidas, el cliente ignora las desconocidas.
**Evidencia:** `.viltrum/mandates/M-alcance-robusto-2026-10-06.md`; `evals/cases.md` (Guardar rechazado sin decir qué campo).

### 2026-10-04 — Incidente crítico de catálogo bloqueado (503 / "Catálogo no disponible") en arranque en frío y DB sin migrar
**Qué pasó:** Durante pruebas locales, al arrancar contra una BD nueva/aislada o con conexión caída, el portal colapsó mostrando "0 proyectos encontrados" / "Catálogo no disponible" con botón de reintentar.
**Por qué:** 1) server/catalog.mjs ejecutaba 11 consultas en un Promise.all crudo; si una tabla auxiliar (ej. project_videos) no existía en staging, fallaba toda la consulta. 2) En arranque en frío (cached === null), server/catalog-cache.mjs capturaba el fallo y re-lanzaba el error produciendo un HTTP 503 en lugar de degradar.
**Qué cambió:** 1) Doctrina Zero-Downtime Catalog: consultas a tablas secundarias aisladas con .catch seguro. 2) Fallback obligatorio a snapshot estático pre-empaquetado (src/data/catalog.json) en arranque en frío, devolviendo siempre HTTP 200 con X-Catalog-Fallback: snapshot y X-Catalog-Stale: 1. 3) Prohibición absoluta de responder 503 en vitrina pública existiendo snapshot.
**Evidencia:** server/catalog-cache.mjs, server/catalog.mjs, scripts/catalog-resilience-unit-test.mjs, scripts/modular-qa-unit-tests.mjs (Módulo 7).

### 2026-09-30 — Agotamiento de pool PostgreSQL por verificación de medios y catálogo masivo
**Qué pasó:** El servidor backend caía con error 503 (`connection timeout`) ante ráfagas de 15 peticiones de imágenes o visitas simultáneas al catálogo.
**Por qué:** El pool estaba limitado a `max: 8`. En cada petición estática de imagen se ejecutaba un `select 1 from project_media` sin caché, y cada `GET /api/catalog` ejecutaba 11 consultas SQL concurrentes forzando `no-store`.
**Qué cambió:** Implementado módulo de caché en memoria con ETags y soporte 304 (`server/catalog-cache.mjs`), caché LRU en memoria con TTL de 5 min para autorización de medios (`server/static.mjs`), e invalidación reactiva conectada al bus de auditoría (`audit()`).
**Evidencia:** `server/catalog-cache.mjs`, `server/static.mjs`, suite de pruebas de QuisqueyaHome pasando 30/30 comprobaciones.

### 2026-09-30 — Desincronización de columnas y valores en inserción SQL dinámica
**Qué pasó:** En inserciones dinámicas de tipologías (`project_variants`), la query mapeaba `$1..$N` con `Object.values(fields)` mientras las columnas se ordenaban con `Object.keys(fields)`.
**Por qué:** En JavaScript, el orden de iteración de propiedades en objetos mutados no garantiza coincidencia exacta entre `keys()` y `values()`.
**Qué cambió:** Regla obligatoria: en SQL dinámico mapear siempre `keys.map(k => fields[k])` para garantizar sincronización posicional 1:1.
**Evidencia:** `server/project-tools.mjs:119`.
