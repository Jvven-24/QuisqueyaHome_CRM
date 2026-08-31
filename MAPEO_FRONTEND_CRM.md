# Mapeo funcional del frontend — CRM Quisqueya Home

Fecha: 30 de agosto de 2026
Objetivo: traducir el frontend confirmado en entidades, campos, catálogos y reglas de negocio, como paso previo al diseño de la base de datos y del backend.

## 1. Alcance y fuentes

| Fuente | Uso | Estado |
|---|---|---|
| `CRM/app/page.tsx` | Frontend confirmado por el cliente. Única fuente de pantallas, campos y acciones. | Vinculante |
| `CRM/app/globals.css` | Componentes, estados visuales y breakpoints reales. | Vinculante |
| `CRM/app/layout.tsx` | Shell, tipografías, metadata. | Vinculante |
| `Diseno_Figma/*.md` | Brechas ya identificadas y pantallas de diseño pendientes. | Consideración |

Todo lo que aparece en este documento como campo o regla proviene de esas fuentes. Cuando algo es necesario para el backend pero **no existe en el frontend**, queda marcado explícitamente como brecha en la sección 8, no mezclado con lo confirmado.

## 2. Estado real del frontend

El CRM es una sola pantalla cliente (`"use client"`) de 957 líneas con 15 módulos, sin rutas, sin backend y sin persistencia.

| Aspecto | Situación |
|---|---|
| Estado | 12 `useState` en el componente raíz. Todo se pierde al recargar. |
| Datos | `initialLeads` (6), `properties` (4), y ~20 bloques literales dentro del JSX. |
| Navegación | `active: ModuleId` conmuta el render. No hay URL por módulo. |
| Sesión | `loggedIn: boolean`. El formulario de login no valida nada; `setLoggedIn(true)` directo. |
| Rol | `role` conmutable desde el login y desde la cabecera. Es un selector, no una identidad. |
| Escritura real | Solo 6 acciones mutan estado: crear lead, crear cita, mover etapa, marcar tarea, marcar contenido de Academy, mover slider de avance, y togglear permisos. |

Consecuencia para el backend: **el frontend define bien la forma de los datos, pero no su ciclo de vida.** El modelo debe conservar la forma y añadir identidad, persistencia, autoría y trazabilidad.

## 3. Shell y elementos transversales

### 3.1 Login (`login-page`)

| Elemento | Dato | Nota |
|---|---|---|
| Correo electrónico | `email` | `defaultValue="ismael@quisqueyahome.com"`, `required` |
| Contraseña | `password` | `required`, `minLength={6}` |
| Perfil para la demostración | `role` | Selector de los 3 roles. Debe desaparecer con auth real. |
| ¿Olvidaste tu contraseña? | — | Botón sin acción |

### 3.2 Sidebar

15 módulos numerados `00`–`14`, en orden fijo. La lista y su visibilidad por rol están declaradas en el array `modules` (líneas 95–116) — esta es la **matriz RBAC real del código**:

| # | `id` | Etiqueta | Etiqueta broker | admin | assistant | broker |
|---:|---|---|---|:--:|:--:|:--:|
| 00 | `inicio` | Inicio | Mi panel | ✓ | ✓ | ✓ |
| 01 | `leads` | Leads | Mis leads | ✓ | ✓ | ✓ |
| 02 | `contactos` | Contactos | — | ✓ | ✓ | — |
| 03 | `pipeline` | Pipeline | Mi pipeline | ✓ | — | ✓ |
| 04 | `agenda` | Citas y agenda | Mi agenda | ✓ | ✓ | ✓ |
| 05 | `propiedades` | Propiedades internas | Mis propiedades | ✓ | — | ✓ |
| 06 | `brokers` | Brokers | — | ✓ | — | — |
| 07 | `academy` | Academy | — | ✓ | — | ✓ |
| 08 | `metas` | Metas y desempeño | Mis metas | ✓ | — | ✓ |
| 09 | `comisiones` | Comisiones | — | ✓ | — | — |
| 10 | `tareas` | Tareas y actividades | — | ✓ | ✓ | — |
| 11 | `comunicaciones` | Comunicaciones | — | ✓ | ✓ | — |
| 12 | `reportes` | Reportes y BI | — | ✓ | — | — |
| 13 | `avances` | Avances de obra | — | ✓ | ✓ | — |
| 14 | `configuracion` | Configuración y permisos | — | ✓ | — | — |

Pie de sidebar: nombre y título del usuario (`roleCopy`), botón de salida.

### 3.3 Cabecera

- **Búsqueda global**: filtra `leads` por `name + project + source` en minúsculas. Es el único buscador funcional. Muestra atajo `Ctrl K` no implementado.
- **Selector de vista (rol)**: conmuta rol en caliente. Elemento de demo.
- **Botón de actividad**: contador `3` fijo; abre el panel de notificaciones.

### 3.4 Panel de notificaciones

4 elementos literales con la forma `[título, texto, tiempo]` y estado leído/no leído por índice (`index < 3` → no leída). Acción "Marcar todas como leídas" (solo toast).

Tipos de evento observados, útiles como catálogo de notificaciones:

| Evento | Texto de ejemplo |
|---|---|
| Nuevo lead desde el portal | Ana Peralta — Alquiler en Bávaro |
| Cita próxima | María Fernández en 30 minutos |
| Avance de obra actualizado | Alexandra cargó contenido de Fase 3 |
| Negocio movido a cierre | Laura Gómez — Bávaro Beach Lofts |

### 3.5 Retroalimentación

- **Toast** (`toast`): mensaje único, autocierre a 2600 ms. Se usa para confirmar 8 acciones distintas.
- **Modal** (`modal`): tipo declarado `"lead" | "appointment" | "lost" | null`. **Solo `lead` y `appointment` están implementados; `"lost"` nunca se renderiza.** El motivo de pérdida no se captura en ninguna parte.
- **Estados**: existe `Empty` (título + texto). No hay estados de carga, error ni sin permiso.

## 4. Mapeo módulo por módulo

### 00 · Inicio (`Dashboard`)

Tres variantes por rol. Cada métrica es una constante en el JSX; ninguna se calcula.

| Rol | KPIs mostrados |
|---|---|
| Administrador | Leads del mes `48` (+12% vs junio) · Negocios activos `21` (US$2.8M en pipeline) · Cierres del mes `7` (meta 10) · Conversión `14.6%` (+2.1 pts) |
| Asistente | Leads sin asignar `2` · Citas de hoy `3` · Tareas pendientes `4` (1 vencida) · Avances por revisar `1` |
| Broker | Mis leads `5` · Citas esta semana `3` · Meta del mes `2 / 4` · Mi nivel `Junior` (US$415K para Senior) |

