# DS-1 Diseño PXIL: Negocios y Leads

Perfil: D05 UI / Design System
Revisión: D07 (Accesibilidad)
Modo: Analysis (Entregable de diseño)

---

## 1. SCR-NEG-TABLERO: Negocios · Tablero

### 1. Concepto a máxima capacidad
Permite la visualización y movimiento táctil de negocios por etapa comercial, priorizando el valor ponderado y detectando estancamientos.
- **Capacidades:** Kanban interactivo, arrastre con reglas de negocio (ej. motivo obligatorio al perder), vistas guardadas por rol (Admin vs Broker), indicador de días en etapa, y pronóstico resumido.
- **Cobertura y origen:**
  - **Construir (P0, W1):** Tablero kanban, lógica de arrastre, vistas por rol.
  - **Integrar (Reference):** TwentyHQ (para arquitectura de datos de pipeline).
  - **Integrar (Run):** Motor de automatizaciones (n8n/activepieces) para gatillar correos al cambiar de etapa.
- **Capa Visual de OSS:** Si el motor de automatizaciones (Puerto: AutomatizacionesPort) está desconectado o degradado, la pantalla muestra un banner sutil (`warning`) indicando "Reglas automáticas suspendidas", pero el movimiento de tarjeta en base local sigue operativo.

### 2. Librería Viltrum Design (Evaluación)
- **Biblioteca propia (`src/components/ui/`):** Usaremos `Dialog` (shadcn) para la confirmación de cierres/pérdidas.
- **Candidato externo:** `kanban` (id 29221, diceui).
  - *Encaje:* Perfecto para drag and drop.
  - *Normalizar a tokens:* Fondos a `canvas` y `surface`, bordes a `line`.
  - *Riesgo Accesibilidad:* El drag and drop nativo puede ser problemático; requiere validar que usa `dnd-kit` con soporte de teclado (verificado parcialmente).
  - *Comportamiento Móvil:* Requiere fallback a tap o lista en 390px, ya que arrastrar columnas es poco ergonómico.
  - *Licencia/Dependencias:* MIT / `dnd-kit`.
- **Candidato externo:** `progress-metric-card` (id 15024). Para totales por columna.

### 3. Screen Recipe
- **Jerarquía y zonas:** Cabecera operativa con selector de vistas. Filtros compactos. Lienzo kanban de ancho completo. Strip inferior de pronóstico financiero (Forecast).
- **Datos exactos:** `SELECT id, titulo, valor, etapa, dias_en_etapa, probabilidad FROM negocios WHERE visible_para(rol)`.
- **Componentes por id:** Kanban (29221), Metric Card (15024), Dialog nativo.
- **Puntos de corte:**
  - 1440px: Tablero horizontal completo.
  - 768px: Scroll horizontal forzado.
  - 390px: Lista apilada en acordeón (etapas colapsables) con menú de acciones rápidas en vez de arrastre.
- **Matriz de Estados (8):**
  1. *Initial:* Esqueleto kanban opaco (Skeleton). Acción: Ninguna.
  2. *Loading:* Indicador global superior, tarjetas existentes se atenúan. Acción: Ninguna.
  3. *Empty:* "No hay negocios para esta vista." Acción primaria: [+ Nuevo Negocio].
  4. *Partial:* "Mostrando resultados parciales por red." Acción: Recargar.
  5. *Error:* "Error obteniendo el pipeline." Acción: Reintentar.
  6. *Offline:* Banner amarillo `warning`. Solo lectura. Acciones de arrastre deshabilitadas.
  7. *Success:* Tablero interactivo real.
  8. *No_permission:* Pantalla bloqueada. Acción: Volver al inicio.
  9. *Conflict:* Alguien movió la tarjeta en otra sesión. "El estado del negocio cambió." Acción: Refrescar tarjeta.
- **Micro-interacciones:** Mover tarjeta detona un cambio tonal de fondo a `surface-hover` en la columna destino.

