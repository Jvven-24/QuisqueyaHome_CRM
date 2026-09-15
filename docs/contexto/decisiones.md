# Decisiones técnicas — CRM Quisqueya Home

Extraídas de comentarios en `db/schema.ts`, `MAPEO_FRONTEND_CRM.md` §9 y §20, y `AUDITORIA_FUNCIONAL_CRM.md`.

## 1. Etapas del pipeline: tabla configurable, no enum
**Decisión:** `pipeline_stages` es una tabla con `kind` (`open`/`won`/`lost`) en vez de un enum fijo de nombres.
**Por qué:** el administrador puede renombrar una etapa; si las reglas de negocio dependieran del nombre, un rename las rompería en silencio. `deals.stage_id` es referencia, y la lógica se engancha a `kind`.
**Descartado:** enum de string fijo (lo que hoy hace el frontend con el tipo `Stage`).

## 2. Permisos: recurso + acción + alcance
**Decisión:** `permissions(role_id, resource, action, scope)`, con `scope=own|team|all|none`.
**Por qué:** reemplaza la comparación de cadenas literales que hoy filtra leads por nombre de broker (`broker === "Yostar Medina"`). Los roles viven en tabla para admitir un rol nuevo (ej. Marketing) sin tocar código.
**Descartado:** ocultar componentes en cliente según rol (patrón actual del frontend) — no es seguridad real, es solo UI.

## 3. Alquiler modelado con `operation_type` + `price_period`
**Decisión:** el alquiler convive en el mismo inventario de venta vía estos dos campos en `units`, no un modelo paralelo.
**Por qué:** evita duplicar la estructura de `projects`/`units` para un solo tipo de operación.

## 4. Propiedades del negocio: relación N:M, obligatoria desde Preselección
**Decisión:** `deal_properties` relaciona `deals` con `units`/`projects` como N:M; `unit_id` es opcional mientras el interés es solo a nivel de proyecto, pero la fila es obligatoria a partir de la etapa `Preselección`.
**Por qué:** el pipeline visual muestra un proyecto por tarjeta, pero un negocio real puede interesar en varias unidades o proyectos.
**Descartado:** una sola FK `project_id` en `deals`.

## 5. Sin multi-organización
**Decisión:** no existe `organization_id` en el esquema.
**Por qué:** Quisqueya Home es un solo negocio inmobiliario sin red de agencias externas (ver escala de referencia en la auditoría: 3–10 usuarios internos).
**Descartado:** modelo multi-tenant desde el inicio — se consideró innecesario para el alcance del MVP.

## 6. Roles como tabla, no enum de código
**Decisión (derivada):** los roles (`admin`, `assistant`, `broker` hoy) viven en `roles`, no como unión de TypeScript en el backend.
**Por qué:** permite agregar roles sin desplegar código nuevo.

## 7. Validaciones por etapa en el servidor, no como datos configurables
**Decisión (derivada):** los requisitos de transición (ver `MAPEO_FRONTEND_CRM.md` §10.1) se codifican en el servidor.
**Por qué:** no se optó por un motor de reglas configurable — el alcance del MVP es "automatizaciones cortas y explícitas, no un constructor empresarial de workflows" (auditoría funcional §2).

## 8. Claves foráneas cíclicas evitadas por diseño
**Decisión:** `deals.next_activity_id` y `leads.converted_deal_id` **no** declaran FK; la integridad se garantiza en la capa de aplicación.
**Por qué:** evitar ciclos de referencia entre `deals` ↔ `activities` ↔ `leads`.

## 9. Lecturas por Server Components, escrituras por route handlers (pendiente de confirmar)
**Estado:** recomendación documentada en `MAPEO_FRONTEND_CRM.md` §20.2, **no decidida en firme todavía** — se planea una prueba corta de un módulo pequeño de punta a punta antes de repartir trabajo entre módulos (T7).
**Por qué se recomienda así:** `examples/d1/app/api/notes/route.ts` ya demuestra que route handlers con D1 + Drizzle funcionan en este stack (vinext); las server actions aún no están probadas aquí.
**Alternativa en evaluación:** server actions para escrituras, si la prueba corta confirma que funcionan bien bajo vinext.