Paneles: leads que requieren atención (primeros 4 de `visibleLeads`), embudo por etapa o anillo de meta, próximas actividades, proyectos más consultados o tarjeta de Academy.

**Agregados que el backend debe poder calcular:** leads del mes con variación mensual, negocios abiertos y su valor, cierres del mes contra meta, tasa de conversión, leads sin asignar, citas del día, tareas pendientes y vencidas, avances pendientes de revisión, conteo por etapa, ranking de proyectos por número de leads.

### 01 · Leads (`LeadsView` + `LeadInspector`)

Tabla con inspector lateral. Filtros presentes pero **inertes** (no alteran los datos): origen, estado, broker.

| Columna | Campo | Tipo actual |
|---|---|---|
| Lead | `name` + `phone` | texto |
| Proyecto | `project` | texto (nombre, no referencia) |
| Origen | `source` | texto |
| Responsable | `broker` | texto (nombre, no referencia) |
| Estado | `stage` | enum de 7 |
| Próxima acción | `next` | texto libre, p. ej. `"Contactar hoy, 11:30 AM"` |

Inspector (`LeadInspector`): teléfono, origen, proyecto, presupuesto, responsable, etapa, próxima acción, nota de seguimiento (textarea sin persistencia), selector de etapa (incluye `Perdido` sin pedir motivo), botón "Registrar contacto", enlace WhatsApp `https://wa.me/1{telefono sin formato}`, e historial con 2 eventos literales.

Formulario "Registrar lead manual": `name*`, `phone*`, `project` (select de `properties`), `source` (select de 4), `budget` (texto libre, por defecto `"Por definir"`), `broker` (select de 3, incluye "Sin asignar"). Al crear: `id = Date.now()`, `stage = "Nuevo"`, `next = "Contactar hoy"`.

### 02 · Contactos (`ContactsView`)

Reutiliza el mismo array `leads` y el mismo inspector, con `onMove` anulado. Filtros inertes. Contador literal `312 contactos`.

| Columna | Campo |
|---|---|
| Contacto | `name` + `phone` |
| Canal | `source` |
| Proyecto de interés | `project` |
| Broker | `broker` |
| Última interacción | literal `"Hoy"` |

**Hallazgo central:** contacto y lead son el mismo objeto. No hay forma de que un contacto tenga dos oportunidades ni de conservar su historial al cerrarse un negocio.

### 03 · Pipeline (`PipelineView`)

Kanban con arrastre nativo HTML5 (`dataTransfer` con `leadId`). Cabecera con "Valor activo US$2.8M" (literal). Filtros inertes: broker, proyecto.

Columnas: las 6 de `stageOrder`. **`Perdido` no tiene columna**, por lo que un negocio marcado como perdido desaparece de la vista sin dejar rastro.

Tarjeta de negocio: origen, nombre, proyecto, presupuesto, próxima acción, avatar y nombre del broker.

### 04 · Citas y agenda (`AgendaView`)

Rejilla semanal fija: 5 días (Lun 20 – Vie 24) × 8 horas (09:00–16:00). Un evento se pinta si coinciden `day` y la hora entera de `time`.

| Campo de `Appointment` | Tipo | Nota |
|---|---|---|
| `time` | `"9:00"` | texto; solo se compara la hora entera |
| `title` | texto | mezcla cliente y proyecto |
| `owner` | texto | nombre corto del responsable |
| `day` | `1..5` | índice de día, no fecha |

Funciones reales:
- `appointmentDates()` construye la fecha como `2026-07-{19 + day}` con offset `-04:00`.
- `googleCalendarUrl()` genera enlace a Google Calendar con `ctz=America/Santo_Domingo`.
- `exportCalendar()` descarga `.ics` con `UID {day}-{time}@quisqueyahome.com`.

Confirma dos decisiones de backend: **zona horaria `America/Santo_Domingo`** y necesidad de un identificador estable por evento para no duplicar en sincronizaciones.

Formulario "Nueva cita": `title*`, `day` (Lun–Vie), `time*` (`type="time"`), `owner` (select de 3).

### 05 · Propiedades internas (`PropertiesView`)

Dos vistas: rejilla de proyectos y detalle. El broker solo ve proyectos donde `broker === "Yostar Medina"`.

Banner de privacidad: "Inventario interno — visible únicamente según los permisos de cada perfil". Filtros inertes: zona, tipo, estado.

Campos por proyecto (`properties`):

| Campo | Ejemplo | Observación |
|---|---|---|
| `name` | Praderas de Punta Cana | |
| `zone` | Punta Cana | |
| `type` | En planos | |
| `progress` | `35` | % de obra, entero |
| `units` | `"12/40"` | disponibles / totales, como texto |
| `price` | `"US$140,000"` | precio interno real, solo admin |
| `public` | `"US$150K - 180K"` | rango publicable |
| `broker` | Ismael Rosario | responsable |

Detalle del proyecto añade: desarrollador (`"Grupo Punta Cana Norte"`), entrega estimada (`"diciembre 2027"`), y una tabla de unidades con columnas **Unidad, Tipología, Hab., Baños, Construcción, Precio real (solo admin), Rango público, Estado**.

La columna "Precio real" se renderiza condicionalmente con `role === "admin"` — es la única restricción a nivel de campo que existe hoy en el frontend.

### 06 · Brokers (`BrokersView`)

Escala de niveles visible: `Junior → Senior → Senior+ → Top Producer → Top Leader`.

Campos por broker: nombre, rol/cargo, especialidad, nivel, ventas del año, negocios activos, meta mensual (%). Acciones sin implementar: "Ver perfil", "Asignar propiedades", "Invitar broker".

### 07 · Academy (`AcademyView`)

Contenidos con `[título, tipo, duración]`. Tipos: `Sesión de lunes` y `Checklist operativo`. Progreso por índice en `academyDone: boolean[4]`; el anillo calcula `completados × 25%`.

Checklist lateral de 5 pasos: Identificar propiedad, Validar disponibilidad, Confirmar comisión, Crear ficha, Publicar rango. Marcado con `defaultChecked` — no persiste.

Filtros segmentados inertes: Todas, Sesiones, Checklists, Pendientes.

### 08 · Metas y desempeño (`GoalsView`)

Selector de mes (Julio/Junio 2026). Anillo de cumplimiento: 70% admin, 50% broker.

Tabla: Broker, Meta, Logrados, Cumplimiento (%), Nivel. Gráfico anual de 12 barras `[5,7,8,6,10,9,7,0,0,0,0,0]`; una barra se marca `hit` cuando `valor >= 10` (la meta mensual).

Texto explícito en la interfaz: *"Los cierres alimentan esta meta automáticamente, sin doble captura."* Es la regla de negocio a implementar.

### 09 · Comisiones (`CommissionsView`)

KPIs: comisiones del mes `US$48,500` (6 negocios), pendientes `US$12,300` (2 por aprobar), pagadas `US$36,200`.

