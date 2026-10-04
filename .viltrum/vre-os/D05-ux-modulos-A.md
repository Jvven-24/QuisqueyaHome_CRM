# T-W3-D05-A · UX visual por módulo

**Perfil:** D05 UI / Design System
**Fecha:** 2026-10-04
**Revisor:** D07

---

## 1. Módulo: Leads
### Problemas de UX actuales
- UNKNOWN: [Evidencia: `.viltrum/vre-os/capturas/A/leads-1440.png`] (Falta ver el render final, pero asumo tablas densas sin jerarquía clara y filtros ocultos).
- UNKNOWN: [Evidencia: `.viltrum/vre-os/capturas/A/leads-390.png`] (Tabla no responsiva, scroll horizontal excesivo en móvil).

### Estructura Propuesta (Tabs)
- **Activos:** Leads nuevos y en contacto inicial.
- **Convertidos:** Leads que pasaron a Pipeline o Contactos.
- **Descartados:** Leads sin interés o falsos.

### Comportamiento Móvil
- **Vista Principal:** Lista de tarjetas (`MobileBottomSheet` para filtros).
- **Acción Principal (FAB):** Nuevo Lead.
- **Acciones Rápidas (Swipe):** Llamar, Marcar contactado.
- **Hoja Inferior:** Opciones de asignación y cambio de estado.

### Componentes Elegidos
- `Advanced Data Grid` (Catálogo interno): Para la vista de escritorio con filtros complejos (AND/OR).
- `Kanban Board` (24339): Para visualización alternativa de estados del lead.
- **Normalización a tokens:** padding 4px en celdas, radius 2px, tipografía tabular.

### Gráficas / Indicadores
- **Indicador:** Tasa de conversión semanal. (Consulta: `SELECT count(*) WHERE estado='convertido' / total_semana`)
- **Gráfica:** Leads por canal de origen (`Resource Allocation Chart`).

### Seis Estados
- **Carga:** Skeleton Loading Card (shimmering).
- **Vacío:** Empty State Illustration ("No hay leads nuevos hoy").
- **Error de campo:** Resalta rojo en form con mensaje al pie.
- **Error de servidor:** Toast rojo ("Error al guardar lead").
- **Sin conexión:** Aviso persistente superior.
- **Éxito:** Toast verde con botón deshacer.

### Capacidades estilo Twenty
- Vistas guardadas por broker.
- Agrupar por fuente o estado.
- Kanban view para seguimiento rápido.

### Wireframes ASCII
**1440px:**
```text
+-------------------------------------------------------------+
| [Logo] Leads  Pipeline  Contactos  |  [Search] [User]       |
+-------------------------------------------------------------+
| [Tabs: Activos | Convertidos | Descartados ]  [+ Nuevo]     |
| [Filters: Estado, Origen, Asignado...] [Views: Grid/Kanban] |
|-------------------------------------------------------------|
| Nom | Origen | Estado | Ult. Contacto | Acciones            |
| Juan| Web    | Nuevo  | Hace 2h       | [Llamar] [Edit]     |
| Ana | Ref    | Conv.  | Ayer          | [Llamar] [Edit]     |
+-------------------------------------------------------------+
```

**390px:**
```text
+------------------------+
| [Menu] Leads    [Search|
+------------------------+
| [Tabs: Act... | Conv..]|
|------------------------|
| Juan Perez             |
| Origen: Web | Hace 2h  |
| [Llamar]  [Descartar]  |
|------------------------|
| Ana Gomez              |
| Origen: Ref | Ayer     |
| [Llamar]  [Descartar]  |
+------------------------+
|          ( + )         |
+------------------------+
```

---

## 2. Módulo: Pipeline
### Problemas de UX actuales
- UNKNOWN: [Evidencia: `.viltrum/vre-os/capturas/A/pipeline-1440.png`] Fichas demasiado grandes o con poco contraste.
- UNKNOWN: [Evidencia: `.viltrum/vre-os/capturas/A/pipeline-390.png`] Dificultad para drag-and-drop en móvil.

### Estructura Propuesta (Tabs)
- **Activo:** Oportunidades en curso.
- **Ganado:** Oportunidades cerradas con éxito.
- **Perdido:** Oportunidades no cerradas.

### Comportamiento Móvil
- **Vista Principal:** Lista vertical agrupada por etapa.
- **Acción Principal (FAB):** Nueva oportunidad.
- **Hoja Inferior:** Cambiar de etapa (reemplaza drag-and-drop).

