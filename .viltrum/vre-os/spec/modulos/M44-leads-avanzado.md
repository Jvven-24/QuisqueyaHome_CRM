---
id: M44
nombre: Leads avanzado — asignación, importación y fusión controlada
estado: REVIEW
riesgo: R3
owner: D10
revisores: [D02, D03, D04, D11, D12]
fuente_de_verdad: PostgreSQL del CRM
depende_de: [M01, M40, M41, M42, M43, M47, M50]
actualizado: 2026-10-18
---

# M44 · Leads avanzado

**Alcance solicitado:** completar las pantallas P0 UI-007, UI-008 y UI-009 para una sola empresa, Quisqueya Home. Esta ficha documenta contratos y propuestas para revisión; no aprueba G1/G2 ni autoriza construcción.

**Fuentes funcionales:** `backlog-Pantallas.csv:11-13`, `backlog-Configuraciones.csv:21-30`, `backlog-Datos.csv:27,37-40,193,212-214`, `backlog-QA.csv:19-21` y `especificacion-maestra-v1.txt:1140-1192`. Los requisitos y configuraciones de esas filas constan como “Por validar”; no son respuestas confirmadas del cliente.

## 1. Propósito y usuarios

### Problema y evidencia

El flujo actual permite asignar un lead individual, pero no acredita una distribución por reglas que explique cada selección y descarte. Tampoco ofrece las rutas para importar lotes ni revisar y fusionar registros duplicados. En la auditoría del 18-oct, las tres rutas de la ficha respondieron 404; la asignación existente fue clasificada como parcial y la importación como faltante (`auditoria-2026-10-18/qa-G1.md:96-100`, `matriz-G1.md:88-100`).

La auditoría de QA también registró dos leads con el mismo nombre y teléfono en su entorno de evaluación. La causa y su correspondencia con datos comerciales reales no se determinaron (`qa-G1.md:90-93`).

### Usuarios y tareas

- **Administrador:** supervisa distribución, importaciones y resolución de duplicados mediante permisos de alcance total.
- **Asistente y broker:** conservan sus permisos actuales sobre la cartera que ya pueden consultar. No reciben acceso masivo por trabajar en estas pantallas.
- **Coordinador, gerente y administrador de datos:** son etiquetas de UI-007 a UI-009, no roles identificados en el catálogo actual. D02 debe mapear esas responsabilidades a los roles y permisos vigentes.
- **Revisor KYC designado:** puede consultar los campos documentales restringidos de los expedientes que tiene asignados. Este acceso no concede permiso general de importación o fusión.

La instalación actual contempla los roles `admin`, `assistant` y `broker`; M43 prohíbe añadir roles nuevos en este recorte de una sola empresa (`M43-inicio-acceso.md:27,31-33`).

### Resultado verificable

- Ningún lead se asigna a un usuario inactivo, ausente, sobre capacidad o no elegible para el proyecto.
- La simulación muestra el motivo de inclusión o descarte de cada candidato.
- Cada fila importada termina con un resultado consultable y repetible por origen e identificador externo.
- Ninguna fusión elimina la historia de origen, relaciones o pagos; sus valores finales y procedencia quedan explicados en un manifiesto.
- Las cifras objetivo de SLA, volumen y rendimiento quedan pendientes de respuesta a las preguntas de §9.

### Clasificación y línea base

Solución: **CRM/ERP**, extensión P0 de Leads. Riesgo **R3** por datos personales, conflictos de titularidad comercial y posibles referencias a obligaciones financieras (`.viltrum/project.md:1-16`; `M43-inicio-acceso.md:17-27`).

Línea base aplicable de CRM: auditoría, permisos granulares, importación/exportación autorizada, búsqueda, borrado lógico recuperable e historial de interacciones (`expected-capabilities.md`, sección “CRM / ERP”). Para M44 se concreta en permisos de servidor, manifiesto de fusión, errores de importación descargables con control de acceso y conservación de relaciones. No se introduce una exportación masiva nueva.

## 2. Estado actual (AS-IS)

