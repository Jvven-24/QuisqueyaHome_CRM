# Expediente de evolución · Cobros y estado de cuenta (G3)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21 + D03 + D05 (subagente Sonnet), solo documentos. **No aprueba su propio trabajo**; revisión independiente pendiente (otro proveedor, decisión #48).
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído); AGPL/GPL solo como servicio aparte o referencia. Nada se incrusta; todo por puertos de `src/application/**` y eventos del outbox.
> Fuentes: `spec/modulos/M22-cobros.md` (REVIEW), `reviews/D12-D14-revision-M22-2026-10-14.md` (**NO APTA PARA READY**, B-01…B-09), `D21-catalogo-…-rd-2026-10-14.md` (A7, A13.2, B.1–B.4), `PLAN-INTEGRAL-2026-10-14.md` §1 fila A7. **Este expediente no rehace M22**: la toma como núcleo, ordena lo que debe corregirse y define la capa avanzada que M22 deja fuera.
> Hermanos: `G3-comisiones.md` (consume `PagoRegistrado`), `G3-reportes.md` (cartera y aging), `G3-inicio.md`.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 0 | No existe ruta, caso de uso ni tabla: `src/app/(crm)/cobros/` está vacío, `src/application/cobros/` vacío; `payment_methods` sin uso fuera de `schema.ts:362`; el plan de pago existe solo en el cotizador (`src/domain/confotur.ts:39`, valor por defecto 20/30/50 en `src/app/api/cotizador/confotur/route.ts:18-20`) |
| Datos reales y reglas de negocio | 0 (ficha M22 con diseño sólido en REVIEW) | Ancla correcta: `unit_sales` (`schema.ts:758`). Integridad diseñada en M22 §5 (IR-01…IR-09) pero **ninguna migración existe** (último: `drizzle/0005_identidad_venta_durable.sql`) |
| Diseño y componentes | 0 (wireframes en M22 §3) | Reutilizará `Card`, `Tabs`, `Drawer`, `ChartCard`, `DataTable` ya instalados |
| Experiencia de uso | 0 | — |
| Calidad | 0 (28 criterios de aceptación diseñados) | M22 §8 CA-01…CA-28; la revisión D12/D14 exige cerrar nueve bloqueantes antes de READY |

**Objetivo: 4** — plan de pagos persistido, imputación, mora, multimoneda con tasa congelada, estado de cuenta (pantalla/CSV/PDF), aging de cartera, recordatorios y vínculo con Comisiones, Reportes e Inicio.

