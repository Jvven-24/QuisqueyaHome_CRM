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
