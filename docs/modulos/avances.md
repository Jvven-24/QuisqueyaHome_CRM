# Avances de obra

## Propósito
Supervisar el progreso constructivo de cada proyecto: fases ordenadas, porcentaje de avance, estado, responsable técnico, evidencia fotográfica y video de inspección. El avance declarado alimenta el porcentaje global del proyecto, el comparador antes/después y un boletín listo para compartir con compradores. La publicación de una fase en el portal del comprador es una decisión editorial separada del progreso técnico.

Código de referencia: `app/(crm)/avances/` (`page.tsx`, `vista.tsx`, `_componentes/milestone-timeline.tsx`, `_ejemplo.ts`); API en `app/api/proyectos/[id]/fases/`; cálculos puros en `domain/avance-obra.ts`; casos de uso en `application/proyectos/casos-de-uso.ts`.

## Rutas
- **Pantalla:** `/avances?proyecto=<slug>&fase=<id>`. Sin `proyecto` se usa el primero visible; sin `fase`, la primera del proyecto. Un slug o id inválido cae al primero disponible (no hay 404 de fase).
- **Alta de fases:** `POST /api/proyectos/[id]/fases` con `{ plantilla: true }` (8 fases estándar) o `{ title }` (fase suelta al final).
- **Edición y borrado:** `PATCH` y `DELETE /api/proyectos/[id]/fases/[faseId]`.
- **Fotos:** `POST /api/proyectos/[id]/fases/[faseId]/fotos` (multipart, campo `foto`) y `DELETE /api/proyectos/[id]/fases/[faseId]/fotos/[fileId]`.
- **Enlaces de entrada:** la ficha de propiedad enlaza a `/avances?proyecto=<slug>` (`propiedades/[slug]/vista.tsx`).
- **Storage:** bucket privado `avances-obra`; las fotos se sirven con URL firmada de 1 hora.

## Roles y permisos
Recurso: `construction_phases` (`view`, `create`, `edit`, `delete`).

| Rol | Alcance sembrado | Puede |
|---|---|---|
| admin | all | Ver, crear plantilla/fases, editar, publicar/retirar, subir y borrar fotos, eliminar fases |
| manager | sin fila para `construction_phases` | **No accede** con el seed actual (la migración 0017 no le concede el recurso); requiere excepción explícita |
| assistant | all (`view`, `edit`) | Ver, editar fases, publicar/retirar y gestionar fotos; **no crea ni elimina fases** |
| broker | own (`view`) | Solo lectura de proyectos donde es `broker_id`; no edita, no sube fotos, no publica |

- La página exige `requireScopeInPage(actor, "construction_phases", "view")`; sin permiso devuelve 403.
- Las fases no tienen `broker_id`: el alcance se hereda del proyecto dueño con `visibleRows(actor, scope, projects.brokerId, projects.deletedAt)`. Las rutas de escritura repiten `proyectoVisible`/`faseVisible` antes de mutar.
- El borrado de una foto reutiliza `construction_phases:edit`; no existe un recurso de archivos propio para este módulo.
- La aprobación de publicación de una fase no tiene permiso ni bandeja independiente: la ejerce quien tenga `edit`.

