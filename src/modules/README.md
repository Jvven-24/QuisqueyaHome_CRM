# src/modules/ — Registro central de módulos (VRE-OS)

Este directorio es la **única fuente de verdad** para los módulos del CRM Quisqueya Home.

## Estructura por módulo (regla para migrar el resto)

Cada módulo sigue esta distribución de responsabilidades (no mezclar capas):

- **UI y entrada de usuario** (solo presentación y orquestación delgada):
  - `src/app/(crm)/<slug-del-modulo>/` (ej. `tareas/`, `leads/`)
    - `page.tsx` — componente servidor delgado: `requireActor`, `requireScopeInPage`, lee datos vía consulta o caso de uso, pasa props a vista cliente.
    - `layout.tsx` — shell local del módulo (navegación interna, estados conexión si aplica).
    - `vista.tsx` o `*.tsx` — componentes cliente; **después de refactor <400 líneas** delegando en subcarpetas.
    - `_componentes/` — subcomponentes, diálogos, tableros, inspectors (todo UI).
    - `_lib/` — tipos locales, utilidades puras, hooks de UI, formateadores.
    - `loading.tsx`, `error.tsx`, `not-found.tsx` — estados de Next.
    - subrutas como `/tareas/recurrencias` para pestañas o secciones.

- **Lógica de aplicación (casos de uso y consultas)**:
  - `src/application/<modulo>/`
    - `puertos.ts` — interfaces `Repositorio<Modulo>`, tipos de entrada/salida (sin Drizzle).
    - `casos-de-uso.ts` — escrituras (crear, editar, transacciones, auditoría).
    - `consultas.ts` — lecturas para páginas (paginación, filtros, joins autorizados).
    - `en-memoria.ts` — doble en memoria del repo para tests.
    - `*.test.ts` — pruebas node:test (sin BD).

- **Infraestructura (adaptadores concretos)**:
  - `src/infrastructure/db/repos/<modulo>.ts` — implementación Drizzle + `visibleRows` + transacción.
  - `src/infrastructure/contenedor/<modulo>.ts` — fábrica que une puertos + adaptadores.

- **Entrada en el registro**:
  - Declarar SIEMPRE en `src/modules/registry.ts`:
    - id estable, nombre visible exacto, rutaBase, icono, `recurso` RBAC (de `domain/catalogs`), subrutas, `estado: "real" | "parcial" | "demo"`.
  - El nav (sidebar, dock, command, section) se genera a partir de `REGISTRO_MODULOS` (ver `app/(crm)/modulos.ts` que mapea).
  - Tests automáticos en `registry.test.ts` validan unicidad de rutas, existencia de `page.tsx` y recursos válidos.

## Reglas duras

- Nunca duplicar datos de módulos (nombres, rutas, permisos) fuera del registry.
- Orden en `REGISTRO_MODULOS` determina orden en nav (no reordenar sin cambiar ficha).
- Texto visible al usuario, atajos y descripciones se mantienen byte-a-byte.
- Al añadir módulo: 1) entrada en registry, 2) carpeta app/(crm)/<m> con page, 3) si migra lógica → application + repo.
- `npm test` debe pasar las guardas de `registry.test.ts`.
- Usa tokens Viltrum (`var(--navy-900)`, `--gold-600`, `--ink`, etc.) definidos en `src/app/tokens.css` + `viltrum-tokens.css`.
- No toques auth, login, middleware de sesión, migraciones ni BD.

## Cómo migrar un módulo existente al estándar

1. Añadir/actualizar entrada en `registry.ts`.
2. Mover lógica pura a `_lib/` + tests.
3. Extraer subcomponentes a `_componentes/`.
4. Dejar `page.tsx` y `vista.tsx` delgadas.
5. Si corresponde, extraer a `application/<modulo>/` (ver `src/application/README.md`).
6. Actualizar tests de arquitectura/seguridad si aplica.
7. Correr `npx tsc --noEmit -p . && npx -y node@22 --test "src/**/*.test.ts"`

El resto de módulos se migran siguiendo exactamente este patrón.