## 10. Auditoría del prototipo (jul 2026) → hoja de ruta priorizada
**Decisión:** en lugar de agregar más módulos al prototipo, priorizar el núcleo `Contacto → Lead → Negocio → Actividad` como fuente de verdad (F0/F1 en `MAPEO_FRONTEND_CRM.md` §19.1) antes que diferenciadores como Academy o Avances de obra.
**Descartado explícitamente:** copiar la superficie de Salesforce, Dynamics o HubSpot Enterprise — el documento los cita como referencias que **no** conviene igualar a esta escala.

## 11. Arquitectura hexagonal para el repositorio de producción
**Decisión (30 de agosto de 2026):** el repositorio de producción (aún no creado — el `CRM/` actual queda como prototipo) se construye con **Next.js + React + TypeScript** siguiendo **arquitectura hexagonal (Puertos y Adaptadores)**: dominio puro, casos de uso + puertos en la capa de aplicación, y Next.js/Drizzle/Supabase como adaptadores intercambiables.
**Por qué:** aislar las reglas de negocio ya documentadas (transiciones de etapa, cierre transaccional, RBAC) de la infraestructura concreta, para poder testear el dominio sin base de datos ni framework, y para poder cambiar de proveedor de hosting o de base de datos sin reescribir la lógica de negocio.
**Descartado:** continuar la estructura del prototipo (todo en `app/page.tsx`, un componente cliente monolítico) como base del sistema de producción — se decidió reescribir sobre una arquitectura nueva en vez de refactorizar incrementalmente el prototipo.
Ver detalle de capas en arquitectura.md.

