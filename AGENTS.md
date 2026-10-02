# Instrucciones para agentes — CRM Quisqueya Home

Next.js 15 · React 19 · TypeScript · Supabase · Drizzle · Zod. El contexto
completo vive en `docs/contexto/` (arquitectura, convenciones, decisiones,
flujo de trabajo, errores conocidos). Léelo antes de cambiar código.

## Milestone activo: Reestructuración con metodología SOLID

**Empieza leyendo `docs/R_RELEVO.md`.** Describe el commit donde vive: en qué fase
estamos, qué está verde, qué debe probar Codex y cuál es el siguiente issue de
código. Se reescribe en cada push, así que es fiable aunque no tengas ninguna
conversación previa.

Reparto, decidido el 02/10/2026 (sustituye lo que decía la §5 antes):

- **Claude escribe todo el código** —backend, vistas y pruebas unitarias— en esta
  carpeta y en la rama `dev/reestructuracion-solid`, y es el único que usa `git`
  y `gh`.
- **Codex solo prueba la interfaz** en un navegador, buscando romperla. No escribe
  código ni usa `git`. Prueba contra la vitrina `../crm-codex`, clavada a un
  commit verificado con el servidor ya levantado, y deja lo que encuentre en
  `../crm-codex/hallazgos/<issue>.md`. **Nunca** ejecuta `npm run dev` ni `build`.

Quien escribe no es quien prueba: así ningún agente corrige su propia tarea.
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