| Área | Hecho comprobado |
|---|---|
| Pantallas | `/leads/asignacion`, `/datos/importaciones` y `/datos/duplicados` no existen en el flujo probado; QA registró 404 (`auditoria-2026-10-18/qa-G1.md:96-100`). |
| Leads y contactos | `contacts` tiene teléfono, correo, fuente, responsable, consentimiento y borrado lógico; los índices de teléfono y correo no son únicos (`src/infrastructure/db/schema.ts:574-603`). `leads` conserva contacto, proyecto, interés, fuente, campaña, responsable, `externalId` y borrado lógico (`schema.ts:610-670`). |
| Asignación actual | `PATCH /api/leads/:id` valida `brokerId`, requiere actor y `leads:edit`, y llama a `asignarResponsableDeLead` (`src/app/api/leads/[id]/route.ts:18-34`). El caso actual verifica responsable, estado y alcance; no implementa simulación, reglas versionadas, capacidad o asignación por lotes (`src/application/leads/casos-de-uso.ts:194-220`; `matriz-G1.md:88-94`). |
| Actividades | Existe `activities` con referencia al lead, asignado, fecha, estado, prioridad y borrado lógico; puede alimentar tareas de seguimiento (`src/infrastructure/db/schema.ts:807-843`). |
| Idempotencia y referencias externas | `leads.external_id` tiene unicidad parcial para leads no borrados (`schema.ts:646-660`). `external_refs` mapea entidad, ID local, sistema e ID externo y tiene RLS (`schema.ts:1317-1329`). `transaction_commands` guarda una clave e ID público para comandos financieros; su reutilización para M44 requiere revisión D11 (`schema.ts:1362-1384`). |
| Archivos y auditoría | `files` guarda metadatos, visibilidad y borrado lógico, pero ese esquema no acredita almacenamiento privado, escaneo antimalware ni caducidad de objetos (`schema.ts:1182-1203`). `audit_log` ya registra actor, acción, entidad y valores previos/nuevos (`schema.ts:1256-1277`). |
| Permisos | El catálogo de acciones existentes admite `view`, `create`, `edit`, `delete`, `import` y `export`; los recursos también son cerrados (`src/domain/catalogs.ts:18-66`). `requireScope`, `requireFullScope`, `reaches` y `visibleRows` son los mecanismos para verificar acceso (`src/domain/rbac.ts:73-133`; `src/infrastructure/rbac-filter.ts:23-39`). |
| Autorización de proyecto | M47 propone concesiones por proyecto, pero M43 indica que `broker_project_grants` no está en el esquema leído (`M43-inicio-acceso.md:54`; `M47-inventario.md:147-158`). El `broker_id` actual no basta para demostrar acceso a un proyecto. |
| M40 y migraciones | El esquema contiene la expansión de M40 y `transaction_commands` (`schema.ts:1349-1384`). La tarea refiere migraciones M40 hasta `0011`; el journal del árbol revisado termina en `0010_m40_backfill_legado` y no se encontró archivo `0011`. D11 debe conciliarlo antes de fijar la numeración de M44. No modificar ni rehacer las tablas financieras M40. |
| Bróker claims | M50 separa claims de broker, disputa de titularidad y fusión de contactos. Sus reglas no autorizan resolver conflictos por fecha de importación ni convertir un claim en fusión (`M50-red-brokers.md:143-151`). |

La matriz G1 advierte una discrepancia H16 alrededor de la reasignación individual. El caso de uso leído actualmente exige rol `admin` y alcance `all`, pero D12 debe probar la autorización efectiva al diseñar las nuevas operaciones; la matriz no certifica por sí sola una vulnerabilidad explotable (`casos-de-uso.ts:211-218`; `matriz-G1.md:88-94`).

## 3. Pantallas

D04 ubica UI-007 y UI-009 como pestañas del módulo Leads y UI-008 como acción contextual desde Leads y Contactos, además de la sección de datos de Configuración (`auditoria-2026-10-18/D04-arquitectura-ui.md:111-113,223-225`). En este recorte no hay selector de empresa ni filtros por sucursal.

### Roles y permisos

| Perfil vigente o etiqueta de trabajo | UI-007 Asignación | UI-008 Importación | UI-009 Duplicados |
|---|---|---|---|
| `admin` | Ver y actuar solo con `leads:view:all` y `leads:edit:all`; reglas de configuración requieren permiso de edición total. | Ver y actuar con `leads:import:all` o `contacts:import:all`, según entidad. | Consultar con alcance autorizado; fusionar con permisos de edición y borrado total. |
| `assistant` | No ve ni modifica reglas globales. | Sin acceso global, salvo permiso explícito aprobado por D02. | Puede proponer una coincidencia solo con permiso y alcance de lectura; no fusiona. |
| `broker` | Solo cartera actual desde `/leads`; no administra reglas ni lotes. | No ve importaciones globales. | No ve comparaciones fuera de su alcance ni ejecuta fusiones. |
| Coordinador / gerente / administrador de datos | No son roles actuales. Denegado hasta que D02 los mapee a roles y permisos vigentes; no crear roles nuevos en M44. | Igual. | Igual. |
| Revisor KYC designado | Sin administración por defecto. | Sin acceso salvo permiso de importación aprobado. | Puede revelar el detalle documental restringido solo en el expediente asignado; no adquiere permiso de fusión automáticamente. |

Toda API comprueba actor y permiso antes de consultar datos. Los IDs de ruta son públicos; el acceso a cada fila vuelve a comprobar alcance y devuelve 404 si el actor no la alcanza.

### 3.1 UI-007 — Asignación y distribución

**Ruta:** `/leads/asignacion`. Entrada: pestaña “Asignación y reglas” de Leads. La configuración principal separa regla versionada, simulación de lote y cola supervisada.

**Campos y contenido:** regla y prioridad; modo de reparto; agentes activos elegibles; capacidad configurada y ocupación calculada; ausencias; cobertura de proyecto; idioma; filtros por proyecto, idioma, responsable previo y estado SLA; explicación de candidato seleccionado y de cada descarte.

