# Expediente de evolución · Reportes (BI, ROI por canal, pronóstico) (G3)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21 + D03 + D05 (subagente Sonnet), solo documentos. **No aprueba su propio trabajo**; revisión independiente pendiente (decisión #48).
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído); AGPL/GPL/BSL solo servicio aparte o referencia. Nada se incrusta; todo por puertos y outbox.
> Fuentes: código citado, `D21-inventario-funcional-crm-2026-10-14.md` (fila reportes), `D21-catalogo-…-rd-2026-10-14.md` (A11, A13), `M22-cobros.md` §7, `MAPA-SISTEMAS-OSS.md` §7 (Superset diferido, Tremor descartado). Hermanos: `G3-inicio.md` (comparte consultas y registro de widgets), `G3-cobros.md`, `G3-comisiones.md`, `G3-metas.md`, `G3-academy.md`, `G3-brokers.md`.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 3 | Nueve pestañas: embudo, canales, tendencia (18 meses), zonas, brokers, velocidad, inventario, comisiones, pronóstico (`application/reportes/puertos.ts`, `reportes/vista.tsx`, `analitica-copy.ts` → `reportTabs`). Filtros de periodo, proyecto y broker. Falta comparativa, cobranza, ROI con gasto real, drill-down, exportes por pestaña |
| Datos reales y reglas de negocio | 3 | Una sola sentencia SQL, una instantánea MVCC, alcance por `visibleRows` y fechas locales (`repos/reportes.ts:19-191`). Pero USD fijo, pronóstico atado a la fecha de alta y gasto de campañas sin fuente de carga (ver §2) |
| Diseño y componentes | 3 | `ChartCard` + `MetricChart` (Recharts), detalle accesible por gráfica (`AnalyticsDetails`), tablas y lista móvil; estilos `analytics-*` propios |
| Experiencia de uso | 2 | Filtros por formulario GET que recarga toda la página (`filtros-vista.tsx`); sin comparar, sin clic para profundizar, sin vistas guardadas; exporta solo el embudo |
| Calidad | 3 | `reportes/consultas.test.ts`, `analitica.test.ts`, `lecturas.db.test.ts`; `error.tsx`/`loading.tsx`; resumen accesible oculto por gráfica |

