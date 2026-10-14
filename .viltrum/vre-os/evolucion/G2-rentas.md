# Expediente de evolución · Rentas (M15: contratos de renta, cargos, mora, mantenimiento)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21+D03+D05, grupo G2, 14-oct-2026. Solo lectura de `src/` y web.
> Reglas: misma tecnología primero. Copiar o portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia). AGPL/GPL solo RUN o referencia.
> **Parte de lo ya hecho:** `.viltrum/vre-os/D21-rentas-porte.md` (plan de porte desde OpenProperty, SHA `a493028ad12b…`) y su rechazo previo (`D10-rentas.md`). Este expediente **no lo repite**: lo verifica contra el código fuente real de OpenProperty, corrige lo que no coincide y lo extiende a nivel avanzado. Nivel 0 en el CRM.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 0 | Sin ruta ni módulo (`crm-mapa-modulos` M15: «operationType/pricePeriod compartidos no equivalen a gestión de rentas»). |
| Datos reales y reglas de negocio | 1 | `units.operation_type='rent'` y `price_period='monthly'` existen (`schema.ts:493-498`); el cierre de un negocio de alquiler deja la unidad en `reserved` (`pipeline/cierre.ts:124`). No hay contrato de renta, cargo, pago ni propietario. |
| Diseño y componentes | 0 | Sin interfaz. |
| Experiencia de uso | 0 | Sin flujo. |
| Calidad | 0 | El repo de origen **no trae pruebas** (D21 rentas-porte §2); todo se escribe con pruebas nuevas. |