## Flujos principales
1. **Elegir proyecto.** La consulta lista solo proyectos visibles y calcula su avance con el promedio de `construction_phases.progress_percent`. El selector cambia `?proyecto=` y conserva el resto de la URL.
2. **Crear la plantilla estándar.** Solo si el proyecto no tiene ninguna fase. Inserta, en una transacción, las 8 fases de `FASES_ESTANDAR` (Movimiento de tierra, Cimientos, Estructura, Muros, Instalaciones, Terminaciones, Áreas comunes, Entrega) con `position` 1–8, audita cada alta y recalcula el progreso del proyecto.
3. **Agregar una fase suelta.** Toma `position = máximo + 1`, título obligatorio y periodo opcional. No permite duplicar la posición (índice único por proyecto).
4. **Editar la fase.** Campos: título, periodo descriptivo, estado, porcentaje 0–100, fecha de corte, URL de video, nota pública, responsable y `isPublished`. El editor sincroniza en pantalla: 100 % marca «Completado», 0 % vuelve a «Pendiente», un estado «Completado» fuerza 100 %. Si cambia el porcentaje, el servidor recalcula el promedio del proyecto.
5. **Publicar o retirar del portal.** Antes de publicar, la UI evalúa evidencia visual (foto o video), nota pública de al menos 20 caracteres y responsable asignado; la fecha de corte es recomendada. También avisa de incoherencias entre estado y porcentaje. Si falta algo, muestra la guía y no envía el cambio. Retirar la publicación no exige requisitos.
6. **Subir evidencia.** La subida admite varias fotos por petición (máximo 25 MB en total). Cada archivo debe ser JPEG, PNG, WEBP o GIF de 10 MB o menos. Se sube al bucket privado y se crea una fila en `files` con `entity_type = "construction_phase"`; si falla la transacción, se compensa borrando los objetos ya subidos.
7. **Ver fotos.** La página firma todas las rutas de la fase en una sola llamada. Si falta la clave de servicio o falla Storage, el resto de la pantalla sigue y la bóveda muestra un aviso.
8. **Comparar antes/después.** Usa dos fotos reales con URL firmada. La cronología no se verifica automáticamente: la propia pantalla advierte que el orden temporal está pendiente de validar.
9. **Eliminar evidencia.** El borrado es lógico (`files.deleted_at`); el objeto de Storage se conserva. Al eliminar una fase se borran lógicamente sus fotos y luego la fila de la fase.
10. **Generar el boletín.** Con la fase seleccionada arma un texto con proyecto, avance global, fase, estado, periodo, supervisor, nota, video y número de fotos. Permite copiarlo o imprimirlo; no se guarda ni se envía.
11. **Consultar hitos y 360.** La pestaña «Fases e hitos» lista las fases reales y añade un espacio de hitos de ejemplo. La «Inspección 360°» es una vista previa que no solicita ni carga activos panorámicos.

## Datos
Tabla `construction_phases` (campos clave):
- Relaciones: `project_id` (FK a `projects`, borrado en cascada), `responsible_id` (FK a `users`).
- Fase: `position` (único por proyecto), `title`, `period` (texto libre, p. ej. «Mes 6–9»), `status` (`pending`, `in_progress`, `completed`, `delayed`), `progress_percent` (0–100), `status_date`.
- Evidencia y publicación: `video_url`, `public_note`, `is_published`, `published_at`.
- Auditoría: `created_by`, `updated_by`, `created_at`, `updated_at`.

Tablas relacionadas:
- `projects`: `broker_id` define el alcance; `progress_percent` es un caché del promedio de sus fases.
- `files`: fotos polimórficas (`entity_type = "construction_phase"`, `entity_id`), con `name`, `url` (ruta del objeto, no URL pública), `mime_type`, `size_bytes`, `visibility`, `position`, `uploaded_by`, `deleted_at`.
- `users`: nombre del responsable técnico.
- `audit_log`: altas, ediciones, borrados de fases y archivos.
- `storage.buckets`: bucket privado `avances-obra`.

Restricciones: `position` único por proyecto; porcentaje entero 0–100; fecha en formato `AAAA-MM-DD`; `video_url` solo `http`/`https`; estado restringido al catálogo. Una fase publicada no bloquea la edición posterior ni retira automáticamente el flag.

## Estados de UI (D06)
- **Vacío:** sin proyectos visibles, «Sin proyectos»; proyecto sin fases, «Sin fases de obra todavía» con botón para crear las 8 fases estándar (solo con permiso de creación).
- **Cargando:** no hay `loading.tsx`; el módulo usa el layout común con `EstadoConexion`. Las acciones muestran «Guardando…», «Agregando…» o «Eliminando…» y deshabilitan el botón.
- **Error:** no hay `error.tsx`. Los fallos de API se muestran en un diálogo accesible; un fallo de fotos se muestra como aviso ámbar dentro de la bóveda sin tumbar la página.
- **Sin permiso:** 403 de página; los botones de crear, editar, publicar y eliminar se ocultan según `can(...)`, pero la decisión real se repite en cada ruta.
- **Éxito:** `router.refresh()` tras cada mutación; el editor confirma «Cambios guardados correctamente en la fase» y recalcula el avance visible.
- **Parcial:** si no hay clave de servicio o falla el firmado, se ven los nombres de las fotos pero no las imágenes; el comparador exige al menos dos fotos con URL.
- **No encontrado:** no hay `not-found.tsx`; un `?fase=` inexistente vuelve a la primera fase y un `?proyecto=` desconocido al primer proyecto visible.

