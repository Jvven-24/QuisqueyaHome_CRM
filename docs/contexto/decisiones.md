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

## Estado de implementación de estas decisiones
El esquema (`db/schema.ts`, 29 tablas) y la migración (`drizzle/0000_adorable_forge.sql`) **existen en disco pero no están comiteados** (`git status` los marca como modificado/untracked). Ninguna decisión #1–#8 está desplegada: D1 sigue `null` en `.openai/hosting.json`. Las decisiones #11 y #12 (hexagonal, Supabase/Hostinger) son aún más tempranas: ni siquiera existe todavía el repositorio de producción donde aplicarlas.