**Acciones:** simular lote; activar una versión de regla; distribuir lote; transferir cartera con motivo y plan para actividades pendientes; pausar o reactivar un agente para el ruteo. Sin candidatos elegibles, la fila queda en cola supervisada con el motivo. Una regla comercial no amplía permisos de proyecto. Estas reglas aparecen en UI-007 y QA-015 (`backlog-Pantallas.csv:11`; `backlog-QA.csv:19`).

**Reglas aún por validar:** modo manual/round-robin/ponderado, SLA, horas laborables, capacidad y política para agente inactivo están en CFG-020 a CFG-024 como propuestas no aprobadas (`backlog-Configuraciones.csv:24-28`). No aplicar sus valores sugeridos por defecto.

**Estados:** carga, skeleton de reglas y candidatos; vacío, explicar que no hay leads pendientes y ofrecer simular; error, mensaje seguro con reintento; sin conexión, conservar el último resultado identificado como desactualizado y bloquear activación; éxito, mostrar filas asignadas, en cola y motivos; permiso insuficiente, denegar sin exponer candidatos ni conteos.

**Móvil:** a 390 px, cabecera compacta, selector de regla, filtros en hoja inferior, lista de resultados como tarjetas y acciones con confirmación al pie. A 1440 px, cabecera y filtros en una fila, editor de regla junto a la simulación tabular y cola con motivo visible. No hacer que arrastrar sea requisito.

**Componentes:** reutilizar la tabla existente (`src/components/ui/data-table.tsx`); propuestos: pestañas, hoja inferior, formulario segmentado, tabla de candidatos y diálogo de confirmación. IDs PXIL para M44 y wireframes visuales P3: **NO VERIFICADO**; D05 debe seleccionarlos antes de diseño final.

### 3.2 UI-008 — Importación y migración

**Ruta:** `/datos/importaciones`. Entrada contextual “Importar” desde Leads y Contactos; acceso administrativo desde Datos en Configuración según el sitemap D04.

**Asistente por pasos:**

1. Archivo: entidad permitida (`contacts` o `leads`), CSV/XLSX, nombre, codificación y encabezados.
2. Mapeo: columnas de origen, campos destino, sistema origen e identificador externo.
3. Validación en seco: válidos, duplicados, rechazados, advertencias y posibles actualizaciones.
4. Confirmación y seguimiento: resultado por fila, progreso reanudable y reversión elegible.

Filtros de resultados: creados, actualizados, duplicados, rechazados, advertencias y revertibles. Acciones: subir archivo privado, mapear, previsualizar, descargar errores, confirmar, consultar/reanudar y revertir solo creaciones no vinculadas. Una fila inválida no detiene el diagnóstico del resto. Fórmulas de hojas se leen como valores; no se ejecutan. Una repetición con el mismo origen e ID externo no duplica la entidad. No sobrescribir consentimiento ni precios aprobados sin regla explícita (`backlog-Pantallas.csv:12`; `especificacion-maestra-v1.txt:1155-1170`; `QA-017`, `backlog-QA.csv:21`).

**Estados:** carga, mostrar fase real y conteos confirmados; vacío, ofrecer un archivo de ejemplo no personal y explicar el inicio; error, conservar el diagnóstico sin datos internos; sin conexión, bloquear confirmación y mostrar el estado persistido del job; éxito, mostrar conteos y filas de resultado; permiso insuficiente, ocultar archivo, errores y totales.

**Móvil:** a 390 px, pasos apilados, selección de archivo accesible, resumen en tarjetas y CTA etiquetada. A 1440 px, stepper y resumen de lote arriba, errores tabulares con filtros y acción de descarga separada. Sin formularios de más de siete campos en una vista.

**Componentes:** propuesta de stepper, selector de archivo, mapeador de columnas, tabla de errores, resumen y confirmación; `DataTable` existente cuando corresponda. IDs PXIL y wireframe P3: **NO VERIFICADO**, pendiente de D05.

### 3.3 UI-009 — Duplicados y fusión controlada

**Ruta:** `/datos/duplicados`. Entrada: pestaña “Duplicados” en Leads/Contactos y alerta contextual en la ficha. El alcance inicial opera sobre identidades de contacto; no fusiona leads como si fueran una sola demanda. Cada lead conserva fuente, interés y contexto aunque se confirme que dos contactos son la misma persona.

**Lista y comparación:** filtros por entidad, nivel de señal, origen, propietario, coincidencia de teléfono/correo y conflicto documental. Cada candidato muestra los dos registros, señales, campos en conflicto y relaciones asociadas. No mostrar documento KYC al usuario que no sea su revisor autorizado. Teléfono o nombre compartidos generan sugerencia, no identidad probada; un teléfono familiar no fuerza fusión (CFG-019; `backlog-Pantallas.csv:13`; `backlog-QA.csv:20`).

**Acciones:** comparar; elegir registro superviviente; seleccionar el valor final por campo permitido; fusionar con manifiesto; marcar “no es duplicado”; consultar historial y solicitar reversión controlada si el manifiesto y versiones permiten restaurar sin pisar cambios posteriores. Los conflictos de titularidad del broker van a revisión/disputa M50; la importación no decide el propietario (`backlog-Pantallas.csv:13`; `M50-red-brokers.md:143-151`).

