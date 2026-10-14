# Expediente de evolución · Comisiones (G3)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21 + D03 + D05 (subagente Sonnet), solo documentos. **No aprueba su propio trabajo**: revisión independiente pendiente (D03/D11/D12/D14 y otro proveedor, decisión #48).
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC con LICENSE leído y cabecera de procedencia; AGPL/GPL solo como servicio aparte o referencia; sin licencia, solo ideas. Nada se incrusta: todo se ve en nuestra interfaz y se comunica por puertos de `src/application/**` y eventos del outbox.
> Fuentes leídas: `D21-catalogo-crm-inmobiliario-y-contabilidad-rd-2026-10-14.md` (A8, B.2, B.4), `M22-cobros.md` y `D12-D14-revision-M22-2026-10-14.md`, `PLAN-INTEGRAL-2026-10-14.md` §3, y el código citado abajo. Fecha de verificación OSS: 2026-10-14 (API de GitHub, registro npm y `LICENSE` raw).
> Hermanos: `G3-cobros.md` (origen del devengo), `G3-brokers.md` (perfil y esquema), `G3-metas.md`, `G3-reportes.md`, `G3-inicio.md`.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia (archivo:línea) |
|---|---|---|
| Funciones | 2 | Aprobar → pagar → anular y editar reparto: `src/domain/comision-estado.ts:21-26`; `PATCH /api/comisiones/[id]`; CSV `GET /api/comisiones/export`. La comisión nace **al cerrar** el negocio y no se devenga por cobro (`src/application/pipeline/cierre.ts:176-199`). Pagar solo fija `paid_at` (`casos-de-uso.ts:55`): no hay medio, referencia, retención ni documento |
| Datos reales y reglas de negocio | 2 | Una fila por negocio (`commissions_deal_unq`, `schema.ts:949`). Reparto fijo 50/50 al cierre (`cierre.ts:176-181`, `domain/cierre-negocio.ts:28-29`); sin esquema por proyecto/nivel/tramo, sin multi-broker, sin reversa. Cálculo en `Number` con `Math.round` (`cierre-negocio.ts:66-71`) |
| Diseño y componentes | 3 | `DataTable` + `Insignia` + `Metric` reales (`comisiones/vista.tsx:1-14`); estados con tonos. Faltan detalle de comisión, línea de tiempo y estado de cuenta |
| Experiencia de uso | 2 | Anular usa `confirm()` (`vista.tsx:131`), editar reparto usa `prompt()` (`:139`) y los errores `alert()` (`:116,124,143`): sin diálogo accesible ni motivo; sin móvil pensado para pagos |
| Calidad (pruebas, seis estados, accesibilidad) | 3 | `casos-de-uso.test.ts` (347 líneas), `domain/comision-estado.test.ts`, `lecturas.db.test.ts`. Sin `error.tsx`/`loading.tsx` de módulo; `page.tsx` y `_consulta.ts` consultan BD sin pasar por `application` |

