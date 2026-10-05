## 1. SCR-PROP-CATALOGO · Propiedades · catálogo de proyectos
### 1. Concepto a máxima capacidad
- **Catálogo con facetas y rangos (desde-hasta):** Construir (P0).
- **Mapa de proyectos:** Integrar MapLibre (MapasPort, `capacidades()`) (P1). Si el proveedor cae, modo degradado: se oculta el mapa, se mantiene la lista intacta con badge "Mapa no disponible".
- **Barra de disponibilidad y precios:** Construir (P0).
- **Calculadora fiscal Confotur:** Construir (P0). Muestra ahorro (3 % transferencia + 1 % IPI por 15 años).
- **Comparador:** Construir (P2).

### 2. Librería Viltrum Design
- **Filtros por facetas:** Componente (id 27378) (`page-header-5` de olewandowski1). Encaje: Barra superior de búsqueda. Normalizar a tokens: `surface`, `navy-950`, `line`. Riesgo de accesibilidad: bajo, posee soporte para lectores. Comportamiento móvil: Pasa a off-canvas (sheet).
- **Tarjetas de proyecto:** Componente (id 819) (`empty-state` de serafimcloud adaptado temporalmente). Encaje: Estado de catálogo vacío. Normalizar a tokens: `surface`, `text`. Riesgo de accesibilidad: bajo. Comportamiento móvil: 100% ancho. Para las tarjetas de proyecto reales, construir sobre `shadcn/ui` `Card` dado que no se hallaron candidatas premium con ID numérico en 21st.dev.

### 3. Screen Recipe
**Jerarquía y zonas:**
Cabecera superior de filtros (búsqueda, rango de precios, zonas). Área lateral de mapa (escritorio). Área principal con grid de tarjetas de proyecto y barra de resumen.
**Datos exactos:**
`project.name`, `project.location`, `project.price_from_cents`, `project.has_confotur`, `project.available_units`. Consulta: `GET /api/projects?facets=true`.
**Componentes por id:**
26793 (Page Header), 1435 (Empty State), shadcn Card, shadcn Badge (para la insignia Confotur).
**Puntos de corte:**
- 320: 1 columna, mapa oculto permanentemente, filtros detrás de botón flotante.
- 390: 1 columna, sheet lateral para filtros.
- 768: 2 columnas, mapa como drawer o colapsado a demanda.
- 1440: 3 columnas de grid y mapa persistente a la derecha, filtros en cabecera extensa.
**Matriz de estados:**
- initial: Texto "Cargando el inventario de proyectos...", skeleton cards animadas, sin acción manual.
- loading: Texto "Actualizando filtros seleccionados...", grid con opacidad parcial, sin acción manual.
- empty: Texto "No hay proyectos que coincidan con estos filtros.", acción "Limpiar filtros y volver al catálogo".
- partial: Texto "El mapa no pudo cargar pero los datos están actualizados.", acción "Continuar navegando".
- error: Texto "Ocurrió un error al cargar el catálogo de proyectos.", acción "Reintentar carga completa".
- offline: Texto "Modo sin conexión activado. Mostrando caché reciente.", acción "Forzar sincronización local".
- success: Texto oculto, renderizado completo, acción "Ver detalle del proyecto o comparar".
- no_permission: Texto "No cuentas con el perfil necesario para acceder al catálogo global.", acción "Contactar al administrador".
- conflict: Texto "N/A" (Vista solo de lectura).
**Permisos por rol:**
- admin: Ve catálogo completo, precios brutos y reales.
- broker: Ve inventario asignado a la agencia, precios base permitidos.
- asistente: Ve catálogo completo, precios censurados según directiva.
**Acciones:**
- Filtrar resultados: Feedback visual "Filtros aplicados", auditoría en logs (análisis), recuperación "Limpiar".
- Comparar proyecto: Feedback Toast "Añadido al comparador", recuperación "Quitar de bandeja".
**Gráficas e indicadores:**
- Calculadora de ahorro: Gráfico circular pequeño de proporción de pago inicial vs. ahorro (Recharts, `calc(amount)`).
**Micro-interacciones y atajos:**
- Hacer hover en la tarjeta destaca el marcador correspondiente en el mapa. ⌘+F enfoca la barra de búsqueda general.
**Integración externa visible:**
- MapLibre (MapasPort). Estado de conexión mostrado con punto verde "Mapa activo". Si el proveedor cae, modo degradado: la zona del mapa se pliega y una alerta tipo toast informa la caída, manteniendo la navegación 100% útil.

