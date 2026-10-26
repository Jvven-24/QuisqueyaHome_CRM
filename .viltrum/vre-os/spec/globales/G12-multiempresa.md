---
id: G12
nombre: Multiempresa en una sola instalación
estado: READY
nivel: L1
riesgo: R3
owner: D03
productor: Codex — D03 Arquitectura
revisores: [D12, Wilber]
actualizado: 2026-10-18
tarea: T-G12-1018-R2
revision_atendida: R1 — G12-multiempresa-D12
fuente_de_verdad: PostgreSQL del CRM
afecta_a: [M01, M03, M13, M22, M40, M41]
---

> **Compuerta D00 (2026-10-18).** R2 independiente (`reviews/G12-multiempresa-D12-R2.md`): APROBADO CON CONDICIONES.
> Wilber aprobó Q12-01 a Q12-04 (decisión #50). READY habilita las rebanadas en el orden de «Rebanadas», una tarea de
> ≤45 min cada una (H-R2-G12-02); `g3d` debe demostrar en ejecución el aislamiento del pool antes de `q-db` (H-R2-G12-01).


# G12 · Multiempresa: identidad, membresía y aislamiento

**Propuesta de arquitectura sometida a revisión independiente.** La decisión de operar una sola instalación multiempresa está aprobada por Wilber en la decisión #49. El diseño físico, la migración y los contratos de esta ficha permanecen en `REVIEW`; no acreditan implementación ni autorizan DDL.

**Convención de evidencia:** HECHO significa código o documento leído; DECISIÓN identifica una instrucción registrada del dueño; PROPUESTA describe el comportamiento objetivo. Las pruebas, configuraciones o capacidades no comprobadas se marcan **NO VERIFICADO**.

Las referencias a `schema.ts` corresponden a `src/infrastructure/db/schema.ts`. El inventario estático contiene **42 tablas**. El esquema desplegado y los datos actuales de cualquier base son **NO VERIFICADO**.

## 1. Propósito y usuarios

Permitir que una identidad trabaje en varias inmobiliarias sin mezclar sus clientes, inventario, permisos, actividad, dinero ni integraciones.

Verbos del negocio:

- Identificar a la persona.
- Consultar sus empresas disponibles.
- Aceptar una invitación vigente.
- Seleccionar la empresa activa.
- Autorizar una operación dentro de esa empresa.
- Suspender una membresía.
- Revocar una facultad.
- Atribuir un cambio a su empresa y autor.
- Procesar un evento para la conexión empresarial correcta.

Una inmobiliaria es un **inquilino**. Una agencia colaboradora, una persona jurídica cliente, una sucursal y un proyecto son conceptos distintos. `agencies` ya se describe como afiliación comercial sin constituir una frontera de permisos: `src/infrastructure/db/schema.ts:352`.

Usuarios:

| Actor | Trabajo permitido |
|---|---|
| Identidad autenticada | Consultar exclusivamente sus membresías y seleccionar una empresa elegible |
| Miembro de una empresa | Operar con sus permisos efectivos en esa empresa |
| Administrador empresarial | Administrar membresías y facultades dentro de su empresa |
| Identidad técnica | Ejecutar una capacidad concreta para un inquilino explícito |
| Operador de plataforma | Administrar el servicio; su condición no concede lectura de datos empresariales |
| Soporte autorizado | Acceso excepcional temporal, justificado y auditado, cuando exista el contrato correspondiente |

No se añaden roles comerciales por inferencia. La separación de facultades de plataforma y cliente procede de UI-074 y AUTH-01…08: `.viltrum/vre-os/fuentes/especificacion-maestra-v1.txt:897`, `:2386`.

**Invariante principal:** conocer un identificador, compartir correo con un cliente, tener permiso `all` o pertenecer a otra empresa nunca concede acceso al registro.

## 2. Estado actual

| Área | HECHO observado | Implicación para G12 |
|---|---|---|
| Decisión vigente | #49 sustituye #5 y exige `tenant_id`, membresías, contexto y pruebas entre empresas: `docs/contexto/decisiones.md:320` | La alternativa de empresa única queda histórica |
| Esquema | 42 declaraciones `pgTable`; ninguna columna empresarial `tenant_id`: `src/infrastructure/db/schema.ts:146`, `:1324` | La incorporación es transversal |
| Identidad | `users.role_id` apunta a un único rol: `src/infrastructure/db/schema.ts:164` | El rol efectivo debe trasladarse a la membresía |
| Actor | Contiene `userId`, `roleSlug`, `permissions`: `src/domain/rbac.ts:36` | No representa empresa ni membresía |
| Resolución del actor | Une usuario, rol y permisos sin contexto empresarial: `src/infrastructure/auth/actor.ts:66` | Un usuario multimiembro no puede autorizarse con esta consulta |
| Listados | `visibleRows` aplica papelera y alcance: `src/infrastructure/rbac-filter.ts:48` | Debe incorporar obligatoriamente el inquilino |
| Alcance total | `scopeCondition("all")` devuelve `undefined`: `src/infrastructure/rbac-filter.ts:28` | `all` debe significar toda la empresa activa |
| Registros individuales | `reaches("all")` devuelve `true`: `src/domain/rbac.ts:114` | Falta comprobar pertenencia del registro |
| Middleware | Verifica sesión y rutas privadas: `src/middleware.ts:60`, `:78` | No sustituye la autorización empresarial |
| Conexión | Cliente compartido y transacciones sin contexto empresarial: `src/infrastructure/db/client.ts:21`, `:49` | Debe añadirse ejecución acotada por contexto |
| RLS histórica | Migración 0001 habilita RLS sin políticas públicas: `drizzle/0001_enable_rls_public_tables.sql:1` | No demuestra aislamiento de las consultas del servidor |
| Búsqueda | Consulta varios tipos mediante `visibleRows`; sus joins no contienen empresa: `src/infrastructure/db/repos/busqueda.ts:34`, `:49`, `:126` | Resultados, fragmentos y agregados necesitan el mismo aislamiento |
| Notificaciones | Lectura y marcado filtran por usuario: `src/app/api/notificaciones/route.ts:29`, `:62`, `:69` | Un usuario multimiembro necesita también filtro empresarial |
| Outbox | Emisión sin empresa; deduplicación global por clave: `src/infrastructure/integraciones/outbox/repositorio.ts:10`; `src/infrastructure/db/schema.ts:1290` | Deben cambiar envelope, consultas y restricciones |
| Moodle | Configuración general; búsqueda por correo y respaldo de ID local: `src/infrastructure/integraciones/moodle/cliente.ts:72`, `:353`, `:521` | No acredita aislamiento LMS entre empresas |
| Twenty | La fábrica inspeccionada selecciona el adaptador local: `src/infrastructure/contenedor/crm.ts:5` | Adaptador Twenty operativo: **NO VERIFICADO** |
| Migraciones | Journal termina en 0006: `drizzle/meta/_journal.json:47` | Las nuevas migraciones se asignan después del último número vigente al despacho |
| Ensayo poblado | Lista explícita de 23 tablas: `scripts/test-db/migracion-poblada.mjs:11` | Debe ampliarse para cubrir las 42 actuales |
| Conservación del origen | Runner calcula conteos y huellas en servidor: `scripts/test-db/run.mjs:45`, `:57` | Patrón reutilizable sin extraer filas sensibles |

La ausencia de tenant corresponde al diseño anterior; esta inspección no demuestra una fuga entre empresas en un producto multiempresa ya desplegado.

**Alcance estático del cambio:** las 40 tablas empresariales clasificadas abajo, resolución de identidad, autorización, repositorios, consultas SQL directas, integraciones, semillas y superficies de datos. El impacto de grafo es **NO VERIFICADO**: GitNexus no estuvo disponible como herramienta invocable en esta sesión. No se modificaron símbolos ni se regeneraron índices.

### Precedencia documental

La decisión #49 resuelve la elección multiempresa de Q40-01. No prueba la implementación de sus garantías ni acepta automáticamente los demás ADR de M40.

M40 mantiene una compuerta para DDL en su cabecera, además de formulaciones históricas sobre Q40-01: `.viltrum/vre-os/spec/modulos/M40-transaccion.md:18`, `:225`, `:903`. D00 debe reconciliarlas con #49 y G12 antes del despacho. La condición H-R2-02 no se declara cerrada por este productor: `.viltrum/vre-os/reviews/M40-transaccion-D12-R2.md:75`.

## 3. Pantallas

### UI-001 · Acceso y cambio de empresa

Fuente: `.viltrum/vre-os/fuentes/backlog-Pantallas.csv:5` y `.viltrum/vre-os/fuentes/especificacion-maestra-v1.txt:1027`.

**Rutas objetivo:** `/organizaciones` para selección; integración con `/login` existente. La equivalencia con `/acceso` de la especificación debe resolverse mediante navegación o alias, sin duplicar autenticación.

Contenido:

- Empresas de la identidad autenticada, con nombre visible y estado de su membresía.
- Empresa activa claramente identificada en el shell.
- Invitación con empresa emisora, rol previsto y vencimiento.
- Selector de empresa separado de cualquier selector futuro de sucursal.
- Sin directorio global de empresas ni búsqueda de pertenencias por correo ajeno.

Al cambiar:

1. Bloquear nuevos envíos desde el contexto anterior y cancelar consultas.
2. Solicitar el cambio al servidor con protección contra CSRF.
3. Validar sesión, empresa, membresía, vigencia y versión del contexto.
4. Actualizar el contexto de esa sesión.
5. Limpiar estado empresarial del cliente y cerrar suscripciones anteriores.
6. Obtener nuevamente actor, permisos y datos.
7. Navegar a una ruta autorizada de la empresa seleccionada.

Una petición antigua debe fallar por conflicto de contexto; nunca reinterpretarse silenciosamente en la nueva empresa.

Cada formulario conserva el tenant y la versión con los que fue renderizado. Envía las cabeceras de §4; no las sustituye justo antes del envío por el contexto más reciente de una cookie compartida. Se prueba también A→B→A: coincidir en tenant no convierte un formulario de versión anterior en vigente.

### UI-074 · Membresías y permisos efectivos

Fuente: `.viltrum/vre-os/fuentes/backlog-Pantallas.csv:78`.

**Superficie actual:** Configuración. La correspondencia final con `/configuracion/usuarios` y `/roles` queda para D04/D09.

Debe mostrar únicamente miembros, roles y permisos de la empresa activa, con explicación de autorización o denegación.

Suspender a alguien en A modifica su membresía en A. No desactiva su identidad global ni su membresía en B.

Invitar una identidad existente no debe revelar sus otras empresas. La invitación no concede facultades hasta su aceptación válida.

La protección contra desactivar al último propietario está requerida por UI-074; la equivalencia entre “propietario” y los roles actuales requiere decisión de Wilber.

### Estados y móvil

| Estado | UI-001 | UI-074 |
|---|---|---|
| Carga | Selector sin datos empresariales anteriores | Esqueleto sin filas residuales |
| Vacío | Sin membresías elegibles; explicación y salida segura | Sin miembros coincidentes con el filtro |
| Error | Diagnóstico recuperable; contexto confirmado por servidor antes de continuar | Error asociado a la operación; sin aplicar cambios aparentes |
| Sin conexión | No permite cambiar de empresa ni aceptar invitación | Sin cambios de permisos; contenido privado no se recupera de caché general |
| Éxito | Empresa y permisos recargados | Resultado confirmado y auditable |
| Permiso insuficiente | Empresa no seleccionable; sin revelar datos internos | Acción denegada con explicación adecuada |

Conflictos de versión, membresía suspendida e invitación caducada tienen estados diferenciados.

A 320/390 px: selector en lista vertical, nombre legible, acciones accesibles y confirmación visible sin desplazamiento horizontal. Capturas exigidas a 320/390/768/1440.

Componentes concretos del catálogo Viltrum, wireframes y validación de accesibilidad: **NO VERIFICADO**, entrega pendiente de D04/D05/D07. No se inventan identificadores de componentes.

## 4. Funciones

Los nombres siguientes son contratos propuestos, no funciones existentes.

| Caso de uso | Entrada validada | Regla y salida | Autorización | Auditoría e idempotencia |
|---|---|---|---|---|
| `listarMisEmpresas` | Identidad verificada; sin `userId` libre | Devuelve proyección mínima de membresías propias | Operación de identidad propia; no exige seleccionar empresa | Sin cuerpos sensibles en logs |
| `cambiarEmpresaActiva` | UUID empresarial, versión esperada, clave de comando | Revalida pertenencia; devuelve contexto nuevo o conflicto | Identidad propia y membresía elegible | Registra cambio; reintento idéntico no vuelve a incrementar versión |
| `resolverActorEmpresarial` | Referencia de sesión verificada | Resuelve usuario, empresa, membresía y permisos actuales | Denegación por defecto | Sin autoridad derivada del navegador |
| `invitarMiembro` | Correo, rol empresarial, vigencia autorizada | Invitación ligada a empresa y rol del emisor | Facultad administrativa de la empresa activa | Hash de token; deduplicación del comando |
| `aceptarInvitacion` | Prueba de invitación e identidad | Verifica destinatario, caducidad y uso; crea/reactiva membresía según política | Identidad vinculada al destinatario | Consumo atómico de un solo uso |
| `cambiarRolDeMembresia` | Membresía, rol, versión, motivo | Revalida límites y evita autoescalada | Facultad empresarial; sin facultades de plataforma | Mismo commit que cambio e incremento de versión |
| `suspenderMembresia` | Membresía, versión, motivo | Bloquea nuevas operaciones de esa empresa | Administración empresarial | Historia preservada; efecto inmediato |
| `consultarRecurso` | Identificador público y filtros permitidos | Empresa + permiso + alcance + estado del recurso | `requireScope` y filtro empresarial | Recurso ajeno responde sin revelar existencia |
| `ejecutarTrabajoEmpresarial` | Referencia de trabajo y contexto persistido | Usa el tenant del trabajo y su capacidad técnica | Identidad técnica acotada | Dedupe por empresa y operación |

Zod rechaza campos de autoridad inesperados. Las escrituras asignan campos explícitos; no aceptan `tenant_id`, autor o rol efectivo mediante expansión de un cuerpo JSON.

Las operaciones de identidad anteriores a la selección necesitan una frontera propia. No deben obligar a inventar un tenant para listar membresías. Si requieren una excepción a la guarda de rutas actual, D12 revisará la ruta exacta, verificación de identidad, propiedad de los datos y prueba negativa. No se autoriza una excepción genérica para `/api/auth/**`.

Errores: sesión inválida, permiso insuficiente, recurso no visible, contexto obsoleto, invitación inválida y conflicto de idempotencia. Las respuestas no revelan pertenencias, correos existentes ni nombres de empresas ajenas.

### Transporte HTTP del contexto empresarial

Contrato objetivo para **cada mutación empresarial del navegador** (`POST`, `PUT`, `PATCH`, `DELETE`):

| Cabecera | Validación | Significado |
|---|---|---|
| `X-Tenant-Id` | UUID obligatorio | Empresa bajo la que se renderizó la acción; solo precondición, nunca autoridad |
| `X-Context-Version` | Entero no negativo obligatorio | Versión de selección de esa sesión al renderizar la acción |

El servidor verifica la identidad y resuelve su contexto vigente desde la sesión; compara ambas cabeceras con ese contexto antes de leer o modificar datos empresariales. Contexto ausente o mal formado responde `400` / `TENANT_CONTEXT_REQUIRED`; sesión inválida, `401`; membresía no elegible o permiso insuficiente, `403`. Diferencia de tenant o versión responde **`409 Conflict` / `TENANT_CONTEXT_MISMATCH`**, sin ejecutar la operación ni devolver el tenant esperado. El navegador descarta el formulario obsoleto y pide recargar el contexto; no reintenta automáticamente en otra empresa. Estas cabeceras no sustituyen CSRF, validación de origen ni permisos.

La comparación y la escritura durable comparten unidad de trabajo: bloquear en lectura la fila de `session_tenant_contexts` hasta terminar la mutación; el cambio de empresa actualiza esa fila con bloqueo exclusivo y comparación de versión. Así el cambio de contexto y el envío concurrente tienen un orden definido: la mutación termina en su contexto validado o falla por conflicto, nunca se aplica en el nuevo tenant por una carrera posterior a la comprobación. No se mantiene el bloqueo durante llamadas externas.

Excepciones acotadas: login, listado propio de membresías y aceptación de invitación son operaciones de identidad, anteriores a la selección; se autorizan por identidad/destinatario verificados, no por un tenant ficticio. `cambiarEmpresaActiva` compara obligatoriamente `X-Context-Version` y, si ya hay empresa activa, `X-Tenant-Id` del contexto de origen; solo puede omitirse esta última al seleccionar desde un contexto sin empresa. El UUID de destino es un campo explícito validado del comando, no autoridad para escribir datos comerciales. Workers y webhooks no usan cabeceras del navegador: derivan empresa y capacidad del trabajo/binding autenticado. Cada excepción necesita ruta y prueba negativa revisadas por D12.

El contrato se adopta en `g3a`/`g3b`, `g4-*`, `g8a` y `g8b`; clientes legacy sin cabeceras no acceden a mutaciones multiempresa. Cualquier futura entrada de escritura distinta de HTTP debe aportar una precondición equivalente comprobada por la misma unidad de trabajo.

### Administración empresarial frente a identidad global

Las altas, cambios de rol y bajas empresariales operan sobre `memberships` mediante `invitarMiembro`, `cambiarRolDeMembresia` y `suspenderMembresia`. Sus listados proyectan solo miembros de la empresa activa. Un administrador de A no modifica `users.role_id`, `users.is_active`, `users.deleted_at`, atributos personales globales ni el vínculo Auth de otra identidad, aunque tenga alcance `all` en A.

`g4-usuarios` debe retirar las facultades empresariales actuales de `PATCH`/`DELETE /api/usuarios/[id]`: no pueden seguir invocando la edición/baja global por tener permiso empresarial. La ruta legacy queda denegada a administradores de tenant; la gestión empresarial usa contratos de membresía. Una eventual edición del perfil propio exige contrato separado, campos globales ratificados por Q12-05 y prueba de identidad propia; esta ficha no habilita esa API por inferencia. El bloqueo/eliminación global corresponde a una capacidad de identidad/plataforma expresamente autorizada, fuera de la administración empresarial. `g8c` consume exclusivamente estas operaciones locales.

### Evaluación local multiempresa

`getEvaluationActor` conserva primero la comprobación de `evaluationLoginAllowed` del servidor. Solo en ese entorno, `qh_dev_role` selecciona un rol de una **membresía real elegible**; `qh_dev_tenant` es un selector UUID adicional validado contra empresas de evaluación permitidas. Sin ese selector se resuelve explícitamente Quisqueya Home por su registro de migración, nunca el primer rol con igual slug ni un UUID incrustado. Un selector presente e inválido, tenant no autorizado o falta de membresía devuelve denegación, sin fallback.

La consulta une identidad, membresía, rol y concesiones por tenant; una selección determinista de identidad dentro de esa empresa no inventa miembros ni eleva facultades. El actor incluye tenant, membresía y versiones. Cambiar de empresa en evaluación pasa por el mismo comando de contexto/versionado; editar una cookie no evita las precondiciones de mutación. Las cookies de evaluación no son credenciales ni autoridad en producción, donde deben ignorarse/denegarse aunque existan. `g3b` incluye la adecuación del acceso de evaluación existente y sus llamadores exactos inventariados antes del despacho.

## 5. Datos

Se propone separar:

- **Identidad global:** quién es la persona.
- **Membresía empresarial:** en qué empresa actúa y con qué facultades.
- **Contexto de sesión:** qué empresa seleccionó para esa sesión.
- **Registro empresarial:** a qué tenant pertenece el dato.

Todas las tablas empresariales llevan `tenant_id NOT NULL`, FK a `tenants`, integridad entre padres e hijos y política efectiva de aislamiento.

El inventario completo y las restricciones se detallan en **Modelo de datos**. Las tablas globales no son tablas públicas ni directorios accesibles a administradores empresariales.

## 6. Integraciones y puertos

### Límites propuestos

| Módulo | Responsabilidad | Dependencia | Expone | Desconoce |
|---|---|---|---|---|
| Identidad | Acreditar la identidad | Puerto de autenticación | Identidad y sesión verificadas | Cartera comercial |
| Membresías | Resolver pertenencia empresarial | Repositorio propio | Membresía elegible | SDK de autenticación |
| Autorización | Evaluar facultades empresariales | Identidad, membresía, concesiones | Decisión con contexto | Cliente SQL |
| Contexto de sesión | Mantener la selección empresarial | Identidad, membresía | Contexto versionado | Reglas financieras |
| Conexiones | Resolver destino empresarial | Configuración protegida | Conexión acotada | Reglas comerciales |
| Datos de módulo | Persistir su agregado | Contexto autorizado | Repositorio del módulo | Sesiones de navegador |

Entrada → aplicación → dominio; los adaptadores implementan los puertos de aplicación. Ningún módulo de negocio importa SDK de proveedor. El contexto no se almacena en una variable global mutable.

### Puertos mínimos

- Puerto de identidad: identidad y sesión verificadas, con comprobación de revocación.
- Puerto de membresías: pertenencias propias, rol, estado y vigencia.
- Puerto de contexto: selección y comparación de versión.
- Unidad de trabajo empresarial: ejecuta repositorios, auditoría y outbox bajo el mismo contexto.
- Resolución de conexiones: devuelve un adaptador configurado exclusivamente para la empresa.
- Almacenamiento: exige contexto empresarial al subir, firmar o borrar.
- Integraciones CRM/aprendizaje: reciben contexto empresarial y conexión identificada.

El adaptador HTTP entrega al puerto de contexto las precondiciones de §4. La unidad de trabajo valida su vigencia y entrega a cada repositorio una conexión transaccional acotada; un puerto de negocio no recibe el objeto `Request`, cookies ni el cliente del proveedor.

Se amplían los contratos actuales; no se crea un segundo `CrmPort` o puerto de aprendizaje. `ContextoCrm` actualmente carece de empresa y conexión: `src/application/compartido/crm.ts:11`.

### Outbox, inbox y referencias externas

Contrato objetivo:

- Envelope con `tenant_id`, identidad de evento, agregado, versión, correlación y payload mínimo.
- `tenant_id` proviene del contexto transaccional; no de un campo libre del payload.
- Evento y mutación se confirman en la misma transacción.
- Deduplicación, referencias y confirmaciones se acotan por empresa y conexión.
- Un evento A nunca puede confirmar una entrega, referencia externa o DLQ de B.
- Los consumidores externos no mantienen bloqueos SQL durante llamadas de red.
- No se introducen tipos nuevos sin actualizar contrato, validadores, CHECK y consumidores.

La cola actual usa `SKIP LOCKED` y filtra tipos con consumidor: `src/infrastructure/integraciones/outbox/repositorio.ts:25`. Estas garantías se conservan.

El planificador puede enumerar inquilinos habilitados mediante una capacidad técnica mínima. Cada lote ejecuta consultas bajo un tenant explícito. No utiliza un actor administrativo global para leer payloads de todas las empresas.

### Configuración empresarial

| Integración | Configuración por empresa | Aislamiento requerido |
|---|---|---|
| Moodle | Conexión, instancia, referencia de secreto, ámbito educativo, mapeos de usuarios/cursos | Sin equivalencia por correo o ID local entre conexiones |
| Twenty | Conexión, instancia/workspace, referencia de secreto, mapeos y eventos admitidos | Cada referencia externa pertenece a conexión y tenant |
| Mensajería | Proveedor, cuenta/número/canal, identidad remitente, webhook y referencia de secreto | Tenant resuelto desde binding verificado |
| Calendario | Conexión, miembro, calendario externo, dirección | Sin mezclar calendarios de una identidad multimiembro |
| Portal | Binding verificado de dominio/sitio y empresa | Caché y proyecciones incluyen host y tenant |
| Archivos | Namespace privado, política de acceso y conexión | Firma y descarga revalidan empresa y permiso |

No se listan valores secretos ni configuración sensible en esta ficha.

La configuración global del proceso conserva únicamente funciones de plataforma y resolución de secretos. Una empresa sin conexión configurada recibe “integración no disponible”; no hereda la conexión de Quisqueya Home.

Moodle compartido entre empresas requiere prueba de aislamiento del proveedor. Su soporte nativo y la configuración actual son **NO VERIFICADO**. Antes de habilitar otra empresa debe acreditarse un ámbito seguro o una instancia/conexión separada. El respaldo `moodleUserId ?? usuarioId` debe desaparecer de rutas multiempresa: `src/infrastructure/integraciones/moodle/cliente.ts:521`.

Los expedientes D21 de aislamiento por proveedor y sus planes de salida están pendientes. Esta ficha no certifica las integraciones.

## 7. Métricas y reportes

Métricas propuestas, segmentadas por tenant y sin etiquetas con datos personales:

- Intentos de acceso empresarial rechazados.
- Conflictos de versión del contexto.
- Latencia y errores de cambio de empresa.
- Consultas o trabajos sin contexto válido.
- Eventos pendientes, fallidos y entregados por conexión.
- Relaciones inválidas detectadas durante preflight.
- Cobertura del inventario de tablas, restricciones y pruebas.
- Resultado de conservación por tabla y fase de migración.

Un administrador empresarial no recibe métricas ni conteos de otras empresas. La observabilidad de plataforma muestra datos operativos mínimos.

Objetivos iniciales de la especificación, **no mediciones actuales**:

| Objetivo propuesto | Consecuencia arquitectónica |
|---|---|
| 20 tenants, 200 usuarios, 100.000 contactos, 25.000 unidades, 50 sesiones concurrentes | Ensayo multiempresa; índices encabezados por tenant; pool compartido sin contexto persistente |
| Lecturas típicas p95 <700 ms | Medir consultas con filtros y RLS efectivos |
| Búsqueda p95 <1 s | Aplicar autorización antes de límite, fragmentos y conteos |
| Disponibilidad inicial 99,5 % mensual | Operación y restauración comunes requieren runbook; pendiente de contrato |
| RPO ≤1 h y RTO ≤4 h | Backup de base/objetos y restauración aislada probada |

Fuente: `.viltrum/vre-os/fuentes/especificacion-maestra-v1.txt:6291`.

Los plazos de retención necesitan matriz por clase de dato; no se inventa un plazo único: `.viltrum/vre-os/fuentes/especificacion-maestra-v1.txt:6218`.

## 8. Criterios de aceptación

Todos son obligaciones futuras. Resultado actual: **NO VERIFICADO**.

| ID | Criterio | Evidencia exigida |
|---|---|---|
| G12-01 | Las 42 tablas actuales están clasificadas; toda tabla empresarial tiene tenant obligatorio | Inventario automático contrastado con esquema y catálogo SQL |
| G12-02 | Una identidad puede ser administrador en A y broker en B sin heredar facultades | Prueba de actor y contrato |
| G12-03 | `all` nunca supera la empresa activa | Unitaria, consulta real y mutación |
| G12-04 | Listas, detalle, agregados, búsqueda y exportación coinciden en aislamiento | Matriz A/B por superficie |
| G12-05 | La base rechaza relaciones entre empresas, incluso mediante SQL autorizado directo | Pruebas adversariales de FK y controles |
| G12-06 | No se puede mover una fila entre empresas con UPDATE | Prueba RLS y restricción de inmutabilidad |
| G12-07 | RLS protege con el rol real del servidor y worker | Pruebas de SELECT/INSERT/UPDATE/DELETE sin privilegios de migración |
| G12-08 | Falta o invalidez de contexto deniega; el pool no retiene contexto | Pruebas secuenciales y concurrentes |
| G12-09 | Cambiar empresa limpia estado; respuestas antiguas y formularios obsoletos no se aplican | E2E, navegación atrás, dos pestañas y almacenamiento local |
| G12-10 | Suspensión o revocación afecta nuevas operaciones sin esperar renovación del JWT | Contrato y E2E |
| G12-11 | Invitación vencida, consumida o de otro destinatario no crea membresía | Unitaria y BD concurrente |
| G12-12 | Notificaciones y marcado están separados por empresa | API con usuario miembro de A y B |
| G12-13 | Outbox/inbox/DLQ/referencias no cruzan tenant ni conexión | Dos consumidores, duplicados y reintentos |
| G12-14 | Archivos y exportaciones revalidan autorización al descargarse | Pruebas con revocación posterior a generación |
| G12-15 | Migración conserva valores originales, relaciones e historia | Conteos, huellas y reconciliación de 42 tablas |
| G12-16 | Sembrar o limpiar A no cambia B | Conteos y huellas de B antes/después |
| G12-17 | M40 usa tenant en tablas, FKs, comandos, compromisos y bloqueos | Revisión D11/D12 y pruebas transaccionales |
| G12-18 | Cada eliminación deliberada de una barrera relevante produce un fallo específico | Informe de mutación independiente |
| G12-19 | UI-001/UI-074 cumplen estados, móvil y accesibilidad | Capturas y recorrido independiente |
| G12-20 | No quedan caminos empresariales legacy sin aislamiento al activar multiempresa | Inventario de escritores/lectores y guardas de arquitectura |
| G12-21 | Una identidad nueva exclusiva de B tiene `users.role_id = NULL` y permisos solo de su membresía | Migración vacía/poblada, alta/invitación y resolución de actor; legado conservado |
| G12-22 | Las claves candidatas de `units` y `outbox` existen antes de sus FK hijas | Migrador oficial; inspección de catálogo y rechazos SQL por tenant/proyecto/evento incorrectos |
| G12-23 | La limpieza admite FK simples y compuestas reconocidas antes de `g2a`; una FK desconocida aborta sin borrar | Ensayo pre/post expansión, FK de dos/tres columnas, referencia ajena y huellas de B |
| G12-24 | Toda mutación empresarial compara tenant y versión esperados dentro de la unidad de trabajo | API: falta, formato, discrepancia, A→B→A y carrera de dos pestañas; error específico y cero efectos |
| G12-25 | Lecturas y escrituras usan el mismo ejecutor contextual; una conexión no lo hereda tras commit/rollback | Consulta positiva A/B con rol runtime, ausencia/valor inválido y pool concurrente; guarda contra `getDb()` empresarial directo |
| G12-26 | El administrador de A no altera identidad global ni membresía de B por rutas legacy o nuevas | API PATCH/DELETE adversarial, suspensión/rol locales y huellas de identidad/B intactas |
| G12-27 | El login de evaluación resuelve empresa/membresía deterministas sin habilitar bypass en producción | Contrato: slugs iguales A/B, selector inválido, ausencia de membresía y entorno no autorizado |
| G12-28 | El plan es compilable por rebanada y conserva los oráculos al cambiar el esquema | Typecheck por entrega; tipos antes del actor, huella por proyección que detecta alteración original y dedupe por claves físicas |

## 9. Fuera de alcance y preguntas abiertas

Fuera de alcance:

- Desplegar, migrar datos o activar otra empresa durante esta tarea.
- Crear sucursales, equipos o nuevos roles comerciales por inferencia.
- Implementar los 230 objetos lógicos de la especificación.
- Compartir cartera o inventario entre empresas.
- Construir acceso permanente de soporte a todos los tenants.
- Alterar importes, divisas, estados de venta o reglas de comisión.
- Resolver las decisiones financieras pendientes de M40/M22.
- Sustituir proveedores sin expediente D21 y revisión.
- Acreditar capacidad, seguridad o cumplimiento mediante documentación solamente.

Las decisiones de Wilber aparecen en una sección separada al final. Las restricciones seguras de aislamiento se mantienen aunque esas decisiones estén pendientes.

## Modelo de datos

### Entidades nuevas

| Entidad propuesta | Campos mínimos | Restricciones |
|---|---|---|
| `tenants` | `id uuid`, `slug`, nombre visible, estado, zona horaria, fechas, versión | PK UUID; slug global único; estado gobernado; sin borrado físico de historia |
| `memberships` | ID interno, UUID público, `tenant_id`, `user_id`, `role_id`, estado, vigencia, versión, fechas | UNIQUE `(tenant_id,user_id)`; FK a identidad; FK compuesta al rol; autoría preservada |
| `session_tenant_contexts` | Referencia de sesión verificada, `user_id`, empresa activa opcional, versión, fechas/revocación | Contexto por sesión; empresa activa vinculada a membresía del mismo usuario; sin contraseñas ni tokens claros |
| `invitations` | UUID público, tenant, destinatario, rol, hash de token, emisor, caducidad, consumo, versión | Rol y emisor de la misma empresa; consumo atómico; token no persistido en claro |

`session_tenant_contexts` es una proyección de selección empresarial. Supabase continúa siendo la fuente de autenticación; no se crea otro motor de sesiones. La integración exacta de la referencia de sesión verificada necesita prueba del adaptador y es **NO VERIFICADO**.

La raíz `tenants` y el contexto de sesión son metadatos de control. No reciben un `tenant_id` autorreferencial ni convierten una sesión multimiembro en propiedad de una sola empresa.

La fuente lógica usa `organizations`; la tarea y #49 usan `tenants`. Se propone **una única tabla física `tenants`**, mapeada al concepto empresarial de UI-001. No se crean ambas para representar lo mismo. Evidencia de la diferencia: `.viltrum/vre-os/fuentes/backlog-Datos.csv:5`, `docs/contexto/decisiones.md:322`.

El nombre legal de la primera empresa es **NO VERIFICADO**. No se inventan razón social ni identificadores fiscales al crear Quisqueya Home.

### Identidad global y rol empresarial

`users` permanece como identidad global, con sus IDs actuales. Su lectura empresarial ocurre mediante membresías de la empresa activa y una proyección autorizada; nunca mediante un directorio global.

- `users.role_id` deja de ser autoridad de autorización.
- **En `g2a`, durante expansión**, se conserva el valor de cada identidad existente como legado, sin usarlo en la autorización empresarial nueva; se ejecuta `ALTER TABLE users ALTER COLUMN role_id DROP NOT NULL` en la migración asignada.
- En Drizzle se retira `.notNull()` de `users.roleId`, manteniendo `integer("role_id")` y su FK legacy mientras haya valores históricos. No se prescribe una llamada `.nullable()`.
- Toda identidad creada por los flujos nuevos post-G12 escribe **`users.role_id = NULL`**; su autoridad reside exclusivamente en `memberships(tenant_id,user_id,role_id)`. No se toma un rol de Quisqueya Home ni de otra empresa para satisfacer la inserción.
- La nulabilidad se habilita en `g2a`, no en P8. La **retirada** de columna/FK queda para P8, tras eliminar consumidores legacy y acreditar conservación de los valores originales.
- `g1` inventaría los consumidores tipados de `roleId`; D00 incluye en el despacho `g2a` las rutas exactas que necesitan tratar el valor nullable para mantener `typecheck` verde. El camino legacy debe denegar identidades sin rol, nunca rellenarlo ni autorizar por fallback; los flujos empresariales nuevos se activan solo con actor/membresías migrados.
- `users.is_active` representa bloqueo global de identidad. Un administrador empresarial suspende `memberships`, no esa identidad.
- Cargo y atributos profesionales específicos de empresa pertenecen a la membresía o a `broker_profiles`.
- No se copian automáticamente datos personales de una empresa a otra.

Las membresías se conservan al suspenderse para mantener atribución histórica. Una FK demuestra pertenencia registrada; la elegibilidad actual se verifica por estado y vigencia.

### Catálogos globales frente a empresariales

Los códigos cerrados de recursos, acciones, alcances y tipos del dominio continúan teniendo fuente única tipada en `src/domain/catalogs.ts:19`, `:29`, `:36`, `:61`. Son vocabulario de plataforma, no facultades concedidas.

Los catálogos editables actuales se aíslan por tenant. Compartir nombres no justifica compartir filas.

**Diferencia importante de nombres:** `permissions` actual contiene concesiones de un rol, mientras `permissions` lógico representa un catálogo global y `role_permissions` sus concesiones: `src/infrastructure/db/schema.ts:233`; `.viltrum/vre-os/fuentes/backlog-Datos.csv:9`, `:10`.

G12 conserva la tabla actual como concesión **empresarial**. No la convierte en global por coincidencia de nombre. Una normalización posterior debe migrar consumidores y mantener una fuente única; no introduce dos matrices efectivas.

### Inventario completo de las 42 tablas actuales

Convenciones:

- **T:** `tenant_id uuid NOT NULL REFERENCES tenants(id)`.
- En tablas T se preserva la PK actual y se incorpora una clave candidata no parcial con **las columnas realmente referenciadas**: normalmente `(tenant_id,id)`; `broker_profiles` usa `(tenant_id,user_id)`, `outbox` usa `(tenant_id,event_id)` y `units` ofrece además `(tenant_id,project_id,id)`.
- Las relaciones a personas empresariales se validan contra membresías del mismo tenant.
- Los UUID públicos permanecen únicos globalmente, además de resolverse bajo tenant y permiso.
- Los predicados parciales actuales se conservan salvo cambio aprobado.
- **G:** identidad/control global; acceso restringido.

| # | Tabla y evidencia | Clase | Unicidad o tratamiento objetivo |
|---|---|---|---|
| 1 | `roles` — `schema.ts:146` | T | UNIQUE `(tenant_id,slug)`; rol empresarial protegido no equivale a operador de plataforma |
| 2 | `users` — `schema.ts:160` | G | Conserva identidad/email y vínculo Auth; `role_id` nullable desde `g2a`, NULL en altas nuevas; sin directorio global empresarial |
| 3 | `broker_profiles` — `schema.ts:213` | T | PK/UNIQUE `(tenant_id,user_id)`; FK a membresía y agencia del tenant |
| 4 | `permissions` — `schema.ts:233` | T | UNIQUE `(tenant_id,role_id,resource,action)` |
| 5 | `sessions` — `schema.ts:259` | G | Tabla legacy sin uso según comentario; conserva unicidad de token hash; sin reactivarla como motor Auth |
| 6 | `pipeline_stages` — `schema.ts:287` | T | UNIQUE `(tenant_id,slug)` |
| 7 | `loss_reasons` — `schema.ts:307` | T | UNIQUE `(tenant_id,slug)` |
| 8 | `lead_sources` — `schema.ts:324` | T | UNIQUE `(tenant_id,slug)` |
| 9 | `zones` — `schema.ts:342` | T | UNIQUE `(tenant_id,slug)`; UUID público conservado |
| 10 | `agencies` — `schema.ts:353` | T | UNIQUE `(tenant_id,slug)`; no representa tenant |
| 11 | `payment_methods` — `schema.ts:362` | T | UNIQUE `(tenant_id,slug)` |
| 12 | `unit_inventory_states` — `schema.ts:373` | T | UNIQUE `(tenant_id,slug)`; CHECK de estado preservado |
| 13 | `marketing_campaigns` — `schema.ts:388` | T | UNIQUE `(tenant_id,slug)`; fuente del mismo tenant |
| 14 | `campaign_spend` — `schema.ts:407` | T | UNIQUE `(tenant_id,campaign_id,month)` |
| 15 | `projects` — `schema.ts:424` | T | UNIQUE `(tenant_id,slug)` donde `deleted_at IS NULL` |
| 16 | `units` — `schema.ts:475` | T | UNIQUE `(tenant_id,project_id,code)` donde `deleted_at IS NULL`; claves candidatas **no parciales** `(tenant_id,id)` y **`UNIQUE (tenant_id,project_id,id)`** antes de las FK de propiedades/ventas |
| 17 | `construction_phases` — `schema.ts:526` | T | UNIQUE `(tenant_id,project_id,position)` |
| 18 | `contacts` — `schema.ts:569` | T | Índices de teléfono/email con tenant; sin unicidad global de contacto |
| 19 | `leads` — `schema.ts:605` | T | UNIQUE `(tenant_id,external_id)` donde `deleted_at IS NULL`; preservar recibo/idempotencia actual |
| 20 | `deals` — `schema.ts:672` | T | Contacto, lead, etapa, fuente y motivo de la misma empresa |
| 21 | `deal_properties` — `schema.ts:722` | T | Unicidades tenant+negocio+unidad; tenant+negocio+proyecto sin unidad; principal activo por tenant+negocio |
| 22 | `unit_sales` — `schema.ts:758` | T | UNIQUE tenant+unidad, tenant+negocio, tenant+proyecto+código normalizado; exclusividad durable |
| 23 | `deal_stage_history` — `schema.ts:775` | T | Negocio, etapas y autor coherentes con tenant |
| 24 | `activities` — `schema.ts:801` | T | Contacto, lead, negocio, proyecto y asignado de la misma empresa |
| 25 | `activity_sync` — `schema.ts:843` | T | UNIQUE `(tenant_id,provider,external_event_id)`; binding de conexión obligatorio al activar sincronización |
| 26 | `goals` — `schema.ts:874` | T | UNIQUE tenant+broker+año+mes; índice parcial tenant+año+mes para `broker_id IS NULL` |
| 27 | `commissions` — `schema.ts:909` | T | UNIQUE `(tenant_id,deal_id)`; beneficiario y aprobador de la empresa |
| 28 | `academy_items` — `schema.ts:959` | T | Formación propia de empresa; no se presume catálogo compartido |
| 29 | `academy_checklist_items` — `schema.ts:973` | T | UNIQUE `(tenant_id,academy_item_id,position)` |
| 30 | `academy_progress` — `schema.ts:992` | T | UNIQUE `(tenant_id,user_id,academy_item_id)` |
| 31 | `academy_checklist_progress` — `schema.ts:1015` | T | UNIQUE `(tenant_id,user_id,checklist_item_id)` |
| 32 | `academy_review_requests` — `schema.ts:1050` | T | Broker y decisor del tenant; CHECK contra autoaprobación preservado |
| 33 | `academy_certificates` — `schema.ts:1106` | T | UNIQUE tenant+solicitud; código de verificación y UUID públicos conservan unicidad global |
| 34 | `message_templates` — `schema.ts:1163` | T | Plantillas, variables y contenido propios de empresa |
| 35 | `files` — `schema.ts:1177` | T | Índice `(tenant_id,entity_type,entity_id)`; integridad de referencia y acceso al objeto |
| 36 | `notifications` — `schema.ts:1199` | T | Destinatario del tenant; índices tenant+usuario+lectura |
| 37 | `integration_accounts` — `schema.ts:1224` | T | UNIQUE tenant+proveedor+usuario; parcial tenant+proveedor sin usuario; extensión por conexión al admitir varias |
| 38 | `audit_log` — `schema.ts:1251` | T | Historia empresarial append-only; índices tenant+objeto/usuario/fecha |
| 39 | `outbox` — `schema.ts:1274` | T | UNIQUE `(tenant_id,idempotency_key)`; **`UNIQUE (tenant_id,event_id)` no parcial**, antes de FK de `outbox_dead`; PK `event_id` UUID global conservada, sin columna `id` ficticia |
| 40 | `outbox_dead` — `schema.ts:1300` | T | FK compuesta `(tenant_id,event_id)` al outbox |
| 41 | `external_refs` — `schema.ts:1309` | T | UNIQUE `(tenant_id,entity_type,local_id,system)` y `(tenant_id,system,external_id)`; conexión inicial identificada por `(tenant_id,system)` |
| 42 | `webhook_inbox` — `schema.ts:1324` | T | UNIQUE `(tenant_id,system,account_id,event_id)`; se conserva `account_id` y se valida su binding antes de asignar empresa |

**Resultado:** 40 tablas empresariales y 2 globales de identidad/legado. No existe en este inventario un catálogo empresarial editable que deba quedar global.

Las PK internas globalmente únicas y los UUID públicos globales son excepciones deliberadas a la unicidad empresarial: identifican registros, no amplían su acceso.

**Mapeo físico de conexión inicial:** `system` conserva su nombre y significado de sistema/proveedor en `external_refs` (`schema.ts:1313`) y `webhook_inbox` (`schema.ts:1326`); `account_id` ya existe en este último (`schema.ts:1327`). `g2d` no introduce ni renombra una columna `connection`/`connection_id`. La correspondencia `(tenant_id,system)` → una conexión empresarial es un límite de la fase inicial, no una afirmación de que el proveedor equivalga universalmente a una cuenta. `g6b` bloquea cualquier configuración que necesite distinguir varias conexiones del mismo sistema dentro de una empresa hasta una ampliación de contrato/clave revisada; nunca elige la primera. En inbox no se elimina la distinción actual de cuenta, y el binding de entrada verifica tenant+sistema+cuenta. Así el mismo evento puede existir en A y B o en cuentas distintas sin colisión ni confirmación cruzada.

### Integridad entre empresas

Reglas obligatorias:

1. `tenant_id` empresarial no admite NULL al finalizar la migración.
2. El tenant de una fila es inmutable para las operaciones ordinarias.
3. Toda FK entre tablas empresariales incluye el tenant.
4. Cada padre referenciado ofrece una clave candidata compuesta no parcial.
5. Las FK empresariales se indexan según acceso; los índices existentes de responsable, estado, fecha y objeto incorporan el tenant como prefijo cuando corresponda.
6. No se sustituye una FK por una comprobación de aplicación solamente.

Ejemplos:

- `units(tenant_id,project_id)` → `projects(tenant_id,id)`.
- `leads(tenant_id,contact_id)` → `contacts(tenant_id,id)`.
- `deals(tenant_id,stage_id)` → `pipeline_stages(tenant_id,id)`.
- `deal_properties(tenant_id,deal_id)` → `deals(tenant_id,id)`.
- `deal_properties(tenant_id,project_id,unit_id)` → `units(tenant_id,project_id,id)`, con `UNIQUE (tenant_id,project_id,id)` no parcial creada en `g2b` **antes** de esa FK en `g2c`. Con `unit_id NULL` se conserva la FK independiente de proyecto y la modalidad sin unidad; con unidad presente se exige también coincidencia de proyecto.
- `unit_sales` valida unidad, proyecto y negocio del tenant; el proyecto debe corresponder a esa unidad.
- `memberships(tenant_id,role_id)` → `roles(tenant_id,id)`.
- `outbox_dead(tenant_id,event_id)` → `outbox(tenant_id,event_id)`, cuya clave candidata no parcial se crea antes de la FK en `g2d`.
- Las columnas de responsable, beneficiario y autor empresarial apuntan a pertenencia del mismo tenant, conservada aunque esté suspendida.

Dos entidades del mismo tenant también pueden relacionarse incorrectamente. La protección incluye proyecto/unidad y coherencia entre contacto, lead y negocio cuando la regla de módulo lo requiera.

`leads.converted_deal_id` y `deals.next_activity_id` evitan FK por la decisión #8: `docs/contexto/decisiones.md:37`. G12 exige controles de base equivalentes que verifiquen tenant y referencia, cubran cambios en ambos extremos y se prueben al commit. Su diseño exacto debe revisarse por D11; no basta conservar el entero sin protección.

Para `files`, `notifications`, `audit_log`, `external_refs` y referencias de eventos:

- Referencias operativas: validación por tipo y tenant respaldada por constraints o triggers.
- Referencias históricas de auditoría: preservación de la identidad del objeto; no exigir existencia actual si contradice retención.
- No se permite resolución global por `entity_id`.

Un `CHECK` ordinario no garantiza relaciones entre tablas; PostgreSQL recomienda expresar esas restricciones mediante FK u otros mecanismos adecuados. [Documentación de restricciones](https://www.postgresql.org/docs/current/ddl-constraints.html).

### Actor, filtros y RLS

Actor empresarial objetivo:

- Identidad.
- Tenant.
- Membresía.
- Rol efectivo de esa membresía.
- Permisos efectivos.
- Versión del contexto de sesión.
- Versión de autorización necesaria para invalidación.

`requireActor` empresarial no devuelve un actor sin tenant. Las operaciones de identidad usan su contrato separado.

**Tipos antes de implementaciones (`g3a`):** `src/domain/rbac.ts` declara el contrato `ActorEmpresarial` con tenant, membresía y versiones obligatorios, sin imports de infraestructura. `g3b` lo consume al resolver el actor; `g3c` lo exige al filtrar. Para compilar durante la adopción por módulos, `Actor` legacy puede coexistir bajo una frontera explícita hasta `g9`, sin convertir los campos empresariales en opcionales ni aceptar el tipo legacy en repositorios empresariales. Cambiar de nombre o retirar el tipo legacy requiere inventario y despacho de sus llamadores. El dominio no importa el resolver de `actor.ts`.

El filtro siempre equivale a:

**tenant del registro = tenant autorizado**, más permiso, alcance, papelera y demás reglas.

`all` elimina únicamente la restricción por responsable. `reaches` debe exigir también tenant del registro; no conserva una firma que permita omitirlo. Los joins y subconsultas aplican la misma frontera antes de contar, ordenar o limitar.

RLS objetivo por rol de ejecución:

| Operación | Condición |
|---|---|
| SELECT | Contexto válido, tenant coincidente y acceso admitido |
| INSERT | `WITH CHECK` del tenant y pertenencia; autor controlado |
| UPDATE | `USING` sobre fila existente y `WITH CHECK` sobre resultado; tenant inmutable |
| DELETE | Denegado para hechos históricos; restringido a operaciones expresamente autorizadas |

La política de tenant debe ser una condición obligatoria; otra política permisiva no puede ampliar el acceso a distintas empresas.

El servidor y los workers utilizan roles de ejecución sin propiedad de tablas, superusuario ni `BYPASSRLS`. La identidad de migración queda separada. `FORCE ROW LEVEL SECURITY` no neutraliza superusuarios o `BYPASSRLS`. [RLS de PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

Contexto SQL:

- Se instala de forma local a la transacción y sobre la misma conexión que ejecuta las consultas.
- No se mantiene mediante `SET` persistente en un pool.
- Contexto ausente, inválido o revocado deniega.
- El navegador no puede establecerlo directamente.
- La frontera SQL no interpreta un valor de contexto como prueba criptográfica de identidad: lo establece el adaptador después de verificar sesión y pertenencia.
- Los helpers de autorización evitan recursión de políticas.
- Cualquier función privilegiada excepcional es mínima, privada, con permisos y búsqueda de esquemas restringidos; necesita revisión D12.

**Ejecutor obligatorio en `g3d`:** `src/infrastructure/db/client.ts` expone el contrato propuesto `withTenantContext<T>(actor: ActorEmpresarial, fn: (tx: Tx) => Promise<T>): Promise<T>`, con `Tx` propio de la infraestructura. Abre una transacción, revalida el contexto/autorización mediante la capacidad acotada correspondiente y ejecuta `SELECT set_config('app.current_tenant_id', $1, true)` con el UUID validado como parámetro. Instala del mismo modo los atributos verificados que necesiten las políticas y entrega **esa misma conexión `tx`** al callback. La comprobación de precondiciones HTTP y el bloqueo de contexto de §4 forman parte de esta unidad de trabajo cuando la operación proviene de una sesión.

En una mutación HTTP, el actor que llega al ejecutor conserva la versión que ya coincidió con las cabeceras; el ejecutor vuelve a compararla bajo bloqueo con el contexto de **esa misma sesión verificada**. No la refresca silenciosamente para salvar el conflicto. La referencia de sesión se entrega desde el puerto de identidad/contexto, sin exponer tokens al dominio; la caché de actor no cruza peticiones o sesiones. Workers usan su capacidad técnica persistida, sin inventar una sesión interactiva.

Es obligatorio para **lecturas y escrituras**, incluidos listados simples, búsqueda, notificaciones, jobs, auditoría y outbox. Los adaptadores reciben `tx`; no abren otra conexión ni usan `getDb()` por dentro. `getDb()` queda para construir el ejecutor, bootstrap de identidad acotado y tareas técnicas explícitamente autorizadas; una guarda distingue esas excepciones de consultas empresariales. Si una unidad de trabajo ya existe, se propaga su `tx` y contexto verificado, sin anidar una transacción independiente. Las políticas y restricciones no se activan sobre consumidores sin adaptar: `g3d` prueba el ejecutor en aislamiento y P6/corte esperan el inventario de adopción completo.

Commit o rollback terminan el contexto local; la siguiente transacción debe instalar el suyo. Ausencia, cadena vacía, valor inválido o contexto revocado deniegan sin devolver datos; la política trata explícitamente ausencia/valor vacío y no transforma un error de contexto en acceso global. Se conservan filtros empresariales aun con RLS. [PostgreSQL: alcance transaccional de `set_config`](https://www.postgresql.org/docs/current/functions-admin.html#FUNCTIONS-ADMIN-SET).

`prepare: false` y el comentario de `src/infrastructure/db/client.ts:23` muestran compatibilidad prevista con pooling de transacciones; no prueban el pool ni el rol realmente desplegados. PgBouncer/Supavisor y modo efectivos son **NO VERIFICADO**. El contrato es seguro tanto con conexión directa como con pooling transaccional porque no depende de estado de sesión. [Supabase: conexiones y pooling](https://supabase.com/docs/guides/database/connecting-to-postgres).

La consulta inicial de identidad y membresías usa una capacidad mínima de bootstrap, limitada a la identidad verificada. No concede acceso general a datos empresariales para resolver el actor.

Las tablas empresariales permanecen sin acceso directo del navegador. Grants mínimos, políticas y vistas se revisan por separado; una vista expuesta usa `security_invoker` cuando corresponda. [Guía RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

Rol SQL real, grants, políticas y exposición efectiva actuales: **NO VERIFICADO**.

### Caché, archivos y exportaciones

- Caché privada: preferentemente deshabilitada en respuestas sensibles. Si existe, su clave incluye tenant, identidad/membresía, versión de autorización, filtros y proyección.
- Tags de invalidación, cursores y claves de consulta incluyen empresa. Un cursor de A no se reutiliza en B.
- Cambio de empresa limpia consultas, selecciones, borradores no persistidos, almacenamiento empresarial y suscripciones.
- Volver atrás, restaurar pestañas o recibir respuestas tardías no repinta datos anteriores; se comprueba contexto antes del render.
- Caché pública del portal incluye binding verificado de host y tenant.
- Objetos nuevos usan namespace empresarial y nombre generado en servidor.
- Objetos legacy mantienen su ubicación; el acceso se resuelve mediante `files` autorizado. No se trasladan o renombran sin manifiesto.
- Exportación persiste tenant, solicitante, filtros, campos, propósito y versión; se autoriza al generar y al descargar.
- Una URL autenticada de exportación no se convierte en acceso permanente.
- Una URL firmada directa puede seguir siendo utilizable hasta caducar. Para revocación inmediata se necesita descarga mediada o mecanismo acreditado de revocación; no se promete esa garantía con una firma solamente.
- Notificaciones, sockets, búsquedas, IA y trabajos incluyen la misma frontera empresarial.

## Migración

### Principios

La primera empresa es **Quisqueya Home**, conforme a #49. Su UUID se genera una sola vez y se conserva en el historial de migración. No se incrusta como respaldo en código.

No se editan migraciones 0000–0006. La numeración nueva se asigna tras comprobar el journal vigente y coordinar el escritor exclusivo.

No se cambian IDs, importes, estados, fechas, códigos normalizados, hashes de constancias ni decisiones históricas.

### Pasos y reversibilidad

| Paso | Acción | Condición de salida | Reversión |
|---|---|---|---|
| P0 · Preflight | Inventariar tablas físicas, restricciones, huérfanos, duplicados, roles SQL, conteos y huellas | Manifiesto completo; anomalías clasificadas | Sin cambios de datos |
| P1 · Recuperación | Ensayar respaldo y restauración aislada de base/objetos | Restauración comprobada y reconciliada | No continuar sin evidencia |
| P2 · Expansión | Crear tenant, membresías y contexto; hacer `users.role_id` nullable en `g2a`; añadir columnas inicialmente compatibles | Quisqueya Home identificada; legado conservado y alta sin rol global posible, sin conceder acceso nuevo | Desactivar código nuevo; conservar expansión; no reponer NOT NULL si ya hay identidades nuevas con NULL |
| P3 · Backfill | Asociar datos empresariales existentes a Quisqueya Home | Cero filas empresariales sin tenant; correspondencia padre/hijo | Repetición idempotente o rollback transaccional por lote |
| P4 · Integridad | Crear claves compuestas, validar FK, reescribir índices y establecer NOT NULL | Cero cruces y restricciones validadas | Conservar índices antiguos hasta validar sustitutos |
| P5 · Aplicación | Integrar actor, consultas, escritores y trabajos con contexto | Inventario sin caminos activos inseguros | Mantener multiempresa desactivada |
| P6 · Seguridad | Activar rol limitado, contexto transaccional y políticas | Pruebas con roles efectivos y pool en verde | Detener acceso si falla; no habilitar bypass |
| P7 · Corte | Selección empresarial y permisos nuevos; segunda empresa solo tras aceptación | G12 completo y revisión independiente | Antes de datos nuevos, desactivar corte |
| P8 · Contracción | Retirar contratos y autoridad legacy | Sin consumidores antiguos y compatibilidad resuelta | Migración separada; no borrar historia |

Las restricciones antiguas se retiran únicamente después de construir y validar las sustitutas. Los `ON CONFLICT`, sus targets y predicados cambian coordinadamente con los índices.

Tras admitir datos de varias empresas, volver a un binario sin filtros empresariales es inseguro. La recuperación pasa por corrección hacia delante o restauración controlada con reconciliación; nunca por borrar tenants o perder escrituras válidas.

### Backfill de identidades y autoría

- Se conserva cada `users.id`.
- Se crea una membresía de Quisqueya Home por identidad actual, con rol y estado derivados de sus datos existentes.
- Usuarios inactivos o eliminados conservan pertenencia histórica sin acceso activo.
- Una identidad sin vínculo Auth no obtiene autenticación por tener membresía.
- Las referencias históricas conservan al autor original; no se inventa un administrador para rellenarlas.
- Referencias inválidas detienen la validación y generan un expediente; no se corrigen por aproximación.

`broker_profiles` cambia su clave a empresa+usuario sin duplicar inicialmente perfiles. Los datos originales siguen siendo reconstruibles para comprobar conservación.

### Conteos y huellas

Hay dos controles distintos:

1. **Origen intacto durante el ensayo:** conteos y huellas de todas las tablas antes/después. Se reutiliza el patrón de `scripts/test-db/run.mjs:45`, `:57`, `:190`.
2. **Destino migrado sin pérdida:** conteos y huellas de las columnas originales, excluyendo solamente columnas nuevas y usando una proyección explícita para cualquier descomposición.

Añadir `tenant_id` modifica una huella de fila completa. No se exige igualdad de JSON que incluya la columna nueva: se compara la proyección original.

`g1` adapta explícitamente `scripts/test-db/run.mjs`, no solo sus nuevos ensayos: registra antes de migrar el manifiesto ordenado de columnas originales y sus tipos por tabla, y permite calcular la huella sobre esa misma proyección en origen/destino, con serialización y orden estables y sin extraer filas. Conserva además la huella de fila completa para probar que el origen no cambió. El manifiesto es cerrado: una columna original ausente o un valor alterado debe fallar; no se calcula la intersección de columnas después de migrar ni se excluyen columnas originales para obtener verde. Las descomposiciones tienen una reconstrucción explícita revisada; columnas nuevas e identidades nuevas se verifican por separado del conjunto histórico. Una prueba altera un valor histórico sintético y exige desigualdad, mientras añadir únicamente tenant mantiene la igualdad de la proyección.

Por cada tabla:

- Cantidad original idéntica.
- Valores originales idénticos mediante huella calculada en servidor.
- Relaciones originales preservadas.
- Tenant nuevo correcto.
- Sin duplicación empresarial.
- Secuencias e identidades preparadas para nuevas escrituras.

Los resultados exportados contienen únicamente tabla, conteos, booleanos y resultado de comparación. No se imprimen filas, credenciales ni configuración sensible.

El ensayo poblado actual anonimiza una selección de columnas y cubre 23 tablas: `scripts/test-db/migracion-poblada.mjs:11`, `:39`, `:59`. Su ampliación debe tratar explícitamente JSON, eventos, evidencia firmada y campos sensibles. Anonimizar un documento puede invalidar su hash; esos cambios no se confunden con pérdida durante la migración. La conservación byte a byte de material sensible se verifica dentro de la base protegida, sin extraerlo a artefactos.

Los 184 negocios y 15 legados son expectativas codificadas del ensayo actual, no conteos actuales comprobados: `scripts/test-db/migracion-poblada.mjs:62`, `:67`. No se eliminan esas guardas para obtener verde; cualquier variación exige explicación y evidencia independiente.

### Compatibilidad temprana de limpieza (`g1`)

Antes de cualquier FK nueva de `g2a`–`g2d`, `g1` adapta `scripts/seed/limpiar.ts`. Su consulta actual solo lee `conkey[1]`/`confkey[1]` y aborta si la FK no es simple (`scripts/seed/limpiar.ts:25`, `:40`); cambiar únicamente el número aceptado sería inseguro.

Debe inspeccionar **todos los pares de columnas por posición** de cada FK, verificar su clave destino real y construir el join con cada par. Admite las FK simples previas, las empresariales de dos columnas `(tenant_id, clave referenciada)` —incluidos `id`, `user_id` o `event_id` según tabla— y las de tres `(tenant_id,project_id,unit_id)` → `(tenant_id,project_id,id)` sobre `units`, cuando consten en el manifiesto autorizado. Forma desconocida o mapeo incompleto abortan **antes de borrar**, sin rebajar la protección de referencias ajenas ni cascadas.

Con esquema empresarial, la elegibilidad de origen/destino, el borrado y las huellas excluidas exigen tenant explícito además de identidad/rango del seed; un rango global no autoriza borrar B. Se preservan comprobación de destino local, bloqueo, transacción, orden seguro y rollback completo ante referencias fuera del conjunto de semilla. No se borran identidades globales compartidas: cualquier referencia/membresía ajena al conjunto impide su limpieza. El contrato admite el esquema previo sin inventar columnas ausentes y el expandido mediante inspección del catálogo; `g1` prueba ambos, dos/tres columnas, referencia externa al seed, cascada y forma no admitida. `g7` queda para generar/adoptar semillas empresariales, no para retrasar esta compatibilidad.

### Encaje con M40

G12 precede a `b1c` mediante una **puerta técnica de backend**, separada del corte multiempresa. La decisión #49 exige especificar antes de esa DDL; no exige esperar las pantallas de G12 (`docs/contexto/decisiones.md:328`). Propuesta: tras G12 revisada/aceptada, `g1`, `g2a`–`g2d` (esquema/backfill/integridad), `g3a`/`g3b` (contratos/actor), `g3c` (filtros) y `g3d` (ejecutor contextual) verificados, el tramo `q-db` independiente acredita migraciones vacía/poblada, conservación, FK A/B, runtime sin bypass y lecturas/escrituras/pool contextual. D11/D12 revisan esas evidencias y Wilber acepta las decisiones irreversibles necesarias; D00 reconcilia las compuertas y condiciones propias de M40 y despacha `m40-pre`/`b1c`. No basta la declaración de este documento ni el verde de `spec:check`.

`b1c` no depende de `g8b`/`g8c`, de las integraciones visuales ni del recorrido UI final de G12. Esa habilitación es para construir DDL en el entorno aislado autorizado, **no** para abrir una segunda empresa ni desplegar políticas/caminos incompletos sobre el runtime activo. El corte P7 sigue esperando consumidores, integraciones, semillas, UI, verificación integral y aceptación humana. Ninguna condición financiera, PoC o conservación propia de M40 se cierra por este desacoplamiento.

Todas las tablas propuestas en M40 §5.2 incorporan tenant, incluidas `transaction_commands`, holds, reservas, planes, pagos, aplicaciones, conciliación, comisiones, cuentas de beneficiarios, liquidaciones y aprobaciones: `.viltrum/vre-os/spec/modulos/M40-transaccion.md:275`.

Cambios obligatorios:

- `inventory_commitments`: UNIQUE parcial `(tenant_id,unit_id)` y `(tenant_id,project_id,unit_code_normalized)` para estado activo.
- Sin reloj ni `deleted_at` que libere exclusividad en esos predicados.
- Propietario tipado del compromiso y unidad relacionados mediante FK que incluyan tenant.
- Comandos: identidad de idempotencia empresarial, actor, operación, clave y hash; sin replay entre empresas.
- Bloqueos de cupo: identidad inequívoca de membresía empresarial; no utilizar solo el ID global de usuario.
- Mantener el orden de locks de M40.
- Libro: cuentas, movimientos, origen e idempotencia incorporan empresa. La PoC debe demostrarlo.
- Backfill de compromisos únicamente desde `unit_sales` reales de Quisqueya Home.
- Ventas ganadas sin unidad siguen sin reserva, compromiso o deuda inventados.
- La migración 0005 y su identidad durable permanecen intactas.

El requisito de conservación y adopción legacy de M40 sigue vigente: `.viltrum/vre-os/spec/modulos/M40-transaccion.md:426`.

La secuencia posterior continúa siendo `b1c → b1d → b1e → b1f`, con un escritor D11: `.viltrum/vre-os/spec/modulos/M40-transaccion.md:928`. G12 no elimina la condición de PoC del libro ni las decisiones financieras pendientes.

## Pruebas

### Dataset mínimo

Dos empresas sintéticas A/B con:

- Contactos de teléfono, correo y nombres semejantes.
- Proyectos con el mismo slug y unidades con igual código.
- Capturas con igual identificador externo.
- Roles con igual slug y permisos diferentes.
- Una identidad administradora en A y broker en B.
- Identidades exclusivas de cada empresa.
- Membresías suspendidas, vencidas y revocadas.
- Eventos, archivos, notificaciones y conexiones de ambas empresas.
- Registros históricos y eliminados lógicamente.

Se prueban también contexto ausente, tenant inexistente y sesión inválida.

### Matriz de aislamiento

Cada caso se ejecuta A→B y B→A.

| Superficie | Ataque o variación | Resultado esperado |
|---|---|---|
| Listado | Quitar filtros de UI, paginar, ordenar y agregar | Solo filas y conteos autorizados del tenant |
| Detalle | Adivinar UUID, ID legacy o slug ajeno | Recurso no visible, sin fragmentos |
| Alta | Enviar tenant o responsable de otra empresa | Rechazo; sin efecto parcial |
| Edición | Sustituir tenant, padre o beneficiario | Rechazo en servidor y BD |
| Relaciones | Negocio A con unidad B; unidad con proyecto incorrecto | FK/control rechaza |
| Búsqueda | Consultar teléfono, nombre o código presente en B | Sin sugerencias, conteos o snippets de B |
| Reportes | Solicitar globales con alcance `all` | Agregados de la empresa activa |
| Notificaciones | Misma identidad miembro de A/B | Campana y marcado separados |
| Archivos | ID/ruta ajena, firma antigua y revocación | Sin firma o descarga no autorizada |
| Exportación | Filtro manipulado, trabajo ajeno o permiso revocado | Generación/descarga denegada |
| Eventos | Replay, conexión sustituida y confirmación ajena | Sin efecto ni actualización cruzada |
| Inbox | Mismo evento en conexiones diferentes | Dedupe correcto por conexión y tenant |
| Moodle/Twenty | Coincidencia de correo o ID externo | Ninguna asociación implícita |
| Sesión | Cambiar empresa y volver atrás | Sin render del contexto anterior |
| Dos pestañas | Enviar formulario de A tras cambio a B | Conflicto explícito; cero escritura reinterpretada |
| HTTP | Omitir/alterar cabeceras; A→B→A; cambiar contexto simultáneamente al envío | `400`/`409` según §4, o ejecución serializada en el contexto vigente; cero reinterpretación |
| Pool | Reutilizar conexión A→B→sin contexto | Sin contaminación; ausencia deniega |
| Lectura contextual | Listado con `withTenantContext` frente a lectura sin contexto, tras commit/rollback | Solo filas del tenant con rol runtime; la lectura sin contexto no obtiene filas |
| Identidad global | Administrador A edita o borra usuario compartido mediante ruta legacy | Denegación; identidad y membresía de B intactas; suspensión solo en A por membresía |
| Evaluación | Slugs iguales, cookie tenant ausente/inválida, selector B y cookies en producción | QH explícita solo si falta selector, B elegible si se elige, restantes casos denegados |
| Revocación | JWT vigente con membresía o permiso revocado | Nueva operación denegada |
| Invitación | Caducidad, uso doble y destinatario distinto | Cero membresías indebidas |
| Semillas | Sembrar/limpiar A con B poblada | Huellas y conteos de B idénticos |
| M40 | Carreras de holds, cierres y pagos en A/B | Exclusividad e idempotencia dentro de cada empresa |

Fuentes de aceptación: `.viltrum/vre-os/fuentes/backlog-QA.csv:5`, `:6`, `:8`, `:9`, `:40`.

### Pruebas de mutación

La redundancia de defensas exige oráculos separados: si RLS sigue ocultando filas, quitar un filtro de servidor puede no producir una fuga observable en E2E.

| Mutación deliberada | Prueba que debe fallar |
|---|---|
| Quitar tenant de `visibleRows` | Contrato del adaptador en entorno sintético que haga observables ambas empresas, más guarda estructural |
| Hacer `reaches("all")` independiente del tenant | Unitaria con recurso de B y actor A |
| Quitar tenant de consulta SQL directa | Prueba del adaptador/guarda específica de esa consulta |
| Omitir `WITH CHECK` o permitir traslado de tenant | Prueba SQL de UPDATE con rol runtime |
| Quitar tenant de FK | Inserción directa adversarial entre empresas |
| Eliminar política de aislamiento | Prueba SQL directa sin filtros del servidor |
| Cambiar contexto transaccional por persistente | Reutilización y concurrencia del pool |
| Quitar tenant de clave de caché | Dos respuestas distintas para consultas iguales de A/B |
| Quitar conexión/tenant de dedupe | Replay sintético con mismo ID externo en A/B |
| Quitar tenant del marcado de notificaciones | Identidad multimiembro; B debe permanecer intacta |
| Restaurar fallback de conexión | Empresa B sin configurar debe resultar no disponible |
| Omitir comparación de cabeceras/versiones | Formulario A obsoleto y ciclo A→B→A deben fallar por contexto, sin escritura |
| Reponer baja global de usuario en gestión empresarial | API adversarial observa cambio indebido de identidad/B y falla por esa garantía |
| Omitir una columna del join de FK en limpieza | Referencia ajena o de otra empresa no puede ser borrada; control de conservación falla |

El entorno que vuelve observable la falta de filtro es exclusivo de pruebas; no debilita roles ni políticas de ejecución.

D14/revisor independiente aplica la mutación, registra el fallo esperado, restaura el cambio y observa nuevamente la suite normal en verde. Cada fallo debe identificar la garantía rota, no limitarse a un error genérico.

### Conservación y verificación de entrega

Pruebas futuras:

- Migrador oficial desde base vacía.
- Migración sobre copia poblada aislada.
- Control sintético con cruces y colisiones intencionadas.
- Reejecución idempotente.
- Fallo intermedio y recuperación.
- Comprobación de índices parciales, FK, NOT NULL y políticas.
- Conservación de las 42 tablas y de `unit_sales`.
- Compatibilidad con datos previos y rechazo de clientes obsoletos.
- Recorrido UI independiente.

Comandos de cierre por el entorno autorizado: `typecheck`, `lint`, `npm test`, `test:db`, guardas y `spec:check`; build fuera de la carpeta prohibida y por el responsable habilitado.

En esta corrección documental se ejecuta `spec:check`; su salida real se registra en `reviews/G12-respuesta-R1.md`. No se ejecutaron verificaciones funcionales, de BD, UI o migración; ninguna se declara en verde.

## Rebanadas

**Plan secuencial; no es un despacho de código.** Cada tarea requiere G12 `READY`, archivos exactos, CA, coordinación vigente y duración máxima de 45 minutos. Si una fila excede ese límite, se divide sin ampliar permisos.

D00 asignará a cada rebanada de datos su SQL, snapshot y entrada de journal exactos. “Migración asignada” no concede acceso general a `drizzle/`.

| Rebanada | Entrega | Archivos permitidos propuestos | Dependencia / prueba |
|---|---|---|---|
| g0 | Reconciliación de decisiones y ADR | G12; cambios documentales exactos de M40, índice y decisión que despache D00 | Revisión D12 y humana |
| g1 | Inventario, conservación y compatibilidad previa a FK | Nuevos archivos exactos de inventario/pruebas bajo `scripts/test-db/`; **`scripts/test-db/run.mjs`** (proyección explícita de columnas originales); **`scripts/seed/limpiar.ts`** (FK simples/compuestas y tenant); pruebas exactas | Antes de `g2a`; 42 tablas, inventario nullable `roleId`, huella sensible a alteración, limpieza pre/post esquema con dos/tres columnas, B intacta y abortos seguros |
| g2a | Raíz, roles, membresías e identidad nullable | `schema.ts`, nuevas entidades, bloques `roles`/`permissions` **y `users.roleId`**; migración asignada con DROP NOT NULL; consumidores nullable exactos identificados por `g1`, sin autoridad legacy nueva | Después de `g1`; legado intacto, alta B con rol global NULL, FK de membresía y typecheck verde |
| g2b | Catálogos e inventario | `schema.ts`, bloques de catálogos, campañas, proyectos, unidades y fases; migración asignada con **UNIQUE no parcial `(tenant_id,project_id,id)` en `units`** | Después de `g2a`; claves padre listas antes de `g2c`, unicidades y conservación |
| g2c | Comercial y operación | `schema.ts`, contactos, leads, negocios, propiedades, ventas, historia, actividades, sync, metas, comisiones y perfiles; migración asignada | Después de `g2b`; FK triple de propiedades a unidad/proyecto, cruces A/B y venta durable |
| g2d | Academy y servicios | `schema.ts`, Academy, plantillas, archivos, notificaciones, integraciones, auditoría, outbox/inbox/referencias; migración asignada con **UNIQUE `(tenant_id,event_id)` en `outbox` antes de FK de `outbox_dead`** y claves físicas `system`/`account_id` | Después de `g2c`; integridad, conservación y dedupe sin renombrados implícitos |
| g3a | Contratos de identidad/contexto y actor tipado | **`src/domain/rbac.ts` (`ActorEmpresarial` obligatorio, compatible junto al legacy)**; archivos exactos en `application/identidad/` y `application/empresas/`; pruebas de tipos/dobles | Tipos antes de `g3b`/`g3c`; precondiciones tenant/versión; ningún import dominio→infraestructura |
| g3b | Actor empresarial, bootstrap y evaluación local | `src/infrastructure/auth/actor.ts`; ruta de acceso de evaluación y llamadores exactos inventariados; adaptadores/contenedor de empresas expresamente nombrados | Depende de `g3a`/`g2d`; membresía/rol por empresa; `qh_dev_tenant` validado, QH explícita por defecto y producción sin bypass |
| g3c | Filtros centrales | `src/domain/rbac.ts`, `src/infrastructure/rbac-filter.ts`; pruebas exactas de estos contratos | Depende de `g3a`/`g3b`; `all`, `own`, tenant ausente, compatibilidad compilable y mutaciones |
| g3d | Ejecutor contextual de lecturas/escrituras y rol runtime | **`src/infrastructure/db/client.ts` (`withTenantContext`)**; unidad de trabajo y pruebas/guardas exactas; migración/políticas asignadas | Depende de `g3a`–`g3c`; misma `tx`, set_config local, sin `getDb()` empresarial directo, pool y RLS en entorno aislado; activación runtime solo tras adopción completa |
| q-db | Verificación independiente de puerta backend/M40 | Pruebas/evidencias exactas despachadas a D11/D12/D14 | Tras `g1`–`g3d`: typecheck, unitarias, migración, conservación, FK A/B, rol runtime y pool; sin depender de UI |
| m40-pre | Actualización de contratos M40 | Ficha M40 y contrato de `b1c`, con revisión independiente | `q-db`, revisión D11/D12, aceptación humana y compuertas propias de M40; permite DDL aislada, no corte |
| g4-* | Adaptación de módulos | Un módulo por tarea: puerto, adaptador, contenedor, llamadores HTTP/cliente y pruebas exactos | Tras `g3d`; G12-04/05/20/24/25; ≤45 min |
| g4-usuarios | Sustituir administración global por membresías empresariales | `src/app/api/usuarios/[id]/route.ts`; API de miembros, aplicación/puertos/repos/contenedor usuarios y consumidores exactos inventariados | Tras `g3d`; denegar PATCH/DELETE global al admin tenant; rol/suspensión solo de membresía; G12-26 antes de `g8c` |
| g5a | Búsqueda y notificaciones | `src/infrastructure/db/repos/busqueda.ts`; `src/app/api/notificaciones/route.ts`; llamadores y pruebas exactos | Fragmentos, conteos y marcado |
| g5b | Auditoría y archivos | Adaptador compartido/auditoría; `src/application/compartido/almacenamiento.ts`; adaptador real de archivos tras inventariarlo | Autoría, firma y descarga |
| g5c | Exportaciones y caché | Cada generador, descarga y consumidor de caché inventariado, con ruta exacta | Revocación y aislamiento |
| g6a | Outbox/inbox | `src/application/compartido/crm.ts`; archivos exactos de outbox y sus consumidores | Empresa, conexión, replay y DLQ |
| g6b | Conexiones de proveedores | Fábricas existentes y adaptadores de Moodle/CRM/mensajería expresamente nombrados | Sin fallback; contrato A/B |
| g7 | Generación y adopción de semillas empresariales | `scripts/seed/index.ts`, `generator.ts`, `limpiar.ts`, `catalog-guards.ts`; pruebas exactas | Compatibilidad FK ya entregada en `g1`; seed/limpieza sin afectar B |
| g8a | API de selección/invitaciones | Rutas nuevas exactas de identidad/empresa, contratos y guardas aprobadas | CSRF, vigencia, cabeceras y comparación/bloqueo del contexto de §4; excepciones de identidad acotadas |
| g8b | UI-001 | Página `/organizaciones`, selector, transporte de cabeceras y archivos concretos del shell liberados por D05 | Estados, versión del formulario, dos pestañas, A→B→A, atrás y móvil |
| g8c | UI-074 | Archivos concretos de Configuración/usuarios/permisos | Depende de `g4-usuarios`; solo membresías, identidad global/B intactas, suspensión local y anti autoescalada |
| g9 | Corte y retirada de caminos legacy | Manifiesto final de consumidores restantes; compuerta de activación exacta | Cero acceso empresarial sin contexto |
| q1 | Verificación independiente integral | Archivos de pruebas/evidencia despachados a D14/D12 | Matriz, mutaciones, migración y UI |

Para `g4-*`, el inventario actual identifica adaptadores de `contactos`, `leads`, `pipeline`, `pipeline-lectura`, `proyectos`, `actividades`, `brokers`, `metas`, `comisiones`, `academy`, `comunicaciones`, `dashboard`, `reportes`, `catalogos`, `etapas`, `usuarios`, `roles`, `papelera`, `auditoria-despachos` y `compartido`. D00 despacha cada familia con sus llamadores reales; esta enumeración no autoriza una carpeta completa.

Durante transición puede coexistir un contrato legacy inaccesible a multiempresa con el contrato empresarial nuevo para conservar integración gradual y verificable. Al corte:

- No queda tenant opcional en los contratos activos.
- No hay respaldo automático a Quisqueya Home.
- No hay segunda autoridad de escritura.
- Ningún módulo mantiene el actor anterior para una consulta empresarial.
- La segunda empresa permanece desactivada hasta completar toda la cadena.

`schema.ts`, migraciones y pruebas compartidas conservan un único escritor y coordinación con `EN-CURSO.md`. El trabajo de M41 o del shell no se modifica por esta ficha sin despacho específico.

**Dos puertas, sin dependencia de UI para DDL:** G12 revisada/aceptada → `g1` → `g2a`–`g2d` → `g3a`–`g3d` → `q-db` independiente → aceptación humana/reconciliación M40 → `m40-pre`/DDL `b1c` aislada. La adopción por consumidores → integraciones → semillas → UI → `g9`/`q1` → aceptación humana sigue siendo obligatoria para el **corte multiempresa P7**, no para iniciar `b1c`. Los trabajos puros ya permitidos de M40 conservan sus condiciones existentes.

## Decisiones arquitectónicas propuestas

Cada ADR queda pendiente de aceptación humana; #49 ya fija su decisión comercial de aislamiento.

| ADR | Contexto y alternativas | Propuesta | Consecuencias y reversibilidad |
|---|---|---|---|
| ADR-G12-01 · Modelo de tenencia | Una instalación puede usar tablas compartidas, esquemas separados o bases separadas | Tablas compartidas con tenant, FK compuestas, filtros y RLS | Menor complejidad operativa inicial; mayor exigencia de aislamiento. Extracción futura por tenant exige manifiesto y reconciliación |
| ADR-G12-02 · Identidad pública | Cambiar todas las PK a UUID frente a conservar identidad interna | Mantener IDs internos existentes; UUID público para entidades expuestas; tenant UUID | Preserva relaciones y auditoría. Desviación física explícita frente al modelo lógico UUID de la maestra |
| ADR-G12-03 · Autoridad de acceso | Rol global actual frente a rol por membresía | Identidad global, rol empresarial, contexto por sesión, permisos vigentes | Impide herencia cruzada; cambia todos los consumidores de autorización. Reversión al rol global insegura tras activar otra empresa |
| ADR-G12-04 · Auditoría | Historia global indiferenciada frente a historia empresarial | `audit_log` empresarial append-only; metadatos de plataforma separados por capacidad | Atribución conservada; retención y soporte pendientes. No borrar historia para simplificar migración |
| ADR-G12-05 · Corte | Cambio destructivo frente a expansión/backfill/contracción | Expansión verificable, activación posterior y correcciones hacia delante tras datos multiempresa | Más etapas, menor riesgo de pérdida. No permite volver a binario sin aislamiento después del corte |

No se cambian motor de datos, estrategia monetaria, fechas ni reglas de negocio por este documento. La decisión #49 mantiene #12: `docs/contexto/decisiones.md:331`.

## Decisiones abiertas para Wilber

No reabren la decisión multiempresa.

| ID | Decisión pendiente | Efecto y límite mientras siga abierta |
|---|---|---|
| Q12-01 | Aceptar topología física compartida y ADR-G12-01…05 | Sin DDL irreversible hasta revisión/aceptación |
| Q12-02 | Ratificar correspondencia `organizations` lógico → `tenants` físico y estrategia de IDs | Una única entidad empresarial; sin tablas duplicadas |
| Q12-03 | Quién crea, activa, suspende y elimina contractualmente una empresa | No se habilita alta autónoma ni borrado empresarial |
| Q12-04 | Qué rol actual representa “propietario” y cómo se transfiere la última titularidad | Bloquear operaciones que puedan dejar la empresa sin administración responsable |
| Q12-05 | Atributos personales globales frente a perfil profesional por empresa | Mantener minimización; un administrador no modifica identidad global ajena |
| Q12-06 | Operación de invitaciones: emisor, duración, reenvío y reactivación | No inventar plazos ni activar por invitación mostrada |
| Q12-07 | Instancias o ámbitos admitidos para Moodle/Twenty/mensajería | Otra empresa sin binding probado permanece sin integración |
| Q12-08 | Retención, purga, exportación y restauración por clase de dato | Sin borrado físico automático ni plazo universal |
| Q12-09 | Política de enlaces públicos y ventana de validez de firmas | Documentos y exportaciones privados con revalidación |
| Q12-10 | Alcance de soporte temporal y aprobación correspondiente | Ningún acceso permanente de plataforma a cartera |
| Q12-11 | Objetivos de carga, disponibilidad y recuperación del piloto | Valores de la maestra siguen siendo objetivos propuestos |
| Q12-12 | Ventana de corte y compatibilidad de clientes/integraciones legacy | Clientes sin contexto no se reinterpretan en otro tenant |

Las preguntas se escalan por D01/D00. D03 no las cierra mediante supuestos comerciales.

## Riesgos, deuda y revisión de seguridad

| Riesgo | Escenario concreto | Tratamiento |
|---|---|---|
| P0 de salida | `all` devuelve datos de varias empresas | Tenant obligatorio en servidor y RLS; mutación específica |
| P0 de integridad | Negocio A enlaza unidad B | FK compuestas y pruebas SQL adversariales |
| P0 de sesión | Formulario viejo de A se aplica en B | Contexto versionado y rechazo de petición obsoleta |
| P0 de migración | Restauración pierde escrituras o reenvía efectos | Corte controlado y reconciliación de proveedores |
| Alto | Rol SQL elude todas las políticas | Runtime sin bypass/propiedad; pruebas con rol efectivo |
| Alto | Moodle asocia por correo o por ID local | Binding por conexión y eliminación de respaldos |
| Alto | Firma o exportación sigue accesible tras revocación | Descarga mediada o capacidad de revocación acreditada |
| Alto | Semilla o limpieza usa solo rango de IDs | Tenant explícito y huellas de la otra empresa |
| Alto | Índice nuevo no coincide con `ON CONFLICT` | Despacho coordinado de índice, target, predicado y prueba |
| Alto | Identidad global expone miembros de empresas ajenas | Proyección por membresía y bootstrap limitado |

El pool de datos, la base compartida y la resolución de identidad son puntos comunes de disponibilidad. Su fallo puede afectar a varias empresas; las garantías operativas requieren medición y restauración probada.

Deuda propuesta, pendiente de aceptación:

- Conservación temporal de `users.role_id` como legado sin autoridad.
- Conservación de `sessions` sin uso.
- Migración progresiva de identificadores públicos.
- Normalización futura de nombres `permissions`/`role_permissions`, sin doble fuente.

Coste de retirada y duración: **NO VERIFICADO**. No se acepta deuda permanente implícita.

Se recorrió el checklist documental de `docs/contexto/flujo-de-trabajo.md:153`: RLS, rutas autorizadas, filtros por ID, Zod, asignación explícita, secretos, archivos, exportaciones y vistas están contemplados en el contrato. **No existe diff de implementación revisado ni control operativo demostrado.**

Son bases adecuadas existentes: autorización centralizada, separación de capas, migraciones versionadas, exclusividad durable de venta y huellas calculadas en servidor. G12 conserva esas garantías y añade contexto empresarial obligatorio.

## Handoff

**Productor:** Codex, perfil D03 Arquitectura. Se incorporó criterio de datos y seguridad en el diseño; no se obtuvo una revisión D11 independiente ni se abrieron subagentes.

**Destinatarios:**

- **D12 de otro proveedor:** revisar aislamiento, bootstrap, políticas, roles SQL, sesión, archivos, exportaciones, integraciones y oráculos de mutación.
- **D11:** revisar inventario de 42 tablas, FK, índices, autoría, referencias polimórficas, backfill y conservación.
- **D14 independiente:** concretar y ejecutar matriz A/B, migración, concurrencia, mutaciones y recorrido UI.
- **D01/Wilber:** resolver decisiones abiertas y aceptar ADR.
- **D00:** reconciliar G12 con M40/M01/M03/M13/M22/M41, coordinar archivos y emitir tareas exactas tras las puertas correspondientes.

**Verificación de esta corrección R1:** lectura completa del perfil y tarea, revisión D12 y ficha; contraste de esquema/actor, conexión, ruta de usuarios, limpieza y cálculo de huellas citados; documentación primaria PostgreSQL/Supabase y `spec:check`. El resultado y las limitaciones se registran en `reviews/G12-respuesta-R1.md`. El inventario previo se conserva; no equivale a una auditoría nueva de cada consumidor.

**NO VERIFICADO:** runtime, datos actuales, rol SQL efectivo, exposición Data API, RLS aplicada, aislamiento de proveedores, pruebas funcionales/BD, migración, rendimiento, capturas y funcionamiento UI. No se consultaron archivos de secretos ni se expusieron credenciales.

**Condiciones para proponer promoción a READY:** revisión independiente D12, revisión técnica D11, aceptación humana de decisiones necesarias, cierre de preguntas que bloqueen el tramo y contratos de pruebas/archivos concretos. La revisión no puede deducirse del estado de esta entrega.

**Estado final: `REVIEW / L1`.** Este documento no cierra H-R2-02, no aprueba su propia arquitectura y no habilita `b1c` por sí solo.

## Respuesta a la revisión R1

Cambios propuestos por D03 para revisión R2 de D12 de otro proveedor. “Atendido” indica incorporación documental, no cierre independiente ni prueba ejecutada de la implementación.

| Hallazgo | Respuesta y sección modificada | Verificación futura |
|---|---|---|
| H-G12-01 · Bloqueante | Atendido: Modelo de datos → Identidad global; P2; `g1`/`g2a`. Nulabilidad en expansión, legado conservado, nuevas identidades con rol global NULL; retirada en P8 | G12-21/28 |
| H-G12-02 · Bloqueante | Atendido: inventario fila 16 e Integridad; `g2b` crea UNIQUE `(tenant_id,project_id,id)` antes de FK triple en `g2c` | G12-05/22 |
| H-G12-03 · Bloqueante | Atendido y ampliado: Migración → Compatibilidad temprana; `g1` adapta limpieza antes de FK nuevas, todos los pares, formas de dos/tres columnas, tenant y aborto seguro; `g7` solo adopta/genera | G12-16/23 |
| H-G12-04 · Bloqueante | Atendido: inventario fila 39 e Integridad; `g2d` crea UNIQUE no parcial `(tenant_id,event_id)` antes de FK de DLQ | G12-13/22 |
| H-G12-05 · Mayor | Atendido: §3/§4 Transporte HTTP, §6 puertos, matriz y `g8a`/`g8b`. Ambas cabeceras obligatorias, `409 TENANT_CONTEXT_MISMATCH`, comparación serializada y excepciones acotadas | G12-09/24 |
| H-G12-06 · Mayor | Atendido: Modelo de datos → Actor, filtros y RLS; `g3d`. `withTenantContext` en lecturas/escrituras, misma tx y set_config local; `getDb()` solo en fronteras autorizadas. El modo de pool desplegado sigue NO VERIFICADO; `prepare: false` no lo demuestra (`src/infrastructure/db/client.ts:23`) | G12-07/08/25 |
| H-G12-07 · Mayor | Atendido: §4 Administración empresarial; `g4-usuarios`/`g8c`. Gestión solo de membresías; ruta global legacy denegada al admin tenant; sin inventar edición de perfil propio | G12-10/26 |
| H-G12-08 · Mayor | Atendido: Modelo de datos → Actor, filtros y RLS; `g3a` incluye `src/domain/rbac.ts` y contrato empresarial previo a `g3b`/`g3c`; transición tipada sin tenant opcional activo | G12-02/20/28 |
| H-G12-09 · Mayor | Atendido: §4 Evaluación local y `g3b`. Membresía real/QH explícita, selector `qh_dev_tenant`, denegación de selector inválido y bypass imposible en producción | G12-27 |
| H-G12-10 · Menor | Atendido: Migración → Conteos y huellas; `g1` nombra `scripts/test-db/run.mjs`, manifiesto de columnas originales y comparación sensible a cambios | G12-15/28 |
| H-G12-11 · Menor | Atendido: inventario filas 41/42 y Mapeo físico; `g2d`/`g6b`. Se conserva `system`, se preserva `account_id` y se explicitan claves; varias conexiones no representables quedan bloqueadas hasta contrato ampliado | G12-13/28 |
| H-G12-12 · Menor | Atendido: Migración → Encaje con M40 y Rebanadas. Puerta backend `q-db`/`m40-pre` separada de UI/corte; revisión y aceptación humanas subsisten | Evidencia backend independiente antes de `b1c`; G12-17/19/20 para sus respectivos tramos |
