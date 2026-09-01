# F0 · Fundación — análisis y plan de implementación

Milestone **F0 · Fundación**, cierra el **20 de septiembre de 2026**. Peso 12 de 46 (§17.1 de `MAPEO_FRONTEND_CRM.md`) — es, junto a F1, la mitad del proyecto, y es la única fase que bloquea a todas las demás.

Contenido según §19.1: **T0** Repo · **T1** Datos · **T2** Auth · **T3** RBAC · **T4** Acceso a datos · **T7** Rutas · **T8** Entorno.

---

## 1. Qué es F0 y por qué importa

F0 no entrega ninguna pantalla que el cliente pueda usar. Entrega el suelo sobre el que se paran los 15 módulos: una base de datos real, una sesión real, un permiso que se verifica en servidor, una forma única de leer y escribir, y una carpeta por módulo.

Lo que pasa si F0 sale mal está documentado y no es hipotético:

- **§13:** «T7 debe estar terminado **antes** de repartir módulos entre varias personas.» Sin rutas separadas, dos personas en dos módulos editan el mismo archivo.
- **§18.1:** «Si cada módulo filtra a su manera, la seguridad se vuelve inauditable.» El filtrado por rol vive en un solo lugar (T3) o no vive.
- **§19.1:** «Una fase F0 que se desborda arrastra todo lo demás, porque nada puede empezar sin ella.»
- **Criterio de terminado #1 (§16):** un usuario no autorizado no puede leer ni modificar datos restringidos, **verificado en servidor y no ocultando botones**. Ese criterio se gana o se pierde en T3.

## 2. Estado real hoy (verificado en el repositorio)

| Capa | Issue | Estado | Evidencia |
|---|---|---|---|
| T0 Scaffold | ✅ **Hecho** | `src/domain`, `src/application`, `src/infrastructure`, Next 15 + React 19 + TS estricto, CI verde | commit `3df2316`, PR #8 |
| T1 Datos | ❌ Pendiente | No existe esquema en el repo de producción. El de origen es `sqliteTable` (1090 líneas, 29 tablas) y vive en el prototipo | `referencia-prototipo/db/schema.ts` |
| T2 Auth | ❌ Pendiente | No hay dependencia de Supabase instalada, ni login, ni middleware | `package.json` |
| T3 RBAC | ❌ Pendiente | No existe resolución de permisos | `src/application/` vacío salvo READMEs |
| T4 Acceso | ❌ Pendiente | No hay cliente de base de datos ni patrón de validación | `src/infrastructure/db/` vacío |
| T7 Rutas | ❌ Pendiente | Solo `src/app/page.tsx`, un placeholder de 8 líneas | `src/app/` |
| T8 Entorno | ⚠️ Parcial | CI corre typecheck/lint/build/test en cada PR. No hay entornos, ni deploy, ni respaldos | `.github/workflows/ci.yml` |

Además, ya está resuelto todo lo de gobierno del repositorio: ramas `main`/`develop`/`dev/jvven` con protección, 7 milestones, 33 labels, CODEOWNERS, Project board, y workflows de triage y guardia de ramas.

## 3. Análisis capa por capa

### T1 · Fundación de datos — `size: S` (el tamaño está mal, es M)

**Lo que el issue pide:** portar 29 tablas de `sqliteTable` a `pgTable`, configurar Supabase, aplicar la migración inicial, y sembrar roles, permisos, etapas, motivos de pérdida y canales.

**Lo que el análisis del esquema revela:** el port **no es un buscar-y-reemplazar**. Hay cinco puntos donde SQLite y Postgres divergen de verdad:

| Punto | En SQLite (prototipo) | En Postgres | Decisión |
|---|---|---|---|
| Claves primarias | `integer().primaryKey({autoIncrement:true})` | `serial` / identidad | `serial` |
| Booleanos | `integer(…,{mode:"boolean"})` | tipo `boolean` nativo | `boolean` |
| **Fechas** | `text` ISO-8601 forzado con `strftime` | `timestamptz` nativo | **`timestamptz`** — ver abajo |
| Dinero | `integer` centavos | `integer` desborda a US$21.4M | `bigint` en todos los `*_cents` |
| Únicos parciales | `WHERE deleted_at is null` | igual, soportado | sin cambio |
| NULL en únicos | «cada NULL es distinto» → hizo falta un índice parcial extra en `deal_properties` | mismo comportamiento | sin cambio, pero el comentario debe corregirse |

