# Diseño Profundo PXIL: Propiedades y Brokers

**Perfil:** D05 UI / Design System
**Objetivo:** Rediseño profundo a capacidad máxima (decisión #46) para CRM Inmobiliario de lujo.
**Revisores:** D07, Claude.

---

## 1. Concepto a máxima capacidad y orígenes (Capa OSS)

### 1.1 SCR-PROP-CATALOGO (Catálogo de Propiedades)
*   **Capacidades:** Listado visual con mapa interactivo en vista dividida (split view). Facetas de búsqueda avanzadas (ubicación, tipo, rango de precios, Confotur). Barra de disponibilidad de inventario.
*   **Cobertura:**
    *   **Mapa interactivo:** Integrar MapLibre GL JS (OSS). Puerto/Modo: `APP`.
    *   **Búsqueda y Filtros:** Componentes nativos de interfaz (construir) y patrón de filtro avanzado (id `1633`).
    *   **Estado de conexión (MapLibre):** Conectado (mapa renderizado), Degradado (mapa estático o error de tiles, listado funcional), Desconectado (solo lista, mapa oculto).

### 1.2 SCR-PROP-PROYECTO (Detalle del Proyecto)
*   **Capacidades:** Hub central del proyecto. Pestañas de Resumen, Unidades, Avances de obra, Documentos, y Negocios. Calculadora fiscal Confotur interactiva (3% transferencia + 1% IPI por 15 años). Galería inmersiva.
*   **Cobertura:**
    *   **Calculadora Confotur:** Componente React aislado (portar/construir desde base id `3029`).
    *   **Gestión de proyectos (Avances):** Integrar Twenty (CRM) o módulo propio. Puerto `PORT`.
    *   **Documentos:** Integración con S3/OpenProperty.
    *   **Estado de conexión:** Si los servicios de documentos/avances fallan, el CRM muestra caché de solo lectura (estado Degradado) y un banner de aviso.

### 1.3 SCR-PROP-MATRIZ (Matriz de Unidades)
*   **Capacidades:** Visualización de la torre/proyecto en matriz (piso x unidad). Código de colores por estado (Disponible, Bloqueada, Vendida). Hoja lateral (bottom sheet en móvil, side-panel en desktop) al seleccionar unidad para reservar/bloquear. Precio variable según rol (admin vs broker).
*   **Cobertura:**
    *   **Matriz interactiva:** Componente de cuadrícula personalizada (construir).
    *   **Sistema de Reservas:** Integrar módulo central.

### 1.4 SCR-BRK-RANKING (Ranking de Brokers)
*   **Capacidades:** Tabla de clasificación por volumen USD, cierres y conversión. Metas y tendencia de crecimiento.
*   **Cobertura:**
    *   **Gráficos/Tendencias:** Integrar Recharts.
    *   **Estado de conexión:** Si falla la analítica en tiempo real (Twenty/OSS), mostrar caché diario (Degradado).

### 1.5 SCR-BRK-PERFIL (Perfil 360 del Broker)
*   **Capacidades:** Panel completo del broker. Negocios activos, metas, comisiones acumuladas. Formación y certificación (Academy). Información de agencia y territorio asignado.
*   **Cobertura:**
    *   **Academy / Formación:** Integración con Moodle (OSS). Puerto `REFERENCE`. Estado conectado: muestra progreso. Estado desconectado: Oculta la sección de Academy.
    *   **Mensajería/Contacto:** Integración con Chatwoot/Evolution. Si falla, el botón WhatsApp cae a enlace `wa.me` nativo.

---

## 2. Librería Viltrum Design (Evaluación PXIL)

*Búsquedas realizadas en CLI:* map, filter, calculator, tabs, gallery, profile, sidebar, ranking.

### Evaluación de componentes adquiridos

**Componente: Map View (ID: 27503)**
*   **Encaje:** `SCR-PROP-CATALOGO` visualización de propiedades.
*   **Normalización a tokens:** Aplicar variables de color de fondo y acentos (`--color-action`, `--color-surface`).
*   **Riesgo Accesibilidad:** Alto. Requiere lista en DOM paralela para lectores de pantalla, el canvas no es accesible por defecto.
*   **Móvil:** Alternancia estricta Lista/Mapa mediante toggle flotante (no dividir pantalla en 390px).
*   **Dependencias/Licencia:** MapLibre GL (OSS MIT).

**Componente: Filter Sidebar (ID: 1633)**
*   **Encaje:** Facetas para `SCR-PROP-CATALOGO`.
*   **Normalización a tokens:** Tipografía premium, inputs con bordes `--color-border-subtle`.
*   **Riesgo Accesibilidad:** Foco visible en checkboxes y sliders. `aria-expanded` en acordeones.
*   **Móvil:** Bottom sheet (vaul) en lugar de sidebar.
*   **Dependencias/Licencia:** shadcn/ui (MIT).

**Componente: Financial Calculator (ID: 3029)**
*   **Encaje:** Base interactiva para Calculadora Confotur en `SCR-PROP-PROYECTO`.
*   **Normalización a tokens:** Tipografía tabular (`font-variant-numeric: tabular-nums`).
*   **Riesgo Accesibilidad:** Actualizaciones dinámicas requieren `aria-live="polite"`.
*   **Móvil:** Stack vertical, sin anidamiento complejo.
*   **Dependencias/Licencia:** React nativo (MIT).

**Componente: Tabs Layout (ID: 4086)**
*   **Encaje:** Navegación en `SCR-PROP-PROYECTO` y `SCR-BRK-PERFIL`.
*   **Normalización a tokens:** Transiciones de estado activo usando variables PXIL.
*   **Riesgo Accesibilidad:** Navegación por teclado (flechas) según patrón Tabs W3C.
*   **Móvil:** Scroll horizontal con indicador visual de desbordamiento.
*   **Dependencias/Licencia:** Radix UI / shadcn (MIT).

**Componente: Media Gallery (ID: 2055)**
*   **Encaje:** Hero visual en `SCR-PROP-PROYECTO`.
*   **Normalización a tokens:** Sombras premium (`shadow-premium-hover`).
*   **Riesgo Accesibilidad:** Botones de control con `aria-label`, foco gestionable, atributos `alt` dinámicos.
*   **Móvil:** Swipe táctil nativo.
*   **Dependencias/Licencia:** Embla Carousel (MIT).

---

## 3. Screen Recipes

### SCR-PROP-CATALOGO (Catálogo de Propiedades)
*   **Jerarquía y zonas:**
    *   Top: Barra de búsqueda, resultados (KPI), toggle Mapa/Lista.
    *   Left (Desktop): Sidebar de filtros (ID: 1633).
    *   Center (Desktop): Split view 30/70 (Mapa ID 27503 y Grid).
*   **Datos exactos:** `SELECT id, name, price, type, bedrooms, bathrooms, area, confotur, coords, status FROM properties WHERE status = 'available'`
*   **Componentes:** `ui-filter-sidebar` (1633), `ui-map-view` (27503), `ui-property-card`.
*   **Puntos de corte:**
    *   390/430px: Solo lista o mapa. Filtros en Bottom Sheet.
    *   768px: Grid de 2 columnas.
    *   1440px: Split view persistente.
*   **Estados (8):**
    *   *Inicial:* Skeleton del layout.
    *   *Carga:* Skeletons en tarjetas, overlay suave en mapa.
    *   *Vacío:* "No hay propiedades que coincidan con estos filtros." -> Acción: "Limpiar filtros".
    *   *Parcial:* Scroll infinito (cargando más).
    *   *Error:* "No pudimos cargar el inventario." -> Acción: "Reintentar".
    *   *Offline:* "Navegando sin conexión. Mostrando datos locales."
    *   *Conflicto:* N/A (solo lectura).
    *   *Éxito:* Listado y pines renderizados.
    *   *Sin permiso:* N/A (vista general).
*   **Micro-interacciones:** Hover en tarjeta ilumina pin en mapa, y viceversa.

### SCR-PROP-PROYECTO (Detalle del Proyecto)
*   **Jerarquía y zonas:**
    *   Hero: Galería de imágenes (ID: 2055).
    *   Main: Header de proyecto, Tabs (ID: 4086).
    *   Sidebar (Desktop): Calculadora Confotur (ID: 3029) y Call to Action principal.
*   **Datos exactos:** `SELECT * FROM projects WHERE id = ?`; `SELECT COUNT(*) FROM units WHERE project_id = ? AND status='available'`.
*   **Puntos de corte:**
    *   390/430px: Hero colapsable. Tabs en scroll horizontal. Calculadora al fondo.
    *   1440px: Hero inmersivo, sidebar sticky a la derecha.
*   **Estados (8):**
    *   *Inicial:* Skeletons hero y contenido.
    *   *Carga:* Transición de datos.
    *   *Vacío:* "Proyecto no encontrado."
    *   *Parcial:* Galería cargada, esperando datos de unidades.
    *   *Error:* "Error al cargar los detalles."
    *   *Offline:* "Conexión perdida. Mostrando versión guardada."
    *   *Conflicto:* "Este proyecto fue modificado recientemente por otro administrador."
    *   *Éxito:* Todos los componentes visibles y activos.
    *   *Sin permiso:* "No tienes autorización para ver las comisiones completas de este proyecto." (Asistente).

### SCR-PROP-MATRIZ (Matriz de Unidades)
*   **Jerarquía y zonas:**
    *   Top: Controles de Torre, Leyenda.
    *   Center: Cuadrícula interactiva.
    *   Bottom/Side: Panel de detalle de unidad para reservar.
*   **Datos exactos:** `SELECT id, floor, number, status, price, role_overrides FROM units WHERE project_id = ?`.
*   **Puntos de corte:**
    *   390px: Pan y zoom de matriz. Panel en Bottom Sheet (vaul).
    *   1440px: Matriz centralizada, side-panel emergente.
*   **Estados (8):**
    *   *Inicial:* Layout base.
    *   *Carga:* Grid con pulsos (skeleton).
    *   *Vacío:* "No hay unidades registradas en esta torre."
    *   *Parcial:* N/A.
    *   *Error:* "No se pudo cargar la matriz."
    *   *Offline:* "Modo sin conexión. Las reservas están deshabilitadas."
    *   *Conflicto:* "Esta unidad fue bloqueada hace 2 segundos por otro broker." -> Acción: "Refrescar matriz".
    *   *Éxito:* Matriz interactiva coloreada.
    *   *Sin permiso:* Botón "Bloquear" deshabilitado con tooltip explicativo (Asistente).

### SCR-BRK-RANKING (Ranking de Brokers)
*   **Jerarquía y zonas:**
    *   Top: Filtros (Periodo, Equipo).
    *   Center: DataTable con avatares, métricas y minigráficos (sparklines).
*   **Datos exactos:** `SELECT broker_id, SUM(volume), COUNT(deals), AVG(conversion_rate) FROM deals WHERE status = 'won' GROUP BY broker_id`. (Módulo: Negocios).
*   **Puntos de corte:**
    *   390px: Tarjetas apiladas (no tabla).
    *   1440px: Tabla completa.
*   **Estados:**
    *   *Carga:* Skeleton de tabla.
    *   *Offline:* "Mostrando ranking de ayer." (Degradado).
    *   *Éxito:* Datos mostrados con barras relativas de progreso.

### SCR-BRK-PERFIL (Perfil 360 del Broker)
*   **Jerarquía y zonas:**
    *   Top: Header (Avatar, Agencia, Territorio).
    *   Main: Tabs (ID: 4086) - Negocios, Metas, Comisiones, Academy.
*   **Datos exactos:** `SELECT * FROM users WHERE role = 'broker' AND id = ?`; Integración Moodle API (certificaciones).
*   **Puntos de corte:**
    *   390px: Diseño nativo de perfil (1 columna).
    *   1440px: Dashboard 2 columnas.
*   **Estados (Énfasis OSS):**
    *   *Conectado (Academy):* Muestra cursos y progreso.
    *   *Desconectado (Academy):* Oculta pestaña Academy o muestra banner "Sistema de formación inaccesible."
    *   *Sin permiso:* Asistente solo ve datos públicos; Admin ve y edita metas.

---

## 4. Wireframes ASCII y Tokens

**Wireframes a 390px (Móvil Nativo - Hoja Inferior, Dock)**
```text
[ SCR-PROP-CATALOGO - 390px ]
+---------------------------+
| Q QuisqueyaHome      [=]  |
+---------------------------+
| [Buscar propiedades...]   |
| [Filtros v] [Mapa  [=]]   |
+---------------------------+
| [ Imagen de Propiedad ]   |
| Villa Cap Cana - $2.5M    |
| 4 Hab | 5 Ba | [Confotur] |
+---------------------------+
| [ Imagen de Propiedad ]   |
| ...                       |
+---------------------------+
| [ 🏠 Inicio ] [ 📊 Rank ] | <-- Dock Móvil Nativo
+---------------------------+
```

**Wireframes a 1440px (Desktop)**
```text
[ SCR-PROP-CATALOGO - 1440px ]
+-------------------------------------------------------------+
| Q QuisqueyaHome   [Catálogo] [Proyectos] [Brokers]  [Admin] |
+-------------------------------------------------------------+
| Filtros          | Resultados (42)              | Mapa      |
| [x] Confotur     | +--------------------------+ | +-------+ |
| [x] Frente mar   | | [ Imagen ] Villa Cap C.  | | | Map   | |
|                  | | $2.5M | 4 Hab | 5 Ba     | | | Libre | |
| Rango:           | +--------------------------+ | |       | |
| [$1M] - [$5M]    | +--------------------------+ | |       | |
|                  | | [ Imagen ] Ocean View    | | |       | |
| Tipo:            | | ...                      | | +-------+ |
+-------------------------------------------------------------+
```

**Tokens/Variantes nuevas (Definiciones):**
*   `--color-confotur-badge`: `var(--color-emerald-500)`
*   `--color-confotur-text`: `var(--color-emerald-950)`
*   `--color-matrix-available`: `var(--color-slate-100)`
*   `--color-matrix-reserved`: `var(--color-amber-100)`
*   `--color-matrix-sold`: `var(--color-rose-100)`
*   `shadow-premium-hover`: `0 10px 40px -10px rgba(0,0,0,0.08)`
*   `transition-matrix`: `all 0.2s cubic-bezier(0.4, 0, 0.2, 1)`

---

## 5. Handoff

*   **Para D07 (Accesibilidad):**
    *   Validar componente de Matriz (`SCR-PROP-MATRIZ`) para asegurar navegación con flechas de teclado (grid navigation pattern) y anuncio de estados de ocupación por lector de pantalla.
    *   Validar contraste de `--color-confotur-badge` con su texto correspondiente en modo oscuro y claro.
*   **Para D09 (Frontend):**
    *   **OSS Fallbacks:** Las integraciones externas (MapLibre, Moodle, Chatwoot) deben envolverse en *Error Boundaries* específicos. Si caen, deben mostrar el estado Degradado definido en la receta, y nunca provocar una pantalla blanca (pantalla de la muerte de React).
    *   Implementar `vaul` para el Bottom Sheet en todas las vistas de 390px, asegurando que el Dock móvil nativo persista.
*   **Para D14 (Verificación):**
    *   Validar que los tests unitarios y E2E verifiquen explícitamente el estado `Offline` y `Conflicto`.
*   **Terminología:** Se utiliza el término **"Negocios"** en lugar de "deals" o "pipeline", conforme a la decisión #46.

---

## Fuentes
*   Viltrum Design Ecosystem IDs:
    *   `27503` (Map View)
    *   `1633` (Filter Sidebar)
    *   `3029` (Calculator)
    *   `4086` (Tabs)
    *   `2055` (Media Gallery)
*   MapLibre GL JS: `https://maplibre.org/`
*   Twenty CRM (Core): `https://twenty.com/`

## Verificación de ids

Comando para verificar que los componentes existen en el catálogo:

```bash
viltrum design . status
```

**Salida (Ids importados y disponibles en el proyecto):**
```json
{
  "imported": [
    "1603",
    "1633",
    "2055",
    "3029",
    "4086",
    "758",
    "27503"
  ]
}
```
