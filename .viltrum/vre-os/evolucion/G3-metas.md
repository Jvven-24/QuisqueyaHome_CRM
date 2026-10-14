# Expediente de evolución · Metas (G3)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21 + D03 + D05 (subagente Sonnet), solo documentos. **No aprueba su propio trabajo**; revisión independiente pendiente (decisión #48).
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído); AGPL/GPL solo servicio aparte o referencia. Nada se incrusta; todo por puertos y outbox.
> Fuentes: código citado, `D21-catalogo-…-rd-2026-10-14.md` (A10.4, A13.4), `D21-inventario-funcional-crm-2026-10-14.md` (fila metas), `M22-cobros.md` §7. Hermanos: `G3-cobros.md`, `G3-comisiones.md`, `G3-brokers.md`, `G3-inicio.md`, `G3-reportes.md`.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 2 | Fijar meta mensual de negocios por compañía o broker: `PUT /api/metas` (`src/app/api/metas/route.ts:31-52`) → `fijarMetaMensual` (`application/metas/casos-de-uso.ts:23-62`). Lo logrado lo escribe solo el cierre (`pipeline/cierre.ts:129-150`). Sin histórico, sin metas por monto en la UI, sin ritmo ni proyección |
| Datos reales y reglas de negocio | 2 | `goals` por (broker, año, mes) con índices únicos parciales (`schema.ts:874-903`). Lo alcanzado **solo se incrementa** (`repos/pipeline.ts:211-232`): no hay decremento por rescisión ni recomputo. `achievedAmountCents` suma el monto del negocio **sin mirar la moneda** (`:228-229`) |
| Diseño y componentes | 2 | `metas/vista.tsx` usa clases del prototipo (`goal-hero`, `goal-ring`, `table-progress`); gráfico anual con barras CSS, no Recharts |
| Experiencia de uso | 2 | Selector de mes con `router.push`; edición por modal; sin comparativa, sin ritmo, sin alertas de hito |
| Calidad | 3 | `metas/casos-de-uso.test.ts` (153 líneas), `api/metas/route.test.ts`, `domain/metas.test.ts`. Sin `error.tsx`/`loading.tsx`; `page.tsx` consulta BD directo (`getDb`) |

