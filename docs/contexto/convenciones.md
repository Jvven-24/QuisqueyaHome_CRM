# Convenciones — CRM Quisqueya Home

Estas son las convenciones del **repositorio de producción**, al cierre de F0
(1 de septiembre de 2026). Si algo aquí contradice a `referencia-prototipo/`,
manda este documento: el prototipo corría sobre SQLite/D1 y ya no aplica.

## Estilo de código

- TypeScript **strict** (`tsconfig.json`), `moduleResolution: bundler`, alias
  `@/*` → `src/`.
- Arquitectura hexagonal en tres carpetas: `src/domain/` (reglas puras, sin
  importar nada de Next, Drizzle ni Supabase), `src/application/` (casos de uso)
  y `src/infrastructure/` (adaptadores). La dependencia va siempre de
  infraestructura a dominio, nunca al revés.
- Componentes de servidor por defecto. `"use client"` solo cuando el componente
  necesita estado o eventos, y en el archivo más pequeño posible — un layout no
  se convierte en cliente para marcar un enlace activo.
- Tipos con `type`, no `interface`, para modelos de dominio.
- Catálogos cerrados como arrays `as const` en `src/domain/catalogs.ts`
  (`STAGE_KINDS`, `PERMISSION_ACTIONS`, `PERMISSION_SCOPES`, `ENTITY_TYPES`…),
  con su tipo derivado. El esquema los importa para tipar sus columnas.
- Funciones auxiliares puras, con nombre descriptivo en camelCase.

## Naming

- Identificadores de código en **inglés**; texto visible al usuario en
  **español** (etiquetas, mensajes de error, catálogos editables). Comentarios en
  español.
- Tablas y columnas en `snake_case` en SQL, `camelCase` en TS (convención
  estándar de Drizzle).
- Dinero: siempre `*_cents` en **`bigint`**, nunca coma flotante y nunca
  `integer` — `integer` desborda a US$21,4 M (decisión #14).
- Porcentajes de dinero: puntos básicos enteros (`450` = 4,5 %).
- Teléfonos: E.164 en `phone`, formato tal como lo escribió el usuario en
  `phone_display` aparte.
- **Fechas: tipos nativos de Postgres (`timestamptz`), no texto** (decisión #13).
  La convención de fondo no cambió: **todo se guarda en UTC y la conversión a
  `America/Santo_Domingo` ocurre en la aplicación**. Lo que cambió es el tipo de
  columna — la regla de «texto ISO-8601» existía por un defecto de SQLite que
  Postgres no tiene, y guardar fechas como texto aquí tiraría a la basura los
  rangos, los índices de fecha y la aritmética de intervalos.
- `updated_at` se actualiza vía `$onUpdate` de Drizzle, para que el valor sea el
  mismo lo escriba quien lo escriba.
- Recursos y entidades como listas cerradas (`PERMISSION_RESOURCES`,
  `ENTITY_TYPES`), no strings libres — evita que `"Leads"` frente a `"leads"`
  desactive un permiso en silencio.

## Patrones que usamos

- **Lecturas desde componentes de servidor, escrituras por route handlers**
  (§20.2 del mapeo, decisión #9). Los ejemplos vivos están en
  `src/infrastructure/README.md`.
- Etapas del pipeline como **tabla configurable** (`pipeline_stages`), no enum:
  las reglas de negocio se enganchan a `kind` (`open`/`won`/`lost`), **nunca al
  nombre visible**, que es renombrable desde M13.
- Permisos como **recurso + acción + alcance**
  (`permissions(role_id, resource, action, scope)`), con `scope="own"` en lugar
  de comparar nombres.
- Índices únicos parciales `WHERE deleted_at IS NULL`, para que la papelera no
  bloquee reutilizar un email o un teléfono.
- Campos transversales en toda tabla operativa: `id`, `created_at`,
  `updated_at`, `created_by`, `updated_by`, y `deleted_at` donde hay papelera.
- Errores: un caso de uso lanza `ValidationError` / `ForbiddenError` /
  `UnauthorizedError` / `NotFoundError` / `ConflictError` de `src/domain/errors.ts`,
  nunca un `Error` genérico ni un `{ ok: false }`. `errorResponse` los traduce a
  HTTP en un solo sitio.

## Prohibido / a evitar

- Coma flotante para dinero o comisiones.
- Claves foráneas cíclicas: `deals.next_activity_id` y `leads.converted_deal_id`
  se resuelven en la aplicación (decisión #8). Su integridad se garantiza
  escribiéndolos dentro de la misma transacción que el registro al que apuntan.
- Filtrar por rol comparando nombres. Se usa `scope=own`, centralizado.
- Que cada módulo escriba su propio `WHERE broker_id = ?`. El filtro vive en
  `src/infrastructure/rbac-filter.ts` (`visibleRows`) y en ningún otro sitio: si
  cada módulo filtra a su manera, la seguridad deja de ser auditable (§18.1).
- Abrir una conexión propia o leer `process.env` por tu cuenta. `getDb()` y
  `src/infrastructure/env.ts`.
- Modificar `src/infrastructure/db/schema.ts` fuera de un PR dedicado con su
  migración generada — está **congelado** (ver `flujo-de-trabajo.md`).
- Añadir una dependencia para lo que resuelven la plataforma o veinte líneas.

## Tests

- `node:test` + `node:assert/strict`, sin framework externo.
- `npm test` = `node --test "src/**/*.test.ts"` — corre **contra la fuente**, con
  el borrado de tipos de Node, y **sin base de datos**.
- Consecuencia práctica de ese borrado de tipos: **no se usan propiedades de
  parámetro de TypeScript** (`constructor(public x)`) en código que se ejecute en
  las pruebas. Ver `ValidationError` en `src/domain/errors.ts`, que declara el
  campo aparte por esto.
- Lo que se prueba es lo que corrompe datos o abre un agujero: la decisión de
  permiso, el filtro por alcance, las reglas de transición de etapa y el cierre
  transaccional. No hay pruebas de maquetación.
- Precedente a copiar: `src/domain/rbac.test.ts` y
  `src/infrastructure/rbac-filter.test.ts`.

## Commits

Conventional Commits con la capa o el módulo entre paréntesis, mensaje en
**español**, imperativo y explicando el efecto, no el archivo:

```
feat(T3): RBAC en servidor, puro y probado sin base de datos
fix(T1,T2): usa el session pooler y traduce el último mensaje de validación
docs(F0): estado tras verificar contra la base real
```

Un PR por paso del plan de fase, contra `develop`. `main` y `develop` están
protegidas.
