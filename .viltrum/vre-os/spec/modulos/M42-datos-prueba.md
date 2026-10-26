---
id: M42
nombre: Datos de prueba en Configuración
estado: READY
riesgo: R3
owner: D10
revisores: [D12]
fuente_de_verdad: PostgreSQL del CRM para datos y operaciones locales; Moodle para matrículas y actividad educativa
depende_de: [M14, G04, G05, G10, M13, I02]
actualizado: 2026-10-18
productor_de_ficha: D03
apoyo_de_analisis: [D11, D06]
---

> **Compuerta D00 (2026-10-18).** Revisión R2 independiente (`reviews/M42-revision-R2.md`): APROBADO CON CONDICIONES.
> Las condiciones (M01 grafo de vaciado con las tablas de M40 `b1d`+, M02 índice del manifiesto, menores m01–m04) se
> resuelven dentro de las rebanadas que las tocan. Se construye después de las rebanadas de esquema de M40.


# M42 · Datos de prueba en Configuración

**Estado L1 / REVIEW · versión R4 (ciclo de respuesta R2).** Esta ficha especifica una operación administrativa para cargar y vaciar datos de prueba. No autoriza código hasta quedar `READY` y superar revisión independiente. R4 responde los hallazgos de `.viltrum/vre-os/reviews/M42-revision-R1.md`; no declara probados los criterios ni aprobada la arquitectura.

**Límite de despliegue vigente:** la Decisión #51 prioriza completar el CRM para una sola empresa (Quisqueya Home) y pausa la multiempresa de las decisiones #49/#50 y G12. Esta versión no agrega `tenant_id` ni criterios de aislamiento entre empresas. Cuando G12 se active, M42 debe ampliarse mediante la fase de expansión de G12 antes de despachar sus cambios de datos o API; véanse §5, §8 y §10.

## 1. Propósito y usuarios

El administrador necesita restablecer los datos de prueba del CRM para repetir flujos desde un estado conocido. La operación debe borrar solo filas con procedencia de prueba demostrable y conservar datos reales, catálogos, configuración e identidades protegidas.

- **Administrador:** consulta el inventario de pruebas, solicita cargar o vaciarlo y ve el resultado.
- **Broker, asistente y demás roles:** no acceden a la pestaña ni a sus API.
- **Usuarios de prueba protegidos:** las cuentas `admin.prueba`, `asistente.prueba` y `broker.prueba` se conservan. La ficha no cambia sus roles, credenciales, vínculos de autenticación ni otras matrículas.

La vista no muestra datos personales de las filas de prueba; solo cantidades agrupadas por módulo, estado de operación y resumen de resultado.

## 2. Estado actual (AS-IS)

### Configuración

`/configuracion` usa `?tab=` y hoy declara seis pestañas: usuarios, permisos, etapas, catálogos, papelera e integraciones (`src/app/(crm)/configuracion/page.tsx:42-60`). La vista despacha esos paneles (`src/app/(crm)/configuracion/vista.tsx:24-70,235-255`). La página exige alcance total para `settings:view` y calcula `settings:edit` (`src/app/(crm)/configuracion/page.tsx:53-64`).

No hay una pestaña de datos de prueba ni una ficha M14 entre las fichas del Spec Pack enumeradas actualmente. La lista local contiene M13, M40 y M41, entre otras, pero no M14 (`.viltrum/vre-os/spec/00-indice.md:15-25`; inventario: `rg --files .viltrum/vre-os/spec/modulos`).

### Seed y limpieza

- `scripts/seed/catalog.ts:3-5,28-42` define el seed determinista, `BASE_ID = 1_000_000`, los volúmenes, rangos y orden de inserción/limpieza.
- El dataset actual contiene, según esas constantes, 12 usuarios sintéticos y 12 perfiles de broker; 8 campañas y 152 gastos; 20 proyectos, 400 unidades, 450 contactos, 640 leads, 176 negocios, 176 asociaciones, 591 cambios de etapa, 1.800 actividades, 15 comisiones y 247 metas. **Son cantidades del código, no un conteo verificado de la base actual.** En conjunto son 4.699 filas de negocio del seed; los catálogos generados quedan fuera de ese total.
- `scripts/seed/index.ts:35-45,49-74` ejecuta el seed en una transacción, usa los rangos de IDs para detectar filas existentes y valida su contenido antes de insertar.
- `scripts/seed/limpiar.ts:11-12,37-58,69-92` identifica filas por esos rangos, bloquea las tablas del esquema, comprueba claves foráneas y huellas de filas externas, y borra en orden. `CLEAN_ORDER` incluye tablas de catálogos y etapas. Este mecanismo no satisface por sí solo el requisito de identificar cada fila de prueba sin ambigüedad.
- M40 amplió el esquema transaccional con `transaction_commands`, `holds`, `hold_units`, `reservations`, `reservation_parties`, `reservation_units` e `inventory_commitments` (`src/infrastructure/db/schema.ts:1358-1514`; `drizzle/0007_m40_compromisos_reservas.sql`). Las tablas de reservas y compromisos usan FKs restrictivas; `inventory_commitments` tiene tres FKs compuestas de cuatro columnas (`schema.ts:1508-1510`). `transaction_commands` conserva resultados al menos cinco años (`schema.ts:1378`). El `CLEAN_ORDER` del seed no las incluye (`scripts/seed/catalog.ts:40-41`) y el validador actual no admite tuplas de cuatro columnas (`scripts/seed/limpiar.ts:21-33`).
- Los comandos actuales son CLI locales: `db:seed`, `db:seed:clean` y `db:reset` (`package.json:31-36`). El destino de `localDatabaseUrl()` se limita a la base local de loopback (`scripts/seed/local.ts:3-17`). La API de Configuración no debe invocar esos scripts ni heredar el comportamiento amplio de `db:reset`.

### Usuarios de prueba, Academy e integraciones

