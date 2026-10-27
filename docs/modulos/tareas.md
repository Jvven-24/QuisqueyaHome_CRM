# Tareas

## Propósito
Lista y tablero de tareas de cada asesor y de su equipo: prioridad, responsable, fecha límite, vínculo a contacto, lead, negocio o proyecto, y packs de tareas por etapa (playbooks). Las tareas son filas de `activities` con `activity_type = task`.

Buenas prácticas de industria (preventa y proyectos, RD):
- Cada lead nuevo nace con una tarea de primer contacto. Su plazo sale del SLA configurado (`lead.response_sla`) y escala al gerente si vence (`lead.escalation_sla`).
- Packs de tareas por etapa del negocio (contacto, visita, reserva, firma, seguimiento de cuotas), creados todos o ninguno.
- Completar exige evidencia: una nota de lo que se hizo y con quién.
- Las tareas vencidas aparecen en Inicio y en el tablero del gerente, sin depender de buscarlas.
- Recurrencias para seguimiento de compradores de preventa (cada N días hasta cierre o descarte).

## Roles y permisos
Recurso RBAC: `activities`. Igual que en Agenda, el responsable es `assignee_id`.

| Rol (slug) | Acciones | Alcance | Efecto |
|---|---|---|---|
| Administrador (`admin`) | view, create, edit, delete | all | Todas las tareas; asigna a cualquiera |
| Gerente (`manager`) | view, create, edit | team | Tareas de su equipo |
| Broker (`broker`) | view, create, edit | own | Solo sus tareas |
| Asistente (`assistant`) | view, create, edit | all | Opera la cartera; no borra |

- Asignar a otro responsable exige que el alcance llegue a ese responsable (`reaches`).
- La lista usa `visibleRows` (filtro en SQL, no en memoria).
- Vista sin permiso: `requireScopeInPage(activities, view)`.

## Flujos principales
1. Ver tareas: lista filtrable por estado, prioridad, responsable y vencimiento, o tablero por estado.
2. Crear tarea (`POST /api/actividades`): título, prioridad, responsable, fecha límite y vínculos.
3. Desplegar un pack de tareas por etapa (`POST /api/actividades/lote`): todas en una transacción, con `Idempotency-Key`. Si una falla, no se crea ninguna. Un reintento con la misma clave no duplica.
4. Editar o reasignar (`PATCH /api/actividades/[id]`).
5. Completar: exige describir la evidencia; `status` completed con `completed_at`.
6. Cancelar o eliminar (`DELETE /api/actividades/[id]`). Verificar que sea borrado lógico con `deleted_at`, como sugiere el esquema.
7. Recurrencias: vista previa de ejemplo (`tareas/recurrencias`).
8. Ver tareas vencidas o del día en Inicio (objetivo; hoy sin filtro por periodo ni por broker).

## Datos
Tabla `activities` (ver Agenda para el detalle de campos): `activity_type = task`, `title`, `description`, `assignee_id`, `priority` (low, normal, high), `status` (pending, completed, cancelled), `is_all_day`, `starts_at`, `completed_at`, `deleted_at`, vínculos `contact_id`, `lead_id`, `deal_id`, `project_id`.

Notas:
- No hay campo `due_at`. La fecha límite usa `starts_at` con `is_all_day`; confirmar esta decisión antes de construir recurrencias.
- Un pack no tiene tabla propia; cada tarea del pack es una fila de `activities`.
- Faltan: definición de recurrencias, catálogo editable de packs por etapa y registro del SLA de primer contacto.

## Estados de UI
| Estado | Situación en código | Qué debe mostrar |
|---|---|---|
| Vacío | Sí: `Vacio` en `tareas/vista.tsx` | "Sin tareas pendientes" con acción de crear |
| Cargando | Sí: `tareas/loading.tsx` | Esqueleto de lista |
| Error | Parcial: sin `error.tsx` propio; hereda `(crm)/error.tsx` | Aviso con reintento |
| Sin permiso | Sí: `requireScopeInPage` en `page.tsx` | Aviso de permiso |
| Éxito | No verificado | "Tarea completada" con la evidencia guardada |
| Parcial | No aplica: el pack es todo o nada | Pack no creado: mensaje de error y lista sin cambios |

## Estado actual vs PRD
Fuentes: código en `/tmp/qh-review` y `AUDITORIA-MODULOS.md` (27/10/2026, Tareas: severidad Media).

- **Existe y funciona:** crear, editar, completar con evidencia, cancelar; lista y tablero filtrados por alcance; packs de tareas en transacción con `Idempotency-Key`. El código incluye un comentario que indica que el pack se corrigió tras la auditoría.
- **Discrepancia a verificar:** la auditoría dice que los packs no usan transacción y se duplican al reintentar. El código actual sí usa transacción (`crearActividadesEnLote`). Confirmar en el entorno desplegado.
- **Es demo:** recurrencias. No hay lógica de recurrencia en `domain` ni en `application`.
- **Zona horaria:** la auditoría indica que `-04:00` está fijo en el código. Es correcto para RD (no hay horario de verano), pero debe salir de `domain/zona-horaria`, que ya existe.
- **Falta:** recurrencias reales; SLA de primer contacto aplicado a tareas (la auditoría lo ubica solo como vista previa en Leads); alerta de vencidas en Inicio.
- **PRD (compendio):** no define tareas. El alcance inicial solo incluye "broker hub básico"; el CRM propietario completo queda fuera.

## Checklist de aceptación
- [x] Crear tarea con responsable y prioridad
- [x] Completar exige describir la evidencia
- [x] Packs de tareas en una sola transacción
- [x] Reintento de pack no duplica (Idempotency-Key)
- [x] Lista y tablero filtrados por alcance
- [ ] Recurrencias reales de seguimiento
- [ ] Primer contacto de lead con SLA aplicado
- [ ] Alerta de tareas vencidas en Inicio
- [ ] Catálogo de packs editable por etapa

## Dependencias
- **Agenda:** mismo recurso `activities`; una cita y una tarea comparten tabla.
- **Leads y negocios:** origen del pack por etapa y del SLA de primer contacto.
- **Configuración:** `lead.response_sla` y `lead.escalation_sla` (catálogo de ajustes).
- **Inicio:** tareas vencidas y del día.
- **Notificaciones:** aviso al responsable de una tarea vencida (pendiente).
- **RBAC:** `requireScope`, `visibleRows`, `reaches`.
