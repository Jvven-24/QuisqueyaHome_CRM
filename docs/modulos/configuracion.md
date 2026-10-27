# Configuración

## Propósito
Panel administrativo del sistema, dividido por pestañas (`?tab=`): usuarios y roles, usuarios y permisos (por rol, por persona y equipos), etapas de Negocios, catálogos (motivos de pérdida y canales), papelera de borrado lógico, auditoría de configuración e integraciones. Las pestañas Centro de ajustes, SEO del portal y Capacidad y costes son vista previa.

Referencia del compendio: "Administrador: gestionar contenido, proyectos, zonas, métricas y leads"; "Soporte / secretaria: actualizar datos autorizados sin tocar configuraciones críticas"; "control de cambios de contenido sensible y separación entre edición y configuración"; trazabilidad de cambios.

Buenas prácticas de industria (referencia, validar con el equipo):
- Mínimo privilegio. Nadie se puede conceder más de lo que tiene.
- Cada cambio de permisos guarda el antes y el después, con motivo.
- Desactivar en lugar de borrar usuarios. Reasignar su cartera antes de desactivarlos.
- Papelera con plazo de retención visible.
- Respaldo antes de cada migración (`pg_dump`, según PLAN-EQUIPO §2).

## Roles y permisos
La página exige `settings:view` con alcance `all`. Recursos adicionales: `settings:edit`, `settings:create` (catálogos), `audit_log:view` y `audit_log:export`, `users` (create, edit, delete con `requireFullScope`), y `integrations`.

- **Admin** (`admin`): acceso total. Es el único que cambia la matriz de roles y las excepciones por persona. El rol admin es protegido y no se edita.
- **Gerente** (`manager`): sin acceso. La pantalla responde "No tienes permiso". El seed de la migración 0017 no le concede `settings`.
- **Broker** (`broker`): sin acceso.
- **Asistente** (`assistant`): propuesto, solo catálogos y datos de usuario en consulta. No permisos. Hoy depende del seed (no verificado).
- **Consulta (`readOnly`)**: solo `view`. La UI muestra "Modo consulta" y deshabilita escrituras.

## Flujos principales
1. El usuario abre `/configuracion`. Sin `settings:view` con alcance `all` responde 403. La pestaña por defecto es Usuarios.
2. **Usuarios**: crea usuarios con invitación, edita, reenvía la invitación (con protección contra doble envío) y da de baja con borrado lógico (`deleted_at`).
3. **Por rol**: elige un rol no protegido y ajusta la matriz recurso × acción con alcance Ninguno, Propio, Equipo o Todo. Guardar exige admin. Las celdas duplicadas se rechazan.
4. **Por broker**: elige una persona y sobrescribe permisos concretos. El admin protegido no admite excepciones.
5. **Equipos y supervisores**: asigna miembros a un equipo y supervisores. Solo pueden supervisar admin o gerente.
6. **Etapas y catálogos**: edita etapas del pipeline, motivos de pérdida y canales. Crear catálogos requiere `settings:create` con `all`.
7. **Papelera**: lista borrados lógicos de contactos, leads, negocios, proyectos, unidades y usuarios (hasta 30 por tipo) y restaura.
8. **Auditoría**: lista eventos de configuración. Exporta si tiene `audit_log:export`.
9. **Integraciones**: muestra cuentas conectadas y el estado real del outbox. Si la cola no responde, muestra "no disponible" y no inventa un estado.

## Datos
Tablas existentes:
- `users`: full_name, email, role_id, is_active, auth_user_id, deleted_at.
- `roles`: slug, name, is_protected, is_active.
- `permissions`: role_id, resource, action, scope (none, own, team, all).
- `user_permission_overrides` (migración 0017): user_id, resource, action, scope, granted_by, reason (no vacío), created_at. Índice único por usuario, recurso y acción. RLS activado.
- `manager_scopes` (0017): manager_id, team_id, con clave primaria compuesta.
- `teams` y `team_members`: un broker pertenece a un solo equipo.
- `broker_profiles`: especialidad, alquileres, objetivo mensual de negocios.
- `pipeline_stages`, `loss_reasons`, `lead_sources`.
- `integration_accounts`.
- `audit_log` y `outbox` / `outbox_dead`.

## Estados de UI
- **Cargando**: `loading.tsx` de la ruta (verificado que existe).
- **Error**: `error.tsx` de la ruta (verificado que existe).
- **Sin permiso**: `forbidden.tsx` con "No tienes permiso. La configuración requiere acceso total a los ajustes del sistema." (verificado).
- **Sin conexión**: `useOnline` deshabilita escrituras. El texto verificado es "Sin conexión. Los cambios de vista previa y exportaciones están en pausa." (verificado en Avanzada).
- **Vacío**: componente compartido `Vacio` en la pestaña de usuarios. Texto no revisado.
- **Éxito**: "Invitación reenviada a {correo}." (verificado).
- **Parcial**: cola del outbox no legible → "no disponible", sin ceros inventados (verificado).
- **Modo consulta**: banner "Modo consulta" (verificado).
- **Rol protegido**: "Los permisos del rol administrador no son editables." (verificado en el caso de uso).

## Estado actual vs PRD
- **Existe y es real**: usuarios con alta, edición, invitación y baja lógica; matriz por rol con validación; excepciones por persona (API y tabla); equipos y supervisores; etapas; catálogos; papelera con restauración; auditoría; estado de integraciones. Rol gerente en la migración 0017.
- **Hallazgos de la auditoría 27/10 que el código ya corrige**: escalada de permisos (solo admin concede, rol admin protegido, celdas duplicadas rechazadas). Prioridad alta, ahora mitigado. Falta prueba E2E.
- **Es de ejemplo**: Centro de ajustes (CFG-001..121, "no son valores reales"), SEO del portal y Capacidad y costes. La sección Avanzada usa "Proyecto de ejemplo".
- **Falta**: persistir las vistas previas; pruebas E2E de matriz y "ver como" (PLAN-EQUIPO §4.6); insignia "personalizado" y "restablecer al rol" en excepciones (no verificado).
- **Pruebas**: existen `seguridad.test.ts`, `auditoria-acceso.test.ts` y `regresion-r2.test.ts`. No se ejecutaron en esta revisión.

## Checklist de aceptación
- [x] Página exige settings:view con alcance total
- [x] Matriz de permisos por rol con validación
- [x] Rol administrador protegido, no editable
- [x] Celdas duplicadas en la matriz rechazadas
- [x] Excepciones por persona (API y tabla)
- [x] Equipos y supervisores con validación de rol
- [x] Papelera con restauración de borrado lógico
- [x] Auditoría de configuración consultable
- [x] Integraciones muestran el estado real de la cola
- [ ] Centro de ajustes, SEO y capacidad persistidos
- [ ] Pruebas E2E de matriz y de "ver como"
- [ ] Insignia y restablecer en excepciones por broker

## Dependencias
- Acceso: roles, sesión, resolución del actor y RBAC.
- Leads y Negocios: etapas, motivos de pérdida y canales.
- Contactos, Proyectos, Unidades: papelera.
- Outbox e integraciones: estado de la cola.
- Auditoría: `audit_log`.
- Automatizaciones: requiere `settings:edit`.
- Documentos, Posventa, Academy: recursos que aún no tienen permisos propios.
- Portal: SEO del portal (vista previa).
- Migraciones: `drizzle/0014` y `0017`. Respaldo previo obligatorio.