- `scripts/crear-usuario-prueba.mjs:32-62` define tres perfiles de prueba: `admin.prueba`, `asistente.prueba` y `broker.prueba`. `:151-203` enlaza usuarios con Moodle y los matricula; `:318-355` también sincroniza usuarios base. Las tres identidades quedan protegidas por esta ficha.
- Ese script actualiza el broker asignado a proyectos por slug (`scripts/crear-usuario-prueba.mjs:160-175`). No se verificó si esos cambios siguen vigentes ni se registra ahí el valor anterior; M42 no debe revertirlos automáticamente.
- M41 permite datos sintéticos de Academy, como curso de inducción, usuarios vinculados y matrículas (`.viltrum/vre-os/spec/modulos/M41-correcciones-1018.md:42-56`). M13 e I02 siguen en `DRAFT` (`.viltrum/vre-os/spec/modulos/M13-academy.md:1-16`; `.viltrum/vre-os/spec/integraciones/I02-moodle.md:1-17`).
- `PuertoAprendizaje` expone matrícula y consulta, pero no una operación de baja o reinicio de matrícula (`src/application/aprendizaje/puertos.ts:80-97`; adaptador: `src/infrastructure/integraciones/moodle/cliente.ts:406-419`).
- El outbox procesa eventos externos; hoy el esquema admite tres tipos (`src/infrastructure/db/schema.ts:1273-1297`). `files` y `notifications` referencian entidades de forma polimórfica, sin FK a la entidad (`src/infrastructure/db/schema.ts:1177-1197,1199-1217`).

**No verificado:** cantidad y estado real de filas en PostgreSQL, matrículas vigentes en Moodle, archivos de prueba existentes, cuentas de integración activas y colisiones históricas con los rangos del seed. No se consultó la base ni se ejecutaron los scripts.

## 3. Pantallas

### `/configuracion?tab=datos-prueba`

Añadir la pestaña **Datos de prueba** al dispatcher y a la navegación lateral (`src/app/(crm)/configuracion/page.tsx`, `src/app/(crm)/configuracion/vista.tsx`). Solo la verá un actor con rol `admin` activo y alcance total para consultar Configuración. El servidor vuelve a comprobar el rol y el alcance en cada API; ocultar la pestaña no constituye autorización.

Contenido:

- Estado del seed: `vacío`, `cargado`, `en curso`, `requiere atención` o `no disponible`.
- Conteo actual de registros **marcados** por módulo, no conteo estimado por IDs.
- Última operación, actor, fecha, fase y resultado; sin emails, nombres, IDs de negocio, payloads ni contenido de archivos.
- Acciones **Vaciar datos de prueba** y **Cargar datos de prueba**.
- Vaciado en dos pasos. Primero solicita el preflight y muestra fixtures directos, dependientes elegibles y bloqueos agrupados por tipo, sin PII; el administrador elige si incluye todos los dependientes elegibles. Si hay referencias ambiguas, ajenas o durables no autorizadas, no se puede continuar. El resumen vence o se invalida si cambia el grafo y debe recalcularse.
- Segundo paso: requiere escribir `VACIAR DATOS DE PRUEBA`; carga requiere escribir `CARGAR DATOS DE PRUEBA`. El texto de confirmación no se guarda en la auditoría. El paso final muestra la selección y el efecto esperado antes de encolar.
- Operación larga ejecutada en segundo plano. Mostrar fase real y conteos confirmados; no inventar un porcentaje mientras una transacción atómica está en curso. No permitir doble envío. Cancelar solo si el worker aún no reclamó la operación; una transacción iniciada no se cancela desde la UI.

### Móvil

A 320/390 px, mostrar estado y conteos como tarjetas apiladas; apilar las acciones con sus etiquetas completas. La confirmación ocupa una vista/modal utilizable con teclado y foco visible. No usar solo color para comunicar el estado.

### Seis estados

| Estado | Presentación y acción |
|---|---|
| Carga | Skeleton con tarjetas de conteo y estado de operación. En una operación, texto de la fase y actividad dentro del botón; sin spinner genérico. |
| Vacío | “No hay registros de prueba cargados.” Explicar que catálogos y usuarios protegidos permanecen y ofrecer **Cargar datos de prueba**. |
| Error | Mensaje humano, código de referencia y acción para volver a consultar. No mostrar excepción, consulta ni nombre interno de tabla. |
| Sin conexión | Mostrar cuándo se consultó por última vez; bloquear acciones con el motivo visible. No encolar una operación destructiva sin conexión. |
| Éxito | Resultado persistente: cargados/eliminados por módulo, registros conservados y operación que lo produjo. |
| Permiso insuficiente | No mostrar la pestaña a roles ajenos; navegación directa y API responden denegado sin devolver conteos. |

Conflictos de operación activa, sesión expirada, referencias externas y resultados parciales tienen mensajes explícitos; no se muestran como éxito completo.

## 4. Funciones (casos de uso)

Todas las rutas empiezan por autenticación y autorización de servidor antes de consultar o modificar datos. Usar Zod, asignar campos permitidos uno por uno y no propagar objetos recibidos. La política existente define `requireScope` y `requireFullScope` (`src/domain/rbac.ts:73-103`); los recursos y acciones son catálogos tipados (`src/domain/catalogs.ts:18-58`).

| Caso de uso | Entrada y reglas | Salida y errores | Permiso, auditoría e idempotencia |
|---|---|---|---|
| Consultar estado | Sin cuerpo. Consultar solo filas registradas en el manifiesto y operaciones recientes autorizadas. | Estado, conteos por módulo, última actualización y avisos de clasificación incompleta. Si la fuente falla, error recuperable; nunca inventar cero. | Solo `admin` activo y `settings:view:all`. Respuesta sin PII. |
| Preflight de vaciado | `POST /api/configuracion/datos-prueba/operaciones`; Zod: `accion = "preflight_vaciar"`. Calcula dependencias inversas y no muta filas de negocio. | Devuelve `preflightId`, huella del grafo, vencimiento, conteos directos, dependientes elegibles por tipo y bloqueos por tipo/código. No devuelve IDs de negocio ni PII. | Solo `admin` activo y `settings:edit:all`; guarda el resumen y actor en `test_data_operations` como preflight de solo lectura. |
| Solicitar vaciado | Zod: `{ accion: "vaciar", preflightId: uuid, incluirDependientesElegibles: boolean, confirmacion: "VACIAR DATOS DE PRUEBA" }`. Exigir `Idempotency-Key` UUID; registrar hash canónico de petición. | `202` con `operationId`; `409` si cambió/venció el preflight, existe otra operación activa o se reutiliza la clave con otro contenido; `422` para confirmación incorrecta; `403` sin permiso. Bloqueos hacen fallar cerrado antes de encolar. | Solo `admin` activo y `settings:edit:all`. El servidor revalida grafo, actor, selección y huella antes de encolar; registra inicio en `audit_log`. |
| Solicitar carga | Zod: `accion = "cargar"` y texto de confirmación exacto. El seed y su versión los determina el servidor; no aceptar filas, tablas, IDs o versiones arbitrarias del cliente. | `202` con `operationId`; repetir una petición idéntica devuelve la operación existente; conflicto de contenido con la misma clave devuelve `409`. | Mismo permiso. Carga determinista y auditable; no genera eventos de integración por cada fila. |
| Consultar operación | `operationId` UUID en ruta. Limitar la respuesta a administradores autorizados; responder `404` para operaciones que el actor no puede alcanzar. | Fase, conteos confirmados, estado, fechas y resultado redactado. | Solo `admin` y `settings:view:all`; verificar alcance de la fila con `reaches`/filtro de filas según el contrato aprobado. |

