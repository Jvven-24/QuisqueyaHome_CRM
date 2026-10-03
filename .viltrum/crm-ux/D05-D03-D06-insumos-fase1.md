No pude guardar el archivo: el entorno bloqueó la escritura. Dejo el entregable completo a continuación.

# D05 + D03 + D06 · Insumos de fase 1

Fecha: 2026-10-03. Dispatch: `20261003T204212Z-D05-codex`. Versión: 1.  
Clasificación: `CAMBIO_UI` · CRM/ERP · R3 · F3. Productor: D05.  
Estado: **especificación propuesta para revisión independiente**; no constituye aprobación, gate, C1 ni implementación.

## 1. Mandato, evidencia y límites

Entregar la especificación del shell y de Inicio, la matriz de estados y el contrato de módulo/datos, manteniendo rutas, permisos y fronteras SOLID. No añadir reglas comerciales ni presentar muestras como operación.

Se leyeron completos `PERFIL.md` y `skills/patron-consola/SKILL.md` del dispatch, además de `TAREA.md`. Se contrastaron:

- `.viltrum/crm-ux/D09-redisenio-fase1.md`.
- `.viltrum/crm-ux/D04-crm-ux-audit.md`.
- `.viltrum/crm-ux/D05-review-HND-002.md`.
- `docs/DESIGN.md` y `docs/R_RELEVO.md`.
- Routing, orchestration, doctrina de estados, skill PXIL, recursos y checklists pertinentes.
- Shell, Inicio completo, puerto, consulta, contenedor y adaptador Dashboard.
- Actor/RBAC, primitivas locales, manifiesto y selección de lead.

D04 se presenta internamente como pendiente, pero `D05-review-HND-002.md` registra `VEREDICTO: APROBADO`. Se hereda esa revisión documental; no acredita pruebas en navegador ni aprobación de esta especificación.

El subagente `contrato_datos` leyó completo el mismo perfil y la skill antes de analizar las fuentes. Su inventario se contrastó con el código. Su participación fue colaboración de producción, **no revisión independiente**.

Convenciones:

- **E:** comprobado en fuente.
- **P:** propuesta.
- **NV:** no verificado en ejecución.
- **C:** `src/app/(crm)/`.
- **R:** `src/infrastructure/db/repos/dashboard.ts`.

No se ejecutaron git/gh, npm, build/dev, consultas de base, migraciones, servidores, instalaciones ni acciones de producción. No se sincronizó Figma ni se modificó código. No se generaron capturas adicionales.

Navegador, teclado, lector de pantalla, contraste computado, permisos vivos, versión publicada y CI: **NV**.

### Qué faltó a D09 y qué resuelve esta entrega

| Bloqueo de D09 | Respuesta |
|---|---|
| B01: ceros/vacío/error indistinguibles de muestra | Contrato observado y decisión de disponibilidad; no inferir procedencia en cliente |
| B02: periodos y meta no acreditados | Mapa exacto de consultas y condiciones para habilitar métricas |
| B03: alcance por rol en vez de permiso | Contrato de autorización por recurso; pendiente corrección/revisión D10/D12 |
| B04: radar sin criterio real | Cola de recientes, sin prioridad, SLA ni próxima acción inventada |
| B05: matriz y copy incompletos | Matriz S1–S6/I1–I5, aplicación por rol y textos concretos |
| B06: nombre fijo | Cabecera y saludo neutrales; sin identidad nominal ficticia |

Esta entrega resuelve las entradas documentales. **No corrige el backend ni declara cerrados B01–B04.**

## 2. D05 · Fundaciones y componentes

### Fuente única y tokens

`DESIGN.md` gobierna la propuesta; `src/app/tokens.css` es la fuente ejecutable vigente. No copiar hexadecimales a las vistas. No reordenar capas/imports, activar preflight ni retirar `globals.css` como efecto de fase 1.

| Semántica | DESIGN → consumo |
|---|---|
| Lienzo / texto principal | `canvas #F3F5F8` / `ink #172036` → `bg-background`, `text-foreground` |
| Panel / popover | `surface #FFFFFF` → `bg-card`, `bg-popover` |
| Cuerpo / secundario | `text #3D485F` / `muted #646D85` → `text-text`, `text-muted-foreground` |
| Zona secundaria / hover | `surface-alt #F8F9FB` / `surface-hover #F5F7FB` → `bg-muted`, `bg-surface-hover` |
| Primaria | `gold-600 #C7990E` / `#161D31` → `bg-primary`, `text-primary-foreground` |
| Secundaria | `surface` + `input-line #CFD5DF` + `navy-900 #1D2B53` → Button `outline` |
| Borde / foco claro | `line #DFE3EB` / `gold-700 #9B7300` → `border-border`, `ring-ring` |
| Sidebar / activo | `navy-950 #10172D`; texto `#AEB8CC`; activo `gold-600/navy-950` → clases `sidebar` |
| Foco sidebar / metadatos | `gold-600` / `#7A89A8` → `ring-sidebar-ring`, `text-sidebar-meta` |
| Éxito / advertencia | `success #16734A` + `success-bg #E9F7EF`; `warning #8A5300` + `warning-bg #FFF3E0` |
| Error / información | `danger #A13F43` + `danger-bg #FDECED`; `info #315F8C` + `info-bg #EBF3FB` |
| Tipografía | `font-heading`: Hanken Grotesk 600–700; `font-sans`: Atkinson Hyperlegible Next 400–600 |
| Escala usada | Cuerpo 16/24; título/detalle 18/28; etiqueta 13/18 semibold; KPI 40/44 |
| Ritmo | Base 8 px; separación 8/16/24/32; márgenes móvil/tableta/escritorio 16/20/32 |
| Forma | Campo/botón `rounded-md` 7 px; panel `rounded-lg` 10 px; borde 1 px; píldora solo para estado |
| Medidas | Sidebar 248 px; cabecera 72 px; target escritorio ≥44 px, táctil ≥48 px; lectura ≤72 caracteres |
| Movimiento | `--duration-hover` 140 ms; `--duration-drawer` 220 ms y `--ease-drawer`; reducir movimiento con `prefers-reduced-motion` |