Objetivo de este programa: 4.

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **El registro del programa describe mal a OpenProperty.** `D21-cobertura-modulos.md` lo lista como «Stack: PHP». Leí hoy su `package.json` y árbol (commit `a493028ad12b…`, rama `master`, última actividad 9-sep-2026): es **TypeScript, React 19, Vite, Tailwind v4, Radix/shadcn, Zod, servidor Hono sobre Cloudflare Workers y base D1 (SQLite)** (`wrangler.toml`, `package.json`). Es decir: la interfaz es casi de nuestra tecnología (portable); el servidor y la base **no** (se reescriben a casos de uso + Drizzle + PostgreSQL).
2. **Lo que el plan de porte llama «recálculo de mora» no existe en el origen.** `src/server/index.ts:501-531` (`/api/rent-charges/generate`) solo crea el cargo del periodo (`ON CONFLICT(lease_id, period) DO NOTHING`) y marca `overdue` los abiertos con `due_date < date('now')`. La columna `late_fee` del contrato y los ajustes `late_fee_amount` y `late_fee_grace_days` (`index.ts:23-24`) **no se usan en ningún cálculo**. El recargo por mora y los días de gracia son funciones nuevas.
3. **Los importes son decimales de coma flotante** (`monthly_rent REAL`, `amount REAL`, `amount_paid REAL`; `schema.sql:67-70,93-94,109`). Nuestro estándar es entero en centavos y BigInt para conversión (M22 §4). Portar la tabla tal cual sería un defecto de dinero.
4. **El recálculo del pago no es atómico.** `index.ts:574-593` inserta el pago, luego lee la suma y luego actualiza el cargo en tres sentencias sin transacción; dos pagos simultáneos pueden dejar el cargo en estado equivocado. Es la misma clase de fallo que M22 resuelve con bloqueo del plan y UPDATE condicional (M22 §4, CA-10): se reutiliza el diseño, no el código.
5. **El origen borra el dinero**: `DELETE /api/payments/:id` (`index.ts:594-`) y `ON DELETE CASCADE` de contrato → cargos → pagos (`schema.sql:62-63,89,106`). Contradice «nada se elimina» (D-10) y M22 (FK `RESTRICT`, anulación con segunda aprobación).
6. **Fechas en UTC y tope al día 28.** `date('now')` (SQLite, UTC) decide la mora y `Math.min(28, …)` recorta el día de pago (`index.ts:513,528`). En República Dominicana (UTC−4) una cuota que vence hoy aparece vencida desde las 8 p. m. Debe usar el día en `America/Santo_Domingo` (`domain/zona-horaria.ts` existe y M22 define la regla «vence al terminar el día»).
7. **Nada impide dos contratos activos sobre la misma unidad en fechas solapadas.** Ni OpenProperty ni nuestro esquema lo prohíben. Se necesita una restricción de exclusión (`EXCLUDE USING gist (unit_id WITH =, daterange(start_date, end_date, '[]') WITH &&) WHERE status in (...)`), que exige la extensión `btree_gist` y una migración SQL a mano (Drizzle no modela exclusiones). No verifiqué que la instancia local tenga la extensión.
8. **Falta el recurso de permisos** `rentals`: `PERMISSION_RESOURCES` (`catalogs.ts:36-58`) no lo tiene y `npm test` falla si se crea una ruta sin permiso. Tampoco hay entidad de **propietario** (A14.2): ¿Quisqueya administra unidades de terceros o solo las propias de la desarrolladora? **Es UNKNOWN** y cambia el alcance (liquidación al propietario, comisión de administración).
9. **Dos libros de pagos paralelos.** M22 declara «cobro de rentas (M15)» fuera de su alcance; si Rentas crea su propia numeración de recibos, tasas congeladas y anulaciones sin compartir las funciones de dinero de M22 (`domain/cobros.ts`, lote M22-L1), habrá dos criterios de redondeo y de tipo de cambio.
10. **Fiscal de alquileres sin investigar** (ITBIS del arrendamiento residencial, comprobante fiscal recurrente): D21 catálogo A14.4 lo deja «verificar con contador».

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| RT-01 | Contrato de renta: unidad, inquilino (contacto), fechas, canon y moneda (USD/DOP), día de pago, depósito, garantes, estado; sin solapes por unidad | ESENCIAL | A14.1 | No existe |
| RT-02 | Cargos mensuales idempotentes por periodo, con prorrateo del primer y último mes y ajuste anual del canon | ESENCIAL | A14.1 | No existe |
| RT-03 | Pagos con imputación a cargos, parciales y adelantos; recibo `RR-AAAA-NNNNNN` no fiscal; anulación con segunda aprobación | ESENCIAL | A14.1, A19.2 | No existe |
| RT-04 | Mora derivada al leer (día en Santo Domingo), recargo configurable con días de gracia, recordatorios por evento | ESENCIAL | A7.4 análogo | No existe |
| RT-05 | Depósito en garantía como libro propio (recibido, retenido con motivo, devuelto) e inspección de entrada/salida con fotos | IMPORTANTE | A14.3 | No existe |
| RT-06 | Mantenimiento: órdenes de trabajo con prioridad, proveedor, costo, fotos, estado; ligadas a unidad y contrato; directorio de proveedores | IMPORTANTE | A14.3 | No existe |
| RT-07 | Renovaciones: alertas a 90/60/30 días, propuesta con ajuste (porcentaje fijo o índice), tarea al responsable | IMPORTANTE | A14.1 | No existe |
| RT-08 | Tablero de ocupación: línea de tiempo por unidad (ocupada, vacante, por vencer), vacancia y renta cobrada vs esperada | IMPORTANTE | A14.1 | No existe |
| RT-09 | Estado de cuenta del inquilino (PDF) y liquidación al propietario con comisión de administración (si aplica el modelo) | IMPORTANTE | A14.2 | No existe |
| RT-10 | Comprobante fiscal por cobro recurrente vía `FacturacionPort` | IMPORTANTE | A14.4 | No existe |
| RT-11 | Renta vacacional: calendario de reservas e iCal de entrada/salida | DESEABLE | A14.5 | No existe |
| RT-12 | Reportes: antigüedad de cartera de rentas, ocupación, ingreso por propiedad, costo de mantenimiento | IMPORTANTE | A13.2 | No existe |
| RT-13 | Un negocio de renta ganado crea un contrato en borrador con los datos del negocio | IMPORTANTE | — | El cierre solo marca `reserved` |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **OpenProperty** | `clawnify/OpenProperty` @ `a493028ad12ba969990ee916fbc8cd2a98807a2d` (rama `master`, 9-sep-2026, 24 estrellas) | MIT, © 2026 Clawnify (`LICENSE` leído) | TypeScript, React 19, Vite, Tailwind v4, shadcn/Radix, Hono, D1 | **UI**: `src/client/components/leases/leases-page.tsx`, `lease-dialog.tsx`, `rent/rent-page.tsx`, `payment-dialog.tsx`, `maintenance/maintenance-page.tsx`, `work-order-dialog.tsx`, `dashboard/dashboard-page.tsx`. **Lógica**: estructura de `generate` (`index.ts:501-531`), conjunto de KPIs del tablero (`index.ts:821-`), catálogo de categorías de proveedor (`index.ts` `VendorInput`). **Modelo**: `src/server/schema.sql` (leases, rent_charges, payments, vendors, work_orders) como borrador de columnas | PORT parcial (UI y estructura) + reescritura de datos | UI casi directa (mismo React/Tailwind/shadcn; hay que sustituir `@clawnify/app` y su `use-router.ts` por rutas de Next y `@phosphor-icons` por lucide); servidor y base se reescriben | M (UI) + L (datos) |
| MicroRealEstate | `microrealestate/microrealestate` (rama `master`; último commit 9-dic-2025 según el feed de GitHub) | MIT (`LICENSE` leído, © 2017 Camel Aissani) | JavaScript/Node en microservicios, MongoDB, aplicaciones web propias (su README no está pensado para otra base) | Ideas de producto: plantillas de contrato de arrendamiento, avisos, cálculo de rentas. **No leí su código** | REF | No encaja (Mongo, microservicios); sirve de contraste de funciones | — |
| react-calendar-timeline | npm `0.30.0-beta.4` (oct-2025) | MIT (registro npm) | React | Línea de tiempo por unidad para RT-08 (barras de ocupación) | APP (riesgo) | Es beta; peer React 18/19-rc; alternativa: barras con CSS Grid propias | M |
| @schedule-x/react | npm `4.1.0` (ene-2026) | MIT (registro npm) | TypeScript | Calendario para renta vacacional (RT-11); ya elegido por el programa para Agenda | APP | Reutiliza la decisión del mapa OSS | M |
| ical-generator / node-ical | npm `ical-generator@11.1.2` (28-sep-2026) MIT; `node-ical@0.27.3` (3-oct-2026) Apache-2.0 | MIT / Apache-2.0 (registro npm) | TypeScript / JS | Exportar e importar iCal de plataformas (RT-11) | APP | `ical-generator` ya está en el mapa OSS | S |
| @react-pdf/renderer | `diegomura/react-pdf` @ `e7b14db1e53d`; `4.9.0` | MIT (`LICENSE` leído) | TypeScript | Estado de cuenta del inquilino y recibos (RT-09) con la base de PDF compartida | APP | — | S |
| write-excel-file | npm `4.1.1` (jun-2026) | MIT (registro npm) | TypeScript | Exportar hoja de cartera o liquidación (si el CSV no basta) | APP (opcional) | Alternativa a ExcelJS (MIT, sin publicar desde 2023) | S |
| croner | npm `10.0.1` | MIT (registro npm) | TypeScript | Programar la generación mensual de cargos y recordatorios dentro del worker existente | APP | Mismo ejecutor que Reservas RS-L10 | S |
| Odoo (módulo de rentas de terceros) | — | LGPL (Community) | Python | Ideas: factura recurrente, vista Gantt de disponibilidad (catálogo D21 A.1) | REF | — | — |

