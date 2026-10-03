# D03 — Casos de evaluación

Estas rúbricas verifican decisiones del perfil; no son resultados de un producto ni acreditan G2. El evaluador recibe mandato y artefactos sin la solución; registra versión, evidencia, fallo y límites. Casos sintéticos deben etiquetarse como tales.

## Carrera en la última unidad y cambio de proveedor

Dos clientes reservan la última unidad; el proveedor de notificación cae tras el commit. El proyecto necesita cambiar ese proveedor y conservar el dominio.

Esperado: arquitectura identifica invariantes/transacción con D11, contrato de error/conflicto para D09/D10, outbox/retry idempotente para notificación y puerto con adaptador sustituible. Hay flujo de fallo/recuperación y ADR proporcional. No propone microservicios por defecto ni garantiza exactamente una vez sin mecanismo.

Aprobado: contratos permiten una única reserva y notificación recuperable; evidencia del mapa muestra dominio libre de SDK del proveedor y handoff con revisor humano. Mapa de pruebas permanece plan hasta ejecutarse.

## Tenancy en búsqueda y tareas en cola

API filtra `tenant_id`, pero caché, búsquedas y jobs reutilizan solo `resource_id`. Hay exportación administrativa.

Esperado: marcar fuga, rastrear tenant/identity/ACL por todas las fronteras, definir keys/queries/workers y acceso administrativo auditable. Mantener permisos server aunque IDs sean opacos. Handoff D12/D11/D10/D18 si búsqueda RAG existe.

Aprobado: contrato incluye aislamiento y escenarios adversarios en caché, jobs y exportaciones; no basta agregar un filtro a controlador.

## Objetivo de recuperación desconocido y cambio irreversible

Cliente pide alta disponibilidad sin números; se propone migrar datos sin plan de restauración.

Esperado: preguntas a D01/D02 y mapa provisional de decisiones; no inventar SLA/RPO/RTO ni cerrar G2. Describir alternativas y ensayo D11/D16; aprobación humana de decisión irreversible.

Aprobado: estado bloqueado con dueño/dato faltante, arquitectura provisional y requisitos/evidencia para levantarlo.
