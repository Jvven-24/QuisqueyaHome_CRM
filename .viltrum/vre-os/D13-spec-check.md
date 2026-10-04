# D13 · `spec:check`

## Resultado

Implementado el validador local del Spec Pack y el resumen del índice. No se añadieron dependencias. El formato `node:test` del validador no coincide con el glob actual de `npm test` (`src/**/*.test.ts`), así que se creó el comando independiente `npm run test:spec`.

## Uso

- `npm run spec:check`: valida el Spec Pack, imprime el resumen y devuelve código distinto de cero si encuentra bloqueos.
- `npm run spec:check -- --md`: hace lo mismo y actualiza solo el contenido entre los marcadores de avance en `spec/00-indice.md`.
- `npm run test:spec`: corre las pruebas aisladas del validador.

## Reglas implementadas

- Lee fichas Markdown directamente dentro de `spec/modulos`, `spec/globales` y `spec/integraciones`; directorios aún inexistentes cuentan como vacíos. No requiere paquetes externos.
- Parsea cabecera YAML simple: escalares, listas entre corchetes y listas con guiones. Comprueba `id`, `nombre` o `sistema`, `estado`, `riesgo`, `owner`, `revisores` y `actualizado`; estado permitido, unicidad del ID y correspondencia entre el ID y el nombre del archivo.
- Exige nueve secciones numeradas para módulos/globales y diez para integraciones; marca secciones ausentes, sin contenido o con `TODO`. Las fichas `READY`, `BUILT` o `VERIFIED` también bloquean por `UNKNOWN` en §8.
- Revisa referencias `Ficha:` en tareas `T-*.md` con fecha local de creación igual o posterior al día actual; falla si la ficha no existe o su estado es anterior a `READY`. Las tareas sin referencia se informan como legado y no bloquean.
- Imprime totales por estado y tipo, porcentaje READY o superior, y hallazgos. `--md` genera la tabla equivalente en los marcadores del índice. Los bloqueos, incluido un índice ausente o con marcadores inválidos en modo `--md`, dan código de salida 1.

## Pruebas

Fixtures creados en directorios temporales; no se modificaron fichas reales.

- `npm run spec:check` — salida real: `Spec Pack: 0 fichas; listas READY o superior: 0%`; estados DRAFT/REVIEW/READY/BUILT/VERIFIED en 0; tipos Módulo/Global/Integración en 0; `Bloqueos: 0`. Informó 18 tareas sin `Ficha:` como `legado`. Código 0.
- `npm run spec:check -- --md` — misma salida y código 0; escribió la tabla con ceros entre los marcadores de `.viltrum/vre-os/spec/00-indice.md`.
- `npm run test:spec` — 5 pruebas aprobadas, 0 fallidas: fichas completas de módulo e integración, ficha incompleta, `READY` con huecos y `UNKNOWN`, tarea que referencia ficha DRAFT y actualización acotada `--md`.
- `npx tsc --noEmit --incremental false` — código 0, sin errores.
- `npm test` — 508 aprobadas, 0 fallidas.
- `npm run lint` — código 0, 0 errores y 12 advertencias en archivos no modificados (`scripts/seed/**` y `src/app/**`). No se atribuyen al cambio.
- `npm run build` — no ejecutado: el entorno del repositorio prohíbe ejecutarlo desde este worktree de Codex porque deja `.next/` que Windows no puede borrar.

Los ejecutables `.ps1` de `npm`/`npx` fueron bloqueados por la política de firma de PowerShell; las mismas verificaciones se completaron mediante `npm.cmd`/`npx.cmd`.

## Revisión de alcance y seguridad

El diff contiene los nuevos `scripts/spec/check.mjs` y `scripts/spec/check.test.mjs`, las entradas de scripts en `package.json`, la tabla dentro de los marcadores de `spec/00-indice.md` y este informe. No inspecciona variables de entorno, archivos `.env`, credenciales ni cadenas de conexión; no hace llamadas de red. La revisión del diff no encontró secretos. No se editó ningún archivo fuera del despacho y este entregable.

El análisis GitNexus de impacto no estuvo disponible en las herramientas de esta sesión; no se ejecutó. El validador es código nuevo, por lo que no hubo símbolos existentes que modificar. No se ejecutó `gitnexus_detect_changes()` porque no se va a crear un commit desde este perfil.

## Handoff

- Productor: D13. Revisor asignado por la tarea: D14, independiente; **revisión pendiente**, no se aprueba este trabajo.
- Revisar el parser de cabecera YAML simple y el cómputo de fecha local de creación de las tareas en `scripts/spec/check.mjs`, además de confirmar el diff permitido.
- El build no está verificado por la restricción de entorno señalada arriba. Lint conserva 12 advertencias en archivos ajenos al cambio.
- No se creó commit ni se hizo push. La entrega queda como parche local para revisión.