**Estados:** carga, candidatos y señales; vacío, explicar que no hay coincidencias pendientes; error, mantener la decisión sin confirmar y ofrecer reintento; sin conexión, bloquear fusión y no guardar una decisión local con PII; éxito, mostrar superviviente, alias y manifiesto; permiso insuficiente, denegar sin revelar los datos de la contraparte.

**Móvil:** a 390 px, registros apilados y selección de valor por campo en pasos; resumen y botón de fusión con confirmación. A 1440 px, candidatos en tabla, comparación lado a lado, conflictos por atributo y manifiesto accesible desde la ficha.

**Componentes:** tabla, comparación, selector por campo, indicador de coincidencia y diálogo de confirmación; IDs PXIL y wireframe P3: **NO VERIFICADO**, pendiente de D05.

## 4. Funciones y contratos de API

Los nombres de endpoints son propuestas; hoy no están implementados. Todos los cuerpos y parámetros mutables usan Zod estricto y asignación campo por campo. Errores no incluyen SQL, trazas, tokens ni PII ajena.

| Caso / contrato propuesto | Entrada y resultado | Regla, permisos e idempotencia |
|---|---|---|
| Consultar reglas y candidatos: `GET /api/leads/asignacion` | Filtros por proyecto, idioma, capacidad, responsable previo y estado SLA. | `requireActor` + `requireScope(leads, view)` antes de datos. Contadores con el mismo predicado de filas autorizado. |
| Guardar/activar reglas: `POST /api/leads/asignacion/reglas`, `POST /api/leads/asignacion/reglas/:publicId/activar` | Zod: nombre, criterios tipados, pesos no negativos, condiciones y `expectedVersion`. Devuelve regla/versionado o 409 por versión obsoleta. | `leads:edit:all` y `settings:edit:all`; no permitir que regla otorgue permisos. Activación auditada. |
| Simular: `POST /api/leads/asignacion/simulaciones` | Zod: versión, filtros y lote seleccionado. Devuelve destino previsto y razón por candidato, sin modificar leads. | `leads:view:all`; vuelve a resolver elegibilidad y capacidad al ejecutar. |
| Distribuir: `POST /api/leads/asignacion/lotes` | `Idempotency-Key`, `publicId` de simulación y versión esperada. Devuelve resumen por resultado. | `leads:edit:all` y creación autorizada de actividades. Repetición de mismo actor/clave/hash devuelve el resultado; misma clave con contenido distinto da 409. |
| Transferir cartera / pausar agente | `POST /api/leads/asignacion/transferencias`; `PATCH /api/leads/asignacion/agentes/:publicId/pausa`. Zod: filas, destino, motivo y plan de actividades. | Alcance total, motivo obligatorio, comprobar estado y M47 en servidor; una transacción actualiza cartera, actividades y auditoría. |
| Crear, mapear y validar importación: `POST /api/datos/importaciones`, `PATCH /api/datos/importaciones/:publicId/mapeo`, `POST /api/datos/importaciones/:publicId/previsualizar` | Metadatos Zod; archivo por puerto de almacenamiento privado. Resultados por fila con códigos de error y conteos. | `leads:import:all` o `contacts:import:all`; archivos privados, escaneados y caducables. Sin capacidad de escaneo/almacenamiento comprobada, no confirmar el lote. |
| Confirmar/revertir importación | `POST /api/datos/importaciones/:publicId/confirmar`, `POST .../:publicId/revertir`, `GET .../:publicId`, `GET .../:publicId/errores`. | Clave idempotente; revisar estado del job y acceso a la fila antes de datos. Reversión solo para registros que cumplan el criterio de vínculo/versión. Descarga requiere permiso de exportación (`CFG-013`). |
| Consultar duplicados: `GET /api/datos/duplicados`, `GET /api/datos/duplicados/:publicId` | Filtros y comparación autorizada, sin datos de otra cartera. | `contacts:view` con `visibleRows`/`reaches`; 404 si el actor no alcanza la fila. |
| Fusionar, descartar coincidencia, revertir | `POST /api/datos/duplicados/:publicId/fusionar`, `POST .../:publicId/no-duplicado`, `POST .../:publicId/revertir`. Zod: superviviente, selección de campos, motivo, versiones y clave. | `requireFullScope(contacts, edit/delete)` antes de datos; revalidar cada contacto y relación. Transacción, bloqueo y 409 por versión/cambio concurrente. |

En todo endpoint por ID se reautoriza la fila; ocultar botones no sustituye autorización. Las operaciones internas escriben auditoría en la misma transacción. No emitir eventos al outbox hasta que exista consumidor registrado y contrato revisado.

## 5. Datos y límites de persistencia

Este modelo es **lógico y propuesto** para D03/D11; no es DDL aprobado.

### Reutilizar

