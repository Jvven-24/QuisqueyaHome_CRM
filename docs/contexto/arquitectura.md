# Arquitectura — CRM Quisqueya Home

Describe el **repositorio de producción**, actualizado el 30 de septiembre de
2026 (milestone de reestructuración SOLID, issue R1.4; la decisión #41 explica
el cambio). El prototipo (Next sobre `vinext`, Cloudflare Workers, D1, Tailwind) vive
congelado en `referencia-prototipo/` como material de consulta y **no aplica a
nada de aquí**.

## Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript estricto.
- **Base de datos:** PostgreSQL vía **Supabase**. ORM **Drizzle** (`pgTable`)
  sobre `postgres-js`.
- **Autenticación:** Supabase Auth con `@supabase/ssr` (decisión #12).
- **Validación:** Zod.
- **Hosting:** VPS propio en Hostinger. El despliegue se hace **al final, en una
  sola operación** (decisión #17): hoy no existen staging ni producción, y es
  deliberado.
- **Node:** `>=22.13.0`. Sin Tailwind, sin librería de UI, sin framework de
  pruebas (se usa `node:test`). Tailwind y shadcn/ui llegan en R5 (decisión #41).

## Arquitectura de aplicación: hexagonal, con la dosis justa

Tres carpetas bajo `src/`, y la dependencia va siempre de infraestructura a
dominio:

- **`domain/`** — reglas puras. No importa Next, ni Drizzle, ni Supabase, y por
  eso se prueba entero sin levantar nada.
  - `catalogs.ts` — listas cerradas (recursos, acciones, alcances, entidades,
    estados). El esquema las importa para tipar sus columnas.
  - `rbac.ts` — la decisión de permiso: `scopeFor`, `can`, `requireScope`,
    `reaches`, `stripRestrictedPrices`.
  - `errors.ts` — `ValidationError`, `ForbiddenError`, `UnauthorizedError`,
    `NotFoundError`, `ConflictError`.
- **`application/`** — casos de uso, consultas y los puertos (interfaces) que
  necesitan. Se estrenó con el milestone de reestructuración (decisión #41): la
  condición de la #16 —que exista un caso de uso que consuma el puerto— ya se
  cumple. No importa `infrastructure/`, `app/`, `next`, `drizzle-orm` ni
  `@supabase`, y se prueba sin base de datos. Hoy tiene tres partes:
  - `compartido/` — los cuatro puertos transversales: unidad de trabajo
    (transacción), auditoría, almacenamiento de archivos y admin de Auth.
  - `testing/` — sus dobles en memoria y las suites de contrato. Solo lo
    transversal; el doble de un repositorio de módulo vive en el módulo.
  - `<modulo>/` — `puertos.ts`, `casos-de-uso.ts`, `consultas.ts`, el doble en
    memoria del repositorio y las pruebas. Hoy solo existe `contactos/`.

  El patrón, paso a paso y con Contactos como ejemplo, está en
  `src/application/README.md`.
- **`infrastructure/`** — adaptadores concretos:
  - `env.ts` — el único sitio donde se leen variables de entorno.
  - `db/schema.ts` — 29 tablas sobre Postgres. **Congelado** (§18.1).
  - `db/client.ts` — la única conexión (`getDb`) y `transaction()`.
  - `db/repos/` — los adaptadores Drizzle de los puertos de `application/`:
    `compartido.ts` (unidad de trabajo y auditoría) y un archivo por módulo
    migrado. Aquí vive el SQL de los módulos migrados.
  - `contenedor/` — fábricas simples que arman cada módulo con sus adaptadores,
    un archivo por módulo (`compartido.ts` y `contactos.ts` hoy). No hay
    contenedor central ni librería de inyección.
  - `audit.ts` — escribe en `audit_log` (T6), siempre dentro de la transacción
    del cambio.
  - `auth/supabase.ts` — clientes de Supabase Auth para servidor y navegador.
  - `auth/actor.ts` — cruza la sesión de Supabase con `users` y sus permisos, una
    vez por petición. Convierte «hay sesión» en «quién es y qué puede».
  - `rbac-filter.ts` — traduce el alcance a SQL (`visibleRows`). **El único sitio
    donde se escribe el filtro por responsable.**
  - `page-guard.ts` — la misma autorización para páginas: `forbidden()` de Next
    da un 403 real, mientras que dejar escapar la excepción da un 500.
  - `http.ts` — errores de dominio → códigos HTTP, y `parseInput` para validar.
- **`app/`** — el adaptador de entrada: App Router. `(crm)/` es el grupo de rutas
  con el shell y una carpeta por módulo; `api/` los route handlers. En un módulo
  migrado, rutas y páginas son delgadas: validan, autorizan, llaman a un caso de
  uso o a una consulta y responden.

## El patrón que sigue cada módulo

**Lecturas desde componentes de servidor, escrituras por route handlers**
(§20.2, decisión #9). Los ejemplos vivos están en `src/infrastructure/README.md`
y, para un módulo ya migrado, en `src/app/(crm)/contactos/page.tsx` y
`src/app/api/contactos/route.ts`.

Tres reglas que sostienen el criterio de terminado #1:

1. El permiso se comprueba **en servidor, siempre**: `requireScopeInPage` en
   páginas, `requireScope` en route handlers. Ocultar un botón no es seguridad.
2. Nadie escribe su propio filtro por responsable — se usa `visibleRows`.
3. Nadie abre su propia conexión ni lee `process.env` por su cuenta.

**En un módulo migrado** (hoy `contactos`) el reparto es este: la ruta o la
página valida, autoriza, llama y responde; el caso de uso o la consulta
(`application/<modulo>/`) lleva las reglas, la transacción y la auditoría; el
adaptador (`infrastructure/db/repos/<modulo>.ts`) lleva el SQL, filtrado con
`visibleRows`; y `infrastructure/contenedor/<modulo>.ts` los conecta. La receta
completa está en `src/application/README.md`.

**Dos candados de CI** hacen cumplir esto con `npm test`:

- `src/infrastructure/seguridad.test.ts` — toda tabla tiene RLS y toda ruta de
  `src/app/api/` llama a `requireScope`/`requireFullScope` (decisión #40).
- `src/infrastructure/arquitectura.test.ts` — la dirección de las capas:
  `domain/` no importa nada fuera de `domain/`; `application/` no importa
  `infrastructure/`, `app/`, `next`, `drizzle-orm` ni `@supabase`;
  `infrastructure/` no importa `app/`. Y se **endurece solo**: un módulo cuenta
  como migrado cuando existe `src/application/<modulo>/`, y desde ese momento
  sus rutas (`src/app/api/<modulo>/`) y páginas (`src/app/(crm)/<modulo>/`) no
  pueden volver a importar `@/infrastructure/db/*`. No hay lista que mantener.

## Mapa de carpetas

```
src/domain/            reglas puras y catálogos cerrados (se prueban sin infraestructura)
src/application/       casos de uso, consultas y puertos, sin base de datos
  compartido/            puertos transversales (transacción, auditoría, archivos, admin de Auth)
  testing/               dobles en memoria de esos puertos y suites de contrato
  <modulo>/              puertos, casos de uso, consultas, doble en memoria y pruebas (hoy: contactos/)
src/infrastructure/    Postgres, Supabase, RBAC en SQL, errores HTTP
  db/repos/              adaptadores Drizzle de los puertos, uno por módulo migrado
  contenedor/            fábricas que arman cada módulo, una por módulo
src/app/               App Router: (crm)/ con los 15 módulos, api/, login/, forbidden.tsx
src/middleware.ts      rutas privadas por defecto
db/seed.sql            catálogos que definen el comportamiento (roles, permisos, etapas…)
drizzle/               migración generada, aplicada en Supabase
scripts/               seed idempotente y fixtures de desarrollo
docs/                  análisis y estado por fase, despliegue, Supabase, y este contexto
referencia-prototipo/  el prototipo congelado — consulta, no código de producción
MAPEO_FRONTEND_CRM.md  documento vinculante del backend
```

## Estado del milestone de reestructuración

Mientras dura el milestone (`docs/R_ANALISIS_Y_PLAN.md`), **conviven dos formas
de organizar un módulo, y es transitorio y esperado**:

- **Migrados:** solo `contactos`. Su lógica vive en `src/application/contactos/`,
  su SQL en `infrastructure/db/repos/contactos.ts` y sus rutas y página son
  delgadas. `arquitectura.test.ts` impide que vuelvan a importar la base.
- **Sin migrar:** el resto (`leads`, `pipeline`, `actividades`, `proyectos`,
  `usuarios`, `comisiones`, `metas`, `brokers`, `catalogos`, `etapas`,
  `papelera`, `roles`). Siguen con el patrón anterior: la ruta o la página
  consulta con `getDb()` y `visibleRows`, y llama a `auditar` dentro de
  `transaction()`. Eso **no es un error**: es un módulo que aún no le toca. No lo
  "arregles" por tu cuenta ni lo migres fuera de su issue; cada uno tiene el suyo
  en el plan, y las migraciones de módulos distintos corren en paralelo.

Durante el milestone no se añaden funciones nuevas (decisión #41) y el esquema
no cambia. Al cerrarlo, ningún archivo de `src/app/` importa la base y esta
sección se sustituye por el estado final.

## Qué NO existe todavía (verificado en el repositorio)

- **Estilos propios del sistema de diseño.** Sí hay estilos: `src/app/globals.css`
  (500 líneas, portado del prototipo, decisión #18) y el shell los usa. Lo que no
  hay es Tailwind ni shadcn/ui. Llegan en R5 con la paleta de `docs/DESIGN.md`, y
  `globals.css` desaparece al final de esa fase.
- **Datos reales en cuatro módulos.** `inicio`, `reportes`, `academy` y
  `comunicaciones` siguen con datos de muestra portados del prototipo
  (`_ui/datos-muestra.ts`, `_ui/prototipo-ui.tsx`). Los otros once módulos ya
  consultan datos reales, desde F1–F3. El milestone no cambia esto (plan §10).
- **Migración de los otros doce módulos a `application/`.** Ver la sección
  anterior.
- **Entornos de staging y producción, respaldos probados y monitoreo.** Es T8,
  aplazado a la entrega por decisión #17.

Lo que antes figuraba aquí y **ya existe**: los estilos (T5), la escritura en
`audit_log` (T6, `infrastructure/audit.ts`), las consultas reales de negocio
(F1–F3) y las altas de usuario desde la aplicación (M13, decisión #28: se invita
por correo desde `api/usuarios`).
