# D05 + D04 + D07 · Auditoría visual real y sistema de componentes objetivo

> 14-oct-2026. Perfil D05 (UI y sistema de diseño) con D04 (UX) y D07 (accesibilidad). Revisión independiente pendiente: D07 revisa a D05, D14 a D04/D07.
> Alcance: solo lectura de `src/`. Se escribieron únicamente `capturas/capturar.mjs`, `capturas/medidas.json`, 76 PNG y este documento.
> Origen de la petición: Wilber, 14-oct, «el diseño está muy básico; hay que tener mejores componentes, mejor experiencia de usuario, mejor manejo».

## 0. Veredicto en cinco líneas

1. El problema no es falta de pantallas sino **falta de un sistema**: conviven dos botones (`bits.tsx` `Boton` navy-950 en 25 archivos vía `prototipo-ui`; `button.tsx` shadcn dorado en 3), dos insignias (`Badge` y `Insignia`), 22 archivos con `<select>` nativo, 11 tablas a mano frente a un `DataTable` usado en 3, y 238 clases `slate-*` + 35 hex sueltos contra los tokens de `docs/DESIGN.md`.
2. DESIGN.md manda botón primario **dorado** (`gold-600`); lo que se ve en producción es **navy casi negro** en todas las pantallas. Hay que decidir cuál manda (sección 6, decisión 1).
3. Las dependencias que dan «nivel avanzado» (TanStack Table, dnd-kit, cmdk, react-day-picker, nuqs, embla) **no están instaladas**; el kanban usa arrastre HTML5 nativo sin teclado y la paleta ⌘K es una versión hecha a mano de 400 líneas.
4. La experiencia es estática: no hay edición en línea, vistas guardadas, columnas configurables, atajos, toasts (`toast(` aparece en 0 archivos aunque `sonner` está instalado) ni línea de tiempo.
5. Móvil: estructura correcta (dock, tablas a tarjetas, 0 scroll horizontal en las 19 rutas) pero controles de 28-36 px, pestañas cortadas y búsqueda duplicada.

## 1. Cómo se midió

`capturas/capturar.mjs` (Playwright, Chromium) entra con `POST /api/auth/demo {"role":"admin"}`, recorre 19 rutas a 1440×900 y 390×844 y guarda `<ruta>-1440.png`, `<ruta>-390.png` (primer pliegue) y `*-full.png` (página completa). Resultados crudos en `capturas/medidas.json`. Servidor de revisión :9301 sin reiniciar.

| Ruta | Alto página 1440 | Scroll horizontal (1440 / 390) | Controles <44 px (1440 / 390) | Texto <12 px (1440) | Errores de consola |
|---|---:|---|---:|---:|---:|
| /inicio | 1275 | no / no | 23 / 7 | 10 | 0 |
| /leads | 1655 | no / no | 72 / 73 | 84 | 0 |
| /contactos | 1515 | no / no | 68 / 69 | 56 | 0 |
| /negocios | 1265 | no / no | 20 / 4 | 12 | 0 |
| /negocios?vista=lista | 4090 | no / no | 20 / 4 | 12 | 0 |
| /negocios?vista=analisis | 2275 | no / no | 20 / 4 | 12 | 0 |
| /propiedades | 3804 | no / no | 23 / 7 | 71 | 0 |
| /propiedades/vre-araya-punta-cana | 2082 | no / no | 64 / 48 | 11 | 0 |
| /avances | 900 | no / no | 22 / 6 | 11 | 0 |
| /agenda | 1026 | no / no | 25 / 6 | 11 | 0 |
| /tareas | **44 913** | no / no | **657 / 641** | **647** | **1 (hidratación)** |
| /brokers | 2189 | no / no | 47 / 31 | 11 | 0 |
| /brokers/2 | 1645 | no / no | 33 / 17 | 11 | 0 |
| /comisiones | 900 | no / no | 24 / 8 | 11 | 0 |
| /metas | 1440 | no / no | 34 / 18 | 23 | 0 |
| /comunicaciones | 1158 | no / no | 35 / 19 | 39 | 0 |
| /reportes | 1462 | no / no | 29 / 13 | 10 | 0 |
| /academy | 900 | no / no | 27 / 11 | 11 | 0 |
| /configuracion | 1471 | no / no | 81 / 65 | 11 | 0 |

Contraste: el script cuenta como fallo cualquier texto bajo 4,5:1 (3:1 si es grande). **Salvedad honesta:** mide contra el primer fondo sólido y no interpreta `oklab()` ni degradados, así que los «1,00» y «1,09» (Comunicaciones «TODOS»/«Guardar Plantilla», ficha «QH»/«0%») son falsos positivos (texto blanco sobre navy o sobre degradado). Verifiqué a mano los dos fallos reales de abajo (puntos 2 y 10 de la sección 4). Los casos 4,23-4,36 (etiquetas grises sobre `surface-alt`) están a una décima del AA y hay que confirmarlos con D07 con herramienta de píxel.

