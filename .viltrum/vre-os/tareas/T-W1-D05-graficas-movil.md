# T-W1-D05 · Sistema de gráficas y patrón móvil (especificación, sin código de producto)

Perfil: **D05 UI / Design System**. Modo: analysis. Revisor: D07 (otro proveedor).
Mandato padre: `.viltrum/vre-os/M-20261004-VRE.md` §3 y W3. Diseño base: `docs/DESIGN.md` (tokens, tipografía, reglas
del dorado). Componentes existentes: `src/components/ui/` (shadcn), `src/app/(crm)/_ui/` (module-tabs, shell, dock).

## Hallazgos de un intento previo (Codex, run 20261004T171120Z) — úsalos, no los repitas
- `docs/DESIGN.md` ya referencia `charts-1` ("Revenue Bars Chart", id 29223) y `sheet-01` ("Sheet", id 25002).
- Ya existen `ModuleTabs`, `Metric`, `PageHeader`, `Sheet`, `Tabs`, `MobileDock`; no hay Recharts ni Vaul en `package.json`.
- `inicio/vista.tsx` calcula etapas del embudo con **porcentajes fijos** y la agenda tiene **datos escritos en la vista**:
  señálalos como hardcode a eliminar en la especificación.
- El dock ya contempla el inset inferior de iOS; faltan tokens de safe area y estilos de bottom sheet.
- La búsqueda `viltrum design` falló en sandbox de solo lectura: tú tienes terminal, ejecútala de verdad
  (`viltrum design --help` primero para la sintaxis) y cita ids reales.

**Escribe el entregable en el archivo indicado** (no como último mensaje).

## Problema
Las gráficas son barras CSS hechas a mano y una dona (`src/app/(crm)/reportes/`, `src/app/(crm)/inicio/`): sin ejes,
sin tooltip, sin leyenda accesible, sin estados. En móvil las vistas son una columna larga con mucho scroll.

## Qué entregar
1. **Gráficas**: adopta shadcn/ui Charts (Recharts, MIT) como única librería. Define:
   - mapeo de tokens → `--chart-1..6` (paleta de series categórica que cumpla AA sobre `surface`; dorado solo para la
     serie principal o el valor financiero; nunca texto dorado sobre blanco);
   - un componente contenedor `ChartCard` (título, subtítulo, selector de rango, acción, seis estados: carga con
     skeleton, vacío con acción, error con reintento, sin conexión, éxito, permiso insuficiente);
   - qué tipo de gráfica para cada métrica de Reportes/Inicio: embudo (barras horizontales escalonadas con tasa de
     paso entre etapas), canales (dona + tabla con ROI), tendencia mensual (área apilada), zonas (barras + mapa),
     brokers (ranking con barras), velocidad (histograma/box), pronóstico (línea con banda), inventario (barras
     apiladas por estado), comisiones (barras por mes);
   - reglas: ejes con formato de divisa `Intl.NumberFormat("es-DO", USD)`, tooltip, leyenda clicable, texto alterno.
2. **Móvil tipo app**: patrón para 320/390: tabs segmentadas por módulo (no más de una pantalla de scroll por tab),
   hoja inferior (shadcn Drawer/vaul) para detalle y acciones, dock de 5 ítems existente, KPIs en carrusel o 2×2,
   tablas que pasan a lista de tarjetas, áreas táctiles ≥48 px, safe-area de iOS.
3. **Búsqueda en la librería de Viltrum Design**: usa `viltrum design search --query "<patrón>" --limit 8` en
   `C:\Users\wilbe\Documents\QuisqueyaHome_CRM` (o el catálogo `E:\VILTRUM\VILTRUM DESING\pxil-ecosystem\private-library\catalog-index.json`)
   y, si está disponible, la CLI de 21st, para dashboard, KPI, tabs y bottom sheet. Elige 1–2 candidatos por patrón
   con id, por qué y qué hay que normalizar.
4. Wireframes en texto (ASCII) de Inicio y Reportes en 390 y 1440 con tabs.

## Prohibido
Modificar archivos fuera del entregable. Instalar paquetes. Commit.

## Entregable
`.viltrum/vre-os/D05-graficas-movil.md` con las secciones 1–4 y `## Fuentes` (ids de componentes y rutas consultadas).
