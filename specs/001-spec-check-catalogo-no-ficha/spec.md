---
id: TOOL-001
nombre: Excluir catálogo histórico no probatorio del conteo de fichas
estado: READY
nivel: L2
riesgo: R2
owner: D03
revisores: [D14, D12]
actualizado: 2026-10-04
---

# TOOL-001 · Clasificación exacta de `CAPACIDADES.md` en `spec:check`

**Tipo:** tarea técnica de gobernanza, no módulo de producto ni integración nueva. **Estado READY para despachar la corrección acotada:** D12 emitió PASS de contrato en `.viltrum/reviews/D12-preparacion-integraciones-locales-2026-10-04.md` §«Revisión posterior de TOOL-001» y D14 emitió PASS para READY en `.viltrum/reviews/D14-revision-TOOL-001-READY-2026-10-04.md`. El filtro actual sigue defectuoso; READY no significa BUILT ni prueba verde. Origen: `.viltrum/research/D03-diagnostico-spec-check-catalogo-2026-10-04.md`.

## Problema y resultado

El validador **actual** ya contiene en `scripts/spec/check.mjs` un filtro `if (!/^[MGI]\d+-/i.test(path.basename(filename))) continue;`. Por eso `npm run spec:check` ahora puede dar 0 bloqueos, pero omite tanto `CAPACIDADES.md` como cualquier `OTRO.md` inválido en los tres directorios. D14 reprodujo el falso verde con fixture (`.viltrum/reviews/D14-revision-READY-I01-A-TOOL-001-2026-10-04.md`). `CAPACIDADES.md` es investigación histórica con enlaces inventados, no ficha. Esta tarea **corrige el bug ya presente**: retirar filtro amplio y excluir únicamente ese basename exacto bajo `integraciones/`, conservando el catálogo y su JSON como evidencia no probatoria. No se corrigen ni verifican URLs en este lote.

## Alcance cerrado

- **Permitidos para el parche:** `scripts/spec/check.mjs`, `scripts/spec/check.test.mjs`.
- **Solo lectura:** `.viltrum/vre-os/spec/integraciones/CAPACIDADES.md`, `capacidades.json`, `I01-twenty.md`, `I02-moodle.md`, `.viltrum/vre-os/spec/00-indice.md`.
- **Prohibido en este lote:** editar `CAPACIDADES.md` para añadir cabecera/estado, cambiar `capacidades.json` a `verificado:true`, mover/renombrar archivos con handoffs históricos, relajar validación general de nombres/campos/secciones, modificar fichas de producto, hacer push o tocar nube/VPS.
- **Productor previsto:** D10 o D16 en worktree aislado, despacho ≤45 min. **Revisores:** D14 para pruebas y D12 para asegurar que la excepción no oculte fichas inválidas; productor distinto del revisor.

## Criterios de aceptación ejecutables

1. En fixture con `CAPACIDADES.md` y dos fichas válidas `I01-*`, `I02-*`, `runCheck()` devuelve `stats.total === 2` y ninguna observación bloqueante atribuida al catálogo. `CAPACIDADES.md` permanece físicamente idéntico y no obtiene estado `READY`.
2. En el mismo fixture, añadir `OTRO.md` sin formato de ficha produce hallazgos de nombre/cabecera/secciones y exit 1. Añadir `I03-defectuosa.md` también falla. La exclusión no se convierte en filtro general por patrón `Ixx` que silencie errores.
3. La comparación del basename es exacta y se aplica solo en `integraciones`; `CAPACIDADES.md` dentro de `modulos/` o `globales/` no queda excluido. `I01/I02` siguen contadas y su estado no cambia.
4. La salida informa de forma no bloqueante que el catálogo se omite como investigación no probatoria, sin introducirlo al numerador/denominador ni presentarlo como API verificada. D14 valida que el resultado no oculta otros hallazgos.
5. `node --test scripts/spec/check.test.mjs` verifica los casos anteriores, incluido proceso CLI con exit 1 para fixture inválido. `npm run spec:check` pasa en la copia actual si no hay otros bloqueos, pero **su 0 previo era falso verde**. Ejecutar regresión `npm test`, `npm run typecheck` y `npm run lint` sin atribuir fallos ajenos a este cambio.

## Dependencias para READY

D12 y D14 aprobaron **el contrato de corrección** para `READY`, después de sus FAIL históricos; referencias arriba. D00 registra esta ruta en el índice del Spec Pack y despacha el parche solo en los dos archivos permitidos. D14/D12 revisan **después** la implementación y las regresiones; ninguna salida de `spec:check` posterior por sí sola marca I01, I02 o I01-A `READY`.