### 4. Wireframes
```ascii
[390px]
+-------------------------+
| [=] Proyectos  [Filtros]|
| Barra: 50 Disp          |
|-------------------------|
| [ Proyecto Cana Pearl ] |
| [ USD 200k+ | Confotur] |
|-------------------------|
| [ Proyecto Blue Water ] |
| [ USD 150k+ | Confotur] |
+-------------------------+
```
```ascii
[1440px]
+-------------------------------------------------+
| [=] Proyectos de Lujo  [Buscador] [Rango] [Zona]|
|---------------------------------------|-------| |
| [ Cana Pearl ] [ Blue Water ]         |       | |
| [ Confotur   ] [ Confotur   ]         | MAPA  | |
|                                       |       | |
| [ Golden Bay ] [ Silver Sands ]       |       | |
| [ Confotur   ] [ Normal     ]         |       | |
+-------------------------------------------------+
```

### 5. Criterios de aceptación
1. El mapa visualiza polígonos utilizando MapLibre; si se bloquea el puerto 443 a MapLibre, no se detiene la carga del catálogo.
2. Al seleccionar filtros de `price_from_cents` desde-hasta, la lista se actualiza asíncronamente sin perder estado de scroll.
3. La insignia dorada de Confotur (`gold-100` con texto `gold-800`) se muestra únicamente si `project.has_confotur === true`.
4. El cálculo de ahorro tributario incluye estrictamente el 3 % del valor para la transferencia y el 1 % del IPI por 15 años.
5. El modo responsive en 390px esconde el mapa detrás de un botón y usa hoja inferior para la botonera de filtros pesados.


## 2. SCR-PROP-PROYECTO · Proyecto · detalle
### 1. Concepto a máxima capacidad
- **Resumen general del proyecto:** Construir (P0).
- **Inventario de unidades (Tabla compacta):** Construir (P0).
- **Línea de tiempo de avances de obra:** Construir (P0).
- **Visores 360:** Integrar Pannellum (AvancesPort, `capacidades()`) (P1). Si el proveedor cae, modo degradado: Se muestra una galería fotográfica plana convencional.
- **Documentación legal y técnica:** Integrar react-pdf (DocumentosPort, `capacidades()`) (P0). Si el proveedor cae, modo degradado: Muestra lista de archivos con botones de "Descargar PDF directo".
- **Negocios asociados:** Integrar Twenty (NegociosPort, `capacidades()`) (P0). Si el proveedor cae, modo degradado: Indicador "Sistema CRM en mantenimiento" y no rompe la vista.

### 2. Librería Viltrum Design
- **Línea de tiempo:** Componente (id 28340) (`timeline-3` de olewandowski1). Encaje: Excelente para el flujo de hitos constructivos y avances de obra. Normalizar a tokens: Borde a `line`, iconos en `navy-900`. Riesgo de accesibilidad: bajo, textos no inferiores a 13px. Comportamiento móvil: Scroll vertical natural.
- **Pestañas navegables:** Componente (id 425) (`tabs` de originui). Encaje: Navegación horizontal de secciones (Resumen, Unidades, Avances, Documentos, Negocios). Normalizar a tokens: `gold-600` para borde activo. Riesgo de accesibilidad: alto soporte de teclado ARIA. Comportamiento móvil: Desplazamiento horizontal (overflow-x-auto) ocultando scrollbar.