| Columna | Ejemplo |
|---|---|
| Negocio | `Laura Gómez · Bávaro Beach Lofts` (contacto + proyecto) |
| Monto de venta | `US$132,000` |
| Comisión | `5%` |
| Reparto interno | `50% broker / 50% agencia` |
| Broker | Yostar Medina |
| Estado | Aprobada / Pendiente / Pagada |

Filtros inertes: broker, periodo, estado. Botón "Exportar reporte" sin acción.

### 10 · Tareas y actividades (`TasksView`)

Único módulo con escritura funcional además de leads y citas: `onToggle` marca completada.

Campos de tarea: `id`, `label`, `due` (texto, `"Hoy, 4:00 PM"`), `done`. No hay responsable, prioridad ni vínculo a un registro.

Panel "Carga del equipo": actividades abiertas por persona (Alexandra 4, Ismael 3, Yostar 2).

### 11 · Comunicaciones (`CommunicationsView`)

3 plantillas listadas con categoría: Primer contacto (Lead nuevo), Confirmación de cita (Agenda), Seguimiento de proyecto (Seguimiento).

Editor con estado local: `template`, `name`, `project`. La vista previa sustituye las variables `{nombre}` y `{proyecto}`. Botón "Abrir en WhatsApp" solo lanza un toast.

Confirma el formato de plantilla: **cuerpo de texto con marcadores `{variable}`**.

### 12 · Reportes y BI (`ReportsView`)

Todas las cifras son literales, pero definen qué agregaciones debe producir el backend:

| Reporte | Datos y requisito implícito |
|---|---|
| Conversión del embudo | 48 → 38 → 24 → 14 → 10 → 7 · conteo por etapa |
| Leads por canal | YouTube 58%, Web 22%, WhatsApp 14%, Referidos 6% · `source` obligatorio |
| Zonas calientes | Punta Cana 88, Bávaro 68, Cap Cana 45, Las Terrenas 28 · zona en el interés del lead |
| Motivos de pérdida | Precio 12, No responde 8, Compró otro 5, Sin financiamiento 4 · **requiere un campo que hoy no existe** |
| Proyección de cierre | US$1.42M trimestral, confianza 72% · **requiere probabilidad y fecha estimada, que hoy no existen** |

Controles: rango de fechas y "Exportar a Excel", ambos inertes.

### 13 · Avances de obra (`ProgressView`)

8 fases fijas en el código: Movimiento de tierra, Cimientos, Estructura, Muros, Instalaciones, Terminaciones, Áreas comunes, Entrega.

Estado por fase derivado del índice: `< 2` completado, `=== 2` en curso, resto pendiente. El selector de estado ofrece **Pendiente, En curso, Completado, Retrasado**.

Campos del editor de fase: estado, fecha de actualización (`type="date"`), porcentaje (slider 0–100), URL de video de YouTube, nota pública (textarea), fotos (3 marcadores + botón "Agregar fotos"), responsable y última edición.

Acción "Publicar en el portal" (solo toast). Texto de la interfaz: *"El comprador verá la nota, el porcentaje y las fotografías en el portal público."* — define el contrato con el Sistema 1.

**Limitación estructural:** `phaseProgress` es un único número en el estado raíz, compartido por todas las fases y todos los proyectos. Las fases deben ser filas por proyecto, con número parametrizable.

### 14 · Configuración y permisos (`SettingsView`)

7 pestañas: Usuarios y roles, Etapas del pipeline, Metas, Comisiones, Plantillas de WhatsApp, Integraciones, Marca. Solo tres tienen contenido real.

**Matriz de permisos** (única con lógica): 8 filas × 3 columnas. La columna Administrador está bloqueada (`disabled`, `column === 0` retorna sin cambio).

| Fila (módulo o dato) | Admin | Asistente | Broker |
|---|:--:|:--:|:--:|
| Leads | ✓ | ✓ | ✓ |
| Contactos | ✓ | ✓ | — |
| Pipeline | ✓ | — | ✓ |
| Propiedades | ✓ | — | ✓ |
| Precios reales | ✓ | — | — |
| Métricas globales | ✓ | — | — |
| Comisiones | ✓ | — | — |
| Configuración | ✓ | — | — |

Esta matriz es coherente con el array `modules`, pero **cubre 8 alcances frente a 15 módulos**: no hay fila para Agenda, Brokers, Academy, Metas, Tareas, Comunicaciones, Reportes ni Avances.

**Etapas del pipeline**: lista numerada de las 6 etapas con botón "Editar" — implica que las etapas deben ser configurables, no una constante.

**Marca**: Azul Quisqueya `#1D2B53`, Oro Quisqueya `#C7990E`.

**Integraciones** (`IntegrationCenter`): 6 tarjetas con nombre, estado y descripción.

| Integración | Estado declarado |
|---|---|
| Google Calendar | Disponible |
| WhatsApp Business | Activo |
| YouTube | Preparado |
| Zoom / Google Meet | Preparado |
| Meta Lead Ads | Fase siguiente |
| Google Calendar 2 vías | Fase siguiente |

Nota de la propia interfaz: *"No se guardarán tokens OAuth en el navegador."*

## 5. Catálogos consolidados

Valores que el frontend usa hoy. Son los candidatos directos a tablas de catálogo o enums.

| Catálogo | Valores | Origen |
|---|---|---|
| Rol | `admin`, `assistant`, `broker` | tipo `Role` |
| Etapa | `Nuevo`, `Contactado`, `Presentación`, `Preselección`, `Negociación`, `Cierre`, `Perdido` | tipo `Stage` |
| Etapas del embudo | las 6 primeras (`stageOrder`) | `Perdido` es salida lateral |
| Origen del lead | `YouTube`, `WhatsApp`, `Portal web`, `Referido` | formulario de lead |
| Tipo de proyecto | `En planos`, `Preventa`, `En construcción`, `Alquiler` | `properties` |
| Zona | `Punta Cana`, `Bávaro`, `Vista Cana` (+ `Cap Cana`, `Las Terrenas` en reportes) | `properties` y reportes |
| Estado de unidad | `Disponible`, `Reservada`, `Vendida` | tabla de unidades |
| Estado de fase de obra | `Pendiente`, `En curso`, `Completado`, `Retrasado` | selector de fase |
| Nivel de broker | `Junior`, `Senior`, `Senior+`, `Top Producer`, `Top Leader` | `level-scale` |
| Estado de comisión | `Pendiente`, `Aprobada`, `Pagada` | tabla de comisiones |
| Reparto de comisión | `50/50`, `60/40` | tabla de comisiones |
| Tipo de contenido Academy | `Sesión de lunes`, `Checklist operativo` | `courses` |
| Categoría de plantilla | `Lead nuevo`, `Agenda`, `Seguimiento` | lista de plantillas |
| Motivo de pérdida | **no existe en el frontend** | pendiente (ver §8) |