Los «controles <44 px» incluyen los 30+ enlaces de la barra lateral (231×32 px, la propia barra de shadcn `h-8`), por eso la columna nunca baja de ~20 en escritorio. DESIGN.md pide 44 px en escritorio y 48 táctil.

## 2. Puntuación por pantalla (0-5)

Escala: 0 ausente · 1 maqueta · 2 básico · 3 correcto · 4 avanzado · 5 referente. J = jerarquía visual, D = densidad útil de información, C = componentes (tablas, tarjetas, gráficas, formularios, vacíos), I = interacción (acciones contextuales, atajos, arrastrar, edición en línea), M = móvil.

| Pantalla | J | D | C | I | M | Media | Qué sostiene la nota (captura) |
|---|:-:|:-:|:-:|:-:|:-:|:-:|---|
| Inicio | 3 | 2 | 2 | 2 | 3 | 2,4 | `inicio-1440`: cinco KPI con cifras en mono y pie «Comparación anterior no disponible» repetido cinco veces en gris 2,56:1; una sola gráfica ausente; listas sin acciones. |
| Leads | 3 | 3 | 3 | 3 | 3 | 3,0 | `leads-1440`: tabla con avatar, canal, estado y WhatsApp/llamada; inspector existe. Filtros desalineados (búsqueda a la izquierda, dos select a la derecha), sin vistas guardadas ni columnas, 649 filas sin virtualizar. |
| Contactos | 3 | 3 | 3 | 2 | 3 | 2,8 | `contactos-1440`: misma tabla; duplicados «Adriana Cruz» ×2 sin fusión visible; sin edición en línea. |
| Negocios · Tablero | 3 | 3 | 3 | 4 | 3 | 3,2 | `negocios-1440`: tarjetas con próxima acción, mover a, WhatsApp, arrastre. **Los 3 filtros apilados a ancho completo (170 px) empujan el tablero bajo el pliegue.** |
| Negocios · Lista | 2 | 2 | 2 | 2 | 2 | 2,0 | `negocios-lista-1440`: 4 filtros apilados (230 px), nombre del contacto parte en dos líneas, insignia «Activo» bajo la etapa, «50 de 184» parcial. |
| Negocios · Análisis | 3 | 3 | 3 | 2 | 3 | 2,8 | `negocios-analisis-1440`: KPI y barras correctos; mismos filtros apilados; sin tendencia ni embudo de conversión. |
| Propiedades | 2 | 2 | 2 | 2 | 3 | 2,2 | `propiedades-1440`: tarjetas de 280 px con **un anillo dorado decorativo y 0 % gigante en lugar de foto**; 2 por fila, 3 800 px para 8 proyectos; «Ver detalle» en dorado. |
| Ficha de proyecto | 2 | 3 | 2 | 2 | 2 | 2,2 | `proyecto-1440`: mismo placeholder; tabla de unidades correcta pero sin matriz de disponibilidad ni filtros; iconos de editar/borrar de 24 px. |
| Avances de obra | 2 | 1 | 2 | 1 | 2 | 1,6 | `avances-1440`: estado vacío con botón alineado a la izquierda y sin línea de tiempo de fases. |
| Agenda | 2 | 1 | 2 | 1 | 2 | 1,6 | `agenda-1440`: cuadrícula semanal vacía, sin eventos, sin día/mes, sin crear arrastrando. |
| Tareas | 2 | 1 | 2 | 2 | 1 | 1,6 | `tareas-1440`, `tareas-1440-full`: **636 filas en una lista de 44 913 px**, sin agrupar, sin paginar. Hidratación fallida en consola. |
| Brokers | 3 | 2 | 3 | 2 | 3 | 2,6 | `brokers-1440`: tarjetas legibles; barra de meta vacía; «Asignar propiedades» parece texto, no botón; sin clasificación comparativa. |
| Ficha de broker | 2 | 2 | 2 | 1 | 3 | 2,0 | `broker-ficha-1440`: bloque de datos plano; «Ver proyecto» como texto; sin línea de tiempo ni gráfica. |
| Comisiones | 3 | 1 | 3 | 1 | 3 | 2,2 | `comisiones-1440`: tres KPI en 0 y vacío; correcto pero sin datos nada se puede juzgar; no hay cálculo visible por regla. |
| Metas | 3 | 3 | 3 | 2 | 3 | 2,8 | `metas-1440`: anillo, tabla con barras de progreso y gráfica; la gráfica «Cierres por mes» no tiene valores ni eje. |
| Comunicaciones | 2 | 3 | 2 | 3 | 2 | 2,4 | `comunicaciones-1440`: editor con variables y simulador (lo más interactivo del producto), pero textos de 9-10 px, huecos y tres estilos tipográficos. |
| Reportes | 3 | 3 | 4 | 3 | 3 | 3,2 | `reportes-1440`: mejor pantalla: pestañas, gráfica con leyenda y tabla alternativa. «Filtros» aparece dos veces; fechas nativas `dd/mm/yyyy`. |
| Academy | 2 | 1 | 2 | 1 | 2 | 1,6 | `academy-1440`: sin contenido; vacío correcto pero sin CTA útil («Restablecer filtros» sin haber filtrado). |
| Configuración | 3 | 3 | 3 | 2 | 2 | 2,6 | `configuracion-1440`: tabla con «Reenviar» como texto en negrita y acciones de 24 px; todos los usuarios «Pendiente». |
| **Media del producto** | 2,6 | 2,1 | 2,5 | 2,0 | 2,5 | **2,3** | Lo «básico» que percibe Wilber está en **I (interacción) y D (densidad)**. |

