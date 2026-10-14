# Expediente de evolución · Propiedades (M04: proyectos, torres/pisos, unidades, listas de precios, matriz de disponibilidad, mapa)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21+D03+D05, grupo G2, 14-oct-2026. Solo lectura de `src/` y web; este archivo es lo único escrito.
> Reglas: misma tecnología primero (TypeScript, React 19, Next.js 15, Tailwind v4, shadcn/ui, Drizzle, PostgreSQL). Copiar o portar código solo de MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia). AGPL/GPL solo RUN o referencia. Nada se incrusta: todo se ve en nuestra interfaz y se comunica por puertos y outbox.
> Evidencia: lo marcado con `archivo:línea` lo leí hoy en el código; lo marcado «registro npm» lo leí hoy en `registry.npmjs.org`; los LICENSE los leí de `raw.githubusercontent.com`. Lo no comprobado está en §8.
> No repite lo ya verificado en `research/D21-inventario-funcional-crm-2026-10-14.md` (se cita), en `PLAN-INTEGRAL-2026-10-14.md` ni en `spec/integraciones/I04-portal.md` (§2 disponibilidad con un solo escritor).

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia (archivo:línea o captura) |
|---|---|---|
| Funciones | 2 | CRUD de proyecto y de unidad con alcance y auditoría (`src/application/proyectos/casos-de-uso.ts:56-200`). Una unidad solo tiene código, tipología, hab., baños, m² construidos, precios y estado (`src/app/api/proyectos/[id]/unidades/route.ts:13-25`). Sin torre/piso editables, sin matriz, sin mapa, sin listas de precios. |
| Datos reales y reglas de negocio | 2 | Esquema rico pero sin uso: `units.tower` (texto), `units.floor_level`, `units.inventory_state_id`, `projects.confotur_eligible`, `projects.zone_id` existen (`schema.ts:431-434,489-492`) pero `DatosUnidad` los excluye (`puertos.ts` `DatosUnidad = Omit<Unidad, …"floorLevel"…>`) y `Proyecto` no incluye `confoturEligible` ni `zoneId`. Torres y pisos solo entran por el generador de datos (`scripts/seed/generator.ts:68`). |
| Diseño y componentes | 2 | Rejilla de tarjetas con clases heredadas del prototipo (`property-grid`, `property-card`) y colores crudos (`emerald-300`, `gold-600`) en `propiedades/vista.tsx:121-160`; la imagen de la tarjeta es el icono de marca (`vista.tsx:130-136`), no una foto. Detalle: una tabla plana de unidades (`[slug]/vista.tsx:144-175`). |
| Experiencia de uso (flujos, atajos, móvil) | 2 | Filtros por zona (texto libre) y tipo en la URL (`vista.tsx:57-106`); sin comparar, sin ficha lateral de unidad, sin vista por torre/piso, sin acciones masivas. |
| Calidad (pruebas, seis estados, accesibilidad) | 2 | Pruebas de casos de uso y de dominio (`casos-de-uso.test.ts`, `unidades.test.ts`, `slug.test.ts`). Faltan `error.tsx` y `loading.tsx` del módulo (verificado hoy: la carpeta `propiedades/` no los tiene; inventario D21 §2). `page.tsx` consulta BD sin pasar por `application/` (inventario D21 §2 «Capas»). |