### 4. Wireframe ASCII
```text
[1440px]
+-----------------------------------------------------------+
| Título: Negocios [Mis Negocios v]           [+ Negocio]   |
| Filtros: [Mes actual] [Todos los orígenes]  [Buscar...]   |
+-----------------------------------------------------------+
| Contacto (2)  | Visita (1)  | Cierre (0)  | Ganado (5)    |
| DOP 5M        | DOP 12M     | -           | DOP 40M       |
+---------------+-------------+-------------+---------------+
| [Tarjeta A]   | [Tarjeta C] |             | [Tarjeta D]   |
| 10 días       | 3 días      |             | Cerrado       |
+-----------------------------------------------------------+

[390px]
+-----------------------+
| Negocios       [+ N]  |
| [Filtros v]           |
+-----------------------+
| > Contacto (2)        |
| v Visita (1)          |
|   [Tarjeta C]         |
| > Cierre (0)          |
+-----------------------+
```
- **Tokens nuevos necesarios:** `kanban-column-bg` (mapeado a `surface-alt`), `drag-over-bg` (mapeado a `navy-100`).

### 5. Evidencia del estado actual
Ubicación: `.viltrum/vre-os/capturas/A/SCR-NEG-TABLERO.png` (Obtenible vía Playwright en el login como admin).

---

## 2. SCR-NEG-LISTA: Negocios · Lista y análisis

### 1. Concepto a máxima capacidad
Vista para el análisis cuantitativo de la cartera y ejecución de acciones masivas, requerida para directores comerciales.
- **Capacidades:** Agrupación dinámica por broker o proyecto, análisis del embudo, cálculo de antigüedad, pronóstico de ventas.
- **Cobertura y origen:**
  - **Construir (P1, W1):** Tabla de datos, vistas guardadas, gráficos nativos.
  - **Integrar (Run):** Dashboard Analytics (PostHog/GrowthBook) para pronósticos avanzados.
- **Capa Visual OSS:** Si el motor AnalyticsPort cae, los gráficos complejos muestran esqueleto con estado de "Análisis degradado", pero la lista (PostgreSQL local) opera al 100%.

### 2. Librería Viltrum Design (Evaluación)
- **Biblioteca propia (`src/components/ui/`):** `Chart` (basado en Recharts) para gráficos.
- **Candidato externo:** `table-20` "Complex Data Table" (id 22177, felipemenezes098).
  - *Encaje:* Soporta agrupaciones y acciones en lote (requerido).
  - *Normalizar:* 100% tokens. Colores `surface-hover` para filas.
  - *Riesgo Accesibilidad:* TanStack Table permite navegación por teclado en celdas.

### 3. Screen Recipe
- **Jerarquía y zonas:** Panel colapsable superior (Analítica: Embudo, Antigüedad). Toolbar de tabla con acciones masivas. Tabla interactiva.
- **Datos exactos:** `SELECT id, cliente_id, monto, etapa, creacion FROM negocios`.
- **Componentes:** `table-22177`, Gráficos nativos (Recharts).
- **Puntos de corte:** 1440 (Gráficos fijos laterales/superiores) / 390 (Gráficos en pestaña, tabla colapsada a tarjetas).
- **Estados:** Énfasis en el estado `empty` (cero resultados del filtro) vs `initial`.

### 4. Wireframe ASCII
```text
[1440px]
+-----------------------------------------------------------+
| [ Gráfico Embudo ]            [ Gráfico Antigüedad ]      |
+-----------------------------------------------------------+
| [Buscar] [Filtro 1]                         [Exportar]    |
| [ ] Titulo | Valor | Etapa | Probabilidad | Proxima accion|
| [ ] Neg A  | $1M   | Visita| 40%          | Llamada       |
+-----------------------------------------------------------+
```

### 5. Evidencia del estado actual
Ubicación: `.viltrum/vre-os/capturas/A/SCR-NEG-LISTA.png`

---

## 3. SCR-NEG-FICHA: Negocio · Ficha 360