En el alcance monotenant vigente por #51, estas consultas operan sobre la única empresa instalada y no añaden un predicado `tenant_id`. El UUID no sustituye la autenticación, el rol `admin` ni `requireFullScope`. Esta garantía no se extiende a un despliegue multiempresa: al activar G12, las consultas de estado y operación deben filtrar por el `tenant_id` del actor y ocultar con `404` cualquier operación de otra empresa, además de probar ese aislamiento antes de habilitar M42 allí.

**Rutas propuestas**

- `GET /api/configuracion/datos-prueba`
- `POST /api/configuracion/datos-prueba/operaciones`
- `GET /api/configuracion/datos-prueba/operaciones/:id`

**Idempotencia y transacciones**

- Una clave idéntica para la misma acción y actor devuelve la misma operación y resultado; clave igual con petición diferente da conflicto.
- Vaciar dos veces con claves distintas es una operación segura sin filas que borrar. No recrea datos ni borra auditoría.
- Carga sobre un seed intacto es idempotente. Si detecta cambios incompatibles en filas marcadas, no las sobrescribe: pide vaciar primero o revisión.
- Un trabajador durable reclama una sola operación activa en la instalación monotenant actual. La escritura o borrado de datos CRM y su manifiesto se confirma en una transacción. Usar bloqueo de operación y bloqueos de fila necesarios; no bloquear todas las tablas. La API devuelve control al usuario después de encolar. La exclusión global es deliberada solo mientras #51 limite M42 a una empresa; G12 deberá acotar unicidad y locks al `tenant_id` antes de activar varias empresas.
- El worker renueva `heartbeat/lease` al menos una vez durante cada ventana de 300 segundos. Si no hay heartbeat durante 300 segundos, la lease expira: el supervisor puede reclamar atómicamente la operación vencida o marcarla `error_timeout` y liberar el bloqueo activo. El administrador puede reintentar una operación con timeout; no se asume que un proceso muerto vaya a recuperarse solo.
- La fase de transacción comunica progreso indeterminado hasta que el resultado esté confirmado; solo contar filas después de su commit.
- Un fallo dentro de la transacción revierte los cambios. La operación queda fallida con referencia segura; un reintento usa la misma idempotencia o una acción nueva explícita.

## 5. Datos

### Procedencia de fixtures

Propuesta para revisión D11/D12: introducir un manifiesto de procedencia explícito; no usar rangos de IDs como prueba de que una fila es descartable.

- Por la Decisión #51, las tablas de M42 pertenecen a la instalación única de Quisqueya Home y **no llevan `tenant_id` en esta etapa**. No se habilita el mismo esquema para varias empresas.
- `test_data_batches`: `id` UUID, versión de fixture, huella canónica, actor que la cargó, estado y fechas. Un lote identifica los fixtures del seed; no activa un modo global que cambie las mutaciones normales del CRM.
- `test_data_records`: clave primaria compuesta por `batch_id`, tipo de entidad de una lista permitida e `internal_pk TEXT` (entero serial convertido a decimal canónico o UUID canónico); además guarda la clave estable del fixture, origen (`seed` o `manual_test`), operación que autorizó la clasificación, operación que autorizó el retiro y fecha de retiro. El seed registra sus filas en la misma transacción. Las altas normales del CRM no requieren interceptores ni se marcan automáticamente: el preflight descubre dependencias entrantes y solo clasifica como `manual_test` dependientes con una cadena completa y exclusiva hacia fixtures del lote, después de selección explícita. No se infiere procedencia por fecha, email o rango de IDs.
- `test_data_operations`: ID UUID, acción, actor solicitante, clave de idempotencia, hash de petición, huella y vencimiento de preflight cuando aplique, estado/fase (`prepared`, `queued`, `running`, `completed`, `failed`), conteos confirmados, fechas, heartbeat/lease y código de error redactado. Una restricción impide más de una operación destructiva activa en la instalación monotenant actual.
- `ENTITY_TYPES` en `src/domain/catalogs.ts:60-87` se ampliará en M42-B con `test_data_batch`, `test_data_record`, `test_data_operation`, `unit_sale`, `hold`, `hold_unit`, `reservation`, `reservation_party`, `reservation_unit`, `inventory_commitment` y `transaction_command`. `internal_pk` se mantiene como texto opaco: cada tipo tiene un mapeo de tabla/PK aprobado en servidor; nunca se forma SQL desde el valor recibido. `transaction_command` es referenciable/auditable, no un fixture purgable.
- Las tres tablas nuevas llevan `.enableRLS()`, índices y restricciones. Son de acceso exclusivo del servidor mediante Drizzle; la ruta comprueba actor/rol/permisos y ninguna consulta directa desde navegador las lee. El DDL mínimo habilita RLS y revoca a roles públicos/de cliente, siguiendo el patrón condicional de `drizzle/0007_m40_compromisos_reservas.sql:444-450`:

  ```sql
  ALTER TABLE test_data_batches ENABLE ROW LEVEL SECURITY;
  ALTER TABLE test_data_records ENABLE ROW LEVEL SECURITY;
  ALTER TABLE test_data_operations ENABLE ROW LEVEL SECURITY;
  REVOKE ALL ON TABLE test_data_batches, test_data_records, test_data_operations FROM PUBLIC;
  DO $$
  DECLARE role_name text;
  BEGIN
    FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE test_data_batches, test_data_records, test_data_operations FROM %I', role_name);
      END IF;
    END LOOP;
  END $$;
  ```

  M42 usa UUID en `test_data_batches`/`test_data_operations` y clave compuesta en `test_data_records`, por lo que esta propuesta no crea secuencias ni necesita grants de secuencia. D11 debe confirmar el rol PostgreSQL efectivo de `getDb()` en la base de prueba antes de cerrar la migración; tras esa comprobación, la migración debe incluir `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE test_data_batches, test_data_records, test_data_operations TO <rol_runtime_verificado>;` con el nombre del rol real y privilegio mínimo. No se inventa ni se fija `service_role`: `src/infrastructure/db/client.ts:13-38` muestra conexión PostgreSQL directa desde configuración centralizada, pero no declara el rol efectivo. No añadir políticas de empresa mientras #51 mantenga la instalación monotenant. Este contrato no atribuye aislamiento de consultas al RLS. Si el navegador accede directamente con Supabase JS, hacen falta políticas y pruebas antes de exponer las tablas.