## 2. Puntos críticos (arreglar antes de evolucionar)
Los nueve bloqueantes de `D12-D14-revision-M22-2026-10-14.md` siguen **abiertos**. Los que más afectan al orden de construcción:
1. **B-01 · El worker del outbox manda a la cola muerta los eventos de pago** (`worker.ts:38-39,55-58`; `repositorio.ts:28` reclama sin filtrar por tipo; existe un ejecutor real `npm run outbox:worker` → `scripts/outbox-worker.mjs`). Hay un lote en curso (14-oct) que hace que el worker reclame solo tipos con consumidor; **ningún lote de Cobros emite `PagoRegistrado` antes de que ese filtro esté en `develop`**.
2. **B-02 · Los eventos no tienen destino** (la tabla `outbox`, `schema.ts:1153-1169`, no tiene columna de destino/agregado) y I00 sigue DRAFT: hay que declarar el destino por evento y exigir I00 en READY.
3. **B-03 · Idempotencia con ventana de carrera**: el algoritmo de `registrarPago` busca la clave **antes** de bloquear el plan (M22:148-151). Repetir la búsqueda después del bloqueo y tratar el UNIQUE como replay.
4. **B-04/B-05 · Roles**: el asistente registra pagos con efecto directo y ve saldos de todas las ventas, contra #47 (1) y M03 S-309. Decisión de Wilber antes de READY (por defecto: el asistente registra como **propuesta** que aprueba un admin, o ve solo sus negocios).
5. **B-07 · El «10/40/50» no existe en el código**: el cotizador usa 20/30/50 (`route.ts:18-20`, `confotur.ts:18-30`). Un comprador vería una cotización y un plan de pagos distintos. Decisión comercial de Wilber; hasta entonces la plantilla sembrada debe ser la del cotizador.
6. **Reportes y Metas ya excluyen DOP en silencio** (`repos/reportes.ts:91,114,125,148,158`; `repos/dashboard.ts:117`): cuando existan planes en DOP, la cartera cobrada no aparecerá en ningún KPI hasta que se separen monedas.
7. **Dinero compartido**: M22 exige BigInt (centavos × micros supera 2^53); el módulo `src/domain/dinero.ts` debe existir **antes** de L1 y compartirse con Comisiones (ver `G3-comisiones.md`, lote COM-1).
8. **Sin `src/app/(crm)/cobros/` ni entrada de navegación** (`modulos.ts`): el módulo nace con los seis estados desde el primer lote.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| COB-01 | Plantillas de plan de pagos versionadas por proyecto y cronograma por venta (separación, cuotas durante construcción, contra entrega) | ESENCIAL | A4.1, A7.1 | Núcleo M22 L1–L3 |
| COB-02 | Registro de pago con imputación automática a las cuotas más antiguas, idempotencia y barrera en BD | ESENCIAL | A7.2 | M22 L4–L5 |
| COB-03 | Multimoneda USD/DOP con tasa congelada, diferencial cambiario informativo | ESENCIAL | A7.5, A4.3 | M22 §4 |
| COB-04 | Mora derivada en lectura + `CuotaVencida` por episodio, tramos 1–30/31–60/61–90/>90 | ESENCIAL | A7.4, A13.2 | M22 L7–L8 |
| COB-05 | Estado de cuenta por unidad y por comprador (pantalla, CSV, PDF servidor) | ESENCIAL | A7.3 | M22 L12 |
| COB-06 | Anulación con doble aprobación | ESENCIAL | A19.2 | M22 L6 |
| COB-07 | **Cartera con aging y proyección de flujo de caja** (cuotas por vencer en 30/60/90 días, USD y DOP por separado) | ESENCIAL | A13.2 | Fuera de M22 (alimenta Reportes) |
| COB-08 | **Cartas de cobro** (por vencer / vencida) como PDF servidor y mensaje por `MensajeriaPort`; plantilla con variables | ESENCIAL | A7.4 | Fuera de M22 (M11 consume `CuotaVencida`) |
| COB-09 | **Cuotas ligadas a hitos de obra**: la cuota se «activa» al publicarse una fase de `construction_phases` | IMPORTANTE | A7.6 | Fuera de M22 |
| COB-10 | **Recargos por mora** (política configurable) y reestructuración de plan con aprobación | DESEABLE | A7.8 | Fuera de M22 (S-22-10 = ninguno) |
| COB-11 | **Conciliación bancaria**: importar extracto CSV y proponer coincidencias con pagos registrados | IMPORTANTE | A7.7, A5.2 | Fuera de M22 |
| COB-12 | **Imputación manual** a una cuota concreta con motivo y aprobación | DESEABLE | A7.2 | Fuera de M22 (S-22-12) |
| COB-13 | Recibo interno numerado imprimible (no fiscal) y enlace al comprobante e-CF cuando I03 exista | IMPORTANTE | A5.3 | M22 S-22-01 |
| COB-14 | Enlace «Ver cobros» desde la ficha de Negocios y desde Contactos; vista del comprador para el Client Room (futuro) | IMPORTANTE | A9.2 | Pendiente |
| COB-15 | Cuentas segregadas por fideicomiso/proyecto y comprobante de depósito en la fiduciaria | ESENCIAL (si hay fiduciaria) | A6.4, A20.5 | Fuera de M22 |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **@react-pdf/renderer** | `diegomura/react-pdf`, npm `4.9.0` (gitHead `2c0b6d4a5d9d`, 2026-08-27; push 2026-10-07; 16 832 estrellas) | MIT (API y npm) | React; `peerDependencies` incluye React 19 | `renderToBuffer` en una ruta de servidor para el estado de cuenta, la carta de cobro y el recibo (COB-05/08/13) | APP | Total; fuentes OFL de `docs/DESIGN.md` con `Font.register`; el PDF no ejecuta JavaScript del cliente | M |
| **dinero.js** | npm `2.0.2` (`dinero.js/bigint`, gitHead `cc7df3e6d986`) | MIT | TypeScript | `allocate()` para repartir el total en cuotas con residuo en la última (M22 CA-01) y `convert()`; oráculo de pruebas del módulo propio | APP/oráculo | Total; **no verificado** que cubra el redondeo de CA-07 | S |
| **big.js** | npm `7.0.1` (gitHead `e19cc83cb965`, 2025-04-21) | MIT | JS | Alternativa mínima para aritmética decimal | REF | `BigInt` nativo ya basta; no se añade dependencia | — |
| **pgledger** | `pgr0ss/pgledger` (MIT, push 2026-10-14) | MIT | SQL | Doble partida inmutable en PostgreSQL para el futuro libro de cuentas por cobrar | PORT/PoC diferido | Solo si el contador pide libro mayor (PLAN §3); **no verificado** en PG 15 | M |
| **nuqs** | npm `2.10.2` (2026-10-08) | MIT | Next 14.2+ | Filtros de cartera en la URL | APP | Total | S |
| **date-fns + @date-fns/tz** | npm `4.4.0` / `1.5.0` | MIT | TS | Cálculo de vencimientos y días de atraso en `America/Santo_Domingo` (`TZDate`) sin depender de la zona del servidor | APP | Total; ya existe `src/domain/zona-horaria.ts` (se revisa antes de añadir dependencia) | S |
| **Papaparse** | npm `5.7.0` (2026-08-24) | MIT | JS | Lectura de extracto bancario CSV (COB-11) | APP | Total | S |
| **ERPNext** (Accounts Receivable / Payment Entry) | `frappe/erpnext` | GPLv3 | Python | **Solo referencia** del informe de antigüedad de saldos y de la imputación de pagos | REF | Servicio opcional (decisión del contador) | — |
| Kill Bill, Lago, Invoice Ninja | — | Apache-2.0 / AGPL / Elastic 2.0 | — | Facturación por suscripción | **RECHAZADOS** | No modelan preventa contra avance de obra (PLAN §3) | — |

