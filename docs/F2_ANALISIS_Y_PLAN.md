# F2 · Operación diaria — análisis y plan de implementación

Milestone **F2 · Operación diaria**. Contenido según §19.1 de
`MAPEO_FRONTEND_CRM.md`: **M4** Actividades, tareas y agenda · **M5**
Propiedades y unidades · **M13** Configuración, usuarios y permisos. Peso 8
de 46.

F1 quedó cerrada con los pasos de `docs/F1_ANALISIS_Y_PLAN.md` §7 (PR #12).
Este documento se escribe contra el repositorio real —`npm run typecheck` limpio
y **57 pruebas en verde**, verificado el 12 de septiembre de 2026—, no contra el
prototipo.

Se construye con **ponytail** (`/ponytail`, nivel `full`): la escalera —¿hace
falta?, ¿ya existe aquí?, ¿lo hace la plataforma?— antes de escribir una línea, y
una auditoría de sobre-ingeniería al cerrar cada paso (§10).

---

## 1. Qué entrega F2, y por qué no es «la fase de los módulos que faltan»

F1 entregó el núcleo comercial: contacto, lead, negocio, embudo y cierre
transaccional. Pero dejó el embudo **con cinco de sus seis puertas tapiadas**, y
no por un defecto: por orden de construcción.

Las validaciones de §10.1 ya están escritas, probadas y aplicándose en
`src/domain/` y en `src/app/api/pipeline/[id]/etapa/route.ts`. Lo que no existe
es la pantalla que permite cumplirlas:

| Transición | Exige | Hoy se cumple… |
|---|---|---|
| → Contactado | una actividad de contacto completada | ❌ nadie puede crear una actividad |
| → Presentación | próxima acción con responsable y fecha | ❌ `deals.next_activity_id` no lo escribe nadie |
| → Preselección | al menos una fila en `deal_properties` | ❌ no hay proyectos ni unidades, ni pantalla para asociarlas |
| → Negociación | monto, probabilidad, % comisión, fecha estimada | ❌ el inspector del negocio es de solo lectura |
| → Cierre (`won`) | monto final y unidad principal | ❌ depende de `units`, que está vacía |
| → Perdido (`lost`) | motivo del catálogo | ✅ funciona |

**F2 es la fase que hace utilizable lo que F1 construyó.** M4 abre las dos
primeras puertas, M5 las dos siguientes, y la deuda de F1 (§4.4) la quinta. Sin
F2, el criterio de terminado #4 —«el cierre actualiza meta, nivel y comisión
exactamente una vez»— está implementado y probado, pero **no se puede ejercer
desde la interfaz ni una sola vez**.

Lo segundo que entrega F2 es dejar de administrar el sistema por SQL: hoy dar de
alta a un usuario es crear a mano la cuenta en Supabase Auth y escribir un
`INSERT` en `users` (`docs/contexto/errores-conocidos.md`, sección Operación).
Eso es M13.

## 2. Estado real hoy, verificado en el repositorio

| Pieza | Estado | Evidencia |
|---|---|---|
| Patrón de lectura/escritura fijado y documentado | ✅ | `src/infrastructure/README.md`, M1 |
| Permiso, alcance y papelera en SQL | ✅ | `visibleRows` + `requireScopeInPage` |
| Auditoría dentro de la transacción | ✅ | `src/infrastructure/audit.ts` + pruebas |
| Interfaz completa del prototipo portada y maquetada | ✅ | `src/app/globals.css`, 15 `vista.tsx` |
| Tablas `activities`, `activity_sync` | ✅ existen, vacías | `src/infrastructure/db/schema.ts:676` |
| Tablas `projects`, `units` | ✅ existen, **sin una sola fila** | `db/seed.sql` no siembra inventario |
| `roles`, `permissions`, `pipeline_stages`, `loss_reasons`, `lead_sources` | ✅ existen y sembradas | `db/seed.sql` |
| Lectura de `activities` desde el pipeline | ✅ ya la hace | `pipeline/page.tsx:92`, `etapa/route.ts:88` |
| Cancelación de actividades futuras al cerrar | ✅ ya la hace | `etapa/_cierre.ts`, paso 7 |
| **Escritura en `activities`** | ❌ nadie crea ninguna | — |
| **CRUD de `projects` / `units`** | ❌ no existe | — |
| **Alta de usuarios, permisos, etapas, papelera** | ❌ no existe | altas manuales por SQL |
| Agenda, Tareas, Propiedades, Configuración | ⚠️ maqueta con datos de muestra | `_ui/datos-muestra.ts` + 4 `vista.tsx` |

Las cuatro vistas de F2 ya existen, están aprobadas por el cliente y llevan su
comentario `ponytail:` diciendo exactamente qué hay que sustituir. **F2 no diseña
pantallas: sustituye `useState` por consultas.**

## 3. Los seis hallazgos que cambian el plan

### 1. Agenda y Tareas no son dos módulos: son dos `SELECT` sobre la misma tabla

El prototipo tenía `Appointment` y `Task` como estructuras separadas sin vínculo
a contacto ni a negocio — catalogado como defecto en §8.2. El esquema ya lo
resolvió: `activities` tiene `activity_type`, `starts_at`, `assignee_id`,
`contact_id`, `deal_id` y `status`. Una cita es una actividad con `starts_at`;
una tarea es una actividad pendiente.

`/agenda` y `/tareas` son dos rutas que **ya apuntan al mismo recurso de
permisos** (`activities`, `modulos.ts:28-29`). Un solo grupo de route handlers
(`/api/actividades`) y dos páginas que consultan distinto. No hay «módulo de
tareas» y «módulo de agenda» que mantener en paralelo.

### 2. Las fechas reales no necesitan librería: `Intl` ya está en el runtime

La agenda del prototipo usa índice de día (`1..5`), hora entera y un offset
`-04:00` escrito a mano. Una agenda real necesita `starts_at` —que ya es
`timestamptz`— y convertir a `America/Santo_Domingo` **solo al pintar**.

`Intl.DateTimeFormat("es-DO", { timeZone: "America/Santo_Domingo", … })` está en
Node y en el navegador, sin instalar nada. `date-fns-tz` o `luxon` son 20–70 KB
para lo que aquí son seis líneas. La rejilla semanal se calcula con aritmética de
`Date` sobre el lunes de la semana pedida por `searchParams`.

### 3. El `.ics` es texto plano, y el identificador estable ya lo da la base

`exportCalendar()` del prototipo genera el `.ics` en el navegador con un `UID`
inventado (`{day}-{time}@quisqueyahome.com`) que duplica eventos al
resincronizar. Con datos reales el `UID` es `activity-{id}@quisqueyahome.com`: la
clave primaria **es** el identificador estable que pide la regla R11.

Un `VEVENT` son ~15 líneas de texto. `ics` o `ical-generator` como dependencia,
para exportar una agenda semanal, no se justifica. Va en un route handler que
responde `text/calendar` — y así el filtro de permisos se aplica en el servidor,
que es donde vive.

**`activity_sync` no se toca en F2.** Existe para la sincronización de dos vías
con Google Calendar, que §14 clasifica explícitamente como fase posterior.
Escribir en ella ahora es mantener una tabla que nadie lee.

### 4. El precio real no se oculta en el JSX: no se selecciona en el `SELECT`

R7 y §10.4 exigen que `units.real_price_cents` y `projects.internal_price_cents`
solo sean visibles con permiso sobre `unit_real_price`. El prototipo lo resuelve
con `role === "admin"` en el render — es decir, **el dato viaja al navegador y se
esconde al pintarlo**. Cualquiera lo ve en el HTML.

La versión correcta es también la más corta: el `select()` incluye esas columnas
solo si el actor tiene el permiso. El dato que no se selecciona no se filtra, no
se serializa y no se escapa. Es la primera restricción **a nivel de campo** del
sistema, y conviene que nazca bien porque M6, M7, M9 y M12 la repetirán.

### 5. La matriz de permisos del prototipo describe un modelo que ya no existe

La pantalla aprobada tiene 8 filas × 3 columnas de casillas. El modelo real
—decisión #2, implementada y probada— es **recurso × acción × alcance**: 21
recursos, 6 acciones, 4 alcances. El propio mapeo señala que esa matriz «cubre 8
alcances frente a 15 módulos».

Traducir 8 casillas a las filas de `permissions` exige inventar reglas que nadie
aprobó (¿«Leads ✓» concede `delete`?, ¿con qué alcance?). **Se pinta la matriz
real**: una fila por recurso, una columna por acción y, en cada celda, el alcance
(`ninguno`/`propio`/`equipo`/`todos`). Misma disposición visual, mismo CSS, datos
honestos. La columna del administrador queda bloqueada (R10, §10.4).

### 6. El alta de usuario ya está prevista en el esquema: `auth_user_id` nace nulo

`users.auth_user_id` lleva escrito en su comentario «nulo mientras el usuario
existe en el CRM pero aún no ha sido invitado». No hay que inventar un flujo de
dos fases: **está diseñado**.

Alta = `INSERT` en `users` (transaccional, auditado, con `auth_user_id` nulo) y
después `auth.admin.inviteUserByEmail`. Si la invitación falla, el usuario existe
en el CRM sin poder entrar — un estado reparable con un botón «reenviar
invitación». Al revés sería una cuenta de Auth huérfana sin rol. Requiere
`SUPABASE_SERVICE_ROLE_KEY`, declarada en `env.ts` y **solo servidor**.

## 4. Análisis módulo por módulo

### 4.1 M4 · Actividades, tareas y agenda — `size: L`

**Qué pide §12:** unificar tareas y citas en `activities`, próxima acción
obligatoria, cola diaria, exportación `.ics` desde datos reales, calendario con
fechas reales, formulario ligado a contacto y negocio, vista de tareas conectada.

**Qué se hace:**

- `POST /api/actividades` y `PATCH /api/actividades/[id]` con el patrón de M1:
  `parseInput` → `requireScope` → `transaction` con `auditar` dentro →
  `errorResponse`. Completar una tarea es un `PATCH` de `status`, no un endpoint
  propio.
- `/tareas`: cola del día (pendientes de hoy y vencidas), filtrada por
  `visibleRows(actor, scope, activities.assigneeId, activities.deletedAt)` — la
  columna de responsable aquí es `assignee_id`, no `broker_id`, y
  `rbac-filter.ts` ya lo contempla.
- Panel «Carga del equipo»: un `COUNT(*) GROUP BY assignee_id`. Solo se pinta con
  alcance `all`: a un broker, mostrarle la carga ajena es la métrica global que
  §10.4 reserva.
- `/agenda`: rejilla semanal con fechas reales, semana navegable por
  `searchParams`, render en `America/Santo_Domingo`.
- `GET /api/actividades/calendario.ics`: `text/calendar` generado en servidor,
  `UID = activity-{id}@quisqueyahome.com`, filtrado por permiso.
- Enlace a Google Calendar por evento: se porta del prototipo tal cual
  (`googleCalendarUrl`), que ya lleva `ctz=America/Santo_Domingo`.
- **La próxima acción del negocio:** al crear una actividad con `dealId` se
  escribe `deals.next_activity_id` en la misma transacción. Es lo que destapa la
  transición → Presentación.
- Automatizaciones §10.3 **#1** (lead nuevo → tarea «Contactar» para el broker
  sugerido) y **#3** (cambio de etapa → próxima actividad). La «plantilla» de #3
  es un objeto literal `etapa → { tipo, título, días }` en el dominio, marcado
  con `ponytail:` — no un motor de reglas configurable para seis entradas.

