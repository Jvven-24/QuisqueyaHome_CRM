# D05 · Catálogo de Componentes e Interfaz PXIL · QuisqueyaHome CRM

**Fecha:** 2026-10-03  
**Perfil:** D05 Diseño UI & Biblioteca de Componentes  
**Revisor Independiente:** D09 Frontend  
**Estado:** Especificado

---

## 1. Conexión con Viltrum Design Studio & Quisqueya Studio
El CRM adopta el ecosistema de componentes de producción probado en Quisqueya Studio (`PortalWeb/src/studio/ui`) y la suite visual PXIL de Viltrum (`E:\Viltrum\VILTRUM DESING\pxil-ecosystem\demo-app`):

### Componentes Clave:
1. **`DataTable` (Basado en `PortalWeb/src/studio/ui/DataTable.tsx`):**
   - Tabla interactiva con paginación fluida, ordenamiento multivariable, selección de filas por teclado y renderizado virtual para listas de más de 500 leads sin degradar la memoria del navegador.
2. **`ToneBadge` (Basado en `PortalWeb/src/studio/ui/tone.ts`):**
   - Sistema de tonos cromáticos rigurosos: `gold` (exclusivo / Confotur), `green` (cerrado / ganado), `navy` (institucional), `blue` (en seguimiento), `red` (perdido / urgente) y `neutral`.
3. **`MetricCard` (Evolución de `prototipo-ui.tsx`):**
   - Tarjetas KPI con tipografía Hanken Grotesk en negrita, micro-icono Lucide contextual, badge de tendencia comparativa mensual y nota descriptiva en texto atenuado.
4. **`CommandPalette` (Paleta de Comandos `Ctrl + K` / `Cmd + K`):**
   - Acceso ultrarrápido para buscar leads por nombre, teléfono dominicano o proyecto, y saltar directamente a cotizaciones o vistas sin usar el ratón.
5. **`Drawer360` (Ficha Lateral de Lead / Deal):**
   - Panel lateral deslizante (Framer Motion / Tailwind transitions) para inspeccionar y editar detalles del cliente, timeline de llamadas y notas sin perder el contexto del embudo Kanban.
6. **`AudioNoteExtractorWidget`:**
   - Reproductor minimalista con transcripción por bloques y botones de confirmación HITL ("Aprobar zona y presupuesto" / "Descartar").
