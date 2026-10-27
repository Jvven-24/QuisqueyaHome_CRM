# Entrega: notas y pipeline
estado: READY
nivel: L2

Tarea autorizada por Wilber el 2026-10-27. Fuentes: /workspace/crm-plan/REQUISITOS-ENTREGA.md RQ-07, RQ-14–16; AUDITORIA-MODULOS.md. Trabajo en rama actual, dos commits, sin push, sin aplicar migraciones. GitNexus sustituido por rg y tsc por autorización explícita.

## Criterios de aceptación
- Bitácora existente activities, tipo note: crear/editar/borrado lógico en inspectores de lead y negocio, persistencia, autor/fecha, orden descendente estable. Leads usan leadId exacto (ya existe); negocios usan dealId. Nunca se mezclan notas de leads que compartan contacto. Sin tabla duplicada.
- Permiso activities por acción y acceso al padre por leads/deals:view; autor con permiso propio o permiso global para modificar. No se confía en IDs de contacto enviados por cliente. Auditoría transaccional.
- Catálogo etapas configurable: alta, nombre, orden, tipo, probabilidad, activación. Slug estable y naturaleza protegida cuando haya negocios asociados.
- Reglas por identidad slug/kind, nunca posición. Mover por arrastre/selector con permiso, validación de pérdida, versión y trazabilidad visible de deal_stage_history.
- Estados carga/vacío/error/éxito/sin permiso/ocupado, controles móviles, escritura con bloqueo de doble envío y textos accesibles.
- Sin nuevas integraciones ni métricas ni dependencias. Unitarias node:test, typecheck, lint y suite completa. No build/dev por restricción del entorno.

## Alcance y riesgo
Permitidos: application/actividades, application/etapas, application/pipeline; domain/transicion-etapa; infraestructura de los tres módulos; rutas correspondientes; inspectores leads/negocios, panel compartido notas, configuración etapas y pruebas. Catalogar etapa no debe reinterpretar ventas históricas. Revisión de diff por ámbitos y seguridad. Verificación visual/BD queda UNKNOWN si no hay servidor/sesión disponible.
