La evaluación está completa, pero **no pude actualizar el entregable porque el entorno impone solo lectura, sin excepciones**. El [archivo existente](C:/Users/wilbe/Documents/QuisqueyaHome_CRM/.viltrum/crm-ux/D10-backend-eval.md) conserva un informe anterior de bloqueo. A continuación entrego el contenido completo para sustituirlo.

# D10 — Evaluación del backend del CRM

**Fecha:** 2026-10-03  
**Modo:** análisis; sin modificaciones, despliegues ni aprobación de gates.  
**Clasificación:** CRM/ERP, riesgo R3, auditoría de implementación existente.  
**Revisor independiente:** D12; validación funcional D14; revisión de datos D11.

## Alcance y límites de evidencia

Se leyó completo `.viltrum/dispatch/20261003T192957Z-D10-codex/PERFIL.md` y se ejecutó el mandato de `TAREA.md`.

La revisión comprende el inventario de `src/domain`, `src/application`, `src/infrastructure`, las **47 rutas API con 56 handlers**, el esquema de **29 tablas**, las dos migraciones SQL, `db/seed.sql`, pruebas, CI y documentación de contexto. Se combinaron búsquedas estructurales, lectura manual de operaciones críticas y reproducciones con datos sintéticos en memoria.

El HEAD local identificado mediante archivos de referencias es:

```text
develop
3e1553ce281034435660aa30da0a199ea56f7c36
```

Esto identifica la referencia local; **no acredita que todos los archivos inspeccionados coincidan con ese commit**, ni su publicación remota. No se usaron `git` ni `gh`.

No se conectó a PostgreSQL, Supabase Auth, Storage ni proveedores de mensajería. No se ejecutaron ataques HTTP, carreras reales, migraciones, `dev` o `build`. La aplicación efectiva de RLS, permisos del rol de conexión, configuración del proxy y exposición del servidor están **no verificadas**.

Se aplicaron los procedimientos `viltrum-backend`, Supabase, buenas prácticas PostgreSQL y seguridad para Next.js. La referencia de seguridad local corresponde a Next.js 16; se utilizó para controles generales, sin atribuir al proyecto comportamientos específicos de esa versión.

No se imprimieron valores de secretos, archivos `.env`, cadenas de conexión ni inventarios de configuración. La detección de contraseñas literales devolvió exclusivamente un booleano y líneas.

## Resultado ejecutivo

El backend principal tiene una separación de capas sólida, puertos explícitos, auditoría transaccional y buenas defensas en cierre de negocios y comisiones. Las pruebas de arquitectura pasan.

Sin embargo, hay riesgos de confidencialidad, integridad y disponibilidad que impiden considerarlo verificado para entrega:

- Comunicaciones permite una petición del servidor hacia una URL arbitraria.
- Las respuestas de edición de proyectos y unidades pueden devolver precios restringidos.
- La detección global de duplicados devuelve datos personales fuera del alcance del solicitante.
- La deduplicación del webhook protege el lead, pero no todos sus efectos.
- La conversión de leads y la exclusividad de una unidad carecen de protección suficiente frente a carreras.
- Las consultas nuevas de Reportes/Dashboard se apartan del filtro RBAC común.
- Confotur produce planes cuyos pagos pueden superar el precio y cuotas negativas.
- Existen contraseñas literales en un script.
- Lint falla.

**No se confirma ningún P0.** Las severidades siguientes son propuestas para revisión independiente; no representan aceptación o cierre.

## Puntuación por área

Escala: 0 = sin controles suficientes; 10 = controles y evidencia completos. Las puntuaciones evalúan la implementación observada, no certifican el runtime.

| Área | /10 | Fundamentación |
|---|---:|---|
| Arquitectura hexagonal/SOLID | 8 | Dominio aislado, aplicación sin proveedores, puertos y fábricas por módulo. Persisten excepciones de configuración y autorización. |
| Autenticación y permisos | 4 | Identidad verificada y RBAC central; fugas en respuestas, duplicados y consultas nuevas. |
| Validación Zod y campos editables | 5 | Validación extendida y asignaciones explícitas; límites, relaciones y errores de parsing incompletos. |
| RLS | 6 | Las 29 tablas tienen activación en migraciones; ninguna la declara activada en el esquema Drizzle. Runtime pendiente. |
| Errores y observabilidad | 5 | Traducción común y 500 genérico; errores de negocio genéricos, mensajes externos y logs sin redacción. |
| Transacciones y concurrencia | 5 | Unidad de trabajo correcta; bloqueos selectivos útiles, pero invariantes importantes siguen expuestas. |
| Idempotencia | 4 | Upsert atómico del lead; efectos secundarios, conflicto de payload y otras operaciones sin cobertura suficiente. |
| Secretos y configuración | 3 | Configuración central parcialmente respetada; contraseñas literales en script. |
| Datos personales y auditoría | 3 | Auditoría transaccional en módulos principales; exceso de PII y ausencia de evidencia de retención/consentimiento. |
| Rendimiento e índices | 5 | Pool único e índices útiles; N+1 y listados ilimitados. Sin mediciones reales. |
| Pruebas y verificación | 6 | 358 pruebas pasan; predominan dobles y verificaciones textuales. Lint rojo. |
| APIs nuevas | 3 | Permisos y Zod presentes; funcionalidades simuladas/incompletas y garantías pendientes. |

