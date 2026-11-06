---
estado: READY
nivel: L2
tipo: mantenimiento-ui
---
# UX operativa · segunda pasada autorizada

Mandato directo de Wilber, 31/10/2026: mejorar distribución y experiencia de todo el CRM, especialmente Tareas, Pipeline, filtros, selectores, notificaciones y adaptación móvil; retirar REA del producto. Esta orden amplía explícitamente la exclusión histórica de Tareas de G22, exclusivamente en presentación y correcciones demostrables de interacción. No se inventan procesos de negocio.

Usuarios/datos/permisos: los existentes del CRM; datos de PostgreSQL recibidos por las páginas, mismas guardas, acciones y validaciones. Sin nuevas tablas, migraciones, permisos, conectores ni env. Sin envíos externos ni push Git.

## Contrato visual
- Cabecera breve, navegación de vistas reconocible, búsqueda primaria, filtros secundarios agrupados y estado activo visible.
- Escritorio: lista/tablero y detalle con densidad operativa. Teléfono: una tarea o etapa legible, filtros revelables, controles >=44 px, ninguna reducción artificial de página.
- Tareas: trabajo pendiente primero, resumen compacto, detalles y plantillas accesibles sin desplazar la lista. Conservar todos los filtros, estados y acciones reales.
- Pipeline: columnas con identidad, totales por moneda, tarjetas orientadas a próxima acción; alternativa táctil a arrastre, transiciones reales conservadas.
- Notificaciones: avisos temporales descartables, bandeja persistente separada; no afirmar push de sistema si no hay servicio/suscripción.
- Comparador y Configuración: lectura y especificación hasta liberación confirmada por el agente concurrente.
- Estados: carga, vacío, sin resultados, error recuperable, sin conexión y permiso limitado conservados y comprensibles; ninguna acción simulada presentada como persistente.
- Accesibilidad: etiquetas, foco y teclado; AA, movimiento reducido; 320/390/768/1440.

## Criterios
1. Sin REA en texto visible ni nuevo contenido guardado por la UI.
2. Tableros, listas y filtros navegables con teclado y teléfono, sin recortes ni solapamientos no intencionados.
3. Búsqueda, filtros, selección y cambio de vistas conservan el contexto. No escribir datos reales durante QA.
4. Avisos temporales expiran y pueden cerrarse; estado real de notificaciones documentado.
5. Tipos/lint/tests/build local aislado y revisión visual independiente; sin cerrar gates formales sin otro proveedor.

Fuentes: docs/DESIGN.md, G20/G22 (READY), M41 CA6; Android canonical layouts, Carbon Data Table, Linear Issue Selection. Se reutilizan Radix, dnd-kit, Recharts y Sonner ya instalados. No dependencias nuevas.