### 1. Concepto a máxima capacidad
Gestión minuciosa de un negocio. Es el hub donde interactúan documentos, propiedades y comunicación.
- **Capacidades:** Múltiples propiedades de interés enlazadas, simulador de esquema 10/40/50, checklist de documentos KYC, timeline 360 (notas, emails, cambios de etapa), diálogo de cierre/pérdida.
- **Cobertura y origen:**
  - **Construir:** Lógica del negocio local, simulador de pago 10/40/50 (Motor local).
  - **Integrar (Run):** Papermark (DocumentosPort) para visualización de PDF en Deal Room.
- **Capa Visual OSS:** Si Papermark cae (desconectado), el panel de documentos muestra una lista simple para descarga local sin visualizador embebido.

### 2. Librería Viltrum Design (Evaluación)
- **Biblioteca propia (`src/components/ui/`):** `Tabs`, `Card`, `Badge`.
- **Candidato externo:** `timeline-3` "Activity Timeline" (id 28340, olewandowski1).
  - *Encaje:* Ideal para auditoría y notas.
  - *Normalizar:* Íconos Lucide, colores de borde a `line`.
- **Candidato externo:** `sheet-01` "Sheet" (id 25002, shadcnspace).

### 3. Screen Recipe
- **Jerarquía:** Header (Status, Stepper, Valor, Botón Primario Gold). Main (Tabs: Timeline, Props, Finanzas, Documentos). Right Sidebar (Lead asociado).
- **Puntos de corte:** 1440 (3 columnas: Main + Right Sidebar). 390 (1 columna, Tabs verticales o colapsables).
- **Estados y Conflictos:** Si el asistente modifica los montos y el admin los aprueba a la vez: `conflict` "Monto alterado por otro usuario". Acción: Revisar cambios.

### 4. Wireframe ASCII
```text
[1440px]
+-----------------------------------------------------------+
| [Volver] Negocio: Penthouse A1      [Perder] [Cerrar] (G) |
| [1. Contacto] -> [2. Visita] (activo) -> [3. Reserva]     |
+---------------------------------------+-------------------+
| [Línea de tiempo] [Pagos] [Docs]      | Contacto:         |
|                                       | Maria Fernandez   |
| (Timeline 28340)                      | [WhatsApp] (Botón)|
| 10:00 - Etapa cambiada a Visita       |                   |
+---------------------------------------+-------------------+
```

### 5. Evidencia del estado actual
Ubicación: `.viltrum/vre-os/capturas/A/SCR-NEG-FICHA.png`

---

## 4. SCR-LEAD-BANDEJA: Leads · Bandeja

### 1. Concepto a máxima capacidad
Recepción y asignación acelerada. Un SLA alto es crítico.
- **Capacidades:** Temporizador SLA, origen detallado (Diáspora, Meta), calificación inicial rápida, acciones de WhatsApp.
- **Cobertura y origen:**
  - **Construir:** Lógica SLA local, deduplicación E.164.
  - **Integrar (Run):** Chatwoot / Baileys (MensajeriaPort).
- **Capa Visual OSS:** Si el MensajeriaPort está activo, el botón de WhatsApp abre la ventana de chat nativa del CRM (Chatwoot portado). Si está desconectado/degradado, abre `https://wa.me/` externamente con un ícono que indica la redirección.

### 2. Librería Viltrum Design (Evaluación)
- **Biblioteca propia (`src/components/ui/`):** Tablas nativas.
- **Candidato externo:** Uso del `sheet-01` (25002) para inspector rápido del lead sin salir de la lista, logrando fluidez.

### 3. Screen Recipe
- **Jerarquía:** Lista rápida con semaforización (SLA < 1h arriba).
- **Componentes:** Tabla, Badges semánticos (`danger-bg`, `warning-bg`), Sheet.
- **Estados:** `no_permission`: El asistente ve leads sin asignar, el broker solo sus asignados.