## 3. Qué ya existe para reutilizar (no reconstruir)

| Pieza | Archivo | Estado | Decisión |
|---|---|---|---|
| Primitivas shadcn (button, input, select, dialog, dropdown, popover, tabs, tooltip, sheet, drawer/vaul, skeleton, sonner, card, separator, sidebar) | `src/components/ui/*.tsx` | Instaladas; `Select` shadcn existe pero 22 archivos usan `<select>` nativo | Es la base; migrar los nativos. |
| `DataTable` (orden, paginación 25, selección, acciones masivas, tarjetas en móvil, estado vacío) | `src/components/ui/data-table.tsx` (381 líneas, sin TanStack) | Solo en leads, contactos y comisiones | Evolucionar a v2 con TanStack Table conservando su API `Columna<F>`. |
| `ChartCard` (6 estados) + `MetricChart` (Recharts) + `chart.tsx` shadcn | `ui/chart-card.tsx`, `_ui/metric-chart.tsx` | Sólido | Reutilizar para KPI y gráficas nuevas. |
| Tonos semánticos | `ui/tone.ts` | Sólido | Única fuente de color de estado. |
| Estados vacío / sin resultados / permiso | `_ui/estados.tsx` (`Vacio` es solo título+texto, sin icono ni acción) | Pobre | Reemplazar por `EmptyState` con icono, acción y variante. |
| Esqueletos | `_ui/cargando.tsx` `Esqueleto` (6 usos) + `ui/skeleton.tsx` (1 uso) | Duplicado | Unificar en `skeleton.tsx`. |
| Paleta ⌘K | `_ui/command-palette.tsx` (400 líneas a mano) | Funciona, sin cmdk | Rehacer sobre `cmdk`. |
| Inspector | `leads/inspector.tsx`, `negocios/inspector.tsx` (367 líneas) | Dos versiones distintas | Extraer un `Inspector` común. |
| Historial | `_ui/historial.tsx` (componente de servidor, 104 líneas) | Lista plana | Pasar a línea de tiempo agrupada por día. |
| Dock móvil, cabecera, módulos | `_ui/mobile-dock.tsx`, `crm-header.tsx`, `module-tabs.tsx` | Correctos; objetivos táctiles pequeños | Ajustar tamaños. |
| `Boton`, `Insignia`, `Nota` | `ui/bits.tsx` | Compite con `button.tsx`/`badge.tsx` | Convertir en envoltorios de shadcn. |
| `PageHeader`, `Metric`, `Badge`, `Modal`, `Avatar` | `_ui/prototipo-ui.tsx` (25 importadores) | Del prototipo; `Modal` duplica `dialog.tsx` | Mantener `PageHeader`/`Avatar`; sustituir `Modal` y `Badge`. |

Selección de componentes ya aprobada en `docs/DESIGN.md` (tabla «Pieza del CRM → Componente»: collapsible-05, table-20, kanban diceui, page-header-5, sheet-01, originui input/calendar/tabs, progress-metric-card, charts-1, timeline-3, file-dropzone, empty-state, primitive-sonner, command-menu-04). **Ninguna se ha materializado todavía**: es la deuda real. Este plan la convierte en lotes.

## 4. Puntos críticos visuales (top 15, por impacto)