- **Extensión al activar G12:** durante su fase de expansión, agregar `tenant_id` y las relaciones/índices compuestos a las tres tablas, fijar políticas RLS con el contexto de empresa y aplicar el filtro del actor en lecturas, encolados y borrados. La activación requiere prueba de aislamiento API/DB entre dos empresas, incluyendo consulta de operaciones y vaciado sin afectar al otro inquilino. No ejecutar esa expansión mientras #51 mantenga G12 en pausa.

La identidad polimórfica del manifiesto no proporciona FK a todas las tablas de negocio. El repositorio solo acepta tipos de entidad definidos en código, verifica que cada referencia exista y compara la huella antes de borrar. No se construyen nombres de tablas desde la petición del cliente.

### Unicidad de fixtures en la etapa monotenant

La revisión D12 señala que el seed usa slugs e identificadores sujetos a índices únicos globales (`marketing_campaigns.slug`, `projects.slug`, `leads.external_id` y `goals.period`; véase `.viltrum/vre-os/reviews/M42-D12.md`, H-M42-M01). Bajo el límite actual de una sola empresa de #51, M42 conserva las claves deterministas existentes: no necesita prefijarlas con un identificador de empresa ni cambiar esos índices para cargar otra empresa. Esto no acredita compatibilidad multiempresa. Al activar G12, su fase de expansión debe hacer compatibles las restricciones únicas con `tenant_id` o definir claves de fixture por empresa antes de habilitar cargas en el segundo inquilino; D11 verificará colisiones y backfill antes de activar el cambio.

### Alcance de carga y vaciado

- Marcar únicamente filas generadas por el seed: usuarios sintéticos, perfiles, campañas/gastos, proyectos, unidades, contactos, leads, negocios y relaciones, historial, actividades, comisiones y metas. El grafo también conoce las siete tablas de M40: `inventory_commitments`, `reservation_units`, `reservation_parties`, `reservations`, `hold_units`, `holds` y `transaction_commands`.
- Conteos iniciales del código actual: 12 brokers sintéticos; 8 campañas/152 gastos; 20 proyectos/400 unidades; 450 contactos/640 leads; 176 negocios/176 asociaciones/591 eventos de etapa; 1.800 actividades; 15 comisiones/247 metas (`scripts/seed/catalog.ts:5,28-40`). No son conteos de producción ni de la base en vivo.
- Resolver catálogos existentes al cargar. Nunca borrar ni modificar zonas, agencias, medios de pago, estados de inventario, canales, motivos, etapas, roles, permisos, configuración o cuentas de integración. Los catálogos que el seed antiguo haya insertado sin procedencia quedan conservados.
- Preservar siempre usuarios reales y las identidades protegidas `admin.prueba`, `asistente.prueba` y `broker.prueba`, con sus filas CRM/Auth y vínculos. Las 12 filas de broker sintético que genera el seed sí son fixtures solo si el manifiesto confirma que las creó el lote. No basarse en emails o en el rango de IDs para borrar.
- No hay sesión global de captura ni modo que congele escrituras comerciales. El preflight calcula la clausura inversa de las FKs que alcanzan fixtures del lote y presenta cantidades agrupadas por tipo. Tras confirmación escrita, solo incorpora a la purga dependientes cuya cadena completa lleva a fixtures de ese lote y que no tengan referencias entrantes ajenas; el worker vuelve a calcularla bajo locks de las filas afectadas antes de borrar. Registra esa selección como `manual_test`, ligada a la operación, en la misma transacción de purga. Dependencias ambiguas, de otro lote o con referencias reales se muestran como bloqueos y no se eliminan ni por confirmación; no se usa `CASCADE`. No se clasifica por fecha ni por rango de IDs, no se rechazan cambios normales y no se modifica una fila real para marcarla.
- El grafo de vaciado incluye las siete tablas de `drizzle/0007_m40_compromisos_reservas.sql`: `holds`, `hold_units`, `reservations`, `reservation_parties`, `reservation_units`, `inventory_commitments` y `transaction_commands`; también conserva el nodo relacionado `unit_sales`. El catálogo de FKs valida pares de columnas y admite FKs compuestas de cuatro columnas. Orden topológico: `inventory_commitments` antes de `reservation_units`, `hold_units` y `unit_sales`; `reservation_units` y `reservation_parties` antes de `reservations`; `hold_units` antes de `holds`; `reservations` antes de `holds`; esos nodos antes de las filas raíz de negocio (`deals`, `units`, `projects`, `contacts` o `files`, según la FK). El worker deriva el orden real y aborta si encuentra una FK no soportada.
- La función `m40_guard_history()` de `0007` prohíbe eliminar las siete filas M40 por defecto (`drizzle/0007_m40_compromisos_reservas.sql:394-453`). M42-B añade una migración hacia delante (no reescribe `0007`) que conserva esa prohibición salvo para un `DELETE` fila por fila en las seis tablas purgables cuando la transacción porta el ID de una operación M42 en estado `running` y acción `vaciar`. El trigger exige simultáneamente una fila de `test_data_records` cuyo tipo corresponda mediante un mapeo cerrado a `TG_TABLE_NAME`, cuyo `internal_pk` coincida con `OLD.id::text`, y cuyo `purged_by_operation_id` sea el ID de esa operación. `transaction_commands` nunca recibe excepción ni se marca elegible. Un valor de sesión aislado no autoriza nada. El worker establece el contexto con `SET LOCAL` dentro de la transacción tras RBAC, preflight vigente y confirmación. `TRUNCATE` sigue prohibido; comandos directos, filas sin manifiesto y operaciones distintas de M42 siguen rechazados. El manifiesto y la auditoría sobreviven como tombstone con operación de retiro. Las restricciones de inmutabilidad para `UPDATE` permanecen intactas. El nodo `unit_sales` participa en el grafo con su propia regla de integridad; no hereda esta excepción sin revisión D11.
- `transaction_commands` es nodo de solo lectura: nunca se marca elegible ni se borra porque conserva resultados con retención mínima de cinco años y referencia usuarios (`src/infrastructure/db/schema.ts:1362-1380`). Si aparece como bloqueo para borrar una raíz, el preflight lo devuelve y no autoriza un borrado parcial silencioso.
- El borrado no recorre otra empresa porque el alcance actual es monotenant. Cuando G12 se active, cada paso de detección, clasificación y purga deberá incluir el inquilino del actor, y el lote no podrá absorber dependientes de otro inquilino.
- Un registro histórico en los rangos `BASE_ID` sin manifiesto no se considera fixture automáticamente. Solo puede adoptarse tras comparar identidad y contenido canónico completo contra la versión conocida del seed; cualquier diferencia se marca `UNKNOWN`, se conserva y bloquea el borrado automático. Requiere preflight D11 antes de habilitar M42.
- La recarga se compara mediante huella lógica de filas del seed, excluyendo IDs de operación, timestamps de auditoría y metadatos del lote. El generador conserva su semilla y versión (`scripts/seed/catalog.ts:2-5`).