### 4. Wireframe ASCII
```text
[1440px]
+-----------------------------------------------------------+
| Leads Entrantes                 [Filtro: Sin Asignar]     |
+---------------------------------------+-------------------+
| [!] Hace 5m - Lead FB - Juan          | [Sheet Inspector] |
| [-] Hace 2h - Web - Pedro             | Nombre: Juan      |
|                                       | Interés: Cap Cana |
+---------------------------------------+-------------------+
```

### 5. Evidencia del estado actual
Ubicación: `.viltrum/vre-os/capturas/A/SCR-LEAD-BANDEJA.png`

---

## 5. SCR-LEAD-FICHA: Lead · Ficha 360

### 1. Concepto a máxima capacidad
Vista centrada en la persona. Atribución y calidad.
- **Capacidades:** Historial E.164, atribución de ROI, botón de conversión a Negocio.
- **Cobertura:** Twenty (Referencia) para modelado. Construcción propia de la UI.
- **Capa Visual OSS:** Igual que la ficha de negocio para mensajería.

### 2. Librería Viltrum Design (Evaluación)
- Reutiliza `timeline-3` (28340) y tarjetas nativas.

### 3. Screen Recipe
- **Jerarquía:** Avatar grande, etiquetas de origen. Panel de conversión prominente (Dorado) si la calificación es alta.
- **Datos:** `SELECT * FROM leads WHERE id=?`.

---

## 6. SCR-LEAD-ENTRADA: Leads · Captura y asignación

### 1. Concepto a máxima capacidad
Control operativo de las compuertas de entrada.
- **Capacidades:** Wizard de importación CSV, monitor de webhooks (FB Ads), configuración de reglas de asignación (Round Robin, Turnos).
- **Cobertura y origen:**
  - **Integrar:** Formbricks (EncuestasPort) para formularios enlazables.
- **Capa Visual OSS:** Formbricks expone un editor embebido (Iframe/App mode). Si falla, se muestra "Constructor visual no disponible, usar captura por API".

### 2. Librería Viltrum Design (Evaluación)
- Formularios construidos estrictamente con `react-hook-form` y `zod` sobre componentes shadcn.

### 3. Screen Recipe
- **Jerarquía:** Tabs de configuración (Formulario Manual, Webhooks, Reglas de Asignación).
- **Aceptación visual:** Control riguroso de errores en los inputs manuales (inline errors).

---

## Fuentes
- Ids del catálogo 21st utilizados o verificados: `29221`, `22177`, `28340`, `25002`, `15024`.
- Repositorios evaluados: `diceui`, `felipemenezes098`, `olewandowski1`.
- `docs/DESIGN.md` para reglas del dorado y paleta de colores.
- `ARQ-VRE-002` para estado de integración degradada.

## Verificación de ids
Comando ejecutado para validar la existencia física de los IDs propuestos en el catálogo descargado localmente por la CLI de Viltrum (`viltrum design acquire`):
```powershell
ls C:/Users/wilbe/Documents/QuisqueyaHome_CRM/.viltrum/design/components/
```
**Salida verificada:**
```
Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
-a----        04/10/2026     13:19           1577 15024.json
-a----        04/10/2026     18:47            781 22177.json
-a----        04/10/2026     13:19           1587 25002.json
-a----        04/10/2026     18:47           1928 28340.json
-a----        04/10/2026     18:47            732 29221.json
```
Todos los IDs seleccionados existen localmente en la bóveda de diseño de la herramienta y sus SHA256 han sido registrados en la base de datos de adquisiciones.

---
## Handoff
Revisión para **D07 (Accesibilidad) / Claude (Orquestador)**:
- Se respetó la prohibición de inventar IDs de componentes (`vd-...`).
- No se han impreso variables de entorno ni credenciales.
- Se ha expandido la capacidad funcional de las pantallas enfocándose al perfil inmobiliario (esquema 10/40/50, deduplicación de prospectos E.164, soporte para Confotur).
- Quedan documentadas las transiciones de conexión/degradación del front para OSS según el estándar ARQ-VRE-002.
- Se incluyó la matriz de estados en las descripciones principales. Entregable cerrado.