No existe un sistema abierto que modele plan de pagos de preventa dominicana contra avance de obra: **el motor de cuotas es código propio** (M22), apoyado en `allocate` y en la envoltura de dinero.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Cartera con antigüedad | Barra apilada Recharts por tramo (`ChartCard` + `MetricChart`) y tabla `DataTable` agrupada por comprador | `/cobros` › Vencidas |
| Cronograma | Lista de cuotas con barra de avance (tarjetas en móvil, tabla en 768+) | `/cobros/planes/[id]` |
| Registro de pago | `Dialog` con vista previa de imputación («se aplicará a las cuotas 2 y 3») y confirmación explícita | Acción primaria |
| Estado de cuenta | Hoja imprimible + PDF `@react-pdf/renderer` con pie «Documento informativo; no es comprobante fiscal» | Plan y comprador |
| Cobro del día | Widget «Cobros de hoy / vencidos» para Inicio (registro de widgets de `G3-inicio.md`) | `/inicio` |
| Seis estados | Todos los previstos en M22 §3 (carga, vacío, error, sin conexión, éxito, permiso) más conflicto 409 | Todo el módulo |

## 6. Comunicación con el resto (centralización)
**Emite** (M22 §6; destino por evento a declarar según B-02): `PagoRegistrado{id,planId}`, `PagoAnulado{id,planId}`, `CuotaVencida{id,planId}`. Propuestos para la capa avanzada: `PlanCreado{id}`, `HitoDeObraCumplido{faseId}` (sale de Avances), `CartaDeCobroEmitida{id}`.
| Consumidor | Qué hace |
|---|---|
| Comisiones (M09/M10) | Devengo y reversa por cobro (`G3-comisiones.md` COM-5) |
| Facturación (I03) | Comprobante fiscal / nota de crédito por pago |
| Comunicaciones (M11) | Recordatorio de `CuotaVencida` por plantilla |
| Metas (M08) | Meta de «cobrado» además de «cerrado» |
| Inicio / Reportes | Cartera por cobrar, cobrado del período, aging, flujo de caja proyectado |
| Contabilidad (diferido) | Subauxiliar → libro |
| Avances (construction_phases) | Publicar una fase dispara `HitoDeObraCumplido` (COB-09) |