**Objetivo: 4** — BI comparativo y multimoneda con cobranza, ROI de marketing real, pronóstico con bandas, profundización y exportes auditados, sin sumar dinero de monedas distintas.

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **Todo el dinero es USD y el resto desaparece sin aviso.** Ingresos por canal, tendencia, brokers, comisiones y pronóstico filtran `currency = 'USD'` (`repos/reportes.ts:91,114,125,148,158`; pipeline de Inicio en `dashboard.ts:117`) y la etiqueta es «Importe USD» (`analitica-copy.ts`, `common.amount`). `deals.currency` y `commissions.currency` no tienen CHECK (`schema.ts:689,917`) y Cobros trabajará en DOP: la cartera en pesos no se verá en ningún reporte y nadie lo sabrá.
2. **El ROI por canal no tiene datos de entrada.** La consulta lee `campaign_spend`/`marketing_campaigns` (`reportes.ts:72-80`), pero ningún código de producción escribe esas tablas (solo seed, `scripts/seed/*`); además el gasto solo se atribuye con alcance total y **sin ningún filtro** (`attributableSpend`, `:26`) y `campaign_spend.currency` está limitado a `'USD'` por CHECK (`schema.ts:420`). El inventario D21 lo describía como «sin fuente de campañas»: es más preciso decir que **la lectura existe y no hay forma de cargar el gasto**.
3. **El pronóstico cambia con el filtro de fechas.** `forecast` parte de `period_deals` (`reportes.ts:156-158`), que ya está recortada por **fecha de alta** (`dealPeriod`): al elegir «Este año» desaparecen del pronóstico los negocios abiertos creados antes. Un pronóstico debe ser una foto de la cartera abierta hoy, no del periodo. La etiqueta «Probabilidad» es el cociente ponderado/monto conocido, no un intervalo de confianza.
4. **El inventario también se filtra por fecha de creación de la unidad** (`reportes.ts`, bloque `inventory`, `dateRange(units.created_at)`): con un periodo elegido se esconde stock antiguo; la antigüedad del inventario es una foto «a hoy».
5. **Se calcula todo para ver una pestaña.** Cada visita ejecuta las nueve agregaciones (una sola sentencia de ~170 líneas) y la página bloquea hasta la más lenta; no hay carga por pestaña ni caché (`reportes/page.tsx` espera `consultarReportesBi` completo).
6. **Exportar es casi decorativo.** El único CSV es el embudo, generado en el navegador (`reportes/vista.tsx`, `exportarCsv`), sin auditoría ni neutralización de pestañas sensibles; no hay exporte de canales, brokers, comisiones ni pronóstico.
7. **Filtros destructivos para la lectura.** Aplicar filtros recarga la página completa (`filtros-vista.tsx`, `form method="get"`) y el filtro de proyecto usa solo los 4 proyectos con más demanda (`dashboard.projects`, `DASHBOARD_LIST_LIMIT = 4`, `repos/dashboard.ts:12`) como opciones: un proyecto con pocos leads no se puede elegir (la propia pantalla lo avisa con `projectsPartial`).
8. **Visibilidad de comisiones desde Reportes.** El asistente tiene `reports:view/export:all` (`db/seed.sql:67`) y la pestaña «Comisiones» le muestra importes de broker y agencia por mes (`commissionScope` con alcance total). Debe alinearse con la matriz de roles de Comisiones/Cobros (punto 4 de `G3-comisiones.md`). El broker no tiene `reports` (`db/seed.sql:80-92`) y no puede ver su propio rendimiento fuera de Inicio/Brokers.
9. **Exportación e historial sin auditoría de lectura** (A19.3): cuando existan datos de cobranza y KYC, el reporte debe dejar rastro de quién exportó qué.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| REP-01 | **Comparativa** con el periodo anterior y con el mismo periodo del año anterior en cada serie y KPI | ESENCIAL | A13.1 | No existe |
| REP-02 | **Multimoneda correcta**: USD y DOP en columnas/series separadas; «equivalente en USD» solo con tasa congelada y rotulado | ESENCIAL | A7.5 | USD fijo, DOP oculto |
| REP-03 | **ROI de marketing real**: alta de campañas y gasto mensual (manual o CSV), costo por lead, por reserva y por venta, ROAS, por canal y campaña | ESENCIAL | A11.1 | Lectura sin carga |
| REP-04 | **Cobranza**: cartera por cobrar, antigüedad (1–30/31–60/61–90/>90), mora por proyecto y broker, flujo de caja proyectado 30/60/90 días | ESENCIAL | A13.2 | No existe (depende de M22) |
| REP-05 | **Pronóstico con bandas** (P10/P50/P90) a partir de probabilidades por etapa e historial de conversión, pronóstico de cobros y comparación con la meta | IMPORTANTE | A13.1 | Ponderado simple |
| REP-06 | **Profundizar**: clic en una barra abre la lista filtrada (Negocios, Leads, Comisiones) con los mismos filtros | IMPORTANTE | — | No existe |
| REP-07 | **Exportes del servidor** por pestaña (CSV UTF-8 con BOM y neutralización de fórmulas; PDF resumen) con `audit_log` | ESENCIAL | A19.3 | Solo embudo, cliente |
| REP-08 | **Vistas guardadas** y **reportes programados** por correo con resumen semanal | DESEABLE | A13.1 | No existe |
| REP-09 | **Cohortes**: conversión lead→venta por mes de alta (mapa de calor) | IMPORTANTE | A13.1 | No existe |
| REP-10 | **Envejecimiento de negocios** (tiempo en etapa, estancados) y velocidad por etapa | IMPORTANTE | A2.5 | Solo lead→cierre |
| REP-11 | **Absorción de inventario** por proyecto/fase y cancelaciones/rescisiones | IMPORTANTE | A13.3 | Foto por estado |
| REP-12 | **Productividad y SLA por broker** (primer contacto, actividades, conversión) | IMPORTANTE | A13.4 | Conversión y volumen |
| REP-13 | Pestañas **Formación** (Academy) y **Metas** (cumplimiento, histórico) | IMPORTANTE | A16, A13.4 | No existen |
| REP-14 | **Datos para el contador**: libro de comisiones, retenciones y soporte de 606/607 (según decisión del contador) | IMPORTANTE | A13.5, A20.4 | No existe |
| REP-15 | **Rendimiento**: carga por pestaña, caché por alcance y, solo si el EXPLAIN lo exige, agregados materializados refrescados por el worker | IMPORTANTE | — | Todo junto |
| REP-16 | **«Mi rendimiento»** para el broker (`reports:view:own`) | IMPORTANTE | A10.1 | No existe |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **Recharts** (instalado `^3.8.0`) | `recharts/recharts`, npm `3.10.1` (gitHead `ffb918798051`, push 2026-10-14; 27 627 estrellas) | MIT | React 19 admitido | `Funnel`, `Sankey`, `Treemap`, `RadialBarChart`, `ReferenceLine`/`Area` para bandas P10–P90; `Brush` para rango. Cubre REP-01/05/09 (el mapa de calor se hace con rejilla CSS) | APP (ya en el árbol) | Total, vía `ChartContainer` de shadcn | S–M |
| **shadcn/ui Charts** | `shadcn-ui/ui` (MIT, 125 565 estrellas) | MIT | React 19 + Recharts | `ChartContainer`, `ChartTooltip`, `ChartLegend` ya en `src/components/ui/chart.tsx` | APP (ya en el árbol) | Total | — |
| **nuqs** | npm `2.10.2` (gitHead `07afd0f21219`, 2026-10-08) | MIT | Next 14.2+ | Estado de filtros, pestaña y comparativa en la URL sin recargar la página | APP | Total | S |
| **simple-statistics** | npm `7.12.1` (2026-09-27) | ISC | TS | `quantile`, `linearRegression`, `standardDeviation` para bandas del pronóstico y tendencias | APP | Total, puro | S |
| **date-fns + @date-fns/tz** | npm `4.4.0` / `1.5.0` | MIT | TS | Rangos de periodo y comparativas en `America/Santo_Domingo` | APP | Total (revisar antes `src/domain/zona-horaria.ts`) | S |
| **TanStack Table** | npm `9.3.1` (push 2026-10-12) / última 8.x `8.21.3` | MIT | React ≥18 | Tablas agrupadas y «pivot» para canales×proyecto (REP-06/11) | APP **condicional** | v9 mayor reciente; **API no verificada**; hoy `DataTable` propio basta para tablas planas | M |
| **@react-pdf/renderer** | npm `4.9.0` (gitHead `2c0b6d4a5d9d`) | MIT | React 19 | PDF resumen ejecutivo y reporte programado | APP | Total | M |
| **@react-email/components** | npm `1.0.12` (2026-04-09) | MIT | React 18/19 | Plantilla del correo semanal (REP-08) | APP | Total; envío por `MensajeriaPort` | S |
| **Papaparse** | npm `5.7.0` | MIT | JS | Carga de gasto mensual por CSV (REP-03) | APP | Total | S |
| **Evidence** | `evidence-dev/evidence`, push 2026-10-13 (7 013 estrellas) | MIT | Node + DuckDB, SQL y markdown | BI como código; generaría un sitio aparte de solo lectura | **DIFERIDO** | Duplica reportes y exige otro servicio; no se incrusta | L |
| **Cube Core** | `cube-js/cube`, push 2026-10-14 (21 013 estrellas) | Apache-2.0 por defecto en el repositorio (LICENSE leído; la API reporta NOASSERTION por ser mixto Apache/MIT) | Node + Rust | Capa semántica de métricas | **DIFERIDO** | Útil si las métricas superan ~30 o hay clientes multi-inmobiliaria; hoy basta una consulta tipada | L |
| **Apache Superset** | — | Apache-2.0 | Python | BI pesado | **DIFERIDO** (MAPA §7) | — | — |
| **Tremor** | `@tremor/react 3.18.7`, npm 2025-01-13; repo sin push desde 2025-10-10 | **Apache-2.0** (no MIT) | React 18 | Patrones visuales | **REF** | Peer `react ^18`; no se instala | — |
| **ExcelJS** | npm `4.4.0` (2023-10-19, sin publicaciones recientes) | MIT | JS | Exporte `.xlsx` | **No ahora** | CSV UTF-8 basta para el contador; si se pide xlsx se auditará su estado | — |
| **ERPNext** (informes de cuentas por cobrar y flujo de caja) | `frappe/erpnext` | GPLv3 | Python | **Solo referencia** de definiciones | REF | Decisión del contador | — |