**Qué no adaptamos y por qué.** No se porta el modelo de datos de OpenProperty (decimal flotante, borrado en cascada, sin transacciones, sin moneda, fechas UTC); sí su organización de pantallas y su conjunto de indicadores. **Riesgos:** (a) OpenProperty tiene 24 estrellas y un solo mantenedor: se trata como cantera de ideas con procedencia anotada, no como dependencia; (b) mantenimiento futuro es nuestro; (c) licencia limpia (MIT), pero la cabecera de procedencia con SHA es obligatoria en cada archivo derivado.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Módulo con pestañas: **Contratos · Cobros · Mantenimiento · Ocupación** (como pide el mandato W4b) | `Tabs` + `module-tabs.tsx` | `/rentas` |
| Lista de contratos con semáforo (vigente, por vencer, vencido, moroso) | `data-table.tsx`, `Badge`, filtros en la URL | pestaña Contratos |
| Ficha del contrato en `Sheet`: partes, canon, calendario de cargos, depósito, documentos, historial | `Sheet`/`Drawer` | `/rentas/[id]` |
| Libro de cobros por periodo con barra de avance de cobro | tabla semántica + `chart.tsx`; «Registrar pago» como acción primaria con vista previa de imputación | pestaña Cobros |
| Tablero de mantenimiento por estado (columnas o lista) y prioridad | reutiliza el patrón de tablero de Negocios (`negocios/vista.tsx`) sin copiar su lógica | pestaña Mantenimiento |
| Línea de tiempo de ocupación | barras con CSS Grid (o `react-calendar-timeline`), clic abre la ficha | pestaña Ocupación |
| Tokens y estados | Tokens de `docs/DESIGN.md`; seis estados; móvil como tarjetas; objetivo táctil ≥48 px | todo |
Los totales nunca mezclan USD y DOP (regla de M22); las fechas de mora en `America/Santo_Domingo`.

