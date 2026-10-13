# D14 · Revisión independiente del parche TOOL-001 · 2026-10-04

**Ficha:** `specs/001-spec-check-catalogo-no-ficha/spec.md` READY. **Productor:** D10. **Worktree revisado:** `C:\Users\wilbe\Documents\.viltrum-worktrees\QuisqueyaHome_CRM\20261004T230500Z-D10-TOOL001`, HEAD `4356a9e` separado de `develop`. **Alcance del diff:** solo `scripts/spec/check.mjs` y `scripts/spec/check.test.mjs`; `TAREA.md` local coincide con esos archivos y criterios 1–5. No edité código/ficha ni hice commit, push o gate.

## Dictamen D14

**PASS del parche TOOL-001 para revisión e integración por D00**, condicionado a conservar exactamente este diff y la revisión de seguridad independiente D12. El filtro amplio que ocultaba cualquier `.md` sin prefijo fue retirado. La nueva excepción exige `directory === 'integraciones'` y basename exacto `CAPACIDADES.md`; añade aviso no probatorio y conserva la validación de los demás archivos. `git diff --check` no informó errores de whitespace.

## Pruebas observadas por D14 en el worktree

| Prueba | Resultado |
|---|---|
| `node --test scripts/spec/check.test.mjs` | **8/8 PASS**, exit 0. Tres regresiones nuevas: catálogo único omitido sin mutarlo; `OTRO.md` e `I03-defectuosa.md` generan cabecera/secciones/nombre y CLI exit 1; `CAPACIDADES.md` en módulos/globales no se omite. |
| `npm run spec:check` | **PASS**, exit 0; 4 fichas, 0 READY, 0 bloqueos; aviso explícito de catálogo histórico no probatorio; advertencias legadas siguen visibles. |
| `npm run typecheck` | **PASS**, exit 0. |
| `npm run lint` | **PASS**, exit 0 con 13 warnings preexistentes; 0 errores. El auxiliar no seguido `capture_b.cjs` del checkout principal no existe aquí. |
| `npm test` | **512/512 PASS**, 0 fallidas, exit 0. |
| `git diff --check` | Exit 0, sin errores de whitespace; Git mostró solo aviso de normalización LF→CRLF. |

**Build:** D10 informó `npm run build` PASS y 41 páginas en este worktree. D14 no repitió el build para evitar ejecución concurrente en la misma `.next`; comprobó que `.next/BUILD_ID` existe (`0M26JP4LR_VHciQH0D5Kg`). Esto acredita artefacto presente, no equivale a haber observado personalmente la salida íntegra del build. D00 debe conservar el log del productor como evidencia si lo requiere el gate.

## Criterios de la ficha y límites

1. Excepción exacta y conteo: PASS; `stats.total=2` en fixture nuevo, catálogo intacto y aviso no probatorio.
2. Rechazo de `OTRO.md` e Ixx inválida: PASS; fixture y ejecución CLI comprueban bloqueos/exit 1.
3. Solo `integraciones/`: PASS; tests comprueban que el mismo basename bajo módulos/globales sigue dando hallazgos.
4. No presentar catálogo como API verificada: PASS; el aviso dice «investigación no probatoria, no acredita APIs verificadas».
5. Regresión: PASS para pruebas dirigidas, spec:check, tipos, lint y suite. Build reportado por D10 y artefacto presente, con la limitación indicada.

Este PASS verifica **el cambio de herramienta**, no las integraciones Twenty/Moodle ni la subficha I01-A. `spec:check` solo revisa fichas de primer nivel; el 0 de bloqueos no promueve automáticamente fichas anidadas, ni valida funcionalidad OSS o UX. D12 y D00 conservan sus responsabilidades de revisión/aceptación independientes.
