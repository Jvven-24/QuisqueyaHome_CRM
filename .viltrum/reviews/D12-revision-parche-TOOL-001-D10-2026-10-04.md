# D12 · Revisión independiente del parche D10 TOOL-001

**Fecha:** 2026-10-04, America/Santo_Domingo. **Revisor:** D12, distinto del productor D10; actividad HOST-8a6f8a19b13a4d90bca94187717550a9. **Ficha:** `specs/001-spec-check-catalogo-no-ficha/spec.md`, `READY`/L2, R2. **Objeto revisado:** diff de `scripts/spec/check.mjs` y `scripts/spec/check.test.mjs` en el worktree `C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261004T230500Z-D10-TOOL001`. Solo revisión de lectura; no se cambió código, ficha o gate.

## Dictamen

**PASS de seguridad y alcance para integrar el parche TOOL-001**, sujeto a la revisión funcional D14 y a aplicar **ese mismo diff**. La excepción quedó limitada al basename exacto `CAPACIDADES.md` del primer nivel de `integraciones/`; el filtro general que ocultaba cualquier archivo mal nombrado fue eliminado. El aviso señala que el catálogo no acredita APIs. Ninguna ficha I00/I01/I02/I01-A ni capacidad OSS queda aprobada por este resultado.

## Evidencia

| Criterio TOOL-001 | Observación |
|---|---|
| Excepción exacta | `check.mjs` elimina `if (!/^[MGI]\\d+-/i.test(path.basename(filename))) continue;` y añade `directory === 'integraciones' && path.basename(filename) === 'CAPACIDADES.md'`. La omisión ocurre antes de leer/registrar la ficha y añade `notice`, no `finding` ni estado `READY`. |
| Otros archivos siguen bloqueando | Prueba nueva crea `OTRO.md` e `I03-defectuosa.md`: comprueba nombre, cabecera y secciones; `spawnSync` del CLI exige exit 1. Un `CAPACIDADES.md` bajo `modulos/` o `globales/` produce hallazgos. |
| Catálogo sin mutación ni cobertura inventada | Fixture comprueba contenido byte a byte tras `runCheck()`, total de dos Ixx y aviso «investigación no probatoria, no acredita APIs verificadas». El diff no toca catálogo ni JSON. |
| Ejecución independiente D12 | `node --test scripts/spec/check.test.mjs` → **8/8 pass**, 0 fail. `npm run spec:check` → exit 0, 4 fichas, 0 READY, 0 bloqueos, aviso explícito del catálogo y advertencias de tareas legadas. `git diff --check` no informó errores de whitespace; Git avisó futura conversión LF/CRLF, sin cambio funcional observado. |
| Archivos acotados | `git status --short` en worktree: solo `scripts/spec/check.mjs` y `scripts/spec/check.test.mjs` modificados; `TAREA.md` no seguido es despacho, no parte del parche. |

**Límites:** D12 no repitió `typecheck`, `lint`, `npm test` ni `build`; el productor informó esos comandos verdes en el worktree y D14 debe cotejar su evidencia antes de integración. La prueba de este parche protege el **primer nivel** de los tres directorios que enumera `runCheck()`; no amplía el validador a subfichas anidadas como I01-A. Ese alcance ya existía y requiere seguimiento separado. `spec:check` verde significa estructura de fichas enumeradas, no `READY` de integraciones, seguridad de datos ni funcionalidad C1.