**La convención de fechas cambia, y hay que decirlo en voz alta.** §20.1 fija «fechas ISO-8601 UTC en texto» y advierte de no «corregirla» a mitad del desarrollo. Esa convención existe por un defecto de SQLite: `CURRENT_TIMESTAMP` escribe `"2026-08-30 12:00:00"` y la aplicación escribe `"2026-08-30T12:00:00.000Z"`, y en texto el espacio ordena antes que la `T`, así que mezclarlos rompe `ORDER BY` en silencio. **Postgres no tiene ese defecto.** Guardar fechas como texto en Postgres tira a la basura los rangos por fecha, los índices de fecha y la aritmética de intervalos — justo lo que necesitan la próxima acción, las alertas de SLA, la agenda y los rangos de Reportes. La convención de fondo («todo se guarda en UTC, la conversión a `America/Santo_Domingo` ocurre en la aplicación») se conserva intacta; lo que cambia es el tipo de columna. Es el momento correcto para hacerlo: el port es exactamente la ventana en la que §20.1 dice que la sintaxis no es portable.

**El seed no es opcional ni cosmético.** Los permisos sembrados **son** el comportamiento del sistema: §18.1 los marca como recurso compartido con un solo dueño, y §10.4 define qué ve un broker. Un seed mal hecho no falla, simplemente deja ver datos ajenos.

**Bloqueo real:** aplicar la migración exige un proyecto de Supabase con credenciales. Sin ellas, el port, la migración generada y los seeds se escriben y se revisan igual; solo queda pendiente el `push` contra la base.

### T2 · Autenticación — `size: M`

