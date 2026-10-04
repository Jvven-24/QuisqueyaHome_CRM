# T-W4b-D21 · Plan de porte de Rentas desde OpenProperty

## 1. Evaluación y procedencia
- **SHA Evaluado:** `a493028ad12ba969990ee916fbc8cd2a98807a2d` (`commits/HEAD`)
- **Licencia:** MIT (Copyright (c) 2026 Clawnify)
- **Verificación:** Se evaluó el repositorio `https://github.com/clawnify/OpenProperty` localmente tras clonar.

## 2. Inventario del repositorio (OpenProperty)

| Pieza | Ruta en repo | Función | Destino | Razón |
|-------|-------------|---------|---------|-------|
| **Properties** | `src/server/schema.sql`, `src/client/components/properties/` | Edificios/condominios | **Descartar** | El CRM ya tiene la tabla `projects`. |
| **Units** | `src/server/schema.sql`, `src/client/components/properties/` | Unidades rentables | **Descartar** | El CRM ya tiene `units`. Se enlazará la renta a ellas. |
| **Tenants** | `src/server/schema.sql`, `src/client/components/tenants/` | Inquilinos | **Reescribir** | El CRM ya tiene `contacts`. Se usarán contactos como inquilinos. |
| **Leases** | `src/server/schema.sql`, `src/client/components/leases/` | Contratos de alquiler | **PORT** | Pieza central del módulo. Se porta modelo y pantalla. |
| **Rent Ledger / Charges** | `src/server/schema.sql`, `src/server/index.ts`, `src/client/components/rent/` | Cargos de renta y moras | **PORT** | Se porta el cálculo de vencimientos (`src/server/index.ts:501` SHA: `a493028ad12ba969990ee916fbc8cd2a98807a2d`) y el ledger. |
| **Payments** | `src/server/schema.sql`, `src/server/index.ts`, `src/client/components/rent/` | Pagos aplicados | **PORT** | Se reescribe la lógica para usar los `payment_methods` del CRM. |
| **Vendors** | `src/server/schema.sql`, `src/client/components/settings/` | Proveedores | **PORT** | Nueva tabla para proveedores de mantenimiento. |
| **Work Orders** | `src/server/schema.sql`, `src/client/components/maintenance/` | Mantenimiento | **PORT** | Se asocia a `projects`/`units`. |
| **Applications** | `src/server/schema.sql` | Solicitudes de renta | **Descartar** | El CRM usa `leads` y `deals`. |
| **Settings** | `src/server/schema.sql` | Valores por defecto | **Descartar** | Se integrarán a variables de negocio o sistema. |
| **Dashboard** | `src/client/components/dashboard/` | KPIs de rentas | **PORT (parcial)** | Se extraerán los KPIs para el dashboard del CRM. |
| **Tests** | N/A | Pruebas unitarias/E2E | **Ausentes** | No hay pruebas en el repo original (verificado con búsqueda). |

## 3. Mapeo a nuestro esquema (`src/infrastructure/db/schema.ts`)

