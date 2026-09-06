# F1 · Núcleo comercial — análisis y plan de implementación

Milestone **F1 · Núcleo comercial**. Contenido según §19.1 de
`MAPEO_FRONTEND_CRM.md`: **T5** Estados de interfaz · **T6** Auditoría ·
**M1** Contactos · **M2** Leads · **M3** Negocios. Peso 11 de 46 — junto con F0
es la mitad del proyecto.

F0 quedó cerrada el 1 de septiembre de 2026 (`docs/F0_ESTADO.md`). Este
documento se escribe contra el repositorio real, no contra el prototipo.

---

## 1. Qué entrega F1, y por qué es la fase que decide el proyecto

F0 entregó el suelo: base de datos, sesión, permiso en servidor, una forma única
de leer y escribir, y una carpeta por módulo. **Nada de eso se ve.** Hoy la
aplicación arranca, autentica, filtra por rol y responde 403 — y muestra quince
páginas que dicen «pendiente de construir en F1».

F1 es la primera fase que produce algo que el cliente puede usar: registrar un
contacto, recibir un lead, moverlo por el embudo y cerrarlo. Es también donde se
ganan o se pierden **cinco de los diez criterios de terminado** (§16):

| # | Criterio | Dónde se gana en F1 |
|---|---|---|
| 2 | Todo cambio persiste y tiene autor y fecha | T6 |
| 3 | Crear lead, asignar, contactar, mover, perder y cerrar tienen pruebas | M2 + M3 |
| 4 | El cierre actualiza meta, nivel y comisión **exactamente una vez** | M3 |
| 5 | Los duplicados por teléfono y email se detectan antes de crear | M1 |
| 8 | Cada control ejecuta una acción real, confirma éxito, muestra error y respeta permisos | T5 + M1–M3 |

Y cierra la última decisión estructural abierta, §20.2 (cómo leen y escriben los
módulos): el mapeo pide «un módulo pequeño de punta a punta antes de repartir
módulos». **Ese módulo es M1.** No hay que hacer una prueba aparte; M1 *es* la
prueba.

## 2. Estado real hoy, verificado en el repositorio

`npm run typecheck` limpio, `npm test` 14/14 en verde, 24 rutas en el build.

| Pieza | Estado | Evidencia |
|---|---|---|
| Actor, rol y permisos por petición | ✅ Existe | `src/infrastructure/auth/actor.ts` |
| Decisión de permiso, pura y probada | ✅ Existe | `src/domain/rbac.ts` + 8 pruebas |
| Filtro por responsable y papelera en SQL | ✅ Existe | `src/infrastructure/rbac-filter.ts` + 6 pruebas |
| Errores de dominio → HTTP, validación de entrada | ✅ Existe | `src/infrastructure/http.ts` |
| Conexión única y `transaction()` | ✅ Existe | `src/infrastructure/db/client.ts` |
| 29 tablas y los catálogos sembrados | ✅ Aplicado en Supabase | `db/seed.sql` |
| 15 carpetas de ruta con guardia de permiso | ✅ Existe | `src/app/(crm)/*/page.tsx` |
| **Estilos** | ❌ **No existe ni una línea de CSS** | no hay `globals.css` en `src/app/` |
| **Escritura en `audit_log`** | ❌ La tabla existe, nadie escribe en ella | — |
| **Casos de uso** | ❌ `src/application/` vacío salvo READMEs | decisión #16 |
| Contactos, leads, negocios | ❌ Ninguna consulta real | placeholders |

### El detalle que nadie ve hasta que abre el navegador

El shell de T7 pinta `<div className="crm-shell">`, `<nav>`, `<header>` — contra
un archivo de estilos **que no existe**. La aplicación hoy se ve como HTML sin
formato. Eso no es un defecto de T7: T7 entregó la estructura, maquetar es T5.
Pero significa que **T5 no es un adorno que se deja para el final: es el primer
paso de F1**, porque M1, M2 y M3 son pantallas y hoy no hay dónde ponerlas.

## 3. Los seis hallazgos que cambian el plan

### 1. T5 no se diseña: se porta. 478 líneas ya escritas y aprobadas

`referencia-prototipo/app/globals.css` es un sistema de diseño completo en **CSS
plano** —variables de color, `.button`, `.table-wrap`, `.filter-bar`,
`.split-view`, `.inspector`, `.kanban`, `.deal-card`, `.empty`, `.panel`,
`.metric`— y es exactamente la interfaz que el cliente ya vio y aprobó en el
prototipo.

