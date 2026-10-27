# Quisqueya Home Private Desk

## Dirección

Una consola privada de operaciones inmobiliarias inspirada en banca patrimonial y hospitalidad caribeña contemporánea. Debe transmitir confianza, calma y control. El lujo aparece en la precisión, el espacio y los materiales; nunca en ornamentos excesivos.

Paleta **clara**: lienzo gris azulado muy suave, superficies blancas, tinta azul marino y una barra lateral azul marino profundo. El dorado es el acento de la marca y se usa con moderación.

No usar una estética SaaS genérica, glassmorphism constante, tarjetas flotantes por todas partes, gradientes metálicos agresivos ni grandes imágenes decorativas dentro de vistas de trabajo.

## Color

Valores tomados del CRM en producción (`src/app/globals.css`). Tres se ajustaron el 30/09/2026 para cumplir WCAG AA; están marcados con *.

| Token | Valor | Uso |
|---|---:|---|
| `canvas` | `#F3F5F8` | Fondo general |
| `surface` | `#FFFFFF` | Paneles, tablas, campos |
| `surface-alt` | `#F8F9FB` | Encabezados de tabla, zonas secundarias |
| `surface-hover` | `#F5F7FB` | Hover y fila seleccionada |
| `ink` | `#172036` | Títulos, cifras y texto principal |
| `text` | `#3D485F` | Texto de tabla y cuerpo |
| `muted` * | `#646D85` | Metadatos y ayudas (antes `#687189`, 4,46:1 sobre el lienzo) |
| `line` | `#DFE3EB` | Bordes y divisores |
| `input-line` | `#CFD5DF` | Borde de campos y botón secundario |
| `navy-950` | `#10172D` | Barra lateral, panel de marca del login |
| `navy-900` | `#1D2B53` | Acción secundaria, cifras destacadas, avatar |
| `navy-700` | `#344872` | Estados intermedios de navegación |
| `navy-100` | `#E8ECF4` | Hover de acciones secundarias |
| `gold-600` | `#C7990E` | Botón primario y navegación activa (como fondo) |
| `gold-700` * | `#9B7300` | Anillo de foco sobre superficies claras |
| `gold-800` | `#765600` | Texto dorado sobre `gold-100` |
| `gold-100` | `#FFF6D9` | Fondo de insignias doradas |
| `success` / `success-bg` | `#16734A` / `#E9F7EF` | Estados positivos |
| `warning` / `warning-bg` | `#8A5300` / `#FFF3E0` | Atención (nuevo: el CSS actual no lo tenía) |
| `danger` / `danger-bg` | `#A13F43` / `#FDECED` | Error y perdido |
| `info` / `info-bg` | `#315F8C` / `#EBF3FB` | Información |

**Barra lateral** (sobre `navy-950`): texto `#AEB8CC`, números y metadatos `#7A89A8` * (antes `#71809F`, 4,47:1), divisores blanco al 10 %, hover blanco al 8 %.

### Reglas del dorado

- Se reserva para **una acción primaria por vista**, la navegación activa, el foco y los datos financieros importantes. No es el color de "éxito".
- **Nunca como texto sobre fondo claro:** `gold-600` sobre blanco da 2,63:1. Si hace falta texto dorado, `gold-800` sobre `gold-100`.
- Sobre el dorado, el texto va en azul marino (`#161D31` o `navy-950`), nunca en blanco.

## Tipografía

- **Titulares y cifras:** `Hanken Grotesk`, peso 600-700.
- **Interfaz y texto:** `Atkinson Hyperlegible Next`, peso 400-600.
- Texto base de escritorio: `16px/24px`.
- Detalles de lead y notas: `18px/28px`.
- Etiquetas: `13px/18px`, semibold; evitar mayúsculas continuas salvo microetiquetas y encabezados de tabla.
- KPI principal: `40px/44px`.
- Ancho máximo de lectura: 72 caracteres.

## Forma y espacio

- Escala base de 8 px.
- Sidebar fijo: 248 px.
- Cabecera de contenido: 72 px.
- Margen de página: 32 px; 20 px en tableta; 16 px en móvil.
- Radio: 7 px para campos y botones, 10 px para paneles, píldora solo para estados.
- Bordes de 1 px y cambios tonales; sombras solo en drawers y modales.
- Altura mínima interactiva: 44 px escritorio, 48 px táctil.

## Estructura