Qué adaptamos: más de lo que ya está instalado (Recharts, shadcn charts) y utilidades pequeñas con licencia permisiva. Qué no: BI externo embebido; los reportes son nuestros y salen de PostgreSQL con alcance por fila.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Comparativa | `ChartCard` con serie actual + línea punteada del periodo anterior y chip de variación | Todas las pestañas |
| Monedas | Selector «USD · DOP · ambas» y totales por moneda; «equivalente» solo con tasa visible | Cabecera de Reportes |
| Profundizar | Barra/segmento clicable → enlace a la lista filtrada; breadcrumb de filtros activos | Embudo, canales, brokers |
| Cobranza | Barras apiladas por tramo de antigüedad + tabla agrupada por comprador/proyecto | Pestaña «Cobranza» |
| Pronóstico | `Area` con banda P10–P90 y línea de meta | Pestaña «Pronóstico» |
| Cohortes | Rejilla CSS con escala de color accesible y texto en celda | Pestaña «Cohortes» |
| Exportar | Menú «Exportar» por pestaña (CSV / PDF) con confirmación de alcance | Cabecera |
| Carga | Suspense por pestaña y esqueleto; las demás pestañas no se consultan hasta abrirse | Todo |
| Seis estados y móvil | Ya existen en `ChartCard`; añadir «datos parciales» (monedas excluidas, sin fuente de gasto) como estado explícito | Todo |