## Verificación ejecutada

| Comprobación | Resultado observado |
|---|---|
| `npm test` | No arrancó por la política de ejecución de `npm.ps1`. |
| `npm.cmd test` | **358 pruebas, 358 pasan, 0 fallan, 0 omitidas**. |
| `npm.cmd run typecheck -- --incremental false` | **Exit 0**. Se desactivó incremental para evitar escribir caché. |
| `npm.cmd run lint` | **Exit 1**: un error de parsing en `test.js:1` y tres warnings. |
| `build` | No ejecutado, conforme a la restricción del proyecto. |
| HTTP/E2E | No ejecutado. |
| PostgreSQL/concurrencia real | No ejecutado. |

El error de lint es `File appears to be binary` en `test.js:1`. Los warnings corresponden a dos usos de `<img>` y un import de `Badge` no utilizado.

Versiones resueltas en el lockfile: Next.js **15.5.24**, React **19.2.8**, Drizzle **0.45.2**, Zod **4.5.4**, Supabase JS **2.112.4** y SSR **0.12.5**. No se realizó una auditoría exhaustiva de advisories o dependencias transitivas.

## Mapa de autorización de las APIs

Las rutas protegidas contienen `requireScope` o `requireFullScope`; esto **no demuestra que utilicen correctamente el alcance o autoricen cada efecto**. La tabla agrupa todos los archivos inventariados; las rutas se expresan bajo `/api`.

| Familia y operaciones | Permiso observado | Control de recurso / observación |
|---|---|---|
| `auth/login`, `logout`, `recuperar` — POST | Públicas; Supabase Auth | Login usa mensaje uniforme. Logout no elimina la cookie demo. |
| `auth/demo` — POST/DELETE | Pública; habilitación de evaluación | Restricción por modo, opt-in y cabecera Host. |
| `contactos` POST; `[id]` PATCH/DELETE | `contacts:create/edit/delete` | Mutaciones por `visibleRows`; búsqueda de duplicados global. |
| `leads` POST | `leads:create` | `contactId` comprueba existencia, sin alcance del contacto. |
| `leads/[id]` PATCH | `leads:edit` | `reaches` sobre lead; permite reasignar el propio con `own`. |
| `leads/[id]/descartar` POST | `leads:edit` | Estado y alcance comprobados. |
| `leads/[id]/convertir` POST | `leads:edit` + `deals:create` | Alcance comprobado; falta exclusión concurrente. |
| `leads/externo` POST | Token compartido | Upsert del lead; idempotencia de efectos incompleta. |
| `actividades` POST; `[id]` PATCH/DELETE | `activities:create/edit/delete` | Creación comprueba negocio; edición no revalida nuevas relaciones. |
| `actividades/ics` GET | `activities:view` | Filtro por alcance y rango temporal. |
| `pipeline/[id]` PATCH; `/etapa` PATCH | `deals:edit` | `reaches`; cierre ganado bloquea negocio. |
| `pipeline/[id]/propiedades` POST | `deals:edit` + `projects:view` | Verifica negocio, proyecto y unidad del proyecto. |
| `pipeline/[id]/propiedades/[propId]` PATCH/DELETE | `deals:edit` | Comprueba relación con negocio. |
| `proyectos` POST; `[id]` PATCH/DELETE | `projects:create/edit/delete` | Filtro por responsable; precio de entrada restringido, salida incompleta. |
| `proyectos/[id]/unidades` POST; `[unitId]` PATCH/DELETE | `units:create/edit/delete` | Alcance heredado del proyecto; salida puede incluir precio restringido. |
| `proyectos/[id]/fases` POST; `[faseId]` PATCH/DELETE | `construction_phases:create/edit/delete` | Alcance mediante proyecto; relación padre/hijo comprobada. |
| Fotos de fase POST/DELETE | `construction_phases:edit` | Relación fase/proyecto y archivo; validación MIME/tamaño. |
| `usuarios` POST; `[id]` PATCH/DELETE; invitación POST | `users:create/edit/delete`, alcance completo | `requireFullScope`; guarda de último admin sin exclusión concurrente. |
| `roles/[id]/permisos` PATCH | `settings:edit` | Rol protegido ineditable; no exige alcance completo. |
| `brokers/[id]/proyectos` PUT | `projects:edit` | Caso de uso exige `all`. |
| `metas` PUT | `goals:edit` | `reaches` sobre broker; upserts separan objetivo y alcanzado. |
| `comisiones/[id]` PATCH; export GET | `commissions:edit/export` | Bloqueo de comisión y alcance; CSV neutraliza fórmulas. |
| `catalogos/[tipo]` POST; `[id]` PATCH; `etapas/[id]` PATCH | `settings:create/edit` | Catálogos globales; alcance devuelto descartado. |
| `papelera/restaurar` POST | `settings:edit` | Restaura entidades globalmente; no comprueba permiso de cada recurso. |
| `academy` GET; progreso y checklist PUT | `academy:view` | Progreso asociado al actor; mutaciones usan permiso de lectura. |
| `ai/audio-transcribe` POST | `leads:create` | Ruta no suministra transcriptor. |
| `cotizador/confotur` POST | `projects:view` | Sin recurso persistido; límites y cálculos incompletos. |
| Comunicaciones: canales GET, plantillas GET/POST/PUT, despacho POST | `communications:view/create/edit` | Despacho usa `view`; plantillas no aplican `own/team`. |