## 6. Entidades candidatas

Derivadas de lo anterior. Los campos marcados con ⚠ existen hoy como texto de presentación y deben normalizarse.

### Identidad y acceso

**`users`** — `id`, `nombre`, `email`, `hash_password`, `rol`, `iniciales`, `titulo`, `activo`, timestamps.
Origen: `roleCopy`, sidebar, login, tabla de brokers.

**`broker_profiles`** — `user_id`, `especialidad`, `nivel`, `ventas_acumuladas_año`, `meta_mensual`, `progreso_academy`.
Origen: `BrokersView`. Se separa de `users` porque solo aplica al rol broker.

**`role_permissions`** — `rol`, `recurso`, `permitido`. Los 8 recursos de la matriz más los 7 módulos sin fila.

### Núcleo comercial

**`contacts`** — `id`, `nombre`, `telefono` ⚠ (normalizar a E.164), `email`, `canal_origen`, `broker_id`, `notas`, `ultima_interaccion`, timestamps.

**`leads`** — `id`, `contact_id`, `fuente`, `proyecto_interes_id`, `presupuesto_min` ⚠, `presupuesto_max` ⚠, `moneda`, `broker_id`, `estado_asignacion`, `fecha_recepcion`.

**`deals`** — `id`, `contact_id`, `lead_id`, `etapa`, `monto_estimado` ⚠, `broker_id`, `fuente`, `proxima_accion_id` ⚠, `motivo_perdida_id`, `fecha_cierre_estimada`, `probabilidad`, `porcentaje_comision`, timestamps y autoría.

**`deal_properties`** — `deal_id`, `unit_id` o `project_id`. Relación N:M: el pipeline muestra un proyecto por tarjeta, pero la regla de negocio exige una o más propiedades por negocio.

**`activities`** — `id`, `tipo` (tarea, llamada, cita, nota), `titulo`, `fecha_hora` ⚠, `responsable_id`, `estado`, `deal_id`, `contact_id`, `completada_en`.
Unifica `tasks` (id, label, due, done) y `Appointment` (time, title, owner, day), que hoy son dos estructuras separadas sin relación con ningún contacto.

**`appointment_sync`** — `activity_id`, `proveedor`, `external_event_id`, `estado_sync`. Requerido por el `UID` del `.ics` y por la integración de Google Calendar.

### Inventario

**`projects`** — `id`, `nombre`, `zona`, `tipo`, `desarrollador`, `fecha_entrega_estimada`, `porcentaje_avance`, `precio_interno` ⚠, `rango_publico_min` ⚠, `rango_publico_max` ⚠, `broker_id`, `visible_portal`.

**`units`** — `id`, `project_id`, `codigo`, `tipologia`, `habitaciones`, `banos`, `m2_construccion`, `precio_real` ⚠, `rango_publico` ⚠, `estado`, `broker_id`.
El campo `units: "12/40"` del proyecto es un derivado: `COUNT(estado='Disponible') / COUNT(*)`.

**`construction_phases`** — `id`, `project_id`, `numero`, `titulo`, `estado`, `porcentaje`, `fecha_actualizacion`, `video_url`, `nota_publica`, `responsable_id`, `publicado_en`.
Número de fases parametrizable por proyecto: el frontend fija 8, pero cada constructora define las suyas.

**`files`** — `id`, `entidad`, `entidad_id`, `tipo`, `url`, `subido_por`, `subido_en`, `visibilidad`. Cubre las fotos de obra y futuros documentos.

### Rendimiento

**`goals`** — `id`, `broker_id` (nulo = meta del negocio), `mes`, `anio`, `objetivo_negocios`, `logrados`.

**`commissions`** — `id`, `deal_id`, `monto_venta` ⚠, `porcentaje`, `reparto_broker`, `reparto_agencia`, `broker_id`, `estado`, `fecha_cierre`, `aprobada_por`, `pagada_en`.

### Contenido y operación

**`academy_items`** — `id`, `titulo`, `tipo`, `duracion`, `video_url`, `orden`.
**`academy_progress`** — `user_id`, `item_id`, `completado`, `porcentaje`, `actualizado_en`.
**`academy_checklist_items`** — `item_id`, `orden`, `texto`.
**`academy_checklist_progress`** — `user_id`, `checklist_item_id`, `completado`.

**`message_templates`** — `id`, `nombre`, `categoria`, `cuerpo`, `variables`, `canal`, `activo`.

**`notifications`** — `id`, `user_id`, `tipo`, `titulo`, `texto`, `entidad`, `entidad_id`, `leida`, `creada_en`.

**`pipeline_stages`** — `id`, `nombre`, `orden`, `es_terminal`, `activo`. Requerido por la pestaña "Etapas del pipeline".

**`integration_accounts`** — `id`, `proveedor`, `user_id`, `estado`, `tokens_cifrados`, `ultima_sync`.

**`audit_log`** — `id`, `user_id`, `accion`, `entidad`, `entidad_id`, `valor_anterior`, `valor_nuevo`, `creado_en`.

### Campos transversales

Todas las tablas operativas: `id`, `created_at`, `updated_at`, `created_by`, `updated_by`, y `deleted_at` donde aplique papelera.

## 7. Reglas de negocio detectadas en el frontend

| # | Regla | Evidencia |
|---|---|---|
| R1 | El embudo tiene 6 etapas ordenadas; `Perdido` es salida lateral desde cualquiera. | `stageOrder` vs. tipo `Stage` |
| R2 | Registrar contacto sobre un lead en `Nuevo` lo mueve a `Contactado`; en otra etapa no hace nada. | `LeadInspector`, botón "Registrar contacto" |
| R3 | Mover a `Cierre` debe actualizar metas y comisiones en la misma operación. | toast: *"Cierre registrado. Metas y comisiones actualizadas."* |
| R4 | Los cierres alimentan la meta mensual sin captura manual. | texto en `GoalsView` |
| R5 | Un lead nuevo nace en `Nuevo` con próxima acción "Contactar hoy". | `addLead` |
| R6 | El broker solo ve sus propios leads y sus propiedades asignadas. | `visibleLeads`, `PropertiesView` |
| R7 | El precio real de una unidad solo es visible para el administrador. | render condicional `role === "admin"` |
| R8 | Un proyecto expone precio interno y rango público por separado. | `price` vs. `public` |
| R9 | El avance de obra se publica explícitamente al portal público. | botón "Publicar en el portal" |
| R10 | Los permisos del administrador no son modificables. | `column === 0` retorna sin cambio |
| R11 | Las citas operan en `America/Santo_Domingo` y necesitan identificador estable. | `googleCalendarUrl`, `exportCalendar` |
| R12 | La meta mensual del negocio es 10 negocios; se marca cumplida a partir de ese valor. | `bar-chart` clase `hit` |

