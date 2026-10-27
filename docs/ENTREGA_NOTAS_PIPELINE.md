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

## Límites de verificación

No hay servidor respondiendo en localhost:3000/3001. La prueba de interfaz y persistencia contra PostgreSQL real no se ha ejecutado. No se inició dev/build por la restricción local. Las pruebas de aplicación usan dobles; no sustituyen esa validación. No se hizo push ni se cerró ningún issue.
