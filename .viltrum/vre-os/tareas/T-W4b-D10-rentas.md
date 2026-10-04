# T-W4b-D10 · Módulo Rentas portado de OpenProperty (esquema, casos de uso, seed y vista)

Perfil: **D10 Backend** (con D11 para el esquema). Modo: fix en worktree. Revisor: D12 (otro proveedor).
Autorización: decisiones #43/#44 (sí escribes código en los archivos listados; sin git ni commit, sin `npm run dev`/`build`).
Plan de porte que manda: `.viltrum/vre-os/D21-rentas-porte.md` (SHA `a493028ad12ba969990ee916fbc8cd2a98807a2d`,
`clawnify/OpenProperty`, MIT). Arquitectura: `.viltrum/vre-os/ARQ-VRE-002-integraciones.md` §3. Receta:
`src/application/README.md`. Diseño: `docs/DESIGN.md` y `.viltrum/vre-os/D05-graficas-movil.md`.

## Construir
1. **Esquema** (una migración Drizzle nueva, RLS en todo): contratos de renta (unidad → `units`, inquilino y
   propietario → `contacts`), cargos mensuales, pagos, depósitos, órdenes de mantenimiento, proveedores; catálogos de
   estado de contrato y tipo de cargo **en tabla**; montos en centavos con moneda (USD/DOP); `public_id`, borrado lógico.
   Restricción: una unidad no puede tener dos contratos activos que se solapen (constraint o índice parcial + prueba).
2. **`src/application/rentas/`**: puertos, casos de uso (`crearContrato`, `generarCargosMensuales` idempotente,
   `registrarPago`, `aplicarMora`, `renovarContrato`, `abrirOrdenMantenimiento`, `cerrarOrden`), consultas (estado de
   cuenta, mora, ocupación, ingresos por mes), doble en memoria y pruebas. Portar la lógica citada en el plan con
   **cabecera de procedencia** en cada archivo portado (repo, SHA, archivo y líneas origen, licencia MIT).
3. **Infraestructura**: `db/repos/rentas.ts`, `contenedor/rentas.ts`; rutas `src/app/api/rentas/**` con
   `requireScope`/`visibleRows`, Zod y asignación campo por campo (reglas de `AGENTS.md`). Recurso de permisos
   `rentas` en el catálogo/seed de permisos.
4. **Seed**: extender `scripts/seed/` (reutilizando catálogos existentes, guardas actuales): ≈60 contratos sobre
   unidades vendidas, 12 meses de cargos y pagos, mora ≈8–12 %, órdenes de mantenimiento.
5. **Vista** `src/app/(crm)/rentas/`: pestañas Contratos · Cobros · Mantenimiento · Proveedores (`ModuleTabs`),
   KPIs (ocupación, ingresos del mes, mora), una gráfica con `src/components/ui/chart.tsx` (ingresos vs. cobrado por
   mes), lista en tarjetas en móvil, hoja inferior (`drawer.tsx`) para el detalle, seis estados. Entrada en el menú
   lateral (grupo Operaciones) **sin** badge decorativo.

## Archivos permitidos
`src/infrastructure/db/schema.ts`, `drizzle/**`, `src/application/rentas/**`, `src/infrastructure/db/repos/rentas.ts`,
`src/infrastructure/contenedor/rentas.ts`, `src/app/api/rentas/**`, `src/app/(crm)/rentas/**`,
`src/app/(crm)/_ui/crm-sidebar-menu.tsx` (solo añadir la entrada), `scripts/seed/**`, catálogo de permisos/seed, tests.

## Verificación (pega la salida real)
`npx tsc --noEmit --incremental false` (ignora `.next/types`) · `npm run lint` · `npm test` (incluye
`seguridad.test.ts` y `arquitectura.test.ts`).

## Entregable
`.viltrum/vre-os/D10-rentas.md`: tablas, casos de uso, archivos portados con procedencia, y `## Pruebas`.