El shell es estable en todas las pantallas. La navegación nunca cambia de orden entre roles; los módulos no autorizados desaparecen sin dejar huecos.

Cada vista operativa usa:

1. Cabecera con título, contexto, búsqueda y una acción primaria.
2. Barra de filtros compacta.
3. Área principal de trabajo.
4. Inspector lateral para detalles y acciones rápidas cuando corresponda.

Evitar mosaicos de tarjetas cuando una tabla, lista, calendario o kanban comunica mejor.

## Componentes

- **Botón primario:** fondo `gold-600`, texto `#161D31`, 44 px de alto. Sin degradado.
- **Botón secundario:** fondo `surface`, borde `input-line`, texto `navy-900`; hover `navy-100`.
- **Tabla:** encabezado fijo en `surface-alt`, filas de 56-64 px, hover y selección en `surface-hover`, acciones al final.
- **Inspector:** 400-440 px, contexto completo sin abandonar la lista.
- **Pipeline:** columnas proporcionadas al contenido; encabezado fijo; tarjetas compactas con próxima acción visible.
- **KPI:** cifra en `navy-900`, etiqueta y tendencia; sin iconos decorativos.
- **Estado:** píldora pequeña con su par de color semántico (`success`, `warning`, `danger`, `info`) y texto.
- **Navegación activa:** fondo `gold-600`, texto `navy-950`.
- **Propiedad:** imagen 4:3 solo donde ayude a elegir; vistas administrativas priorizan inventario, precio y disponibilidad.
- **Timeline de obra:** hitos, evidencia fotográfica, porcentaje, fecha y responsable.

## Movimiento

- Duraciones entre 140 y 240 ms.
- Entrada de drawers: 220 ms con `cubic-bezier(.2,.8,.2,1)`.
- Hover: cambio tonal de 140 ms; no desplazar ni escalar tarjetas.
- Pipeline: al mover una oportunidad, animar posición y confirmar el cambio de etapa; no usar rebotes.
- Skeletons con pulso suave y sin shimmer agresivo.
- Respetar `prefers-reduced-motion`.
- Ninguna animación debe retrasar una acción de negocio.

## Accesibilidad

- Contraste WCAG AA como mínimo. Todos los pares de texto de la tabla de color se verificaron el 30/09/2026.
- Foco de teclado visible con anillo de 2 px: `gold-700` sobre superficies claras (4,33:1) y `gold-600` sobre la barra lateral (6,76:1). El `gold-600` sobre blanco no alcanza el 3:1 que exige WCAG para elementos no textuales.
- No depender solo del color para estados.
- Tablas navegables por teclado y con encabezados semánticos.
- Formularios con etiquetas persistentes y errores junto al campo.
- No usar texto inferior a 13 px.

## Implementación: Tailwind CSS v4 + shadcn/ui

El CRM adopta Tailwind CSS v4 y shadcn/ui (primitivas Radix) en la reestructuración (fase R5). Los tokens de arriba se traducen a las variables de shadcn, así que cualquier componente que use sus clases semánticas (`bg-background`, `text-muted-foreground`, `bg-primary`…) toma esta paleta sin tocarlo.

| Variable de shadcn | Token |
|---|---|
| `--background` / `--foreground` | `canvas` / `ink` |
| `--card`, `--popover` / `-foreground` | `surface` / `ink` |
| `--primary` / `--primary-foreground` | `gold-600` / `#161D31` |
| `--secondary` / `--secondary-foreground` | `navy-100` / `navy-900` |
| `--muted` / `--muted-foreground` | `surface-alt` / `muted` |
| `--accent` / `--accent-foreground` | `navy-100` / `navy-900` |
| `--destructive` | `danger` |
| `--border` / `--input` / `--ring` | `line` / `input-line` / `gold-700` |
| `--sidebar` / `--sidebar-foreground` | `navy-950` / `#AEB8CC` |
| `--sidebar-primary` / `-foreground` | `gold-600` / `navy-950` |
| `--sidebar-accent` / `-foreground` | blanco al 8 % sobre `navy-950` / `#FFFFFF` |
| `--sidebar-border` / `--sidebar-ring` | blanco al 10 % / `gold-600` |
| `--radius` | `10px` (campos: `calc(var(--radius) - 3px)`) |
| `--chart-1` / `--chart-2` | `navy-900` / `gold-600`; el resto se valida con la herramienta de color antes de usarse |