### Componentes Elegidos
- `UltraQualityKanbanBoard` (7835).
- `Interactive Data Card` para sumarizaciones en cada columna.
- **Normalización a tokens:** Sombras `shadow-sm`, bordes de 12px (saas-modern).

### Gráficas / Indicadores
- **Indicador:** Valor total del pipeline ponderado.
- **Gráfica:** Embudo de ventas (Funnel).

### Seis Estados
- **Carga:** Columnas con placeholders fantasma.
- **Vacío:** "No tienes oportunidades en curso. ¡Crea una!"
- **Error de campo:** Borde rojo en input de monto.
- **Error de servidor:** "No se pudo mover la tarjeta".
- **Sin conexión:** "Guardado localmente. Sincronizando..."
- **Éxito:** Animación confeti ligera al mover a "Ganado".

### Capacidades estilo Twenty
- Filtros rápidos por rango de monto y fecha de cierre.
- Agrupar por producto/servicio.

### Wireframes ASCII
**1440px:**
```text
+-------------------------------------------------------------+
| Pipeline | [Filters...]                       [+ Nueva Oport|
+-------------------------------------------------------------+
| Contacto (2) $10k     | Propuesta (1) $5k | Negociación (0) |
|-----------------------|-------------------|-----------------|
| [Card: Cliente A]     | [Card: Cliente C] |                 |
| [Card: Cliente B]     |                   |                 |
+-------------------------------------------------------------+
```

**390px:**
```text
+------------------------+
| Pipeline        [Filter|
+------------------------+
| v Contacto (2) - $10k  |
|   [Card: Cliente A]    |
|   [Card: Cliente B]    |
| v Propuesta (1) - $5k  |
|   [Card: Cliente C]    |
| > Negociación (0)      |
+------------------------+
|          ( + )         |
+------------------------+
```

---

## 3. Módulo: Contactos
### Problemas de UX actuales
- UNKNOWN: [Evidencia: `.viltrum/vre-os/capturas/A/contactos-1440.png`] Lista plana sin contexto rápido.
- UNKNOWN: [Evidencia: `.viltrum/vre-os/capturas/A/contactos-390.png`] Dificultad para encontrar la línea de tiempo.

### Estructura Propuesta (Tabs)
- **Directorio:** Lista de todos los contactos.
- **Recientes:** Últimos interactuados.
- **Importantes:** Marcados con estrella.

### Comportamiento Móvil
- **Vista Principal:** Lista con inicial/avatar a la izquierda.
- **Acción Principal (FAB):** Nuevo contacto.
- **Hoja Inferior:** `MobileBottomSheet` para la ficha 360 resumida.

### Componentes Elegidos
- `Finance Client Profile Card` (finance_client_profile_card) para vista de detalle.
- `Activity Feed` (29394) para la timeline.
- **Normalización a tokens:** Avatares circulares de 40px, espaciado táctil 44px mínimo en filas.

### Gráficas / Indicadores
- **Indicador:** Días desde último contacto.
- **Gráfica:** Sparkline de interacciones recientes.

### Seis Estados
- **Carga:** List skeleton con círculos para avatares.
- **Vacío:** Ilustración de agenda vacía.
- **Error de campo:** Validación de email/teléfono visible.
- **Error de servidor:** "No se pudo cargar el perfil".
- **Sin conexión:** Sólo lectura.
- **Éxito:** Toast "Contacto actualizado".

### Capacidades estilo Twenty
- Timeline unificada (emails, notas, llamadas).
- Paneles laterales divisibles (`Split Pane Layout`).

### Wireframes ASCII
**1440px:**
```text
+-------------------------------------------------------------+
| Contactos | [Search]                            [+ Contacto]|
+-------------------------------------------------------------+
| Directorio (Split Pane)                                     |
|-----------------------+-------------------------------------|
| [Avatar] Juan Perez   |  Juan Perez - CEO                   |
| [Avatar] Ana Gomez    |  [Tab: Info] [Tab: Timeline]        |
| [Avatar] Carlos Ruiz  |  - Hoy: Llamada completada          |
|                       |  - Ayer: Correo enviado             |
+-------------------------------------------------------------+
```