| # | Crítico | Evidencia (captura · archivo) | Efecto para el usuario |
|---|---|---|---|
| 1 | **Dos sistemas de botón y color primario contradictorio.** DESIGN.md: dorado; producción: navy-950. Otros botones son blancos con borde, o texto en negrita sin forma. | `leads-1440`, `inicio-1440`, `brokers-1440` · `ui/bits.tsx:40`, `ui/button.tsx:11`, 25 archivos importan `prototipo-ui` | La marca no se reconoce; no hay jerarquía de acciones; «Asignar propiedades», «Reenviar», «Ver proyecto» no parecen pulsables. |
| 2 | **KPI de Inicio ilegibles.** Pie de 12 px en `#94A3B8` sobre blanco = 2,56:1 (verificado), repetido «Comparación anterior no disponible» en cada tarjeta. | `inicio-1440` · `inicio/vista.tsx:44`, `tokens.css:214` `.analytics-kpi small` | Primera pantalla del producto incumple AA y comunica «sin datos». |
| 3 | **Tareas: 636 filas, 44 913 px, 647 elementos <12 px, error de hidratación.** | `tareas-1440`, `tareas-1440-full` · `tareas/vista.tsx:98` | Pantalla inutilizable como bandeja de trabajo; consume memoria; el error de hidratación puede romper acciones. |
| 4 | **Filtros apilados a ancho completo en Negocios** (3 en tablero y análisis, 4 en lista = 170-230 px). | `negocios-1440`, `negocios-lista-1440` · `negocios/filtros.tsx:42,102` | El tablero queda bajo el pliegue en una pantalla de 900 px; es la pantalla estrella del CRM. |
| 5 | **Propiedades sin fotografía:** anillo decorativo y «0 %» gigante, 2 tarjetas por fila. | `propiedades-1440`, `proyecto-1440` · `propiedades/vista.tsx:130`, `.property-visual` en `globals.css:290` | Inventario sin imagen no vende; contradice «propiedad: imagen 4:3 solo donde ayude» (hay imagen a ayudar y no se usa). 3 800 px para 8 proyectos. |
| 6 | **22 archivos con `<select>` nativo y 5 con `type="date"` nativo.** | `leads-1440`, `reportes-1440` (fechas `dd/mm/yyyy`), `comisiones-1440` | Aspecto de sistema operativo, sin búsqueda en listas largas (brokers, proyectos), sin chips de filtro activo. |
| 7 | **Agenda vacía y rígida:** solo semana laboral, sin eventos pintados, sin día/mes, «← Semana anterior» como texto. | `agenda-1440` · `agenda/vista.tsx` | Un calendario sin eventos no se puede evaluar ni usar. |
| 8 | **Tablas a mano en 11 archivos frente a un `DataTable` en 3**; `negocios/lista.tsx:126` es una tabla propia: nombre parte en 2 líneas, insignia bajo la etapa, 50 de 184. | `negocios-lista-1440` | Cada lista se comporta distinto; mejoras de tabla no se heredan. |
| 9 | **Doble búsqueda y objetivos táctiles de 28-36 px.** En escritorio: campo «Buscar…» en la barra lateral y en la cabecera; en móvil: campo en cabecera y botón dorado de lupa en el dock. Toggle 28×28, notificaciones 32×32, «Nueva acción» 36×32. | `inicio-390`, `leads-390` · `crm-sidebar-menu.tsx:49`, `crm-header.tsx`, `mobile-dock.tsx` | Dos accesos a lo mismo; toques fallidos en móvil. |
| 10 | **Etiqueta de sección (eyebrow) 11 px, `gold-700` sobre `gold-100/70` = 3,97:1 (verificado)**, y texto dorado «Ver detalle» a 2,63:1, contra la regla «nunca dorado como texto sobre claro». | todas las pantallas · `_ui/prototipo-ui.tsx:25`, `propiedades/vista.tsx:177` | Fallo AA en cada cabecera. Regla propia de DESIGN.md incumplida. |
| 11 | **Texto diminuto sistémico:** 84 nodos <12 px en Leads, 71 en Propiedades, 56 en Contactos; `text-[9px]` en 3 archivos y `text-[10-11px]` en 16. | `leads-1440`, `comunicaciones-1440` | Lectura cansada; DESIGN.md pide 13/18 como mínimo en etiquetas. |
| 12 | **Estados vacíos sin acción y descuidados:** Avances (botón alineado a la izquierda), Academy («Restablecer filtros» sin filtros), Agenda, Comisiones. | `avances-1440`, `academy-1440`, `comisiones-1440` · `_ui/estados.tsx:14` | Todo el producto con datos de demo parece vacío; no guían el primer uso. |
| 13 | **Cifras con cero tachado (fuente monoespaciada) en KPI y tablas** (`$193,500`, `0%`, `US$0`), mezcla de tres familias. | `inicio-1440`, `comisiones-1440` · `font-mono` en 10 archivos | Aspecto de terminal, no de «banca patrimonial»; resta confianza a las cifras de dinero. Usar Hanken con `tabular-nums`. |
| 14 | **Sin retroalimentación de acciones:** 0 llamadas a `toast()`; sin deshacer; mover de etapa y asignar no confirman. | `negocios-1440` · `ui/sonner.tsx` sin uso | El usuario no sabe si la acción ocurrió. |
| 15 | **Móvil: pestañas cortadas y listas sin acciones.** «Contac…» cortado en Leads; Reportes con dos botones «Filtros»; tarjetas de leads sin swipe ni acción primaria visible. | `leads-390`, `reportes-390` | Funciona pero se siente portado, no pensado para móvil. |