**Objetivo: 4** — metas por cierres **y** por cobro, ritmo/pronóstico para llegar a la meta, histórico, reparto de la meta de compañía, niveles editables y logros opcionales.

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **Monedas mezcladas en lo alcanzado y en el nivel del broker.** `incrementarMetaAlcanzada` suma `amountCents` de un negocio en DOP dentro de `achieved_amount_cents` de una fila `goals.currency = 'USD'` (`repos/pipeline.ts:222-229`); `totalGanadoDelAnio` suma `deals.amount_cents` sin filtrar moneda (`:272-289`) y de ahí sale `annual_sales_cents` y el **nivel del broker** (`evaluarNivelBroker`, `cierre-negocio.ts:104-127`). Un cierre en DOP puede subir de nivel a un broker.
2. **Inconsistencia entre pantallas.** Brokers cae a la meta del perfil cuando no hay fila `goals` del mes (`brokers/page.tsx:89-90`), pero Inicio usa solo la fila `goals` (`repos/dashboard.ts:98-102`) y muestra «Sin meta» al mismo broker en el mismo mes.
3. **Meta no reversible.** `achieved_deals` solo sube al cerrar; si una venta se cancela o se rescinde (contratos, futuro) la meta no baja. Hace falta derivar «alcanzado» de fuentes (negocios ganados no revertidos y pagos) con reconciliación, no solo incrementar.
4. **`targetAmountCents = 0` por defecto** en el upsert del cierre (`repos/pipeline.ts:227`, columna `targetAmountCents: 0`) deja metas de monto en 0 en vez de nulas, y la pantalla ni las muestra (la columna existe, `schema.ts:882`, y la API la acepta).
5. **Alcance `team` no tratado.** `metas/page.tsx:43` distingue solo `all` frente a lo demás (`esVistaCompleta = scope === "all"`): un rol con `team` vería solo su meta.
6. **Sin `error.tsx`/`loading.tsx` de módulo y consulta saltándose `application`** (patrón repetido en brokers y comisiones).
7. **Cualquier ranking entre brokers queda bloqueado por el modelo de permisos**: el broker tiene `goals:view:own` (`db/seed.sql:90`) y el recurso `global_metrics` existe en el catálogo (`catalogs.ts:52`) pero nada lo usa. Un tablero de posiciones necesita un permiso explícito y consentimiento (privacidad); hoy no puede construirse sin romper `own`.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| MET-01 | Meta por **monto** (por moneda) además de número de negocios, visible y editable | ESENCIAL | A13.4 | Columna sin UI |
| MET-02 | Meta de **cobro** (dinero efectivamente cobrado) alimentada por `PagoRegistrado` | IMPORTANTE | A7 | No existe |
| MET-03 | Alcanzado **derivado y reconciliable** (cierres ganados + cobros) con recomputo nocturno y reversa por anulación/rescisión | ESENCIAL | — | Solo incremento |
| MET-04 | **Ritmo y pronóstico**: línea de ritmo del mes, días restantes, «necesitas N cierres/semana», riesgo de no llegar (usa el pronóstico ponderado de Reportes) | IMPORTANTE | A13.1 | No existe |
| MET-05 | **Reparto de la meta de compañía** entre brokers (por nivel, historial o manual) con vista previa; la suma coincide con la compañía | IMPORTANTE | — | Manual uno a uno |
| MET-06 | Periodos: trimestre y año, metas por equipo o por proyecto | IMPORTANTE | — | Solo mes |
| MET-07 | **Histórico** (12–24 meses) por broker y compañía, con tendencia | IMPORTANTE | A13.4 | Solo año en curso (compañía) |
| MET-08 | **Niveles editables** por el administrador (tabla `broker_levels` con umbrales y vigencia) y bonos escalonados por meta | IMPORTANTE | A10.4 | Constante en código |
| MET-09 | **Hitos y notificaciones** (50/80/100 %, meta en riesgo) por outbox hacia Comunicaciones e Inicio | DESEABLE | A2.5 | No existe |
| MET-10 | **Tabla de posiciones** opt-in con permiso `global_metrics` y reglas de privacidad; logros/insignias opcionales | DESEABLE | A10.4 | No existe |
| MET-11 | Historial de cambios de una meta (quién, cuándo, de qué a qué) | IMPORTANTE | A19.1 | Solo `audit_log` |
| MET-12 | Cifras coherentes: una sola función `metaEfectiva(broker, periodo)` usada por Metas, Brokers e Inicio | ESENCIAL | — | Tres lecturas distintas |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **Recharts** (ya instalado `^3.8.0`) | `recharts/recharts`, npm `3.10.1` (gitHead `ffb918798051`, push 2026-10-14; 27 627 estrellas) | MIT | React 19 admitido | `RadialBarChart` (anillo de cumplimiento), `ComposedChart` con `ReferenceLine` (línea de ritmo y meta), `Funnel`/`Sankey` si se necesitan; sustituye las barras CSS | APP (ya en el árbol) | Total, se usa vía `ChartContainer` de `src/components/ui/chart.tsx` | S |
| **simple-statistics** | npm `7.12.1` (2026-09-27; 3 526 estrellas) | **ISC** (permisiva, aceptada) | TS/JS sin dependencias | `linearRegression`, `linearRegressionLine`, `mean`, `quantile`: proyección lineal del ritmo y bandas | APP | Total, puro | S |
| **Trophy UI kit** | `trophyso/ui` (149 estrellas; fecha del último commit **no verificada**) | MIT (página del repositorio) | shadcn registry + Tailwind v4 + Radix | `leaderboard-card`, `streak-badge`, `points-chart` — **solo como patrón visual**; el código se copia con cabecera de procedencia | PORT (copiar) | Estilo propio de `docs/DESIGN.md` (sin confeti, dorado reservado); el proveedor vende un SaaS aparte (Trophy API) que **no** se usa | S |
| **react-grid-layout** | `react-grid-layout/react-grid-layout`, npm `2.3.0` (gitHead `9b01a614bcdd`, 2026-10-05; 22 446 estrellas) | MIT | React ≥16.3 | Para el widget «Mi meta» dentro del tablero configurable de Inicio | APP (ver `G3-inicio.md`) | Total | — |
| **GoRules Zen** | npm `@gorules/zen-engine@2.1.7` | MIT | Rust + binding Node | Tabla de bonos y reparto por nivel como decisión editable | APP condicional | Misma reserva que en `G3-comisiones.md` §4 | M |
| **nuqs** | npm `2.10.2` | MIT | Next 14.2+ | Periodo, alcance y vista en la URL | APP | Total | S |
| Habitica, Open Badges Passport | — | GPL / varios | — | Gamificación general | **RECHAZADOS** | Alcance ajeno; la insignia de formación vive en Moodle (ver `G3-academy.md`) | — |

