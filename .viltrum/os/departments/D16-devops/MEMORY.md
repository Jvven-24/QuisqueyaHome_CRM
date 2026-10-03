# D16 — Memoria

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

---

### 2026-09-30 — Endurecimiento de Caddyfile y Aislamiento de Túnel SSH para Pruebas en VPS
**Qué pasó:** Los despliegues y pruebas locales no contaban con HSTS forzado en el proxy inverso, y las pruebas contra la VPS requerían credenciales manuales.
**Por qué:** Falta de bloque de cabeceras de seguridad centralizadas en Caddyfile y ausencia de automatización de túnel SSH para verificar la base remota sin exponer contraseñas.
**Qué cambió:** Incorporado en `deploy/Caddyfile`: HSTS (`max-age=31536000`), supresión del header `server`, compresión `zstd gzip`, y reglas de inmutabilidad estática. Se formalizó el script `with-vps-db.ps1` que levanta túneles SSH efímeros con puerto local dinámico leyendo `DATABASE_URL` directamente del contenedor de Docker en Hostinger.
**Evidencia:** `deploy/Caddyfile`, `scripts/with-vps-db.ps1`, ejecución exitosa de `npm run test:api:vps` (30/30 checks passed).