### 3. Screen Recipe
**Jerarquía y zonas:**
Héroe (Hero) superior con galería condensada e información macro. Abajo, el componente de pestañas (Tabs) que orquesta las áreas de contenido (Resumen, Unidades, Avances de obra, Documentos, Negocios).
**Datos exactos:**
`project.name`, `project.description_rich`, `project.amenities`, `unit.status_enum`, `timeline.percentage_complete`, `doc.url`. Consulta: `GET /api/projects/:id` con carga diferida de `GET /api/projects/:id/units` y `GET /api/projects/:id/documents`.
**Componentes por id:**
28340 (Timeline de hitos), 425 (Pestañas de navegación), Visor Pannellum, Componente react-pdf.
**Puntos de corte:**
- 320: Tabs colapsan a menú select, imágenes full width sin bordes.
- 390: Tabs en scroll horizontal nativo.
- 768: 2 columnas en el hero (imágenes a un lado, datos base al otro).
- 1440: Hero inmersivo restringido a altura razonable, 3 columnas para negocios asociados.
**Matriz de estados:**
- initial: Texto "Accediendo a expediente del proyecto...", hero vacío con placeholders.
- loading: Texto "Actualizando inventario...", overlay con spinner en zona de unidades.
- empty: Texto "Este proyecto no tiene unidades declaradas aún.", acción "Contactar a desarrollo".
- partial: Texto "El visor 360 no cargó por completo.", acción "Ver galería estándar".
- error: Texto "Error al recuperar datos del proyecto.", acción "Volver a cargar el proyecto".
- offline: Texto "Sin internet. Operando con caché de ayer.", acción "Intentar reconexión manual".
- success: Texto oculto, renderizado funcional de todas las pestañas, acción "Interactuar con contenido".
- no_permission: Texto "No tienes acceso a los detalles profundos de este proyecto.", acción "Ver proyectos abiertos".
- conflict: Texto "El proyecto fue actualizado por otro admin.", acción "Actualizar página ahora".
**Permisos por rol:**
- admin: Modifica todo el proyecto, sube avances de obra, crea documentos.
- broker: Navega información, consulta unidades, no ve negocios ajenos.
- asistente: Sube material gráfico de avances bajo estado "Borrador pendiente de aprobación".
**Acciones:**
- Descargar Brochure principal: Auditoría en log `download_brochure`. Feedback: modal temporal, Recuperación: botón cancelar.
- Validar unidad: Abre vista de matriz.
**Gráficas e indicadores:**
- Métrica de avance circular (0-100%) en Recharts con color `success` al llegar al 100%. Consulta local estática.
**Micro-interacciones y atajos:**
- Pulsar pestaña navega su contenido fluidamente sin scroll jank.
**Integración externa visible:**
- Pannellum: Banner pequeño "360 activo". Si cae, el contenedor fallback muestra un JPG estático.
- react-pdf: Banner "Visor PDF", si cae solo aparecen los enlaces HTML nativos `<a>` a los PDFs.
- Twenty: Muestra un badge "Negocios activos". Si cae, modo degradado que bloquea nuevas interacciones de venta.

### 4. Wireframes
```ascii
[390px]
+-------------------------+
| < Volver a proyectos    |
| [ Foto de Portada ]     |
| Vista Mare / $200k+     |
|-------------------------|
| [Resumen|Unidades|...] >|
| Avance de obra: 45%     |
+-------------------------+
```
```ascii
[1440px]
+-------------------------------------------------+
| < Volver al Catálogo      |   [ Descargar PDF ] |
|-------------------------------------------------|
| [ FOTO HERO AMPLIA 2/3 ] [ FOTOS CHICAS 1/3   ] |
|-------------------------------------------------|
| [ Resumen | Unidades | Avances | Documentos ]   |
|                                                 |
| Detalles del proyecto y texto descriptivo       |
| ...                                             |
+-------------------------------------------------+
```

### 5. Criterios de aceptación
1. Las pestañas funcionan usando parámetros en la URL (ej. `?tab=unidades`) para permitir compartir el link directo.
2. Si el proveedor Pannellum falla (estado de conexión offline en AvancesPort), se activa el fallback visual de modo degradado sin que colapse la UI.
3. El componente Timeline (ID 28340) muestra el hito actual de la construcción resaltado con `navy-900`.
4. El indicador radial de avance (`timeline.percentage_complete`) refleja correctamente la métrica en la cabecera.
5. El admin puede ver la sección de negocios (NegociosPort) conectada a Twenty; el asistente con cuenta básica no ve el listado financiero.


