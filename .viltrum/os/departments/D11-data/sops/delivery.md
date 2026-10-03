# D11 — Entrega de datos, migraciones y recuperación

F4 como paquete de implementación; colabora con D03 en modelo conceptual F2. Revisor **D12**. Modelar para una propuesta es distinto de ejecutar schema de producto: C1 habilita la construcción. Producción, borrado físico y operaciones destructivas conservan autorización humana explícita.

## Entrada

Reglas y excepciones D01, tenancy/retención/identificadores D03, consultas/operaciones D10, privacidad D12, RPO/RTO y capacidad aprobados. Inventariar motor/version real, schema/migrations, extensiones, roles, RLS, jobs, índices, vistas, funciones, acceso a storage y backup. Trabajar con fixtures o copia anonimizada autorizada; si no hay producción todavía, usar dataset representativo y documentar volumen/distribución, sin fingir que existe copia real.

## Procedimiento

1. Diccionario con significado, tipo/unidad/precisión, origen, clasificación personal, dueño, null/default, retención, índice y constraints. ERD con cardinalidad/opcionalidad y lifecycle. 3FN por defecto; desnormalización exige medición y mecanismo de consistencia. JSON para datos genuinamente variables requiere schema/version y política de evolución, no esconder reglas relacionales.
2. Claves internas y públicas, unicidad natural y por tenant. FK compuesta `(tenant_id,id)` cuando corresponda impide relaciones cruzadas. NOT NULL/UNIQUE/FK/CHECK/tipos verifican lo que el motor garantiza; invariantes interfilas necesitan transacción/lock/constraint adecuado. Manejar nulos en UNIQUE y estados históricos/inactivos según negocio. Dinero no usa flotante; fecha local y instante con zona no se intercambian.
3. Matriz rol × tabla/columna × operación × tenant; implementar grants y RLS cuando corresponde, `USING` y `WITH CHECK`. Verificar select/insert/update/delete, JOIN/vistas/RPC, storage y roles de jobs. En PostgreSQL dueño/superuser/BYPASSRLS pueden evitar RLS: prueba con rol real de aplicación, no admin. Si se usa acceso privilegiado de servicio, D10/D12 documentan controles compensatorios. Tenant no se toma sin verificar de payload/session variable manipulable.
4. Unicidad de idempotencia, outbox/inbox y leases acordada con D10/D19; reserva y efecto de dominio atómicos. Reintento de worker después de crash no debe perder evento ni duplicar efecto. Decidir aislamiento y lock ordering por operación crítica; probar carrera/serialization failure. Cache/materialized view declara actualización, frescura y recuperación tras fallo.
5. Consultas e índices: registrar SQL parametrizado, cardinalidad, distribución por tenant, plan y tiempos antes/después. `EXPLAIN ANALYZE` ejecuta la consulta: solo entorno seguro para mutaciones. Medir impacto en escritura, storage y locking; índices de integridad son obligatorios aunque no exista baseline de rendimiento. No ejecutar borrado de índice productivo por optimización presumida.
6. Migración **expand → backfill → verificar → switch → contract**: id/checksum, precondiciones, compatibilidad N/N-1, batches/checkpoints, lock timeout, budget de duración y abort conditions. Estimar lock de DDL según motor/version. Duplicados/datos inválidos se reportan y concilian; no se borran para hacer pasar el schema. Destructivo lleva pérdida declarada y aprobación; rollback SQL no recupera datos eliminados. Irreversible usa recuperación probada/roll-forward y ventana de compatibilidad registrada.
7. Respaldar con periodicidad, cifrado, ubicación, control de acceso y retención según RPO. Incluir schema, datos, configuraciones necesarias y dependencias (objetos/adjuntos si forman parte del producto). Ensayo aislado con restore/PITR si existe, marca temporal alcanzada, tiempo total, checksums/conteos/invariantes y permisos. Comparar RPO/RTO medidos con objetivos; backup programado no prueba recuperación. D16 verifica operación y D10 recorrido tras restauración.
8. Retención y auditoría: dueño/dato/justificación/plazo, borrado/anonimización, excepciones legales entregadas por humano, purga en búsquedas/embeddings/cache/objetos y expiración de respaldos. Registrar qué subsistemas son eventualmente consistentes. No prometer eliminar de backups inmutables instantáneamente; documentar su retención y prevención de reintroducción al restaurar. Logs/auditoría redaccionados y acceso mínimo.
9. IA/RAG si aplica: provenance, source version, ACL/tenant y linaje de chunk/embedding. Recuperación filtra permisos antes de devolver contenido al modelo; cambio de acceso/retención invalida índices. Distancia vectorial no equivale a confianza de respuesta; D18 evalúa relevancia/citas y D12 aislamiento.

## Entrega y criterio de aceptación

Entregar ERD/diccionario, reglas/constraints, permisos, migrations y backfill, benchmarks, política de retención, rollback/restore runbook y evidencia fechada. NFR incluyen volumen/rate/latencia de consulta/RPO/RTO con objetivo, dataset, instrumento y resultado; valores ausentes quedan preguntas, no garantías.

Pruebas pertinentes: insert directo inválido, dos tenants y rol real, cross-tenant FK, concurrent writers, backfill interrumpido/reanudado, versiones mixtas y restore con verificaciones. Revisor D12 valida privacidad/aislamiento; D10 consume schema/queries; D03 revisa decisiones; D16 recuperación; D14 recorridos. El productor no firma su aceptación. Sin acceso a base o backup, entregar propuesta y registrar bloqueante con dueño.

## Herramientas y delegación

Database/runtime solo del ambiente autorizado, repositorio/git y documentación oficial de motor/version. Supabase skills se cargan cuando el proyecto use Supabase; no imponerlo. Un subagente puede inventariar schema anonimizado/constraints y devolver discrepancias. Otro puede medir/restaurar solo en sandbox con alcance y límites claros. No replicar datos productivos ni ejecutar DDL por declarar una capacidad disponible.

Fuentes verificadas 2026-09-29: [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [Backup y restauración](https://www.postgresql.org/docs/current/backup.html), [Aislamiento](https://www.postgresql.org/docs/current/transaction-iso.html), [Context7](https://github.com/upstash/context7).