Excepciones existentes:

- `bg-muted` resuelve directamente `surface-alt` porque `--muted` sigue reservado por el legado. No corregirlo desde una vista.
- KPI 40/44, altura táctil y algunas medidas de composición todavía no tienen alias semántico propio. Centralizar su receta en `tokens.css` durante una implementación autorizada, sin repetir literales por región.
- El tema vigente es **solo claro**. El perfil genérico exige claro/oscuro, pero `tokens.css` documenta que oscuro sería una función nueva fuera del milestone. Se propone N/A oscuro para este alcance, pendiente ratificación D07/D00.
- El dorado no se usa como texto sobre blanco ni como éxito. Los enlaces de texto usan `navy-900` o `foreground` con subrayado. Button `link` actual usa `text-primary`: requiere adaptación al reutilizarlo sobre superficie clara.

### Reutilizar, adaptar e instalar

Inventario **E**: `components.json` usa `new-york`, RSC/TSX, variables CSS, `tokens.css` y Lucide. React 19, Next 15, Tailwind 4 y `radix-ui` están declarados. No hay Command/cmdk, Breadcrumb, Card, Alert ni Progress locales.

| Pieza | Decisión y uso |
|---|---|
| Sidebar, grupos, menú y badges | Reutilizar `sidebar.tsx`; adaptar agrupación, etiquetas y tamaños |
| Button, Badge, Skeleton, Separator, Tooltip | Reutilizar; no crear primitivas equivalentes |
| Dialog/Sheet | Reutilizar para paleta/móvil; ajustar títulos, cierre, scroll y foco |
| Input/Label | Reutilizar para búsqueda de módulos |
| DropdownMenu | Reutilizar para rol/sesión y Cerrar sesión |
| Sonner | Reutilizar una sola instancia; errores persistentes además del aviso transitorio |
| `command` | Instalar variante Radix/cmdk: paleta de destinos autorizados |
| `breadcrumb` | Instalar: orientación semántica con Next Link |
| `card`, `alert` | Instalar: paneles regionales y mensajes visibles, sin sombras por defecto |
| `progress` | Instalar cuando se habilite una meta verificable |
| Lista/radar/agenda | Componer `ol/li`, enlaces y paneles existentes |
| Chart, Calendar, DataTable | No necesarios para Inicio de fase 1: el puerto no ofrece series ni agenda real |

Comandos propuestos para el implementador, **no ejecutados**:

```powershell
npx.cmd shadcn@latest add command breadcrumb card alert --dry-run
npx.cmd shadcn@latest add command breadcrumb card alert

# Solo cuando la meta tenga fuente y periodo verificables:
npx.cmd shadcn@latest add progress --dry-run
npx.cmd shadcn@latest add progress
```

