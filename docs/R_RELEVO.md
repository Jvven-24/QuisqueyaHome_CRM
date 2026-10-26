# Relevo · instantánea pública del CRM

Fecha: 2026-10-26. Esta instantánea se preparó desde el árbol local sobre la base de main remoto; no incorpora el historial local de develop. Los cambios incluyen trabajo local sin commit previo y conservan funcionalidades señaladas como vistas previas.

## Verificación

En copia aislada: typecheck y lint aprobados; npm test 1030 aprobadas, 0 fallos y 2 omitidas. No se ha realizado build ni una prueba autenticada completa de interfaz para esta instantánea.

## Estado y pendientes

- La integración completa CMS–CRM, identidad compartida, conciliación de proyectos y datos de prueba no están implementadas ni verificadas de extremo a extremo.
- La base CRM de la VPS de desarrollo qh-dev tenía 42 tablas y siete migraciones al momento de la inspección; 0007–0012 requieren un ensayo y un plan propio antes de escribir esa base.
- Hay credenciales de prueba históricas publicadas en el historial de origin/develop; su revocación no está confirmada. Esta instantánea no incorpora ese historial. No publicar credenciales ni datos personales en el repositorio.
- La instantánea omite evidencias de agentes, respaldos, checkpoints, logs y capturas de QA que no fueron revisados para publicación. La especificación M40 necesaria para pruebas se conserva.
- El despliegue reversible a la VPS y la validación de permisos de aplicación y servicios siguen pendientes. No usar el comando de reemplazo completo de base para reconciliar datos.

Probar: nada