## 8. Brechas entre el frontend y el modelo necesario

### 8.1 Datos que la interfaz muestra pero no existen como campo

| Necesidad | Dónde se ve | Falta |
|---|---|---|
| Motivo de pérdida | Reporte "Motivos de pérdida"; modal `"lost"` declarado y nunca renderizado | Catálogo + campo obligatorio al marcar `Perdido` |
| Probabilidad y fecha de cierre estimada | Reporte "Proyección de cierre" (US$1.42M, confianza 72%) | Ambos campos en `deals` |
| Próxima acción como dato | `next: "Contactar hoy, 11:30 AM"` | Referencia a una actividad con fecha, tipo y responsable |
| Presupuesto comparable | `budget: "US$145,000"` | Mínimo, máximo, moneda |
| Disponibilidad de unidades | `units: "12/40"` | Debe derivarse de filas reales de unidades |
| Última interacción | Literal `"Hoy"` en Contactos | Cálculo sobre actividades |
| Zona del interés del lead | Reporte "Zonas calientes" | El lead solo guarda proyecto, no zona |

### 8.2 Estructuras que deben separarse

- **Contacto / Lead / Negocio son un solo objeto `Lead`.** Un contacto no puede tener dos oportunidades ni conservar historial tras un cierre.
- **Broker es un texto (`"Yostar Medina"`), no una referencia.** El filtrado por rol compara cadenas literales.
- **Proyecto es un texto en el lead**, no una relación con `projects`.
- **Fases de obra comparten un único porcentaje global** en el estado raíz.
- **Tareas y citas son estructuras distintas** sin vínculo a contacto ni a negocio.

### 8.3 Funcionalidad presente pero inerte

Los filtros de Leads, Contactos, Pipeline, Propiedades, Comisiones y Academy existen visualmente y no alteran datos. Igual ocurre con: exportar reporte, exportar a Excel, nuevo contacto, nuevo proyecto, invitar broker, ver perfil, asignar propiedades, nueva tarea, nueva plantilla, y el rango de fechas de reportes.

Antes de producción, cada control debe ejecutar una acción real, respetar permisos y registrar auditoría.

### 8.4 Ausencias completas

Sin representación alguna en el frontend: autenticación real, recuperación de contraseña, MFA, sesiones activas, gestión de usuarios, alcance de datos por permiso (ver/crear/editar/eliminar), auditoría, papelera, detección y fusión de duplicados, importación CSV, estados de carga/error/sin permiso, paginación, y ordenamiento de tablas.

Estas brechas ya están catalogadas y priorizadas en `Diseno_Figma/AUDITORIA_BRECHAS_CRM_FIGMA.md`, y varias tienen pantallas de diseño construidas en Figma (autenticación, permisos granulares, estados globales, CRUD universal, calidad de datos, auditoría).

## 9. Decisiones tomadas

| # | Decisión | Elección | Consecuencia |
|---|---|---|---|
| 1 | Etapas del pipeline | Tabla `pipeline_stages` configurable | `deals.stage_id` es referencia. `kind` (`open`/`won`/`lost`) distingue Cierre y Perdido, para que las reglas se enganchen al tipo y no a un nombre renombrable |
| 2 | Permisos | Recurso + acción + alcance | `permissions(role_id, resource, action, scope)`. `scope=own` reemplaza la comparación de cadenas del frontend |
| 3 | Alquiler | `operation_type` + `price_period` | Un arrendamiento convive con el inventario de venta sin modelo paralelo |
| 4 | Propiedades del negocio | N:M, obligatoria en Preselección | `deal_properties`, con `unit_id` opcional mientras el interés es a nivel de proyecto |
| 5 | Multi-organización | Omitida | Un solo negocio, sin red de agencias |

Decisiones derivadas: los roles son tabla (para admitir Marketing sin tocar código); las validaciones por etapa viven en el servidor, no como datos configurables; `deals.next_activity_id` y `leads.converted_deal_id` no declaran clave foránea para evitar ciclos, y su integridad se garantiza en la aplicación.

**Estado:** implementado en `db/schema.ts` (28 tablas) con migración generada en `drizzle/`.

## 10. Reglas de negocio a implementar

### 10.1 Requisitos por transición de etapa

Origen: auditoría funcional F05 y F06. Se validan en servidor.

| Transición | Exige |
|---|---|
| → Contactado | Al menos una actividad de contacto registrada |
| → Presentación | Próxima acción con responsable y fecha |
| → Preselección | Al menos una fila en `deal_properties` |
| → Negociación | Monto, probabilidad, % de comisión y fecha estimada de cierre |
| → Cierre (`won`) | Monto final y unidad principal definida |
| → Perdido (`lost`) | Motivo obligatorio del catálogo `loss_reasons` |

Regla adicional: todo negocio en etapa abierta debe tener próxima acción. Si no la tiene, entra en la cola de riesgo del panel.

### 10.2 Cierre transaccional

Al mover un negocio a una etapa `won`, en **una sola transacción**:

1. Sellar `closed_at` y el monto final.
2. Registrar el movimiento en `deal_stage_history`.
3. Marcar la unidad principal como `sold` (o `reserved` según el caso).
4. Incrementar `goals.achieved_deals` y `achieved_amount_cents` del broker y de la meta global del periodo.
5. Recalcular `broker_profiles.annual_sales_cents` y reevaluar el nivel.
6. Crear la fila en `commissions` en estado `pending`.
7. Cerrar o cancelar las actividades futuras del negocio.
8. Escribir en `audit_log`.

Si cualquier paso falla, ninguno se aplica. Es el punto donde un fallo parcial produce metas y comisiones incorrectas de forma silenciosa.

### 10.3 Automatizaciones del MVP

Solo cinco, según la auditoría funcional §8:

1. Nuevo lead → sugerir o asignar broker por especialidad y crear tarea de contacto.
2. Lead sin contacto dentro del SLA → alerta.
3. Cambio de etapa → crear la próxima actividad según plantilla.
4. Perdido → exigir motivo y cerrar actividades futuras.
5. Cierre → la transacción de 10.2.

### 10.4 Reglas de visibilidad

- El broker solo ve contactos, leads, negocios, propiedades y actividades donde es responsable (`scope=own`).
- `units.real_price_cents` y `projects.internal_price_cents` requieren permiso sobre el recurso `unit_real_price`.
- Las métricas globales requieren permiso sobre `global_metrics`.
- Los permisos del rol administrador no son editables.

## 11. Capas transversales

No son módulos, pero condicionan a todos. Son la causa habitual de que un cronograma se desborde.

