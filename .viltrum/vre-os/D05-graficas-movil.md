# D05: Sistema de gráficas y patrón móvil (Especificación)

## 1. Gráficas

**Librería principal:** `shadcn/ui Charts` (basada en Recharts, MIT).

**Reglas de Diseño y Tokens:**
- **Paleta Categórica (`--chart-1` a `--chart-6`):** Colores que garanticen contraste AA sobre el color `surface`. 
- **Regla del Dorado:** El color dorado o primario de la marca **solo** se utilizará para la serie principal o el valor financiero más destacado. *Nunca usar texto dorado sobre fondo blanco*.

**Contenedor `ChartCard`:**
Un componente envolvente estandarizado para toda gráfica en el sistema.
- **Estructura:** Título (h3/h4), Subtítulo (contexto), Selector de rango (mes/año/semestre), Acción secundaria (ej. exportar o ver detalle).
- **6 Estados Obligatorios:**
  1. **Carga:** Skeleton ocupando el alto exacto del chart.
  2. **Vacío:** Mensaje explicativo y acción ("Crear primer registro").
  3. **Error:** Mensaje de fallo técnico + botón de reintento.
  4. **Sin conexión:** Aviso de estado offline con los últimos datos en caché si los hay.
  5. **Éxito:** Gráfica renderizada interactiva.
  6. **Permiso insuficiente:** Tarjeta bloqueada visualmente indicando que el rol no tiene acceso.

**Tipos de Gráfica por Métrica:**
- **Embudo (Inicio/Reportes):** Barras horizontales escalonadas (indicando explícitamente la tasa de conversión entre etapas). *Nota técnica:* Se debe **eliminar el hardcode de porcentajes fijos** actualmente presente en `inicio/vista.tsx`.
- **Canales:** Gráfica de dona combinada con una tabla de ROI detallada.
- **Tendencia mensual:** Gráfica de área apilada.
- **Zonas:** Gráfico de barras (opcionalmente combinado con mapa de calor si hay suficientes datos).
- **Brokers:** Gráfico de barras horizontales (formato de ranking).
- **Velocidad de ventas:** Histograma o Box plot.
- **Pronóstico (Forecast):** Gráfico de línea con banda de confianza de fondo.
- **Inventario:** Gráfico de barras apiladas por estado (disponible, reservado, vendido).
- **Comisiones:** Gráfico de barras verticales agrupadas por mes.

**Reglas Generales de Gráficas:**
- **Ejes y Formato:** Aplicar formato de divisa estricto mediante `Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" })` (o la divisa aplicable).
- **Interacción:** Tooltips siempre activos, leyenda clicable para aislar series visualmente.
- **Accesibilidad:** Proveer textos alternativos completos (`aria-label` o descripción en SR-only) con el resumen de la métrica para lectores de pantalla.


## 2. Patrón Móvil tipo App (Viewport 320px/390px)

- **Layout general:** No más de **una pantalla de scroll vertical** por Tab.
- **Tabs Segmentadas:** Uso de tabs deslizables horizontalmente por submódulo.
- **Bottom Sheet (Drawer):** Adoptar `vaul` (shadcn Drawer) para vista de detalle, edición rápida y acciones contextuales. Evitar modales centrados.
  - *Características:* Drag handle de 36x4px, header sticky (`sticky top-0`) con título truncado y acción de cierre, cuerpo con `overflow-y-auto`, y footer sticky con acciones primarias de ancho completo.
  - *Tokens:* `rounded-sheet = 1.25rem (20px)`.
- **Dock de Navegación:** Mantener el `MobileDock` existente de 5 ítems fijado en la parte inferior, asegurando integración con variables CSS de Safe Area de iOS (`--sat`, `--sab`, `--sal`, `--sar`).
- **Métricas:** KPIs organizados en un carrusel de desplazamiento horizontal o una grilla estricta de 2×2.
- **Listados de Datos:** Tablas de escritorio transformadas estructuralmente a **listas de tarjetas** (Cards). Las tablas horizontales con scroll están prohibidas en móvil.
- **Accesibilidad táctil:** Todo botón, tab, enlace o área de acción táctil debe tener un mínimo absoluto de **48x48 px** (incluso superior al estándar de 44px de iOS).


## 3. Búsqueda en la librería de Viltrum Design

Resultados obtenidos mediante CLI (`viltrum design search` y consulta directa a `catalog-index.json`):

**Dashboard:**
- **Candidato:** App Dashboard Layout (ID: `28770`)
- **Por qué:** Cuenta con una estructura completa (layout con navegación lateral colapsable, tarjetas de estadísticas y área de gráficos), perfecta para 1440px.
- **Normalización necesaria:** Cambiar las gráficas integradas al contenedor estandarizado `ChartCard`, inyectar la paleta categórica de QuisqueyaHome, y validar contrastes.

**KPI:**
- **Candidato:** Weekly KPI Chart (ID: `2503`)
- **Por qué:** Diseño compacto con feedback interactivo (animaciones de hover y gradientes), muy visual para métricas semanales o diarias en el módulo de Inicio.
- **Normalización necesaria:** Asegurar que las barras respeten la 'Regla del Dorado', reemplazar dependencias externas (si usa framer-motion puro para algo distinto) para alinear con el stack del CRM, y ampliar targets táctiles para la versión móvil.