### Outbox, auditoría, archivos y proveedores

- **Auditoría:** conservar `audit_log`; agregar un registro de inicio/resultado por operación, con actor, tipo de acción, conteos, versión y huella, nunca valores de filas personales. `audit_log` guarda acciones sensibles (`src/infrastructure/db/schema.ts:1250-1271`; escritor: `src/infrastructure/audit.ts:59-75`). Añadir el tipo de entidad de operación a su catálogo tipado si D11 lo aprueba (`src/domain/catalogs.ts:60-87`).
- **Outbox:** conservar `outbox`, `outbox_dead`, `external_refs` e `inbox`; nunca borrarlos para “limpiar” el estado (`src/infrastructure/db/schema.ts:1273-1338`). La operación local de reset usa su propia cola durable. La carga no emite mensajes externos. Una vez I02 tenga contrato y consumidor aprobados, la desmatriculación Moodle marcada se encola como acción externa idempotente y no retiene la transacción ni el vaciado local. Otros eventos pendientes o referencias externas incompatibles con un fixture sí detienen la limpieza hasta definir reconciliación.
- **Archivos:** solo tratar archivos cuya fila `files` esté marcada en el manifiesto y cuya ruta se confirme bajo almacenamiento administrado por el CRM. Una referencia polimórfica no marcada a un fixture detiene el borrado. El puerto actual borra archivos en mejor esfuerzo y no devuelve resultado (`src/application/compartido/almacenamiento.ts:1-9,25-31`); M42 requiere resultado por archivo y reintento durable. Borrar el objeto fuera de la transacción DB, de forma idempotente; no reportar operación completa mientras queden objetos pendientes. No borrar URLs externas.
- **Moodle:** nunca borrar las cuentas de Moodle, cursos, constancias ni historia de aprendizaje. La política propuesta es retirar solo matrículas que el manifiesto identifique como creadas por esta operación y preservar otras matrículas y registros. La baja debe ser idempotente y auditable; hoy `PuertoAprendizaje` no expone una operación de baja y M13/I02 siguen `DRAFT` (`src/application/aprendizaje/puertos.ts:80-97`; `.viltrum/vre-os/spec/integraciones/I02-moodle.md:25-29,41-47`). La transacción local del CRM no espera la respuesta de Moodle: confirma el vaciado local y encola la desmatriculación como trabajo externo idempotente para reintentos no bloqueantes, usando un contrato aprobado de integración/outbox cuando I02 esté `READY`. Un timeout o error deja la sincronización Moodle pendiente y visible; se informa “CRM completado; Moodle pendiente”, nunca como limpieza externa completa. No borrar filas locales enlazadas ni afirmar que Moodle quedó vacío mientras no haya confirmación. D19/D12 deben validar contrato, efecto sobre progreso, reintentos y resultado incierto antes de habilitar esta parte.
- **Otras integraciones:** mantener configuración y cuentas. No enviar invitaciones, mensajes, webhooks ni eventos de negocio durante carga o vaciado. Referencias externas no se eliminan genéricamente; requieren contrato del adaptador y aprobación independiente.
- **Guard de entorno:** `ALLOW_TEST_DATA_OPERATIONS` es un booleano leído únicamente desde `src/infrastructure/env.ts`, con valor seguro por defecto `false`. Su valor `true` es requisito adicional, nunca suficiente: la política server-side también debe clasificar el despliegue como desarrollo/staging aislado y confirmar que el destino es una base dedicada a pruebas. Producción se deniega siempre, incluso si la bandera está activa. No se acepta un interruptor enviado por cliente. El guard corre antes de cualquier consulta o mutación; si falta la clasificación o el destino no coincide, la pestaña no se ofrece y la API responde `404`. Usa un puerto de política y una implementación de infraestructura; no copia credenciales ni expone identidad del destino al navegador. El valor se documenta en `.env.example` sin credencial. El guard loopback existente sigue protegiendo el CLI del seed (`scripts/seed/local.ts:3-17`), pero no sustituye el contrato de destino de la API.

## 6. Integraciones y puertos

Separación propuesta:

- `application/datos-prueba`: casos de uso para consultar, encolar, cargar y vaciar; decide reglas y estados, sin importar Next.js, Drizzle ni SDK externos.
- Generador determinista de fixtures puro, alimentado por catálogos obtenidos mediante puerto. El CLI actual puede delegar al mismo caso de uso local, no al revés.
- `DatosPruebaRepository`: consulta manifiesto/huellas, valida dependencias y ejecuta transacciones.
- `scripts/seed/limpiar.ts` es un adaptador CLI: después de M42-C/D delega al mismo caso de uso y repositorio; no mantiene una segunda implementación del grafo, la clasificación ni el borrado.
- `PuertoDestinoDePruebas`: responde únicamente si el despliegue y la base destino están clasificados como entorno aislado autorizado. El adaptador de infraestructura usa la configuración server-side y datos no secretos de identidad del destino; no devuelve credenciales ni las filtra a la UI. Las API consultan este guard antes de tocar datos y fallan cerrado si no está disponible.
- La implementación lee el booleano de habilitación desde `src/infrastructure/env.ts`; no consulta directamente el entorno desde rutas, casos de uso o componentes.
- Worker acotado para operaciones en segundo plano y recuperación de lease.
- `PuertoAlmacenamientoDePrueba`: adapta el resultado por archivo y reintentos al almacenamiento administrado.
- Extensión de `PuertoAprendizaje` para reconciliar matrículas de prueba, solo después de que I02 esté especificada y revisada.

La operación interna no es un evento CRM de outbox: no representa un cambio que deba sincronizarse a proveedores. La cola M42 existe para el trabajo durable, progreso y recuperación requeridos aquí; no es una cola genérica de tareas.

## 7. Métricas y reportes que alimenta

No altera métricas comerciales ni reportes del CRM. La pestaña muestra únicamente:

- filas marcadas actuales por módulo;
- filas cargadas o retiradas por operación;
- duración, fase y resultado;
- bloqueos agrupados: referencias no marcadas, clasificación antigua, archivos pendientes o Moodle pendiente.

Nunca mostrar teléfonos, emails, payloads, contenido de archivos, credenciales, historial educativo ni listas de IDs. Volumen de referencia actual: hasta 4.699 filas de negocio definidas por el seed, sin contar catálogos; Academy y archivos quedan **sin volumen verificado**.

## 8. Criterios de aceptación

1. **Permisos:** un administrador autorizado puede ver y usar la pestaña; broker, asistente y actor sin permiso reciben denegación en página y API. Pruebas de ruta con rol y alcance, no solo pruebas de UI.
2. **Datos reales, preflight y dependientes:** insertar una fila real/no marcada —incluida una con ID dentro del antiguo rango— y demostrar que vaciar nunca la borra ni cambia su huella. El preflight de dos pasos debe entregar una huella/vencimiento, conteos sin PII y bloqueos; confirmar un grafo cambiado o vencido devuelve `409` sin mutar. Crear dependientes elegibles y dependientes ambiguos, de otro lote o con referencias ajenas; solo la selección confirmada de una cadena exclusiva puede clasificarse `manual_test` y purgarse. Una referencia no elegible bloquea la operación antes de cualquier mutación.
3. **Guardia M40:** el grafo incluye las siete tablas de `0007` más `unit_sales`. En las seis tablas M40 purgables, `DELETE`/`TRUNCATE` sin una operación vigente y su fila exacta de manifiesto falla; el worker M42 solo borra filas autorizadas por lote/PK/operación dentro de la transacción, conserva tombstone/auditoría y nunca usa `TRUNCATE`. `transaction_commands` se conserva siempre y no tiene excepción de borrado. `unit_sales` se verifica según su propio contrato de integridad. Una falla revierte datos, manifiesto y auditoría.
4. **Conservación:** después de vaciar y cargar, roles, permisos, etapas, catálogos, configuración, cuentas de integración, sesiones y usuarios reales permanecen iguales. Probar especialmente las tres cuentas de prueba protegidas (`admin.prueba`, `asistente.prueba`, `broker.prueba`) y sus vínculos.
5. **Vaciado repetible:** vaciar dos veces es seguro; la segunda no borra filas adicionales ni modifica filas reales. Una misma clave idempotente devuelve el resultado previo.
6. **Carga repetible:** cargar dos veces no crea duplicados ni sobrescribe cambios de filas marcadas; una clave repetida con contenido distinto da conflicto.
7. **Paridad de seed:** cargar después de vaciar produce la misma huella lógica, volúmenes e invariantes del seed. Comparación de contrato contra el generador determinista; excluir metadatos de operación/auditoría.
8. **Atomicidad y concurrencia:** simular fallo en cada fase DB, incluidos autorización M40 y retiro del manifiesto; verificar rollback de filas y manifiesto. Ejecutar lecturas/escrituras normales en paralelo y demostrar ausencia de bloqueos de tabla y de operación incompleta visible como éxito.
9. **Auditoría:** cada inicio, resultado y fallo queda atribuido y redactado. Una falla de auditoría revierte junto con el cambio de datos; no aparecen valores personales ni secretos.
10. **Outbox:** ninguna carga genera envíos externos; outbox y DLQ no se eliminan. Eventos o referencias ligados a fixtures impiden una limpieza no reconciliada, excepto la desmatriculación Moodle marcada, que sigue el flujo idempotente y no bloqueante del criterio 12 cuando su contrato esté aprobado.
11. **Archivos:** un objeto no marcado nunca se elimina. Fallo parcial mantiene el estado de atención y permite reintento idempotente hasta confirmar cada archivo.
12. **Moodle:** la operación confirma y audita la limpieza local sin esperar a Moodle; la desmatriculación marcada se encola para ejecución idempotente y reintentos. Timeout o indisponibilidad conservan el resultado local y muestran sincronización externa pendiente. Antes de cerrar M42-F y de solicitar `READY`, pruebas unitarias/de contrato con un doble en memoria de `PuertoAprendizaje` deben conservar cuentas y matrículas ajenas y retirar solo la matrícula marcada. La prueba de integración real se ejecuta cuando I02 esté `READY`; no bloquea la verificación local de M42 ni se afirma como realizada antes de esa dependencia.
13. **Estados y responsive:** demostrar los seis estados con mensajes concretos y acciones recuperables; captura/revisión a 320, 390, 768 y 1440 px. El estado de carga larga distingue fase conocida de progreso no medible y nunca simula porcentaje.

### Límite de multiempresa

No se incluye un criterio de prueba entre empresas en esta etapa: la Decisión #51 deja G12 aprobada pero en pausa hasta completar el CRM para Quisqueya Home. La ausencia de esa prueba no significa que M42 sea segura para múltiples empresas. Antes de activar G12 para M42, agregar a sus criterios: dos lotes aislados; purga de A que conserva filas, conteos y huellas de B; y respuestas `404` al consultar o mutar operaciones de B desde A. Acompañar esos criterios con `tenant_id`, filtros de servidor, claves únicas compuestas y políticas RLS de G12, verificados en migración y ejecución.