| ID | Capa | Qué incluye | Tamaño |
|---|---|---|:--:|
| T1 | Fundación de datos | Binding D1 en `.openai/hosting.json`, aplicar migración, seeds de roles, permisos, etapas, motivos y canales, `relations()` de Drizzle | S |
| T2 | Autenticación | Login real, hash de contraseña, sesiones, expiración, logout, recuperación de contraseña | M |
| T3 | RBAC en servidor | Resolución de permisos por recurso/acción/alcance y filtrado automático por `own` en cada consulta | M |
| T4 | Acceso a datos y validación | Patrón de lectura/escritura, validación de entrada, manejo de errores, transacciones | M |
| T5 | Estados de interfaz | Carga, vacío, sin resultados, error, 403, deshabilitado por permiso. Hoy solo existe `Empty` | M |
| T6 | Auditoría | Escritura en `audit_log` en toda acción sensible, más la vista de historial | S |
| T7 | Rutas y estructura | Partir `page.tsx` (957 líneas, un solo componente cliente sin rutas) en rutas por módulo con carga desde servidor | L |
| T8 | Entorno y despliegue | Entornos de desarrollo, staging y producción; respaldos automáticos y restauración probada; monitoreo y alertas | M |
| T9 | Carga inicial de datos | Cargar los proyectos, unidades, usuarios y contenidos reales del cliente. No es una migración de código: alguien tiene que capturar el inventario | S |
| T10 | Documentación y entrega | Guía de roles, manual de uso y capacitación al equipo de Quisqueya Home | S |

**T7 es el riesgo más subestimado.** Hoy no hay URL por módulo: la navegación es `useState`. Conectar un backend obliga a reestructurar el archivo completo, y esa reestructuración toca todos los módulos a la vez.

## 12. Inventario de construcción por módulo

Formato: qué falta en backend · qué falta en frontend · de qué depende · tamaño.

**M1 · Contactos** — CRUD sobre `contacts`, búsqueda, detección de duplicados por teléfono y email. · Conectar tabla, filtros reales, ficha con historial real, paginación. · T1–T5. · **M**

**M2 · Leads** — Captura desde formulario y endpoint externo con idempotencia, asignación por especialidad, conversión a contacto y negocio, descarte. · Bandeja real, filtros funcionales, aviso de duplicado, flujo de conversión (no existe hoy). · M1. · **L**

**M3 · Pipeline y negocios** — CRUD de `deals`, cambio de etapa con validaciones de 10.1, historial, cierre transaccional de 10.2, motivo de pérdida. · Kanban conectado, columna o vista para perdidos, modal `"lost"` que hoy está declarado y sin implementar, inspector con datos reales. · M1, M2, M5. · **L**

**M4 · Actividades, tareas y agenda** — Unificar tareas y citas en `activities`, próxima acción obligatoria, cola diaria, exportación `.ics` desde datos reales. · Calendario con fechas reales (hoy usa índice de día 1–5), formulario de actividad ligado a contacto y negocio, vista de tareas conectada. · M1, M3. · **L**

**M5 · Propiedades y unidades** — CRUD de `projects` y `units`, cálculo de disponibilidad, restricción de precio real por permiso. · Rejilla y detalle conectados, filtros reales, tabla de unidades editable, alta de proyecto. · T1–T5. · **M**

**M6 · Avances de obra** — CRUD de `construction_phases` con número parametrizable por proyecto, carga de fotos a R2, publicación al portal. · Editor por fase con estado propio (hoy comparten un único porcentaje global), galería real. · M5. · **M**

**M7 · Brokers** — Perfil, especialidad, nivel calculado, asignación de propiedades, invitación. · Tarjetas conectadas, perfil de broker, asignar propiedades. · M5, M8. · **S**

**M8 · Metas** — CRUD de `goals`, alimentación automática desde el cierre, histórico anual. · Anillo y tabla conectados, selector de periodo funcional. · M3. · **S**

**M9 · Comisiones** — Generación al cierre, aprobación, pago, reporte por broker y periodo, exportación. · Tabla y KPIs conectados, filtros reales, cambio de estado. · M3. · **M**

**M10 · Academy** — CRUD de contenidos y checklists, progreso por usuario. · Tarjetas y checklist conectados y persistentes. · T1–T5. · **S**

**M11 · Comunicaciones** — CRUD de plantillas, sustitución de variables en servidor, registro del envío en el historial del contacto. · Editor conectado, apertura de WhatsApp que además registre la actividad. · M1. · **S**

**M12 · Reportes** — Agregaciones reales: embudo, canal, zona, motivos de pérdida, proyección ponderada, exportación. · Sustituir todas las cifras literales, rango de fechas funcional. · M2, M3, M4, M9. · **M**

**M13 · Configuración, usuarios y permisos** — CRUD de usuarios, roles y permisos, etapas del pipeline, catálogos, plantillas, integraciones. · Pantalla de usuarios (no existe), matriz granular, edición de etapas, cuatro pestañas que hoy están vacías. · T2, T3. · **L**

**M14 · Inicio** — Todas las agregaciones por rol de la sección 4. · Tres variantes conectadas a datos reales. · Todos los anteriores. · **M**

**M15 · Notificaciones** — Generación por evento, marcado de leídas, historial. · Panel conectado. · M2, M3, M4, M6. · **S**

## 13. Orden de construcción y dependencias

```
T1 Datos ─▶ T2 Auth ─▶ T3 RBAC ─▶ T4 Acceso ─┬─▶ T7 Rutas ─▶ T5 Estados ─▶ T6 Auditoría
                                              │
                                              ├─▶ M1 Contactos ─▶ M2 Leads ─▶ M3 Negocios ─┬─▶ M8 Metas
                                              │                                            ├─▶ M9 Comisiones
                                              │                                            └─▶ M4 Actividades
                                              ├─▶ M5 Propiedades ─▶ M6 Avances
                                              │                 └─▶ M7 Brokers
                                              ├─▶ M13 Configuración
                                              ├─▶ M10 Academy      (independiente)
                                              └─▶ M11 Comunicaciones (depende solo de M1)
                                                        │
                                       M12 Reportes ◀───┴───▶ M15 Notificaciones ─▶ M14 Inicio
```

Ruta crítica: **T1 → T2 → T3 → T4 → T7 → M1 → M2 → M3**. Todo lo demás cuelga de ahí o corre en paralelo.

Trabajo paralelizable desde temprano: M5 Propiedades, M10 Academy y M13 Configuración no dependen del núcleo comercial.

Trabajo que obligatoriamente va al final: M12 Reportes, M14 Inicio y M15 Notificaciones, porque agregan lo que los demás producen.

**Regla que protege el trabajo en paralelo:** T7 debe estar terminado **antes** de repartir módulos entre varias personas. Mientras la aplicación siga siendo un único `page.tsx`, dos personas trabajando en dos módulos distintos editan el mismo archivo y chocan en cada cambio. Con las rutas separadas, cada módulo tiene su carpeta y su dueño (ver §18).