**Consume:** `NegocioCambioEtapa` (cierre ganado con venta única) para sugerir «Nuevo plan» en la ficha del negocio; tasas desde `exchange_rates`; fase publicada desde Avances; `PagoRegistrado` solo internamente para recalcular proyecciones.
**Puertos:** `UnidadDeTrabajo<ReposCobros>`, `OutboxFinanzas`, `AlmacenamientoArchivos` (comprobantes), `Reloj`, `GeneradorEstadoDeCuentaPdf` (compartido con Comisiones), `TipoDeCambioPort` (BCRD, diferido). **Datos:** `unit_sales`, `deals.amount_cents`, `projects`, `contacts`.

## 7. Lotes asignables
Los lotes L1–L13 de M22 §9 siguen vigentes, **con las correcciones m-05…m-08 de la revisión** (partir L1 y L5, concretar L9/L11/L12/L13). Esta tabla los ordena, añade el prerrequisito de dinero y los lotes avanzados.
| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| COB-0 | Cerrar B-01…B-09 en la ficha (destino de eventos, carrera de idempotencia, roles, CA verificables) y pasar M22 a READY | `.viltrum/vre-os/spec/modulos/M22-cobros.md`, `…/integraciones/I00-outbox-base.md` | M22 (REVIEW → READY, D02/D03/D11/D12/D14 + decisiones de Wilber B-04/B-05/B-07) | Sonnet (D01+D03) | otro proveedor | decisiones de Wilber |
| COB-1 | `src/domain/dinero.ts` con BigInt y vectores | `src/domain/dinero.ts`, `src/domain/dinero.test.ts` | Apéndice de M22 | Sonnet | D12 | — (es `COM-1`) |
| COB-2a | Dominio: cronograma y conversión (M22 L1a) | `src/domain/cobros.ts`, `src/domain/cobros.test.ts` | M22 READY | Sonnet | D14 | COB-1 |
| COB-2b | Dominio: imputación, diferencial y mora (M22 L1b) | `src/domain/cobros-imputacion.ts`, `…test.ts` | M22 READY | Sonnet | D14 | COB-2a |
| COB-3 | Esquema, migración 0006, RLS, seed de plantilla (M22 L2); la plantilla global = política comercial firmada | `src/domain/catalogs.ts`, `src/infrastructure/db/schema.ts`, `drizzle/0006_cobros_plan_de_pagos.sql`, `drizzle/meta/*`, `db/seed.sql`, `scripts/seed/catalog.ts`, `src/infrastructure/db/seed-invariantes.test.ts` | M22 READY | Sonnet | D11 + D12 | COB-2a |
| COB-4 | Puertos, dobles, plantillas, tipos de cambio y `crearPlanDePagos` (M22 L3) | `src/application/cobros/{puertos,casos-de-uso-plan,en-memoria}.ts`, `casos-de-uso-plan.test.ts` | M22 READY | Sonnet | D14 | COB-3 |
| COB-5 | `registrarPago` con la corrección B-03 (M22 L4) | `src/application/cobros/casos-de-uso-pago.ts`, `…test.ts`, `en-memoria.ts` | M22 READY | Sonnet | D12 | COB-4 + filtro del worker en `develop` |
| COB-6a | Repositorio Drizzle de escritura (M22 L5a) | `src/infrastructure/db/repos/cobros.ts` | M22 READY | Sonnet | D11 | COB-5 |
| COB-6b | Pruebas de concurrencia en `test:db` con mutación del bloqueo (M22 L5b, CA-09/10/13) | `src/infrastructure/db/cobros.db.test.ts`, `scripts/test-db/cobros.ts`, `scripts/test-db/run.mjs` | M22 READY | Sonnet | D14 (otro proveedor) | COB-6a |
| COB-7 | Anulación con doble aprobación (M22 L6) | `src/application/cobros/casos-de-uso-anulacion.ts`, `…test.ts` | M22 READY | Sonnet | D12 | COB-6a |
| COB-8 | Eventos y vencimientos: tipos de evento, `OutboxFinanzas`, `procesarVencimientos` (M22 L7) | `src/application/compartido/crm.ts`, `src/infrastructure/integraciones/outbox/{worker,repositorio}.ts`, `src/application/cobros/vencimientos.ts`, `…test.ts` | M22 READY + I00 | Sonnet | D12 | lote del worker del outbox |
| COB-9 | Consultas con proyección por rol y aging (M22 L8 + COB-07) | `src/application/cobros/consultas.ts`, `consultas.test.ts`, `dto.ts`, `src/infrastructure/db/repos/cobros-lectura.ts` | M22 READY | Sonnet | D12 | COB-6a |
| COB-10 | Rutas API (M22 L9), archivos concretos: `src/app/api/cobros/{planes,pagos,anulaciones,plantillas,tipos-de-cambio}/**` | `src/app/api/cobros/**`, `src/application/cobros/entrada.ts`, `src/infrastructure/seguridad-rutas-id.test.ts`, `src/infrastructure/precios-respuestas.test.ts` | M22 READY | Haiku | D12 | COB-5, COB-7, COB-9 |
| COB-11 | Pantalla `/cobros` (M22 L10) con navegación | `src/app/(crm)/cobros/{page,vista,loading,error}.tsx`, `src/app/(crm)/modulos.ts` | M22 READY | Haiku | D07 + D14 | COB-10 |
| COB-12 | Pantalla de plan, pago y anulación (M22 L11) | `src/app/(crm)/cobros/planes/[id]/{page,vista,dialogos}.tsx` | M22 READY | Haiku | D07 + D14 | COB-11 |
| COB-13 | Estado de cuenta CSV/PDF servidor (M22 L12) | `src/app/api/cobros/exportacion/estado-de-cuenta/route.ts`, `src/infrastructure/pdf/estado-de-cuenta.tsx` | M22 READY | Haiku | D12 | COB-10 |
| COB-14 | E2E y capturas por rol con mutación del bloqueo (M22 L13) | pruebas E2E en la ruta que fije D14 (hoy no hay runner) | M22 READY | Sonnet | D14 | COB-12 |
| COB-15 | Cartas de cobro: plantilla PDF + consumidor de `CuotaVencida` por `MensajeriaPort` | `src/infrastructure/pdf/carta-de-cobro.tsx`, `src/application/cobros/cartas.ts`, `…test.ts` | **M22b (nueva ficha)** + M11 | Sonnet | D12 | COB-8 |
| COB-16 | Hitos de obra: cuota ligada a `construction_phases` | `src/application/cobros/hitos.ts`, `…test.ts`, `schema.ts` (columna aditiva) | **M22b** + ficha Avances | Sonnet | D11 | COB-9 |
| COB-17 | Conciliación bancaria por CSV | `src/application/cobros/conciliacion.ts`, `…test.ts`, `src/app/(crm)/cobros/conciliacion.tsx` | **M22c (nueva ficha)** | Sonnet | D12 | COB-12 |
| COB-18 | Widget «Cobros» para Inicio y pestaña «Cobranza» de Reportes | `src/app/(crm)/inicio/widgets/cobros.tsx` (ver `G3-inicio.md`), `src/application/reportes/cobranza.ts` | M22 READY + M20/M12 | Haiku | D14 | COB-9 |

Cada lote ≤ 45 min, con prueba. Lo que requiere esquema nuevo lo dice la columna «Ficha»: COB-3 y COB-16 son los únicos que tocan `schema.ts`.

## 8. No verificado
- Volumen real de cuotas, tiempos de respuesta y retención: **UNKNOWN** (M22 §7).
- Que `dinero.js/bigint` reproduzca el redondeo exacto de M22 CA-07.
- Tratamiento fiscal del anticipo de preventa y quién factura qué (contador, D21 B.4 punto 4); grupo DGII del RNC (define 1-nov vs 15-nov de e-CF).
- Si todos los proyectos tienen fiduciaria (cambia COB-15).
- Línea de aprobación del asistente: espera la decisión de Wilber (B-04/B-05).
- No se leyeron las fichas G04, G05, G07, G10 que M22 cita en `depende_de`.
- No se ejecutó ningún comando ni prueba (solo lectura).