## Estado actual vs PRD
**Existe y funciona (código real):**
- Fases por proyecto con posición única, selector por URL y edición persistida.
- Plantilla estándar de 8 fases y alta de fases sueltas, con auditoría y recálculo del avance.
- Fotos privadas en Storage, validación de MIME/tamaño, URL firmada y borrado lógico.
- Comparador antes/después con fotos reales y boletín para comprador.
- Guía de requisitos y alertas de coherencia antes de publicar (en cliente).
- Cálculos puros con pruebas en `domain/avance-obra.test.ts` y regresiones de propiedades.

**Demo o faltante:**
- `milestone-timeline.tsx` mezcla fases reales con `MILESTONE_PREVIEW`: hitos, fechas previstas/reales, impacto contractual y avisos a compradores son de ejemplo (QA F16).
- La «Inspección 360°» es una vista previa; el botón no solicita ningún activo y no hay panoramas verificados.
- La publicación de la fase **solo se valida en la UI**: `PATCH` acepta `isPublished` sin volver a comprobar evidencia, nota, responsable ni coherencia. No existe bandeja de aprobación ni registro de publicación distinto de la auditoría de edición.
- El portal del comprador no consume `is_published`/`public_note`; el flag queda guardado pero no hay superficie pública que lo muestre.
- No hay estados de carga, error ni no encontrado propios; tampoco hay paginación ni búsqueda (el universo son las fases de un proyecto).
- El editor no permite reordenar fases, definir dependencias, duraciones ni ruta crítica; el «Gantt» es una secuencia, no un cronograma con fechas.
- El video es solo una URL; no se sube, no se valida su disponibilidad y no se categoriza por tipo de inspección.
- Las fotos no guardan fecha de captura, autor visible, descripción ni etiqueta; `visibility` se escribe como `public` aunque el bucket sea privado.
- Sin control de concurrencia por versión ni `Idempotency-Key`: dos ediciones simultáneas se pisan y un reintento de alta puede chocar con el índice de posición.
- La plantilla de 8 fases es fija; no hay tabla de plantillas por constructora.

**Pendientes del tablero (`estado.json`):**
- `falta-mostrar-cronograma-de-obra-al-comp`: falta mostrar el cronograma de obra al comprador (funcionalidad, rama `opencode-free`, estado `pending`).
- De la auditoría/QA: el timeline de hitos sigue siendo de ejemplo (F16) y el escritorio presenta 3 avisos de contraste (`color-contrast` serious) en la auditoría visual de `/avances`.

**PRD:** el compendio no define «Avances de obra» como módulo propio; el seguimiento constructivo se apoya en propiedades, portal y posventa. La especificación agrega la práctica inmobiliaria de separar progreso declarado, evidencia y publicación al comprador, con precios y superficies fuera de este módulo.

## Checklist de aceptación
- [x] Fases reales por proyecto con posición única
- [x] Selector de proyecto y fase por URL
- [x] Crear la plantilla estándar de 8 fases
- [x] Agregar, editar y eliminar fases según permiso
- [x] Recálculo del avance global del proyecto
- [x] Fotos privadas con URL firmada y límites de archivo
- [x] Comparador antes/ después con fotos reales
- [x] Boletín para comprador para copiar o imprimir
- [ ] Publicación validada también en servidor
- [ ] Cronograma e hitos reales con fechas
- [ ] Portal del comprador muestra las fases publicadas
- [ ] Estados de carga, error y no encontrado propios
- [ ] Reordenar fases y control de concurrencia
- [ ] Metadatos de foto: fecha, autor y descripción

## Dependencias
- **Propiedades:** proyecto, alcance por `broker_id`, enlace directo y caché `progress_percent`.
- **Portal:** destino previsto de las fases publicadas y de la nota pública; hoy no las consume.
- **Documentos y Storage:** bucket privado, URLs firmadas, validación de archivos y borrado lógico.
- **Usuarios y Configuración:** responsables técnicos, roles y matriz de permisos (`construction_phases`).
- **Auditoría:** altas, cambios y borrados de fases y fotos.
- **Agenda y Tareas (futuro):** inspecciones programadas y recordatorios de actualización.
- **Reportes e Inicio (futuro):** avance por proyecto, fases retrasadas y cumplimiento de entrega.
- **Posventa:** entrega, inspección y evidencia posterior al cierre.
- **Aprobaciones (futuro):** flujo independiente para publicar o cambiar hitos contractuales.
