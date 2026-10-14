# Expediente de evolución · Inicio (dashboard por rol) (G3)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21 + D03 + D05 (subagente Sonnet), solo documentos. **No aprueba su propio trabajo**; revisión independiente pendiente (decisión #48).
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído); AGPL/GPL solo servicio aparte o referencia; sin licencia, solo ideas. Nada se incrusta; todo por puertos y outbox.
> Fuentes: código citado, `D21-inventario-funcional-crm-2026-10-14.md` (fila inicio), `D21-catalogo-…-rd-2026-10-14.md` (A2.5, A13), `.viltrum/vre-os/D09-inicio-reportes.md`, `docs/DESIGN.md`. Hermanos: `G3-reportes.md` (comparte consultas), `G3-metas.md`, `G3-comisiones.md`, `G3-cobros.md`, `G3-academy.md`, `G3-brokers.md`.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 3 | `/inicio` con KPI, atención (leads recientes), meta/demanda, embudo y agenda (`inicio/vista.tsx`); lectura por alcance en una sola sentencia SQL (`repos/dashboard.ts:30-147`). Sin widgets configurables ni comparativa; sin comisiones, cobros, aprobaciones ni formación para el admin |
| Datos reales y reglas de negocio | 3 | Alcance por recurso con `visibleRows` (`repos/dashboard.ts:19-26`); fechas en `America/Santo_Domingo`; `assertMonetaryTotals`. Pero: moneda solo USD (`:117`), conversión mal definida y un KPI siempre vacío (ver §2) |
| Diseño y componentes | 3 | `ChartCard`, `MetricChart` (Recharts), pestañas, seis estados por tarjeta (`analytics-state.ts`); estilos propios `analytics-*` aparte de shadcn |
| Experiencia de uso | 2 | Mismo tablero para cada rol (ramas por `roleSlug`); sin personalizar, sin comparar, sin acciones rápidas, sin filtros visibles aunque la página los lee (`inicio/page.tsx` → `leerFiltros`) |
| Calidad | 3 | `consultas.test.ts`, `analitica.test.ts`, `lecturas.db.test.ts`; `error.tsx` y `loading.tsx` propios; accesibilidad con resumen oculto por gráfica |

