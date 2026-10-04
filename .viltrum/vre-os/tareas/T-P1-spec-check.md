# T-P1-SPEC-CHECK · Validador local del Spec Pack y del avance (`npm run spec:check`)

Perfil: **D13 Git/Traceability** (con D22). Modo: fix en worktree. Revisor: D14 (otro proveedor). Tier: small.
Autorización: decisiones #43/#44. Reglas que automatiza: `.viltrum/vre-os/NO-NEGOCIABLES.md` §A1–A3 y §D12.
Plantillas: `.viltrum/vre-os/spec/_plantilla-modulo.md`, `_plantilla-integracion.md`. Índice: `spec/00-indice.md`.

## Construir `scripts/spec/check.mjs` (Node puro, sin dependencias nuevas) + script `spec:check` en package.json
1. Recorre `.viltrum/vre-os/spec/{modulos,globales,integraciones}/*.md`; parsea la cabecera YAML simple.
2. Valida: campos obligatorios (`id`, `nombre`/`sistema`, `estado`, `riesgo`, `owner`, `revisores`, `actualizado`),
   `estado ∈ DRAFT|REVIEW|READY|BUILT|VERIFIED`, ids únicos y coherentes con el nombre de archivo, y que estén las
   secciones `## 1.`…`## 9.` (módulo) o `## 1.`…`## 10.` (integración) **con contenido** (no vacías ni "TODO").
   Una ficha `READY` o superior no puede tener secciones vacías ni la palabra `UNKNOWN` en §8 (criterios).
3. Recorre `.viltrum/vre-os/tareas/T-*.md` creadas desde hoy que declaren `Ficha: <id>` y falla si esa ficha no existe
   o no está en `READY`/superior (las tareas antiguas sin `Ficha:` se reportan como "legado", no fallan).
4. Imprime un resumen: fichas por estado y por tipo, % listo, lista de bloqueos; con `--md` reescribe la tabla de
   avance entre marcadores `<!-- spec:avance:start -->` / `<!-- spec:avance:end -->` en `spec/00-indice.md`.
5. Sale con código ≠ 0 si hay errores (para usarlo en CI y antes de cada despacho).
6. Pruebas `scripts/spec/check.test.mjs` con fichas de ejemplo en un directorio temporal (válida, incompleta,
   READY con huecos, tarea que cita ficha DRAFT). Añade el patrón al script `test` solo si no rompe el glob actual;
   si no, crea `test:spec` y documenta.

## Archivos permitidos
`scripts/spec/**`, `package.json` (solo scripts), `.viltrum/vre-os/spec/00-indice.md` (solo los marcadores).

## Verificación (pega la salida real)
`node scripts/spec/check.mjs` sobre el repo (hoy no hay fichas: debe salir 0 con "0 fichas"), pruebas del validador,
`npx tsc --noEmit --incremental false` (ignora `.next/types`), `npm test`.

## Entregable
`.viltrum/vre-os/D13-spec-check.md` con uso, reglas implementadas y `## Pruebas`.
