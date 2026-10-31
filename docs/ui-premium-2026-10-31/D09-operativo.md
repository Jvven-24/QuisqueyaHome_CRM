# D09 · Refinamiento operativo

31/10/2026. Contrato `TAREA.md`, G20/G22/M41 READY. Solo presentación de `agenda/vista.tsx`, `brokers/vista.tsx`, `reportes/vista.tsx`, `comunicaciones/vista.tsx`.

## Cambios

- Agenda: navegación de semanas con iconos y nombres accesibles, selector móvil de vista, acceso a Mes y disponibilidad también en móvil; filtros con etiquetas persistentes y grid de columnas que se adapta. Se preservan valores, setters y todos los modos.
- Brokers: filtro de nivel en selector móvil en vez de banda de seis botones, controles de vista con estado anunciado y 48 px, tarjetas menos ornamentales y con nombre/especialidad sin truncado, ranking y pies que se distribuyen. Métricas y permisos sin cambios.
- Comunicaciones: configuración de canales en Accordion Radix secundario; se conservan las advertencias de salud y costo sin medición, el botón de actualización y todos los datos. Editor más ancho en pantalla intermedia; tres columnas solo cuando hay espacio suficiente. Contenido/acciones se distribuyen y la previsualización no usa un marco de teléfono voluminoso dentro de la pantalla de un teléfono. Label asociado al selector de canal y búsqueda identificada.
- Reportes: cabecera PageHeader compartida y acciones PDF/CSV que se adaptan; operaciones adicionales se sitúan después de los filtros. Se preservan exportación, impresión, permisos y membrete de impresión.

## Impacto y verificación del productor

GitNexus upstream para AgendaVista, BrokersVista, ReportesVista y ComunicacionesVista: LOW; 0 consumidores/procesos/módulos indexados. Esto no acredita aislamiento JSX: las cuatro páginas completas son el alcance visual y deben revisarse.

Comprobación sintáctica con TypeScript transpileModule de las cuatro vistas: 0 errores. `git diff --check` de los cuatro archivos: sin errores. No se ejecutaron build/dev, pruebas globales, commits ni servicios de datos.

## Seguridad y revisión pendiente

Diff acotado a JSX, clases, importaciones de UI y atributos accesibles. Sin cambios a auth, permisos, API, consultas, validaciones, env, datos, payloads o cálculos monetarios. No se leyeron ni copiaron credenciales.

Pendiente de revisión independiente y QA a 320/390/768/1440: navegación semanas/modos/filtros; niveles/modos de Brokers; Accordion/editor/canales/vista previa sin despacho; pestañas/filtros/export/impresión autorizados de Reportes. En Agenda medir altura del bloque de filtros con etiquetas y ruta mensual móvil; no retirar contenido para cumplir una métrica. No se marca L4 ni se cierran gates.