**Nota de realismo:** son 10 capas transversales y 15 módulos. El núcleo que convierte esto en un sistema operable —y no en un prototipo— es `T1–T7 + M1 + M2 + M3 + M4 + M5`. Conviene que el cronograma garantice ese núcleo primero y trate el resto como incrementos con fecha propia, en vez de abrir los 15 módulos a la vez y terminar con quince cosas a medias.

## 14. Riesgos que amenazan el plazo

| Riesgo | Por qué importa | Mitigación |
|---|---|---|
| Refactor de `page.tsx` (T7) | 957 líneas en un componente cliente sin rutas. Toca todos los módulos a la vez | Hacerlo primero, no módulo por módulo |
| D1 sin configurar | `.openai/hosting.json` tiene `"d1": null`. Bloquea desde el día uno | Resolver en la primera semana |
| Aprobación de plantillas de WhatsApp | Meta aprueba con tiempos que no controlamos | No poner WhatsApp bidireccional en la ruta crítica |
| OAuth de Google Calendar | Exige proyecto en Google Cloud, pantalla de consentimiento y webhook HTTPS | Fase 1 solo con enlace y `.ics`, como ya hace el frontend |
| Sustituir datos literales | Cada cifra de Reportes e Inicio es una agregación por escribir | Tratar M12 y M14 como módulos, no como ajustes |
| Ausencia de pruebas | Solo existe `tests/rendered-html.test.mjs` | Cubrir los flujos de 10.1 y 10.2, que son los que corrompen datos |
| Pantallas sin diseño confirmado | Usuarios, papelera e importación existen en Figma pero no en el frontend | Decidir su alcance antes de la semana en que toquen |

## 15. Fuera de alcance del entregable

No entran en el CRM de dos meses:

- **Sistema 1 completo** — portal público y CMS son un producto aparte.
- Meta Lead Ads, WhatsApp Business bidireccional y sincronización de dos vías con Google Calendar.
- Campos personalizados, etiquetas, vistas guardadas, paleta de comandos.
- Constructor visual de automatizaciones; las cinco de 10.3 van programadas.
- Asistente de IA sobre WhatsApp.
- Aplicación móvil nativa; el frontend ya es responsive.

## 16. Criterios de terminado

El CRM se considera entregable cuando:

1. Un usuario no autorizado no puede leer ni modificar datos restringidos, verificado en servidor y no ocultando botones.
2. Todo cambio persiste y tiene autor y fecha.
3. Crear lead, asignar, contactar, mover, perder y cerrar tienen pruebas automáticas.
4. El cierre actualiza meta, nivel y comisión exactamente una vez.
5. Los duplicados por teléfono y email se detectan antes de crear.
6. Todo negocio en etapa abierta tiene próxima acción.
7. La agenda exporta y abre en Google Calendar sin duplicar eventos.
8. Cada control de la interfaz ejecuta una acción real, confirma éxito, muestra error y respeta permisos.
9. Las métricas de Inicio y Reportes provienen de consultas, no de constantes.
10. Existe respaldo y una restauración probada.

## 17. Ventana de entrega y capacidad

**Plazo:** tres meses hasta la entrega al cliente ≈ **12 semanas**, de las cuales las **2 últimas se reservan para QA**: revisión del código completo y verificación de seguridad, con margen para corregir lo que aparezca.

**Construcción real disponible: 10 semanas** — dos meses y dos semanas.

De esas 10 hay que descontar el arranque: configuración del repositorio, milestones, labels, CI y entornos. Aproximadamente un día, pero es un día que no está disponible para construir.

### 17.1 Peso relativo del trabajo

Convirtiendo los tamaños de §11 y §12 a peso (S = 1, M = 2, L = 3):

| Bloque | Peso |
|---|---:|
| Capas transversales (T1–T10) | 17 |
| Módulos (M1–M15) | 29 |
| **Total** | **46** |

Sobre 10 semanas de construcción, eso exige un ritmo de **~4,6 puntos por semana**. Un punto equivale al módulo más pequeño conectado de extremo a extremo —por ejemplo Metas o Academy, con su backend, su interfaz, sus permisos y sus estados.

**Esto es aritmética sobre pesos relativos, no una estimación en días.** Sirve para comparar bloques entre sí y para detectar si el plan está sobrecargado, no para prometer fechas. La conversión a semanas depende de cuánta gente entra y a qué velocidad trabaja, y eso lo sabes tú, no yo.

Lo que sí se puede afirmar: **4,6 puntos por semana es más de lo que sostiene una sola persona.** El cronograma tiene que resolverlo de una de tres formas —sumar gente, recortar alcance al núcleo de §13, o mover módulos a una fase posterior a la entrega— y conviene decidirlo al escribirlo, no en la semana siete.

## 18. Fronteras de módulo para trabajo en paralelo

Para que otra persona trabaje un módulo sin desbaratar el resto, cada módulo tiene dueño sobre unas tablas y una carpeta de rutas. Nadie escribe fuera de lo suyo sin acordarlo.

| Módulo | Tablas propias | Carpeta de ruta (tras T7) |
|---|---|---|
| M1 Contactos | `contacts` | `contactos/` |
| M2 Leads | `leads`, `lead_sources` | `leads/` |
| M3 Negocios | `deals`, `deal_properties`, `deal_stage_history`, `pipeline_stages`, `loss_reasons` | `pipeline/` |
| M4 Actividades | `activities`, `activity_sync` | `agenda/`, `tareas/` |
| M5 Propiedades | `projects`, `units` | `propiedades/` |
| M6 Avances de obra | `construction_phases` | `avances/` |
| M7 Brokers | `broker_profiles` | `brokers/` |
| M8 Metas | `goals` | `metas/` |
| M9 Comisiones | `commissions` | `comisiones/` |
| M10 Academy | `academy_*` (4 tablas) | `academy/` |
| M11 Comunicaciones | `message_templates` | `comunicaciones/` |
| M12 Reportes | ninguna (solo lectura) | `reportes/` |
| M13 Configuración | `roles`, `users`, `permissions`, `integration_accounts` | `configuracion/` |
| M14 Inicio | ninguna (solo lectura) | `inicio/` |
| M15 Notificaciones | `notifications` | transversal |
| Transversal | `sessions`, `audit_log`, `files` | — |

### 18.1 Recursos compartidos y sus reglas