## 6. Comunicación con el resto (centralización)
- **Consume:** unidades de Propiedades (`operation_type='rent'`), contactos como inquilinos (Contactos), negocio de renta ganado (Negocios), funciones de dinero y tipo de cambio de M22 (`domain/cobros.ts`, `exchange_rates`), `party_identities` (inquilino) y documentos (contrato firmado, inspección) de Documentos.
- **Emite (outbox, `OBX`):** `ContratoRentaCreado`, `CargoRentaGenerado`, `PagoRentaRegistrado`, `CargoRentaVencido`, `ContratoRentaPorVencer`, `OrdenTrabajoCreada/Completada`. Consumen: Comunicaciones (recordatorios), Tareas (renovación, mantenimiento), Reportes/Inicio (ocupación y cartera), `FacturacionPort` (comprobante, cuando exista I03), Portal (disponibilidad de la unidad en renta).
- **Una sola puerta de estado de unidad:** al activar un contrato la unidad pasa a ocupada por `cambiarEstadoUnidad`; al terminar, vuelve a disponible. Hoy el cierre de un negocio de renta pone `reserved` (`cierre.ts:124`), que para una renta larga es el estado equivocado; se corrige junto con RS-L6.
- **Tablas propuestas (ficha de datos nueva):** las del plan de porte (`rent_leases`, `rent_charges`, `rent_payments`, `rent_vendors`, `rent_work_orders`) más `rent_deposits`, `rent_inspections`, `rent_payment_void_requests`, con importes `bigint`, `currency`, RLS y FK `RESTRICT`.
- **Permisos (propuesta):** recurso `rentals` (`view|create|edit|export`), anulación de pagos con segundo admin; mantenimiento con permiso propio si se abre a un rol de operaciones.

## 7. Lotes asignables
Todos requieren **ficha M15-rentas READY** (no existe; la tarea previa `T-W4b-D10-rentas` fue rechazada por faltar contrato de módulo y modelo de datos, `D10-rentas.md`). Orden del mandato W4b: D11 esquema → D10 casos de uso → D09 vistas → D14 capturas. `M22-L1` = funciones de dinero compartidas. Cada archivo derivado de OpenProperty lleva la cabecera: `Procedencia: clawnify/OpenProperty @ a493028ad12b, MIT, © 2026 Clawnify; ruta de origen: …`.

| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| RT-L1 | Dominio puro: periodos, prorrateo, vencimiento por día local, imputación, mora con gracia y recargo, renovación con ajuste; todo en enteros; pruebas de bordes (30/31, febrero, medianoche de Santo Domingo) | `src/domain/rentas.ts`, `.test.ts` | M15 | Sonnet | Codex + D12 | M22-L1 |
| RT-L2 | Esquema y migración: tablas de renta con RLS, FK `RESTRICT`, índice único `(lease_id, period)`, **exclusión de solapes** con `btree_gist` (SQL manual) y recurso `rentals` en permisos; prueba de que dos contratos solapados fallan | `schema.ts`, `drizzle/00NN_*.sql`, `catalogs.ts`, `scripts/seed/*`, `seed-invariantes.test.ts` | M15 (datos) | Sonnet (D11) | D12 + D14 | RT-L1; confirmar `btree_gist` (§8) |
| RT-L3 | Casos de uso de contrato: crear, editar, activar (con `cambiarEstadoUnidad`), terminar, cancelar; unidad de trabajo, auditoría, evento | `src/application/rentas/{puertos,casos-de-uso,en-memoria}.ts` + pruebas | M15 | Sonnet | D12 + Codex | RT-L2, `UND` |
| RT-L4 | `generarCargosMensuales` idempotente + `registrarPago` atómico (bloqueo del contrato, UPDATE condicional) + anulación con segunda aprobación; **prueba de concurrencia en BD** (dos pagos, mutación del bloqueo) | `src/application/rentas/cobros.ts`, `scripts/test-db/rentas.ts`, `src/infrastructure/db/rentas.db.test.ts` | M15 | Sonnet | D12 + D14 | RT-L3, M22-L5 (patrón) |
| RT-L5 | Repositorio Drizzle y consultas con alcance y proyección por rol | `src/infrastructure/db/repos/rentas*.ts`, `src/application/rentas/consultas.ts` | M15 | Sonnet (D11) | D12 | RT-L2 |
| RT-L6 | Rutas `api/rentas/**` con Zod estricto, `requireScope`, `:id` con alcance | `src/app/api/rentas/**`, pruebas de seguridad | M15 | Sonnet | D12 | RT-L4, RT-L5 |
| RT-L7 | Pestaña Contratos (lista y ficha) portando `leases-page`/`lease-dialog` con cabecera de procedencia | `src/app/(crm)/rentas/**`, `modulos.ts` | M15 | Sonnet | D07 + D14 | RT-L6 |
| RT-L8 | Pestaña Cobros (libro por periodo, diálogo de pago con vista previa de imputación) portando `rent-page`/`payment-dialog` | `rentas/_cobros.tsx` | M15 | Sonnet | D07 + D14 | RT-L7 |
| RT-L9 | Pestaña Mantenimiento (órdenes, proveedores, fotos con el módulo de subida compartido) portando `maintenance-page`/`work-order-dialog` | `rentas/_mantenimiento.tsx` | M15b | Sonnet | D14 | RT-L7, AV-L3 |
| RT-L10 | Seed determinista: ~60 contratos, 12 meses de cargos y pagos, mora realista 8–12 %, órdenes de trabajo; invariantes | `scripts/seed/rentas.ts`, `seed-invariantes.test.ts` | M15 | Sonnet (D11) | D14 | RT-L2 |
| RT-L11 | Tablero de ocupación y KPIs (ocupación, cobrado vs esperado, vencimientos 30/60/90, abiertas/urgentes) portando `dashboard-page` | `rentas/_ocupacion.tsx`, consulta | M15 | Sonnet | D14 | RT-L10 |
| RT-L12 | Recordatorios y renovaciones: barrido en el worker, eventos, tareas | `src/application/rentas/vencimientos.ts` | M15c | Sonnet | D12 | RT-L4, `OBX`, RS-L10 (ejecutor) |
| RT-L13 | Depósito en garantía e inspecciones (esquema + casos de uso + UI) | esquema y UI | M15d | Sonnet | D12 | RT-L8 |
| RT-L14 | Estado de cuenta del inquilino en PDF | `src/infrastructure/pdf/estado-renta.tsx` | M15 | Haiku | D14 | CP-L2, RT-L6 |
| RT-L15 | Negocio de renta ganado → contrato en borrador (enmienda al cierre) | `pipeline/cierre.ts` (con M03), caso de uso | M03 + M15 | Sonnet | D12 + Codex | RT-L3 |
| RT-L16 | Renta vacacional: calendario + iCal (opcional) | `rentas/_vacacional.tsx`, `ical` | M15e | Sonnet | Codex | RT-L11 |

## 8. No verificado
- Que `btree_gist` (y por tanto la exclusión de solapes) esté disponible en la instancia PostgreSQL/Supabase local. No consulté la base.
- El modelo de negocio de rentas de Quisqueya (¿propiedades propias o de terceros?, ¿qué comisión de administración?, ¿renta larga, vacacional o ambas?): no está documentado en el repositorio.
- Tratamiento de ITBIS y comprobante fiscal del alquiler en RD (D21 catálogo lo dejó sin investigar).
- Reglas legales de depósitos, aumentos de renta y desalojo en RD (no investigadas).
- El código de MicroRealEstate (solo leí LICENSE, README y feed de commits).
- Tamaño y complejidad real de los componentes de UI de OpenProperty (listé las rutas desde el árbol del commit; no medí líneas ni dependencias de cada archivo).
- Estado de `react-calendar-timeline` con React 19 en producción (versión beta).
