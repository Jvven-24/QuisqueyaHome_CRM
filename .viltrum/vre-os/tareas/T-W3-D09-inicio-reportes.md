# T-W3-D09 · Rediseño pro de Inicio y Reportes: gráficas reales, tabs y móvil tipo app

Perfil: **D09 Frontend**. Modo: fix en worktree. Revisor: D14 (otro proveedor, capturas 320/390/768/1440).
Autorización: decisiones #43/#44 (sí escribes código en los archivos listados; sin git, sin commit, sin `npm run dev`/`build`).
Especificación que manda: `.viltrum/vre-os/D05-graficas-movil.md`. Tokens y reglas: `docs/DESIGN.md`.
Datos: las consultas reales ya integradas en `src/application/reportes/` y `src/application/dashboard/` (commit `b376aad`; D10 no escribió informe, lee los puertos).
Componentes disponibles: `src/components/ui/chart.tsx` (Recharts 3.8), `drawer.tsx` (vaul), `card.tsx`, `tabs.tsx`,
`src/app/(crm)/_ui/module-tabs.tsx`, `MobileDock`. Referencias de la librería Viltrum Design ya adquiridas en
`.viltrum/design/components/`: 28770 (App Dashboard Layout), 2503 (Weekly KPI), 11641 (Tabs), 25002 (Sheet).

## Objetivo
Que Inicio y Reportes se vean como un producto profesional de banca patrimonial / real estate de lujo (DESIGN.md),
no como un boceto: jerarquía clara, cifras grandes y legibles, gráficas con ejes, tooltip y leyenda, y en móvil una
experiencia de app sin scroll interminable.

## Construir
1. `src/components/ui/chart-card.tsx` (o en `_ui/`): contenedor `ChartCard` con título, subtítulo, selector de rango,
   acción y **seis estados** (carga skeleton, vacío con acción, error con reintento, sin conexión, éxito, permiso
   insuficiente). Paleta de series `--chart-1..6` definida en `src/app/tokens.css` con contraste AA sobre `surface`
   (documenta los hex y su ratio en el entregable); dorado solo en la serie principal; nunca texto dorado sobre blanco.
2. **Inicio**: KPIs (leads, negocios activos, pipeline USD, cierres, conversión) con tendencia vs. periodo anterior;
   embudo real con tasa de paso; actividad de próximos días; leads que requieren atención. Móvil: KPIs 2×2 o carrusel,
   secciones en tabs (Resumen · Embudo · Agenda), máximo una pantalla de scroll por tab.
3. **Reportes** con tabs: Embudo · Canales (dona + tabla ROI) · Tendencia (área apilada 18 meses) · Zonas (barras) ·
   Brokers (ranking) · Velocidad · Inventario (barras apiladas por estado) · Comisiones · Pronóstico (línea con banda).
   Filtros de fecha/proyecto/broker que cambian la consulta real. Exportación CSV existente se conserva.
4. Formato `Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" })` vía una utilidad única (no repetida).
5. Accesibilidad: cada gráfica con resumen textual (`aria-label`/sr-only), tabs por teclado, foco visible `gold-700`.

## Defectos vistos tras integrar D10 (commit `b376aad`) — corrígelos
- Consola: "Encountered two children with the same key" para `Nuevo`, `Contactado`, `Cierre`, `Perdido`, `Cap Cana`:
  las listas usan el nombre visible como `key`. Usa el id/slug estable que devuelve la consulta.
- A 1440 px la fila de filtros de Reportes desborda la cabecera y el título se parte en 4 líneas: reorganiza la
  cabecera (título + descripción a la izquierda, filtros compactos en una barra propia o en un popover/hoja).
- No hay guarda anti-hardcode automática: añade la prueba (lee `inicio/vista.tsx`, `reportes/vista.tsx`,
  `repos/reportes.ts`, `repos/dashboard.ts` y falla ante arrays de datos con literales numéricos de negocio),
  comprobada por mutación.

## Reglas
- **Cero datos fijos** en vistas: todo número viene de las consultas de D10. La guarda anti-hardcode debe seguir verde.
- Nada de subrayados ni códigos internos visibles. Sin emojis. Sin glassmorphism.
- No cambies consultas ni casos de uso (si falta un dato, anótalo para D10 en el entregable).

## Archivos permitidos
`src/app/(crm)/inicio/**`, `src/app/(crm)/reportes/**`, `src/app/(crm)/_ui/**`, `src/components/ui/chart-card.tsx`,
`src/app/tokens.css`, `src/lib/formato*.ts`, tests de vista si existen.

## Verificación (pega la salida real)
`npx tsc --noEmit --incremental false` (ignora `.next/types`) · `npm run lint` · `npm test`.

## Entregable
`.viltrum/vre-os/D09-inicio-reportes.md`: decisiones de diseño, paleta con ratios, componentes usados por id,
mapa gráfica → consulta, y `## Pruebas`.