Hallazgos menores: demasiada separación vertical bajo cada cabecera (~200 px antes del contenido); la barra lateral repite el buscador y no se contrae a iconos de forma útil; gráfica de Metas sin valores; datos de demo con duplicados («Dra. Sofía Almonte» en cuatro etapas) que ocultan problemas reales de unicidad.

## 5. Sistema de componentes objetivo

Licencias: campo `license` del registro npm leído el 14-oct-2026. **El archivo LICENSE y el commit fijado los lee D21 en el intake de cada lote antes de instalar** (regla de `_PLANTILLA-EVOLUCION.md`). Bloques de 21st.dev/Origin UI: licencia por componente, se verifica en la ficha de cada uno; los de DESIGN.md ya fueron descartados o aceptados con ese criterio. «Falta» = hoy no instalado en `package.json`.

| Patrón | Componente concreto | Licencia (npm) | Hoy en el repo | Pantallas que lo adoptan |
|---|---|---|---|---|
| Tabla de datos (filtros, orden, columnas visibles, densidad, vistas guardadas, selección, virtualización) | `@tanstack/react-table` v9 + `@tanstack/react-virtual`; bloque shadcn `data-table` / `table-20` (felipemenezes098) como estructura; vistas guardadas con `nuqs` (URL) y persistencia propia en BD | MIT / MIT / MIT | `DataTable` propio sin TanStack. **Falta** los tres | Leads, Contactos, Negocios Lista, Comisiones, Tareas, Brokers (vista tabla), Configuración (usuarios), Reportes (detalle) |
| Barra de filtros con chips | `FilterBar` propia sobre `Popover` + `Command` (cmdk) + `Select` de shadcn; referencia de estructura Origin UI `filter` (se rechazó «Filter Token Bar» id 26824 por 81 colores fijos) | MIT (shadcn/cmdk) | Selects nativos | Todas las listas y Negocios (tablero, lista, análisis) |
| Selector con búsqueda (broker, proyecto, contacto) | `Combobox` shadcn (`Popover`+`Command`) | MIT | **Falta** `command.tsx` y `cmdk` | Filtros, asignación de broker, formularios |
| Selector de fechas y rangos | `react-day-picker` v10 vía `calendar` shadcn / originui `calendar` (469) | MIT | **Falta** | Reportes, Agenda, Tareas, Negocios (fecha de cierre), formularios |
| Kanban | `@dnd-kit/core` + `@dnd-kit/sortable` con la estructura del bloque `kanban` de diceui (id 29221) | MIT / MIT | Arrastre HTML5 en `tarjeta-negocio.tsx` sin teclado. **Falta** dnd-kit | Negocios (tablero), Leads (columnas por estado, opcional), Tareas (tablero por estado, opcional), Avances (fases) |
| Inspector lateral | `Sheet` shadcn lado derecho 420 px + `Tabs` (Resumen, Actividad, Notas, Documentos) + acciones rápidas fijas abajo; bloque `sheet-01` (shadcnspace) | MIT | `Sheet` existe; dos inspectores distintos | Leads, Negocios, Contactos, Brokers, Propiedades/Unidad, Tareas, Comisiones |
| Línea de tiempo de actividad | Bloque `timeline-3` (olewandowski1) sobre `_ui/historial.tsx`, agrupada por día, con iconos por tipo de evento (outbox) | por verificar en ficha del bloque | `Historial` lista plana | Inspectores, Ficha de proyecto (obra), Ficha de broker, Avances |
| Formularios largos por pasos | `Stepper` propio sobre `Tabs`/`Dialog` + `react-hook-form` con `zodResolver` (Zod ya en el repo); guardado de borrador | MIT (RHF) | Formularios con estado local; `_formulario-proyecto.tsx` | Nuevo proyecto, nueva unidad, registrar lead, invitar broker, nueva cita |
| KPI | `KpiCard` (valor Hanken tabular, delta con tono semántico, sparkline Recharts de 40 px) sobre `Card`; bloque `progress-metric-card` (id 15024) | MIT (Recharts) | `Metric` del prototipo y `.analytics-kpi` en CSS | Inicio, Negocios análisis, Comisiones, Metas, Brokers, Reportes |
| Gráficas | Recharts vía `chart.tsx` + `ChartCard` (ya existen); añadir embudo, barras apiladas con etiquetas y tendencia; `charts-1` (olewandowski1) como estilo. **Tremor (`@tremor/react`, Apache-2.0)**: no instalar (su v3 trae su propio sistema de tokens y, según su documentación, Tailwind v3: verificar); usar sus bloques solo como referencia visual | MIT (Recharts) / Apache 2.0 (Tremor) | Sólido | Inicio, Reportes, Metas, Brokers, Comisiones |
| Calendario (agenda) | Vista propia semana/día/mes sobre `react-day-picker` para el selector + cuadrícula con eventos; alternativa a evaluar en intake: `@schedule-x/react` | MIT (ambos); también `@fullcalendar/react` MIT en su núcleo (plugins premium excluidos) | Cuadrícula vacía propia | Agenda, Avances (hitos), Tareas (vista calendario) |
| Galería de fotos | `embla-carousel-react` + `yet-another-react-lightbox`; `file-dropzone` (joyco, id 19201) para subir; `next/image` | MIT / MIT | **Falta** ambas | Propiedades (tarjeta con portada real), Ficha de proyecto, Avances (fotos de obra) |
| Matriz de disponibilidad | Cuadrícula unidades × estado (torre/nivel × unidad) con color por tono, leyenda y popover de detalle; solo CSS grid + `Tooltip`/`Popover` | — (propia) | Tabla simple de unidades | Ficha de proyecto, Propiedades |
| Estados vacíos | `EmptyState` (bloque `empty-state` id 1435) con icono, título, texto, acción primaria y secundaria; variantes `primero`, `sin-resultados`, `sin-permiso`, `error` | MIT | `Vacio`/`SinResultados` pobres | Avances, Academy, Agenda, Comisiones, Tareas, toda lista |
| Paleta de comandos | `cmdk` con grupos (Ir a, Crear, Recientes, Contactos y negocios por búsqueda), atajos `g l`, `g n`, `n l`; referencia `command-menu-04` (id 27378) solo en estructura | MIT | `command-palette.tsx` a mano (400 líneas) | Cabecera global, lanzador móvil |
| Notificaciones | `sonner` (ya instalado y envuelto en `ui/sonner.tsx`) para confirmación + deshacer; **centro de notificaciones** en popover de la campana, alimentado por el outbox | MIT | Instalado, sin uso | Toda acción mutadora; cabecera |
| Navegación móvil | `Drawer` vaul (instalado) para filtros y «Más»; dock de 4 destinos + acción central; cabecera 44 px; pestañas con desplazamiento y fundido; barra de acción inferior fija | MIT | Dock y vaul existen | Todas |
| Estado en la URL | `nuqs` para pestaña, filtros, orden y vista (compartir enlace, volver atrás) | MIT | **Falta** | Todas las listas y Negocios |
| Edición en línea | Celda editable propia (clic → input/select → Enter guarda, Esc cancela, toast con deshacer) sobre `DataTable` v2 y los puertos de `src/application/**` | — | No existe | Leads (estado, responsable), Tareas (fecha, estado), Negocios Lista (etapa, monto), Contactos |