## 9. Fuera de alcance y preguntas abiertas

### Fuera de alcance

- Borrar CRM completo, tablas de configuración, catálogos, roles, permisos, etapas, usuarios protegidos, Auth, sesiones, audit log, outbox, cuentas de integración, archivos no marcados o datos externos.
- Crear/eliminar usuarios de prueba o cambiar sus credenciales.
- Eliminar cursos, cuentas Moodle, certificados o historial educativo.
- Reiniciar la base con `db:reset` desde la interfaz.
- Clasificar automáticamente como prueba una fila creada fuera del manifiesto. Una dependencia no marcada se trata inicialmente como ajena; solo una cadena íntegra hacia fixtures del mismo lote, validada por preflight y seleccionada por el administrador, puede entrar a la purga. Las mutaciones normales no se incorporan automáticamente ni se bloquean.
- Habilitar la acción en producción o contra una base comercial compartida. Un destino no clasificado como desarrollo/staging aislado queda deshabilitado; una confirmación de usuario no sustituye el guard del servidor.

### Preguntas y bloqueos para `READY`

1. **Alcance de entorno (resuelto para el contrato):** se permite desarrollo o staging/demo solo cuando el booleano central de habilitación está activo, la configuración confiable del servidor identifica el entorno como aislado y el destino como una base dedicada de pruebas. Las tres condiciones son necesarias. Producción siempre falla cerrado; una petición del cliente no habilita la operación. El contrato valida identidad de destino y no exige loopback para una base aislada remota. La verificación de D11 en una base de prueba es precondición de `READY`.
2. **Filas seed antiguas:** D11 debe inventariar y calcular conteos/huellas sin borrar nada. Los registros históricos sin marca no se limpian salvo adopción exacta y aprobada.
3. **Cuentas:** resuelta para esta ficha: se protegen `admin.prueba`, `asistente.prueba` y `broker.prueba`, que son los tres perfiles definidos por `scripts/crear-usuario-prueba.mjs:32-62`.
4. **Moodle desde cero:** M42 propone retirar en segundo plano solo matrículas marcadas y conservar progreso/historial. D19/D12 deben confirmar ese contrato y aclarar si habrá una operación futura de reinicio de progreso; la API actual no permite baja acreditada e I02 sigue `DRAFT`.
5. **Cambios históricos de proyecto:** determinar si se deben restaurar asignaciones modificadas por `crear-usuario-prueba.mjs:169-175`. Como no hay valor anterior registrado, M42 no los revertirá automáticamente.
6. **Archivos:** D11/D19 deben definir almacenamiento administrado, resultado por objeto y retención/reintentos. El puerto actual no permite confirmar que el borrado físico terminó.
7. **Auditoría y retención:** definir plazo para `test_data_batches`, `test_data_records` retirados y operaciones. `audit_log` se conserva.
8. **Decisión irreversible:** propuesta de retirar físicamente solo filas con manifiesto exacto y autorización por operación, conservando el manifiesto como tombstone, auditoría y la historia durable ajena a M42. Registrar alternativas, alcance y reversibilidad en ADR antes de `READY`; D11 y revisor humano deben aceptar el cambio de guardia M40.
9. **RLS monotenant:** antes de `READY`, D11 verifica en la base de prueba que `.enableRLS()` esté aplicado, que el acceso `PUBLIC`/PostgREST esté revocado y que el rol real usado por `getDb()` pueda operar con privilegio mínimo. El rol no se deduce de un nombre de producto ni se imprime desde la configuración; el nombre no secreto y la concesión concreta quedan en la evidencia D11. La guía del proyecto permite no crear políticas mientras las tablas solo las lea Drizzle (`docs/contexto/flujo-de-trabajo.md:173`). Si se habilita Supabase JS en navegador, D11 debe definir políticas explícitas antes de exponerlas. La recomendación D12 basada en `tenant_id` corresponde a la futura expansión G12 y no aplica a #51.
10. **Dependencias de especificación:** M13 e I02 están `DRAFT`; no se encontraron fichas actuales G04/G05/G10 ni M14 en el índice leído. Deben resolverse permisos, auditoría, outbox e integración desde sus contratos canónicos antes de abrir implementación. Solo las fichas `READY` habilitan construcción (`.viltrum/vre-os/spec/00-indice.md:1-3`; `.viltrum/vre-os/FLUJO-PASADAS.md:17-18`).

## 10. Rebanadas

Tareas propuestas, cada una acotada a una responsabilidad y con límite de 45 minutos por agente. No abrirlas hasta que M42 esté `READY`, pase la revisión independiente y se liberen sus rutas. M42-B espera que termine y se integre en orden la cadena M40 `b1c → b1d → b1e → b1f`; después, D11 debe liberar expresamente `schema.ts`, migraciones, snapshots y journal. M42-A adapta el CLI después de M42-C/D y requiere la liberación de `scripts/seed/limpiar.ts`. Un worktree aislado no elimina esas dependencias. M42-F espera la liberación de D19 para `aprendizaje/**`/Moodle e I02 `READY`; M42-G espera la liberación del trabajo G4 en `configuracion/**`. El tablero `.viltrum/vre-os/EN-CURSO.md` se vuelve a comprobar al despachar, sin editar sus rutas reservadas mientras sigan reclamadas.