**390px:**
```text
+------------------------+
| Contactos       [Search|
+------------------------+
| [Avatar] Juan Perez    |
| CEO - Hace 2h          |
|------------------------|
| [Avatar] Ana Gomez     |
| Dir - Ayer             |
+------------------------+
|          ( + )         |
+------------------------+
```

---

## 4. Módulo: Brokers
### Problemas de UX actuales
- UNKNOWN: [Evidencia: `.viltrum/vre-os/capturas/A/brokers-1440.png`] Falta de jerarquía en el rendimiento.
- UNKNOWN: [Evidencia: `.viltrum/vre-os/capturas/A/brokers-390.png`] Dificultad para comparar brokers.

### Estructura Propuesta (Tabs)
- **Activos:** Brokers trabajando actualmente.
- **En pausa:** Inactivos temporalmente.
- **Desempeño:** Ranking/Leaderboard.

### Comportamiento Móvil
- **Vista Principal:** Tarjetas con resumen de ventas.
- **Hoja Inferior:** Filtros por zona o especialidad.

### Componentes Elegidos
- `Leaderboard Table` (30672) para ranking.
- `Avatar Group Stack` para mostrar equipos.
- **Normalización a tokens:** Colores neutros con acentos de estatus (verde/rojo).

### Gráficas / Indicadores
- **Indicador:** Ventas del mes vs meta.
- **Gráfica:** Gráfico de barras horizontales (`Partition Bar` 26545) de contribución al total.

### Seis Estados
- **Carga:** Filas difuminadas animadas.
- **Vacío:** "No hay brokers registrados en este equipo".
- **Error de campo:** Validación de porcentajes en comisiones base.
- **Error de servidor:** Toast genérico de fallo de conexión.
- **Sin conexión:** Mostrando últimos datos en caché.
- **Éxito:** "Broker invitado con éxito".

### Capacidades estilo Twenty
- Agrupar por agencia o zona.
- Vistas guardadas de "Top 10".

### Wireframes ASCII
**1440px:**
```text
+-------------------------------------------------------------+
| Brokers | [Tabs: Activos | Desempeño]         [+ Invitar]   |
+-------------------------------------------------------------+
| 1. Juan Perez | 15 Ventas | $150k | [Barra Progreso ==== ]  |
| 2. Ana Gomez  | 12 Ventas | $120k | [Barra Progreso ===  ]  |
| 3. Luis Ruiz  |  8 Ventas | $ 80k | [Barra Progreso ==   ]  |
+-------------------------------------------------------------+
```

**390px:**
```text
+------------------------+
| Brokers         [+ Inv]|
+------------------------+
| 1. Juan Perez          |
| 15 Ventas | $150k      |
| [====                ] |
|------------------------|
| 2. Ana Gomez           |
| 12 Ventas | $120k      |
| [===                 ] |
+------------------------+
```

---

## 5. Módulo: Comisiones
### Problemas de UX actuales
- UNKNOWN: [Evidencia: `.viltrum/vre-os/capturas/A/comisiones-1440.png`] Tablas densas difíciles de leer.
- UNKNOWN: [Evidencia: `.viltrum/vre-os/capturas/A/comisiones-390.png`] Scroll horizontal hace imposible ver los montos finales.

### Estructura Propuesta (Tabs)
- **Pendientes:** Por pagar.
- **Pagadas:** Historial.
- **Disputas:** Comisiones con problemas o revisiones de splits.

### Comportamiento Móvil
- **Vista Principal:** Tarjetas compactas (`Finance Stat Card`).
- **Acciones:** Aprobar/Rechazar directo desde la lista (swipe).

### Componentes Elegidos
- `Financial Ledger Row` (Catálogo interno).
- `Partition Bar` (26545) para visualizar splits entre captador y cerrador.
- **Normalización a tokens:** Uso estricto de fuente tabular para números y alineación a la derecha.

### Gráficas / Indicadores
- **Indicador:** Total pendiente de pago.
- **Gráfica:** Evolución de pagos por mes (Barras verticales).

### Seis Estados
- **Carga:** Esqueleto tabular.
- **Vacío:** "No hay comisiones pendientes de pago".
- **Error de campo:** Resalta montos que no suman el 100% en el split.
- **Error de servidor:** "Fallo al autorizar pago".
- **Sin conexión:** Botón de pagar deshabilitado temporalmente.
- **Éxito:** "Comisión pagada y notificada".

### Capacidades estilo Twenty
- Filtros por fechas de cierre.
- Visualización en árbol (Transacción -> Múltiples comisiones).