- `leads.broker_id` conserva el responsable actual; `contacts` y `leads` conservan sus identidades internas.
- `activities` sirve para tareas de seguimiento y relaciones.
- `audit_log` es bitácora de acciones; no almacena documentos KYC ni el archivo original.
- `files` puede servir como referencia de metadatos, pero no acredita por sí solo un bucket privado ni escaneo.
- Reutilizar `external_refs` si el identificador de sistema puede distinguir inequívocamente origen y tipo de entidad. Su restricción actual es única por sistema+ID externo; D11 debe verificar si sirve para IDs repetidos entre entidades. Si no, proponer `external_mappings` con unicidad por origen+entidad+ID externo.
- No cambiar ni borrar obligaciones, reservas, pagos, liquidaciones o snapshots M40. M40 utiliza FK restrictivas, comandos idempotentes y estados protegidos (`M40-transaccion.md:256,281,398`; `schema.ts:1362-1384`).

### Tablas lógicas nuevas propuestas

| Objeto | Campos/reglas principales |
|---|---|
| `routing_rules` | Nombre, activa, versión activa, actor y fechas; archivo lógico, no borrado físico de historia. |
| `routing_versions` | Regla, número de versión, criterios tipados, pesos, vigencia y autor. Inmutable al activar. No contiene grants. |
| `agent_capacity` | Usuario, cola/proyecto, límite y ausencia hasta fecha. Conteo calculado sobre leads activos; no confiar en contador escrito por el cliente. |
| `assignments` | Historial append-only de lead, origen/destino, motivo, versión de regla, actor, vigencia y lote. `leads.broker_id` sigue siendo responsable actual, actualizado en la misma transacción. |
| `import_jobs` | Entidad, origen, archivo privado, huella, mapeo/versionado, estado, conteos, caducidad, actor y resultado. |
| `import_rows` | Job, número de fila, external ID, resultado, códigos de error y huellas de cambios; no conservar PII duplicada en errores sin política aprobada. Unicidad job+fila. |
| `contact_aliases` | Contacto superviviente, tipo/valor de alias e historial de origen. Puede contener teléfono/correo: acceso restringido y sin unicidad global de canales compartidos. |
| `merge_jobs` | Superviviente, absorbido, valores elegidos, versiones previas, motivo, actor, decisión, estado e historial/manifiesto. No sustituye `broker_claims` de M50. |

Toda tabla nueva tendrá `.enableRLS()` en Drizzle y `ENABLE ROW LEVEL SECURITY` en migración; sin políticas abiertas a la Data API. IDs internos no se exponen; objetos de API usan UUID público. FKs históricas no se borran en cascada. Reglas mutables se archivan; eventos, manifiestos y `assignments` son append-only. Contactos absorbidos usan borrado lógico y alias, nunca borrado físico. La política de retención y purga de archivos/filas se resuelve antes de READY.

No añadir `tenant_id`, sucursales, membresías ni roles nuevos en este recorte: la decisión #51 fija una sola empresa y M43 reitera esa condición (`M43-inicio-acceso.md:17-18,27`).

## 6. Integraciones, puertos y OSS

D21 recomienda para Leads evaluar Papa Parse y `libphonenumber-js`, y estudiar TableFlow como mapeador; los componentes solo leen/normalizan y no deciden reglas comerciales (`D21-ensamblaje-oss.md:34,113`).

- **Candidatos OSS:** Papa Parse para CSV; `read-excel-file` para lectura acotada de XLSX; `libphonenumber-js` para normalización telefónica; TableFlow para el mapeo visual si pasa PoC de React 19. D21 registra discrepancia de versiones para `libphonenumber-js` y artefacto/compatibilidad pendientes para XLSX/TableFlow (`D21-ensamblaje-oss.md:225-228`).
- **Condición de adopción:** D12 confirma licencia y artefacto exacto que se instalaría; D09 prueba compatibilidad, accesibilidad y límites. La referencia local a MIT en D21 no acredita el artefacto final.
- **Propio del CRM:** elegibilidad, capacidad, reglas versionadas, simulación, idempotencia, merge, alias, reubicación de relaciones, auditoría, estados y límites de autorización. El parser nunca escribe directamente entidades.
- **Pendiente de proveedor:** almacenamiento privado y escáner antimalware de archivos de importación. Proveedor, límites, cuota, fallo y caducidad quedan **NO VERIFICADOS**; D16/D12 los resuelven antes de confirmar cargas.

Los puertos de parser, almacenamiento, escaneo y normalización van detrás de interfaces propias; dominio/aplicación no importan librerías proveedoras. No se añade servicio de cola externo sin decisión y contrato de fallo/reintento.

## 7. Métricas y reportes

M44 alimenta, sin cifras fijas:

- **Distribución:** leads asignados, en cola y excluidos por motivo; ocupación por agente; tiempo entre recepción y primera acción humana, separado de una automatizada.
- **Importación:** filas leídas, válidas, creadas, actualizadas, duplicadas, rechazadas, advertidas y revertidas; duración y fallos por lote/origen.
- **Duplicados:** candidatos por tipo de señal, marcados como no duplicados, fusiones, reversiones y conflictos derivados a revisión.

Toda métrica se filtra por permisos de la persona que consulta. Los umbrales de SLA, tamaños, tiempos objetivo y volumen no tienen aprobación documentada; se solicitan en §9. No sumar presupuestos de monedas diferentes.

## 8. Criterios de aceptación verificables