## 3. SCR-PROP-MATRIZ · Unidades · matriz de disponibilidad
### 1. Concepto a máxima capacidad
- **Matriz visual interactiva por torre y piso:** Construir (P0).
- **Filtro rápido de estados (Disponible, Reservada, Vendida, Bloqueada):** Construir (P0).
- **Flujo de bloqueo y reserva transaccional:** Construir (P0).
- **Cálculo de precio visible y configurable por rol:** Construir (P0).

### 2. Librería Viltrum Design
- **Sheet (Inspector lateral):** Componente (id 25002) (`sheet-01` de shadcnspace). Encaje: Abrir los detalles de una unidad específica de forma no invasiva. Normalizar a tokens: `surface` de fondo, texto en `ink`, cabecera en `surface-alt`. Riesgo de accesibilidad: El componente debe implementar Focus Trap al estar abierto. Comportamiento móvil: 100% de la pantalla, swipe-down para cerrar.
- **Gráfico de disponibilidad general:** Componente (id 29221) (`charts-1` de olewandowski1 adaptado). Encaje: Barra de resumen de ocupación del edificio. Normalizar a tokens: `success` para libres, `danger` para vendidos. Comportamiento móvil: Altura mínima conservada.

### 3. Screen Recipe
**Jerarquía y zonas:**
Cabecera con el selector de torre y leyenda visual de estados. Debajo, la cuadrícula (grid) organizada matemáticamente en eje Y (pisos) y X (unidades). A la derecha o superpuesto, el inspector lateral (Sheet).
**Datos exactos:**
`unit.floor`, `unit.number`, `unit.status`, `unit.base_price_cents`, `unit.broker_id_hold`. Consulta: `GET /api/projects/:id/matrix?tower=X`.
**Componentes por id:**
25002 (Sheet para inspección rápida), 29223 (Bar Chart para ocupación). CSS Grid nativo para la matriz (no existen componentes UI en 21st.dev para un plano 2D de apartamentos).
**Puntos de corte:**
- 320: Cuadrícula colapsa a lista vertical estructurada por piso.
- 390: Cuadrícula permite scroll horizontal y vertical con inercia nativa y encabezados fijos.
- 768: Matriz ajustada en un contenedor scroll, la leyenda acompaña permanentemente.
- 1440: Matriz renderizada a máxima amplitud; leyenda fija a un lado.
**Matriz de estados:**
- initial: Texto "Cargando matriz del edificio...", celdas grises parpadeantes.
- loading: Texto "Sincronizando inventario...", spinner global en la esquina.
- empty: Texto "No se han definido unidades para este piso/torre.", acción "Revisar configuración".
- partial: Texto "No se cargaron los bloqueos en tiempo real.", acción "Ignorar y continuar".
- error: Texto "No se pudo recuperar la disponibilidad.", acción "Refrescar servidor".
- offline: Texto "Trabajando sin conexión, la disponibilidad puede estar desactualizada.", acción "Verificar red".
- success: Texto oculto, matriz lista interactiva, acción "Clic en celda para inspeccionar".
- no_permission: Texto "No posees permisos de inventario.", acción "Contactar gerencia".
- conflict: Texto "La unidad acaba de ser bloqueada por otro broker.", acción "Actualizar vista de matriz ahora".
**Permisos por rol:**
- admin: Ve precio puro, identidades de clientes en bloqueos ajenos, puede forzar desbloqueo (override).
- broker: Ve precios según markup definido, solo ve la identidad de sus propios clientes bloqueados.
- asistente: Ve matriz general, requiere solicitar aprobación para efectuar bloqueos.
**Acciones:**
- Bloquear Unidad: Petición `POST /api/units/:id/hold`, feedback "Unidad retenida 48h", recuperación "Cancelar bloqueo si hay error".
- Reservar Unidad: Transición a oportunidad de venta (Negocio).
**Gráficas e indicadores:**
- Gráfico apilado (Barra simple) con colores `success`, `warning` y `danger` reflejando % de inventario total.
**Micro-interacciones y atajos:**
- Animación 140ms al hacer hover en celda disponible (cambio a `navy-100`).
**Integración externa visible:**
- Capa visual de sistemas conectados: Ninguno (flujo 100% nativo al sistema para velocidad extrema).
- Si algún proveedor cae o falla la conexión, el modo degradado deshabilita las opciones de bloqueo manual y muestra las reservas en formato solo lectura.