**Qué no se hace:** `activity_sync`, OAuth de Google, las vistas Día y Mes de la
agenda (inertes también en el prototipo; el equipo trabaja por semana) y la
alerta de SLA de §10.3 #2 — necesita un ejecutor programado que no existe hasta
T8 (aplazado por la decisión #17).

### 4.2 M5 · Propiedades y unidades — `size: M`

**Qué pide §12:** CRUD de `projects` y `units`, cálculo de disponibilidad,
restricción de precio real por permiso, rejilla y detalle conectados, filtros
reales, tabla de unidades, alta de proyecto.

**Qué se hace:**

- Rejilla `/propiedades` con filtros reales de zona, tipo y estado por
  `searchParams`, y `visibleRows(actor, scope, projects.brokerId,
  projects.deletedAt)` — R6: el broker solo ve sus proyectos.
- El `"12/40"` del prototipo, que era literal, sale de un
  `COUNT(*) FILTER (WHERE status = 'available')` sobre `units`. Una consulta
  agregada, no un campo cacheado que haya que mantener sincronizado.
- Detalle del proyecto con la tabla de unidades y sus ocho columnas. El `slug` ya
  tiene índice único parcial; se genera a partir del nombre.
- `POST`/`PATCH` de proyecto y de unidad con el patrón de M1. Borrado lógico
  (`deleted_at`), nunca `DELETE`.
- **Precio real por permiso, decidido en el `SELECT`** (§3.4), en la rejilla, en
  el detalle y en el route handler.

**Qué no se hace:** fotos y archivos (`files` → M6), fases de obra
(`construction_phases` → M6), publicación al portal (`is_published` → M6),
asignación masiva de propiedades a brokers (M7) e importación de inventario (T9,
F5 — el inventario real lo carga el cliente, no el desarrollo).

### 4.3 M13 · Configuración, usuarios y permisos — `size: L`

**Qué pide §12:** CRUD de usuarios, roles y permisos, etapas del pipeline,
catálogos, plantillas, integraciones. Siete pestañas, de las que hoy tres tienen
contenido y ninguna guarda nada.

| Pestaña | F2 |
|---|---|
| Usuarios y roles | ✅ Alta con invitación, edición, activar/desactivar, cambio de rol, perfil de broker (especialidad, alquileres, meta mensual) |
| Permisos | ✅ Matriz real recurso × acción con alcance por celda; administrador bloqueado |
| Etapas del pipeline | ✅ Renombrar, reordenar, probabilidad por defecto, activar/desactivar |
| Catálogos | ✅ Motivos de pérdida y canales de captación (mismo formulario, dos tablas) |
| Papelera | ✅ Listado de lo borrado y restauración, auditada |
| Integraciones | ⚠️ Solo el estado real leído de `integration_accounts`; botones deshabilitados con su motivo |
| Plantillas de WhatsApp | ❌ Es M11 (F4), dueño de `message_templates` (§18) |
| Metas · Comisiones | ❌ Son M8 y M9 (F3) |
| Marca | ❌ Dos colores en `globals.css`. Hacerlos configurables es una tabla, una pantalla y un tema recargable para algo que cambia cada cinco años |

**El `slug` y el `kind` de una etapa no se editan.** El nombre sí —es lo que pide
la decisión #1—, pero `kind` decide si un negocio está ganado o perdido:
cambiarlo reescribiría en silencio el significado de los negocios ya cerrados, y
de ahí cuelgan el nivel del broker y la comisión. El `slug` es la identidad que
usa el código.

**La matriz surte efecto en la petición siguiente**, sin trabajo extra:
`getActor` resuelve los permisos con un `JOIN` por petición y su `cache` de React
vive solo dentro de un render.

**Qué no se hace:** roles nuevos (los tres del negocio están sembrados y son
`is_protected`; crear roles es otra pantalla y nadie la ha pedido), borrado duro,
y restablecer contraseñas desde el panel — `api/auth/recuperar` ya existe y es el
camino correcto.

### 4.4 Deuda de F1 que cierra F2 — `size: S`

`docs/F1_ANALISIS_Y_PLAN.md` §10 dejó pendientes anotados a propósito. Dos dejan
de ser aplazables en cuanto M4 y M5 existen, porque son lo único que separa al
embudo de funcionar de punta a punta:

1. **Edición del negocio** (`amount_cents`, `probability`,
   `commission_basis_points`, `expected_close_date`): un `PATCH` análogo al de M1
   con más campos. Sin él, → Negociación es inalcanzable.
2. **Unidades de interés y unidad principal** (`deal_properties`): asociarlas al
   negocio desde el inspector. Sin ellas, → Preselección y → Cierre son
   inalcanzables. Depende de M5.
3. **Reasignar el `broker_id` de un contacto**: el `PATCH` ya lo soportaría; solo
   falta el campo en el esquema Zod y el selector en el formulario, limitado a
   alcance `all`. Depende de M13, que es lo que da usuarios entre los que elegir.

El pendiente de los **umbrales de nivel de broker** no se cierra aquí: es una
pregunta para el negocio, no código, y su sitio natural es M8 Metas (F3).

## 5. Orden y paralelización

```
M5  Propiedades ───────────┬──▶ Deuda de F1 (edición de negocio + unidades de interés)
M4a Actividades ──▶ M4b Agenda
M13a Usuarios y permisos ──▶ M13b Catálogos, etapas y papelera
```

Los tres módulos **no comparten ni una tabla**: M4 escribe `activities`, M5
`projects`/`units`, M13 `users`/`permissions`/`pipeline_stages`/`loss_reasons`/
`lead_sources`. Las fronteras de §18 se respetan sin esfuerzo y **los tres pueden
correr en paralelo** desde el primer día. Nadie toca `db/schema.ts`.

Orden recomendado si se construyen en serie: **M5 → M4 → M13 → deuda de F1.** M5
es el más barato (`size: M`), fija el patrón de recurso anidado
(proyecto → unidades) que M6 repetirá, y destapa dos de las puertas del embudo.
La deuda de F1 va al final porque depende de las otras dos.

## 6. Decisiones que hay que tomar antes de escribir código

| # | Asunto | Decisión propuesta | Consecuencia si se pospone |
|---|---|---|---|
| 23 | Agenda y tareas: ¿dos módulos o dos vistas? | **Dos vistas sobre `activities`**, un solo grupo de route handlers | Dos CRUD que se desincronizan, y el defecto §8.2 del prototipo reproducido |
| 24 | Zona horaria y fechas | `timestamptz` en la base; `Intl` con `America/Santo_Domingo` **solo al pintar**; sin librería de fechas | Offsets escritos a mano, como el `-04:00` del prototipo |
| 25 | `.ics` y sincronización | Texto generado en servidor con `UID = activity-{id}@…`; **`activity_sync` intacta** hasta que haya OAuth | Eventos duplicados al resincronizar, y una tabla que nadie lee |
| 26 | Precio real | Se decide en el `SELECT`, no en el JSX | El dato viaja al navegador y se «oculta» al pintarlo (defecto R7 del prototipo) |
| 27 | Matriz de permisos | Se pinta el modelo real (recurso × acción × alcance), no las 8 casillas del prototipo | Inventar una traducción que nadie aprobó y conceder permisos en silencio |
| 28 | Alta de usuarios | `INSERT` con `auth_user_id` nulo → `inviteUserByEmail` con la clave de servicio | Se sigue administrando el CRM por SQL a mano |
| 29 | Etapas editables | Nombre, orden, probabilidad y activación **sí**; `slug` y `kind` **no** | Un cambio de `kind` reescribe el significado de los negocios cerrados |

Ninguna depende de terceros. La única que necesita un dato externo es la #28: la
**clave de servicio de Supabase** (`Project Settings → API Keys → service_role`),
que el cliente ya tiene en su panel.

## 7. Plan de implementación

Cada paso es un PR sobre `dev/jvven` contra `develop`, con
`npm run typecheck && npm run lint && npm test && npm run build` en verde antes
de abrirlo y una pasada de `/ponytail-review` sobre el diff (§10).

### Paso 1 — M5 · Propiedades y unidades
Rejilla con filtros reales y disponibilidad calculada; detalle con la tabla de
unidades; alta y edición de proyecto y de unidad por route handler; borrado
lógico; precio real decidido en el `SELECT` por `unit_real_price`.
*Verificación:* prueba de que la consulta **no** incluye la columna de precio real
sin permiso (al estilo de `rbac-filter.test.ts`, inspeccionando el SQL
compilado); comprobación manual de que un broker no ve proyectos ajenos.

### Paso 2 — M4a · Actividades y tareas *(paralelizable con el paso 1)*
Route handlers de `activities`; `/tareas` con cola del día y carga del equipo;
vínculo a contacto, negocio y proyecto; escritura de `deals.next_activity_id` en
la misma transacción; automatización §10.3 #1.
*Verificación:* prueba de que crear una actividad de un negocio deja
`next_activity_id` apuntando a ella; comprobación de que → Contactado pasa a ser
posible con una actividad completada y sigue fallando sin ella.

### Paso 3 — M4b · Agenda semanal, `.ics` y automatización de etapa
Rejilla semanal con fechas reales y semana navegable; render en
`America/Santo_Domingo`; endpoint `.ics` con `UID` estable; enlace a Google
Calendar; automatización §10.3 #3.
*Verificación:* prueba de la generación del `.ics` (un evento a las 9:00 de Santo
Domingo sale como `13:00Z`, y el `UID` es el mismo entre dos exportaciones).

### Paso 4 — M13a · Usuarios, roles y permisos *(paralelizable con 1 y 2)*
`SUPABASE_SERVICE_ROLE_KEY` en `env.ts` y `.env.example`; alta con invitación,
edición, activación y cambio de rol; perfil de broker; matriz real de permisos
con el administrador bloqueado; todo auditado.
*Verificación:* prueba de que la matriz no deja escribir sobre el rol protegido;
comprobación manual de que quitar `contacts:view` a un rol devuelve 403 en la
petición siguiente.

### Paso 5 — M13b · Etapas, catálogos, papelera e integraciones
Edición de etapas (sin `slug` ni `kind`); motivos de pérdida y canales;
restauración desde la papelera con auditoría; integraciones en solo lectura con
su estado real.
*Verificación:* prueba de que renombrar «Cierre» no altera el comportamiento del
cierre (las reglas cuelgan de `kind`); comprobación de que restaurar un contacto
lo devuelve al listado.

### Paso 6 — Deuda de F1
Edición del negocio, unidades de interés con unidad principal y reasignación del
responsable de un contacto.
*Verificación:* **la prueba de la fase**: un lead entra, se convierte, recorre las
seis etapas cumpliendo cada requisito desde la interfaz y se cierra — una sola
vez, con meta, nivel y comisión actualizados.

### Paso 7 — Cierre de fase
`docs/F2_ESTADO.md` con lo verificado y cómo; `datos-muestra.ts` reducido a lo
que siga siendo mock; `/ponytail-audit` y `/ponytail-debt` sobre el repositorio
completo (§10); `docs/contexto/` actualizado con las decisiones #23–#29.

## 8. Cuándo está terminado F2

1. Un negocio recorre las seis etapas cumpliendo los requisitos de §10.1 **desde
   la interfaz**, sin un `INSERT` a mano en ninguna de ellas.
2. Una actividad se crea, se asigna, se completa y aparece en la cola del día y en
   la semana correcta de la agenda, en hora de Santo Domingo.
3. El `.ics` exportado dos veces produce el mismo `UID` por evento.
4. Un proyecto se da de alta con sus unidades y su disponibilidad se calcula sola.
5. El precio real no aparece en el HTML de quien no tiene `unit_real_price`.
6. Un usuario se da de alta desde la aplicación, recibe su invitación y entra con
   su rol — sin tocar Supabase ni SQL.
7. Cambiar un alcance en la matriz de permisos cambia lo que ese rol puede hacer
   en la petición siguiente.
8. Un registro borrado se restaura desde la papelera y queda en `audit_log`.
9. Todo lo anterior queda en `audit_log` con autor y fecha.
10. `npm run typecheck && npm run lint && npm test && npm run build` en verde.

## 9. Lo que F2 deliberadamente no construye

- **Sincronización de dos vías con Google Calendar y OAuth** — §14 la clasifica
  como fase posterior. F2 deja `.ics` y enlace, que es lo que el frontend
  aprobado ya hacía.
- **Alertas de SLA** (§10.3 #2) — necesitan ejecutor programado; entran con T8.
- **Fases de obra, fotos y publicación al portal** — son M6 (F3).
- **Plantillas de WhatsApp** — son M11 (F4), dueño de `message_templates`.
- **Metas y comisiones configurables** — son M8 y M9 (F3).
- **Importación de inventario** — es T9 (F5).
- **Roles nuevos y personalización de marca** — nadie los ha pedido; los tres
  roles del negocio están sembrados y protegidos.

## 10. Ponytail: cómo se construye y cómo se audita

El encargo es explícito: **el código de F2 se escribe en modo ponytail y cada
paso se audita.**

**Durante la construcción** (`/ponytail`, nivel `full`): la escalera antes de
escribir —¿hace falta?, ¿ya existe en este repositorio?, ¿lo hace la plataforma?,
¿lo hace una dependencia ya instalada?—. Para F2 eso significa reutilizar
`visibleRows`, `requireScope`, `parseInput`, `errorResponse`, `auditar`,
`transaction` y el CSS ya portado, y no añadir **ninguna** dependencia nueva: la
agenda es `Intl`, el `.ics` es texto y los filtros son `searchParams`.

Toda simplificación con techo conocido lleva su comentario `ponytail:` con el
límite y la salida — igual que ya lo llevan las cuatro vistas de muestra.

**Al cerrar cada paso:** `/ponytail-review` sobre el diff del PR. Busca solo
sobre-ingeniería —abstracción especulativa, dependencia evitable, código que
reimplementa algo que ya vive en el repositorio—; la corrección la cubren las
pruebas y `/code-review`.

**Al cerrar la fase (paso 7):** `/ponytail-audit` sobre el repositorio completo y
`/ponytail-debt` para recoger en `docs/F2_ESTADO.md` todos los `ponytail:`
acumulados desde F0. Una deuda anotada y no revisada es una deuda olvidada.