1. **Acceso por rol (API + UI):** dado un actor sin alcance total, cuando abre cualquiera de las rutas administrativas o llama a su API, entonces recibe estado de permiso insuficiente y no obtiene conteos, archivos ni PII. Broker/assistant conserva únicamente la lectura que permita su alcance actual.
2. **Reautorización por ID (API):** dado un ID válido fuera del alcance del actor, cuando consulta, confirma, fusiona o revierte, entonces la API responde 404 y no modifica ninguna fila.
3. **Elegibilidad (unitaria + PostgreSQL):** dado un agente inactivo, ausente, sin cobertura de proyecto o sobre capacidad, cuando se simula y distribuye, entonces no recibe el lead y la simulación presenta la razón.
4. **Concurrencia (PostgreSQL con dos conexiones):** dadas dos operaciones simultáneas sobre el mismo lead o capacidad, cuando se confirman, entonces no existe doble responsable ni exceso de capacidad; la operación perdedora recibe 409.
5. **Regla versionada (API + PostgreSQL):** dada una regla activa, cuando se previsualiza una nueva versión, entonces no cambia la actual; al activar con versión esperada válida, el historial y auditoría identifican actor, versión y momento.
6. **Actividad de seguimiento (PostgreSQL):** dado un lote distribuido, cuando se confirma, entonces cada lead asignado tiene exactamente una actividad de seguimiento. El vencimiento usa únicamente el SLA/calendario aprobado; sin esa configuración el sistema no inventa una fecha límite.
7. **Importación por fila (parser + API):** dado un archivo CSV/XLSX con filas válidas e inválidas, cuando se previsualiza, entonces toda fila tiene resultado y la inválida no impide diagnosticar las demás. Celdas tipo fórmula se leen como texto/dato y no se ejecutan.
8. **Idempotencia de lote (PostgreSQL + API):** dado el mismo origen e identificador externo, cuando se reimporta o repite confirmación, entonces no aparece un duplicado; la misma clave con cuerpo distinto responde 409.
9. **Límites de importación (seguridad + integración):** dado almacenamiento privado con escaneo y retención aprobados, cuando se carga, entonces el archivo queda privado y caduca conforme a política. Si falla o falta el escáner, el lote no puede confirmarse. Errores descargables no revelan PII ajena.
10. **Reversión de importación (PostgreSQL):** dadas filas creadas por un job y sin relaciones o cambios posteriores, cuando se revierte, entonces solo se revierten esas filas. Una fila vinculada o con versión posterior se conserva y aparece como no reversible con motivo; no se modifica ningún pago u obligación M40.
11. **Teléfono familiar (unitaria + PostgreSQL):** dados dos contactos con teléfono compartido y demandas distintas, cuando el sistema detecta coincidencia, entonces propone revisión sin fusionarlos automáticamente; “no es duplicado” conserva ambos historiales y fuentes.
12. **Fusión y manifiesto (PostgreSQL + API):** dado un par confirmado por usuario autorizado, cuando se fusiona, entonces la operación es transaccional, conserva aliases, relaciones, actividades, pagos y eventos, registra valor final y procedencia por campo y no altera importes/estados M40. Un fallo inyectado revierte todos los cambios.
13. **Disputa de titularidad (API + PostgreSQL):** dado un conflicto de broker, cuando se revisa una coincidencia o se intenta fusionarla, entonces queda derivada a la revisión correspondiente; la fecha de importación no elige titular.
14. **RLS y estados (guardas + UI):** todas las tablas nuevas tienen RLS en esquema/migración. Las tres pantallas muestran carga, vacío, error, sin conexión, éxito y permiso insuficiente en 320, 390, 768 y 1440 px; las acciones no dependen solo de color ni quedan deshabilitadas sin explicación.

## 9. Fuera de alcance y preguntas abiertas

### Exclusiones

- Multiempresa, sucursales, selector de empresa y `tenant_id`.
- Nuevos roles, MFA/AAL2 e invitaciones complejas.
- Workflows multinivel, arbitraje financiero, scoring/IA y procesos P1.
- Importación de propiedades, pagos, reservas, contratos o comisiones.
- Fusión automática por nombre/teléfono, fusión entre empresas o resolución automática de conflictos de broker.
- Cambios a transacciones M40, sus importes, estados, pagos, liquidaciones o beneficiarios.

### Preguntas que bloquean G1

Los CFG de captación/ruteo están “Por validar”. No hay respuestas de cliente ni artefactos de importación anexos; `.viltrum/client-inputs.md` contiene solo el encabezado.