## 6. Comunicación con el resto (centralización)
Reportes es **lectura derivada**: cada módulo publica un puerto de consulta en `application/<modulo>/consultas.ts` y Reportes lo compone; no consulta tablas ajenas por su cuenta (hoy sí lo hace en SQL propio). **Consume:** Cobros (`consultarCartera`, aging), Comisiones (devengado/pagado/retenido), Metas (`metaEfectiva`, histórico), Academy (`cobertura`), Brokers, Leads (SLA, atribución), Negocios (historial de etapas), Propiedades (inventario) y el outbox para refrescar agregados.
**Emite:** `ReporteExportado{id}` (auditoría) y, si se activa REP-08, `ReporteProgramadoGenerado{id}`. **Registra** widgets en Inicio (`G3-inicio.md` INI-01).
| Evento que invalida o actualiza | Efecto |
|---|---|
| `NegocioCambioEtapa`, `LeadCreado` | Refresca embudo y tendencia |
| `PagoRegistrado`, `PagoAnulado`, `CuotaVencida` | Cobranza y flujo de caja |
| `ComisionDevengada/Pagada/Revertida` | Pestaña de comisiones |
| `MetaFijada`, `MetaHito` | Pestaña de metas |
| `ConstanciaAprobada/Revocada` | Formación |

**Datos nuevos (`.enableRLS()`):** `report_exports` (auditoría de quién exportó qué) o uso de `audit_log` con acción `exportar` (añadir a `AUDIT_ACTIONS`); `saved_report_views`; migración que relaja `campaign_spend_currency_check` a USD/DOP. **Puertos:** `ReportesRepositorio` dividido por pestaña, `GeneradorReportePdf` (compartido con Cobros/Comisiones), `Reloj`.