**Tabs:**
- **Candidato:** Tabs (ID: `11641`)
- **Por qué:** Diseño limpio de paneles en capas, fundamental para segmentar las vistas saturadas.
- **Normalización necesaria:** Aumentar el tamaño del touch-target del área clickable a ≥48px en móvil y aplicar el token de color dorado para el indicador de tab activo.

**Bottom Sheet (Hoja inferior):**
- **Candidato:** Sheet - Different Directions (ID: `25002`) - *Ya referenciado en DESIGN.md*
- **Por qué:** Cubre todos los casos de drawers originados en los bordes; perfecto para estandarizar modales a bottom-sheets en versión móvil.
- **Normalización necesaria:** Forzar uso exclusivo tipo `bottom` en `< 768px`, aplicar el token de borde `rounded-sheet (20px)`, e implementar header/footer sticky.


## 4. Wireframes de Texto (ASCII)

### Vista: Inicio (1440px - Desktop)
```text
+-------------------------------------------------------------------------+
| [Logotipo]  [Inicio]  Agenda  Propiedades  Clientes  Reportes  [Perfil] |
|-------------------------------------------------------------------------|
| KPIs: [ Ingresos YTD ] [ Negociaciones ] [ Visitas ] [ Cierres Mes ]    |
|-------------------------------------------------------------------------|
| +-----------------------------------+ +-------------------------------+ |
| | Embudo de Ventas (ChartCard)      | | Próximos Cierres / Agenda     | |
| | [==============     ] 70% Etapa 1 | | - 10:00 Visita Villa 4        | |
| | [========           ] 40% Etapa 2 | | - 14:00 Firma Contrato A      | |
| | [====               ] 20% Etapa 3 | | (HARDCODE a eliminar)         | |
| +-----------------------------------+ +-------------------------------+ |
+-------------------------------------------------------------------------+
```

### Vista: Reportes (1440px - Desktop)
```text
+-------------------------------------------------------------------------+
| [Logotipo]  Inicio  Agenda  Propiedades  Clientes  [Reportes]  [Perfil] |
|-------------------------------------------------------------------------|
| Rendimiento Financiero y Comercial                  [Selector de Rango] |
|-------------------------------------------------------------------------|
| [Tab: General] [Tab: Canales] [Tab: Brokers] [Tab: Pronóstico]          |
|-------------------------------------------------------------------------|
| +-------------------------+ +-------------------------+                 |
| | Tendencia Mensual (Área)| | Canales (Dona + Tabla)  |                 |
| |                         | |                         |                 |
| +-------------------------+ +-------------------------+                 |
| +-------------------------+ +-------------------------+                 |
| | Comisiones (Barras mes) | | Inventario (Apiladas)   |                 |
| |                         | |                         |                 |
| +-------------------------+ +-------------------------+                 |
+-------------------------------------------------------------------------+
```

### Vista: Inicio (390px - Móvil)
```text
+-----------------------------------+
| [Logotipo]              [Perfil]  |
|-----------------------------------|
| KPI 1 (Carrusel) > KPI 2 > KPI 3  |
|-----------------------------------|
| Embudo (Barras Horizontales)      |
| [===================] 100%        |
| [==============] 75%              |
| [=======] 40%                     |
|-----------------------------------|
| Próximos Cierres (Tarjetas)       |
| [ Cierre 1 ]                      |
| [ Cierre 2 ]                      |
|-----------------------------------|
| (Dock: Inicio|Agenda|Prop|Cli|Más)|
+-----------------------------------+
```

### Vista: Reportes (390px - Móvil)
```text
+-----------------------------------+
| Reportes                [Filtro]  |
|-----------------------------------|
| [General] [Canales] [Brokers] >   |
|-----------------------------------|
| Tendencia Mensual                 |
| [  ChartArea  ]                   |
|-----------------------------------|
| Comisiones                        |
| [  ChartBars  ]                   |
|-----------------------------------|
| (Dock: Inicio|Agenda|Prop|Cli|Más)|
+-----------------------------------+
```

## Fuentes
- Rutas consultadas: `src/app/(crm)/reportes/`, `src/app/(crm)/inicio/vista.tsx`.
- Componentes consultados: `src/components/ui/`, `src/app/(crm)/_ui/`.
- IDs Catálogo Viltrum Design:
  - App Dashboard Layout: `28770`
  - Weekly KPI Chart: `2503`
  - Tabs: `11641`
  - Sheet: `25002`

---

## Handoff
Revisión para **D07 (Accesibilidad) / D14 (QA):**
- Por favor, verificar el flujo de contrastes AA de las variables categóricas `--chart-1..6` frente al token superficial de fondo.
- Asegurarse de que la 'Regla del Dorado' se cumple estrictamente sin generar combinaciones texto dorado sobre fondo claro.
- Validar mediante el modelo base de pruebas que las interacciones del Sheet (Drawer) y todos los enlaces tienen un touch target mínimo comprobable de 48px en la resolución viewport de 390px.
- Confirmar que los componentes de gráficas inyecten textos accesibles correctamente a lectores de pantalla (SR-only o aria-label).
- Se levantó una alerta por contenido hardcodeado de porcentajes y agenda en `inicio/vista.tsx` que debe ser remediado en la fase de implementación (D09/D10). No se modificó en este PR de solo diseño. 
- *Nota de seguridad*: No hubo exposición ni presencia de secretos en el resultado del análisis ni de la CLI.