| Orden | Lote | Entrega y archivos permitidos propuestos | Dependencia / revisor |
|---|---|---|---|
| 1 | M42-B · esquema de operaciones y manifiesto | Tablas, PK polimórfica `text`, RLS/ACL server-only, `ENTITY_TYPES`, auditoría y migración forward-only de `m40_guard_history()` condicionada a manifiesto/operación exactos. `src/infrastructure/db/schema.ts`, `src/domain/catalogs.ts`, `drizzle/<migración>`, `scripts/test-db/**` | Después de M40 `b1f`; D11 libera formalmente `schema.ts`, `catalogs.ts`, migraciones, snapshots y journal. Verificar trigger, rol y privilegios efectivos en base de prueba antes de integrar. |
| 2 | M42-C · casos de uso | Contratos de consulta, preflight/confirmación, carga, idempotencia y doble en memoria; sin interceptar mutaciones comerciales. `src/application/datos-prueba/**` | Después de B; D03/D11; pruebas unitarias del caso y del doble. |
| 3 | M42-D · repositorio y worker | Persistencia transaccional, revalidación de huella, autorización exacta del guard M40, purga topológica, FK compuesta y recuperación. `src/infrastructure/db/repos/datos-prueba.ts`, `src/infrastructure/contenedor/datos-prueba.ts`, `scripts/datos-prueba-worker.mjs` | Después de B y C; D11 + D14; pruebas DB de rollback, autorización y rechazo de `DELETE`/`TRUNCATE` no autorizados, retención de `transaction_commands` y concurrencia. |
| 4 | M42-A · compatibilidad del seed y adaptador CLI | `scripts/seed/limpiar.ts` queda como entrada CLI del mismo caso de uso/repositorio; pruebas aseguran que no conserva un algoritmo alterno. `scripts/seed/limpiar.ts`, `scripts/seed/limpiar.test.ts` | Después de C y D; D11 + D14. El inventario de fixtures puede hacerse antes, pero el adaptador se implementa después de existir el contrato compartido. |
| 5 | M42-E · API y política de destino | Preflight, encolado y consulta de operación; Zod, RBAC, respuestas redactadas y guard fail-closed. `src/app/api/configuracion/datos-prueba/**`, `src/infrastructure/env.ts`, `.env.example` | Después de C y D; D11 confirma el rol/ACL de DB; D12 + D14 revisan API y booleano. `src/infrastructure/env.ts` es la única lectura de la bandera. |
| 6 | M42-F · archivos y Moodle | Limpieza externa idempotente y estado parcial recuperable; solo tras contratos aprobados. `src/application/compartido/almacenamiento.ts`, `src/application/aprendizaje/puertos.ts`, adaptadores y pruebas correspondientes | D11 + D12 + D19; I02 `READY` y liberación explícita de las rutas de D19/Moodle antes de tocar `aprendizaje/**` o `integraciones/moodle/**`. |
| 7 | M42-G · interfaz | Pestaña, resumen/selección del preflight, confirmación, progreso y seis estados responsive. `src/app/(crm)/configuracion/page.tsx`, `src/app/(crm)/configuracion/vista.tsx`, `src/app/(crm)/configuracion/datos-prueba-panel.tsx`, pruebas de Configuración | Después de E y de la liberación explícita de G4 para `configuracion/**`; D06 + D07 + D14. |

El guard de destino se implementa detrás del puerto de infraestructura en la tarea API autorizada; no se importa el guard CLI directamente en una ruta Next.js. Ninguna rebanada se habilita antes de `READY`, liberar rutas y confirmar un destino de pruebas aislado. La adaptación del trigger M40 requiere revisión D11 y aprobación humana por tratarse de historia transaccional durable.

## Handoff

**Revisor asignado:** D12, de proveedor distinto del productor. La ficha permanece en `REVIEW`; D03 no aprueba su propio diseño.

Solicito a D12 revisar especialmente el preflight topológico, el límite entre dependientes elegibles y referencias reales, el orden y las FKs compuestas de M40, la conservación de `transaction_commands`, `internal_pk TEXT`, el contrato RLS/ACL, el guard fail-closed de destino y las pruebas Moodle desacopladas. D11 debe comprobar el modelo, retención, privilegios efectivos y el destino aislado; D01 debe revisar que los límites y casos de uso no alteren el flujo comercial; D06 valida estados y confirmación destructiva. D14 verifica los criterios en ejecución después de implementar y con dependencias `READY`.

**Resultado del handoff:** pendiente de revisión; ningún criterio de aceptación se declara probado por esta ficha.

## Respuesta a la revisión R2

La tabla responde al informe R1 `.viltrum/vre-os/reviews/M42-revision-R1.md`; los identificadores conservan el origen de ese informe. Esta iteración documental es R2 y la ficha corregida queda en versión R4. Las disposiciones son propuestas de contrato, no evidencia de implementación ni aprobación independiente.

| Hallazgo de R1 | Disposición en esta ficha | Evidencia / límite |
|---|---|---|
| H-M42-R3-B01 · trigger M40 bloquea el vaciado | Atendido en el contrato: migración M42-B forward-only permite borrar solo filas con manifiesto exacto, lote, PK y operación activa; `TRUNCATE` y cualquier borrado sin ese registro siguen prohibidos. `transaction_commands` queda retenida. | `drizzle/0007_m40_compromisos_reservas.sql:394-453`; §5, CA 3/8 y §10. La migración y prueba DB aún no existen; D11 + revisión humana son requisito previo a `READY`. |
| H-M42-R3-M01 · preflight sin API/UX | Añadida acción Zod `preflight_vaciar` en el POST de operaciones, salida resumida con huella/vencimiento, solicitud final con `preflightId` y selección booleana; modal en dos pasos y revalidación antes de encolar. | §3, §4, CA 2 y §10 M42-C/E/G. Sin implementación ni prueba de ruta/UI. |
| H-M42-R3-M02 · guard de destino sin config central | Definido el booleano de habilitación central, seguro por defecto y subordinado a la clasificación de entorno/destino; se agrega la configuración central y el archivo de ejemplo a M42-E. | §5, §6 y §10 M42-E. Sin despliegue ni lectura de archivos de entorno. |
| H-M42-R3-m01 · algoritmo CLI duplicado | `scripts/seed/limpiar.ts` queda como adaptador al mismo caso de uso/repositorio M42-C/D; su adaptación se ejecuta después de que ese contrato exista. | §6 y §10 M42-A. No se modificó ni probó el CLI. |
| H-M42-R3-m02 · grants/RLS sin rol de runtime | Se define habilitar RLS, revocar a roles públicos/de cliente y conceder privilegio mínimo al rol PostgreSQL efectivo confirmado por D11. Se rechaza fijar `service_role` por inferencia: `client.ts:13-38` solo muestra conexión directa usando la configuración centralizada, no el rol efectivo. | §5 y §9 pregunta 9. D11 debe verificar y registrar el rol no secreto en base de prueba antes de autorizar la migración/`READY`; sin conexión a DB no está verificado. |