Dependencias nuevas que requieren autorización de Wilber (modifican `package.json`): `@tanstack/react-table`, `@tanstack/react-virtual`, `@dnd-kit/core`, `@dnd-kit/sortable`, `cmdk`, `react-day-picker`, `nuqs`, `embla-carousel-react`, `yet-another-react-lightbox`, `react-hook-form` (+ `@hookform/resolvers`). Todas MIT según npm; ninguna arrastra un segundo sistema de primitivas (coherente con la regla de DESIGN.md de no mezclar Base UI/React Aria).

## 6. Decisiones que necesito de Wilber antes de despachar

1. **Color del botón primario.** DESIGN.md = dorado (`gold-600`, texto navy). Producción = navy-950. Recomiendo seguir DESIGN.md (una sola acción dorada por vista) y dejar el navy como secundario fuerte; es lo que distingue la marca y lo que da jerarquía. Si prefiere navy, hay que cambiar DESIGN.md (y el token `--primary`) en lugar del código.
2. Autorizar las dependencias de la sección 5 (lote por lote o todas).
3. Propiedades: ¿hay fotografías reales de los proyectos o se generan portadas? Sin fotos, el lote L9 solo puede mejorar el diseño del placeholder.
4. Agenda: ¿se construye propia o se adopta `@schedule-x/react`? Recomiendo evaluar ambas en el intake de D21 (medio día).

## 7. Lotes asignables

Reglas comunes: solo los archivos listados; TypeScript estricto; sin colores sueltos (tokens); seis estados; 44 px de objetivo; `npm run typecheck && lint && test && build` en verde antes de que Claude aplique el parche; revisión por proveedor distinto del que produjo; cada lote lleva ficha `READY` (D02 las abre) y se reclama en `.viltrum/vre-os/EN-CURSO.md`. Modelo: **Haiku** = mecánico y acotado; **Sonnet** = diseño de API de componente o lógica de interacción.

