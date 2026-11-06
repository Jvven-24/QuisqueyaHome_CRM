# D09 · UX2 Tareas y limpieza de Agenda

31/10/2026. Contrato `TAREA-UX2.md`; `specs/ux-operativa-20261031/spec.md` READY. Productor premium_operativo. Nivel L3, pendiente QA del principal y auditor independiente.

## Resultado

- Tareas presenta una cabecera breve con Crear/Asignar plan; las vistas Lista, Tablero, Equipo y Plantillas tienen navegación propia y conservan su estado local.
- Búsqueda y estado aparecen antes del trabajo. Responsable, proyecto, prioridad y vencimiento están agrupados en filtros expansivos con etiquetas persistentes; limpiar y conteo de coincidencias se muestran al filtrar.
- Resumen/KPI y la carga completa del equipo están en secciones expansivas. Conservan los cinco accesos de urgencia/estado, conteos, bandejas y acciones por broker; no desplazan la lista por defecto.
- Lista: título abre la edición existente, selección y completar/reabrir siguen a mano; pasos cerrados por defecto con estado expandido anunciado y progreso visible. Responsable visible y gestión de asignación/prioridad/reprogramación/eliminar en bloque expandible por tarea. Acciones en lote adaptadas a móvil. Todos los callbacks y payloads existentes se conservan.
- Tablero: teléfono muestra una columna elegible, con su conteo y tarjetas; desde tableta se muestran las columnas en cuadrícula. Sin sombras expansivas ni bordes ornamentales gruesos; responsables y acciones pueden distribuirse sin recortarse.
- Plantillas: sus listas largas de pasos se abren a demanda; las acciones de crear tarea y asignar secuencia siguen disponibles. Equipo y tarjetas conservan la operación existente.
- Se retiró REA del texto de producto/comentarios en Agenda/Tareas. Los nombres internos `categoriaRea`, `PLANTILLAS_VISITAS_REA` permanecen por compatibilidad. La descripción nueva de planes usa `Plan de trabajo:`. No se reescriben registros existentes ni textos aportados por usuarios.

## Impacto previo

GitNexus upstream: TareasVista, TableroTareas, ModalFormularioTarea, ModalDesplegarPackBroker, handleDesplegar, ModalRelevoColaBroker, AgendaVista y ModalCita: LOW, 0 consumidores/procesos indexados. Se comunicó que la indexación JSX es incompleta: alcance visual real las vistas completas y modales citados.

## Verificación del productor

- TypeScript transpileModule: 0 diagnósticos en TareasVista, TableroTareas y AgendaVista después de reestructurar.
- ESLint focal en los cuatro archivos de producto: exit 0, sin errores ni advertencias.
- No se escribieron ni modificaron pruebas. Se conserva el texto `Sub-tareas To-Do` que exige la prueba histórica de Tareas y los identificadores técnicos que esa prueba comprueba. La revisión independiente ejecutará los tests y flows, no el productor.
- No git/dev/build, APIs, permisos, consultas, cálculos, datos reales ni env modificados.

## Pendiente de auditor

A 320/390/768/1440 medir posición de primera tarea, abrir filtros/resumen/equipo, cambiar las cuatro vistas, elegir columna en teléfono, conservar búsqueda/estado al navegar, abrir/cerrar gestión y checklist, selección de lote y cancelación, vacíos, errores y modales sin guardar escrituras de negocio. Revisar copy en todos los modos y formularios. Confirmar que el nuevo texto de plan no contiene REA; registros históricos se preservan.

## Corrección de pasada visual independiente

Tras QA del principal a390×844, se comprimió la navegación de cuatro vistas a una fila (iconos solo desde sm), búsqueda y estado comparten una fila desde móvil y el bloque completo de resumen/carga del equipo se movió después de las cuatro áreas de trabajo y antes de los modales. No se retiró contenido. Comprobación sintáctica posterior: 0 diagnósticos. Se solicita repetir únicamente esa medida visual tras compilar, sin declarar el flujo aprobado por el productor.