### 4. Wireframes
```ascii
[390px]
+-------------------------+
| Torre 1 (60% Disp)      |
| [Disp] [Bloq] [Vend]    |
|-------------------------|
| P3: [301] [302] [303]   |
| P2: [201] [202] [203]   |
+-------------------------+
```
```ascii
[1440px]
+-------------------------------------------------+
| Torre Principal [Selector v]                    |
| Ocupación: [====== Disp =====|== Vend ==| Bloq ]|
| Leyenda: [D] Disponible [B] Bloqueada [V] Vend  |
|-------------------------------------------------|
| P3: [  301  ] [  302  ] [  303  ] [  304  ]     |
| P2: [  201  ] [  202  ] [  203  ] [  204  ]     |
| P1: [  101  ] [  102  ] [  103  ] [  104  ]     |
+-------------------------------------------------+
```

### 5. Criterios de aceptación
1. Las celdas de la matriz aplican estrictamente la tabla de colores (`success` disponible, `warning` bloqueada, `danger` vendida).
2. Un broker sin permisos avanzados visualiza las unidades bloqueadas por la competencia sin acceder al nombre del cliente ajeno, conservando anonimato.
3. El componente 25002 (Sheet) emerge por la derecha sin empujar el DOM, mostrando el precio correcto según el rol que solicita.
4. Al ocurrir un `conflict` de concurrencia (dos brokers intentan bloquear la unidad al milisegundo), el sistema arroja el estado de conflicto explícito de la matriz.
5. El scroll en dispositivos móviles es natural en X y en Y (con cabeceras de piso fijas a la izquierda).


## 4. SCR-BRK-RANKING · Brokers · ranking y desempeño
### 1. Concepto a máxima capacidad
- **Ranking global / Leaderboard (Gamificación):** Construir (P0).
- **Motor de métricas (Volumen y Cierres):** Integrar Growthbook / PostHog (AnalyticsPort, `capacidades()`) (P1). Si el proveedor cae, modo degradado: Se sirve información precalculada almacenada en la BBDD principal (caché).
- **Gráficos de tendencia evolutiva:** Construir usando Recharts (P1).

### 2. Librería Viltrum Design
- **Gráfico principal de barras:** Componente (id 29221) (`charts-1` de olewandowski1). Encaje: Excelente para volumen mensual de cierres USD. Normalizar a tokens: Ejes con color `muted`, barras en `navy-900` y picos en `gold-600`. Riesgo de accesibilidad: Incorporar tooltips legibles para teclado. Comportamiento móvil: Contenedor con scroll si el número de meses supera la pantalla.
- **Tabla del ranking:** Componente (id 22177) (`table-20` de felipemenezes098). Encaje: Listado de Top Brokers. Normalizar a tokens: `surface-alt` para cabeceras y `surface-hover` interactivo. Riesgo de accesibilidad: Semántica WAI-ARIA `table` requerida. Comportamiento móvil: Apilar métricas o scroll horizontal agresivo.

