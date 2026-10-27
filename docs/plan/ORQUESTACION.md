# Orquestación de ramas — CRM Quisqueya Home
Rama de integración: `codex/wilber-crm-20261026` (nunca force-push, nunca main). Cada rama trabaja en su worktree `/workspace/orq/<rama>-<tarea>` sobre `orq/<rama>/<tarea>`. El orquestador revisa el diff, corre tests (`npx -y node@22 --test "src/**/*.test.ts"` + `tsc --noEmit`), hace commit, `git pull --rebase` y push. Prohibido tocar auth/login/correo (lo lleva otro worker).

| Rama | Capacidad | Tareas asignadas (fase 3) | Worktree / log |
|---|---|---|---|
| claude-haiku (Claude Code, claude-haiku-5-5) | docs, fixes simples, scaffolds de tests | Specs por módulo `modulos/*.md` (4 lotes en paralelo) | logs `orq/logs/docs-haiku-*.log` |
| opencode-free (deepseek-v4.1-flash-free → glm-5.3-flash-free) | docs, fixes simples, tests | Revisión delta contra el Compendio (solo lectura) | `tablero/revisiones/opencode-free.*` |
| codex-luna (Codex, gpt-6-luna) | refactors medianos, features | Normalizar PageHeader/ModuleTabs/Section + flag de UI demo | `/workspace/orq/codex-luna-normalizar` · `orq/codex-luna/normalizar` |
| grok-build (OpenCode, xai/grok-build-0.1) | refactors medianos, features | Registro de módulos + nav desde registro + dividir `tareas/vista.tsx` | `/workspace/orq/grok-build-modular` · `orq/grok-build/modular` |
| antigravity (agy en VPS, copia en /tmp/qh-review) | revisiones grandes, auditoría visual/móvil | Revisión delta contra el Compendio | `tablero/revisiones/antigravity.*` |
| orquestador | integración y revisión final | merge, tests, deploy, tablero | `/workspace/orq/integracion` |

## Hook Viltrum OS (perfiles)
Cuando Wilber envíe el documento de perfiles: guardarlo en `/workspace/crm-plan/ref/viltrum-os-perfiles.*`, extraer texto a `ref/viltrum-os.txt` y correr `tablero/viltrum-os.sh <dir_codigo>` → lanza las 5 ramas de revisión con el mismo prompt sobre ese sistema, y sus hallazgos entran en estado.json bajo módulos `vos-*`.

## Resultados fase 3 (27/10/2026, hora RD)
- 10:03 `baf637b` registro de módulos (grok-build): aceptado tras corregir ids (Agenda/Tareas conservan `M4` vía `idLegado`) y verificar que MODULOS/ENTRADAS/WORKSPACES quedan idénticos.
- 10:03 `dd68ca5` normalización G20 (codex-luna): aceptado; 1138 tests verdes, tsc y build OK. Desplegado y verificado en vivo (22 rutas 200, sin selector demo).
- RECHAZADO: división de `tareas/vista.tsx` de grok-build (perdía ~1.800 líneas: modo brokers, relevo operativo, reasignarLotePorBroker; y debilitaba tests con `assert.ok(true)`). Reasignado a codex-luna (`orq/codex-luna/tareas`) con condición de conservar símbolos y aserciones.
- Choque: existe otro orquestador (`orq/vigilante.py`) que usa `/workspace/orq/integracion` y hace `git reset --hard ORIG_HEAD` ahí; por eso esta fase integra en `/workspace/orq/int-g20` (rama `orq/integracion-g20`).