El esquema declara explícitamente **una sola organización**, sin `organization_id` (`src/infrastructure/db/schema.ts:21`). No se considera la ausencia de multi-tenencia un defecto. El aislamiento que debe comprobarse es entre responsables y alcances dentro de esa organización.

## Hallazgos P1

### F01 — SSRF en despacho webhook

**Evidencia:** `src/app/api/comunicaciones/despachar/route.ts:14`, `:24`, `:32`; `src/infrastructure/comunicaciones/proveedor-despacho.ts:159`.

`destinatario` acepta cualquier string no vacío y llega a `fetch(mensaje.destinatario)`. No hay allowlist de destinos, comprobación de IP, control explícito de redirects ni timeout.

**Escenario:** un actor con `communications:view` utiliza `canal:"webhook"` para provocar un POST hacia un servicio interno alcanzable desde el CRM.

**Verificación:** flujo confirmado en código; alcance de red y explotación HTTP no verificados.

**Corrección:** registrar destinos autorizados en servidor, restringir protocolo/dominio/IP, controlar redirects y aplicar timeout. Preferir un identificador de integración frente a una URL libre.

### F02 — Contraseñas literales en script

**Evidencia:** `scripts/crear-usuario-prueba.mjs:29`, `:37`, `:45`.

Una inspección del AST detectó propiedades `password` con literales no vacíos en código ejecutable. No se extrajeron ni mostraron sus valores.

**Escenario:** si esas credenciales siguen siendo válidas, quien obtiene el script puede utilizarlas contra las cuentas correspondientes.

**Verificación:** presencia de literales confirmada; vigencia, privilegios y publicación remota no verificados. La deuda también aparece en `docs/contexto/decisiones.md:275`.

**Corrección:** retirar literales, cargar credenciales mediante el contrato central y revocar/rotar las que se hayan utilizado. La eliminación del archivo no sustituye la rotación.

### F03 — Precios restringidos en respuestas de edición

**Evidencia:** `src/app/api/proyectos/[id]/route.ts:51`, `:75`; `src/app/api/proyectos/[id]/unidades/[unitId]/route.ts:66`, `:75`; `src/infrastructure/db/repos/proyectos.ts:72`, `:115`.

Las rutas eliminan el precio del payload cuando falta permiso de edición, pero responden con la fila completa de `.returning()`.

**Escenario:** un actor con permiso para editar el recurso y sin `unit_real_price:view` envía una modificación inocua —incluso una edición vacía— y recibe el precio existente.

**Verificación:** flujo de retorno confirmado; combinación de permisos no ejercida mediante HTTP.

**Corrección:** aplicar `stripRestrictedPrices` o un DTO autorizado antes de responder. Probar autorización de salida independientemente de autorización de entrada.

### F04 — Fuga de PII mediante candidatos de duplicado

**Evidencia:** `src/infrastructure/db/repos/contactos.ts:39`, `:43`; `src/application/contactos/casos-de-uso.ts:44`; `src/infrastructure/db/repos/leads.ts:39`; `src/infrastructure/http.ts:67`.

La detección consulta toda la cartera y devuelve ID, nombre, teléfono y correo. El caso de uso los incluye en `ConflictError.details`, que llega al cliente.

**Escenario:** un broker con alcance `own` intenta crear un contacto con un teléfono o correo conocido y obtiene datos de un contacto de otro responsable.

**Verificación:** consulta y serialización confirmadas. La búsqueda global está documentada; la divulgación de la ficha debe revisarse como decisión distinta.

**Corrección:** conservar la detección global con una advertencia mínima. Devolver candidatos identificables únicamente cuando el actor pueda verlos.

### F05 — Webhook idempotente solo para el lead

**Evidencia:** `src/application/leads/casos-de-uso.ts:313`, `:318`, `:340`; `src/infrastructure/db/repos/leads.ts:198`, `:205`.

El contacto y su auditoría se crean antes del upsert del lead.

**Reproducción ejecutada:** dos llamadas con el mismo `externalId`, nombre sintético y sin teléfono/correo:

```text
Primera entrega: creado=true
Segunda entrega: creado=false
Estado final: 1 lead, 2 contactos, 3 auditorías
```

Una tercera llamada con la misma clave y datos de contacto diferentes dejó **3 contactos y 1 lead**, sin conflicto de payload.

Además, la consulta de respaldo tras conflicto no filtra `deletedAt`. Si existen una fila histórica borrada y otra activa con la misma clave, puede recuperar la histórica.

**Corrección:** deduplicar/reservar antes de ejecutar efectos, dentro de una garantía durable; asociar clave y payload; filtrar la recuperación por el mismo predicado del índice. Definir comportamiento tras borrado y retención de la clave.

### F06 — Conversión concurrente puede crear dos negocios

**Evidencia:** `src/application/leads/conversion.ts:33`, `:41`, `:55`, `:73`; `src/infrastructure/db/repos/leads.ts:83`; `src/infrastructure/db/schema.ts:576`.

La conversión lee el estado sin bloquear el lead, crea el negocio y posteriormente actualiza la referencia. No se observó una restricción única sobre `deals.lead_id`.

**Escenario:** dos transacciones leen un lead no convertido; ambas crean un negocio y la última actualización deja una sola referencia desde el lead.

**Verificación:** intercalado posible según el código; no ejecutado en PostgreSQL.

**Corrección:** bloquear el lead antes de decidir o reclamar la conversión mediante actualización condicional, con una restricción de unicidad adecuada y respuesta de conflicto estable.

### F07 — El bloqueo del negocio no garantiza exclusividad de la unidad

**Evidencia:** `src/application/pipeline/cierre.ts:64`, `:116`; `src/infrastructure/db/repos/pipeline.ts:151`.

El cierre protege un mismo negocio, pero marca la unidad como vendida/reservada mediante un update por ID, sin verificar su disponibilidad.

**Escenario:** dos negocios distintos comparten una unidad principal y ambos se cierran. La unicidad de comisión por negocio no impide dos operaciones comerciales sobre la misma unidad.

**Verificación:** falta de condición confirmada; comportamiento concurrente real pendiente.

**Corrección:** coordinar con D11 la regla de disponibilidad, bloquear o reclamar la unidad y verificar su estado antes de materializar cierre, metas y comisiones.

### F08 — Reportes/Dashboard pueden ampliar el alcance

**Evidencia:** `src/infrastructure/db/repos/reportes.ts:23`; `src/infrastructure/db/repos/dashboard.ts:68`, `:79`; `src/app/(crm)/inicio/page.tsx:18`.

Reportes filtra por responsable únicamente cuando `scope === "own"`; `team` cae al filtro global. Esto contradice la regla común de que `team` se comporta como `own`.

Dashboard descarta el alcance devuelto por la guarda de página y decide por `roleSlug === "broker"`. Un rol nuevo con alcance `own` recibe el tratamiento de un rol global.

**Escenario:** una configuración válida de permisos `team`, o un rol personalizado con `dashboard:view own`, obtiene métricas o leads fuera de su alcance.

**Verificación:** código confirmado; esas configuraciones no se probaron en runtime. No se afirma que sean las configuraciones actuales.

**Corrección:** recibir `Actor` y alcances tipados, utilizar `visibleRows` y evitar fallbacks globales ante alcances desconocidos. Revisar también permisos específicos de leads, negocios y métricas globales.

### F09 — Confotur genera planes inconsistentes y permite trabajo ilimitado

**Evidencia:** `src/domain/confotur.ts:75`, `:93`, `:98`, `:102`; `src/app/api/cotizador/confotur/route.ts:21`.

**Reproducciones ejecutadas:**

| Entrada sintética | Resultado |
|---|---|
| Precio 10 000; reserva 9 000; porcentajes por defecto | Pagos totales: **12 000** |
| Precio 200; reserva 0; construcción 100 meses | Última cuota: **−39** |
| Porcentaje inicial 10; restantes por defecto | Excepción de tipo `Error`, que el traductor común convierte en 500 |

`mesesConstruccion` no tiene máximo; controla directamente un bucle que construye un array. Un actor autorizado puede solicitar una cantidad extrema de cuotas.

**Corrección:** preservar suma exacta y no negatividad, validar reserva frente al plan, distribuir residuos con aritmética entera y limitar periodos/tamaño del resultado. Usar `ValidationError` para entradas inválidas.

**Límite:** no se verificó la interpretación legal/fiscal de las tasas, bases o duración de exenciones. Estas reproducciones evalúan aritmética e implementación.

## Hallazgos P2

### F10 — Permisos de mutación y alcances administrativos incompletos

**Evidencia:** `src/app/api/comunicaciones/despachar/route.ts:24`; `src/app/api/comunicaciones/plantillas/[id]/route.ts:26`; `src/app/api/roles/[id]/permisos/route.ts:29`; `src/app/api/papelera/restaurar/route.ts:35`.