## 7. Lotes asignables
| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| REP-0a | Pronóstico como foto de la cartera abierta (no recortado por fecha de alta) e inventario «a hoy»; prueba que cambia el filtro y el pronóstico no | `src/infrastructure/db/repos/reportes.ts`, `src/application/reportes/consultas.test.ts`, `src/infrastructure/db/lecturas.db.test.ts` | Ninguna (corrección de hallazgo) | Sonnet | D14 | — |
| REP-0b | Multimoneda: series por moneda y aviso de datos excluidos; etiquetas «USD» → moneda; tipos en `puertos.ts` | `src/application/reportes/{puertos,consultas}.ts`, `consultas.test.ts`, `src/infrastructure/db/repos/reportes.ts`, `src/app/(crm)/reportes/vista.tsx`, `src/app/(crm)/_ui/analitica-copy.ts`, `src/lib/formato-analitica.ts` | Ninguna (corrección) | Sonnet | D12 + D14 | G3-COM-1 (`dinero.ts`) para equivalentes |
| REP-1 | Dividir el snapshot por pestaña y cargar bajo demanda (`/reportes/[tab]` o segmento RSC con Suspense) sin cambiar cifras (prueba de paridad) | `src/application/reportes/{puertos,consultas,en-memoria}.ts`, `src/infrastructure/db/repos/reportes/*.ts`, `src/app/(crm)/reportes/{page,vista}.tsx` | **M12-reportes (nueva)** | Sonnet | D14 | REP-0a |
| REP-2 | Filtros en la URL con `nuqs` y todos los proyectos como opciones; rótulo de filtros activos | `src/app/(crm)/reportes/{filtros,filtros-vista}.tsx`, `package.json` (nuqs) | M12 | Haiku | D07 | REP-1 |
| REP-3 | Comparativa de periodo (dominio de rangos + consulta con dos ventanas) | `src/domain/reportes-periodos.ts`, `…test.ts`, `src/application/reportes/comparativa.ts`, `…test.ts`, `src/infrastructure/db/repos/reportes/*.ts` | M12 | Sonnet | D14 | REP-1 |
| REP-4 | Gasto de campañas: esquema (relajar CHECK a USD/DOP, `campaign_id` en leads **lo define G1**), casos de uso de alta/edición, API y carga por CSV | `schema.ts`, `drizzle/00NN_campanas_gasto.sql`, `drizzle/meta/*`, `src/application/marketing/{puertos,casos-de-uso,en-memoria}.ts`, `…test.ts`, `src/app/api/marketing/**`, `src/infrastructure/seguridad-rutas-id.test.ts` | **M12b-marketing (nueva)** | Sonnet | D11 + D12 | REP-0b |
| REP-5 | ROI real: costo por lead/reserva/venta, ROAS; pestaña «Canales» con datos de gasto y estado «sin gasto cargado» | `src/application/reportes/roi.ts`, `…test.ts`, `src/app/(crm)/reportes/canales.tsx` | M12b | Sonnet | D14 | REP-4 |
| REP-6 | Pestaña «Cobranza» (aging, flujo de caja, mora por proyecto/broker) | `src/application/reportes/cobranza.ts`, `…test.ts`, `src/app/(crm)/reportes/cobranza.tsx` | M12 + **M22 READY** | Sonnet | D14 | G3-COB-9, REP-1 |
| REP-7 | Pronóstico con bandas (probabilidades por etapa + conversión histórica con `simple-statistics`) y pronóstico de cobros | `src/domain/reportes-pronostico.ts`, `…test.ts`, `src/app/(crm)/reportes/pronostico.tsx` | M12 | Sonnet | D14 | REP-0a, REP-6 |
| REP-8 | Exportes del servidor por pestaña con `audit_log` (`exportar`), CSV con BOM y neutralización; PDF resumen | `src/app/api/reportes/exportar/route.ts`, `src/application/reportes/exportar.ts`, `…test.ts`, `src/domain/catalogs.ts` (acción), `src/infrastructure/pdf/reporte.tsx` | M12 | Sonnet | D12 | REP-1 |
| REP-9 | Profundizar: enlaces de gráfica a listas filtradas y breadcrumb | `src/app/(crm)/_ui/metric-chart.tsx`, `src/app/(crm)/reportes/vista.tsx`, `src/app/(crm)/negocios/…` (solo lectura de parámetros) | M12 + fichas Negocios/Leads | Haiku | D07 | REP-2 |
| REP-10 | Cohortes y envejecimiento de negocios | `src/application/reportes/{cohortes,envejecimiento}.ts`, `…test.ts`, `src/app/(crm)/reportes/cohortes.tsx` | M12 | Sonnet | D14 | REP-1 |
| REP-11 | «Mi rendimiento» del broker (`reports:view:own` en seed) y matriz de roles consistente con Comisiones | `db/seed.sql`, `scripts/seed/catalog.ts`, `src/application/reportes/mi-rendimiento.ts`, `…test.ts`, `src/app/(crm)/reportes/mi-rendimiento.tsx` | M12 + decisión de matriz de roles (Wilber) | Sonnet | D12 | REP-1 |
| REP-12 | Vistas guardadas y reporte semanal por correo (outbox + `@react-email/components`) | `src/application/reportes/programados.ts`, `…test.ts`, `schema.ts`, `drizzle/00NN_reportes_guardados.sql` | **M12c (nueva)** + M11 | Sonnet | D12 | REP-8, lote del worker |

Cada lote ≤ 45 min, con prueba; `gitnexus_impact` sobre `obtenerMetricasBi`, `consultarReportesBi`, `presentReport`, `crearConsultaReportes` y `gitnexus_detect_changes` antes de commitear. Las pruebas de SQL corren en `npm run test:db` y se compara el resultado por pestaña con la sentencia previa (paridad).

## 8. No verificado
- Volumen real y tiempo de la sentencia actual y de las dos ventanas de comparativa (D15); no se ejecutó `EXPLAIN`.
- API de TanStack Table v9 y compatibilidad exacta de Recharts con las bandas (`Area` apilada con `dataKey` doble) más allá de su documentación general.
- Atribución por campaña: `leads` solo tiene `source_id` (canal); medir por campaña exige `campaign_id`/UTM en el lead, que define el expediente G1 (Leads).
- Reglas de conversión de monedas para «equivalente»: dependen de `exchange_rates` de Cobros (M22 S-22-05) y de lo que el contador acepte como tasa.
- Si el contador necesita 606/607/IR-17 desde el CRM o desde su software (D21 B.4).
- Estado de Origin UI / 21st.dev como fuente: licencia no verificada, no se usa.
- Rendimiento de caché por alcance: depende de que no exista un planificador adicional al worker del outbox.