| Recurso | Riesgo | Regla |
|---|---|---|
| `db/schema.ts` | Todos lo tocan; los conflictos de migración son costosos | Congelado. Todo cambio entra por su propio PR con migración generada, revisado aparte |
| `app/page.tsx` | Mientras exista, cualquier trabajo en paralelo colisiona | T7 lo desmonta antes de repartir módulos |
| `app/globals.css` | 478 líneas de estilos globales sin ámbito | Estilos nuevos por módulo; solo se toca lo global por acuerdo explícito |
| Seeds y permisos | Definen el comportamiento de todos los módulos | Un solo dueño; los módulos consumen, no modifican |
| Capa de RBAC (T3) | Si cada módulo filtra a su manera, la seguridad se vuelve inauditable | Consulta filtrada en un solo lugar; los módulos no escriben sus propios filtros por rol |

## 19. Preparación del cronograma

El cronograma vivirá en GitHub. La correspondencia con este documento es directa:

| En GitHub | Contenido | Origen |
|---|---|---|
| **Milestone** | Una fase con fecha de cierre | §19.1 |
| **Issue** | Una tarea de un módulo o capa | §11 y §12 |
| **Label** | `M1`…`M15`, `T1`…`T10`, tamaño `S/M/L`, tipo `backend`/`frontend`/`datos` | §11, §12 |
| **Project (board)** | Vista de tablero y de línea de tiempo | — |
| **CODEOWNERS** | Dueño por carpeta de módulo | §18 |
| **Actions** | Typecheck, `npm run build` y pruebas en cada PR | apoyo al QA |

Nota: *Actions* automatiza la verificación en cada cambio; no es donde vive el cronograma. Las **Milestones** son "las metas" que buscabas.

### 19.1 Agrupación sugerida en fases

Derivada de las dependencias de §13, no de fechas. El peso permite repartirlas sobre las 10 semanas de construcción.

| Fase | Contenido | Peso |
|---|---|---:|
| **F0 · Fundación** | T1 Datos, T2 Auth, T3 RBAC, T4 Acceso, T7 Rutas, T8 Entorno | 12 |
| **F1 · Núcleo comercial** | T5 Estados, T6 Auditoría, M1 Contactos, M2 Leads, M3 Negocios | 11 |
| **F2 · Operación diaria** | M4 Actividades, M5 Propiedades, M13 Configuración | 8 |
| **F3 · Inventario y equipo** | M6 Avances, M7 Brokers, M8 Metas, M9 Comisiones | 6 |
| **F4 · Contenido y dirección** | M10 Academy, M11 Comunicaciones, M12 Reportes, M14 Inicio, M15 Notificaciones | 7 |
| **F5 · Datos y entrega** | T9 Carga inicial, T10 Documentación y capacitación | 2 |
| **QA** | Revisión de código y pruebas — 2 semanas reservadas | — |

F0 y F1 concentran la mitad del peso, y es correcto que así sea: ahí está el riesgo. Una fase F0 que se desborda arrastra todo lo demás, porque nada puede empezar sin ella.

### 19.2 Qué debe resolver la sesión del cronograma

1. Definir cuántas personas trabajan y con qué dedicación, y contrastarlo con los 4,6 puntos por semana de §17.
2. Resolver la decisión de arquitectura de §20 con una prueba corta en la primera semana.
3. Asignar fechas de cierre a cada fase de §19.1.
4. Decidir qué se recorta o se mueve a una fase posterior a la entrega si la capacidad no alcanza.
5. Resolver el alcance de las pantallas que **no existen en el frontend confirmado** pero que el sistema necesita: gestión de usuarios, recuperación de contraseña, papelera e importación. Están diseñadas en Figma pero nadie las aprobó como parte del entregable.
6. Descomponer cada módulo en issues, usando como base el inventario de §12 y respetando las fronteras de §18.
7. Crear el repositorio, las milestones, las labels y el CODEOWNERS.

## 20. Convenciones fijadas y decisión pendiente

### 20.1 Convenciones ya resueltas en el esquema

Están implementadas en `db/schema.ts`. Se documentan aquí para que nadie las "corrija" en otra dirección a mitad del desarrollo, que es como aparecen los datos inconsistentes.

| Convención | Regla | Por qué |
|---|---|---|
| Fechas | ISO-8601 UTC, incluidos los valores por defecto de la base | `CURRENT_TIMESTAMP` de SQLite escribe `"2026-08-30 12:00:00"` y la aplicación escribe `"2026-08-30T12:00:00.000Z"`. En texto, el espacio ordena antes que la `T`: mezclarlos rompe `ORDER BY` y los rangos de fecha sin dar error |
| `updated_at` | Se actualiza vía `$onUpdate` de Drizzle | SQLite no tiene `ON UPDATE`. Sin esto el campo queda congelado en la fecha de creación |
| Dinero | Centavos enteros (`*_cents`) más su moneda | Nunca coma flotante para importes |
| Porcentajes de dinero | Puntos básicos enteros (`450` = 4,5 %) | La comisión se le paga a una persona; el redondeo de coma flotante produce disputas |
| Teléfonos | E.164 en `phone`, formato del usuario en `phone_display` | Deduplicar exige un formato canónico |
| Únicos con papelera | Índices parciales `WHERE deleted_at IS NULL` | Un único total impediría reutilizar el email de un usuario eliminado |
| Recursos y entidades | Listas cerradas (`PERMISSION_RESOURCES`, `ENTITY_TYPES`) | Con varias personas en paralelo, un `"Leads"` frente a `"leads"` desactiva un permiso en silencio |
| Zona horaria | Todo se guarda en UTC; la conversión a `America/Santo_Domingo` ocurre en la aplicación | |
| Esquema | Congelado. Todo cambio entra por su propio PR con migración generada | Los conflictos de migración entre ramas son caros |

### 20.2 Decisión pendiente: cómo leen y escriben los módulos

Es la única decisión estructural que queda, y **hay que tomarla antes de T7**, no durante. Define la forma de los 15 módulos: si se elige mal y se descubre en la semana cinco, se reescribe la aplicación entera.

Lo verificado en el repositorio:

- `app/layout.tsx` ya es componente de servidor.
- `examples/d1/app/api/notes/route.ts` demuestra que los *route handlers* con D1 y Drizzle funcionan en este stack.
- `app/page.tsx` es un único componente cliente, que es justo lo que T7 desmonta.

Recomendación: **lecturas desde componentes de servidor, escrituras por route handlers.** Los route handlers ya están probados aquí, dejan la API verificable de forma independiente por la persona de QA, y no dependen de que las *server actions* funcionen bajo `vinext`.

Prueba corta a hacer en la primera semana, antes de repartir módulos: un módulo pequeño de punta a punta —lectura desde servidor, escritura por route handler, permiso aplicado y estado de error— para confirmar el patrón. Si las server actions funcionan bien en este stack, simplifican los formularios y se adoptan ahí; si no, los route handlers cubren todo.

---

*Con las secciones 1 a 20 cerradas, este documento contiene todo lo necesario para construir el cronograma sin volver a analizar el frontend.*