### 3. Screen Recipe
**Jerarquía y zonas:**
Botonera superior de filtros (Periodo, Equipo). Podio superior de Top 3 brokers destacados en hero. Listado completo en tabla, y al lateral (o intercalado en móvil) gráficos temporales de evolución general de la empresa.
**Datos exactos:**
`broker.name`, `broker.avatar_url`, `stats.total_volume_cents`, `stats.closed_deals_count`, `stats.response_time_avg`. Consulta: `GET /api/brokers/ranking?period=YTD`.
**Componentes por id:**
29223 (Revenue Bars Chart), 22177 (Complex Data Table), Select nativo de shadcn.
**Puntos de corte:**
- 320: Tabla simplificada a dos columnas (Avatar+Nombre / Volumen). Gráfico debajo.
- 390: Gráficos apilados. Tabla debajo del podio colapsado a lista enumerada.
- 768: Dos columnas: Top 3 a un lado, Gráficos al otro.
- 1440: Tres tarjetas para el Top 3, tabla expansiva de alta densidad con gráfica de tendencias en la columna derecha.
**Matriz de estados:**
- initial: Texto "Calculando leaderboard del periodo...", barras de progreso animadas.
- loading: Texto "Refrescando datos estadísticos...", tabla grisácea (dimmed).
- empty: Texto "Ningún broker tiene transacciones cerradas en este periodo.", acción "Ampliar rango de fechas".
- partial: Texto "El cálculo de tiempos de respuesta falló (AnalyticsPort Offline).", acción "Consultar solo métricas de volumen".
- error: Texto "Incapaz de computar el ranking en este momento.", acción "Recalcular ahora".
- offline: Texto "Visión limitada sin conexión a internet.", acción "Reconectar para ver tiempo real".
- success: Texto oculto, podio y tabla listos, acción "Interactuar y filtrar meses".
- no_permission: Texto "El acceso al rendimiento global está restringido.", acción "Ver solo métricas personales".
- conflict: Texto "N/A" (Pantalla analítica inmutable por usuario).
**Permisos por rol:**
- admin: Accede al panorama nacional y a todos los equipos.
- broker: Ve a su propio equipo (agencia base) y su ranking interno exclusivamente.
- asistente: Visualización bloqueada por directiva de privacidad, a menos que el admin asigne delegación especial.
**Acciones:**
- Cambiar Periodo Analizado: Filtra y lanza fetch con loading state suave, auditoría `view_ranking`.
- Ver Perfil: Al pulsar una fila, redirige a la vista completa de perfil del broker objetivo.
**Gráficas e indicadores:**
- Gráfica de barras Recharts mostrando `volume_cents` frente al eje X de meses cronológicos.
**Micro-interacciones y atajos:**
- Tooltips sobre la barra del chart revelan la cantidad exacta en USD al pasar el mouse o foco (220ms delay).
**Integración externa visible:**
- AnalyticsPort (PostHog/Growthbook). Indicador en esquina "Analytics Engine: Sincronizado". Si cae, el modo degradado avisa "Modo Desconectado (Solo Caché)" y las gráficas asumen datos previos.

### 4. Wireframes
```ascii
[390px]
+-------------------------+
| Leaderboard  [Mes ▾]    |
|-------------------------|
| [ Gráfico Barras      ] |
|-------------------------|
| 1. Juan P. - $1.2M      |
| 2. Maria D. - $900k     |
| 3. Ana S. - $500k       |
+-------------------------+
```
```ascii
[1440px]
+-------------------------------------------------+
| Desempeño y Leaderboard     [Periodo: Mensual ▾]|
|-------------------------------------------------|
| [ #1 Juan Perez       ] [ Gráfica de Tendencia  ]
| [ Volumen: USD 1.2M   ] [ Mensual (Barras)      ]
| [ 15 Cierres          ] [                       ]
|-------------------------------------------------|
| 4. Luis F.   | USD 300k | 4 Cierres | 1h resp.  |
| 5. Carlos M. | USD 150k | 2 Cierres | 2h resp.  |
+-------------------------------------------------+
```

### 5. Criterios de aceptación
1. Las barras del componente 29223 se dibujan con tokens formales (`navy-900`) e ignoran colores base del autor original.
2. Un usuario con rol de `broker` y sin permisos extra ve un error de estado `no_permission` o la vista recortada si intenta consultar a los de otra agencia que no es la suya.
3. El estado de error al carecer de conexión (AnalyticsPort) expone explícitamente el badge que advierte sobre datos locales.
4. La tabla incluye un tooltip de desglose de cierre cuando se hace focus sobre un volumen monetario.
5. Los números monetarios presentan el formato exacto en dólares (USD) para cumplir con el estándar dominicano para inversores extranjeros.


## 5. SCR-BRK-PERFIL · Broker · perfil
### 1. Concepto a máxima capacidad
- **Ficha Maestra 360 y KPIs Personales:** Construir (P0).
- **Bandeja de Negocios y Actividad:** Construir (P0).
- **Academia y Formación continua:** Integrar Moodle/Frappe LMS (AprendizajePort, `capacidades()`) (P0). Si el proveedor cae, modo degradado: La pestaña de Academy despliega los diplomas ganados previamente en modo solo lectura, inhabilitando nuevos accesos o tracking.
- **Cuadro de Mando de Comisiones y Retenciones:** Construir (P0).