- Despachar un mensaje requiere `view`, aunque tiene efectos externos.
- Las plantillas son globales; `own/team` se aceptan y descartan.
- Editar permisos de roles utiliza `settings:edit` sin exigir alcance completo.
- Restaurar una entidad no comprueba alcance ni permiso sobre el recurso restaurado.
- Academy utiliza `view` para mutaciones. Puede ser una decisión válida para progreso propio, pero debe constar en el contrato.

**Escenario:** un rol configurado con alcance limitado actúa sobre recursos globales. En edición de roles, podría ampliar los permisos de un rol no protegido.

**Corrección:** exigir autoridad global para recursos sin propietario o introducir un modelo real de propiedad. Definir permiso de despacho y contrato de progreso propio. No se presume explotación con los roles actuales del seed.

### F11 — La guarda de último administrador tiene una carrera

**Evidencia:** `src/application/usuarios/casos-de-uso.ts:68`, `:71`, `:104`; `src/infrastructure/db/repos/usuarios.ts:63`.

La operación cuenta otros administradores activos y después modifica la fila, sin exclusión común sobre ese conjunto.

**Escenario:** con dos administradores, dos operaciones concurrentes desactivan o eliminan uno cada una. Ambas pueden contar al otro como activo y dejar cero.

**Verificación:** análisis de intercalado; no reproducido en PostgreSQL.

**Corrección:** serializar la operación que preserva el administrador mínimo y añadir una prueba concurrente independiente.

### F12 — RLS no está representado en el esquema Drizzle

**Evidencia:** `src/infrastructure/db/schema.ts:142`, `:832`, `:1003`; `drizzle/0001_enable_rls_public_tables.sql:13`.

La inspección de metadatos devolvió:

```text
Tablas: 29
RLS activado en schema.ts: 0
Activaciones declaradas en migraciones: 29
Tablas migradas sin activación declarada: 0
```

**Escenario:** una futura generación de migraciones puede proponer una desactivación de RLS porque el esquema deseado y el estado de las migraciones discrepan.

**Corrección:** representar `.enableRLS()` en todas las tablas y extender la guarda para comprobar esquema y migraciones. D11 debe revisar el SQL generado.

Las 29 tablas cubiertas son:

| Grupo | Tablas con activación declarada |
|---|---|
| Identidad | `roles`, `users`, `broker_profiles`, `permissions`, `sessions` |
| Catálogos | `pipeline_stages`, `loss_reasons`, `lead_sources` |
| Inventario | `projects`, `units`, `construction_phases` |
| Comercial | `contacts`, `leads`, `deals`, `deal_properties`, `deal_stage_history` |
| Actividad/finanzas | `activities`, `activity_sync`, `goals`, `commissions` |
| Academy | `academy_items`, `academy_checklist_items`, `academy_progress`, `academy_checklist_progress` |
| Operación | `message_templates`, `files`, `notifications`, `integration_accounts`, `audit_log` |