| Lote | Entrega verificable | Archivos permitidos | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|
| **L1 Fundamentos: un botón, una insignia, una cabecera** | `Boton` y `Insignia` de `bits.tsx` delegan en `button.tsx`/`badge.tsx`; primario según decisión 1; `Badge` de `prototipo-ui` sustituido; `Modal` → `dialog.tsx`; cifras en Hanken `tabular-nums`; cabecera de página más compacta (≈ 120 px menos de aire) | `src/components/ui/bits.tsx`, `button.tsx`, `badge.tsx`, `src/app/(crm)/_ui/prototipo-ui.tsx`, `src/app/tokens.css`, `src/app/globals.css` (solo reglas de botón, insignia, cifras, cabecera) | Sonnet | D07 + D14 | Decisión 1 |
| **L2 Accesibilidad rápida** | Pie de KPI y todo `slate-400` sobre blanco a `muted`; eyebrow a `gold-800` sobre `gold-100`; «Ver detalle» a navy; sidebar y cabecera con objetivos ≥ 44 px (escritorio) y 48 (dock); mínimo 12-13 px; informe de contraste con herramienta de píxel | `src/app/tokens.css`, `src/app/globals.css`, `_ui/crm-sidebar-menu.tsx`, `_ui/crm-header.tsx`, `_ui/mobile-dock.tsx`, `propiedades/vista.tsx` (solo la clase de «Ver detalle»), `_ui/prototipo-ui.tsx` (solo eyebrow) | Haiku | D07 | L1 (para no chocar en `prototipo-ui`) |
| **L3 Filtros: FilterBar, Combobox, DatePicker** | `ui/command.tsx`, `ui/calendar.tsx`, `ui/combobox.tsx`, `ui/date-picker.tsx`, `ui/filter-bar.tsx`; en Negocios los filtros pasan a una **fila única de chips** de 48 px; el resto de `<select>` se migra en el lote L3b | `src/components/ui/command.tsx`, `calendar.tsx`, `combobox.tsx`, `date-picker.tsx`, `filter-bar.tsx`, `src/app/(crm)/negocios/filtros.tsx`, `negocios/vista.tsx`, `package.json` (cmdk, react-day-picker, nuqs) | Sonnet | D07 | L1, autorización de dependencias |
| **L3b Migración de selects y fechas** | Los 22 `<select>` y 5 `type="date"` sustituidos por `FilterBar`/`Combobox`/`DatePicker`; sin cambios de lógica | `src/app/(crm)/{leads,contactos,comisiones,reportes,metas,avances,propiedades,tareas}/**/*.tsx` (solo marcado de filtros) | Haiku | D14 | L3 |
| **L4 DataTable v2** | TanStack Table: columnas visibles, orden multiple, densidad (cómoda/compacta), selección, acciones masivas, virtualización >200 filas, vistas guardadas (URL con nuqs, persistencia en `user_views` solo con ficha de D11), edición en línea de celdas; API `Columna<F>` compatible | `src/components/ui/data-table.tsx`, `ui/data-table-*.tsx` (nuevos), `package.json` (react-table, react-virtual) | Sonnet | D14 + D07 | L3 |
| **L4b Migrar listas a DataTable v2** | Leads, Contactos, Negocios Lista, Comisiones, Configuración/usuarios, Brokers tabla usan `DataTable` v2; elimina las tablas a mano | `src/app/(crm)/{leads,contactos,comisiones,configuracion,brokers}/vista.tsx`, `negocios/lista.tsx` | Haiku (una pantalla por parche) | D14 | L4 |
| **L5 Tareas usable** | Agrupar Vencidas / Hoy / Próximas / Sin fecha con contadores; paginar o virtualizar; casilla de completar con toast y deshacer; arregla la hidratación; vista «Equipo» condensada | `src/app/(crm)/tareas/vista.tsx`, `tareas/page.tsx` | Sonnet | D14 | L4 (virtualización) y L14 |
| **L6 Kanban con dnd-kit** | Arrastre accesible por teclado y táctil, indicador de destino, totales por columna en vivo, sin cambios en los puertos de `src/application/**` | `src/app/(crm)/negocios/tablero.tsx`, `tarjeta-negocio.tsx`, `negocios/tablero.test.ts`, `package.json` (dnd-kit) | Sonnet | D07 + D14 | L3 |
| **L7 Inspector común + línea de tiempo** | `ui/inspector.tsx` (Sheet 420 px, pestañas, acciones fijas) y `ui/timeline.tsx`; Leads y Negocios usan el común; `Historial` agrupa por día | `src/components/ui/inspector.tsx`, `ui/timeline.tsx`, `src/app/(crm)/{leads,negocios}/inspector.tsx`, `_ui/historial.tsx` | Sonnet | D07 | L1 |
| **L7b Inspector en el resto** | Contactos, Brokers, Unidades y Comisiones abren inspector al hacer clic en fila | `src/app/(crm)/{contactos,brokers,comisiones}/**/*.tsx`, `propiedades/[slug]/**/*.tsx` | Haiku | D14 | L7, L4b |
| **L8 KPI y gráficas** | `ui/kpi-card.tsx` con delta y sparkline; embudo y tendencia en `MetricChart`; Inicio con KPI + gráfica de embudo + «Mi día» | `src/components/ui/kpi-card.tsx`, `_ui/metric-chart.tsx`, `inicio/vista.tsx`, `tokens.css` (`.analytics-kpi*`), `negocios/analisis.tsx`, `metas/vista.tsx`, `comisiones/vista.tsx` | Sonnet | D07 + D14 | L1, L2 |
| **L9 Propiedades: foto, galería y matriz** | `PropertyCard` con portada real (`next/image`) y degradado de reserva sin anillo; vista Cuadrícula/Tabla/Mapa-lista; ficha con galería (embla + lightbox) y matriz de disponibilidad unidades × estado; iconos de acción con etiqueta | `src/app/(crm)/propiedades/vista.tsx`, `propiedades/[slug]/**/*.tsx`, `src/components/ui/gallery.tsx`, `ui/availability-matrix.tsx`, `globals.css` (`.property-visual`), `package.json` (embla, lightbox) | Sonnet | D07 | L1, decisión 3 |
| **L10 Agenda viva** | Vistas día/semana/mes, eventos pintados con tono por tipo, creación al hacer clic en hueco, arrastrar para mover, hoy resaltado, lista en móvil | `src/app/(crm)/agenda/vista.tsx`, `agenda/page.tsx`, `src/components/ui/calendar-*.tsx` (nuevos) | Sonnet | D07 + D14 | L3, decisión 4 |
| **L11 Estados vacíos y esqueletos** | `EmptyState` con icono, acción y variantes; `Esqueleto` unificado en `skeleton.tsx`; aplicados a Avances, Academy, Agenda, Comisiones, Tareas y listas | `src/app/(crm)/_ui/estados.tsx`, `_ui/cargando.tsx`, `src/components/ui/skeleton.tsx`, `src/components/ui/empty-state.tsx`, `src/app/(crm)/{avances,academy,comisiones}/vista.tsx` | Haiku | D06 | L1 |
| **L12 Paleta ⌘K con cmdk** | Grupos Ir a / Crear / Recientes / Buscar registros; atajos de teclado `g`+letra; un solo buscador en cabecera (se quita el de la barra lateral) | `src/app/(crm)/_ui/command-palette.tsx`, `_ui/crm-header.tsx`, `_ui/crm-sidebar-menu.tsx`, `src/components/ui/command.tsx` | Sonnet | D07 | L3 |
| **L13 Formularios por pasos** | `ui/stepper.tsx` y patrón de formulario largo con borrador; Nuevo proyecto y Registrar lead en pasos con validación Zod por paso | `src/components/ui/stepper.tsx`, `src/app/(crm)/propiedades/_formulario-proyecto.tsx`, `leads/vista.tsx` (solo el formulario), `package.json` (react-hook-form) | Sonnet | D14 + D12 (datos personales) | L1 |
| **L14 Avisos y centro de notificaciones** | Toast con deshacer en mover etapa, asignar, completar tarea y guardar; popover de campana con lista del outbox | `src/components/ui/sonner.tsx`, `_ui/crm-header.tsx` (solo campana), `negocios/api.ts` y `negocios/usar-entorno.ts` (solo disparo de aviso) | Haiku (toasts) → Sonnet (centro) | D07 | L1 |
| **L15 Móvil** | Cabecera 44 px; pestañas con scroll y fundido; filtros en `Drawer` (vaul); acción primaria fija abajo; tarjetas de lead con acción visible; un solo buscador | `_ui/mobile-dock.tsx`, `_ui/crm-header.tsx`, `_ui/module-tabs.tsx`, `leads/vista.tsx`, `reportes/filtros-vista.tsx` | Sonnet | D07 + D14 | L2, L3 |

Orden recomendado (cuatro olas): **Ola 1** L1 → L2 + L11 + L14(toasts) en paralelo (sin dependencias nuevas, ganancia inmediata visible). **Ola 2** L3 → L3b + L12 + L15. **Ola 3** L4 → L4b + L5 + L6 + L7 → L7b. **Ola 4** L8, L9, L10, L13. Los lotes que tocan `vista.tsx` del mismo módulo no pueden correr a la vez (reclamar en `EN-CURSO.md`).

## 8. Criterio de «hecho» para cada pantalla (para D14 y D07)

Una pantalla sube de nivel cuando: ninguna `slate-*` ni hex suelto; un solo botón primario visible; filtros en una fila; la acción más frecuente se hace sin salir de la lista (inspector o edición en línea) y confirma con toast; estado en la URL; seis estados presentes; a 390 px el contenido usa el ancho sin scroll horizontal y los controles miden ≥ 48 px; contraste ≥ 4,5:1 verificado con medición de píxel; captura antes/después guardada en `.viltrum/vre-os/evolucion/capturas/`.