Escala: 0 ausente · 1 maqueta · 2 básico (CRUD) · 3 completo · 4 avanzado · 5 referente. **Objetivo: 4** (devengo por cobro, esquemas, splits, retenciones, reversa y estado de cuenta del broker).

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **KPI de dinero mezclando monedas.** `comisiones/page.tsx:46-50` suma `total_commission_cents` de todas las filas sin separar USD y DOP; el KPI se pinta con una sola moneda. Un negocio en DOP (`deals.currency` admite cualquier texto, `schema.ts:689`, sin CHECK) infla o desfigura el total de pendientes/pagadas.
2. **Consulta sin límite.** `_consulta.ts:145-150` trae **todas** las propiedades principales de la base para pintar el proyecto de cada fila (no filtra por los negocios visibles) y `consultarFilas` no pagina. Con miles de negocios la pantalla se degrada; además la consulta salta la capa `application` (`puertos.ts` ya lo anota para «R4.3»).
3. **Datos de la agencia viajan al navegador del broker.** `consultarFilas` incluye `agencyShareBasisPoints` y `agencyAmountCents` (`_consulta.ts:127-129`) y `page.tsx` entrega `filas` completas al componente cliente: aunque `FilaComisionVista` no los declara, el payload RSC los serializa. El broker (`commissions:view:own`, `db/seed.sql:91`) ve en red el margen de la agencia. **Pregunta para Wilber** (decisión #47 (2) deja «la comisión de terceros solo admin»): ¿el broker puede ver total de comisión y parte de agencia? Hasta que responda, DTO por rol (como `stripRestrictedPrices`, `domain/rbac.ts:142`).
4. **El asistente ve todas las comisiones** (`db/seed.sql:64`, `('commissions','view','all')`). M22 (S-22-02) y M03 le niegan datos financieros finos; la matriz debe resolverse en una sola tabla (D12, B-05 de la revisión de M22).
5. **Aprobación sin doble control.** Un solo administrador aprueba y paga (`editarComision`, `casos-de-uso.ts:44-55`); no hay regla «quien aprueba ≠ quien cerró el negocio ≠ quien paga» (A19.2). Si el administrador es también quien cerró, se autoaprueba.
6. **Pagar antes de cobrar.** Hoy la comisión de un negocio con plan de pagos se puede pasar a `paid` aunque el comprador no haya pagado (no existe el vínculo cobro→comisión). Es el riesgo financiero mayor del negocio (D21 A.3 #5).
7. **Redondeo y tipos.** `calcularComision` multiplica en `Number` (`cierre-negocio.ts:66-71`): seguro hoy (< 2^53) pero M22 ya impone `BigInt` para conversiones; hay que compartir un solo módulo de dinero entre Cobros y Comisiones o aparecerán dos redondeos.
8. **Sin reversa.** `void` es terminal y solo cubre comisiones nunca pagadas (`comision-estado.ts:21-26`); si el comprador rescinde después de pagar la comisión al broker no hay forma de registrar la deuda ni compensarla.
9. **Fiscal ausente.** No hay retención de ISR/ITBIS ni documento del broker (E31/E41), requisitos ESENCIALES de D21 A8.4/A8.5. Las reglas son de confianza media (secundarias) y deben confirmarse con el contador antes de calcular dinero real.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| COM-01 | **Devengo por cobro**: cada `PagoRegistrado` libera comisión proporcional (o por umbral/hitos según el esquema) con regla de redondeo acumulado; negocios sin plan de pagos conservan el flujo actual | ESENCIAL | A8.2 | No existe |
| COM-02 | **Esquemas versionados** por proyecto / nivel del broker / tramo de ventas / vigencia (reparto agencia–broker y % total); snapshot en la comisión al cerrar | ESENCIAL | A8.1 | Fijo 50/50 |
| COM-03 | **Splits multi-broker y co-broking**: participantes (listing, selling, referido, externo) con puntos básicos que suman 10 000 | ESENCIAL | A8.1, A8.6 | No existe |
| COM-04 | **Reversa (clawback)** ligada a `PagoAnulado` y a futura rescisión; deuda del broker como saldo a compensar | IMPORTANTE | A8.3 | No existe |
| COM-05 | **Retenciones y documento fiscal** del broker: ISR 10 %, ITBIS 100 %/30 %/dispensa NG 02-2026, E41 vs E31 vía `FacturacionPort`; reglas versionadas, aprobadas por el contador | ESENCIAL | A8.4, A8.5 | No existe |
| COM-06 | **Pago real al broker**: medio, referencia, fecha, comprobante, lote de pago (archivo bancario) y calendario | IMPORTANTE/DESEABLE | A8.7 | Solo `paid_at` |
| COM-07 | **Aprobación con dos personas** (maker–checker) para aprobar, pagar, anular y editar reparto; motivo y caducidad de 7 días (patrón #47) | ESENCIAL | A19.2 | No existe |
| COM-08 | **Estado de cuenta del broker** (devengado, retenido, pagado, pendiente de cobro del cliente, a compensar) en pantalla, CSV y PDF; el broker ve solo el suyo | IMPORTANTE | A8.6 | No existe |
| COM-09 | **Detalle de comisión** (hoja lateral): línea de tiempo (cierre, devengos, aprobaciones, pagos, reversas), documentos y auditoría | IMPORTANTE | — | No existe |
| COM-10 | Calculadora y simulador de comisión (admin/broker): «¿cuánto ganaría si vendo X?» con el esquema vigente | DESEABLE | A10.4 | No existe |
| COM-11 | Monedas separadas en toda cifra (USD y DOP nunca se suman; equivalente solo con tasa congelada) | ESENCIAL | A7.5 | Mezcla |
| COM-12 | Exportes para el contador: libro de comisiones y datos para 606/IR-17 (según decisión del contador) | IMPORTANTE | A20.4, A13.5 | CSV básico |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta que aporta | Modo | Encaje con nuestro stack | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **dinero.js** | `dinerojs/dinero.js`, npm `2.0.2` (gitHead `cc7df3e6d986`, publicado 2026-03-13, push 2026-10-13) | MIT (SPDX en API; `engines node>=20`) | TypeScript | Subruta `dinero.js/bigint` (existe en `exports`); función **`allocate(dinero, ratios)`** (reparto por razones sin perder centavos) para splits y cuotas, y `convert` con tasas. Responde a COM-02, COM-03, COM-11 | APP detrás de `src/domain/dinero.ts` (envoltura); respaldo: PORT del algoritmo | Total: TS puro, sin dependencias; usa BigInt | S (≈1 lote). **No verificado**: que `convert` + redondeo `halfUp` cubra los vectores de M22 CA-07 (se prueba en el primer lote; si no, módulo propio y dinero.js queda como oráculo de pruebas) |
| **GoRules Zen** (motor de decisiones) | `gorules/zen`, npm `@gorules/zen-engine@2.1.7` (gitHead `c8a7d89a6b05`, 2026-10-13) | MIT | Rust + binding Node (binario `win32-x64-msvc` y `linux-x64-gnu` en optionalDependencies) | `ZenEngine.evaluate()` sobre un archivo **JDM** (tabla de decisión) para esquemas por tramos y para la matriz de retenciones. Responde a COM-02 y COM-05 | APP (servidor) detrás de `ReglasPort` | Medio: requiere `serverExternalPackages` en Next 15 y fijar binarios por plataforma | M. **Riesgo**: dependencia nativa; si las reglas caben en una tabla TS versionada en BD, empezar sin Zen y adoptar cuando el contador pida editar reglas |
| **@gorules/jdm-editor** | npm `1.52.0` (2026-05-13) | MIT | React + **antd + monaco + reactflow** | Editor visual de JDM | **RECHAZADO** para la UI | Choca con shadcn/Tailwind v4 y pesa mucho; las reglas se versionan como JSON en BD y se editan con formularios propios | — |
| **pgledger** | `pgr0ss/pgledger` (push 2026-10-14, 495 estrellas) | MIT | SQL puro (PostgreSQL; documentado con PG 18 por defecto) | Archivo `pgledger.sql`: cuentas, transferencias, saldos versionados y vistas; modelaría «comisión devengada / retenida / pagada» como cuentas del broker con inmutabilidad | PORT **solo como PoC** en fase 2 | PostgreSQL local es 15: **no verificado** que corra; usa funciones ULID vendidas. Útil si el contador pide libro mayor | M, diferido |
| **Formance Ledger** | `formancehq/ledger` (MIT, push 2026-10-14) | MIT (LICENSE leído) | Go + PostgreSQL | Libro mayor programable | **RECHAZADO** | Servicio aparte en Go; duplica la contabilidad que M22/ERPNext cubren; no aporta a un subauxiliar | — |
| **ERPNext** (Accounts Payable / Purchase Invoice con Withholding) | `frappe/erpnext` | GPLv3 | Python | Solo **referencia de ideas** (retenciones, comprobantes de compra) | REF | Servicio condicionado a decisión del contador (PLAN §3) | — |
| **@react-pdf/renderer** | npm `4.9.0` (gitHead `2c0b6d4a5d9d`, 2026-08-27) | MIT | React 19 admitido en `peerDependencies` | PDF servidor del **estado de cuenta del broker** y del recibo de pago de comisión. Responde a COM-08 | APP | Total (ya previsto para cotizaciones). Registrar fuentes OFL del diseño (Hanken Grotesk, Atkinson) | M |
| **json-rules-engine** | npm `7.3.1` (2025-02-20) | ISC | JS puro | Alternativa ligera a Zen para reglas JSON | REF/alternativa | Sin binarios; sin editor | S |
| **nuqs** | `47ng/nuqs`, npm `2.10.2` (gitHead `07afd0f21219`, 2026-10-08) | MIT | Next 14.2+ / React 19 | Filtros de la tabla (`broker`, `periodo`, `estado`) en la URL sin recargar toda la página | APP | Total | S |

Por cada proyecto, qué adaptamos y qué no:
- **dinero.js**: se adopta `allocate`/`convert` bajo una sola envoltura; no se expone `Dinero` a las pantallas (siguen siendo centavos enteros). Riesgo: mantenimiento bajo en la línea 2.x (stable 2.0.2, 7 meses).
- **GoRules Zen**: se usa solo el motor headless con JDM versionado en BD o en el repositorio; no se adopta el editor. Riesgo: binario nativo; mitigación: `ReglasPort` con doble en TS y la misma suite de contrato.
- **Lo que no existe**: ningún proyecto abierto encontrado implementa esquemas de comisión inmobiliarios por tramos con cap (búsqueda 14-oct); el motor es **código propio** sobre estas piezas.

## 5. Diseño y componentes a elevar
| Patrón | Componente concreto | Dónde |
|---|---|---|
| Reemplazar `confirm`/`prompt`/`alert` | `Dialog` y `Drawer` de `src/components/ui` (ya instalados) con motivo obligatorio y foco devuelto; `sonner` para resultados | Acciones de aprobar/pagar/anular/editar reparto |
| Detalle de comisión | Hoja lateral `Sheet` con **línea de tiempo** (cierre → devengos → aprobación → pago → reversas) | `/comisiones?comision=ID` |
| KPI por moneda | `Metric` por moneda (USD y DOP en tarjetas separadas) + mini-barras Recharts (`ChartCard`) para devengado vs pagado | Cabecera de `/comisiones` |
| Tabla | `DataTable` actual con columnas de estado de devengo, retenciones y documento; filtros en URL con `nuqs`; paginación en servidor | `/comisiones` |
| Estado de cuenta del broker | Pestaña «Mi estado de cuenta» + PDF `@react-pdf/renderer` | Vista de broker (alcance `own`) |
| Esquemas | Editor de esquema con vista previa en vivo («un negocio de US$250 000 reparte…») y comparación de versiones; **sin** editor JDM | Configuración › Comisiones |
| Seis estados | `error.tsx` y `loading.tsx` del módulo; vacío distingue «sin comisiones aún» de «sin resultados con estos filtros» | Todo el módulo |

## 6. Comunicación con el resto (centralización)
**Consume** (outbox → consumidor interno idempotente por `event_id`, registro de consumidores en `src/application/compartido/eventos-internos.ts`, ficha nueva):
| Evento | Origen | Efecto en Comisiones |
|---|---|---|
| `NegocioCambioEtapa` (cierre ganado) | Negocios (M03) | Crea la comisión con el esquema vigente resuelto y el snapshot (sustituye al paso 6 de `cierre.ts` solo cuando exista el esquema; hasta entonces sigue la ruta actual) |
| `PagoRegistrado` | Cobros (M22) | Crea el **devengo** (`commission_accruals`) con clave única por `payment_id` |
| `PagoAnulado` | Cobros (M22) | Reversa del devengo; si ya se pagó al broker, crea saldo a compensar |
| `ContratoRescindido` | Contratos (futuro, A6.6) | Reversa total |
| `BrokerDesactivado` | Brokers | Congela nuevos devengos y deja pagos pendientes para revisión |

**Emite** (requiere ampliar `TIPOS_EVENTO_CRM` y el CHECK del outbox; **el worker debe reclamar solo tipos con consumidor**, lote en curso 14-oct): `ComisionDevengada{id}`, `ComisionAprobada{id}`, `ComisionPagada{id}` (payout), `ComisionRevertida{id}`. Payload mínimo `{id}` más `commissionId`, sin montos ni nombres.
| Consumidor | Qué hace |
|---|---|
| `FacturacionPort` (I03) | `ComisionPagada` → E41 (broker sin comprobante) o recepción/registro del E31 del broker |
| Metas (M08) | `ComisionDevengada`/`PagoRegistrado` alimentan «cobrado» (no solo «cerrado») |
| Inicio y Reportes | Alimentan «comisiones por aprobar», «devengado del mes», cartera de comisiones |
| Comunicaciones (M11) | Aviso al broker (plantilla) cuando se aprueba o se paga |
| Contabilidad (`ContabilidadPort`, diferido) | Asiento de comisión devengada/pagada |

**Puertos nuevos:** `ReglasPort` (esquemas y retenciones, doble en TS), `DineroPort` no (es dominio puro), `GeneradorEstadoDeCuentaPdf` (compartido con Cobros), `FacturacionPort` (existente en I03). **Datos que comparte:** `payments`/`payment_allocations` (Cobros), `unit_sales`, `deals.commission_basis_points`, `broker_profiles.level`, `projects.broker_id`.
**Datos nuevos (todos con `.enableRLS()`, FK `RESTRICT`, bigint centavos, sin DELETE):** `commission_schemes` + `commission_scheme_tiers` (versionadas), `commission_participants`, `commission_accruals` (UNIQUE `payment_id`, `commission_id`), `commission_payouts` + `commission_payout_lines` (retenciones), `commission_approvals` (maker–checker), `tax_rule_versions`. Migración aditiva `drizzle/00NN_comisiones_devengo.sql` con ensayo sobre base poblada.

## 7. Lotes asignables
| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| COM-0 | Corregir KPI por moneda y la consulta sin límite; paginación y DTO por rol (sin `agency*` para broker); prueba con filas USD+DOP y centinela de agencia | `src/app/(crm)/comisiones/page.tsx`, `_consulta.ts`, `vista.tsx`, `src/app/(crm)/comisiones/consulta.test.ts` (nuevo) | Ninguna (corrección de hallazgo, no función) | Sonnet | D12 + D14 | — |
| COM-1 | Módulo de dinero con BigInt: `repartir`, `convertir` (medio hacia arriba) con vectores de M22 CA-07; dinero.js como oráculo | `src/domain/dinero.ts`, `src/domain/dinero.test.ts`, `package.json` (solo devDependency de oráculo) | **Ficha nueva `G3-DINERO` o apéndice de M22 (requiere D03)** | Sonnet | D12 | — |
| COM-2 | Capa `application` de consultas de comisiones (mueve `_consulta.ts`), `error.tsx`, `loading.tsx` y diálogos accesibles en lugar de `confirm/prompt/alert` | `src/application/comisiones/consultas.ts`, `consultas.test.ts`, `src/app/(crm)/comisiones/{page,vista,error,loading}.tsx` | M09 (nueva, por escribir) | Haiku | D14 | COM-0 |
| COM-3 | Esquema de datos + migración: esquemas, participantes, devengos, pagos, retenciones, aprobaciones; RLS, seed del esquema «50/50 vigente» y prueba de invariantes (Σ devengos ≤ comisión) | `src/domain/catalogs.ts`, `src/infrastructure/db/schema.ts`, `drizzle/00NN_comisiones_devengo.sql`, `drizzle/meta/*`, `db/seed.sql`, `scripts/seed/catalog.ts`, `src/infrastructure/db/seed-invariantes.test.ts` | M09 READY (D11 revisa) | Sonnet | D11 + D12 | COM-1 |
| COM-4 | Resolución de esquema y cálculo de split (dominio puro): tramos por nivel/venta, vigencia, participantes, redondeo acumulado; sin Zen todavía | `src/domain/comision-esquema.ts`, `src/domain/comision-esquema.test.ts` | M09 READY | Sonnet | D14 | COM-1 |
| COM-5 | Consumidor interno de `PagoRegistrado`/`PagoAnulado`: devengo y reversa idempotentes (clave `payment_id`) + prueba de concurrencia | `src/application/comisiones/devengo.ts`, `devengo.test.ts`, `en-memoria.ts`, `puertos.ts`, `src/infrastructure/db/repos/comisiones.ts`, `scripts/test-db/comisiones.ts` | M09 + **M22 READY** + I00 (eventos) | Sonnet | D11 + D14 | COM-3, COM-4, lote del worker del outbox |
| COM-6 | Maker–checker: solicitudes de aprobación/pago/anulación con motivo, autor distinto y caducidad 7 días | `src/application/comisiones/aprobaciones.ts`, `aprobaciones.test.ts`, `src/app/api/comisiones/[id]/aprobacion/route.ts` | M09 + decisión #47 (extender) | Sonnet | D12 | COM-3 |
| COM-7 | Pago al broker con retenciones: `ReglasPort` con doble TS (tabla `tax_rule_versions`), cálculo de ISR/ITBIS y payout; **reglas de ejemplo marcadas «no vigentes» hasta que el contador las firme** | `src/application/comisiones/pagos.ts`, `pagos.test.ts`, `src/application/compartido/reglas.ts`, `src/domain/retenciones.ts`, `retenciones.test.ts` | M09 + **I03 READY** + decisión del contador | Sonnet | D12 | COM-6 |
| COM-8 | Rutas API (Zod, `requireScope`, filtro `:id`) de payout, esquema y aprobación + candados de `seguridad-rutas-id.test.ts` y `precios-respuestas.test.ts` | `src/app/api/comisiones/**`, `src/application/comisiones/entrada.ts`, `src/infrastructure/seguridad-rutas-id.test.ts`, `src/infrastructure/precios-respuestas.test.ts` | M09 | Haiku | D12 | COM-5, COM-6, COM-7 |
| COM-9 | UI: hoja de detalle con línea de tiempo, tablero «por aprobar / por pagar», formularios de pago y de aprobación | `src/app/(crm)/comisiones/detalle.tsx`, `vista.tsx`, `src/app/(crm)/comisiones/pagos.tsx` | M09 | Haiku | D07 + D14 | COM-8 |
| COM-10 | Estado de cuenta del broker (pantalla, CSV neutralizado, PDF servidor) | `src/app/(crm)/comisiones/estado-de-cuenta.tsx`, `src/infrastructure/pdf/estado-comisiones.tsx`, `src/app/api/comisiones/estado/route.ts` | M09 | Haiku | D12 | COM-8, G3-COBROS L12 (comparte generador PDF) |
| COM-11 | Editor de esquemas con vista previa y simulador | `src/app/(crm)/configuracion/_comisiones.tsx`, `src/app/(crm)/comisiones/simulador.tsx` | M09 | Haiku | D05 | COM-4 |
| COM-12 | Adopción de Zen detrás de `ReglasPort` (misma suite de contrato) — **solo si D03 lo aprueba tras COM-7** | `src/infrastructure/integraciones/reglas/zen.ts`, `src/infrastructure/contenedor/reglas.ts`, `next.config.*` (solo `serverExternalPackages`), pruebas | I05 nueva (`ReglasPort`) | Sonnet | D12 | COM-7 |

Todo lote exige `gitnexus_impact` sobre los símbolos tocados (`calcularComision`, `editarComision`, `TIPOS_EVENTO_CRM`, `PERMISSION_RESOURCES`) y `gitnexus_detect_changes` antes del commit del orquestador. Las pruebas de dinero corren en `npm run test:db` con dos conexiones.

## 8. No verificado
- Que `dinero.js/bigint` cubra el redondeo medio-hacia-arriba de M22 CA-07 (se prueba en COM-1).
- Que `pgledger.sql` corra en PostgreSQL 15 (documentado con PG 18).
- Reglas fiscales (ISR 10 %, retención de ITBIS 100 %/30 %, dispensa NG 02-2026, ITBIS del corretaje): son de fuentes secundarias y de confianza media (D21 B.2); **ningún porcentaje debe ir a producción sin firma del contador**. Retención a brokers **no residentes** (diáspora): no investigada.
- Si la comisión sobre venta de inmueble causa ITBIS («no sujeta» para la venta; pregunta abierta para el corretaje, D21 B.2).
- Política comercial: ¿devengo proporcional, por umbral o por hitos? ¿tramos por nivel (los umbrales de `BROKER_LEVEL_THRESHOLDS` son provisionales salvo Senior = US$500 000, `cierre-negocio.ts:104-117` (constante `BROKER_LEVEL_THRESHOLDS`))? Decisión de Wilber; por defecto proporcional al cobro.
- No se midió el rendimiento de `consultarFilas` con volumen real ni se ejecutó la suite (solo lectura).
- Trabajo sin commit en el árbol: las vistas y puertos de Academy, no los de Comisiones; el estado de `develop` se tomó tal como estaba el 14-oct.
