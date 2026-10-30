# Rediseño móvil · Pasada 1 de 2

Rama `orq/claude-web/rediseno-movil-p1`, creada desde `codex/wilber-crm-20261026`.
Sin merge, sin PR y sin despliegue.

## Qué cambia

**Piezas compartidas, que llegan a todos los módulos:**

| Pieza | Antes | Ahora |
|---|---|---|
| `PageHeader` (27 vistas) | eyebrow, descripción larga y botones apilados a lo ancho | En móvil: título de 18 px, sin eyebrow ni descripción, acciones en cuadrícula de 2 columnas a 44 px (también si la vista las envuelve en un `<div>`). En escritorio no cambia. |
| «Ver como broker» | bloque fijo de 3 filas en cada pantalla | Escritorio: botón flotante discreto con popover. Móvil: sección dentro de la hoja «Más». Con la vista prestada activa queda una franja fina de aviso de solo lectura. |
| Estado de conexión | fila «Red disponible · Sincronización» en cada pantalla | Solo aparece cuando no hay red. |
| Hoja «Más» del dock | panel fijo | Bottom sheet de **vaul** que se arrastra entre dos puntos de anclaje (60 % y 94 %), con asa, Escape y foco atrapado. Módulos en cuadrícula de 3 columnas con icono. |
| `Dialog` (Radix/shadcn) | modal centrado | Móvil: hoja inferior a todo el ancho, con scroll propio y zona segura. Desde `sm`: modal centrado. |
| Modales propios (`.modal-backdrop`) | centrados | Anclados abajo en teléfono (regla en `tokens.css`). |
| `DataTable`, tarjeta móvil | etiquetas en MAYÚSCULAS de 10,5 px en una sola columna | Dos columnas con etiquetas legibles de 13 px, insignia arriba a la derecha y acciones de contacto en el pie. |
| `ResumenCompacto` (KPIs) | alto mínimo de 96 px y dos líneas de detalle | 72 px y una línea de detalle en móvil. |
| Barras de secciones (brokers, comunidad, agenda, tareas, documentos, portal) | píldoras que partían el texto en dos líneas | Pestañas compartidas `ModuleTabs` con desplazamiento horizontal. |
| Avisos «Vista previa · falta…» | párrafos largos | Tres líneas como máximo en teléfono; el texto completo sigue en el DOM. |
| Margen lateral móvil | 12 px | 16 px |

**Por módulo:**

- **Inicio:** se quitan el saludo «Buenos días», la píldora «Operación inmobiliaria privada», el texto de «Cola de la jornada» y el bloque «Accesos directos», que además enlazaba a módulos sin comprobar el permiso. «Registrar lead» y «Tablero» quedan en una fila, los pendientes de hoy en chips y los KPIs son tarjetas compactas que se pueden tocar. Los estados de lead se muestran en español («Contactado», no `contacted`).
- **Leads:** tarjeta compacta con identidad y estado arriba, presupuesto y responsable en dos columnas, y canal, espera y WhatsApp/llamar en el pie. Pasa de ~11 líneas a 4. En móvil se ocultan los KPIs, porque ya los cuentan las pestañas de estado. Los filtros caben en 2 columnas. La nota de voz IA abre como hoja inferior compacta.
- **Inventario:** el aviso de confidencialidad ocupa una línea, el selector Tarjetas/Lista/Mapa es segmentado y las 3 acciones secundarias pasan a un menú «⋯». Las tarjetas son más bajas, con menos texto («17 de 20 disponibles», «En venta», «Rango comercial») y la insignia Confotur corta.
- **Contactos, Agenda y Tareas:** títulos más cortos y en español (p. ej. «Tareas por broker» en vez de «To-Do List & Asignación…»). Las barras de vista se desplazan en horizontal y los indicadores de Tareas van en 2 columnas.

No se tocan el menú lateral ni el buscador.

## Librerías

No se añadió ninguna dependencia. Las que hacen falta ya estaban en `package.json`, y sumar otras solo engordaría el bundle:

- **vaul 1.1**: drawer con anclajes y arrastre nativo. Ahora mueve la hoja «Más» y es el patrón recomendado por shadcn para hojas inferiores.
- **radix-ui + shadcn/ui** (Dialog, Popover, DropdownMenu): accesibles por teclado y con foco gestionado. Se usan para el diálogo en hoja inferior, el popover de «Ver como broker» y el menú de acciones del catálogo.
- **sonner 2**: los toasts ya estaban cableados (`Toaster` en el layout) y se mantienen.
- **motion 13**: es el sucesor de framer-motion y ya está instalado. En esta pasada no hizo falta animar nada más, así que no se instala framer-motion aparte.
- **Tailwind 4.3**: con `justify-center-safe` el contenido que se desborda no queda fuera de la pantalla.

## Verificación

- `npm run typecheck`: limpio.
- `npm run lint`: 0 errores y 4 avisos, todos anteriores a esta rama (había 8; los 4 de las navegaciones tocadas quedaron resueltos).
- `npm test`: **1216 pruebas · 1214 aprobadas · 0 fallos · 2 omitidas**.
- `npm run build`: correcto.
- Se corrigió una prueba intermitente anterior a esta rama (`google-cuentas.test.ts`). Fallaba 1 de cada 16 veces cuando la firma aleatoria ya terminaba en «0». Tras el cambio pasó 30 de 30 corridas.
- Ningún módulo desborda en horizontal a 390 px ni a 1440 px (`scrollWidth − innerWidth = 0` en las 25 rutas).

## Capturas

`antes/` y `despues/`, con el formato `<módulo>-movil-390.jpg` (390×844 a 2x) y `<módulo>-escritorio-1440.jpg`, a página completa. Las páginas muy largas se recortan a 12 000 px.

Módulos: inicio, leads, negocios, contactos, propiedades, agenda, tareas, comisiones, reportes, academy, aprobaciones, automatizaciones, avances, brokers, comunicaciones, comunidad, configuración, documentos, metas, portal, posventa y reservas. Fichas de detalle: `leads-1000000`, `contactos-1000000` y `propiedades-vre-olea-at-cap-cana`.

Estados solo en `despues/`: `panel-mas-media` y `panel-mas-completa` (los dos anclajes de la hoja), `modal-nota-voz`, `propiedades-menu-acciones` y `dialogo-hoja-inferior`.

Se capturaron sobre una base local con la semilla del repositorio (`scripts/seed`), con el acceso de evaluación (`CRM_EVAL_LOGIN=1`, solo en localhost) y el rol de administrador. No contienen datos reales.

## Pendiente para la pasada 2

- Negocios (kanban en móvil), Reportes (gráficos) y Configuración: solo recibieron las mejoras compartidas.
- Las fichas de detalle (lead, proyecto, contacto) tienen secciones largas que conviene plegar en acordeón.
- Comprobar con lector de pantalla la hoja «Más» y el diálogo en hoja inferior (los atributos ARIA son los de Radix).
- Los comentarios de revisión en vivo de Wilber.