Qué adaptamos y qué no: nada de gamificación con puntos arbitrarios; el objetivo es ritmo y claridad, no juego. El kit de Trophy se usa únicamente como referencia de componentes y bajo el permiso de privacidad.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Anillo de cumplimiento accesible | `RadialBarChart` (Recharts) con texto equivalente y `<progress>` oculto | Hero de `/metas` y widget de Inicio |
| Ritmo del mes | `ComposedChart` con línea de meta, línea de ritmo ideal y puntos reales; `ReferenceLine` del día actual | `/metas` pestaña «Ritmo» |
| Reparto de la meta | Tabla editable con barra de suma restante y botón «Repartir por nivel» | Modal «Repartir meta» (solo `all`) |
| Histórico | Área/columna 12–24 meses con meta vs. alcanzado y banda de cumplimiento | `/metas` pestaña «Histórico» |
| Tabla por broker | `DataTable` con barra de cumplimiento, nivel, ritmo y «en riesgo» | Sustituye `<table>` manual |
| Seis estados y móvil | `error.tsx`, `loading.tsx`, vacío distinguido; tarjetas apiladas 320/390 | Todo el módulo |

## 6. Comunicación con el resto (centralización)
**Consume:** `NegocioCambioEtapa` (cierre ganado) → recomputa «alcanzado»; `PagoRegistrado`/`PagoAnulado` (Cobros) → meta de cobro; `ComisionDevengada` (Comisiones) → opcional; `BrokerNivelCambiado`, `BrokerDesactivado` (Brokers); `ContratoRescindido` (futuro) → reversa.
**Emite** (ampliar `TIPOS_EVENTO_CRM` y CHECK; el worker reclama solo tipos con consumidor): `MetaFijada{id}`, `MetaHito{id,umbral}`, `MetaEnRiesgo{id}`.
| Consumidor | Qué hace |
|---|---|
| Inicio | Widget «Mi meta / Meta del equipo» con ritmo |
| Reportes | Pestaña «Metas» (cumplimiento, histórico, forecast vs. meta) |
| Brokers | Barra de meta y nivel en tarjeta y perfil (misma `metaEfectiva`) |
| Comunicaciones | Aviso de hito o de riesgo |
| Academy | Sugerencia de curso cuando la meta está en riesgo (DESEABLE) |

**Puertos:** `RepositorioMetas` existente más `MetasLecturaPort` para el cálculo derivado; `Reloj`. **Datos nuevos:** `goal_history` (versiones), `broker_levels` (umbrales con vigencia), `goal_allocations` (reparto) — todos `.enableRLS()`, sin DELETE. Hasta que exista MET-03, el incremento actual sigue funcionando (compatibilidad).