Se añadirán las siguientes tablas con convención CRM (`public_id`, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`, y montos en centavos `_cents`):

- **`rent_leases`**: Enlaza `unit_id` (`units.id`) con `tenant_id` (`contacts.id`). Campos: `start_date`, `end_date`, `monthly_rent_cents`, `deposit_cents`, `rent_due_day`, `late_fee_cents`, `currency`, `status` (catálogo o enum: `upcoming`, `active`, `ended`, `cancelled`). Lleva RLS.
- **`rent_charges`**: Cargos emitidos por contrato. Enlaza `lease_id` (`rent_leases.id`). Campos: `period` (YYYY-MM), `due_date`, `amount_cents`, `amount_paid_cents`, `status` (catálogo o enum: `open`, `partial`, `paid`, `overdue`, `waived`), `currency`. Índice único parcial o compuesto en `(lease_id, period)`. Lleva RLS.
- **`rent_payments`**: Pagos recibidos. Enlaza `charge_id` (`rent_charges.id`) y `method_id` (`payment_methods.id`). Campos: `paid_at`, `amount_cents`, `reference`, `notes`, `currency`. Lleva RLS.
- **`rent_vendors`**: Proveedores para mantenimiento. Campos: `public_id`, `name`, `category_id` (catálogo), `phone`, `email`. Lleva RLS.
- **`rent_work_orders`**: Mantenimiento. Enlaza `unit_id` (`units.id`), `tenant_id` (`contacts.id`, quien reporta), y `vendor_id` (`rent_vendors.id`). Campos: `title`, `description`, `priority` (`urgent`, `high`, `normal`, `low`), `status` (`open`, `assigned`, `in_progress`, `completed`, `cancelled`), `scheduled_at`, `completed_at`, `cost_cents`. Lleva RLS.

**Enlaces con entidades existentes:**
- **Inversionistas / Inquilinos:** Ambos son registros en `contacts`. Un contrato asocia la unidad (`units.id`) con un contacto (`contacts.id`) como inquilino.
- **Unidades:** Las `units` tendrán una forma de identificar que están disponibles para renta (ej. `operation_type='rent'`) y se sabrá su ocupación según los contratos activos en `rent_leases`.
- **Catálogos:** Estados de contrato y tipos de cargo usarán tablas de catálogos o enums según se considere en `domain/catalogs.ts`.

## 4. Casos de uso (`src/application/rentas/`)

Siguiendo el modelo en `src/application/README.md`, se implementarán:

**Puertos (`puertos.ts`):** 
Definiciones de los tipos de fila exacta, `RepositorioLeases`, `RepositorioCharges`, `RepositorioPayments`, `RepositorioWorkOrders`, `RepositorioVendors`.

**Casos de uso (`casos-de-uso.ts`):**
- `crearContrato`, `editarContrato`, `cancelarContrato` (autorizan con scope de renta y auditan).
- `generarCargosMensuales`: Lógica idempotente (portada de `src/server/index.ts:501` - SHA `a493028ad12ba969990ee916fbc8cd2a98807a2d`) que emite los `rent_charges` del mes para contratos activos y actualiza a `overdue` los impagos con la transacción (`deps.unidad.ejecutar`).
- `registrarPago`: Inserta en `rent_payments` y recalcula el `amount_paid_cents` y `status` del `rent_charges` (`src/server/index.ts:584` - SHA `a493028ad12ba969990ee916fbc8cd2a98807a2d`) en la misma transacción.
- `crearOrdenTrabajo`, `asignarProveedor`, `completarOrdenTrabajo`.
- `crearProveedor`, `editarProveedor`.

**Consultas y Vistas (`consultas.ts` y Tabs):**
- **Contratos:** Listado con inquilino, unidad, renta y vigencia.
- **Cobros (Rent Ledger):** Estado de cuenta agrupado por periodo, con cálculos de pendiente vs cobrado.
- **Mantenimiento:** Tablero de `rent_work_orders` filtrado por estado.
- **Proveedores:** Directorio de `rent_vendors`.

## 5. Datos simulados (Seed)
Para que el módulo sea probable:
- **~60 contratos (`rent_leases`)**: Sembrados en estados variados (`active`, `ended`).
- **12 meses de cargos y pagos**: Se insertarán registros históricos coherentes.
- **Mora realista (~8-12%)**: Un porcentaje de los `rent_charges` recientes tendrán pagos parciales o nulos, marcados como `overdue`, alimentando así métricas reales en el Dashboard.
- **Mantenimiento**: Órdenes de trabajo abiertas y resueltas con diferentes prioridades.

## 6. Riesgos y ausencias
**Lo que OpenProperty NO cubre (y no se incluirá):**
- **Pagos reales:** La captura es manual (registro contable). No hay pasarela (Stripe/ACH).
- **Portal de inquilino:** El CRM es para uso interno; los inquilinos no tienen login.
- **Pruebas:** El repo carece de tests; los casos de uso nuevos deberán escribirse con TDD.
- **Divisas:** OpenProperty asume moneda única. Dado que Quisqueya Home maneja DOP y USD, todas las tablas requerirán la columna `currency` en el CRM y validaciones.
- **Liquidación a propietarios:** El modelo no incluye flujo de reportes/pagos de ganancias al dueño de la propiedad si el CRM la administra como tercero.

## Handoff para D11
- Todo el mapeo propuesto encaja con el estándar del CRM. 
- La ruta del repo ha sido mapeada a descartar, portar o reescribir.
- **Importante:** Prioriza la transacción de `generarCargosMensuales` y `registrarPago`, ya que la idempotencia y el recálculo de mora no pueden fallar silenciosamente. Las pruebas unitarias de `application/rentas/` para estos casos de uso serán tu salvaguarda.
- Recordar agregar los recursos a `PERMISSION_RESOURCES` en `domain/catalogs.ts` e invocar `.enableRLS()` al definir cada tabla nueva en `schema.ts`.
