# Instrucciones para agentes — CRM Quisqueya Home

Next.js 15 · React 19 · TypeScript · Supabase · Drizzle · Zod. El contexto
completo vive en `docs/contexto/` (arquitectura, convenciones, decisiones,
flujo de trabajo, errores conocidos). Léelo antes de cambiar código.

## Milestone activo: Reestructuración con metodología SOLID

**Empieza leyendo `docs/R_RELEVO.md`.** Describe el commit donde vive: en qué fase
estamos, qué está verde, qué debe probar Codex y cuál es el siguiente issue de
código. Se reescribe en cada push, así que es fiable aunque no tengas ninguna
conversación previa.

Reparto vigente, decidido el 04/10/2026 (decisión #44; sustituye al del 02/10):

- **Programa VRE-OS** (`.viltrum/vre-os/M-20261004-VRE.md`): **Codex y Antigravity
  producen código** —backend, datos, vistas y pruebas— cuando reciben una tarea
  despachada por perfil (`tools/profile_dispatch.py`, archivo `TAREA.md` con los
  archivos permitidos). Trabajan en un worktree aislado y entregan un parche; no
  usan `git` ni hacen commit o push.
- **Claude orquesta y revisa**: aplica el parche solo si `typecheck`, `lint`,
  `test` y `build` están en verde, y es el único que hace commit (en `develop`,
  sin push sin autorización de Wilber).
- La revisión la hace siempre un proveedor distinto del que produjo.

Quien escribe no es quien prueba: así ningún agente corrige su propia tarea.
El reparto del 02/10 (Claude escribe, Codex solo prueba en `../crm-codex`) queda
histórico en `docs/R_ANALISIS_Y_PLAN.md` §5.
El detalle está en `docs/R_ANALISIS_Y_PLAN.md` §5 y el porqué en
`docs/superpowers/specs/2026-10-02-flujo-claude-codex-y-relevo-design.md`.

Mientras dure el milestone no se añaden funciones nuevas. El diseño visual sale
de `docs/DESIGN.md`.

## Seguridad: no negociable

Antes de cerrar cualquier cambio, recorre el checklist de
`docs/contexto/flujo-de-trabajo.md` §6. Lo mínimo:

- Toda tabla nueva lleva RLS (`.enableRLS()` en `schema.ts`). `npm test` falla si no.
- Toda ruta de `src/app/api/` llama a `requireScope`/`requireFullScope` antes de
  tocar datos, y las rutas por `:id` filtran con `visibleRows`/`reaches`.
  `npm test` falla si falta el permiso.
- Cuerpos JSON con Zod y asignación campo por campo; nunca `...body`.
- Variables de entorno solo en `src/infrastructure/env.ts`. La `service_role`
  nunca en código de cliente.
- Ninguna credencial en el repositorio (decisión #39).
- Al terminar: revisión de seguridad del diff. Los hallazgos se reportan con
  archivo:línea y escenario concreto; si algo está bien, se dice.

## Verificación antes de dar algo por terminado

`npm run typecheck && npm run lint && npm test && npm run build`, y probar el
flujo en la interfaz. No se abre PR con algo fallando.

Cuatro candados, cada uno por un fallo que ya pasó:

1. **Un issue se cierra cuando tú viste la corrida de `npm test` en verde**, nunca
   por el informe de otro agente. El 02/10 un informe decía "todo verde" con una
   prueba fallando.
2. **Antes de comparar local con remoto o de dar trabajo por perdido, `git fetch`
   tiene que terminar sin error.** Un ref corrupto de 41 bytes en ceros los rompía
   todos y el local pasó días ciego al remoto; se dio por perdido trabajo que
   estaba pusheado. Si `fetch` falla, ese es el problema: arréglalo primero.
3. **Un issue solo se cierra si su commit es ancestro de
   `dev/reestructuracion-solid`** (`git merge-base --is-ancestor`).
4. **Nada se prueba si no está pusheado**, y `docs/R_RELEVO.md` se actualiza en el
   mismo commit que el código. No hay push sin relevo al día.

Cada commit lleva al pie una línea `Probar: <issue>`, o `Probar: nada`.

## Entorno

- Codex: no ejecutes `npm run build` ni `npm run dev` en esta carpeta; deja
  archivos en `.next/` que el usuario de Windows no puede borrar
  (`errores-conocidos.md`).
- No crees ramas nuevas sin que el usuario lo pida. Excepción: la rama y el
  worktree de Codex que define `docs/R_ANALISIS_Y_PLAN.md` §5.
- `docs/contexto/decisiones.md` solo se amplía: se añaden entradas numeradas
  nuevas y nunca se reescriben ni se borran las anteriores.

<!-- viltrum:integration:start -->
# Viltrum Agentic OS

Lee `.viltrum/project.md`, `.viltrum/status.md` y la doctrina `.viltrum/os/CLAUDE.md` antes de actuar. Clasifica con `.viltrum/os/core/routing.md`; D00 coordina y no produce. Los perfiles están en `.viltrum/os/departments/` y sus skills en `.viltrum/os/skills/`. Para reuniones, usa D01 y D22; D02 define alcance y D21 investiga antes de construir. La construcción nueva con D09/D10/D11/D16/D18/D19 espera C1 vigente en `.viltrum/commercial.md`; D11/D18/D19 pueden analizar opciones conceptuales antes. Registra evidencia en `.viltrum/` y solicita revisión independiente según `.viltrum/os/registry/departments.yaml`. Ningún perfil aprueba su propio trabajo.
<!-- viltrum:integration:end -->

<!-- viltrum:orchestration:v1 -->
Para coordinar todo el proyecto usa la skill `orquestar` o `viltrum orchestrate . --goal <objetivo>`. Lee `.viltrum/os/core/orchestration.md`, confirma la clasificación y trabaja con perfiles/contratos. El plan prepara contexto; el host ejecuta los agentes y conserva revisión independiente.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **QuisqueyaHome_CRM** (4364 symbols, 8767 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/QuisqueyaHome_CRM/context` | Codebase overview, check index freshness |
| `gitnexus://repo/QuisqueyaHome_CRM/clusters` | All functional areas |
| `gitnexus://repo/QuisqueyaHome_CRM/processes` | All execution flows |
| `gitnexus://repo/QuisqueyaHome_CRM/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
