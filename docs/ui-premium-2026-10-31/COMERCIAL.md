# Entrega comercial · Inicio, Leads, Contactos

Contrato: G20/G22/M41 READY; `TAREA.md`. Productor: subagente premium_comercial. Nivel L3, pendiente QA visual de principal/auditor.

## Cambios

- Inicio: paneles con menos ornamentación y padding coherente; cabeceras y filas reflow; la identidad del lead ya no compite en una sola línea estrecha con estado y WhatsApp. Agenda y ranking admiten contenido largo. Barras de embudo sólidas con transición de ancho de 200 ms y movimiento reducido. Enlaces solo icono con nombre accesible.
- Leads: búsqueda y filtros agrupados con etiquetas persistentes, conteo como metadato secundario, botón Buscar visible. En teléfono los filtros adicionales se despliegan con botón explícito (`aria-expanded`/`aria-controls`); contador y aviso de filtros activos siempre visibles. Nombre/estado y fuente/SLA/acciones se agrupan para reducir altura de tarjetas; presupuesto/responsable/proyecto pueden envolver. La ficha usa `Link` para conservar navegación del cliente. No se modifica la consulta ni la URL resultante de filtros.
- Contactos: búsqueda explícita por formulario con Enter y botón; canal etiquetado, distribución adaptable y conteo secundario. Se conserva el estilo del campo que ya estaba modificado por otro productor. Se retira importación `Link` sin uso.

## Impacto y validación

`gitnexus impact <InicioVista|LeadsVista|ContactosVista> --direction upstream --repo QuisqueyaHome_CRM`: LOW, 0 callers/procesos indexados en cada símbolo. El índice puede omitir montaje Next/JSX: el alcance real es la presentación de las tres rutas y sus modos de lista, sin cambios compartidos.

Lint focal de los tres archivos: exit 0, sin advertencias. No se ejecutaron build/dev, pruebas globales ni escrituras de datos. La revisión estática no encuentra cambios de API, auth, permisos, consultas, payloads o cálculos. Mantener revisión independiente.

`git diff --check` global encontró whitespace ajeno en `propiedades/_componentes/catalog-explorer.tsx`; no se tocó porque hay trabajo concurrente. Revisión visual pendiente a 320/390/768/1440, especialmente barras de filtros y contenido largo. Los formularios de alta y sus handlers permanecen fuera de esta entrega.