- [ ] Q-001 ¿Cómo se asignan las funciones de coordinador, gerente, administrador de datos y revisor KYC a los roles existentes, y quién puede activar reglas, importar, descargar errores, proponer y confirmar una fusión? · a:cliente · bloquea:G1 · dep:D02,D12 · prioridad:P0
- [ ] Q-002 ¿Cuál es el calendario real, definición de primera respuesta humana, SLA, política de ausencia, capacidad máxima y excepción cuando no queda candidato elegible? · a:cliente · bloquea:G1 · dep:D02,D11 · prioridad:P0
- [ ] Q-003 ¿Cuál es el volumen actual y pico mensual de leads, tamaño máximo de archivo/lote, concurrencia esperada y objetivo numérico de rendimiento? · a:cliente · bloquea:G1 · dep:D02,D03,D11 · prioridad:P0
- [ ] Q-004 ¿Qué sistemas y formatos se migran, qué campos se pueden crear/actualizar, qué identificadores externos son estables y cómo se conserva evidencia de consentimiento? · a:cliente · bloquea:G1 · dep:D02,D11,D12 · prioridad:P0
- [ ] Q-005 ¿Qué plazo aplica a archivos, filas de error, manifiestos y auditoría; quién aprueba purga y qué pasa si escaneo/almacenamiento falla? · a:cliente · bloquea:G1 · dep:D11,D12,D16 · prioridad:P0
- [ ] Q-006 ¿Qué señales generan sugerencia, cuáles requieren revisión humana y quién puede aprobar/revertir una fusión cuando hay conflicto documental o uso posterior del contacto? · a:cliente · bloquea:G1 · dep:D02,D11,D12 · prioridad:P0
- [ ] Q-007 ¿Qué fuente vigente determina elegibilidad de proyecto para cada broker hasta que M47 implemente su contrato de concesiones? · a:equipo · bloquea:G1 · dep:D03,D11,D02 · prioridad:P0
- [ ] Q-008 ¿Qué reintentos, alertas y procedimiento manual aplican a un lote que falla a mitad de proceso o no puede reanudarse? · a:cliente · bloquea:G1 · dep:D02,D10,D16 · prioridad:P0

### Estado del descubrimiento

- Cobertura de pantallas P0 documentadas: **3/3** (UI-007 a UI-009).
- Filas del backlog confirmadas por cliente: **0/3** (“Por validar”).
- Preguntas abiertas que bloquean G1: **8**.
- Cobertura porcentual ponderada de intake: **no calculada**; no se recibió transcripción ni datos de una reunión para el cálculo.
- G1: **no aprobado**. Próximo paso: obtener respuestas a Q-001–Q-008; después, D02 revisa criterios y alcance.
- Las colisiones/contradicciones de migración M40 deben resolverse con D11 antes de numerar DDL de M44.

## Rebanadas

Cada corte tiene un máximo de 45 minutos y la lista de archivos es la permitida para ese corte. D11 confirma la numeración de migraciones antes de ejecutar cualquiera de las rebanadas de esquema. Archivos nuevos indicados como rutas exactas propuestas.