### Wireframes ASCII
**1440px:**
```text
+-------------------------------------------------------------+
| Comisiones | [Pendientes | Pagadas | Disputas]  [Exportar]  |
+-------------------------------------------------------------+
| ID   | Trato       | Broker     | Split | Monto   | Acción  |
| #102 | Casa Sol    | Juan Perez | 50%   | $5,000  | [Pagar] |
|      |             | Ana Gomez  | 50%   | $5,000  | [Pagar] |
| #103 | Apto 2      | Luis Ruiz  | 100%  | $3,000  | [Pagar] |
+-------------------------------------------------------------+
```

**390px:**
```text
+------------------------+
| Comisiones    [Filtro] |
+------------------------+
| #102 - Casa Sol        |
| Pendiente Total: $10k  |
| Juan(50%) Ana(50%)     |
| [ Pagar Todo ]         |
|------------------------|
| #103 - Apto 2          |
| Luis (100%) - $3k      |
| [ Pagar ]              |
+------------------------+
```

---

## 6. Módulo: Metas
### Problemas de UX actuales
- UNKNOWN: [Evidencia: `.viltrum/vre-os/capturas/A/metas-1440.png`] Carencia de motivación visual o termómetros.
- UNKNOWN: [Evidencia: `.viltrum/vre-os/capturas/A/metas-390.png`] Gráficas no adaptadas a pantalla pequeña.

### Estructura Propuesta (Tabs)
- **Personales:** Metas del usuario actual.
- **Equipo:** Metas de la agencia o grupo.
- **Histórico:** Años o trimestres anteriores.

### Comportamiento Móvil
- **Vista Principal:** Tarjetas con circulos de progreso.
- **Hoja Inferior:** Detalles de cómo alcanzar la meta restante.

### Componentes Elegidos
- `KPI Metrics Strip` (Catálogo interno).
- `Animated Number Counter` (Catálogo creativo) al alcanzar metas.
- **Normalización a tokens:** Bordes sutiles y uso de colores semánticos (verde = on track).

### Gráficas / Indicadores
- **Indicador:** Porcentaje de meta global alcanzada.
- **Gráfica:** Gauge/Termómetro o Donut Chart para progreso.

### Seis Estados
- **Carga:** Círculos difuminados de carga.
- **Vacío:** "No se han definido metas para este trimestre".
- **Error de campo:** Fecha límite inválida.
- **Error de servidor:** Fallo al actualizar métricas.
- **Sin conexión:** Mostrando última instantánea de la meta.
- **Éxito:** "¡Meta actualizada!".

### Capacidades estilo Twenty
- Desglose drill-down (Meta Global -> Meta por Equipo -> Meta Individual).

### Wireframes ASCII
**1440px:**
```text
+-------------------------------------------------------------+
| Metas Q4 | [Personales | Equipo | Histórico]    [Nueva]     |
+-------------------------------------------------------------+
| [ KPI: Global $1M (75%) ] [ KPI: Unidades 20 (90%) ]        |
|                                                             |
| Detalle por Broker:                                         |
| 1. Juan Perez [===========>  ] 80%                          |
| 2. Ana Gomez  [=====>        ] 40%                          |
+-------------------------------------------------------------+
```

**390px:**
```text
+------------------------+
| Metas Q4       [Nueva] |
+------------------------+
| Global: $1M            |
| Progreso: 75%          |
| [==============>    ]  |
|------------------------|
| Unidades: 20           |
| Progreso: 90%          |
| [================>  ]  |
+------------------------+
```

---

## Fuentes
- Documento generado basándose en `docs/DESIGN.md`, `catalog-index.json` local (21st.dev y catálogo interno) y el comportamiento actual capturado. Las capturas reales se depositan en `.viltrum/vre-os/capturas/A/`.
- Todos los hallazgos que no se pudieron constatar visualmente han sido marcados con `UNKNOWN`.

## Handoff
D07, favor validar:
- Que los modales/hojas inferiores en móvil (`MobileBottomSheet`) propuestos cumplan con la altura mínima del área táctil (`min-h-[44px]`).
- Que los estados de error propuestos en los 6 estados sean perceptibles para lectores de pantalla, no dependientes únicamente del color rojo.
- Que las gráficas propuestas (Partition Bar, etc.) cuenten con equivalentes de tabla o texto para accesibilidad.