No hay políticas en las migraciones inspeccionadas: es una decisión explícita para impedir acceso directo mediante roles de cliente y operar desde Drizzle. Esa estrategia es coherente con RLS sin políticas, pero no prueba aislamiento de una conexión privilegiada. [Referencia oficial de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

### F13 — Restricciones de negocio insuficientes en base de datos

**Evidencia:** `src/infrastructure/db/schema.ts:835`, `:875`, `:919`; `drizzle/0000_thankful_senator_kelly.sql:36`.

Se encontraron **cero CHECK constraints** tanto en metadatos del esquema como en las migraciones. Los catálogos expresados como `text(..., { enum: ... })` no materializan por sí mismos una restricción SQL.

**Escenario:** un adaptador defectuoso o una escritura administrativa introduce progreso fuera de rango, porcentajes inválidos o estados fuera del catálogo.

**Corrección:** D11 debe definir CHECK/enums SQL para las invariantes pertinentes, incluidos rangos y coherencia de montos. No añadir unicidad en teléfono/correo: la duplicación permitida es una decisión explícita del negocio.

### F14 — Evaluación demo: Host no acredita origen local y logout no la elimina

**Evidencia:** `src/infrastructure/env.ts:47`; `src/infrastructure/auth/actor.ts:35`, `:45`; `src/middleware.ts:59`; `src/app/api/auth/logout/route.ts:8`.

La habilitación exige modo de desarrollo y opt-in, lo cual es una defensa válida. Sin embargo, la condición de localidad depende de la cabecera Host. Si el servidor de evaluación es alcanzable desde otra máquina, esa cabecera no acredita que la conexión sea local.

El logout normal solo llama a Supabase y conserva `qh_dev_role`; cuando no hay usuario de Supabase, esa cookie sigue habilitando un actor de evaluación.

**Corrección:** asegurar el listener/proxy local y retirar la cookie demo en el cierre de sesión común. Documentar que el modo permite elegir identidades reales.

**Límite:** bind, proxy y habilitación efectiva no verificados. No se afirma un bypass en producción.

### F15 — Comunicaciones devuelve éxito simulado y carece de entrega durable

**Evidencia:** `src/infrastructure/comunicaciones/proveedor-despacho.ts:35`, `:50`, `:102`; `src/application/comunicaciones/casos-de-uso.ts:116`.

Email/SMS y mensajería sin configuración pueden devolver `ok:true` sin enviar. No se observó registro durable del despacho, idempotencia, outbox, estado consultable o reconciliación del resultado desconocido.

**Escenario:** el CRM informa éxito sin entrega real; un retry tras timeout puede repetir un envío ya aceptado.

**Corrección:** simulación explícita y acotada al entorno de evaluación; error de configuración cuando corresponda. Para entrega real, diseñar un job durable con deduplicación, timeout, auditoría y tratamiento del resultado desconocido.

### F16 — Audio: el transcriptor no está conectado

**Evidencia:** `src/app/api/ai/audio-transcribe/route.ts:26`; `src/application/ai/casos-de-uso.ts:14`.

La ruta llama al caso de uso sin suministrar `ProveedorTranscripcionAudio`. Un audio sin texto no puede transcribirse.

**Reproducción ejecutada:** llamada con buffer sintético y sin texto/proveedor devolvió transcripción vacía y `requiereConfirmacionHumana:true`.

**Corrección:** conectar el adaptador a través del puerto o rechazar audio mientras no esté disponible. Validar que la propuesta contenga un resultado utilizable. La salida actual no ejecuta operaciones, lo cual es positivo.

### F17 — Validación de parsing, relaciones y límites incompleta

**Evidencia:** `src/app/api/academy/[id]/progreso/route.ts:12`, `:31`; `src/app/api/ai/audio-transcribe/route.ts:7`; `src/app/api/actividades/route.ts:31`; `src/application/actividades/casos-de-uso.ts:72`; `src/infrastructure/db/repos/leads.ts:57`.

Casos concretos:

- JSON inválido en progreso se convierte en `{}` y activa los defaults de completar al 100%.
- Audio/texto carecen de límite de longitud y validación suficiente de MIME/base64.
- Fechas de actividades son strings convertidos a `Date`; faltan validación de formato y orden temporal.
- Editar actividad permite cambiar negocio, contacto, proyecto y responsable sin revalidar esas relaciones.
- Crear lead con `contactId` comprueba existencia, pero no alcance sobre el contacto.
- Varios strings y arrays no tienen máximos.
- No se observó rate limiting en el código de las rutas sensibles; los controles del proveedor o proxy no se verificaron.

**Corrección:** rechazar errores de parsing antes de aplicar defaults; validar fechas y relaciones; limitar cuerpos y cardinalidades; aplicar controles de frecuencia en los puntos de coste o exposición relevantes.

La edición de actividades conserva el hallazgo H32 documentado en el relevo; esta auditoría no lo cierra.

### F18 — Errores de negocio como 500 y mensajes externos sin sanitizar

**Evidencia:** `src/application/academy/casos-de-uso.ts:21`; `src/application/comunicaciones/casos-de-uso.ts:33`, `:49`; `src/infrastructure/contenedor/compartido.ts:36`, `:52`, `:62`; `src/infrastructure/http.ts:72`.

Los módulos nuevos lanzan `Error` para ausencia de recursos o validación. Algunos adaptadores convierten mensajes del proveedor directamente en `ConflictError`, que se devuelve al cliente. El logger común imprime la excepción completa sin redacción.

**Escenario:** recurso inexistente devuelve 500; un mensaje externo expone detalles internos; una excepción sensible queda íntegra en logs.

**Corrección:** errores de dominio adecuados, catálogo de mensajes públicos, redacción estructurada y correlación de soporte. El contrato actual `{error, fields, details}` tampoco cumple el formato Problem Details exigido por D10.

### F19 — Auditoría y consentimiento conservan más datos de los acreditados

**Evidencia:** `src/infrastructure/audit.ts:74`, `:76`; `src/application/leads/casos-de-uso.ts:325`; `src/infrastructure/db/repos/leads.ts:276`.

La auditoría serializa filas completas, incluyendo potencialmente teléfonos, correos, notas y mensajes. No captura IP/agente y no se observó una política implementada de retención o anonimización en el alcance.

El webhook registra `consentAt` al recibir la solicitud, sin recibir evidencia explícita del consentimiento.

**Escenario:** borrar lógicamente un contacto conserva sus datos en auditoría; la marca de consentimiento puede representar recepción en lugar de autorización del interesado.

**Corrección:** definir un DTO de auditoría con minimización, retención y acceso; distinguir recepción y evidencia de consentimiento. No se emite una conclusión de cumplimiento legal.

También faltan actor/auditoría en nuevas mutaciones de Academy y plantillas, aunque la transacción esté abierta.

### F20 — Dashboard y Reportes sustituyen ausencia/error por datos de muestra

**Evidencia:** `src/infrastructure/db/repos/dashboard.ts:192`, `:207`, `:221`; `src/infrastructure/db/repos/reportes.ts:110`, `:139`, `:192`, `:217`.

Se sustituyen ceros y errores de conexión por cifras positivas, leads de muestra y proyecciones constantes. La respuesta no distingue esos datos de resultados reales.

Algunas métricas etiquetadas como mensuales o diarias no aplican el rango temporal correspondiente. Los agregados monetarios tampoco separan monedas antes de presentarse como USD.

**Escenario:** una cartera vacía muestra actividad inexistente; una desconexión produce métricas aparentemente normales; monedas distintas se agregan bajo una misma etiqueta.

**Corrección:** mantener cero como valor válido; declarar estado sin datos/error/demo; aplicar rangos y moneda explícitos. Las muestras deben pertenecer a un adaptador de demostración identificado.

### F21 — N+1, listados ilimitados y escrituras en GET

**Evidencia:** `src/infrastructure/db/repos/academy.ts:50`, `:54`; `src/infrastructure/db/repos/comunicaciones.ts:61`, `:67`.

Academy ejecuta una consulta adicional por contenido tipo checklist. El GET realiza aproximadamente **3 + C consultas**, siendo C la cantidad de checklists. No tiene paginación.

Plantillas se listan sin límite. Si la tabla está vacía, el GET inserta cuatro semillas. Dos lecturas concurrentes pueden sembrar duplicados, al no existir una clave única para ese proceso.

**Corrección:** cargar checklist por lote, definir límites/paginación y mover semillas a una operación explícita e idempotente. Medir antes de priorizar optimizaciones adicionales.

No se midieron p95/p99, memoria, throughput ni planes de ejecución.

### F22 — Verificación de entrega bloqueada por lint

**Evidencia:** ejecución observada de `npm.cmd run lint`; `test.js:1`; `.github/workflows/ci.yml:25`.

**Escenario:** CI falla en lint y no alcanza las comprobaciones posteriores de build/test.

**Corrección:** el propietario del código debe determinar el propósito del archivo binario y corregir su inclusión. D14 debe repetir la cadena de verificación sobre el snapshot revisado. No se modificó ese archivo.

### F23 — Los candados estructurales no acreditan comportamiento

**Evidencia:** `src/infrastructure/seguridad.test.ts:22`, `:50`; `src/application/leads/casos-de-uso.test.ts:321`, `:358`, `:400`.

La guarda de permisos comprueba una llamada mediante regex por archivo; no comprueba cada handler, su ejecución, el permiso adecuado o el uso del alcance. La guarda RLS lee activaciones declaradas, no la base real.

Las pruebas del webhook cubren repetición con teléfono/correo y una entrega sin ambos, pero no combinan repetición con ausencia de identificadores de contacto. Por eso 358 pruebas pueden pasar con F05 presente.

**Corrección:** conservar las guardas estructurales y añadir pruebas de comportamiento que ejerciten permisos negativos, respuestas autorizadas, efectos completos y concurrencia real.

## Hallazgos P3

### F24 — Documentación y contratos no describen el estado observado

**Evidencia:** `docs/R_RELEVO.md:19`, `:22`, `:35`, `:82`; `docs/contexto/arquitectura.md:45`, `:133`, `:155`.

El relevo declara otra rama, 334 pruebas y presenta dos siguientes pasos diferentes. La arquitectura sigue describiendo únicamente Contactos como migrado, pese a los módulos existentes.

No se localizó un contrato OpenAPI versionado durante las búsquedas realizadas. **Esto no constituye prueba exhaustiva de ausencia en todas las fuentes del proyecto.**

**Corrección:** actualizar estado y arquitectura mediante sus propietarios; D03 debe consolidar contratos de operaciones, errores, alcances, simulación y compatibilidad. Mantener `decisiones.md` como registro aditivo.

## Qué está bien hecho

- **Separación de capas comprobada:** las pruebas confirman dominio sin dependencias externas, aplicación sin Next/Drizzle/Supabase e infraestructura sin imports de `app`.
- **Puertos útiles:** unidad de trabajo, auditoría, almacenamiento y Auth administrativo permiten probar casos de uso sin proveedores.
- **Transacción compartida:** `src/infrastructure/db/repos/compartido.ts:27` construye repositorios ligados al mismo `tx`; la auditoría utiliza esa transacción.
- **Identidad server-side:** `src/infrastructure/auth/actor.ts:33` usa `getUser` y comprueba usuario CRM activo/no borrado; no autoriza con metadatos editables del usuario.
- **Deny por defecto:** ausencia de permiso significa `none`; el filtro SQL de `none` produce `false`.
- **Filtro común:** `visibleRows` centraliza responsable y papelera en los módulos principales.
- **Administración de usuarios:** las rutas utilizan `requireFullScope`; el rol protegido y el administrador mínimo tienen controles funcionales, aunque falte cubrir la carrera.
- **Comisiones:** bloqueo selectivo `FOR UPDATE OF commissions`, estados válidos y auditoría transaccional.
- **Cierre del mismo negocio:** bloqueo y relectura del estado, unicidad de comisión y upserts de metas con incrementos atómicos.
- **Webhook:** token verificado antes de procesar datos y upsert del lead ajustado al índice parcial.
- **Escrituras:** predominan asignaciones campo por campo. Los spreads de DTO construidos explícitamente no equivalen a persistir un body arbitrario.
- **CSV:** neutralización de fórmulas, escape y exportación con alcance.
- **Storage:** bucket privado en `db/seed.sql:153`, UUID en nombres, lista MIME que excluye SVG y URLs firmadas.
- **Conexión:** pool único, construcción diferida y reutilización en desarrollo.
- **Datos:** dinero en centavos sobre bigint SQL, instantes con zona e índices sobre responsable, estado, fechas y relaciones.
- **HTTP:** 500 genérico, mensajes uniformes de login/recuperación y cabeceras de seguridad comunes.

Estas fortalezas no cierran los hallazgos anteriores.

## Cobertura y pruebas pendientes

La suite consta de **41 archivos de pruebas** y **358 casos**. Cubre reglas puras, RBAC, filtros SQL construidos, transiciones, cálculos, formatos, casos de uso con dobles reversibles y guardas textuales de arquitectura/seguridad.

No se obtuvo un porcentaje de cobertura de código.

| Área | Evidencia actual | Falta para acreditar |
|---|---|---|
| RBAC | Reglas, filtros y algunos casos negativos | Cada handler, rol limitado y salida sensible |
| RLS | Activaciones SQL declaradas | Estado real, grants y acceso anon/authenticated |
| Transacciones | Rollback en dobles | Rollback real y aislamiento PostgreSQL |
| Concurrencia | Guardas de bloqueos/upserts | Dos conexiones, carreras y recuperación |
| Webhook | Repetición con contacto reconocible | Sin teléfono/correo, payload conflictivo y borrados |
| Academy | Progreso/checklists en memoria | SQL real, contenido inactivo, auditoría y carreras |
| IA | Caso de uso con transcriptor inyectado | Wiring HTTP y rechazo de audio sin proveedor |
| Confotur | Casos estándar y suma de porcentajes | Invariantes monetarias y límites de tamaño |
| Comunicaciones | Renderizado y proveedor falso | Auth, SSRF, simulación, timeout y deduplicación |
| Auth demo | Revisión de código | Host manipulado, logout y exposición real |
| Reportes/Dashboard | Revisión de consultas | Scope personalizado, cero, offline, fechas y moneda |

## Handoff

**Estado:** análisis entregado en esta respuesta; archivo solicitado pendiente de actualización por la restricción de solo lectura. El archivo existente contiene el bloqueo anterior. No hay cambios de código ni hallazgos cerrados por D10.

**D10 / propietario de implementación**

- Corregir wiring de audio, respuestas de precios, validaciones y contratos de entrega.
- Diseñar idempotencia que abarque todos los efectos del webhook.
- Sustituir éxitos simulados y métricas de muestra por estados explícitos.
- Aplicar cambios mediante el flujo de implementación autorizado del proyecto.

**D12 — revisión independiente de seguridad**

- Revisar F01–F04, F08, F10, F14 y F18–F19.
- Validar permisos con dos responsables dentro de una organización: `none`, `own`, `team`, `all` y roles personalizados.
- Ejercitar precios en respuestas, duplicados globales, plantillas y edición de permisos.
- Confirmar retirada/rotación de credenciales sin incluir valores en evidencia.
- Reproducir SSRF exclusivamente con un receptor controlado en sandbox.

**D11 — revisión independiente de datos**

- Confirmar RLS y grants reales con consultas que devuelvan únicamente nombres y booleanos.
- Revisar representación RLS en el esquema, restricciones, conversión única y exclusividad de unidad.
- Definir retención/minimización de auditoría y semántica de consentimiento.
- Ejecutar las carreras F06, F07 y F11 en una base aislada.

**D14 — validación independiente**

- Reproducir los resultados sintéticos de F05 y F09.
- Ejecutar dos solicitudes concurrentes de conversión y cierre sobre una unidad compartida.
- Comprobar que JSON inválido no completa formación y audio sin proveedor no devuelve éxito útil.
- Cubrir cero/error/demo en métricas y entrega.
- Repetir typecheck, lint, tests, build e interfaz tras las correcciones; build debe ejecutarlo el actor autorizado.
- Registrar snapshot, fixtures, resultado esperado/observado y evidencia saneada.

**D03/D00**

- Resolver discrepancias del relevo y consolidar contratos.
- Incorporar estos hallazgos al alcance permitido del milestone.
- Obtener revisión independiente antes de declarar aceptación. **Este informe no aprueba C1, gates, release ni su propio contenido.**