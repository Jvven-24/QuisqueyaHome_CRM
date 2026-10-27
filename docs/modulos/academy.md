# Academy

## Propósito
Formación y certificación de brokers. Se conecta a Quisqueya Academy LMS (Moodle 4.5 local) mediante `lmsAdaptador`. El broker ve sus cursos asignados y su progreso, y solicita revisión de un curso completado. Un administrador distinto del broker aprueba, rechaza o revoca constancias. Admin crea cursos y matricula personas.

Referencia del compendio: "apartado para brokers con capacitaciones grabadas, enlaces y materiales" (RF-09 y secciones 3 y 4).

Buenas prácticas de industria (referencia, validar con el equipo):
- Rutas por etapa o perfil: onboarding, producto, normativa, técnicas de venta.
- Evaluación con nota mínima; la constancia tiene vencimiento y recertificación.
- Quien valida la finalización no es quien la cursa.
- Constancias con hash de evidencia y revocación auditada.
- El gerente ve el avance de su equipo, no el de otros equipos.

## Roles y permisos
Recurso `academy`: `view` y `edit`.

- **Admin** (`admin`): `view` y `edit` con alcance `all`. Solo él abre la página de administración, que exige `roleSlug=admin` y `can(edit)`.
- **Gerente** (`manager`): `view` con alcance `team`. Propuesto: progreso de su equipo. No edita.
- **Broker** (`broker`): `view` con alcance `own`. Sus cursos, progreso, solicitudes y constancias.
- **Asistente** (`assistant`): `view` según seed (no verificado). No edita.

Reglas en código:
- `requireScope(view)`: listar cursos y progreso propio, solicitar revisión, actualizar progreso y checklist.
- `requireFullScope(edit)`: crear curso, matricular, decidir revisiones y revocar constancias.
- `GET /api/academy/cursos?cursoId=` (progreso de cada persona): exige `view` con alcance `all`.
- Finalizar un contenido (100 %) o un paso de checklist exige `can(edit)`. Si no, responde 403 "Un tutor o administrador debe validar la finalización".

## Flujos principales
1. El broker abre Academy y ve sus cursos asignados y su progreso (lectura desde Moodle).
2. Si Moodle no responde, la vista avisa y mantiene visibles las solicitudes y constancias del CRM.
3. El broker guarda avance parcial (menos de 100 %) o marca pasos del checklist. La finalización la valida un tutor o admin.
4. El broker solicita revisión de un curso completado (`POST /api/academy/solicitudes`).
5. Admin, distinto del broker, decide en Administración: aprueba o rechaza (`POST /api/academy/revisiones`). El SHA-256 de la evidencia se calcula en servidor y la decisión se audita.
6. La constancia emitida aparece en el perfil. Admin puede revocarla (`PATCH /api/academy/revisiones`), con auditoría.
7. Admin crea un curso (`POST /api/academy/cursos`): nombre 4–200, código 3–40 (letras, números, guion y guion bajo), resumen mínimo 10, nota mínima 1–100 (por defecto 80).
8. Admin matricula personas por rol o individualmente (`POST /api/academy/matriculas`) y consulta progreso por persona.

## Datos
Existentes:
- `academy_items`: contenidos locales de la biblioteca.
- Perfil del broker (`moodleUserId`, proyectos asignados): se lee con `obtenerPerfilActor`. No localicé la tabla exacta en `schema.ts`; confirmar antes de documentarla.
- `external_refs`: vínculo entre usuario del CRM y usuario de Moodle.
- `audit_log`: decisiones y revocaciones.
- Solicitudes y constancias: el repositorio `academy` las usa, pero no las localicé en el esquema Drizzle durante esta revisión. Confirmar nombre de tabla antes de documentarlas.

Moodle (externo): cursos, categorías, matrículas, progreso y estado de finalización.

Campos clave:
- Solicitud: curso, broker, estado (pendiente, aprobado, rechazado), decidido_por, decidido_en.
- Constancia: curso, broker, hash SHA-256 de evidencia, emitida_en, revocada_en.

## Estados de UI
- **Vacío**: "No hay cursos asignados disponibles en este momento", "Todavía no tienes cursos matriculados en Quisqueya Academy LMS", "No hay solicitudes de revisión registradas", "Aún no hay constancias emitidas" (verificado).
- **Cargando**: `loading.tsx` con esqueleto. En administración, `cargando` por acción (verificado).
- **Error**: `error.tsx` de la ruta. Errores por acción: "No se pudo registrar la solicitud de revisión", "No se pudo completar la matrícula en Moodle" (verificado).
- **Sin permiso**: `requireScopeInPage(view)` en ambas páginas. Quien no es admin ve solo su perfil en Administración (verificado).
- **Sin conexión**: `sinConexionRed` impide matricular: "Sin conexión. No se solicita una matrícula." (verificado).
- **Parcial / LMS caído**: aviso "No se pudo contactar a Moodle…" y las constancias existentes siguen disponibles (verificado). Si la matrícula se crea pero no se puede leer el progreso, el estado debe ser parcial. No verificado.
- **Éxito**: respuestas 201 u ok y recarga de la lista. Revisar el texto de confirmación en la vista.

## Estado actual vs PRD
- **Existe y es real**: integración con Moodle (cursos, matrícula, progreso, checklist); solicitudes y decisiones con la regla Q-C1-03 (solo admin distinto del broker); revocación; SHA-256 en servidor; anti-autocertificación; estado del LMS.
- **Cerrado en código desde la auditoría del 27/10**: "cualquier usuario con permiso de ver puede autocertificarse al 100 %". Las rutas de progreso y checklist ahora devuelven 403 si no tiene `academy:edit`.
- **Es de ejemplo**: no hay vistas de ejemplo en `academy/vista.tsx` ni `academy/administracion/vista.tsx`.
- **Falta**: contenidos reales (la auditoría registró 0 contenidos), vencimiento y recertificación de constancias, rutas por perfil, vista de gerente sobre su equipo.
- **Dependencia operativa**: `MOODLE_URL` (por defecto `127.0.0.1:9330`) y `MOODLE_TOKEN`. En producción deben configurarse.

## Checklist de aceptación
- [x] Cursos asignados y progreso desde Moodle
- [x] Solicitud de revisión de curso por el broker
- [x] Aprobar o rechazar solo admin distinto del broker
- [x] SHA-256 de evidencia calculado en servidor
- [x] Finalizar contenido requiere tutor o admin
- [x] Revocación de constancia con auditoría
- [x] Alta de curso y matrícula en Moodle (admin)
- [x] Aviso cuando el LMS no responde
- [ ] Biblioteca con contenidos reales cargados
- [ ] Vencimiento y recertificación de constancias
- [ ] Rutas de formación por etapa o perfil
- [ ] Vista de gerente sobre el progreso de su equipo

## Dependencias
- Moodle LMS: `lmsAdaptador`, variables `MOODLE_URL` y `MOODLE_TOKEN`.
- Acceso/RBAC: recurso `academy`, alcances `own`, `team`, `all`.
- Brokers: perfil, `moodleUserId`, proyectos asignados.
- Auditoría: `audit_log` para decisiones y revocaciones.
- Automatizaciones (futuro): recordatorio de curso pendiente.
- Metas o comisiones: si la certificación se vuelve requisito, la regla debe definirse con negocio (no definido en el compendio).