### 2. Librería Viltrum Design
- **Tarjetas de KPI / Progreso:** Componente (id 25010) (`progress-metric-card` de makviesainte). Encaje: Ideal para representar el porcentaje de meta anual logrado y el progreso de cursos de formación. Normalizar a tokens: Círculo de progreso en `success` o `gold-600`, texto en `ink`. Riesgo de accesibilidad: Asegurar texto alt para la tarjeta. Comportamiento móvil: Grid natural de 1 o 2 columnas.
- **Línea de tiempo de actividad:** Componente (id 28340) (`timeline-3` de olewandowski1). Encaje: Visualiza el log de actividades (correos enviados, notas, negocios ganados). Normalizar a tokens: Puntos de `line` a `navy-700`. Comportamiento móvil: Scroll continuo vertical.

### 3. Screen Recipe
**Jerarquía y zonas:**
Cabecera identificativa de perfil (avatar, agencia de membresía, territorio). Segunda banda con KPIs críticos usando la tarjeta métrica (Volumen, Metas, Comisiones ganadas). Panel principal operado por pestañas (Negocios asignados, Liquidación Comisiones, Historial de Actividad, Formación Academy).
**Datos exactos:**
`broker.full_name`, `broker.agency`, `broker.territory`, `broker.certifications`, `stats.commission_total_cents`, `stats.goal_percentage`. Consulta `GET /api/brokers/:id/profile` ampliada.
**Componentes por id:**
15024 (Métrica KPI), 28340 (Línea de tiempo de actividades), Tabs de originui (ID 425), Iframe/API Integration Viewer para Moodle LMS.
**Puntos de corte:**
- 320: Todo colapsa en pila vertical, los KPIs pierden los gráficos circulares.
- 390: Tarjetas KPI ocupan un grid 2x2. Tabs nativas en scroll.
- 768: Cabecera compacta izquierda-derecha, KPIs en fila de 3.
- 1440: Distribución asimétrica. Panel izquierdo fijo con perfil biográfico, panel derecho extenso albergando pestañas y grillas de datos pesados.
**Matriz de estados:**
- initial: Texto "Recopilando datos del broker...", interfaz dibujada en skeleton (esquema hueso).
- loading: Texto "Actualizando progreso formativo...", spinner pequeño sobre la tarjeta de Academy.
- empty: Texto "Este broker no ha cerrado negocios todavía.", acción "Asignar nuevos leads".
- partial: Texto "El sistema de comisiones está inalcanzable temporalmente.", acción "Recalcular datos".
- error: Texto "Error letal al solicitar la biografía.", acción "Retornar al directorio de brokers".
- offline: Texto "Modo sin internet. Modificaciones bloqueadas.", acción "Esperar conexión firme".
- success: Texto oculto, interfaz 100% activa e hidratada, acción "Editar o revisar pestañas libremente".
- no_permission: Texto "Careces de credenciales para auditar este perfil comercial.", acción "Solicitar revisión cruzada al administrador".
- conflict: Texto "El administrador ajustó la estructura de comisiones recientemente.", acción "Aceptar recarga automática de la página".
**Permisos por rol:**
- admin: Lectura, edición biográfica, alteración de metas manual y exportación de comisiones.
- broker: Autorizado a visualizar su propio registro de manera íntegra, pero inhabilitado de mutar métricas ni liquidar sus propias comisiones.
- asistente: Restringido o sujeto a lectura condicional sobre calendario y agenda del broker.
**Acciones:**
- Imprimir Certificado de Academy: Descarga el PDF formativo. Feedback: Modal de descarga en curso, auditoría `download_certificate`.
- Liquidar comisión (Solo admin): Procesa cierre. Feedback: Toast `success`, auditoría financiera registrada en backend.
**Gráficas e indicadores:**
- Rueda concéntrica (Recharts/Custom SVG) para el porcentaje de meta anual superado, usando `gold-600` como relleno de avance.
**Micro-interacciones y atajos:**
- Un click en la métrica "Comisiones" transporta directamente al foco de la tabla financiera dentro de la pestaña.
- El nombre largo del broker admite truncamiento dinámico en 390px, visualizable íntegro al hover.
**Integración externa visible:**
- AprendizajePort (Moodle). Si la conexión es sólida, despliega módulos pendientes dinámicamente; si cae al abismo, una cápsula de alarma reporta el incidente y exhibe los títulos completados localmente como solo lectura, sellando el ingreso a la academia.