La única atadura a Tailwind es la primera línea (`@import "tailwindcss"`); lo
demás es CSS que funciona tal cual. Las dos fuentes (`--font-atkinson`,
`--font-hanken`) se resuelven con `next/font` o con una pila de respaldo.

**Portarlo entero y borrar lo que sobre es más barato y más fiel que rediseñar.**
Lo que hay que *añadir* son los cuatro estados que el prototipo nunca tuvo:
cargando, sin resultados, error y deshabilitado-por-permiso. La 403 ya tiene
página (`src/app/forbidden.tsx`), sin maquetar a propósito.

### 2. Next 15 ya trae los estados de carga y error como archivos

`loading.tsx` y `error.tsx` por segmento de ruta. No hace falta estado global, ni
`isLoading` en cada componente, ni una librería. Es una convención del framework
que ya está instalado. T5 se reduce a: un CSS portado, dos archivos por módulo y
tres componentes compartidos (`<Vacio>`, `<SinResultados>`, `<AvisoPermiso>`).

### 3. T6 es un helper de veinte líneas, y su trampa está en *dónde* se llama

La tabla `audit_log` existe con `previousValue`/`newValue` como texto JSON. No
hace falta modelar nada. Lo que sí decide el resultado: **la escritura de
auditoría va dentro de la misma transacción que el cambio, nunca después.** Fuera
de la transacción, un fallo deja el dato cambiado sin rastro o el rastro sin
dato — y el criterio #2 se pierde en silencio, que es la peor forma de perderlo.

### 4. Duplicados: detectar y avisar, no prohibir — y sin tocar el esquema

El criterio #5 dice «se detectan antes de crear», no «se impiden». La distinción
importa: en una inmobiliaria una pareja comparte teléfono, y el mismo número
entra por WhatsApp y por el portal el mismo día. Un único duro en
`contacts.phone` convertiría un caso real en un error irrecuperable para el
usuario.

Hoy `contacts_phone_idx` y `contacts_email_idx` existen y **no** son únicos. El
esquema está congelado (§18.1) y **no hay que cambiarlo**: la detección es una
consulta previa que responde 409 con los candidatos, más un `crear_igual: true`
explícito para forzar. Cero migración, cero conflicto de journal.

La normalización a E.164 son diez líneas: República Dominicana es `+1` con
809/829/849. `libphonenumber-js` son ~500 KB para cubrir 200 países que este CRM
no usa.

### 5. La idempotencia de M2 ya está en la base de datos

`leads_external_id_unq` es un índice único parcial que ya existe y ya está
aplicado. La captura idempotente desde el portal es `ON CONFLICT DO NOTHING` y
devolver el lead existente. No hace falta tabla de idempotencia, ni cola, ni
cabecera `Idempotency-Key`.

Lo mismo en M3: `commissions_deal_unq` es único por `deal_id`. **El criterio #4
—«exactamente una vez»— lo garantiza la base, no una bandera en el código.**

### 6. Deuda de F0 que muerde en F1: `convenciones.md` sigue describiendo SQLite

`docs/contexto/convenciones.md` dice todavía «fechas: texto ISO-8601»,
«`$onUpdate` porque SQLite no tiene `ON UPDATE`» y describe pruebas que corren
contra `dist/`. Nada de eso es cierto desde la decisión #13 (tipos nativos de
Postgres).

Es el documento que alguien lee **antes de escribir el primer módulo**. Si se
reparte M1, M2 y M3 con ese texto vigente, alguien guardará fechas como texto y
el error aparecerá en Reportes, tres fases después. Se corrige antes de repartir,
no cuando estorbe.

## 4. Análisis capa por capa

### T5 · Estados de interfaz — `size: M`, en la práctica S

**Qué pide:** carga, vacío, sin resultados, error, 403 y deshabilitado por
permiso. §12 apunta que «hoy solo existe `Empty`».

**Qué se hace:** portar `globals.css` (sin la línea de Tailwind), maquetar el
shell de T7 y `forbidden.tsx` contra ese CSS, y añadir los cuatro estados que
faltan. Los de carga y error son archivos del framework; los otros dos son
componentes de servidor de diez líneas.

