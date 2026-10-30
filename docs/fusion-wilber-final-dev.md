# Fusión `orq/wilber-final-dev` (30-oct-2026)

Base: `origin/codex/wilber-crm-20261026` @ `5f09b6c` (es lo que corre en producción, `2f0d83f` + un doc).

## Criterio para identificar las ramas de Wilber
La API `events` del repo (`Jvven-24/QuisqueyaHome_CRM`) muestra qué ramas creó el usuario `wilberdelarosa` (`CreateEvent`): `codex/wilber-crm-20261026` (la base), `dev/version-final-ui-ux` y 9 ramas `orq/*` (prueba, normalizar, modular, integracion, tareas-restaurar, academy-recert, obs-menores, agenda-listas, luna-ui-etapa2). Más `orq/claude-web/rediseno-movil-p1` (push del 30-oct 02:39 UTC, aún fuera de la ventana de events). Total: 12 con la base, 11 sin ella. Las ramas `dev/jvven`, `dev/reestructuracion-solid(-codex)`, `develop` y `main` son de Jvven-24 y no se tocan.
`activity` devolvió 404 (sin permisos de admin). Los 'autores' de los commits de las ramas orq son Grok Bot / Viltrum Code / Claude (cuentas de agentes que empujan con la sesión de Wilber).

## Ramas
| Rama | Commit | Fecha (RD) | Autor | Estado frente a la base |
|---|---|---|---|---|
| `orq/claude-opus/agenda-listas` | `15e26ab` | 27/10/2026 11:04 AM | Grok Bot | 0 commits por delante |
| `orq/codex-luna/normalizar` | `0b40fef` | 27/10/2026 10:30 AM | Grok Bot | 0 commits por delante |
| `orq/grok-build/modular` | `052d3f0` | 27/10/2026 10:23 AM | Grok Bot | 0 commits por delante |
| `orq/integracion` | `7739683` | 28/10/2026 08:57 AM | Grok Bot | 0 commits por delante |
| `orq/luna-ui-etapa2` | `86e4fda` | 28/10/2026 08:57 AM | Grok Bot | 0 commits por delante |
| `orq/viltrum-code/academy-recert` | `263ec1f` | 27/10/2026 10:56 AM | Grok Bot | 0 commits por delante |
| `orq/viltrum-code/obs-menores` | `302a8e8` | 27/10/2026 10:57 AM | Grok Bot | 0 commits por delante |
| `orq/viltrum-code/tareas-restaurar` | `2c6db58` | 27/10/2026 10:36 AM | Grok Bot | 0 commits por delante |
| `orq/viltrum-code/prueba` | `bd227a1` | 27/10/2026 09:56 AM | Viltrum Code | 1 commits por delante |
| `orq/claude-web/rediseno-movil-p1` | `3ff01d4` | 29/10/2026 10:39 PM | Claude | 1 commits por delante |
| `dev/version-final-ui-ux` | `7be3b8f` | 14/10/2026 04:29 PM | wilberdelarosa | 148 commits por delante |

## Orden de fusión (todas con `--no-ff`)
1. Ocho ramas `orq/*` ya contenidas en la base (agenda-listas, normalizar, modular, integracion, luna-ui-etapa2, academy-recert, obs-menores, tareas-restaurar): git responde «Already up to date»; no hay nada que fusionar (un `--no-ff` sobre un ancestro no crea commit). Quedan registradas aquí.
2. `orq/viltrum-code/prueba` (`bd227a1`): 1 línea en `docs/MANTENIMIENTO-VILTRUM-DOCS.md`. Sin conflicto.
3. `orq/claude-web/rediseno-movil-p1` (`3ff01d4`): rediseño móvil pasada 1 (29 archivos de código + capturas en `docs/rediseno/p1/`). Sin conflicto (su padre es la propia base).

## Conflictos
Ninguno en las fusiones 2 y 3. No hubo que resolver nada ni renumerar nada.

## Ramas descartadas (no fusionadas) y por qué
- `dev/version-final-ui-ux` (`7be3b8f`, creada por wilberdelarosa el 14-oct): **dudosa, no fusionada.** Es otra línea de historia (base común `d8182e3`, anterior a la instantánea del 26-oct de la que sale la base): 148 commits propios (132 sin equivalente por `git cherry`), 2016 archivos distintos con la base, una prueba de fusión da 207 conflictos, trae ~1176 archivos de `.viltrum/`, solo 417 archivos en `src/` (la base tiene 928) y 13 migraciones drizzle (la base 31). Fusionarla borraría o revertiría lo desplegado. Si Wilber quiere rescatar algo concreto (p. ej. `src/components/ui/timeline.tsx`, `aprendizaje`, cliente Moodle), se trae por piezas con cherry-pick.
- `orq/viltrum-code/rediseno-opus` y `orq/viltrum-code/integraciones-oauth`: solo existen en local (no están en el remoto) y el primero no tiene cambios. No incluidas.

## Migraciones drizzle
Ninguna nueva (`drizzle/` termina en `0017_rbac_supervision.sql`, ya aplicada). La rama `integraciones-oauth` trae una 0018 sin aplicar, pero no está en esta fusión. No hace falta `pg_dump` para desplegar esta rama.