**Objetivo: 4** — tablero por rol hecho de widgets que cada módulo registra, configurable por usuario, con comparativa, alertas y una bandeja única de «lo que requiere tu acción».

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **`GET /api/notificaciones` inventa datos.** Si el usuario no tiene notificaciones, inserta tres filas falsas («Nuevo Lead desde Portal Web — Elena Ramirez…», «Cita programada hoy…», «Fase 3 validada… en Bávaro Beach Lofts») en la base (`src/app/api/notificaciones/route.ts:35-62`). La campana del encabezado muestra eventos que nunca ocurrieron. Es una escritura en un GET con datos de adorno prohibidos por `docs/DESIGN.md`.
2. **`PATCH /api/notificaciones` marca cualquier notificación por `id` sin comprobar que sea del actor** (`route.ts:84-98`, `.where(eq(notifications.id, datos.id))` en la línea 98, sin `userId`). Un usuario autenticado con `dashboard:view` puede marcar como leídas las de otros (integridad; no expone contenido). Debe cumplir `seguridad-rutas-id`.
3. **«Conversión» mal definida.** `percentage(snapshot.monthWon, snapshot.monthLeads)` (`application/dashboard/consultas.ts:38`) divide los cierres del mes (de negocios de cualquier fecha de alta) entre los leads recibidos en el mes; puede superar 100 % o engañar. Debe ser por cohorte (leads del mes que se ganaron) o llamarse «cierres por lead del mes».
4. **KPI que nunca tiene dato.** `avancesPorRevisarCount: null` fijo (`consultas.ts:41`): el asistente ve «Sin datos» para siempre; y cada tarjeta repite «Comparación anterior no disponible» (`inicio/vista.tsx:44`, `previousMissing`), texto muerto en pantalla.
5. **Solo dólares.** `pipelineCents` filtra `currency = 'USD'` (`repos/dashboard.ts:117`) y `formatUsd` rotula todo como USD (`lib/formato-analitica.ts`); los negocios en DOP no aparecen. Mismo hallazgo en Reportes (`G3-reportes.md`).
6. **Inconsistencia de meta con Brokers.** `my_goal` lee solo la fila de `goals` del mes (`dashboard.ts:98-102`), mientras Brokers cae a la meta del perfil (`brokers/page.tsx:89-90`); el broker ve «Sin meta» en Inicio y «0 %» en Brokers.
7. **Rol por nombre, no por permiso.** La vista ramifica por `roleSlug === "broker"/"assistant"` (`inicio/vista.tsx:21-22`), contra el propio encabezado del repositorio («nunca por el nombre del rol», `dashboard.ts:1`): un rol personalizado cae en el tablero de administrador.
8. **Una sola sentencia SQL de ~120 líneas para todo**: si una subconsulta falla o se ralentiza, falla toda la pantalla; no hay aislamiento por tarjeta.
9. **Filtros ocultos.** La página acepta `desde/hasta/projectId/brokerId` por URL sin controles visibles; un enlace compartido cambia las cifras sin que el usuario lo note (el rótulo de periodo no lo dice).

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| INI-01 | **Registro de widgets**: cada módulo registra sus widgets con ID, permiso/alcance requerido, tamaño, rol por defecto y proveedor de datos aislado; Inicio no importa tablas de otros módulos | ESENCIAL | A13 | No existe |
| INI-02 | **Tablero por rol decidido por permisos** (admin/dirección, asistente, broker y roles personalizados) con layout por defecto editable por el administrador | ESENCIAL | A13 | Ramas por slug |
| INI-03 | **Widgets configurables**: mostrar/ocultar, reordenar y cambiar tamaño (modo «Personalizar»); persistencia por usuario | IMPORTANTE | A13 | No existe |
| INI-04 | **Comparativa con el periodo anterior** y mini-tendencia (sparkline) en cada KPI | ESENCIAL | A13.1 | «No disponible» |
| INI-05 | **Bandeja «Requiere tu acción»**: propuestas por aprobar, comisiones por aprobar/pagar, anulaciones de pago pendientes, cuotas vencidas, leads sin asignar, revisiones de Academy, KYC vencido — con enlace directo y contador | ESENCIAL | A2.5 | Parcial (leads y tareas) |
| INI-06 | **Widgets financieros**: cartera por cobrar y vencida, cobrado del mes, comisiones devengadas/por pagar, pronóstico del mes, por moneda | ESENCIAL | A13.2 | No existe |
| INI-07 | **Widget de meta con ritmo** («vas a 12 de 15; necesitas 2 por semana») | IMPORTANTE | A13.4 | Solo %/conteo |
| INI-08 | **Alertas operativas**: negocios estancados, leads sin primer contacto fuera de SLA, meta en riesgo, salud de integraciones (cola del outbox: pendientes y muertos) | IMPORTANTE | A2.5 | No existe |
| INI-09 | **Centro de notificaciones real** alimentado por eventos (no por semillas), con preferencias y enlace al registro | IMPORTANTE | A2.2 | Semillas falsas |
| INI-10 | **Acciones rápidas** (crear lead, registrar pago, agendar cita) según permiso, integradas con la paleta de comandos existente | IMPORTANTE | — | Un botón |
| INI-11 | Filtros visibles (periodo, proyecto, broker) con rótulo y atajo «volver a mi vista» | IMPORTANTE | A13 | Ocultos |
| INI-12 | Vista móvil: widgets apilados por prioridad, sin edición en <768 px | ESENCIAL | — | Parcial |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **react-grid-layout** | `react-grid-layout/react-grid-layout`, npm `2.3.0` (gitHead `9b01a614bcdd`, publicado 2026-10-05; push 2026-10-13; 22 446 estrellas) | MIT (LICENSE leído, © 2016 Samuel Reed) | React ≥16.3; deps `react-draggable`, `react-resizable` | `ResponsiveGridLayout` para el modo «Personalizar» (INI-03), con breakpoints; en móvil se usa lista apilada | APP | Total con React 19 (peer `>= 16.3`); solo se carga en modo edición (importación dinámica) | M |
| **shadcn/ui (bloques `dashboard-*`, `sidebar-*`, `chart`)** | `shadcn-ui/ui` (125 565 estrellas, push 2026-10-14) | MIT | React 19 + Tailwind v4 | Patrón de tarjetas KPI con delta y de `ChartContainer` (ya instalado); no se instala el bloque completo | PORT (patrón) | Total; ya es la base de `src/components/ui` | S |
| **Recharts** | npm `3.10.1` (instalado `^3.8.0`, push 2026-10-14) | MIT | React 19 | `LineChart` sin ejes para sparklines; `RadialBarChart`; `ComposedChart` con línea de meta | APP (ya en el árbol) | Total | S |
| **Tremor** (`@tremor/react 3.18.7` y repo `tremorlabs/tremor`) | npm publicado 2025-01-13; repositorio sin push desde 2025-10-10 (3 658 estrellas) | **Apache-2.0** (no MIT) | React **18** (`peerDependencies: react ^18.0.0`) | Patrones de KPI con insignia de variación, `BarList`, `Tracker` como idea visual | **REF, no dependencia** | Incompatible con React 19 y sin mantenimiento: no se instala; si se copia un bloque, cabecera de procedencia y archivo NOTICE | — |
| `Kiranism/next-shadcn-dashboard-starter` | push 2026-09-11 (7 124 estrellas) | MIT | Next **16**, shadcn, Tailwind | Estructura de rutas paralelas para tarjetas con carga independiente | REF | Next 15 en este repo; no se copia | — |
| `satnaing/shadcn-admin` | push 2026-09-10 (15 734 estrellas) | MIT | Vite + shadcn | Maqueta de panel de administración | REF | — | — |
| **nuqs** | npm `2.10.2` (gitHead `07afd0f21219`) | MIT | Next 14.2+ | Filtros de Inicio/Reportes en la URL con tipos | APP | Total | S |
| **simple-statistics** | npm `7.12.1` | ISC | TS | `linearRegression` para la mini-tendencia y bandas | APP | Total | S |
| **@dnd-kit/core** | npm `6.3.1` (2024-12-05) | MIT | React ≥16.8 | Reordenar widgets en móvil (alternativa táctil a RGL) | APP condicional | `@dnd-kit/sortable` **no verificado** en esta sesión | S |
| Origin UI / 21st.dev | — | **No verificada** (GitHub devolvió 403 por límite; las páginas de componentes de 21st muestran «License: unknown») | — | Bloques de dashboard | **Solo ideas** | No se copia nada sin LICENSE leído | — |