| Corte | Tarea | Archivos permitidos exactos | Prueba de salida |
|---|---|---|---|
| 1 · 45 min | Esquema lógico de asignación, RLS y migración. | `src/infrastructure/db/schema.ts`; `drizzle/0012_m44_routing.sql`; `drizzle/meta/0012_snapshot.json`; `drizzle/meta/_journal.json`; `src/infrastructure/db/m44-routing-schema.test.ts` | Guardas de `.enableRLS()`, claves/versiones, restricciones y migración incremental. |
| 2 · 45 min | Reglas puras y casos de uso de distribución. | `src/application/asignacion-leads/puertos.ts`; `src/application/asignacion-leads/casos-de-uso.ts`; `src/application/asignacion-leads/casos-de-uso.test.ts` | Casos de elegibilidad, cola supervisada y simulación sin mutación. |
| 3 · 45 min | Adaptador de datos, capacidad y unidad transaccional. | `src/infrastructure/db/repos/asignacion-leads.ts`; `src/infrastructure/contenedor/asignacion-leads.ts`; `src/infrastructure/db/repos/asignacion-leads.test.ts` | Capacidad calculada, locks y exclusión concurrente en DB. |
| 4 · 45 min | Contratos HTTP de reglas y simulación. | `src/app/api/leads/asignacion/reglas/route.ts`; `src/app/api/leads/asignacion/reglas/[publicId]/activar/route.ts`; `src/app/api/leads/asignacion/simulaciones/route.ts`; `src/app/api/leads/asignacion/reglas/route.test.ts`; `src/app/api/leads/asignacion/simulaciones/route.test.ts` | Zod estricto, scopes antes de datos y simulación sin escritura. |
| 5 · 45 min | Ejecución de lotes, transferencias y pausa. | `src/app/api/leads/asignacion/lotes/route.ts`; `src/app/api/leads/asignacion/transferencias/route.ts`; `src/app/api/leads/asignacion/agentes/[publicId]/pausa/route.ts`; `src/app/api/leads/asignacion/lotes/route.test.ts`; `src/app/api/leads/asignacion/transferencias/route.test.ts` | Idempotencia, motivo obligatorio y conflictos 409. |
| 6 · 45 min | Pantalla de asignación, roles y estados. | `src/app/(crm)/leads/asignacion/page.tsx`; `src/app/(crm)/leads/asignacion/vista.tsx`; `src/app/(crm)/leads/asignacion/loading.tsx`; `src/app/(crm)/leads/asignacion/error.tsx`; `src/app/(crm)/leads/asignacion/vista.test.ts` | Seis estados y vistas 320/390/768/1440. |
| 7 · 45 min | Esquema de jobs/filas y migración de importación. | `src/infrastructure/db/schema.ts`; `drizzle/0013_m44_importaciones.sql`; `drizzle/meta/0013_snapshot.json`; `drizzle/meta/_journal.json`; `src/infrastructure/db/m44-importaciones-schema.test.ts` | RLS, unicidad job+fila y retención configurada. |
| 8 · 45 min | Puertos, parser, mapeo y diagnóstico por fila. | `src/application/importaciones/puertos.ts`; `src/application/importaciones/casos-de-uso.ts`; `src/application/importaciones/casos-de-uso.test.ts`; `src/infrastructure/integraciones/importacion/csv.ts`; `src/infrastructure/integraciones/importacion/xlsx.ts` | Filas válidas/ inválidas, fórmulas como datos y normalización aislada. |
| 9 · 45 min | Persistencia privada, confirmación, reanudación y reversión. | `src/infrastructure/integraciones/importacion/almacenamiento.ts`; `src/infrastructure/db/repos/importaciones.ts`; `src/infrastructure/contenedor/importaciones.ts`; `src/infrastructure/db/repos/importaciones.test.ts` | Fallo de escaneo bloquea confirmación; reintento/reversión respeta vínculos y versiones. |
| 10 · 45 min | API de importación y descarga protegida. | `src/app/api/datos/importaciones/route.ts`; `src/app/api/datos/importaciones/[publicId]/route.ts`; `src/app/api/datos/importaciones/[publicId]/mapeo/route.ts`; `src/app/api/datos/importaciones/[publicId]/previsualizar/route.ts`; `src/app/api/datos/importaciones/[publicId]/confirmar/route.ts`; `src/app/api/datos/importaciones/[publicId]/revertir/route.ts`; `src/app/api/datos/importaciones/[publicId]/errores/route.ts`; `src/app/api/datos/importaciones/route.test.ts` | Scopes, Zod, idempotencia, 404 ajeno y exportación autorizada. |
| 11 · 45 min | Asistente de importación y estados. | `src/app/(crm)/datos/importaciones/page.tsx`; `src/app/(crm)/datos/importaciones/vista.tsx`; `src/app/(crm)/datos/importaciones/loading.tsx`; `src/app/(crm)/datos/importaciones/error.tsx`; `src/app/(crm)/datos/importaciones/vista.test.ts` | Recorrido por pasos, móvil y mensajes por fila. |
| 12 · 45 min | Esquema de alias/manifiestos y migración de fusión. | `src/infrastructure/db/schema.ts`; `drizzle/0014_m44_fusiones.sql`; `drizzle/meta/0014_snapshot.json`; `drizzle/meta/_journal.json`; `src/infrastructure/db/m44-fusiones-schema.test.ts` | RLS, FKs restrictivas, alias y preservación de historia. |
| 13 · 45 min | Detección, fusión, manifiesto y reversión controlada. | `src/application/duplicados-contactos/puertos.ts`; `src/application/duplicados-contactos/casos-de-uso.ts`; `src/application/duplicados-contactos/casos-de-uso.test.ts`; `src/infrastructure/db/repos/duplicados-contactos.ts`; `src/infrastructure/contenedor/duplicados-contactos.ts` | Teléfono familiar no fuerza fusión; transacción y relaciones conservadas. |
| 14 · 45 min | API y vista de duplicados. | `src/app/api/datos/duplicados/route.ts`; `src/app/api/datos/duplicados/[publicId]/route.ts`; `src/app/api/datos/duplicados/[publicId]/fusionar/route.ts`; `src/app/api/datos/duplicados/[publicId]/no-duplicado/route.ts`; `src/app/api/datos/duplicados/[publicId]/revertir/route.ts`; `src/app/(crm)/datos/duplicados/page.tsx`; `src/app/(crm)/datos/duplicados/vista.tsx`; `src/app/(crm)/datos/duplicados/loading.tsx`; `src/app/(crm)/datos/duplicados/error.tsx`; `src/app/api/datos/duplicados/route.test.ts`; `src/app/(crm)/datos/duplicados/vista.test.ts` | Autorización de dos contactos, manifiesto, estados y responsive. |

## Handoff

**Productor:** D01 Discovery. **Estado:** REVIEW; G1 sigue bloqueado por ocho preguntas. No se declaran pruebas ejecutadas; §8 define pruebas futuras.

**Revisión independiente requerida:** D03 revisa límites y contratos; D12 revisa permisos, archivos, PII y fusión. D02 valida prioridades, roles y excepciones. D04/D05 revisan sitemap y experiencia; D11 valida modelo, relaciones M40/M47 y secuencia de migraciones. El productor no aprueba la ficha.

**Hallazgos de seguridad para revisión:** las nuevas API deben aplicar `requireActor` y alcance total antes de leer datos masivos; las rutas por ID deben reautorizar fila y devolver 404 fuera de alcance; toda tabla nueva necesita RLS; archivos privados no se confirman sin escaneo y retención aprobados; el manifiesto debe restringir valores KYC; la fusión debe preservar hechos financieros M40. La asignación modifica responsable comercial, pero nunca concede acceso a proyecto.

Antes de despachar rebanadas, D00 confirma que M40 `0011` está presente en la rama objetivo, actualiza la numeración y comprueba las reservas vigentes en `.viltrum/vre-os/EN-CURSO.md`.