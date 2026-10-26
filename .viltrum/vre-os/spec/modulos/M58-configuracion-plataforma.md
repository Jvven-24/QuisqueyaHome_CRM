---
id: M58
nombre: Configuración de plataforma para una empresa
estado: REVIEW
riesgo: R3
owner: D01
revisores: [D03, D12]
fuente_de_verdad: PostgreSQL del CRM; identidad en Supabase Auth según M43
depende_de: [M40, M41, M42, M43, decisión #51, D04, D11, D12, D21]
actualizado: 2026-10-18
---

# M58 · Configuración de plataforma para una empresa

## 1. Propósito y usuarios

M58 permite a Quisqueya Home administrar los parámetros de su CRM, sus accesos, sus integraciones aprobadas, el consumo de servicios externos y la consulta/salida autorizada de datos. El alcance es una sola empresa, conforme a la decisión #51 (docs/contexto/decisiones.md:348-356); no se incorpora un modelo de suscripción SaaS.

P0 completo: UI-073 a UI-078 del backlog (.viltrum/vre-os/fuentes/backlog-Pantallas.csv:77-82): centro de configuración; usuarios y permisos; embudo, campos y catálogos; integraciones; presupuestos y consumo externos; auditoría, exportación y solicitudes de retención. La Papelera existente se conserva como compatibilidad operativa, sin convertirla en una nueva pantalla del backlog.

Los roles actuales son admin, assistant y broker (M43-inicio-acceso.md:27-35). Finanzas y Legal aparecen como perspectivas en D04; no están ratificados como roles ni como identidades concretas. Hasta que se ratifique la matriz, los recursos nuevos quedan concedidos solo a admin; assistant y broker no reciben grants por defecto. Esto es una regla de mínimo privilegio y no afirma que Finanzas o Legal tengan acceso.

Riesgo R3: el módulo administra permisos, datos personales, conexiones y credenciales, auditoría, exportaciones y solicitudes de retención. Un fallo puede revelar información o permitir una acción administrativa no autorizada.

## 2. Estado actual (AS-IS)

Inspección estática de archivos locales el 18-oct-2026. No ejecuté la interfaz, APIs, base de datos ni migraciones; los resultados de ejecución y despliegue siguen pendientes de verificación independiente.

| Área | Evidencia local | Brecha o límite |
|---|---|---|
| Navegación | /configuracion usa ?tab= para usuarios, permisos, etapas, catálogos, papelera e integraciones; la página aplica settings:view:all antes de cargar datos (src/app/(crm)/configuracion/page.tsx:42-64,130-161). | Los subflujos P0 no tienen rutas independientes ni guardas propias. La página y APIs propuestas deben quitar la guarda paraguas de la raíz y autorizar antes de consultar cada subruta. |
| Papelera | La pestaña consulta registros con deletedAt y renderiza el componente existente; la API de restauración es /api/papelera/restaurar (page.tsx:130-148; src/app/api/papelera/restaurar/route.ts:19-39; src/app/(crm)/configuracion/_papelera.tsx:64-92). | Al migrar la navegación, no se debe retirar la pestaña, el componente ni la API antes de contar con la ruta compatible y la prueba de restauración. |
| Identidad y permisos | El catálogo tipado contiene settings, users, roles, audit_log, integrations y recursos financieros (src/domain/catalogs.ts:19-66). Las acciones actuales son view, create, edit, delete, import, export (líneas 19-27). | No existen aún usage_budgets, data_exports, data_retention ni la acción approve. |
| Roles | M43 registra admin, assistant y broker; director, agente y finanzas son perspectivas por permiso, no roles (.viltrum/vre-os/spec/modulos/M43-inicio-acceso.md:27-35). | D04 asigna pantallas a FIN y LEG, pero no existe una decisión que asigne esas facultades a personas o roles del CRM (.viltrum/vre-os/auditoria-2026-10-18/D04-arquitectura-ui.md:89-94,202-211). |
| Identificadores | users, projects, units, contacts, leads y deals declaran serial como PK (src/infrastructure/db/schema.ts:168,432,483,577,613,680). | El registro de configuración de una empresa no puede depender de un UUID de tenant inexistente. Valores polimórficos usan IDs enteros y validación transaccional por tipo. |
| Integraciones y secretos | Existe integration_accounts.encrypted_credentials junto a metadatos (schema.ts:1230-1254). | La lectura estática no acredita el algoritmo, protección/rotación de clave ni comportamiento efectivo de almacenamiento. No se añade una bóveda ni se autoriza una escritura de credenciales hasta la revisión D12. |
| Auditoría y Outbox | Existen audit_log y Outbox (schema.ts:1257-1305). El tipo de evento se valida contra TIPOS_EVENTO_CRM y outbox_type_check (schema.ts:1280-1305). | El catálogo actual no incluye eventos de plataforma. La migración local 0011_m40_outbox_tipos.sql limita el CHECK a los eventos conocidos de CRM/M40 (líneas 10-12); el journal contiene índice 11 para 0011_m40_outbox_tipos (drizzle/meta/_journal.json:82-87). 0012 es el siguiente número propuesto, no una migración M58 creada o aplicada. |
| Suscripción y consumo | UI-077/QA-039 cubren presupuestos de servicios externos y el comportamiento al agotarlos (backlog-Pantallas.csv:81; backlog-QA.csv:43). | No se verificó un contrato SaaS de Quisqueya Home. P0 no tendrá subscriptions, entitlements, service_agreements, downgrade ni período de gracia. |
| QA | Matriz y QA G4 registran observaciones anteriores (matriz-G4.md:163-202; qa-G4.md:29-55,81-85). | No se reejecutaron; su vigencia frente al código local actual no queda acreditada por esta ficha. |

## 3. Pantallas

Navegación y autorización: /configuracion funciona como índice de categorías sin consulta sensible ni permiso paraguas settings:view:all. Cada subruta es un Server Component con autorización propia antes de leer datos; cada API valida actor y recurso/acción antes de consultar. Las opciones del índice solo se muestran cuando el actor posee el permiso de la pantalla. La UI no concede permisos.

En todas las pantallas: carga finita con aria-busy; vacío explicado; error saneado con reintento; offline muestra antigüedad y bloquea mutaciones; éxito confirma persistencia; permiso insuficiente responde 401/403 y objeto fuera de alcance 404. No se encolan datos privados sin conexión. En móvil 320/390 se priorizan tarjetas y hoja inferior; a 768/1440 se permite tabla y detalle. D05 debe definir los componentes/wireframes antes de la construcción.

### 3.1 UI-073 · Centro de configuración

- Ruta: /configuracion, índice de acceso a subflujos.
- Contenido: búsqueda por clave/categoría, valor efectivo, origen, versión, sensibilidad y cambios pendientes del alcance único de Quisqueya Home. La lista de claves es cerrada y se deriva del catálogo CFG del backlog; no acepta claves libres.
- Acciones: consultar, proponer cambio, validar, simular referencias y solicitar aprobación independiente; activar solo tras aprobación. Revertir crea una nueva versión. No altera snapshots, acuerdos ni operaciones históricas.
- Permiso: settings:view:all para consulta; settings:edit:all para proponer; settings:approve:all para aprobar. Un actor no puede aprobar su propia solicitud.
- Alcance: una configuración de empresa singleton. No hay selector de empresa, sucursal, proyecto ni preferencia personal en P0.

### 3.2 UI-074 · Usuarios, roles y permisos efectivos

- Rutas: /configuracion/usuarios y /configuracion/roles.
- Contenido: identidad local, rol, estado e invitación; permisos efectivos por recurso/acción y razón de permitir/denegar. No mostrar último acceso si no existe fuente verificada.
- Acciones: invitar, cambiar estado, asignar rol y consultar/editar grants autorizados. No hay impersonación ni autoescalada. No se desactiva al último admin activo sin transferir antes la titularidad.
- Permisos: users:view/create/edit/delete:all y roles:view/create/edit/delete:all, por acción. Solo admin recibe estos grants en el corte inicial; el resto denegado.
- Límite: no se crean roles FIN/LEG; se requiere una decisión antes de concederles grants.

### 3.3 UI-075 · Embudo, campos y catálogos

- Ruta: /configuracion/modelo-comercial.
- Contenido: etapas, motivos de pérdida, canales y definiciones de campos permitidas para entidades P0. Cada campo declara tipo, sensibilidad, obligatoriedad y opciones tipadas; el catálogo es cerrado.
- Acciones: crear, editar, ordenar o archivar; previsualizar; mapear referencias antes de retirar un valor. No borrar datos referenciados ni cambiar silenciosamente su interpretación.
- Permiso: settings:view/edit:all; settings:approve:all para cambios clasificados como sensibles.
- Invariantes: los tipos open, won, lost son cerrados (src/domain/catalogs.ts:16-27). Cambiar etiquetas no cambia cierres ni recalcula históricos. “Perdido” no cancela reservas ni devuelve fondos.

### 3.4 UI-076 · Integraciones aprobadas

- Ruta: /configuracion/integraciones.
- Contenido: proveedor, cuenta vinculada, permisos concedidos, estado informado por su adaptador, última sincronización y trabajos pendientes. Un estado no disponible se presenta como tal, nunca se infiere.
- Acciones: consultar; conectar, probar, reemplazar credencial, pausar, reconciliar o desconectar solo para proveedores aprobados y con adaptador disponible. Antes de una escritura de credenciales, D12 debe acreditar la protección del almacenamiento y el manejo de clave; si falta esa evidencia, la mutación de credenciales falla cerrada.
- Permiso: integrations:view/edit:all. Los secretos se reciben solo por operación autorizada; nunca se devuelven en GET, exportación, error o log.
- Límite: P0 reutiliza integration_accounts; no crea integration_secrets ni referencias vault_key. Ningún proveedor adicional se considera aprobado por esta ficha.

### 3.5 UI-077 · Consumo y presupuestos de servicios externos

- Ruta: /configuracion/plan para mantener compatibilidad con el backlog; el título y contenido serán “Consumo y presupuestos”.
- Contenido: presupuestos operativos y consumo medido por proveedor, categoría y periodo; coste estimado y confirmado siempre se distinguen. No se muestran valores calculados sin fuente.
- Acciones: consultar, definir o cambiar un presupuesto y exportar el consumo con permiso separado. El backend aplica el presupuesto antes de llamar a un servicio con coste. Sin presupuesto explícito o al agotarlo, la llamada de IA/mensajería sujeta a ese presupuesto se bloquea; el CRM central sigue disponible.
- Permiso: usage_budgets:view/edit:all y usage_budgets:export:all. Solo admin recibe grants en P0; FIN no recibe acceso hasta ratificar identidad y alcance.
- Exclusiones: no hay suscripción SaaS, licencias, entitlements de plan, contrato de servicio, downgrade, gracia ni medio de pago.

### 3.6 UI-078 · Auditoría, exportación y retención

- Rutas: /configuracion/auditoria y /datos/exportacion.
- Contenido: acciones, actor, objeto, motivo, diferencias depuradas y estado de exportación/solicitudes. No devuelve secretos, credenciales ni documentos completos en el historial.
- Acciones: consultar auditoría; crear y consultar exportación autorizada; solicitar retención/salida. P0 no ejecuta purga ni anonimización hasta que Legal ratifique las clases, plazos y obligaciones.
- Permiso: audit_log:view:all; data_exports:create/view/export:all; data_retention:view/edit:all. Lectura no implica exportación. Solo admin recibe grants iniciales; LEG no recibe acceso hasta ratificación.
- Descargas: revalidar permiso en cada lectura; trabajo/link expirable y revocable; neutralizar fórmulas al exportar CSV. La bitácora es append-only.

### 3.7 Compatibilidad · Papelera existente

- Ruta canónica propuesta: /configuracion/papelera. Se mantiene /configuracion?tab=papelera como alias durante la migración de navegación.
- Contrato conservado: src/app/(crm)/configuracion/_papelera.tsx y POST /api/papelera/restaurar. La nueva página delega en la capacidad existente; no crea otra API ni reemplaza el restaurador.
- Permiso P0: conserva settings:view/edit:all hasta que D12 y D11 aprueben una autorización por recurso; no se amplía el acceso actual.
- Regla: restaurar nunca se convierte en borrado físico ni elimina auditoría. La rebanada de UI debe probar la ruta nueva y el alias anterior.

## 4. Funciones (casos de uso)

Todas las rutas son contratos propuestos salvo la API de papelera existente. JSON se valida con Zod estricto, se asigna campo por campo y nunca se propaga el cuerpo completo. Rutas con ID revalidan la fila con visibleRows/reaches; autorización antes de datos, conteos o respuesta.

| Caso | Entrada y regla | Salida, permiso, evento e idempotencia |
|---|---|---|
| Consultar configuración efectiva | GET /api/configuracion/valores; clave del catálogo CFG, filtros y cursor validados. | DTO depurado; settings:view:all. Lectura sin evento. |
| Proponer, revisar y activar versión | POST /api/configuracion/versiones; clave, valor tipado, versión esperada y motivo. Aprobación por actor distinto; hash/version obsoleta produce conflicto. | settings:edit:all para proponer; settings:approve:all para decidir. Activación emite ConfiguracionVersionActivada dentro de la transacción con la auditoría. Alta idempotente; clave repetida con contenido distinto da 409. |
| Administrar usuarios y permisos | Mantener contratos actuales y añadir consulta efectiva por usuario visible. Actor nunca procede del body ni de metadata no confiable. | Permisos users:*:all/roles:*:all; cada acción requiere su alcance. Último admin exige transferencia primero. |
| Editar embudo, campos y catálogos | Rutas API validadas; cambio con versión esperada y mapa de referencias. Tipo de entidad cerrado; claves desconocidas rechazadas. | settings:edit:all; cambios sensibles usan aprobación independiente. Auditoría en la misma transacción. |
| Administrar integración | GET/PATCH de metadatos y operaciones explícitas para conectar, reemplazar credencial, pausar, reconciliar y desconectar. Red externa fuera de la transacción. | integrations:view/edit:all; nunca devuelve secreto. Cambio de estado emite IntegracionEstadoCambiado. Retry idempotente por conexión/operación. Fake adapter para errores de proveedor. |
| Registrar/aplicar consumo | El adaptador entrega una medición con proveedor, categoría, periodo, cantidad y origen; el dominio valida y persiste. El presupuesto se comprueba antes de la llamada con coste. | usage_budgets:view/edit/export:all para consultar/administrar. No añade tipos de outbox; sin medición no se inventa consumo. Al faltar presupuesto para un servicio sujeto a él, no se envía la llamada. |
| Consultar auditoría | GET /api/configuracion/auditoria; filtros/cursor validados y permiso antes de consulta o conteo. | audit_log:view:all; no modifica ni elimina eventos. |
| Solicitar y descargar exportación | POST crea job tipado; worker recoge ExportacionDatosSolicitada; GET vuelve a autorizar y filtra relaciones. | data_exports:create/view/export:all; idempotencia de solicitud, descarga revocable y expirable. Sin secreto, filas ajenas o ficheros sin autorización. |
| Solicitar retención/salida | POST crea solicitud con motivo; aplica retención aprobada, no purge. | data_retention:edit:all; requiere auditoría, motivo e idempotencia. Operación irreversible fuera de P0. |
| Restaurar papelera | Mantener POST /api/papelera/restaurar con entrada Zod existente y registro visible. | settings:edit:all conforme al contrato actual; ruta y respuesta compatibles. Reintento seguro según caso de uso existente. |

El catálogo cerrado de eventos que M58 añade a TIPOS_EVENTO_CRM es exactamente: ConfiguracionVersionActivada, IntegracionEstadoCambiado, ExportacionDatosSolicitada. D11 debe preservar todos los tipos CRM/M40 y ampliar el CHECK de outbox en la migración 0012 antes de implementar emisores. Operación local, auditoría y outbox se confirman juntos; ninguna llamada de red ocurre dentro de esa transacción.

## 5. Datos

El backlog de datos es un diccionario lógico, no DDL ejecutable. Esta sección define el contrato físico P0 para D11. No se incorpora tenant_id ni se crea una empresa ficticia.

| Entidad | Contrato P0 |
|---|---|
| users, roles, permissions | Reutilizar tablas y catálogo actuales. No duplicar RBAC. La matriz inicial de M58 concede recursos nuevos solo al rol existente admin; los demás quedan denegados. |
| pipeline_stages, loss_reasons, lead_sources | Reutilizar PK y referencias. Archivar antes que borrar; mantener los tipos de etapa cerrados. |
| configuration_versions | Tabla nueva con PK serial, public_id UUID único si se expone, version_no, estado (draft, pending_approval, active, rejected), clave de catálogo, valor validado/hash, requested_by integer references users(id), approved_by integer references users(id) nullable, approved_at, rejected_by/rejected_at nullable, motivo de solicitud/decisión, fechas. P0 usa un alcance singleton de empresa: scope_type='organization', scope_id IS NULL; UNIQUE/CHECK impide más de un singleton activo. No hay FK a tenants, ni UUID de empresa, ni alcance proyecto en P0. La activación exige aprobador distinto del solicitante y estado aprobado; CHECK prohíbe igualdad cuando hay aprobador y exige los campos de aprobación para active. |
| configuration_values | Versionado de valores tipados por clave del catálogo cerrado. El catálogo parte de los IDs CFG-001..CFG-121 en backlog-Configuraciones.csv; las claves P0 deben tener esquema y sensibilidad antes de aceptarse. No admite clave libre. |
| custom_field_definitions | Definición tipada, sensibilidad y estado; categoría/entidad permitida viene del catálogo cerrado. Archivar conserva lecturas históricas. |
| custom_field_values | entity_type validado contra ENTITY_TYPES; entity_id integer compatible con PKs físicas serial; definition_id integer FK a definición. Por ser relación polimórfica no hay una FK única a varias tablas: el adaptador verifica en la misma transacción que la fila de entity_type y entity_id existe y es accesible. Nunca se cambia el ID interno por UUID. |
| integration_accounts | Reutilizar la tabla existente, incluido encrypted_credentials; no añadir integration_secrets ni vault_key. La protección y rotación de la clave actual no se dan por verificadas; hasta la evidencia D12, lectura de metadatos sí, escritura de credenciales no. |
| audit_log y outbox | Mantener una sola autoridad de auditoría. D11 extiende el catálogo de Outbox con los tres eventos M58 y conserva los tipos previos. Toda tabla nueva lleva .enableRLS() en Drizzle y ENABLE ROW LEVEL SECURITY en SQL; pruebas con rol efectivo. |
| usage_budgets, usage_events | Únicas entidades de consumo P0. No crear subscriptions, entitlements o service_agreements. Registrar datos medidos; distinguir confirmado/estimado; no persistir valor estimado como cargo confirmado. |
| export_jobs, privacy_requests, retention_holds | Entidades propuestas para trabajo asíncrono, solicitudes y retenciones. No se crea deletion_jobs ni se ejecuta purga/anónimo en P0. FKs históricas RESTRICT; sin cascada destructiva. |

Catálogo RBAC P0: ampliar PERMISSION_RESOURCES con usage_budgets, data_exports, data_retention; ampliar PERMISSION_ACTIONS con approve. Usar settings:approve:all para decisión de versiones, usage_budgets:view/edit/export:all, data_exports:create/view/export:all y data_retention:view/edit:all; los demás recursos existentes conservan sus acciones actuales. Grant inicial: admin solamente para esos nuevos permisos. assistant y broker reciben ninguno. No se crean roles FIN/LEG ni grants implícitos. El permiso audit_log:export se reserva para una decisión posterior; una exportación queda bajo data_exports.

IDs internos siguen siendo enteros; UUID solo como public_id en recursos nuevos expuestos. No exponer IDs internos. No borrar físicamente datos referenciados. RLS en tabla no sustituye la comprobación de permisos en API (docs/contexto/flujo-de-trabajo.md:173-182).

## 6. Integraciones y puertos

- Configuración: ConfiguracionPort expone claves tipadas, versión efectiva, borrador y decisión; no conoce Drizzle ni el proveedor de identidad.
- Autorización: PermisosConfiguracionPort expresa recurso, acción y alcance; la capa de entrega ejecuta el guard del CRM antes de acceder a datos.
- Integraciones: IntegrationAccountPort entrega metadatos y operaciones del adaptador autorizado. El dominio no importa SDKs, clientes HTTP ni almacenes de secretos.
- Uso: UsageMeterPort registra medidas y consulta presupuesto; el consumidor de servicio consulta el límite antes de invocar la capacidad pagada.
- Auditoría/Outbox: AuditLogPort es append-only; OutboxPort recibe solo los tres eventos enumerados en §4.
- Exportación: ExportJobPort crea/revoca/consulta trabajos. El almacenamiento de archivos se abstrae; el destino físico y sus reglas de expiración requieren la decisión de D11/D12.
- Fallos: red externa fuera de la transacción; backoff acotado, idempotencia y estado visible. Pruebas de proveedor usan adaptador falso o servidor local de prueba, sin llamadas de red externa ni credenciales vivas.

No se selecciona bóveda externa ni proveedor nuevo. D21 aporta investigación, no evidencia de instalación efectiva (D21-ensamblaje-oss.md:5,17-20,50).

## 7. Métricas y reportes que alimenta

- Versiones creadas, pendientes, aprobadas, rechazadas y activadas.
- Permisos efectivos/denegaciones por recurso y acción.
- Integraciones por estado, fecha de sincronización y fallos/reintentos obtenidos del adaptador.
- Uso medido por proveedor/categoría/periodo; coste estimado separado de confirmado; presupuestos configurados y bloqueos aplicados.
- Exportaciones por estado y solicitudes de retención pendientes.

No se fijan volumen, concurrencia, SLO ni retención numérica sin datos del propietario. Esos números permanecen como pregunta abierta Q-M58-08; no se muestran como umbrales de producto.

## 8. Criterios de aceptación (verificables)

1. **Una empresa:** revisión de esquema y API confirma ausencia de tenant_id, tabla de tenant, sucursales y scope de proyecto en M58; el registro de configuración usa un único singleton con scope_id nulo. Prueba estática de esquema y navegación.
2. **Permiso antes de datos:** una prueba de cada ruta subyacente y API deniega al actor sin el recurso/acción antes de consulta, conteo o DTO; acceso directo a ruta ajena devuelve 404. Root /configuracion no impone permiso paraguas a subrutas. Prueba de rutas/API.
3. **Matriz RBAC inicial:** solo admin tiene los grants nuevos de §5; assistant y broker no pueden ver ni mutar consumo, exportación o retención. FIN/LEG no son roles hasta aprobación expresa. Prueba de roles semilla y endpoints.
4. **Versión y aprobación:** transición válida draft→pending_approval→active o rejected; solicitante distinto del aprobador/rechazador; estado activo sin decisión válida y aprobación propia son rechazados por DB; reintento idéntico no duplica, versión/hash obsoletos da 409. Prueba de unidad y DB.
5. **Outbox:** el catálogo tipado contiene el catálogo CRM/M40 existente más exactamente los tres eventos M58; migración 0012 se aplica desde base vacía y copia sintética; cada uno se inserta y un tipo no enumerado falla con CHECK. Prueba de migración y DB.
6. **IDs y catálogos:** IDs de proyecto, unidad, contacto, lead y negocio permanecen enteros; campo personalizado rechaza entidad desconocida, ID inexistente o no visible, mantiene el valor si se archiva la definición y no expone PK interna. Prueba de contrato/DB.
7. **Papelera:** la ruta /configuracion/papelera, el alias ?tab=papelera y POST /api/papelera/restaurar permiten la restauración autorizada; usuario sin permiso es denegado; no ocurre borrado físico. Prueba de ruta y API.
8. **Integraciones y secretos:** ningún GET/DTO/error/log/export contiene credencial; sin evidencia D12 de cifrado y manejo de clave, la API deniega escritura de credencial. Los casos 429, 500, timeout y revocación corren solo con adaptador falso/servidor local, sin tráfico a proveedores externos. Prueba de contrato.
9. **Presupuesto externo:** con presupuesto de prueba agotado, la llamada pagada de IA/mensajería no se hace y el CRM central sigue disponible; sin presupuesto explícito tampoco se hace llamada sujeta a presupuesto; el consumo no medido no se inventa. Prueba de dominio y adaptador falso.
10. **Auditoría, exportación y retención:** no se puede actualizar/borrar auditoría; exportar requiere permiso separado, revalida cada descarga y excluye secretos/filas ajenas; una retención bloquea purga. Prueba con rol efectivo y trabajo sintético restaurado en entorno aislado.
11. **Estados y móvil:** las seis pantallas UI-073..078 muestran carga, vacío, error, sin conexión, éxito y permiso insuficiente; error queda en su campo, y el flujo se valida a 320, 390, 768 y 1440 px. La papelera conserva los mismos estados esenciales. E2E/capturas D14.
12. **Seguridad de datos:** cada tabla nueva declara .enableRLS() y la migración incluye RLS; pruebas ejecutan lectura/escritura con rol efectivo y verifican alcance antes de conteos/filas. Revisión D11/D12.

Estos criterios son contratos a probar en la construcción; no afirman que el código o las migraciones existan hoy.

## 9. Fuera de alcance y preguntas abiertas

### 9.1 Evolución diferida

- Multiempresa/tenant, sucursales, proyecto como alcance, selector de empresa o membresías.
- Suscripciones SaaS, licencias, contratos de servicio, entitlements, downgrade y periodos de gracia.
- MFA/AAL2, impersonación, roles nuevos FIN/LEG, aprobaciones multinivel y delegación.
- Bóveda Vault/KMS y migración de credenciales hasta que D12/D16 documenten infraestructura y contrato.
- Purga/anonimización, cierre irreversible y retenciones con efecto legal sin política y aprobación.
- El interruptor de datos de prueba de la decisión #51 pertenece a M42 y no se duplica aquí (M42-datos-prueba.md:63-68).

### 9.2 Preguntas abiertas

Las preguntas que siguen requieren respuesta de sus responsables y mantienen el estado REVIEW; G1 no queda aprobado por esta revisión.

| ID | Pregunta | Responsable / bloqueo |
|---|---|---|
| Q-M58-01 | ¿Quién es el responsable real de seguridad/configuración y quién transfiere la propiedad antes de desactivar al último admin? ¿Se ratifican perfiles FIN/LEG como permisos o como roles, y qué personas reciben esos grants? | D02, Wilber, D12; antes de conceder acceso distinto de admin. |
| Q-M58-02 | ¿El catálogo de configuración requiere alcance por proyecto o preferencia personal? P0 queda limitado al singleton de empresa hasta respuesta. | D02, D03, D11; antes de ampliar el modelo. |
| Q-M58-03 | ¿Qué cambios se clasifican sensibles y cuál es el sustituto operativo si no hay otro admin disponible? P0 exige aprobación distinta y no tiene bypass. | D02, D12, Wilber; antes de activar cambios sensibles. |
| Q-M58-04 | ¿Qué proveedores y categorías de servicio están aprobados, y qué fuente certifica consumo/coste confirmado? | D02, D12, D16, D21; antes de mostrar costes como confirmados o conectar otro proveedor. |
| Q-M58-05 | ¿Qué protección, custodia y rotación tiene la clave que protege encrypted_credentials en el entorno desplegado? | D12, D16; antes de aceptar escritura de credenciales. |
| Q-M58-06 | ¿Qué clases y plazos de retención, base de conservación y excepciones legales aplican; quién autoriza anonimización/salida? | Legal, D11, D12, Wilber; antes de purga o anonimización. |
| Q-M58-07 | ¿Qué formato, alcance, destinatario y vencimiento exige la exportación, y quién valida restauración y continuidad de obligaciones? | D02, D11, D12; antes de habilitar exportación fuera del entorno autorizado. |
| Q-M58-08 | ¿Cuántos usuarios habrá hoy y en un año, qué volumen de auditoría/uso/exportación se espera y qué disponibilidad/latencia se requiere? | D02, D11, D16; antes de aceptar NFR numéricos. |

Q-C1-05 sobre minimización/consentimiento/retención de datos enviados a integraciones sigue abierta (.viltrum/questions.md:3-7); no se envía dato personal a un conector hasta que se cierre para ese flujo.

Corte de evidencia: la cobertura P0 previa dice 6/6 pantallas cotejadas, pero la ejecución de QA, la configuración efectiva del despliegue, el contrato de servicio y los roles FIN/LEG no se verificaron aquí. G1 permanece pendiente. D14 debe repetir QA sobre el snapshot que se presente a revisión.

## Rebanadas

Son propuestas de hasta 45 minutos por tarea. No autorizan código mientras M58 permanezca en REVIEW ni sustituyen C1, el contrato de despacho o la revisión independiente. El número de migración siguiente comprobado en el journal local es 0012; no está creado ni aplicado.

| ID / tiempo | Entrega | Archivos permitidos | Prueba |
|---|---|---|---|
| S00 / 30 min | D11 confirma snapshot local, mapeo de IDs y contrato de migración. | Lectura: drizzle/meta/_journal.json, schema.ts, M40, M43. Sin escritura. | Informe D11; no aplicar migración. |
| S01 / 45 min | Extensión cerrada de tipos Outbox M58. | src/application/compartido/crm.ts, src/infrastructure/db/schema.ts, drizzle/0012_m58_eventos_plataforma.sql, drizzle/meta/0012_snapshot.json, drizzle/meta/_journal.json, scripts/test-db/m58-eventos.mjs. | Inserción permitida de los 3 eventos M58 y rechazo del tipo ajeno; migración sobre BD vacía/copia sintética. |
| S02 / 45 min | Versiones singleton y decisión independiente. | src/infrastructure/db/schema.ts, drizzle/0013_m58_configuracion.sql, drizzle/meta/0013_snapshot.json, drizzle/meta/_journal.json, scripts/test-db/m58-configuracion.mjs. | CHECK de estado/aprobador, unicidad singleton, PK entero y RLS. |
| S03 / 45 min | Recursos/acciones RBAC y guards por subruta. | src/domain/catalogs.ts, src/app/(crm)/configuracion/**, API M58 permitidas por despacho, pruebas de permisos. | Admin accede; assistant/broker denegados antes de datos; rutas profundas autorizan por recurso. |
| S04 / 45 min | Definiciones/campos personalizados con IDs compatibles. | src/infrastructure/db/schema.ts, drizzle/0014_m58_campos_personalizados.sql, drizzle/meta/0014_snapshot.json, drizzle/meta/_journal.json, src/application/configuracion/campos.ts, src/application/configuracion/campos.test.ts, scripts/test-db/m58-campos.mjs. | Tipo/entidad cerrados, ID entero existente y RLS. |
| S05 / 30 min | Papelera y restauración siguen accesibles durante la migración. | src/app/(crm)/configuracion/page.tsx, src/app/(crm)/configuracion/papelera/page.tsx, src/app/(crm)/configuracion/_papelera.tsx, src/app/api/papelera/restaurar/route.ts, src/app/api/papelera/restaurar/route.test.ts. | Ruta canónica y alias; restauración autorizada conserva contrato. |
| S06 / 45 min | Metadatos de integraciones y guarda de credenciales. | src/application/configuracion/integraciones.ts, src/application/configuracion/integraciones.test.ts, src/infrastructure/db/repos/configuracion.ts, src/infrastructure/contenedor/configuracion.ts, src/app/api/configuracion/integraciones/route.ts, src/app/api/configuracion/integraciones/route.test.ts. | DTO sin secreto; sin evidencia D12 la escritura falla cerrada; fake adapter. |
| S07 / 45 min | Presupuestos y consumo externo. | src/infrastructure/db/schema.ts, drizzle/0015_m58_consumo.sql, drizzle/meta/0015_snapshot.json, drizzle/meta/_journal.json, src/domain/uso-externo.ts, src/domain/uso-externo.test.ts, scripts/test-db/m58-consumo.mjs. | Agotado o sin presupuesto no invoca el proveedor; CRM central disponible. |
| S08 / 45 min | Auditoría, exportaciones y solicitudes de retención sin purga. | src/infrastructure/db/schema.ts, drizzle/0016_m58_salida_datos.sql, drizzle/meta/0016_snapshot.json, drizzle/meta/_journal.json, src/application/auditoria/consultas.ts, src/application/auditoria/consultas.test.ts, src/application/exportacion/casos-de-uso.ts, src/application/exportacion/casos-de-uso.test.ts, scripts/test-db/m58-salida-datos.mjs. | Append-only, autorización antes de conteo/descarga, exclusión de secretos y RLS. |
| S09 / 45 min | Crear, aprobar y activar versiones por API. | src/app/api/configuracion/versiones/route.ts, src/app/api/configuracion/versiones/route.test.ts, src/app/api/configuracion/versiones/[publicId]/aprobar/route.ts, src/app/api/configuracion/versiones/[publicId]/aprobar/route.test.ts, src/app/api/configuracion/versiones/[publicId]/activar/route.ts, src/app/api/configuracion/versiones/[publicId]/activar/route.test.ts. | Permiso antes de datos; body desconocido rechazado; claves repetidas seguras. |
| S10 / 45 min | UI-074 usuarios/roles. | src/app/(crm)/configuracion/usuarios/**, roles/**, componentes necesarios de src/app/(crm)/_ui/** y src/components/ui/**, pruebas. | Admin, assistant y broker; seis estados. |
| S11 / 45 min | UI-073 centro e índice de categorías. | src/app/(crm)/configuracion/page.tsx, _centro.tsx, componentes necesarios de src/app/(crm)/_ui/** y src/components/ui/**, pruebas. | Índice sin guarda paraguas; muestra solo categorías permitidas. |
| S12 / 45 min | UI-075 modelo comercial/campos. | src/app/(crm)/configuracion/modelo-comercial/**, componentes necesarios de src/app/(crm)/_ui/** y src/components/ui/**, pruebas. | Referencias, categorías cerradas y estados. |
| S13 / 45 min | UI-076 integraciones. | src/app/(crm)/configuracion/integraciones/**, componentes necesarios de src/app/(crm)/_ui/** y src/components/ui/**, pruebas. | Sin estado inventado ni secreto mostrado; seis estados. |
| S14a / 45 min | UI-077 consumo/presupuestos. | src/app/(crm)/configuracion/plan/**, componentes necesarios de src/app/(crm)/_ui/** y src/components/ui/**, pruebas. | Fuente medida, costes estimados separados y denegación al límite. |
| S14b / 45 min | UI-078 auditoría/exportación/retención. | src/app/(crm)/configuracion/auditoria/**, src/app/(crm)/datos/exportacion/**, componentes necesarios de src/app/(crm)/_ui/** y src/components/ui/**, pruebas. | Permiso separado; descarga reautoriza; retención sin purga. |
| S14c / 30 min | Compatibilidad visual de Papelera. | src/app/(crm)/configuracion/papelera/**, _papelera.tsx, page.tsx, pruebas. | Ruta nueva, alias existente y API restaurar operan juntos. |
| S15 / 45 min | QA independiente P0. | src/app/(crm)/configuracion/m58.e2e.test.ts, scripts/test-db/m58-rls.mjs, scripts/test-db/m58-salida-datos.mjs, .viltrum/vre-os/evidencia/M58/capturas/**. | Seis pantallas, roles, RLS, rutas e integración simulada a 320/390/768/1440; D12/D14 ejecutan y revisan. |

## Respuesta a la revisión R2

| Hallazgo R1 | Resolución incorporada en esta versión |
|---|---|
| H-M58-R1-B01 | Singleton sin UUID/tenant; PK internas serial; custom_field_values.entity_id entero y comprobación transaccional polimórfica. |
| H-M58-R1-B02 | Lista exacta de tres eventos M58; S01 reserva 0012 y amplía el CHECK preservando los eventos anteriores. No se afirma migración aplicada. |
| H-M58-R1-M01 | Se define /configuracion/papelera, alias ?tab=papelera y conservación de _papelera.tsx/POST /api/papelera/restaurar. |
| H-M58-R1-M02 | Índice sin guarda paraguas; Server Components/APIs autorizan por subruta. FIN/LEG no reciben acceso hasta ratificación. |
| H-M58-R1-M03 | Aprobación local en configuration_versions, con autor distinto; se elimina dependencia de approval_requests M43. |
| H-M58-R1-M04 | UI-077 queda en presupuestos/consumo medido; se retiran entidades y reglas de suscripción SaaS. |
| H-M58-R1-M05 | Se especifican recursos, acciones y grants iniciales cerrados; solo admin recibe los nuevos grants. |
| H-M58-R1-M06 | No se crea integration_secrets ni vault_key; escritura de credenciales depende de evidencia D12 sobre el almacenamiento existente. |
| H-M58-R1-m01 | S14 queda dividida en S14a/S14b, se agrega S14c para Papelera y se permiten componentes UI compartidos en tareas de vistas. |
| H-M58-R1-m02 | QA-033 usa exclusivamente adaptador falso/servidor local; no hace llamadas externas ni requiere credenciales vivas. |

