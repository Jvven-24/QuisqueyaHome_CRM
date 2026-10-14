# D14 — Memoria

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

### 2026-10-04 — Falso positivo al asumir que 503 en Cold Boot era comportamiento seguro en pruebas unitarias
**Qué pasó:** La suite de pruebas contenía un test (QA-04: unavailable before the first successful load gives safe 503) que legitimaba responder 503 Service Unavailable si la BD fallaba en el primer arranque, provocando que un usuario en local viese "Catálogo no disponible" / "0 proyectos encontrados".
**Por qué:** Se confundió "ocultar el detalle del error de BD" con "comportamiento de resiliencia correcto". Un catálogo público con snapshot estático disponible en disco NUNCA debe responder 503.
**Qué cambió:** 1) Actualizado QA-04 en scripts/catalog-resilience-unit-test.mjs para exigir HTTP 200 con cabecera X-Catalog-Fallback: snapshot. 2) Añadido Módulo 7 a scripts/modular-qa-unit-tests.mjs con pruebas de simulación de ECONNREFUSED y fallo de tablas secundarias. 3) Criterio de veto permanente en Gate G6: cualquier caída a 503 por desconexión de BD en catálogo público con snapshot bloquea inmediatamente la entrega.
**Evidencia:** scripts/catalog-resilience-unit-test.mjs, scripts/modular-qa-unit-tests.mjs, .viltrum/os/departments/D14-qa/AGENTS.md.

### 2026-10-06 — Formularios: botón sin motivo, obligatorios sin marca, validación probada en una capa
**Qué pasó:** En Quisqueya los campos obligatorios no tenían marca y Guardar quedaba deshabilitado sin decir por qué; el error de servidor se vería solo como aviso genérico.
**Por qué:** El QA solo recorría el camino feliz y probaba la validación por la interfaz; ninguna regla pedía probar el estado incompleto ni cada capa por separado.
**Qué cambió:** AGENTS.md (sección 4) y `checklists/e2e-forms.md` (B y B2): prueba negativa por capa y hallazgos P2 del contrato R8 de `ux-states.md`; casos 6 y 7 en `evals/cases.md`.
**Evidencia:** `.viltrum/mandates/M-alcance-robusto-2026-10-06.md`

### 2026-09-30 — Falsos Positivos de Test por Verificación Teatral y Falta de Identidad
**Qué pasó:** Un arnés de pruebas reportó 200 OK validando accidentalmente otra aplicación que ocupaba el mismo puerto (5173), y un script TypeScript con Project References pasó con código 0 sin compilar código real.
**Por qué:** Comprobaciones que solo afirman el código de salida HTTP o de proceso sin verificar asertos de identidad de la aplicación ni validar caminos negativos.
**Qué cambió:** Regla obligatoria: Toda suite de pruebas debe afirmar primero la identidad de la aplicación en el DOM (`data-app`) y en `/api/health`. Al menos el 50% de las aserciones deben validar caminos negativos (rechazo, 401/403, 409, degradación).
**Evidencia:** `Docs/audits/luna-reliability-audit.md`.


## PXIL 2026-09-30

Contrato conectado a skills PXIL, schemas y receta de pantalla con procedencia. 21st por CLI oficial; herramientas de ejecución se acreditan por proyecto. El linter original de trazabilidad es mock y queda excluido.