## 7. Lotes asignables
| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| MET-0 | Separar monedas en el alcanzado y en `annual_sales_cents` (solo USD cuenta para nivel hasta que haya regla); prueba con negocio DOP; recomputo del nivel | `src/application/pipeline/cierre.ts`, `src/infrastructure/db/repos/pipeline.ts`, `src/application/pipeline/cierre.test.ts`, `scripts/test-db/cierre.ts` | **Ninguna: corrección de hallazgo** (coordinar con el frente Negocios, zona reservada del orquestador; no se toca sin reclamo en `EN-CURSO.md`) | Sonnet | D12 + D14 | Cierre de E1.1 |
| MET-1 | `metaEfectiva()` única (dominio puro) y su uso en Metas, Brokers e Inicio; prueba de paridad | `src/domain/metas.ts`, `src/domain/metas.test.ts`, `src/application/metas/consultas.ts`, `consultas.test.ts` | M08 (nueva, E1.4b) | Sonnet | D14 | — |
| MET-2 | Capa `application` de lectura de Metas, `error.tsx`, `loading.tsx`, alcance `team` | `src/application/metas/{consultas,puertos,en-memoria}.ts`, `src/app/(crm)/metas/{page,error,loading}.tsx` | M08 | Haiku | D14 | MET-1 |
| MET-3 | Metas por monto y por moneda: UI y validación (nulo ≠ 0); migración aditiva si hace falta `goals.target_amount` por moneda | `src/app/(crm)/metas/vista.tsx`, `src/application/metas/casos-de-uso.ts`, `src/app/api/metas/route.ts`, `src/domain/metas.ts`, tests | M08 | Sonnet | D12 | MET-1 |
| MET-4 | Esquema: `goal_history`, `broker_levels`, `goal_allocations` + migración y seed; invariante Σ reparto = meta | `schema.ts`, `drizzle/00NN_metas_avanzado.sql`, `drizzle/meta/*`, `db/seed.sql`, `scripts/seed/catalog.ts`, `src/infrastructure/db/seed-invariantes.test.ts` | M08 READY (D11) | Sonnet | D11 | MET-1 |
| MET-5 | Alcanzado derivado + reconciliación + reversa (consumidor de `NegocioCambioEtapa` y de `PagoRegistrado/Anulado`) | `src/application/metas/alcanzado.ts`, `alcanzado.test.ts`, `src/infrastructure/db/repos/metas.ts`, `scripts/test-db/metas.ts` | M08 + M22 READY + I00 | Sonnet | D11 + D14 | MET-4, G3-COB-8 |
| MET-6 | Ritmo y pronóstico (dominio puro con `simple-statistics`) + gráfico | `src/domain/metas-ritmo.ts`, `…test.ts`, `src/app/(crm)/metas/ritmo.tsx` | M08 | Sonnet | D14 | MET-1 |
| MET-7 | Histórico, reparto de meta y niveles editables (UI + API) | `src/app/(crm)/metas/{historico,repartir}.tsx`, `src/app/(crm)/configuracion/_niveles.tsx`, `src/app/api/metas/reparto/route.ts`, `src/app/api/niveles/**` | M08 | Haiku | D12 | MET-4, MET-3 |
| MET-8 | Hitos y notificaciones por outbox | `src/application/metas/hitos.ts`, `…test.ts` | M08 + M11 | Sonnet | D12 | MET-5, lote del worker |
| MET-9 | Tabla de posiciones opt-in con `global_metrics` y consentimiento | `src/application/metas/posiciones.ts`, `…test.ts`, `src/app/(crm)/metas/posiciones.tsx`, `db/seed.sql` (permiso) | M08 + **decisión de Wilber (privacidad entre brokers)** | Haiku | D12 | MET-4 |

Cada lote ≤ 45 min y exige `gitnexus_impact` sobre `incrementarMetaAlcanzada`, `fijarMetaMensual`, `evaluarNivelBroker` y `gitnexus_detect_changes`.

## 8. No verificado
- Fecha del último commit de `trophyso/ui` (no mostrada por la página; licencia MIT leída del repositorio).
- La política comercial de bonos y niveles: los umbrales distintos de Senior = US$500 000 son provisionales (`cierre-negocio.ts:80-102`).
- Si los brokers aceptan una tabla de posiciones (decisión de privacidad y cultura de Wilber).
- No se ejecutó ninguna consulta contra la base ni la suite; las cifras de líneas de las vistas salen de `wc -l` sobre el árbol del 14-oct.
- El frente Negocios (zona reservada en `EN-CURSO.md`) está en curso; MET-0 depende de que se libere.
