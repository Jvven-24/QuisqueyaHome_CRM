# UX2 · Pipeline operativo

Contrato READY `specs/ux-operativa-20261031/spec.md`; reparto `TAREA-UX2.md`. Productor premium_comercial. Fuente: versión completa de rama integración, sin backend/datos/auth/env ni dependencias nuevas. Nivel L3 hasta QA independiente de la compilación final.

## Diagnóstico y corrección

1. **Limpiar no limpiaba:** `limpiarFiltros` retiraba solo resultado/broker/proyecto/etapa y dejaba búsqueda y filtros de página. Auditor reprodujo en 9303 `?resultado=open&q=__QA_NO_MATCH__&sinAccion=1`: al limpiar permanecían `q` y `sinAccion`. Ahora se retiran todos los criterios de filtro (incluidos origen/días/probabilidad), conservando modo/presentación.
2. **Cabeceras de fila pegajosas:** `<tbody><th scope=row>` heredaba `position:sticky;top:0` del CSS global. Auditor confirmó posición calculada en primeras filas a 9303. Se aplica `static!` a las cabeceras de fila de ListaNegocios; el encabezado de columnas mantiene su comportamiento.
3. **Búsqueda enterrada:** búsqueda de página ahora es primaria y visible con alcance explícito y conteo. No se simula una búsqueda global en servidor. Filtros avanzados siguen limitados a filas cargadas; la UI explica que totales del servidor no cambian.
4. **Filtro sin contexto:** básicos con etiquetas, chips removibles de resultado/etapa/broker/proyecto y contador que incluye avanzados; controles se deshabilitan durante actualización/guardado. Se monta una sola variante escritorio/hoja móvil.
5. **Herramientas densas:** tres bloques independientes: Vistas y presentación; Filtros avanzados; Seleccionar y exportar. Preferencias de campos, columnas, etapas y CSV siguen disponibles. Los campos de filtros avanzados se sincronizan al cambiar la URL, evitando defaults obsoletos después de limpiar o elegir una vista.
6. **Tablero móvil:** una etapa legible, selector de etapa con conteo y navegación anterior/siguiente; no miniaturas de siete columnas ni alturas anidadas. El arrastre móvil se desactiva porque las otras etapas no están montadas; el menú accesible «Mover a etapa» conserva las transiciones reales. Escritorio conserva dnd-kit y teclado.
7. **Tarjetas y listas:** próxima acción sin truncado, fuente y nombres que envuelven, broker con nombre completo; acción de mover clara, WhatsApp con nombre accesible. Totales por moneda se distribuyen sin mezclarse y cada columna distingue filas cargadas/total. Lista móvil por grupos de atributos y contexto de selección.
8. **Leads:** búsqueda GET conserva campos canónicos desde props (`source_id`, `status`, `cola`) y parámetros de contexto adicionales al buscar, salvo paginación, selección y disparadores de alta/voz, excluyendo claves duplicadas. La página actual admite q/source_id/status/page/cola; no se simula soporte de filtro por broker/proyecto que el backend todavía no acepta. Se incorporan chips removibles de búsqueda/canal/estado y una acción de limpiar siempre visible aunque los controles móviles estén cerrados. Impacto LeadsVista repetido: LOW0. La validación final detectó la regresión del hidden canónico con URL simulada vacía (`m41-r2.test.ts:66`); corregida únicamente en la vista, sin alterar el test.

## Impacto

GitNexus upstream PipelineVista, Tablero, TarjetaOrdenable, ColumnaEscritorio, SeccionMovil, TarjetaNegocio, BarraFiltros, Campos, HerramientasNegocios, ListaNegocios y limpiarFiltros: LOW, cero dependientes/procesos indexados para cada símbolo. Limitación JSX: alcance real es la ruta Negocios y sus variantes, no se infiere aislamiento del índice. No se renombraron símbolos públicos ni se cambiaron permisos, validación, payloads o reglas de transición.

## Verificación y pendientes

Confirmación visual inicial mostró exceso vertical a 390: herramientas secundarias apiladas y selector de etapa alto. Batch final: opciones de vista bajo un único expansivo móvil, KPI activo en línea, contador de búsqueda local conciso, selector y navegación de etapa en una fila; escritorio comparte fila de buscador/filtros y elimina borde nativo de fieldset. El alcance local de la búsqueda sigue visible en el contador. Pendiente confirmar nueva captura 390×844 que incluya primer negocio.

Productor ejecuta solo lint focal; no build/dev, pruebas globales, git ni escrituras de negocio. Principal ejecuta checks e integra compilación; auditor verificará 320/390/768/1440, selector/prev-next, abrir ficha, menú de transición sin persistir, búsqueda/clear y parámetros conservados. No se declara funcionalidad de mover validada contra mutación real de datos durante esta pasada. El servidor mantiene las condiciones reales (actividad, responsable/fecha, propiedad, cierre y pérdida), explicadas en el menú.
