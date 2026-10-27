# Entrega autorizada: notas y pipeline — 2026-10-27

Ficha: `specs/entrega-notas-pipeline/spec.md` (READY). Rama `fase2-tmp`, sin push ni cambio a main. Autorización del usuario sustituye las restricciones históricas de producción/commit: dos fases en la rama actual, análisis estático en lugar de GitNexus.

## Fase 1: bitácora de notas

- Reutiliza activities/note y los vínculos existentes lead_id/deal_id. No mezcla leads de un mismo contacto; admite registros históricos con ambos vínculos.
- Nuevo endpoint `/api/actividades/notas`: GET/POST/PATCH/DELETE, contexto validado con Zod, permisos activities por acción y alcance del padre leads/deals:view. El servidor resuelve los vínculos.
- Editar/borrar exige autoría con permiso propio o permiso global. El endpoint genérico no permite reasignar notas ni eludir el alcance del lead. Borrado lógico, auditoría en la misma transacción, bloqueo de fila al modificar.
- Panel compartido en ambos inspectores: título/cuerpo, autor/fecha, orden descendente estable, crear/editar/borrar con confirmación, carga/vacío/error/ocupado, bloqueo de doble envío. Se limpia el formulario tras guardar aunque falle la recarga.
- Pruebas enfocadas: Node 22.23.4, 16/16 verdes (notas y casos de uso de actividades). Revisión independiente por agente: hallazgos sobre lead exacto, cuerpo histórico y reintento corregidos. No se afirma revisión por otro proveedor.
- Seguridad del diff: no nuevas tablas ni credenciales; asignación explícita, filtro por padre visible, autoría comprobada en servidor y borrado lógico. No quedan hallazgos altos conocidos.

No hay migración nueva; lead_id existe desde drizzle/0002. No se aplicó ninguna migración ni se modificaron seeds.

## Fase 2: pipeline configurable

- POST /api/etapas y PATCH /api/etapas/:id con settings:edit all, Zod, auditoría y campos explícitos. UI para crear, renombrar, reordenar, tipo abierta/ganada/perdida, probabilidad y desactivar.
- Reordenado en transacción con bloqueo del catálogo; slug inmutable. Cambiar kind exige que la etapa no tenga negocios (incluidos borrados) ni historial, para no reinterpretar cierres. Las transiciones y la conversión del lead bloquean la etapa seleccionada.
- Reglas conservadas por slug/kind, sin dependencia de posición. Se conserva el catálogo instalado; las etapas sugeridas se pueden crear desde Configuración sin reemplazar las existentes. No se añadió editor de requisitos/documentos arbitrarios por etapa (RQ-15); la probabilidad predeterminada del catálogo no sobrescribe la probabilidad particular de un negocio.
- Kanban y selector usan la misma transición, deals:edit, expectedStageId y expectedStageChangedAt obligatorios HTTP. Se bloquea el negocio y se devuelve conflicto para una versión obsoleta. La fecha de versión aumenta incluso entre cambios dentro del mismo milisegundo.
- Pérdida exige motivo activo y comentario. Etapas desactivadas con negocios siguen visibles y permiten salir, pero no recibir nuevos negocios. La conversión del lead solo selecciona una etapa abierta activa.
- Historial real deal_stage_history en la ficha, con origen/destino, autor y fecha; visible al broker dentro de su ámbito. La auditoría administrativa sigue separada.
- Revisión de seguridad del diff: rutas autorizadas antes de datos, ámbito por reaches/visibleRows, tipo protegido bajo bloqueo y DTO explícito para historial. Sin hallazgos altos abiertos. Revisión independiente de agente y revisión del diff por el agente principal; no se afirma revisión por otro proveedor.

## Archivos principales

- Notas: application/actividades/notas.ts y notas.test.ts; casos-de-uso.ts y sus pruebas; infrastructure/db/repos/notas.ts; infrastructure/contenedor/notas.ts; app/api/actividades/notas/route.ts; app/(crm)/_ui/notas-bitacora.tsx; inspectores leads/negocios.
- Etapas: application/etapas/{entrada,puertos,casos-de-uso,en-memoria}.ts y pruebas; infrastructure/db/repos/etapas.ts; app/api/etapas/route.ts y [id]/route.ts; app/(crm)/configuracion/_etapas.tsx.
- Pipeline: domain/transicion-etapa.ts y pruebas; application/pipeline/{entrada,puertos,casos-de-uso,consultas}.ts y pruebas; repositorios pipeline, pipeline-lectura y leads; ruta pipeline/[id]/etapa; página, vista, tablero, tarjeta e inspector de negocios y guardas.
- Seguimiento: esta entrega, docs/R_RELEVO.md y specs/entrega-notas-pipeline/spec.md.

## Verificación final

Node 22.23.4 mediante `npx --yes --package=node@22 -c 'npm run typecheck && npm run lint && npm test'`: typecheck limpio, lint limpio, 1097 pruebas totales: **1095 aprobadas, 2 omitidas, 0 fallos**. Corrida observada por el agente principal. `git diff --check` limpio. Fase 1: commit afc59f1; Fase 2: commit que contiene esta actualización.

## Límites de verificación

No hay servidor respondiendo en localhost:3000/3001. La prueba de interfaz y persistencia contra PostgreSQL real no se ha ejecutado. No se inició dev/build por la restricción local. Las pruebas de aplicación usan dobles; no sustituyen esa validación. No se hizo push ni se cerró ningún issue.