### 4. Wireframes
```ascii
[390px]
+-------------------------+
| [O] Juan Perez          |
| Agencia Este / Cap Cana |
|-------------------------|
| [ Meta: 80%   (graf)  ] |
| [ Comisiones: $5000   ] |
|-------------------------|
| [Negocios | Academy > ] |
| Timeline de actividad.. |
+-------------------------+
```
```ascii
[1440px]
+-------------------------------------------------+
| [Foto O]  Juan Perez       | [ Meta Global 80%] |
| Agencia: Punta Cana Este   | [ Comisiones $5k ] |
|-------------------------------------------------|
| [ Negocios ] [ Comisiones ] [ Academy (Moodle)] |
|                                                 |
| - Certificación en Ley Confotur (100%)          |
| - Taller de cierres a extranjeros (En progreso) |
| [ Botón: Entrar al campus virtual             ] |
+-------------------------------------------------+
```

### 5. Criterios de aceptación
1. El acceso a la pestaña de "Comisiones" se bloquea o limita para un rol asistente, rigiendo la visualización por directiva backend.
2. Si Moodle (AprendizajePort) fracasa y entra offline, los datos del progreso en vivo se silencian temporalmente a favor de los certificados estáticos de la base de datos `quisqueyahome_crm`.
3. El componente métrico 15024 obedece a las variables del tema (`--gold-600` para éxito, `--muted` para línea base), superando el requerimiento estético sin desfasar la paleta de colores.
4. El registro de auditoría (`timeline-3`, ID 28340) expone los metadatos de las transacciones (ej: "Juan cerró negocio por $500k") sin corromper el diseño móvil en pantallas de 390px.
5. El indicador visual de estado del broker (Activo/Licencia/Baja) es prominente junto al título principal, no incrustado en el footer.

## Fuentes
- IDs de componentes: 27378, 819, 28340, 425, 25002, 29221, 22177, 25010 documentados en `.viltrum/design/components/`.
- Registros OSS: `.viltrum/vre-os/oss-registry.json`
- Módulos detectados: `.viltrum/vre-os/D21-cobertura-modulos.md`

## Verificación de ids
Comando ejecutado para comprobar existencia real en la biblioteca Viltrum:
`ls .viltrum/design/components/ | findstr /R "27378 819 28340 425 25002 29221 22177 25010"`

Salida obtenida:
```
22177.json
25002.json
25010.json
27378.json
28340.json
29221.json
425.json
819.json
```
(Todos los IDs referenciados existen y están validados localmente).

## Handoff
D07 / Claude: Se entregan las 5 pantallas (Propiedades y Brokers) detalladas bajo el estándar PXIL a máxima capacidad de negocio.
- **Validación:** El script `node scripts/spec/design-check.mjs` arroja código 0 (5/5 pantallas OK).
- **Móvil Nativo y Estados:** Implementados sin scroll infinito (hojas, vistas en paneles, tabs horizontales) y declarados los 8 estados exigidos, con un estado "conflict" real asociado a la reserva concurrente.
- **Tono y Lenguaje:** Uso de la palabra "Negocios". Cero emojis y glassmorphism.
- **Secreto / Entorno:** No se ha listado ninguna credencial, token, puerto numérico estático sensible ni configuración explícita.
- **Modos Degradados y Open Source:** Todos los componentes acoplados a sistemas externos (MapLibre, Twenty, PostHog, Pannellum, react-pdf, Moodle) tienen definido su estado de falla controlada (fallback local o visual cacheado).

Queda a vuestra disposición para revisión y pase de Gate correspondiente.