Supabase Auth resuelve login, sesión, expiración, logout y recuperación de contraseña sin construirlos (decisión #12). Lo que **no** resuelve solo:

- **El puente `auth.users` ↔ `public.users`.** Supabase autentica contra su propia tabla; el CRM necesita `users.role_id` para todo lo demás. Hace falta una columna que enlace ambos y una regla de qué pasa cuando alguien existe en una y no en la otra.
- **La sesión en el servidor.** Next.js App Router necesita `@supabase/ssr` con cookies, porque el server component tiene que saber quién pregunta antes de consultar nada.
- **El middleware.** Rutas privadas por defecto, no ruta por ruta — olvidar una es una filtración.

La tabla `sessions` del esquema (§6, «requerida por login real y por cerrar sesión remota») queda **redundante** con Supabase Auth, que ya gestiona sesiones y refresh tokens. Se conserva la tabla en el port para no tocar el esquema congelado, pero no se usa en F0. Si se llega a necesitar «cerrar sesión remota», se hace con la API de Supabase, no con esa tabla.

### T3 · RBAC — `size: M` · **es la capa más crítica de F0**

El modelo ya está decidido: `permissions(role_id, resource, action, scope)` con `scope ∈ {none, own, team, all}` (decisión #2). Lo que F0 debe entregar:

1. **Resolver** el permiso del usuario sobre un recurso y una acción → un `scope`.
2. **Aplicar** ese scope automáticamente en las consultas: `own` = solo donde el usuario es responsable, `all` = todo, `none` = 403.
3. **Verificar en cada mutación**, no solo al pintar la pantalla.

Dos trampas concretas que el propio mapeo señala:

- **§10.4:** `units.real_price_cents` y `projects.internal_price_cents` no son recursos propios — son **campos** con permiso aparte (`unit_real_price`). El RBAC tiene que poder filtrar columnas, no solo filas.
- **§18.1:** un solo lugar de filtrado. Si el módulo de Contactos escribe su propio `WHERE broker_id = ?`, el de Leads escribirá otro distinto y nadie podrá auditar la seguridad.

Es la capa donde más barato es hacerlo pequeño y correcto: una función pura que decide, y un envoltorio que la aplica. Es también la única parte de F0 que se puede probar por completo sin base de datos.

### T4 · Acceso a datos y validación — `size: M`

El issue lo describe bien: «el patrón común que va a usar cada módulo». Cuatro piezas: patrón lectura/escritura, validación de entrada, errores uniformes, transacciones.

La **transacción** no es genérica: existe por §10.2, el cierre transaccional de un negocio — siete pasos en una sola operación. «Si cualquier paso falla, ninguno se aplica. Es el punto donde un fallo parcial produce metas y comisiones incorrectas de forma silenciosa.» Eso se construye en F1/M3, pero el helper de transacción tiene que existir antes y ser el único camino.

Riesgo de sobre-ingeniería aquí: la arquitectura hexagonal invita a escribir un puerto y un repositorio por tabla antes de que exista un solo caso de uso. **Un puerto con una sola implementación y ningún consumidor es código muerto con nombre elegante.** En F0 se entrega el cliente, la validación, los errores y la transacción; los repositorios nacen en F1 con el módulo que los usa.

### T7 · Rutas y estructura — `size: L` · **el riesgo más subestimado (§14)**

Aquí el repo de producción tiene una ventaja que el cronograma no contempló: **no hay `page.tsx` monolítico que desmontar.** §11 describe T7 como «partir `page.tsx` (957 líneas) en rutas por módulo», pero el repo de producción nace vacío. El refactor caro no existe; queda solo la parte barata: crear la estructura correcta desde el primer día.

En la práctica T7 se reduce a: shell compartido (navegación + cabecera) separado de las vistas, y una carpeta por módulo con los nombres exactos de §18, que son los mismos que ya están escritos en `.github/CODEOWNERS`. Coherencia obligatoria: si la carpeta se llama distinto, CODEOWNERS deja de asignar revisores y nadie se entera.

**T7 baja de L a M en este repositorio.** Es el único punto donde el plan se abarata frente a lo estimado.

### T8 · Entorno y despliegue — `size: M` · **parcialmente bloqueado**

Cuatro cosas: entornos (dev/staging/prod), deploy al VPS de Hostinger, respaldos automáticos con **una restauración probada** (criterio de terminado #10), y monitoreo.

El propio issue lo dice: «Pendiente de decidir (fuera de este issue): mecanismo exacto de deploy hacia el VPS». Mientras eso no se decida, T8 se puede avanzar en lo que no depende de la máquina: contrato de variables de entorno, separación de configuración por entorno, y el procedimiento escrito de respaldo y restauración. Provisionar el VPS, apuntar el dominio y probar la restauración exigen credenciales y una decisión que hoy no están.

## 4. Dependencias y orden

```
T0 ✅ ─┬─▶ T1 Datos ─▶ T2 Auth ─▶ T3 RBAC ─▶ T4 Acceso ─▶ T7 Rutas
       └─▶ T8 Entorno (en paralelo, no bloquea a nadie)
```

Es una cadena, no un abanico: T1→T2→T3→T4→T7 es la ruta crítica de §13 y no admite reordenar. T8 es lo único paralelizable dentro de F0.

## 5. Los tres bloqueos, y qué se hace con ellos

| # | Bloqueo | Afecta | Qué se hace mientras tanto |
|---|---|---|---|
| 1 | **No hay proyecto de Supabase con credenciales** | T1 (aplicar migración), T2 (probar login contra la base) | Se escribe el esquema, la migración generada y los seeds; se escribe el adaptador de auth. Todo queda a un `npm run db:push` y dos variables de entorno de funcionar |
| 2 | **Mecanismo de deploy al VPS sin decidir** | T8 (deploy, entornos reales) | Se deja el contrato de configuración por entorno y el procedimiento de respaldo/restauración escritos |
| 3 | **§20.2 sin cerrar: server actions vs. route handlers** | T4 y T7 (forma de los 15 módulos) | Se adopta la recomendación ya escrita — **lecturas por server components, escrituras por route handlers** — y se deja la prueba corta de punta a punta para el primer módulo de F1. La decisión no se puede posponer más allá de T7 sin reescribir la aplicación entera |

## 6. Plan de implementación

Cada paso es un commit sobre `dev/jvven` → PR contra `develop`, siguiendo el flujo ya establecido.

### Paso 1 — T1a · Port del esquema a Postgres
`src/infrastructure/db/schema.ts` — las 29 tablas y los 17 catálogos cerrados portados a `pgTable`, con los cinco cambios de tipo de la tabla de §3. Se conservan los comentarios de decisión (son la memoria de por qué el esquema es así) y se corrigen los que ya no aplican a Postgres. Drizzle configurado contra `postgres-js`.
*Verificación:* `npm run typecheck`.

### Paso 2 — T1b · Migración y seeds
Migración inicial generada por `drizzle-kit`. Seed idempotente de los cinco catálogos que definen el comportamiento: 3 roles, matriz de permisos por rol (§10.4), 7 etapas del pipeline, motivos de pérdida y canales de captación.
*Verificación:* la migración se genera sin errores; el seed corre dos veces sin duplicar.

### Paso 3 — T3 · RBAC
Función pura `resolveScope(permisos, recurso, acción) → scope` en `domain/`, sin ninguna dependencia. Encima, el guardia de servidor que la aplica: 403 cuando el scope es `none`, y filtro por responsable cuando es `own`. Incluye el caso de campo restringido (`unit_real_price`).
*Verificación:* tests con `node --test`, sin base de datos. Es la capa que se prueba entera de forma aislada — para eso se eligió arquitectura hexagonal.

### Paso 4 — T2 · Autenticación
`@supabase/ssr`: cliente de servidor, cliente de navegador y middleware de sesión. Login con email/contraseña, logout, recuperación de contraseña. Puente `auth.users` ↔ `users` para resolver el rol. Rutas privadas por defecto.
*Verificación:* typecheck y build. La prueba contra la base real queda pendiente de las credenciales (bloqueo 1).

### Paso 5 — T4 · Acceso a datos y validación
Cliente de base de datos único, validación de entrada, errores uniformes (`ValidationError` / `ForbiddenError` / `NotFoundError` con su traducción a código HTTP) y helper de transacción. **Sin repositorios ni puertos especulativos**: nacen en F1 con su caso de uso.
*Verificación:* typecheck y tests de los errores.

### Paso 6 — T7 · Rutas y shell
Shell con navegación y cabecera separado de las vistas. Una carpeta por módulo con los nombres exactos de §18 y de CODEOWNERS. Lecturas desde server components.
*Verificación:* `npm run build` — el App Router falla en build si una ruta está mal formada.

### Paso 7 — T8 · Entorno
`.env.example` como contrato de configuración, separación por entorno, y el procedimiento escrito de respaldo y restauración de Supabase. Deploy y provisión del VPS quedan fuera hasta que se cierre el bloqueo 2.
*Verificación:* CI verde con la configuración de ejemplo.

### Orden en el que se ejecuta

Los pasos 1→7 en ese orden, porque la cadena de dependencias no admite otra cosa. El único adelanto posible: el paso 3 (RBAC) no toca la base de datos y se podría hacer antes que el 2 si el bloqueo de credenciales se alargara.

## 7. Cuándo está terminado F0

F0 cierra cuando:

1. El esquema Postgres compila y su migración está generada y revisada.
2. Los seeds dejan roles, permisos, etapas, motivos y canales listos, y correr el seed dos veces no duplica nada.
3. Un usuario inicia sesión de verdad y el servidor sabe qué rol tiene.
4. Un broker que pide un dato ajeno recibe 403 **desde el servidor**, con una prueba automática que lo demuestra (criterio de terminado #1).
5. Existe una sola forma de leer, escribir, validar y transaccionar, documentada, y ningún módulo tiene la suya.
6. Cada módulo de §18 tiene su carpeta de ruta, y coinciden con CODEOWNERS.
7. El contrato de variables de entorno está escrito y el procedimiento de respaldo/restauración documentado.

Los puntos 3 y 4 solo se verifican de punta a punta cuando existan las credenciales de Supabase; hasta entonces quedan verificados por tipos, build y tests de dominio.

## 8. Lo que F0 deliberadamente no hace

- **No construye repositorios ni puertos por adelantado.** Un puerto con una implementación y ningún consumidor es código muerto con nombre elegante. Nacen en F1.
- **No usa la tabla `sessions`.** Supabase Auth ya gestiona sesiones; la tabla se conserva en el esquema congelado y queda sin uso.
- **No implementa T5 (estados de interfaz) ni T6 (auditoría).** Están en F1 por §19.1, aunque el orden de §13 los ponga después de T7.
- **No provisiona el VPS.** Depende del bloqueo 2.