## 12. Base de datos y hosting de producción: Supabase (Postgres) sobre VPS de Hostinger
**Decisión (30 de agosto de 2026):** la base de datos de producción es **PostgreSQL gestionado por Supabase**; el hosting de la aplicación (y presumiblemente de los servicios asociados) es un **VPS propio en Hostinger**. El ORM se mantiene: **Drizzle**, pero reescrito para Postgres (`pgTable`) en vez de SQLite/D1.
**Por qué:** confianza y experiencia previa del desarrollador con ambas plataformas — ya las ha usado y no le han dado problemas. Ventajas puntuales señaladas:
- **Supabase:** autenticación de usuarios lista para usar (Supabase Auth), sin tener que construirla desde cero.
- **Hostinger:** el VPS es "el más completo" frente a otros proveedores evaluados por el usuario — da más servicios además de la VPS en sí, y más margen de configuración que otras alternativas.
**Descartado:** Cloudflare D1 + Cloudflare Workers (el stack del prototipo actual) como base de datos y runtime de producción. `wrangler`, `vinext` y `.openai/hosting.json` quedan como particularidades del prototipo, no del sistema final. Implícitamente también se descartaron otros proveedores de VPS/hosting evaluados frente a Hostinger (sin nombrar cuáles).
**Consecuencia directa:** el esquema `db/schema.ts` (29 tablas, decisión #1–#8 de este documento) conserva su modelado de entidades y sus convenciones (dinero en centavos, fechas ISO-8601 UTC, teléfonos E.164, papelera con `deleted_at`), pero su sintaxis debe portarse de `sqliteTable` a `pgTable` al crear el repositorio de producción.
**Autenticación:** confirmado — **Supabase Auth**, precisamente por venir integrado con la base de datos elegida.
**Pendiente de decidir:** mecanismo de deploy hacia el VPS de Hostinger. El usuario lo está trabajando en otra sesión, como parte del cronograma general del proyecto — no forma parte de esta ronda de documentación.

## 13. Fechas en Postgres: tipos nativos, no texto ISO-8601
**Decisión (1 de septiembre de 2026, al portar el esquema en T1):** en el repositorio de producción los instantes se guardan en `timestamptz` y las fechas sin hora en `date`, no como texto ISO-8601.
**Por qué:** la convención de texto (`MAPEO_FRONTEND_CRM.md` §20.1) existía por un defecto de SQLite — su `CURRENT_TIMESTAMP` escribe `"2026-08-30 12:00:00"` mientras la aplicación escribe `"2026-08-30T12:00:00.000Z"`, y en texto el espacio ordena antes que la `T`, así que mezclarlos rompía `ORDER BY` y los rangos por fecha en silencio. Postgres no tiene ese defecto y sí tiene tipos de fecha reales. Guardar fechas como texto en Postgres tira a la basura los rangos, los índices por fecha y la aritmética de intervalos, que es justo lo que necesitan la próxima acción obligatoria, las alertas de SLA, la agenda y los rangos de Reportes.
**Lo que NO cambia:** todo se sigue guardando en UTC y la conversión a `America/Santo_Domingo` sigue ocurriendo en la capa de aplicación.
**Nota:** §20.1 advierte de no "corregir" las convenciones a mitad del desarrollo. El port a Postgres es exactamente la ventana en la que el propio documento admite que la sintaxis no es portable; hacerlo después habría exigido migrar datos.

## 14. Dinero en `bigint`, no en `integer`
**Decisión (1 de septiembre de 2026, T1):** todas las columnas `*_cents` son `bigint`.
**Por qué:** en centavos, un `integer` de Postgres desborda a partir de US$21.4 millones. Es alcanzable en `broker_profiles.annual_sales_cents` y en los acumulados de `goals`. El desbordamiento no avisa antes de ocurrir.

## 15. La tabla `sessions` queda sin uso
**Decisión (1 de septiembre de 2026, T2):** `sessions` se conserva en el esquema portado pero no se usa. Supabase Auth ya gestiona sesiones y refresh tokens, y "cerrar sesión remota" se resuelve con su API.
**Por qué:** mantener dos registros de sesión en paralelo garantiza que se desincronicen. La tabla se conserva solo porque el esquema está congelado (§18.1) y borrarla merece su propio PR.

## 16. Sin repositorios ni puertos hasta que exista un caso de uso
**Decisión (1 de septiembre de 2026, T4):** F0 entrega el cliente de base de datos, la validación, los errores y el helper de transacción, pero **no** un puerto ni un repositorio por tabla. Nacen en F1, con el caso de uso que los consuma.
**Por qué:** la arquitectura hexagonal (decisión #11) invita a escribir la interfaz antes que el consumidor. Un puerto con una sola implementación y ningún consumidor es código muerto con nombre elegante, y además fija una forma antes de saber qué forma hace falta.
**Descartado:** generar los 28 repositorios junto al esquema.

## 17. El despliegue al VPS se hace al final, en una sola operación
**Decisión (1 de septiembre de 2026):** no se despliega nada al VPS de Hostinger hasta que el programa esté terminado y funcionando. Cuando lo esté, se hace el despliegue y la migración completos en una sola operación.
**Por qué:** decisión del responsable del proyecto. Evita mantener entornos desplegados durante los tres meses de construcción, y concentra el trabajo de infraestructura en un momento en que ya se sabe exactamente qué hay que desplegar.
**Consecuencia sobre el cronograma:** **T8 sale de F0.** F0 se da por cerrada con T1, T2, T3, T4 y T7 —todas verificadas contra la base real—, y el issue de T8 se mueve a la fase de entrega. Sin esto, F0 quedaría abierta durante meses por un trabajo que se decidió no hacer todavía, y arrastraría la lectura de todo el cronograma.
**Consecuencia sobre los criterios de terminado:** el #10 de `MAPEO_FRONTEND_CRM.md` §16 —*existe respaldo y una restauración probada*— **no se puede cumplir hasta ese momento**, porque no hay entorno de producción sobre el que probar la restauración. Queda pendiente explícitamente, no olvidado.
**Riesgo asumido, para que esté escrito:** los problemas de entorno no aparecen hasta el primer despliegue, y aparecen todos juntos. Ya hay un ejemplo concreto de esta misma sesión: la conexión directa de Supabase resultó ser solo IPv6, y si el VPS no lleva IPv6 eso no se descubre hasta ese día. La lista de comprobaciones que hay que hacer entonces está en `docs/DESPLIEGUE.md` §5, y conviene repasarla antes de reservar el tiempo para esa operación, no durante.
**Lo que sí queda hecho por adelantado:** contrato de variables de entorno (`.env.example`), procedimiento de respaldo y restauración, y las condiciones que el mecanismo de despliegue debe respetar. El desarrollo entretanto corre contra el proyecto de Supabase en la nube y `npm run dev` en local.

## 18. Los estilos se portan del prototipo, no se rediseñan
**Decisión (6 de septiembre de 2026, T5):** `src/app/globals.css` se porta desde `referencia-prototipo/app/globals.css` — 478 líneas de CSS plano, sin la línea `@import "tailwindcss"` — y encima se añaden los cuatro estados que el prototipo nunca tuvo: cargando, sin resultados, error y deshabilitado por permiso.
**Por qué:** es la interfaz que el cliente ya vio y aprobó, y es CSS plano que funciona tal cual: variables de color, `.button`, `.table-wrap`, `.split-view`, `.inspector`, `.kanban`, `.empty`. Rediseñar añadiría una semana y una discusión de diseño a la ruta crítica de F1 para llegar al mismo sitio.
**Descartado:** instalar Tailwind y reescribir el port como utilidades — misma interfaz, dependencia nueva y todo el trabajo hecho dos veces.
**Consecuencia:** los estados de carga y error se resuelven con `loading.tsx` y `error.tsx`, convención nativa de Next 15. No hay estado global de carga ni librería de UI.

## 19. Los duplicados se avisan, no se bloquean
**Decisión (6 de septiembre de 2026, M1):** al crear un contacto se consulta por teléfono en E.164 y por email; si hay candidatos, se responde 409 con la lista, y quien crea puede insistir con un `crear_igual: true` explícito. **No se toca el esquema.**
**Por qué:** el criterio de terminado #5 dice «se detectan antes de crear», no «se impiden». En una inmobiliaria una pareja comparte teléfono, y el mismo número entra por WhatsApp y por el portal el mismo día: un índice único duro convertiría un caso real en un error irrecuperable para el usuario. Además exigiría una migración sobre un esquema congelado.
**Consecuencia:** fusionar duplicados queda fuera de F1 — es una pantalla propia y §8.4 la lista sin diseño confirmado.
**Nota:** la normalización a E.164 se escribe a mano (República Dominicana es `+1` con 809/829/849). `libphonenumber-js` son ~500 KB para cubrir 200 países que este CRM no usa.

## 20. El endpoint público de leads lleva token compartido
**Decisión (6 de septiembre de 2026, M2):** la captura externa de leads se autentica con un token compartido en cabecera, declarado en `src/infrastructure/env.ts`, más validación estricta de la entrada y `external_id` obligatorio.
**Por qué:** es la única entrada del sistema sin sesión, y por tanto el único sitio donde el RBAC no aplica — no hay actor del que resolver permisos. Un endpoint de inserción abierto a internet no se deja para después.
**Consecuencia:** la idempotencia la garantiza el índice `leads_external_id_unq`, que ya existe: `ON CONFLICT DO NOTHING` y devolver el lead existente. Sin tabla de idempotencia, sin cola, sin cabecera `Idempotency-Key`.

## 21. El broker se sugiere, no se asigna solo
**Decisión (6 de septiembre de 2026, M2):** la regla de especialidad escribe `leads.suggested_broker_id`, no `broker_id`. Alguien confirma la asignación.
**Por qué:** es lo que pide §10.3 #1 («sugerir o asignar»), y el esquema ya separa las dos columnas justo para esto. Repartir trabajo en automático sin que nadie mire, en un equipo de tres personas, produce leads en el buzón equivocado y nadie se entera hasta que el cliente llama.
**Descartado:** un motor de reglas configurable para una condición sobre dos columnas (`specialty`, `handles_rentals`).

## 22. Se porta la interfaz completa del prototipo en T5, no solo la de F1
**Decisión (6 de septiembre de 2026, T5):** los 15 módulos del prototipo (`referencia-prototipo/app/page.tsx`, hoy un único componente cliente) se portan todos ahora, cada uno a su carpeta de ruta creada por T7, y no solo los tres de F1 (Contactos, Leads, Pipeline). Los módulos que aún no tienen backend real muestran los datos de muestra del prototipo, marcados con `ponytail:` como mock explícito.
**Por qué:** el frontend ya está construido y aprobado por el cliente — F0 y F1 no lo diseñan, lo conectan. Mantener 12 módulos con un texto de "pendiente de construir" mientras el prototipo ya tiene su interfaz completa es dejar trabajo terminado sin usar, y el CRM se percibe como más avanzado (y es más fácil de revisar con el cliente) si se ve completo desde ya, aunque detrás siga siendo mock hasta que le llegue su turno de construcción.
**Consecuencia:** cada `page.tsx` de módulo sigue siendo componente de servidor con `requireActor` + `requireScopeInPage` — el guardia de permiso no se pierde por portar la vista. El JSX y la interactividad local del prototipo pasan a un componente cliente hijo (`vista.tsx`), sin tocar el guardia.
**No cambia el orden de construcción de F1** (`docs/F1_ANALISIS_Y_PLAN.md` §5): M1→M2→M3 siguen siendo los únicos que reciben datos reales en esta fase. Los demás quedan visualmente completos y funcionalmente mock hasta su propia fase (F2–F5).

## 23. Agenda y tareas son dos vistas de `activities`, no dos módulos
**Decisión (12 de septiembre de 2026, M4):** un solo grupo de route handlers (`/api/actividades`) y dos páginas que consultan distinto. `/agenda` lee por semana, `/tareas` lee la cola del día.
**Por qué:** el esquema ya unificó cita y tarea en `activities` —con `contact_id`, `deal_id` y `assignee_id`, que es justo lo que el prototipo no tenía (§8.2)— y las dos rutas ya apuntan al mismo recurso de permisos (`modulos.ts:28-29`). Dos CRUD sobre la misma tabla se desincronizan.
**Descartado:** reproducir la separación `Appointment`/`Task` del prototipo, catalogada como defecto del modelo.

## 24. Fechas reales con `Intl`, sin librería de fechas
**Decisión (12 de septiembre de 2026, M4):** `starts_at`/`ends_at` son `timestamptz`; la conversión a `America/Santo_Domingo` ocurre **solo al pintar**, con `Intl.DateTimeFormat`. La rejilla semanal se calcula con aritmética de `Date` sobre el lunes de la semana pedida por `searchParams`.
**Por qué:** `Intl` está en Node y en el navegador. `date-fns-tz` o `luxon` son 20–70 KB para seis líneas.
**Consecuencia:** desaparece el índice de día `1..5` y el offset `-04:00` escrito a mano del prototipo (R11).

## 25. El `.ics` se genera en servidor; `activity_sync` no se toca en F2
**Decisión (12 de septiembre de 2026, M4):** un route handler responde `text/calendar` con `UID = activity-{id}@quisqueyahome.com`, filtrado por permiso. Sin dependencia de iCalendar.
**Por qué:** un `VEVENT` son ~15 líneas de texto, y la clave primaria **es** el identificador estable que pide R11 — el `{day}-{time}@…` del prototipo duplicaba eventos al resincronizar. Generarlo en servidor mantiene el filtro de permisos donde ya vive.
**Consecuencia:** `activity_sync` queda intacta hasta que exista sincronización de dos vías con Google Calendar, que §14 clasifica como fase posterior. Escribir en ella ahora es mantener una tabla que nadie lee.

## 26. El precio real se decide en el `SELECT`, no en el JSX
**Decisión (12 de septiembre de 2026, M5):** `units.real_price_cents` y `projects.internal_price_cents` solo se incluyen en la consulta si el actor tiene permiso sobre `unit_real_price`.
**Por qué:** el prototipo los ocultaba con `role === "admin"` en el render — el dato viajaba al navegador y cualquiera lo veía en el HTML (R7, §10.4). El dato que no se selecciona no se filtra, no se serializa y no se escapa.
**Consecuencia:** es la primera restricción a nivel de campo del sistema, y M6, M7, M9 y M12 la repetirán.

## 27. La matriz de permisos pinta el modelo real, no las 8 casillas del prototipo
**Decisión (12 de septiembre de 2026, M13):** una fila por recurso, una columna por acción y, en cada celda, el alcance (`ninguno`/`propio`/`equipo`/`todos`). La columna del administrador queda bloqueada (R10).
**Por qué:** la matriz aprobada tiene 8 filas × 3 columnas y describe un modelo que ya no existe — el propio mapeo señala que «cubre 8 alcances frente a 15 módulos». Traducir esas casillas a filas de `permissions` exige inventar reglas que nadie aprobó (¿«Leads ✓» concede `delete`?, ¿con qué alcance?) y concede permisos en silencio.
**Consecuencia:** misma disposición visual y mismo CSS, datos honestos. El cambio surte efecto en la petición siguiente: `getActor` resuelve permisos por petición y su `cache` de React vive solo dentro de un render.

## 28. El alta de usuario es invitación, con la fila de `users` primero
**Decisión (12 de septiembre de 2026, M13):** `INSERT` en `users` con `auth_user_id` nulo, auditado y en transacción; después `auth.admin.inviteUserByEmail` con `SUPABASE_SERVICE_ROLE_KEY`, declarada en `env.ts` y solo servidor.
**Por qué:** el esquema ya lo previó — el comentario de `auth_user_id` dice «nulo mientras el usuario existe en el CRM pero aún no ha sido invitado». Si la invitación falla, queda un usuario del CRM que no puede entrar, reparable con «reenviar invitación»; al revés quedaría una cuenta de Auth huérfana sin rol.
**Consecuencia:** se acaban las altas manuales por SQL (`docs/contexto/errores-conocidos.md`, sección Operación). Hace falta la clave de servicio del proyecto de Supabase.

## 29. Las etapas se renombran y se reordenan; su `slug` y su `kind` no
**Decisión (12 de septiembre de 2026, M13):** la pantalla de etapas edita nombre, posición, probabilidad por defecto y activación. `slug` y `kind` son de solo lectura.
**Por qué:** la decisión #1 pide que el nombre sea editable, y para eso las reglas cuelgan de `kind`. Cambiar `kind` reescribiría en silencio el significado de los negocios ya cerrados —y de ahí cuelgan el nivel del broker y la comisión—; el `slug` es la identidad que usa el código.

## 30. Prohibido crear ramas nuevas para fixes puntuales
**Decisión (14 de septiembre de 2026):** ya no se crean ramas `fix/<issue>` (ni
`chore/<algo>` ni ninguna rama nueva) para arreglos de auditoría, regresiones o
fixtures de prueba. Todo se trabaja sobre la rama personal ya existente
(`dev/<tu-nombre>`) y se sube ahí, en commits separados si hace falta
distinguirlos. Revierte la práctica descrita antes en `flujo-de-trabajo.md`
("usa una rama `fix/<issue-o-descripcion>` contra `develop`").
**Por qué:** al corregir los defectos de la auditoría de F1 (12/09/2026) se
crearon 3 ramas (`fix/22-asignar-broker`, `fix/23-defectos-una-linea`,
`fix/24-fecha-santo-domingo-ventas-anuales`), y eso causó que **2 workflows de
GitHub Actions no recibieran el PR correctamente** — quedaron configurados
esperando el evento contra las ramas de trabajo habituales, no contra ramas
nuevas creadas al vuelo para cada fix.
**Descartado:** seguir aceptando ramas `fix/*` porque "la guardia de ramas las
acepta" — el hecho de que la guardia no las rechace no significa que el resto
del pipeline (Actions) las maneje bien.
**Excepción:** si hace falta de verdad una rama nueva y separada (ej. un cambio
de esquema que exige su propio PR), **la pide el usuario explícitamente**; no
es una decisión que tome el agente por su cuenta.

## 31. Flujo de trabajo por fase, de punta a punta: orientación, issues, ponytail, commit por issue y PR bloqueado si algo falla
**Decisión (14 de septiembre de 2026):** se formaliza el ciclo completo de
trabajo por fase en `flujo-de-trabajo.md`:
1. Al abrir sesión, orientación rápida (decisiones, errores conocidos, mapeo,
   `git log`) — no una auditoría completa.
2. Al recibir una fase, investigar todo lo que ya existe sobre ella, revisar el
   repo real contra esos documentos, **crear los issues en GitHub** y **escribir
   el plan de implementación** (`docs/F<n>_ANALISIS_Y_PLAN.md`) antes de tocar
   código.
3. Al construir, **ponytail es obligatorio**: la skill `ponytail` para escribir,
   `ponytail-review` para revisar cada diff, y **`ponytail-audit` no se puede
   omitir**.
4. **Un commit por issue**, nunca varios issues agrupados en un commit.
5. Al cerrar la fase (todos los issues comiteados): prueba unitaria
   (`typecheck`/`lint`/`test`/`build`) **y** prueba manual desde interfaz. Un
   error encontrado en cualquiera de las dos se anota y **se prioriza sobre
   seguir avanzando**.
6. **No se abre PR si algo falla.** Se puede seguir comiteando, pero el mensaje
   del commit debe decir explícitamente qué está fallando.
**Por qué:** hasta ahora estos pasos se seguían de facto (los planes
`F0_ANALISIS_Y_PLAN.md`/`F1_ANALISIS_Y_PLAN.md` y los issues por defecto de la
auditoría de F1 ya existían), pero no estaban escritos como regla — lo que deja
margen para que una sesión nueva salte directo a codear sin plan, mezcle varios
arreglos en un commit, o abra un PR con algo roto. Escribirlo evita que el
criterio varíe de sesión a sesión.
**Relacionado:** decisión #30 (no crear ramas nuevas), que ya tocaba el mismo
documento por el mismo motivo — evitar que GitHub Actions reciba el PR mal.

## Estado de implementación de estas decisiones
**Actualizado el 12 de septiembre de 2026, al arrancar F2.**

Las decisiones #1–#8 (modelado) están implementadas en `src/infrastructure/db/schema.ts` — 29 tablas sobre Postgres — con su migración generada en `drizzle/`, y los catálogos que les dan sentido sembrados en `db/seed.sql`. La #2 (permisos por recurso + acción + alcance) está además implementada en código y probada: `src/domain/rbac.ts`.

La #11 (hexagonal) y la #12 (Supabase/Hostinger) están implementadas: capas separadas, autenticación sobre Supabase Auth, RBAC en servidor, rutas por módulo, y la migración aplicada contra el proyecto real de Supabase. **F0 está cerrada** — ver `docs/F0_ESTADO.md` para qué se verificó y cómo. Lo único que sigue pendiente de acceso es el despliegue al VPS, aplazado a propósito por la #17.

Las decisiones #18–#22 se tomaron al arrancar F1 y están implementadas en sus cinco pasos (`docs/F1_ANALISIS_Y_PLAN.md` §7): estilos portados, duplicados avisados, endpoint público con token, broker sugerido e interfaz completa portada. **F1 está cerrada** — `npm run typecheck` limpio y 57 pruebas en verde.

Las decisiones #23–#29 se toman al arrancar F2 y su implementación va en los pasos del plan de `docs/F2_ANALISIS_Y_PLAN.md` §7.

Lo que sigue siendo cierto del prototipo (`referencia-prototipo/`): su `db/schema.ts` es SQLite, D1 nunca se enlazó, y nada de lo anterior está desplegado ahí. El prototipo es material de consulta, no la base del sistema.