Qué adaptamos: el patrón de registro + RGL en modo edición; patrón visual de KPI con delta. Qué no: Tremor como dependencia (React 18, sin mantenimiento), plantillas Next 16.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Tarjeta KPI con variación | `Card` + insignia `+12 % vs. mes anterior` + sparkline Recharts; texto «sin comparativa» solo si no hay base | Fila de KPI |
| Bandeja de acción | Lista agrupada por módulo con contador, urgencia y enlace profundo (`DataTable` compacto) | Primera columna, sticky en escritorio |
| Tablero | Rejilla de 12 columnas; modo «Personalizar» con `ResponsiveGridLayout`, botón «Restablecer» y «Guardar como predeterminado del rol» (admin) | `/inicio` |
| Estado por widget | `ChartCard` con sus seis estados y aislamiento: un widget que falla no tumba los demás (`Promise.allSettled`) | Todos |
| Filtros | Barra con periodo/proyecto/broker (`nuqs`) y rótulo del filtro activo | Encabezado |
| Móvil | Widgets apilados por prioridad; edición deshabilitada <768 px | 320/390 |
| Honestidad | Cero datos de adorno; sin semillas de notificaciones | Campana y tableros |

## 6. Comunicación con el resto (centralización)
Inicio es **consumidor puro y orquestador de presentación**: no es dueño de datos de negocio. Su única escritura propia es el layout.
**Consume** (vía proveedores de widget por módulo; cada uno aislado, con permiso propio): Leads/Negocios (embudo, estancados), Actividades, Metas (`metaEfectiva`), Comisiones (`ConsultasComisiones`), Cobros (`consultarCartera`), Academy (`cobertura`), Brokers, Reportes (pronóstico), Integraciones (estado del outbox). **Eventos que lo mantienen vivo:** `PagoRegistrado`, `CuotaVencida`, `ComisionDevengada/Aprobada`, `PropuestaCreada` (asistente), `RevisionAcademySolicitada`, `MetaHito/EnRiesgo`, `NegocioCambioEtapa`, `LeadCreado` → consumidor que escribe `notifications` con plantilla (sustituye a las semillas).
**Emite:** `PreferenciasDeNotificacionCambiadas` (opcional). **Puertos:** `ProveedorDeWidget` (nuevo, uno por módulo, registrado en `src/application/dashboard/registro.ts`), `ProveedorDePendientes` (bandeja), `Reloj`. **Datos nuevos (`.enableRLS()`):** `dashboard_layouts` (usuario o rol, JSON validado con Zod, `schema_version`), `notification_preferences`. Conservar `notifications` con índice (`user_id,is_read`).
Regla de arquitectura: ningún proveedor importa la tabla de otro módulo; cada módulo expone una consulta en `application/<modulo>/consultas.ts`.