La CLI oficial permite previsualizar cambios con `--dry-run`. Revisar que genere la variante Radix compatible con este proyecto antes de añadir. No usar `init`, `apply`, `--all` ni `--overwrite`; preservar las primitivas adaptadas y registrar versión resuelta, manifiesto y lockfile. El comando no garantiza por sí mismo selección de base en todas las versiones. [CLI oficial](https://ui.shadcn.com/docs/cli).

Command usa cmdk; Breadcrumb y Progress tienen variantes oficiales Radix. [Command](https://ui.shadcn.com/docs/components/radix/command), [Breadcrumb](https://ui.shadcn.com/docs/components/radix/breadcrumb), [Progress](https://ui.shadcn.com/docs/components/radix/progress).

La fuente shadcn declara MIT; conservar el aviso. Versiones/licencias transitivas e integración efectiva: **NV**, revisión D21/D12 antes de adopción. [Licencia](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

No se adoptan fichas privadas K04/K08/K14 ni código 21st: la auditoría informa fuente ausente y esa disponibilidad actual no se revalidó. Ninguna composición propia se atribuye a esas fichas.

Variantes utilizadas:

- Button `default`: primaria única.
- Button `outline`: navegación secundaria.
- Button `ghost`: controles del shell.
- Reposo, hover, foco y activo: tokens del sistema.
- Deshabilitado: acción imposible con razón visible.
- Ocupado: bloquear doble envío y anunciar texto.
- Solo lectura: permite leer/enlazar; no equivale a deshabilitado.
- Alert: texto e icono, sin depender exclusivamente del color.
- Skeleton: estructura estable; nunca representación de permiso denegado.

No usar tamaños `xs/sm` para los controles principales.

## 3. D05 · Recetas visuales por región

### Shell

| ID | Región y contrato |
|---|---|
| **S1 Sidebar** | Navy, identidad actual `/brand/app-icon-192.png` y marca textual si falla la imagen. Grupos siempre en orden: Hoy, Comercial, Inventario, Equipo y resultados, Sistema. Hoy: Inicio/Agenda/Tareas. Comercial: Leads/Contactos/Pipeline/Comunicaciones. Inventario: Propiedades/Avances. Equipo: Brokers/Metas/Comisiones/Academy/Reportes. Sistema: Configuración. Filtrar `MODULOS` por `can(view)` en servidor y omitir grupos vacíos. Orden interno fijo entre roles; quitar numeración por índice visible. |
| **S2 Contadores** | `SidebarMenuBadge`, sin color de alerta automática. Solo junto a enlaces con dato y permiso acreditados. Broker Leads ← `misLeadsCount`, “Leads asignados”. Asistente Leads ← `leadsSinAsignarCount`, “Leads sin asignar”. Asistente Tareas ← `tareasPendientesCount`, “Tareas pendientes”. Cero real muestra 0; dato ausente no muestra badge. Admin no tiene contador inequívoco solicitado: omitir. Todos desactivados con el puerto actual. No llamar Dashboard desde layout para cada módulo ni usar `leadsRecientes.length` como total. |
| **S3 Migas** | `nav aria-label="Ruta de navegación"`. Inicio tiene solo página actual. En otro módulo: Inicio enlazable si permitido → módulo actual. No inventar “Hoy” como ruta. No resolver identidades de registros desde pathname. Único h1 en contenido. |
| **S4 Buscador** | Etiqueta “Buscar módulos”; ayuda “Busca secciones a las que tienes acceso”. Activador estilo campo abre S5. No anunciar búsqueda de clientes/leads. En móvil puede abreviarse a botón con nombre accesible completo. |
| **S5 Paleta** | CommandDialog: título “Ir a un módulo”, descripción “Solo se muestran módulos disponibles para tu sesión”, campo “Buscar módulos”, mismos grupos que S1. Ctrl+K/⌘K abre y enfoca; flechas recorren; Enter navega a una ruta de `MODULOS`; Escape cierra y restaura foco. No ejecutar CRUD, consultas de entidades ni enlaces externos. |
| **S6 Usuario** | Etiqueta de rol y “Sesión activa”; avatar de rol decorativo. No foto/nombre inventados. Dropdown con rol y Cerrar sesión. Mantener una sola acción de logout coherente con el footer. Mostrar ocupado/error y comprobar respuesta del POST existente antes de afirmar sesión cerrada. |

### Inicio S01 / M14

Orden de lectura: **título/contexto → resumen KPI → radar → indicadores complementarios → embudo/meta → agenda**. En móvil, el radar queda cerca del resumen.

Tres niveles: h1, h2 regional, etiquetas/valores. Sin ranking de demanda ni progreso Academy de muestra.

| ID | Región, datos y comportamiento |
|---|---|
| **I1 Héroe/KPI** | Superficie clara, sin imagen/degradado. H1 “Inicio”; contexto por rol; `fechaTexto` como fecha de pantalla, no de sincronización. Saludo “Hola” mientras no haya identidad real. Máximo tres KPI: Admin leads/negocios/cierres; Broker cartera/citas/meta; Asistente sin asignar/citas/tareas. Primaria “Abrir leads” con `leads:view`; si falta, “Abrir agenda” con `activities:view`; si ambos faltan, no inventar primaria. |
| **I2 Radar** | Panel “Leads recientes”; subtítulo “Hasta 4 registros recientes disponibles para tu sesión”. No “urgentes” ni “requieren atención”. Usar `id/name/project/source/stage` solo tras corregir fuente/alcance. Enlaces `/leads?lead=id`, acción “Abrir lead”. Motivo “Registro reciente”; no usar `next` actual como obligación. “Ver leads” al listado autorizado. Longitud 4 no representa total. |
| **I3 KPI complementarios** | Sin duplicar héroe. Admin: conversión y volumen, con denominador/divisa/periodo verificados. Broker: Mi nivel. Asistente: Avances por revisar solo con consulta real. Panel sobrio; cero distinto de ausencia. Sin tendencia, variación o sparkline inexistentes. |
| **I4 Embudo/meta** | Admin: “Embudo”, habilitado únicamente con conteos reales por etapa; hoy “El resumen por etapa no está disponible en Inicio”. Broker: “Mi meta”, con logrado/meta/periodo y Progress verificables; hoy “La meta del periodo no está disponible en Inicio”. Asistente: omitir embudo/rendimiento global. No multiplicar `leadsMesCount` por constantes. |
| **I5 Agenda** | Sin citas literales. Hoy: “Las próximas actividades no están disponibles en Inicio” y “Abrir agenda” con `activities:view`. Un conteo no permite dibujar horas/títulos/ubicaciones. Con un contrato futuro acordado: lista cronológica y `time` semántico. No alta desde Inicio ni integración nueva. |

Estado inmediato de I1/I2/I3: **no mostrar números ni identidades del DTO actual como verificados**.

Textos de disponibilidad:

- “Los indicadores de Inicio todavía no tienen una fuente verificable”.
- “La lista de leads de Inicio no está disponible”.

Es indisponibilidad conocida por contrato, no colección vacía ni offline supuesto. Los módulos reales siguen accesibles con sus guardias.

### Responsive propuesto

**Sin evidencia de render en esta sesión.**

| Ancho | Composición |
|---|---|
| **320** | Sidebar overlay. Cabecera con menú/búsqueda/rol; migas en línea separada si necesitan espacio. Margen 16, contenido útil 288. Héroe/KPI apilados, radar enseguida, agenda en columna. Wrapping de nombres/acciones. Diálogo dentro del viewport, scroll vertical propio y cierre alcanzable. |
| **390 / 430** | Igual; controles táctiles ≥48. No ocultar motivo o próxima acción acreditada. No forzar tres columnas KPI. |
| **768** | Sidebar expandido y márgenes 20 dejarían 480 px útiles. Iniciar navegación contraída offcanvas, con trigger visible también en escritorio. Una columna principal; dos KPI solo si caben. No alterar `use-mobile` para fingir dispositivo. |
| **1024** | Sidebar 248, márgenes 20: 736 útiles. Radar de ancho total; complementarios/agenda pueden usar dos columnas si cada región conserva ≥320 útiles. |
| **1440** | Sidebar 248, márgenes 32: 1128 útiles. Héroe hasta tres KPI; radar y columna meta/agenda aproximadamente 2:1, gap 24. Nombres completos. |
| **Intermedios/zoom** | Decidir por ancho útil. Colapsar antes del recorte; sin scroll horizontal del documento; foco no oculto por header sticky. Zoom/reflow pendientes, especialmente 200 % y equivalente a 320 CSS px. |

A 768, `SidebarTrigger` actual `md:hidden` y `useIsMobile <768` no satisfacen por sí solos la receta. D09 debe mantener trigger visible y estado contraído controlado cuando corresponda.

## 4. D06 · Matriz de estados y roles

### Reglas de selección

Estas son especificaciones **P**, no estados comprobados en runtime.

La matriz de 11 regiones × 6 estados se aplica a admin, broker y assistant mediante la tabla de roles posterior: **198 combinaciones**, sin duplicar los textos comunes.

Permiso denegado prevalece sobre carga/error/vacío. Omitir datos, totales y pistas de identidad.

- **Carga:** petición real pendiente.
- **Vacío:** respuesta autorizada válida sin registros/meta. Cero es un dato válido.
- **Error:** fallo confirmado sin diagnosticar desconexión.
- **Offline:** navegador sin conexión o fallo de conectividad confirmado; no toda excepción de DB.
- **Éxito:** lectura válida; no acredita actualización en tiempo real.
- **Indisponibilidad contractual:** mensajes de §3 hasta modificar fuente. No convertirla en vacío/error técnico ni ofrecer reintentos inertes.

### Carga, vacío y error

| Región | Carga: texto → acción | Vacío: texto → acción | Error: texto → acción |
|---|---|---|---|
| **S1 Navegación** | “Cargando tus módulos…” → esperar, skeleton | “Tu sesión no tiene módulos disponibles” → Cerrar sesión | “No se pudo cargar la navegación” → Reintentar lectura |
| **S2 Contadores** | “Cargando cantidades…” → esperar, sin cifra falsa | “0 registros” → módulo autorizado | “No se pudo obtener la cantidad” → omitir badge; actualización manual si existe fuente |
| **S3 Migas** | “Cargando ubicación…” → esperar | N/A: ruta autorizada siempre tiene etiqueta; usar nombre del módulo si falta metadato | “No se pudo identificar esta sección” → Ir a Inicio si permitido |
| **S4 Buscador** | “Preparando búsqueda de módulos…” → esperar | “No hay módulos para buscar” → Cerrar búsqueda | “No se pudo abrir la búsqueda” → Reintentar |
| **S5 Paleta** | “Cargando módulos…” → esperar | “No hay módulos que coincidan con tu búsqueda” → Limpiar búsqueda | “No se pudieron cargar los módulos” → Reintentar o cerrar |
| **S6 Sesión** | “Comprobando sesión…”; logout “Cerrando sesión…” → bloquear doble envío | Sin actor: “Inicia sesión para continuar” → `/login` | “No se pudo cerrar la sesión. Inténtalo de nuevo” → Reintentar; no afirmar logout |
| **I1 Héroe/KPI** | “Cargando resumen de Inicio…” → skeleton | “No hay registros en el alcance consultado” → destino autorizado del rol | “No se pudo cargar el resumen de Inicio” → Reintentar lectura |
| **I2 Radar** | “Cargando leads recientes…” → skeleton | “No hay leads recientes en tu alcance” → Ver leads | “No se pudieron cargar los leads recientes” → Reintentar; conservar regiones válidas |
| **I3 Complementarios** | “Cargando indicadores…” → skeleton | “No hay información para este indicador” → destino autorizado; cero válido se muestra como 0 | “No se pudo cargar este indicador” → Reintentar región si está soportado |
| **I4 Embudo/meta** | “Cargando resumen de etapas…” / “Cargando tu meta…” → esperar | Admin: “No hay negocios en el alcance consultado”. Broker: “No tienes una meta para el periodo consultado” → Pipeline/Metas permitido | “No se pudo cargar el resumen de etapas” / “No se pudo cargar tu meta” → Reintentar lectura |
| **I5 Agenda** | “Cargando próximas actividades…” → skeleton | “No hay próximas actividades en el periodo consultado” → Abrir agenda | “No se pudieron cargar las próximas actividades” → Reintentar lectura |

### Offline, éxito y permiso

| Región | Sin conexión: texto → acción | Éxito: contenido → acción | Permiso insuficiente: texto → acción |
|---|---|---|---|
| **S1** | “Sin conexión. No se pueden abrir nuevas secciones” → Reintentar | “Módulos disponibles” + activo → Abrir módulo | “No tienes módulos disponibles para esta sesión” → Cerrar sesión; omitir enlaces |
| **S2** | “Cantidades no disponibles sin conexión” → omitir badge; Reintentar lectura | “Cantidad de registros disponibles” + cifra real/alcance → Abrir módulo | Omitir badge restringido, sin cifra ni mensaje persistente |
| **S3** | Migas locales conservadas; aviso compartido “Sin conexión” → sin recuperación independiente | “Ruta de navegación” + actual → padre autorizado | Omitir nombres restringidos → Inicio permitido |
| **S4** | “Puedes buscar módulos, pero no se puede confirmar su apertura sin conexión” → buscar localmente o cerrar | “Buscar módulos” → Abrir paleta | “No hay módulos autorizados para buscar” → Cerrar |
| **S5** | “Búsqueda local de módulos. Sin conexión para cargar datos” → conservar búsqueda | “Módulos disponibles para tu sesión” → Enter/Abrir ruta | “Tu acceso a este módulo cambió” → actualizar menú y retirar resultado |
| **S6** | “No se pudo confirmar el cierre de sesión por falta de conexión” → Reintentar al recuperar conexión | Rol + “Sesión activa”; logout confirmado “Sesión cerrada” → `/login` | “Tu sesión terminó. Inicia sesión de nuevo” → `/login`; retirar datos previos |
| **I1** | “Sin conexión. No se pudo actualizar el resumen de Inicio” → Reintentar lectura | Contexto/KPI reales con alcance/periodo → destino permitido | “No tienes permiso para ver Inicio” → módulo permitido; no serializar métricas |
| **I2** | “Sin conexión. No se pudieron actualizar los leads recientes” → Reintentar lectura | “Leads recientes disponibles” + registros → Abrir lead/Ver leads | “No tienes permiso para ver leads” → omitir lista/destinos, sin nombres/totales |
| **I3** | “Sin conexión. Indicadores no disponibles” → Reintentar lectura | Valor + unidad/alcance/periodo/denominador → módulo permitido | “Este indicador no está disponible para tu sesión” → omitir valor/destino |
| **I4** | “Sin conexión. No se pudo actualizar este resumen” → Reintentar lectura | Etapas reales / meta logrado-objetivo-periodo → Pipeline/Metas permitido | “No tienes permiso para ver este resumen” → omitir; Asistente N/A |
| **I5** | “Sin conexión. No se pudo actualizar la agenda” → Reintentar lectura | “Próximas actividades” + lista real/periodo → Abrir agenda | “No tienes permiso para ver actividades” → omitir lista/acceso |

“Reintentar región” solo aplica cuando exista lectura regional. Hoy no existe: usar una única recarga de lectura disponible. No fingir recuperación de un dato sin consulta.

Tras un logout incierto, reconciliar sesión antes de repetir. No presentar un POST terminado como éxito sin comprobarlo.

### Aplicación por rol

Las capacidades de `Actor` mandan. Esta tabla expresa política de presentación de DESIGN, **no concesión de permisos por slug**. Un rol desconocido no cae a variante Admin.

| Región | admin | broker | assistant / asistente |
|---|---|---|---|
| **S1** | Módulos permitidos y orden fijo | Igual; no inferir acceso global | Igual; DESIGN excluye rendimiento global |
| **S2** | Sin badge respaldado en alcance actual | Leads asignados, dato propio real | Sin asignar/tareas pendientes, alcance autorizado |
| **S3–S5** | Destinos filtrados en servidor | Mismos seis estados; destinos permitidos | Mismos seis estados; sin búsqueda de entidades |
| **S6** | “Administrador · Sesión activa” | “Broker · Sesión activa” | “Asistente · Sesión activa” |
| **I1 contexto** | “Resumen de la operación autorizada” | “Resumen de mi cartera” | “Resumen de la carga operativa autorizada” |
| **I1 KPI** | `leadsMesCount`, `negociosActivosCount`, `cierresMesCount`; requiere `global_metrics:view` y permisos correspondientes | `misLeadsCount`, `citasSemanaCount`, `metaMesLabel/metaPorcentaje`; propios y permisos de leads/activities/goals | `leadsSinAsignarCount`, `citasHoyCount`, `tareasPendientesCount`; permisos de leads/activities |
| **I1 vacío** | “No hay registros en la operación autorizada” → Abrir leads | “No hay registros en tu cartera” → Abrir leads | “No hay registros de carga operativa en tu alcance” → Agenda/Leads permitido |
| **I2** | Recientes autorizados | Recientes propios | Recientes según scope; no equivalen a cola sin asignar |
| **I3** | Conversión/volumen con `global_metrics:view` | Nivel propio; ausencia ≠ Junior acreditado | Avances pendiente de consulta; sin financieros/globales |
| **I4** | Embudo pendiente de datos reales y permisos | Meta propia pendiente de periodo/disponibilidad y `goals:view` | N/A en seis estados: no pertenece a variante operativa; no consultar/serializar rendimiento global |
| **I5** | Agenda según permiso/alcance | Agenda propia según alcance | Agenda operativa según alcance |

En I1/I3, omitir el indicador sin autorización; no sustituirlo por cero. Si faltan todos, aplicar el mensaje de permiso. La exclusión I4 para Asistente es propuesta justificada pendiente de revisión.

### Accesibilidad, interrupción y contenido

- Skeletons con `aria-busy`.
- Actualizaciones con `status/alert` apropiados, evitando anuncios duplicados.
- Foco estable al actualizar; trap, Escape y retorno en paleta.
- Enlace “Saltar al contenido”.
- Sin cache, cola offline ni promesa de antigüedad: no hay soporte acreditado.
- Inicio no contiene formularios mutables.
- Búsqueda: un campo de texto opcional, vacío por defecto, sin persistencia ni consulta a BD. No aplica validación de servidor/BD al filtro local del catálogo autorizado.
- Cerrar paleta no muta. Conservar la consulta mientras permanezca abierta.

Los textos son una especificación de **catálogo único**, no strings para dispersar en JSX. No se localizó un catálogo i18n oficial existente. D03/D08 deben concretar ubicación, IDs y propietario en el despacho de implementación.

## 5. D03 · Contrato del módulo Inicio

### Frontera y flujo actual

**E:** `C/inicio/page.tsx:17–27` resuelve `requireActor`, comprueba `dashboard:view` y llama `consultarDashboard`. No utiliza el scope devuelto. Pasa actorId, roleSlug y un nombre fijo.

`src/application/dashboard/consultas.ts:3–9` únicamente delega al puerto. El contenedor inyecta `getDb()` a `repositorioDashboard`.

R ejecuta consultas Drizzle y devuelve `DashboardMetrics`. `InicioVista` es cliente y recibe el DTO completo, incluidos campos que su variante no pinta.

El puerto no incluye Actor, scopes, procedencia ni estado. No existe un endpoint Dashboard nuevo para consumir desde la vista.

Contrato observado:

| Aspecto | Estado actual |
|---|---|
| Entrada | `actorId: number`, `roleSlug: string`, `actorName: string` |
| Salida | `Promise<DashboardMetrics>` |
| Lead resumido | `id/name/project/source/stage/next` |
| Mutaciones Inicio | Ninguna |
| Logout | POST existente `/api/auth/logout` |
| Consistencia | Sin snapshot/transacción de lectura acreditado; consultas sucesivas |
| Error | Catch global absorbe fallo y devuelve muestra |
| Parcial | Un error tardío reemplaza todas las regiones |
| Auditoría | No se propone evento nuevo: no hay mutación comercial |
| Seguridad | Autorizar módulo no autoriza cada agregado/registro; seleccionar DTO permitido antes de serializar |

### Campos existentes y procedencia

Líneas correspondientes a R.

| Campo | Región/rol | Fuente efectiva y limitación |
|---|---|---|
| `misLeadsCount` | I1 broker; S2 candidato | Leads no borrados con `brokerId=actorId`, 109–112/200. Cero → **5**; no filtro adicional de activos |
| `citasSemanaCount` | I1 broker | Meetings no borradas; broker limita responsable, 147–156/201. **Sin semana/fecha**; cero → **3** |
| `metaMesLabel` | I1/I4 broker | Goals por brokerId, `limit(1)`, 179–189/202. **Sin mes/orden**; ausencia → **2 / 4** |
| `miNivel` | I3 broker | Perfil por userId, 170–177/203. Ausencia → **Junior** |
| `metaPorcentaje` | I1/I4 broker | Redondeo logrado/`max(1,objetivo)`, cap 100, 188–190. Sin meta → **50**; objetivo cero ambiguo |
| `leadsMesCount` | I1 admin | Todos los leads no borrados, 114–117/192/206. **Sin mes**; cero → **48** |
| `negociosActivosCount` | I1 admin | Deals no borrados con `closedAt NULL`, 125–131/139/207. Global; cero → **21** |
| `volumenPipelineDisplay` | I3 admin | Suma `amountCents`, 128/140–144/208. **Sin separar divisas**; suma no positiva → **US$2.8M** |
| `cierresMesCount` | I1 admin | Deals no borrados, etapa `won`, 133–137/193/209. **Sin mes**; cero → **7** |
| `conversionPorcentaje` | I3 admin | Cierres/leads anteriores, 192–197/210. Sin cohorte/periodo; incluye sustitutos |
| `leadsSinAsignarCount` | I1 asistente; S2 candidato | Leads no borrados con brokerId NULL, 119–122/212. Global; cero → **2** |
| `citasHoyCount` | I1 asistente | Mismo conteo meeting, 147–156/213. **Sin hoy**; cero → **3** |
| `tareasPendientesCount` | I1 asistente; S2 candidato | Activities task/pending no borradas, 158–167/214. Global; cero → **4** |
| `avancesPorRevisarCount` | I3 asistente | Literal **1**, 215; sin consulta de avances |
| `leadsRecientes` | I2 autorizado | Cuatro leads recientes, 79–97/217; solo broker limita propietario. Vacío → `BASE_LEADS` |
| `saludoNombre` | I1; no identidad S6 | Primer fragmento de actorName, 75/218. Page pasa nombres fijos |
| `fechaTexto` | I1 | Fecha del servidor, 69–74/219. Sin zona explícita ni antigüedad de datos |

`DashboardLeadSummary`, R:85–105:

| Campo | Fuente | Límite |
|---|---|---|
| `id` | `leads.id` | IDs de muestra no acreditan destinos persistidos |
| `name` | `contacts.fullName` | Fallback “Prospecto sin nombre” |
| `project` | `leads.projectInterestText` | Texto de interés; no relación verificada con proyecto |
| `source` | `leadSources.name` | Fallback “Portal Web” no acredita origen |
| `stage` | `leads.status` | Reduce new/otros a “Nuevo”/“En seguimiento” |
| `next` | Literal “Contactar hoy” | No procede de actividad, fecha o regla de atención |

No utilizar `stage` como etapa completa del embudo ni `next` como vencimiento.

### Datos de muestra comprobados

1. **Saludos:** `C/inicio/page.tsx:24` fija Yostar para broker, Alexandra para assistant e Ismael para los demás. Actor expone userId, roleSlug y permissions, sin nombre (`auth/actor.ts:61–93`). Los saludos **no son identidad autenticada**.

2. **Leads:** R:26–59 contiene `BASE_LEADS`: Carlos Peña, María Gómez, Roberto Rosario y Elena Valdez, IDs 1–4. Se utilizan ante vacío y error. R:101 también puede obtener nombres reales desde `contacts.fullName` cuando hay filas.

   No se consultó BD: no afirmar que esos nombres nunca existan allí ni detectar muestras comparando nombres.

3. **Métricas:** R:192–217 sustituye ceros/lista vacía; R:221–245 devuelve demo ante cualquier excepción sin discriminante.

4. **Embudo:** `C/inicio/vista.tsx:110–115` fabrica etapas con 75/50/30/20 % de leads y ancho de cierre 15 %.

5. **Agenda:** `C/inicio/vista.tsx:136–157` fija 10:00/11:30/15:00, títulos y ubicaciones. No se alimenta de activities.

6. **Academy/demanda:** `C/inicio/vista.tsx:168–181` fija progreso 85 % y proyectos con 24/18/12 leads. Retirar de la fase operativa sin sustituirlos por datos inventados.

7. **Destino:** `C/inicio/vista.tsx:71` abre `/leads` sin selección. `/leads?lead=id` existe y aplica condiciones autorizadas en `C/leads/page.tsx:131–143`. Utilizarlo exclusivamente con ID real autorizado.

### Qué falta en el puerto

Los siguientes son **requisitos semánticos propuestos**, no campos existentes ni un tipo ficticio añadido al contrato.

| Gap | Contrato requerido y dueño |
|---|---|
| Procedencia/disponibilidad | D03/D10: preservar cero/[]; distinguir real, muestra explícita, ausencia de meta/perfil, fallo e indisponibilidad |
| Estado regional/parcial | D03/D06/D10: regiones válidas/fallidas y recuperación disponible; catch genérico no equivale a offline |
| Autorización | D03/D10/D12: Actor/scopes por leads, deals, activities, goals/global_metrics; `visibleRows/reaches`; DTO permitido antes de serializar |
| Periodos/zona | D01/D02/D10: ventanas reales de mes, semana, hoy, meta/conversión; no deducirlas de `fechaTexto` |
| Identidad | D03/D10: nombre autorizado separado de etiqueta de rol, si entra al alcance; mientras usar rol/Hola |
| Radar operativo | D01/D02: criterio respaldado, motivo/vencimiento/destino si se exige prioridad; hoy solo recientes |
| Embudo | Falta colección de etapas/conteos y significado acordado |
| Agenda | Falta lista de actividades con fecha/hora/destino; acordar contrato reutilizable o alcance explícito |
| Dinero/conversión | D01/D02/D10: moneda homogénea, numerador/denominador/cohorte; texto formateado no permite corregirlos |
| Meta/perfil | Ausencia distinta de Junior/50 %; periodo y objetivo cero definidos; no parsear `metaMesLabel` como modelo numérico |
| Contadores shell | No hay contrato shell; no agregar queries a layout; habilitar badges solo con fuente acotada y actualización definida |

Prioridad: **procedencia y autorización antes de habilitar cifras/identidades**; después periodos, meta y regiones faltantes.

La receta visual no autoriza modificar aplicación/infraestructura ni crear API.

## 6. Seguridad, trazabilidad y verificación

### Hallazgo concreto

**P1 propuesto:** `C/inicio/page.tsx:18–27` autoriza Dashboard y entrega el DTO completo a `InicioVista` cliente. R:114–167/199–219 calcula agregados globales para todos los actores.

Ocultarlos mediante `isBroker/isAssistant` no elimina esos campos del payload. R:79–81 también decide alcance de leads por slug, sin scopes.

**Exposición efectiva, permisos vivos y payload en navegador: NV.** D12/D14 deben reproducirlo con permisos reducidos. No se declara ataque confirmado.

Aspectos correctos **E**:

- Actor CRM excluye usuarios inactivos/borrados.
- Shell filtra navegación con `can`.
- Existe guardia `dashboard:view`.
- Selección de lead aplica condiciones de alcance.

Estas garantías no acreditan el resto del Dashboard.

### Checklist de seguridad

Se recorrió §6 de `docs/contexto/flujo-de-trabajo.md`.

No se creó tabla/vista SQL/API/JSON, variable de entorno, upload/CSV/HTML crudo, migración ni código cliente con credenciales. No hay diff de código propio.

No se leyeron `.env` ni cadenas de conexión; no se listó entorno ni se ejecutó `docker inspect`. Ningún secreto identificado apareció en las salidas observadas.

No se provocaron fallos para obtener mensajes internos. El catch actual registra `err.message`; su contenido en runtime no se verificó.

### Trazabilidad y pruebas pendientes

| Trazabilidad | Criterio para D14/D07 |
|---|---|
| REQ-UX-01 → shell → S1–S6 → MODULOS/PERM | Tres roles, mismo orden, grupos vacíos, activo, migas, Ctrl/⌘K, Enter/Escape/retorno y logout incierto/error |
| REQ-UX-02 → FLOW-01 → I2 → ID/PERM | Abrir el mismo lead autorizado; ID ajeno/retirado sin fuga |
| REQ-UX-03 → regiones × estados × roles | Cero, [], meta/perfil ausente, error temprano/tardío, offline, parcial y 403/revocación |
| REQ-UX-04/06 → tokens/anchos | 320/390/430/768/1024/1440; nombres largos, zoom/reflow, foco/targets/contraste y ausencia de scroll global |
| REQ-UX-05 → Actor/scopes | Broker sin globales/ajenos en payload; Asistente sin rendimiento global; admin limitado por permisos efectivos |
| REQ-UX-07/08 → frontera/reutilización | Contratos entre RSC/cliente; dependencias/licencias verificadas; sin consultas/reglas de negocio en vista |

WCAG 2.2 AA es criterio de aceptación, **no conformidad declarada**. Verificar contraste, teclado/foco no oculto, nombres/roles, targets, lector, estados y autenticación accesible. Los contrastes de DESIGN son evidencia documental heredada, no mediciones de esta sesión. [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

### Identificación del snapshot

SHA256 observado sin git:

| Archivo | SHA256 |
|---|---|
| `C/layout.tsx` | `E4E88078A5962723C8E6E8A3C50100BB0EE4A4B9347D220220D98387118C6504` |
| `C/inicio/page.tsx` | `4A88E95A3C23EC122E582E56E71ED644C3D6780D5DA98762E842A3D30FEC4151` |
| `C/inicio/vista.tsx` | `4D59423F3B6587A665F34CE9681F46C4FA858D88AF57CD5D1C3ED3705159B3CD` |
| `application/dashboard/puertos.ts` | `C38E2A2F9E6F0BC9CC4622A2524F128E5B20B8954C075F860B2330001ECDC28D` |
| `R` | `E8FB7BA3AF7741614C0F6E302C0038E7CDD3D0189B8E1D6DA8AB081279964B00` |
| `docs/DESIGN.md` | `3F6DA9DD0360DECE295ADE609FB3319638BE48ADFC3272A22E473C0B14D160BD` |

Algunos hashes difieren del informe D09. No se atribuye causa ni equivalencia de commits. No se comparó remoto ni se certificó publicación.

## Handoff

**D09 recibe con estos insumos la especificación visual, los estados y el contrato para implementar el shell y la composición honesta de Inicio**, utilizando rutas/primitivas existentes y mensajes de indisponibilidad donde faltan datos.

Puede preparar las regiones sin incorporar muestras ni prometer búsqueda de entidades, radar priorizado, embudo o agenda inexistentes.

Una fase 1 completa con métricas reales sigue dependiendo de resolver B01–B04 mediante cambios acotados D03/D10 y revisión D12, o de una decisión explícita D00 de entregar temporalmente las regiones sin datos. Este documento no amplía los archivos ni el alcance autorizados al constructor.

Claude conserva la escritura de código conforme a las reglas del proyecto; Codex entrega análisis y pruebas.

Secuencia propuesta:

1. **D07:** revisar tokens/recetas y exclusiones N/A. **Revisor humano:** contrato D03. **D14:** estados D06.
2. **D00:** asignar catálogo de textos y archivos auxiliares UI/manifiesto/lockfile necesarios.
3. **D03/D10:** resolver procedencia, alcance y periodos; documentar cualquier evolución del puerto.
4. **D09:** componer vistas sin queries ni reglas de negocio en cliente.
5. **D14/D07:** validar implementación publicada por rol, estado y ancho. El autor ejecuta los verificadores del proyecto en un entorno autorizado.

Pendientes:

| Dueño | Próximo paso |
|---|---|
| D07 | Accesibilidad, responsive y excepción de tema oscuro |
| D14 | Comportamiento y matriz de estados |
| D01/D02 | Periodos, conversión, moneda y criterio de atención |
| D03/D10 | Contrato y procedencia |
| D08 | Catálogo y voz de los textos |
| D21/D12 | Dependencia cmdk, licencias e integración |
| D00 | Alcance, secuencia y gates |

**Estado:** análisis completo; implementación, navegador, CI, revisión independiente y aprobación pendientes. No se generó firma de ningún revisor. Ningún perfil aprueba su propio trabajo.

La revisión automática rechazó escribir `.viltrum/crm-ux/D05-D03-D06-insumos-fase1.md` porque el sandbox es de solo lectura y las excepciones están deshabilitadas. El informe queda entregado aquí; su guardado en la ruta solicitada permanece pendiente.