Escala: 0 ausente · 1 maqueta · 2 básico (CRUD) · 3 completo · 4 avanzado · 5 referente. **Objetivo de este programa: 4.**

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **El distintivo «Confotur» se inventa por el nombre de la zona.** `propiedades/vista.tsx:121-139` lo muestra si la zona contiene «Cap Cana», «Bávaro», «Punta Cana» o «Las Terrenas». El dato real, `projects.confotur_eligible` (`schema.ts:434`), no lo lee ni lo escribe ninguna pantalla ni caso de uso (solo el generador, `scripts/seed/generator.ts:62`, lo marca «hipotético»). Efecto: un proyecto sin clasificación aparece como Confotur ante el equipo y, con el cotizador (`api/cotizador/confotur`), puede acabar prometiendo ahorros fiscales que no corresponden. Riesgo legal y comercial; corregir primero.
2. **No se puede fijar torre, piso ni estado de inventario desde la interfaz ni la API.** `unidades/route.ts:13-25` no acepta `tower`, `floorLevel` ni `inventoryStateId`; `DatosUnidad` los omite. La matriz de disponibilidad, el mapa de torre y la lista de precios por piso son imposibles sin esto.
3. **El estado de una unidad se edita a mano, incluido `sold` y `reserved`.** `unidades/route.ts:25` y `unidades/[unitId]/route.ts:24` aceptan `status` libre. Una unidad puede quedar «vendida» sin fila en `unit_sales` o volver a «disponible» estando vendida. Ya está diagnosticado en `I04-portal.md` §2.1 (hay que retirarlo de la edición genérica y pasar por `cambiarEstadoUnidad`); sigue sin hacerse.
4. **Se puede archivar una unidad vendida o un proyecto con ventas.** `borrarUnidad` (`casos-de-uso.ts:177-191`) y `borrarProyecto` (`:113-131`) ponen `deleted_at` sin consultar `unit_sales`, `deal_properties` ni reservas. Las FK `RESTRICT` de `unit_sales` (`schema.ts:758-765`) no se disparan con un borrado lógico. Efecto: una venta cerrada puede desaparecer del inventario y de los reportes.
5. **El precio se pisa sin versión.** `editarUnidad` (`casos-de-uso.ts:154-175`) sobrescribe `realPriceCents` y el rango público; solo queda el antes/después en `audit_log`. No hay lista de precios con vigencia, así que una cotización de hace tres semanas no se puede reconstruir (D21 catálogo A.3 #8; A3.3).
6. **Visibilidad 1 broker por proyecto.** `projects.broker_id` y `units.broker_id` son un solo valor (`schema.ts:452,507`); `asignarProyectosABroker` asigna o suelta ese único valor (`brokers/casos-de-uso.ts:41-48`). Con esto no se puede compartir inventario entre varios brokers ni condicionarlo a certificación (A3.6, A10.5). Es del módulo Brokers (otro grupo), pero bloquea la meta de inventario compartido; se anota como dependencia.
7. **Zona duplicada.** `projects.zone` (texto libre) y `zone_id` → `zones` (`schema.ts:431-432`) conviven; el filtro usa el texto libre. `zones` solo se lee en 5 archivos (inventario D21 §1). Los reportes por zona y el mapa necesitan el catálogo.
8. **Ausencia de seis estados y de capa de consulta**: sin `error.tsx`/`loading.tsx`; `page.tsx` y `[slug]/page.tsx` usan `getDb()` directo.
9. **Diseño fuera de tokens**: la tarjeta usa utilidades de color crudas (`emerald-300`, `navy-950`) y una imagen decorativa que `docs/DESIGN.md` desaconseja en vistas de trabajo; una propiedad necesita foto real, no el icono de marca.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo (A.x) | Hoy |
|---|---|---|---|---|
| PR-01 | Jerarquía proyecto → torre/etapa → piso → tipología → unidad, con accesorias vendibles (parqueos, depósitos) ligadas a la unidad | ESENCIAL | A3.1 | Texto libre `tower`, sin accesorias |
| PR-02 | **Matriz de disponibilidad** (plano de apilamiento): columnas = líneas de unidad, filas = pisos, una torre por pestaña; color por estado, filtros (hab., precio, orientación), clic abre ficha lateral; mismo dato en vista de lista | ESENCIAL | A3.5 | No existe |
| PR-03 | Estado de unidad con una sola puerta (`cambiarEstadoUnidad`), motivo, bloqueo con expiración y rastro | ESENCIAL | A3.2 | Edición libre de `status` |
| PR-04 | **Listas de precios versionadas** por fase de preventa, con vigencia, precio base USD y equivalente DOP con la tasa del día; cambio masivo con vista previa y aprobación | ESENCIAL | A3.3, A19.2 | Precio pisado en la unidad |
| PR-05 | **Estado legal y documental del proyecto**: clasificación Confotur (no aplica / provisional / definitiva con número y fecha), fiduciaria, permisos, titularidad; semáforo visible para brokers | ESENCIAL | A3.4 | Booleano sin uso |
| PR-06 | Inventario a brokers sin márgenes ni precio real, con DTO por rol y prueba con valores centinela | ESENCIAL | A3.6 | `stripRestrictedPrices` (`domain/rbac.ts:142`), sin cobertura por matriz |
| PR-07 | **Mapa del inventario** (MapLibre): proyectos como puntos/polígonos, agrupación, filtros por zona/estado, tarjeta al pasar | IMPORTANTE | A3.7 | No existe; no hay coordenadas en `projects` |
| PR-08 | Galería, planos de tipología y recorrido 360 por proyecto y por tipología | IMPORTANTE | A3.8 | Solo `videoUrl` |
| PR-09 | Marca «publicar en el portal» por unidad y vista previa de lo que el Portal recibirá | IMPORTANTE | A3.6, I04 | Solo `projects.is_published` |
| PR-10 | Alta y edición masiva (CSV con vista previa y errores por fila; permiso `import`) | IMPORTANTE | A1.10 análogo | Alta unidad por unidad |
| PR-11 | Ficha de unidad en panel lateral: histórico de precio, de estado, reservas y negocios que la miran; comparar hasta 3 unidades | IMPORTANTE | — | Tabla plana |
| PR-12 | Cuadro de disponibilidad exportable (PDF y enlace de solo lectura sin precio real) | IMPORTANTE | A3.5 | No existe |
| PR-13 | Absorción de inventario por proyecto y fase (alimenta Reportes) | DESEABLE | A13.3 | No existe |
| PR-14 | Coincidencia comprador ↔ unidad desde el perfil de demanda (otro grupo aporta el perfil) | DESEABLE | A1.8 | No existe |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta que aporta | Modo | Encaje con nuestro stack | Esfuerzo |
|---|---|---|---|---|---|---|---|
| MapLibre GL JS | `maplibre/maplibre-gl-js` @ `a49fea4eb898` (main, 14-oct-2026); npm `maplibre-gl@6.14.0` (11-oct-2026) | BSD-3-Clause (`LICENSE.txt` leído; el campo de la API de GitHub dice NOASSERTION, el archivo es BSD) | TypeScript, WebGL | Paquete `maplibre-gl`: mapa vectorial, capas GeoJSON, agrupación nativa de puntos (PR-07) | APP | Directo en un componente cliente de Next 15; sin clave si se usa un estilo propio | M |
| react-map-gl (vis.gl) | `visgl/react-map-gl` @ `1afe1a985806`; npm `@vis.gl/react-maplibre@8.1.3` (2-sep-2026) | MIT (`LICENSE` leído, «Vis.gl contributors») | TypeScript/React | Componentes `Map`, `Marker`, `Source`, `Layer`, `Popup` sobre MapLibre; elige `@vis.gl/react-maplibre` (el paquete `react-map-gl` 8.1.3 exige elegir motor) | APP | Peer `react>=16.3`, `maplibre-gl>=4`; compatible con React 19 | S |
| Terra Draw | `JamesLMilner/terra-draw`; npm `terra-draw@1.37.0` + `terra-draw-maplibre-gl-adapter@1.5.0` (6-oct-2026) | MIT (registro npm) | TypeScript | Dibujar y editar el polígono de un proyecto sobre el mapa (PR-07, A3.7) | APP | Adaptador oficial a MapLibre `>=4` | M |
| Turf.js | npm `@turf/area@7.4.0` (3-ago-2026) | MIT (registro npm) | TypeScript | Calcular área/centroide del polígono del proyecto | APP | Solo el subpaquete necesario | S |
| react-zoom-pan-pinch | `BetterTyped/react-zoom-pan-pinch`; npm `4.2.0` (3-sep-2026) | MIT (registro npm) | TypeScript/React | `TransformWrapper`/`TransformComponent` para acercar, arrastrar y pellizcar un plano SVG de torre o masterplan (PR-02, PR-08) | APP | Sin dependencias de motor; táctil | S |
| PMTiles (Protomaps) | npm `pmtiles@4.5.0` (10-ago-2026) | BSD-3-Clause (registro npm) | TypeScript | Servir un archivo de teselas propio (sin depender de un proveedor) si el equipo exige operación local | APP (opcional) | Se registra como protocolo en MapLibre | M |
| OpenFreeMap | openfreemap.org (no repo verificado) | **NO VERIFICADO** (ToS no leídos; la búsqueda no los devolvió) | — | Estilo y teselas públicas sin clave | REF | No usar en producción sin leer ToS y atribución OSM | — |
| Photo Sphere Viewer | `mistic100/Photo-Sphere-Viewer` @ `44bf27c4bf41`; npm `@photo-sphere-viewer/core@5.15.1` (2-ago-2026) | MIT (`LICENSE` leído) | TypeScript | Visor 360 con plugins `markers`, `virtual-tour`, `gallery`, `autorotate` (todos 5.15.1, MIT, registro npm) para PR-08 | APP | Se monta en un `useEffect` de un componente cliente; el envoltorio de terceros `react-photo-sphere-viewer@6.2.3` (MIT, abr-2025) existe pero no hace falta | M |
| Pannellum | `mpetroff/pannellum` @ `99f4afd686e8`; npm `2.5.7` (19-feb-2026) | MIT (`COPYING` leído) | JavaScript, sin tipos | Alternativa más ligera para 360 simple | APP (alterno) | Sin plugins de recorrido; se descarta si se acepta PSV | S |
| Papermark | `mfts/papermark` (LICENSE leído) | AGPLv3 + carpeta `ee/` comercial | Next.js 14, Prisma | Nada para este módulo | REF | — | — |
| Sell.Do / FUB / Salesforce | productos comerciales | — | — | Ideas de producto: matriz de inventario, bloqueo de 15 min, hojas de costos (catálogo A.1) | REF | Solo ideas | — |

**Búsqueda de una matriz de disponibilidad o plano de apilamiento ya hecho (React, permisivo):** busqué «unit availability grid», «floor plan», «stacking plan» y proyectos de desarrolladoras en GitHub; **no hay una pieza reutilizable verificada** (solo editores de planos de arquitectura como `floor-plan-lab`, sin licencia leída, y plugins de WordPress/Flutter). Conclusión honesta: la matriz PR-02 se construye propia con CSS Grid + `react-zoom-pan-pinch` para el plano; el patrón (cada unidad = celda/polígono con id, piso y estado que pinta el color) es ingeniería nuestra, no un proyecto adaptable.
**Qué no adaptamos y riesgo:** PostGIS (extensión de la base) queda diferido: se empieza con `latitude/longitude` numéricos y el polígono como `jsonb` GeoJSON; no verifiqué si la instancia Supabase local trae la extensión (§8). Riesgo de MapLibre: teselas; la decisión de proveedor (propio con PMTiles u otro de pago) es de Wilber. `react-photo-sphere-viewer` y `pannellum-react` no se usan (mantenimiento incierto).

## 5. Diseño y componentes a elevar
| Patrón | Componente concreto | Dónde se usa |
|---|---|---|
| Cabecera de proyecto con foto real, KPI (disponibles/reservadas/vendidas, absorción), estado legal | `Card`, `Badge`, `ChartCard` de `src/components/ui`; foto con `next/image` sobre URL firmada | `/propiedades/[slug]` |
| Pestañas del proyecto: Resumen · Matriz · Lista · Precios · Mapa · Documentos | `Tabs` (`src/components/ui/tabs.tsx`) + `module-tabs.tsx` | detalle |
| Matriz de disponibilidad | Componente propio `MatrizDisponibilidad` (CSS Grid, celdas `button` con `aria-label` «Unidad A-304, 2 hab., US$ …, disponible»), leyenda de estado con icono además de color, `react-zoom-pan-pinch` en móvil | Pestaña Matriz |
| Ficha lateral de unidad | `Sheet` (escritorio) / `Drawer` vaul (móvil) ya instalados | clic en celda o fila |
| Tabla de unidades densa | `data-table.tsx` existente; `@tanstack/react-virtual` (MIT, 3.14.19, registro npm) si pasa de ~300 filas | pestaña Lista |
| Filtros guardados y chips | `Popover` + `Select`; estado en la URL (como hoy) | cabecera |
| Mapa | `@vis.gl/react-maplibre` + `maplibre-gl`, tarjeta con `Popover` | `/propiedades` (alternar Tarjetas/Mapa) |
| Tokens | Sustituir colores crudos por tokens de `docs/DESIGN.md`; estado de unidad con `tone.ts` (existe en `components/ui`) | todo el módulo |
Seis estados por pestaña (carga con esqueleto, vacío con CTA, error con reintento, sin conexión en solo lectura, éxito, sin permiso). Móvil: la matriz se vuelve lista agrupada por piso con filtro; objetivos táctiles ≥48 px (regla de DESIGN.md citada en M22 §3).

## 6. Comunicación con el resto (centralización)
- **Emite (outbox, tras M22-L7 y I00):** `UnidadPublicada`, `UnidadRetirada`, `DisponibilidadCambiada` (ya definidos en I04 §3.2/§5), `PrecioPublicadoCambiado` (nuevo: al activar una lista de precios), `ProyectoEstadoLegalCambiado` (nuevo).
- **Consume:** `ReservaCreada/Vencida/Cancelada/Convertida` (módulo Reservas) y `VentaCerrada` (Negocios, `cerrarNegocioGanado`) para cambiar el estado **solo** por `cambiarEstadoUnidad`; `AvancePublicado` (Avances) para mostrar el % en la ficha.
- **Puertos:** `AlmacenamientoArchivos` (fotos/planos), `PortalPort` (I04), `ReglasPort` (GoRules, solo para tope de descuento en PR-04), futuro `MapaPort` no hace falta (librería de cliente).
- **Datos que comparte:** `units` (lo leen Negocios `deal_properties`, Cotizaciones, Reservas, Contratos, Rentas, Cobros vía `unit_sales`), `projects.confotur_eligible` y la lista de precios (los lee Cotizaciones; cada cotización guarda `price_list_item_id` + snapshot), `files` (planos/fotos) y el módulo Documentos para el expediente legal del proyecto.
- **Regla firmada que se respeta:** precio de lista real y comisión solo admin (#47); nada se elimina (D-10): el borrado de unidad pasa a «retirar del inventario» con motivo y se bloquea si hay venta o reserva viva.

## 7. Lotes asignables
Todos requieren **ficha M04-propiedades en READY** (hoy no existe en `spec/modulos/`; este expediente es su insumo) y, donde se indica, ficha de datos. `OBX` = cola del outbox filtrada por tipo (M22-L7 / I00). `UND` = `cambiarEstadoUnidad` de I04. Producción: Sonnet (decisión #48) salvo indicación; revisión por proveedor distinto (Codex/Antigravity) más D12 en dinero y permisos.

| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| PR-L1 | Corregir el distintivo Confotur: leer `confoturEligible`, tres estados (no aplica/provisional/definitiva), quitar la lista de zonas; prueba de que ningún nombre de zona produce el distintivo | `src/application/proyectos/puertos.ts`, `casos-de-uso.ts`, `src/infrastructure/db/repos/proyectos.ts`, `src/app/api/proyectos/**`, `src/app/(crm)/propiedades/{vista.tsx,_formulario-proyecto.tsx,page.tsx}` y pruebas | M04 | Sonnet | Codex + D14 | — (arreglo; sin esquema) |
| PR-L2 | `error.tsx` y `loading.tsx` del módulo y de `[slug]`; consultas fuera de `page.tsx` (`application/proyectos/consultas.ts`) | `src/app/(crm)/propiedades/**`, `src/application/proyectos/consultas.ts`, `src/infrastructure/db/repos/proyectos-lectura.ts` | M04 | Haiku | D14 | — |
| PR-L3 | Torre, piso, estado de inventario y orientación editables en alta/edición de unidad (API + formulario); prueba de que `unit_inventory_states.legacy_status` y `units.status` no se contradicen | `src/application/proyectos/**`, `src/app/api/proyectos/[id]/unidades/**`, `src/app/(crm)/propiedades/[slug]/vista.tsx`, repos | M04 | Sonnet | Codex | PR-L1 |
| PR-L4 | Retirar `status` de la edición genérica y bloquear archivar unidad/proyecto con venta o reserva viva (409 con motivo) | casos de uso de proyectos, rutas de unidades, prueba de arquitectura | M04 + I04 | Sonnet | D12 + Codex | `UND` (I04) |
| PR-L5 | Esquema: `project_towers`, `unit_types` (planos, m²), `unit_accessories`; migración aditiva con RLS, sin tocar `unit_sales` | `src/infrastructure/db/schema.ts`, `drizzle/00NN_*.sql`, `scripts/seed/*` | M04 (ficha de datos nueva) | Sonnet (D11) | D12 + D14 | PR-L3 |
| PR-L6 | `MatrizDisponibilidad` (componente puro + datos de consulta por torre/piso) con prueba de render por estado y accesibilidad (aria-label, foco, leyenda no solo color) | `src/app/(crm)/propiedades/[slug]/_matriz.tsx`, `src/application/proyectos/consultas.ts`, pruebas | M04 | Sonnet | D07 + Codex | PR-L5 |
| PR-L7 | Ficha lateral de unidad (Sheet/Drawer) con histórico leído de `audit_log` y comparar hasta 3 unidades | `propiedades/[slug]/_ficha-unidad.tsx`, consultas | M04 | Haiku | D14 | PR-L6 |
| PR-L8 | Esquema y casos de uso de listas de precios (`price_lists`, `price_list_items`, vigencias, USD+tasa), activación con aprobación de un segundo admin (patrón #47) y evento `PrecioPublicadoCambiado` | schema, drizzle, `src/application/precios/**`, `src/domain/precios.ts` (+ pruebas) | M04b-precios (ficha nueva) | Sonnet | D12 + Codex | PR-L5, `OBX`, función de dinero compartida (M22-L1) |
| PR-L9 | Pestaña Precios (lista vigente, historial, vista previa de cambio masivo) con centinelas de precio real | `propiedades/[slug]/_precios.tsx`, `src/infrastructure/precios-respuestas.test.ts` (ampliar) | M04b | Sonnet | D12 | PR-L8 |
| PR-L10 | Estado legal del proyecto (`project_legal`: Confotur, fiduciaria, permisos, titularidad) con semáforo | schema, casos de uso, UI | M04c-legal (ficha nueva) | Sonnet | D12 + abogado (UNKNOWN) | PR-L1 |
| PR-L11 | Mapa del inventario: coordenadas en `projects`, componente `MapaProyectos` con `@vis.gl/react-maplibre` + agrupación; sin proveedor de teselas fijado (estilo configurable en `env.ts`) | `package.json`, `schema.ts`, `propiedades/_mapa.tsx`, `src/infrastructure/env.ts` | M04d-mapa | Sonnet | Codex | PR-L2; decisión de teselas (Wilber) |
| PR-L12 | Dibujo de polígono con Terra Draw y área con Turf (solo admin) | `_mapa-editor.tsx`, dominio de geometría | M04d | Sonnet | Codex | PR-L11 |
| PR-L13 | Importación CSV de unidades con vista previa, errores por fila y permiso `import` (primer uso del permiso) | `src/app/api/proyectos/[id]/unidades/importar/route.ts`, `src/domain/csv.ts` (lectura), caso de uso | M04e-importar | Sonnet | D12 (inyección de fórmulas) | PR-L3 |
| PR-L14 | Galería y planos por proyecto/tipología con carga (Uppy o react-dropzone, ver Avances AV-L5) y lightbox | `propiedades/**`, `files` | M04 + Documentos | Sonnet | D14 | AV-L3 (módulo de subida compartido) |
| PR-L15 | Marca «publicar en el portal» por unidad y vista previa del payload | schema (`units.is_published`), UI, evento | I04 | Sonnet | D12 | I04 READY, `OBX` |
| PR-L16 | Cuadro de disponibilidad en PDF y enlace de solo lectura sin precio real | `src/infrastructure/pdf/disponibilidad.tsx` | M04f | Sonnet | D12 | CP-L2 (base PDF) |

## 8. No verificado
- Si la instancia local de Supabase/PostgreSQL trae PostGIS (no consulté la base; ni se debe ejecutar nada). Hasta saberlo, geometría = `jsonb`.
- Términos de uso (ToS) de OpenFreeMap y de cualquier proveedor de teselas; atribución OSM exigida.
- Licencias individuales de los paquetes de Plate y de plugins de Tiptap (no se usan aquí); en este módulo no hay dependencias con esa duda.
- Que `react-map-gl`/`@vis.gl/react-maplibre` 8.1.3 funcione con Next 15 en modo servidor (solo se ha de usar en componentes cliente; sin prueba hoy).
- Si `unit_inventory_states` (tabla con 0 usos en TS) está sembrada con los estados que querríamos (reservada, bloqueada, retenida por dueño); no leí `db/seed.sql`.
- Número real de unidades y torres de producción (el D21 de inventario dice que no hay datos reales; el dataset local es sintético).
- Estado del acceso de los brokers al inventario: afirmo la limitación 1:1 por lectura de código, no la probé en la interfaz.
