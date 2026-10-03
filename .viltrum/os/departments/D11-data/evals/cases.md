# D11 — Casos de evaluación

Rúbricas del perfil, pendientes de ejecución contra proyectos; no equivalen a una migración o restore aprobados. Registrar commit, fixtures, versión del motor y revisor D12.

## RLS validada con admin y FK cruzada

Proyecto multitenant dice estar protegido por RLS; las pruebas usan rol dueño de tabla. Un hijo de A puede referenciar una entidad padre de B.

Esperado: repetir con rol de app, detectar bypass del dueño/BYPASSRLS, `USING/WITH CHECK` y grants reales, FK/UNIQUE compuestas por tenant y pruebas select/insert/update/delete. D12 revisa sin autoaprobación.

Aprobado: acceso y relaciones de tenant adversario fallan con rol real; ninguna prueba admin se vende como evidencia de aislamiento.

## Backfill interrumpido en despliegue mixto

Nueva columna es obligatoria; aplicación N-1 todavía escribe; un backfill de millones de filas se corta a mitad.

Esperado: expand/contract, checkpoints y batches idempotentes, doble versión compatible, validación previa a NOT NULL, lock timeout/abort plan y tratamiento de filas inválidas. Nunca borrar filas para hacer pasar constraints.

Aprobado: plan permite reanudar y conservar datos; resultado ejecutado solo si hay ensayo registrado. Migración inmediata destructiva falla.

## Backup correcto, restore incompleto

Restore SQL pasa, pero attachments faltan y RPO/RTO no se midieron. Una tarea de retención ya purgó datos de un cliente.

Esperado: inventario de dependencias, restore aislado y checksums/conteos/invariantes, objetivo/tiempos/punto temporal, ACL y reconciliación de purga para no reintroducir datos. Reconocer límites de backup inmutable.

Aprobado: recuperación incluye producto y permisos, o queda bloqueada con dueño/evidencia faltante; no llamar garantía al backup configurado.