**Deshabilitado por permiso** es el único que tiene sustancia: un botón que el
usuario ve pero no puede usar necesita decir *por qué*, y el permiso ya lo
resuelve `can()` del dominio. Se pinta con `can()`, se **autoriza** con
`requireScope`. Ocultar el botón no es seguridad (§16 #1) y mostrarlo sin
explicación no es interfaz.

### T6 · Auditoría — `size: S`

**Qué pide:** escritura en `audit_log` en toda acción sensible, más la vista de
historial.

**Qué se hace:** una función `auditar(tx, actor, accion, entidad, id, antes,
despues)` que se llama **dentro** de la transacción, y un componente de historial
que se monta en la ficha del contacto y en el inspector del negocio.

**Qué no se hace:** ni triggers de base de datos, ni middleware que intercepte
todas las escrituras, ni un decorador genérico. «Acción sensible» es una lista
corta y explícita —crear/editar/eliminar contacto, convertir lead, cambiar etapa,
cerrar negocio, marcar perdido—, y una lista corta se escribe a mano.

### M1 · Contactos — `size: M` · **es la prueba que cierra §20.2**

CRUD, búsqueda, paginación, detección de duplicados, ficha con historial real.

Es el módulo que fija la forma de los catorce restantes:

- Lectura en el `page.tsx`: `requireActor` → `requireScopeInPage` → `visibleRows`.
- Escritura en `app/api/contactos/route.ts`: `parseInput` → `requireScope` →
  `transaction` (con `auditar` dentro) → `errorResponse` en el `catch`.
- Búsqueda y paginación por `searchParams`, no por estado de cliente: la URL es
  compartible y el filtro se aplica en SQL, que es donde el permiso ya vive.

**Sin repositorios ni puertos.** La decisión #16 dice que nacen «con el caso de
uso que los necesite», y este no los necesita: la consulta vive en el archivo del
módulo, filtrada por `visibleRows`. Un puerto por tabla con una implementación y
un consumidor es código muerto con nombre elegante. `src/application/use-cases/`
se estrena en M3, con la única lógica de F1 que se prueba sin HTTP.

**Paginación:** `LIMIT`/`OFFSET` sobre `searchParams`. Ni cursores, ni scroll
infinito, ni librería de tabla, hasta que alguien tenga 50 000 contactos.

### M2 · Leads — `size: L`

Captura manual y por endpoint externo con idempotencia, asignación por
especialidad, aviso de duplicado, conversión a contacto y negocio, descarte.

Tres piezas con sustancia:

1. **El endpoint externo no lleva sesión.** Es la única entrada pública del
   sistema y por tanto el único sitio donde el RBAC no aplica. Necesita su propia
   puerta: token compartido en cabecera, validación estricta de la entrada y
   `external_id` obligatorio. Un endpoint público sin autenticar es una vía de
   inserción abierta a internet, y el modelo de permisos no lo cubre porque no
   hay actor.
2. **Asignación por especialidad.** `broker_profiles.specialty` y
   `handles_rentals` ya existen. La regla del MVP (§10.3 #1) es *sugerir*:
   `leads.suggested_broker_id` ya está en el esquema, separado de `broker_id`
   justo para eso. Sugerir no reparte trabajo sin que nadie mire, y no hace falta
   motor de reglas para una condición sobre dos columnas.
3. **La conversión es transaccional.** Enlazar o crear el contacto, crear el
   negocio en la primera etapa, marcar `leads.status = 'converted'` y sellar
   `converted_deal_id`. Ese campo **no tiene clave foránea** (decisión #8, para
   evitar el ciclo); lo que garantiza su integridad es precisamente que las tres
   escrituras ocurran en la misma transacción.

### M3 · Negocios — `size: L` · **la única parte de F1 donde no se puede ser perezoso**

Kanban, cambio de etapa con las validaciones de §10.1, historial, motivo de
pérdida y el cierre transaccional de §10.2.

**Las validaciones por etapa son una función pura.** Seis reglas que dependen del
estado del negocio, no de la base:

| Transición | Exige |
|---|---|
| → Contactado | al menos una actividad de contacto |
| → Presentación | próxima acción con responsable y fecha |
| → Preselección | al menos una fila en `deal_properties` |
| → Negociación | monto, probabilidad, % de comisión y fecha estimada |
| → Cierre (`won`) | monto final y unidad principal |
| → Perdido (`lost`) | motivo del catálogo `loss_reasons` |

Se escribe como `validarTransicion(negocio, etapaDestino, contexto)` en
`src/domain/`, sin importar nada de infraestructura, y se prueba entera con
`node --test` igual que el RBAC. **Las reglas se enganchan a `kind`
(`open`/`won`/`lost`), nunca al nombre de la etapa** — decisión #1: las etapas
son renombrables desde M13.

**El cierre transaccional son los ocho pasos de §10.2, todos o ninguno.** Es el
punto que el propio mapeo señala como «donde un fallo parcial produce metas y
comisiones incorrectas de forma silenciosa». Va en `transaction()`, con dos
defensas contra el doble cierre: la guardia de que el negocio no esté ya en una
etapa `won`, y `commissions_deal_unq`, que hace del criterio #4 una garantía de
la base de datos y no una promesa del código.

**El arrastre del Kanban ya está resuelto sin librería.** El prototipo usa
`dataTransfer` de HTML5 (`referencia-prototipo/app/page.tsx`). Se porta. Y con él
llega el arreglo del defecto conocido: **`Perdido` no tiene columna**, así que hoy
un negocio marcado como perdido desaparece de la vista sin dejar rastro.

## 5. Orden y paralelización

```
T5 Estados  ──┬──▶ M1 Contactos ──┬──▶ M2 Leads ─────────┬──▶ M3b Pipeline y cierre
T6 Auditoría ─┘                   └──▶ M3a Reglas puras ─┘
```

T5 y T6 son independientes entre sí y bloquean a los tres módulos: T5 porque no
hay dónde pintar, T6 porque una escritura sin auditoría hay que reescribirla
después. **Van primero y van en paralelo.**

M1 va sola: fija el patrón que los otros dos copian, y hasta que no esté fijado,
paralelizar es garantizar dos formas distintas de hacer lo mismo.

Después M2 y M3a corren en paralelo —M3a es dominio puro, sin base de datos, sin
dependencia de leads—, y M3b los junta.

Las fronteras de §18 se respetan tal cual: M1 solo toca `contacts`, M2
`leads`/`lead_sources`, M3 `deals`/`deal_properties`/`deal_stage_history`. Nadie
escribe en `db/schema.ts`.

## 6. Bloqueos y decisiones que hay que tomar antes de escribir código

| # | Asunto | Decisión propuesta | Consecuencia si se pospone |
|---|---|---|---|
| 1 | Estilos: portar el CSS del prototipo o rediseñar | **Portar.** Es la interfaz que el cliente aprobó | Rediseñar añade una semana y una discusión de diseño a la ruta crítica |
| 2 | Duplicados: bloquear o avisar | **Avisar** (409 + `crear_igual`), sin tocar el esquema | Un único duro exige migración sobre esquema congelado y rompe casos reales |
| 3 | Autenticación del endpoint público de leads | Token compartido en cabecera, declarado en `env.ts` | Un endpoint abierto a internet sin puerta |
| 4 | Asignación de broker: automática o sugerida | **Sugerida** (`suggested_broker_id`), como pide §10.3 | Repartir en automático sin supervisión, en un equipo de tres personas |
| 5 | `convenciones.md` describe SQLite | Corregirlo antes de repartir M1–M3 | Alguien guarda fechas como texto y aparece en Reportes, tres fases después |

Ninguno está bloqueado por terceros. **F1 puede empezar hoy.**

## 7. Plan de implementación

Cada paso es un PR sobre `dev/jvven` contra `develop`, con
`npm run typecheck && npm run lint && npm test && npm run build` en verde antes
de abrirlo.

### Paso 0 — Corregir `convenciones.md`
Fechas, `updated_at`, pruebas y stack al estado real tras F0. Diez minutos, y
evita un error de datos que se descubre en F4.
*Verificación:* lectura contra `decisiones.md` #13 y #14.

### Paso 1 — T5 · Estados de interfaz
`src/app/globals.css` portado desde el prototipo (sin Tailwind), shell de T7 y
`forbidden.tsx` maquetados, `loading.tsx` y `error.tsx` por módulo, y los
componentes `<Vacio>`, `<SinResultados>` y `<AvisoPermiso>`.
*Verificación:* `npm run build` y revisión visual de las 15 rutas.

### Paso 2 — T6 · Auditoría *(en paralelo con el paso 1)*
`auditar()` sobre `audit_log`, llamada dentro de la transacción, y el componente
de historial por entidad.
*Verificación:* prueba de que el registro de auditoría **no** queda escrito
cuando la transacción se revierte.

### Paso 3 — M1 · Contactos
Listado con búsqueda, filtros y paginación por `searchParams`, filtrado con
`visibleRows`; alta, edición y borrado lógico por route handler; detección de
duplicados por teléfono E.164 y email; ficha con historial real de `activities` y
de `audit_log`.
*Verificación:* pruebas de la normalización E.164 y de la detección de
duplicados; comprobación manual de que un broker no ve contactos ajenos.
**Cierra §20.2:** el patrón queda fijado y documentado en
`src/infrastructure/README.md`.

### Paso 4 — M2 · Leads
Bandeja con filtros reales; alta manual; endpoint externo idempotente por
`external_id` con token propio; sugerencia de broker por especialidad; aviso de
duplicado reutilizando lo de M1; conversión transaccional a contacto y negocio;
descarte con motivo.
*Verificación:* prueba de que la segunda llamada con el mismo `external_id` no
crea un segundo lead, y prueba del flujo de conversión.

### Paso 5 — M3a · Reglas de etapa *(en paralelo con el paso 4)*
`validarTransicion` en `src/domain/`, pura, con las seis reglas de §10.1
enganchadas a `kind`. Sin base de datos.
*Verificación:* `node --test`, una prueba por transición más los casos de
frontera (a `lost` sin motivo, a `won` sin unidad principal).

### Paso 6 — M3b · Pipeline y cierre transaccional
Kanban conectado con arrastre nativo y **columna para `Perdido`**; inspector con
datos reales; cambio de etapa que aplica `validarTransicion` y escribe en
`deal_stage_history`; modal de pérdida con motivo obligatorio; y los ocho pasos
de §10.2 en una sola `transaction()`.
*Verificación:* prueba de que un cierre que falla en el paso 6 no deja ni meta
incrementada ni unidad vendida; prueba de que cerrar dos veces no crea dos
comisiones.

### Paso 7 — Cierre de fase
`docs/F1_ESTADO.md` con lo verificado y cómo, igual que se hizo en F0.

## 8. Cuándo está terminado F1

1. Un contacto se crea, se edita, se busca y se pagina, con permiso verificado en
   servidor y duplicados avisados antes de crear.
2. Un lead entra por el endpoint externo dos veces con el mismo `external_id` y
   solo existe una vez.
3. Un lead se convierte en contacto y negocio en una sola operación, o en
   ninguna.
4. Un negocio no cambia de etapa si no cumple el requisito de §10.1, y el
   servidor lo dice con un mensaje que el usuario entiende.
5. Un cierre actualiza meta, nivel y comisión **exactamente una vez**, y un fallo
   en cualquiera de los ocho pasos no deja nada aplicado.
6. Todo lo anterior queda en `audit_log` con autor y fecha.
7. Las quince rutas se ven, y cada una tiene sus estados de carga, vacío, sin
   resultados, error y 403.
8. `npm run typecheck && npm run lint && npm test && npm run build` en verde.

## 9. Lo que F1 deliberadamente no construye

- **Repositorios y puertos** — decisión #16. Nacen cuando un caso de uso los
  necesite, y ninguno de F1 los necesita.
- **Fusión de duplicados.** F1 los detecta y avisa; fusionarlos es una pantalla
  propia, y §8.4 la lista sin diseño confirmado.
- **Importación CSV.** Es T9, fase F5.
- **Papelera con vista.** El borrado lógico se escribe (`deleted_at`) y el filtro
  ya lo aplica `visibleRows`; la pantalla para restaurar es de M13, en F2.
- **Notificaciones al cambiar de etapa.** Es M15, fase F4. F1 deja el evento en
  `audit_log` y `deal_stage_history`, que es de donde M15 leerá.
- **Las alertas de SLA de §10.3 #2.** Necesitan un ejecutor programado, que no
  existe hasta que haya despliegue (T8, aplazado por decisión #17).

## 10. Pendientes menores dejados a propósito, por módulo

Cosas que quedaron fuera del encargo de cada paso, no por olvido — para no
ampliar el alcance del paso en curso. Se recogen aquí para no perderlas; se
resuelven cuando el módulo dueño del dato las necesite, o si el cliente las pide
antes.

- **M1 · Contactos:** no hay selector de "responsable" en el alta (el contacto
  siempre se asigna a quien lo crea) ni forma de reasignar el `brokerId` de un
  contacto desde la edición. El `PATCH` ya lo soportaría si se añade `brokerId`
  al esquema Zod de `api/contactos/[id]/route.ts` — falta la casilla en el
  formulario y la regla de quién puede reasignar (¿solo `all`? ¿el propio
  broker cede a otro?). Candidato natural: cuando M13 (Configuración) dé de
  alta usuarios y haga falta mover cartera entre brokers.
- **M2 · Leads:** el endpoint externo (`api/leads/externo`) reutiliza un
  contacto existente por teléfono/email dentro de la transacción, en vez de
  responder 409 como el alta manual — no hay un humano al otro lado de un
  webhook al que preguntarle "¿de todas formas?". Eso deja una ventana de
  condición de carrera **estrecha**: dos entregas verdaderamente concurrentes
  (no reintentos secuenciales, que es el caso real de un webhook) del mismo
  origen podrían cada una crear su propio contacto antes de que la otra
  confirme, dejando uno huérfano sin lead que lo enlace. Se resuelve con un
  índice único parcial sobre `contacts` si el proveedor de leads demuestra
  enviar duplicados en paralelo real — hoy no hay evidencia de que ocurra.