## 7. Lotes asignables
| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| INI-0a | Quitar las semillas falsas de `GET /api/notificaciones` (devolver lista vacía) y exigir `userId` en el `PATCH`; pruebas de IDOR y de «no escribe en GET» | `src/app/api/notificaciones/route.ts`, `src/app/api/notificaciones/route.test.ts` (nuevo), `src/infrastructure/seguridad-rutas-id.test.ts` | Ninguna (corrección de seguridad) | Haiku | D12 | — |
| INI-0b | Corregir la conversión (cohorte), el KPI de avances (ocultar si no hay fuente), el texto muerto de comparativa y la meta efectiva; separar monedas del pipeline | `src/application/dashboard/consultas.ts`, `consultas.test.ts`, `src/infrastructure/db/repos/dashboard.ts`, `src/app/(crm)/inicio/vista.tsx`, `src/app/(crm)/_ui/analitica-copy.ts` | Ninguna (corrección) | Sonnet | D14 | MET-1 (`metaEfectiva`) |
| INI-1 | Registro de widgets y proveedor tipado con prueba de contrato (permiso obligatorio, sin imports cruzados) | `src/application/dashboard/{registro,widgets,puertos}.ts`, `registro.test.ts` | **M20-inicio (nueva)** | Sonnet | D03 + D14 | INI-0b |
| INI-2 | Migrar los widgets actuales a proveedores aislados (`Promise.allSettled`) sin cambiar cifras (prueba de paridad con la sentencia actual) | `src/application/dashboard/proveedores/*.ts`, `…test.ts`, `src/infrastructure/db/repos/dashboard.ts` | M20 | Sonnet | D14 | INI-1 |
| INI-3 | Tablero por permisos (sin `roleSlug`) + layout por defecto por rol en código | `src/app/(crm)/inicio/{page,vista,tablero}.tsx`, `src/application/dashboard/layouts-por-defecto.ts`, `…test.ts` | M20 | Haiku | D07 + D14 | INI-2 |
| INI-4 | Comparativa de periodo y sparklines (dos ventanas en SQL, dominio de deltas) | `src/application/dashboard/comparativa.ts`, `…test.ts`, `src/infrastructure/db/repos/dashboard.ts` | M20 | Sonnet | D14 | INI-2 |
| INI-5 | Persistencia de layouts: tabla, migración, API y caso de uso | `schema.ts`, `drizzle/00NN_dashboard_layouts.sql`, `drizzle/meta/*`, `src/application/dashboard/layouts.ts`, `…test.ts`, `src/app/api/dashboard/layout/route.ts`, `src/infrastructure/seguridad-rutas-id.test.ts`, `src/infrastructure/db/seed-invariantes.test.ts` | M20 → READY (D11) | Sonnet | D11 + D12 | INI-1 |
| INI-6 | Modo «Personalizar» con `react-grid-layout` (importación dinámica), reset y predeterminado del rol | `src/app/(crm)/inicio/personalizar.tsx`, `package.json` (react-grid-layout) | M20 READY | Haiku | D07 | INI-5 |
| INI-7 | Bandeja «Requiere tu acción» con `ProveedorDePendientes` por módulo (primero Leads, Negocios, Comisiones, Academy) | `src/application/dashboard/pendientes.ts`, `…test.ts`, `src/app/(crm)/inicio/pendientes.tsx` | M20 + fichas de cada módulo | Sonnet | D12 + D14 | INI-2 |
| INI-8 | Centro de notificaciones real: consumidor de eventos → `notifications`, preferencias | `src/application/dashboard/notificaciones.ts`, `…test.ts`, `src/app/api/notificaciones/route.ts`, `schema.ts` (preferencias) | M20 + I00 | Sonnet | D12 | INI-0a, lote del worker |
| INI-9 | Widgets de Cobros, Comisiones, Metas con ritmo, Academy e Integraciones (uno por proveedor) | `src/app/(crm)/inicio/widgets/{cobros,comisiones,metas,academy,integraciones}.tsx` y `src/application/<modulo>/widget.ts` correspondientes | M20 + M22/M09/M08/M13 READY | Haiku | D14 | INI-2 + módulo respectivo |
| INI-10 | Filtros visibles con `nuqs` y rótulo de filtro activo | `src/app/(crm)/inicio/filtros.tsx`, `package.json` (nuqs) | M20 | Haiku | D07 | INI-3 |
| INI-11 | Alertas operativas (estancados, SLA, meta en riesgo, salud del outbox) | `src/application/dashboard/alertas.ts`, `…test.ts` | M20 + ficha Leads (SLA) | Sonnet | D14 | INI-2, G1 Leads |

Todo lote exige `gitnexus_impact` sobre `consultarDashboard`, `dashboardScopes`, `crearConsultaDashboard` y `gitnexus_detect_changes`. Las rutas nuevas llaman a `requireScope` antes de tocar datos.

## 8. No verificado
- Licencia de Origin UI (la API de GitHub devolvió 403 por límite en esta sesión) y de los componentes de 21st.dev (aparecen como «unknown»): no se copia nada.
- `@dnd-kit/sortable` y la compatibilidad exacta de `react-grid-layout` 2.x con React 19 más allá de su `peerDependencies >= 16.3` (se prueba en INI-6).
- Rendimiento de la sentencia SQL actual con volumen real y de las dos ventanas de comparativa (D15).
- Si pg_cron o un planificador existe para agregados previos; se asume que no (cola del outbox como único worker).
- No se ejecutó la aplicación ni la suite; las cifras de líneas salen del árbol del 14-oct.