Los estados (`success`, `warning`, `danger`, `info` y sus fondos) se añaden como variables propias, porque shadcn solo trae `destructive`.

## Bibliotecas de componentes (21st.dev)

Seleccionados el 30/09/2026 con el mismo criterio para todos: se sacó el código de 49 candidatos y se midió qué proporción de sus colores usa tokens semánticos de shadcn (así toman esta paleta solos), cuántos efectos llamativos trae (degradados, desenfoque, sombras grandes, animaciones), qué dependencias añade y qué atributos de accesibilidad tiene.

| Pieza del CRM | Componente | Autor | Por qué |
|---|---|---|---|
| Base | Primitivas oficiales de shadcn/ui | shadcn | Botón, input, select, dialog, dropdown, badge, tabs, popover. Todo lo demás se apoya en ellas. |
| Barra lateral | `collapsible-05` "Sidebar Nav Group" (id 24865) | felipemenezes098 | 100 % tokens, sin efectos, sin dependencias. Se monta sobre el `Sidebar` de shadcn. |
| Tablas | `table-20` "Complex Data Table" (id 22177) | felipemenezes098 | 100 % tokens, sin efectos. TanStack Table, el estándar de las tablas de shadcn. |
| Pipeline | `kanban` "Kanban Board" (id 29221) | diceui | Arrastre accesible por teclado con dnd-kit. Pocos colores, fáciles de pasar a tokens. |
| Cabecera + búsqueda + acción | `page-header-5` "Search Toolbar Page Header" (id 26793) | olewandowski1 | 100 % tokens, 11 atributos de accesibilidad, sin dependencias. Es la cabecera que pide la sección Estructura. |
| Inspector lateral | `sheet-01` "Sheet" (id 25002) | shadcnspace | El `Sheet` de shadcn sobre Radix, 100 % tokens. |
| Campos y fechas | `input` (173), `calendar` (469) | originui | 100 % tokens; el calendario usa react-day-picker, el mismo de shadcn. |
| Pestañas | `tabs` (425) | originui | 100 % tokens, sobre Radix. |
| KPI | `progress-metric-card` (id 15024) | makviesainte | 100 % tokens, sin dependencias ni iconos decorativos. |
| Gráficos | `charts-1` "Revenue Bars Chart" (id 29223) | olewandowski1 | 100 % tokens, sin efectos. Recharts, el motor del `Chart` de shadcn. |
| Historial y actividad | `timeline-3` "Activity Timeline" (id 28340) | olewandowski1 | 100 % tokens, sin dependencias. Sirve para el historial de auditoría y el timeline de obra. |
| Subida de fotos | `file-dropzone` (id 19201) | joyco | Sin dependencias, 9 atributos de accesibilidad. Tres colores fijos que se pasan a tokens. |
| Vacíos | `empty-state` (id 1435) | serafimcloud | 100 % tokens, sin dependencias. |
| Avisos | `primitive-sonner` (id 27363) | isaiahbjork | Sonner, el sistema de avisos oficial de shadcn. |
| Búsqueda global (⌘K) | `Command` de shadcn (cmdk), con `command-menu-04` (id 27378, ephraimduncan) como referencia | — | El de referencia trae 13 colores fijos e iconos de Tabler: se toma la estructura, no el estilo. |

**Descartados, y por qué:** los de Aceternity, Magic UI y la mayoría de Ruixen son de marketing (héroes animados, efectos) y quedan para el portal y la página pública. Los construidos sobre Base UI o React Aria (coss.com, wensity, cnippet, varios de fechas) mezclarían un segundo sistema de primitivas con Radix. `Command Palette` (id 2075) tenía 172 colores fijos y `Filter Token Bar` (id 26824), 81. Para la agenda semanal no apareció ningún componente que cumpla: se conserva la vista actual, migrada a tokens.

**Para añadir un componente nuevo:** que use tokens semánticos y no colores fijos, que no traiga efectos prohibidos en la sección Dirección, que esté hecho sobre Radix, que añada las mínimas dependencias posibles y que tenga una licencia que permita usarlo. Todo componente se recolorea con esta paleta: ninguno entra con sus colores de origen.

## Reglas por rol

- El administrador puede crear propiedades, ver métricas globales y configurar.
- La asistente ve carga operativa, asignaciones y agenda; no ve precios base ni rendimiento global.
- El broker ve su cartera y sus metas. No mostrar `Nueva propiedad`, reportes globales ni datos de otros brokers.
