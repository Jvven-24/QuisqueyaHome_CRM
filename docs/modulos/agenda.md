# Agenda

## Propósito
Calendario operativo del equipo comercial: citas, visitas, llamadas y notas de contacto sobre la tabla `activities`. Permite ver la semana y el mes, crear y reprogramar citas, exportar a `.ics` y crear eventos en Google Calendar. Viajes y visitas son vistas previas de ejemplo.

Buenas prácticas de industria (preventa y proyectos, RD):
- La visita a proyecto o sala de ventas es el hito que más pesa en la conversión: registrar resultado (asistió, no asistió, reprogramó) y siguiente paso en campos propios, no en texto libre.
- Recordatorios automáticos 24 h y 1 h antes, y confirmación del cliente por WhatsApp.
- Detectar choques de cita por asesor y por sala de ventas antes de guardar.
- Zona horaria fija `America/Santo_Domingo` (sin horario de verano); el lunes es el primer día de la semana.
- Sincronización con Google sin duplicar eventos (UID y vínculo externo estable).

## Roles y permisos
Recurso RBAC: `activities` (view, create, edit, delete). El responsable es `assignee_id`, no el broker del contacto.

| Rol (slug) | Acciones | Alcance | Efecto |
|---|---|---|---|
| Administrador (`admin`) | view, create, edit, delete | all | Ve y asigna a cualquier responsable |
| Gerente (`manager`) | view, create, edit | team | Citas de su equipo (`manager_scopes`) |
| Broker (`broker`) | view, create, edit | own | Solo sus citas |
| Asistente (`assistant`) | view, create, edit | all | Opera la cartera completa; no borra |

- Asignar a otro responsable exige que el alcance llegue a ese responsable (`reaches`).
- Vistas de viajes y visitas: `requireScopeInPage(activities, view)`.
- Las cuentas y calendarios Google usan también el recurso `activities` (`/api/integraciones/google/*`).

## Flujos principales
1. Abrir la agenda semanal: se muestran solo las citas que el alcance permite ver, en zona RD.
2. Crear cita o tarea (`POST /api/actividades`): tipo, título, inicio y fin o día completo, responsable (por defecto, quien crea), vínculo a contacto, lead, negocio o proyecto, lugar o enlace.
3. Si el tipo es `meeting` y se elige un calendario Google, se crea el evento. Si Google falla, la cita queda guardada y la respuesta trae el error de Google.
4. Antes de guardar, la vista mensual avisa de choques de disponibilidad.
5. Reprogramar o editar (`PATCH /api/actividades/[id]`), también arrastrando en la vista.
6. Completar (`status` completed, con `completed_at`) o cancelar (`status` cancelled).
7. Registrar el resultado de una visita: hoy se guarda dentro de la descripción; el objetivo es un campo propio (ver Estado actual).
8. Exportar la semana a `.ics` (`GET /api/actividades/ics?semana=`).
9. Conectar una cuenta Google y elegir calendario en Integraciones.
10. Viajes y visitas: vistas previas de ejemplo, no operativas.

## Datos
Tabla `activities`:
- `activity_type`: task, call, meeting, note, whatsapp, email.
- `title`, `description`.
- Vínculos: `contact_id`, `lead_id`, `deal_id`, `project_id`, `assignee_id`.
- Tiempo: `starts_at`, `ends_at`, `is_all_day`.
- `location`, `meeting_url`.
- `status`: pending, completed, cancelled. `priority`: low, normal, high.
- `completed_at`, `deleted_at` (borrado lógico), autoría y timestamps.
- Índices por responsable, inicio, estado, contacto y negocio.

Tablas relacionadas existentes: `activity_sync` (ID del evento externo, evita duplicados), `google_accounts`, `google_calendars`.

Faltan: campos de resultado de visita, recordatorios, sala de ventas o proyecto de visita como entidad, y confirmación del cliente.

## Estados de UI
| Estado | Situación en código | Qué debe mostrar |
|---|---|---|
| Vacío | No verificado en `agenda/vista.tsx` | "Sin citas esta semana" con acción de crear |
| Cargando | Sí: `agenda/loading.tsx` | Esqueleto de la cuadrícula |
| Error | Parcial: no hay `error.tsx` propio; hereda `(crm)/error.tsx` | Aviso con reintento, sin perder la vista |
| Sin permiso | Sí: `requireScopeInPage` en agenda, viajes y visitas | Aviso de permiso, sin datos |
| Éxito | No verificado | Cita guardada; si hubo Google, estado del evento |
| Parcial | Sí en API: `google.error` con cita guardada | "Cita guardada. Google no respondió; reintenta la sincronización" |

## Estado actual vs PRD
Fuentes: código en `/tmp/qh-review` y `AUDITORIA-MODULOS.md` (27/10/2026, Agenda: severidad Media).

- **Existe y funciona:** vista semanal y mensual en zona RD; alta, edición y cancelación; aviso de choques en la vista mensual; `.ics`; alta en Google para `meeting`; alcance por responsable.
- **Es demo:** viajes y visitas (`agenda/_componentes/vista-previa`).
- **Falta o es riesgo:** resultado de visita en campos propios (la auditoría indica que "No asistió" vuelve a pendiente); recordatorios; sincronización de cambios que llegan desde Google; confirmación del cliente.
- **PRD (compendio):** no define requisitos funcionales de agenda. Solo la nombra en un grupo de fases ("CMS, métricas, agenda"), y declara fuera del alcance inicial el "CRM propietario completo". Esta especificación se apoya en buenas prácticas de industria, no en el PRD.

## Checklist de aceptación
- [x] Crear cita o tarea con el alcance del actor
- [x] Vista semanal en zona America/Santo_Domingo
- [x] Avisar choques de citas en la vista mensual
- [x] Exportar la semana a .ics
- [x] Crear evento en Google en visitas sin revertir la cita
- [ ] Registrar resultado de visita en campos propios
- [ ] "No asistió" no vuelve a pendiente
- [ ] Recordatorio 24 h y 1 h por WhatsApp
- [ ] Sincronizar cambios de Google sin duplicar
- [ ] Viajes y visitas con datos reales

## Dependencias
- **Contactos, leads, negocios y proyectos:** vínculos de `activities`.
- **Tareas:** mismo recurso y tabla (`activity_type = task`).
- **Integración Google:** `google_accounts`, `google_calendars`, `activity_sync`, `/api/integraciones/google/*`.
- **WhatsApp (YCloud):** recordatorios y confirmaciones; pendiente de conectar.
- **RBAC:** `requireScope`, `visibleRows`, `manager_scopes`, `user_permission_overrides`.
- **Inicio:** widgets de "mi día" (pendiente).
- **Notificaciones:** avisos de cita próxima (pendiente).
