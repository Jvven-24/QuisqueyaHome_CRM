# Acceso

## Propósito
Cómo se identifica a una persona, qué rol tiene y qué alcance ve sobre cada recurso. Incluye:
- Login, sesión y recuperación de contraseña (Supabase Auth).
- Alta, invitación y baja de usuarios.
- Resolución del actor (`requireActor`) y la capa RBAC (`domain/rbac.ts`, `rbac-filter.ts`).
- Vista "ver como broker" de solo lectura.

No tiene página propia. Vive en `/login`, `/recuperar`, `/configuracion` (usuarios y permisos), `src/middleware.ts` y la API.

Referencia del compendio: RF-11 "Control de roles: administrador, editor y visualizador / broker"; PRD: "Administrador Quisqueya Home", "Soporte / secretaria", "Broker interno o aliado"; "Seguridad básica desde el arranque: roles, control de acceso"; "RLS y roles claros en Supabase para accesos internos".

Buenas prácticas de industria (referencia, validar con el equipo):
- Decidir en servidor. Ocultar un botón no es seguridad.
- Un solo punto de filtrado por alcance, sin `WHERE` escritos a mano en cada módulo.
- MFA obligatorio para administradores.
- Baja de broker con reasignación de cartera.
- Límites de intentos en login y recuperación. Enlaces de recuperación con dominio fijo.
- Registro de accesos y de "ver como".

## Roles y permisos
Recursos relevantes: `users` (create, edit, delete con `requireFullScope`), `roles` y `settings` (edit: solo admin), `brokers` (view, para "ver como"), `audit_log` (view). Alcances: `none`, `own`, `team`, `all`. Si no hay fila en `permissions`, el alcance es `none` (cerrado por defecto).

- **Admin** (`admin`, protegido): `all` en todo. Único que concede permisos y excepciones.
- **Gerente** (`manager`, migración 0017): `team` en leads, contactos, negocios, actividades, proyectos, unidades y metas. `view` en comisiones y reservas. Sin `users`, `roles` ni `settings`. Puede "ver como" a los brokers de su equipo. El alcance `team` usa `manager_scopes` y `teams`.
- **Broker** (`broker`): `own` sobre su cartera (22 permisos según la auditoría).
- **Asistente** (`assistant`): 35 permisos según la auditoría. `holds` y `reservations` con `all` (migración 0014). Sin `users`, `roles` ni `settings` (verificar en el seed).
- **Lectura** (`readOnly`): solo `view`. Es el modo de "ver como".

Mapeo pendiente: el compendio habla de "administrador, editor, visualizador / broker" y "soporte / secretaria". El código usa `admin`, `manager`, `broker` y `assistant`. Hay que decidir si "editor" es `manager` o `assistant`.

## Flujos principales
1. **Login** (`POST /api/auth/login`): límite de 10 intentos por minuto por IP y de 8 fallos cada 15 minutos por correo. Cuerpo limitado.
2. **Sesión**: el middleware valida con `getUser` (no con la cookie sin verificar). Sin sesión, redirige a `/login?destino=` o responde 401 JSON en `/api`.
3. **Recuperación** (`POST /api/auth/recuperar`): envía el correo de restablecimiento. El enlace usa el origen de la petición. No tiene límite de intentos.
4. **Alta de usuario** (`POST /api/usuarios`): solo admin (`requireFullScope`). Envía la invitación y permite reenviarla (`POST /api/usuarios/[id]/invitacion`).
5. **Edición y baja** (`PATCH` y `DELETE /api/usuarios/[id]`): baja lógica. La reasignación de cartera no está verificada.
6. **Excepción por persona** (`PATCH /api/permisos/usuarios/[id]`): solo admin, en Configuración. Persona protegida no admite excepciones.
7. **Matriz por rol** (`PATCH /api/roles/[id]/permisos`): solo admin. El rol admin es protegido.
8. **Equipos** (`PATCH /api/permisos/equipos/[id]`): solo admin.
9. **Ver como broker** (`POST /api/ver-como`): admin o gerente elige un broker. Se fija la cookie `qh_view_as` y el actor pasa a solo lectura. El middleware responde 403 a escrituras.
10. **Login de evaluación**: solo con `NODE_ENV=development`, `CRM_EVAL_LOGIN=1` y host `localhost` o `127.0.0.1`. En otro caso responde 404.

## Datos
Tablas existentes:
- `users`: auth_user_id, role_id, is_active, deleted_at.
- `roles`: slug, is_protected, is_active.
- `permissions`: role_id, resource, action, scope.
- `user_permission_overrides` (0017): una fila por usuario, recurso y acción. Lleva motivo y quién la concedió.
- `teams` (leader_id) y `team_members`.
- `manager_scopes` (0017): gerente y equipo supervisado.
- `broker_profiles`.
- `audit_log`.
- `http_idempotency` (idempotencia de peticiones).

Las credenciales viven en Supabase Auth, no en tablas de la aplicación.

Recursos cerrados en `PERMISSION_RESOURCES`. No se pueden inventar recursos sin agregarlos ahí.

## Estados de UI
- **Login**: mensaje de demasiadas peticiones con segundos de espera (`demasiadasPeticiones`, verificado). Estado de carga y mensaje de credenciales inválidas: no verificados.
- **Sin sesión**: redirección a `/login` con `destino`, o 401 JSON en `/api` (verificado en el middleware).
- **Sin permiso**: `forbidden.tsx` en Configuración (verificado). En páginas, `requireScopeInPage` responde 403. En API, 403 JSON.
- **Ver como**: el middleware responde "Ver como broker es de solo lectura. Sal de esta vista para modificar datos." (verificado).
- **Éxito**: "Invitación reenviada" (verificado en Usuarios). Recuperación enviada: no verificado.
- **Vacío**: lista de brokers vacía en "ver como": no verificado.
- **Error de recuperación**: no verificado.
- **Parcial**: usuario creado pero invitación no enviada: no verificado.

## Estado actual vs PRD
- **Existe y es real**: login con límite por IP y por correo; sesión verificada con `getUser`; 401 JSON en API; RBAC con `requireScope` y `requireFullScope`; alcance `team` con `teamUserIds`; migración 0017 (gerente, excepciones, supervisión); "ver como" de solo lectura; login de evaluación restringido.
- **Hallazgos de la auditoría 27/10 que el código ya corrige**: login sin límite (ahora sí); escalada de permisos (solo admin concede, rol admin protegido, celdas duplicadas rechazadas); login de evaluación (solo dev y localhost).
- **Pendiente**:
  - Recuperación sin límite de intentos y con enlace basado en el origen de la petición.
  - MFA ausente.
  - Sin pruebas E2E de la matriz y de "ver como" (PLAN-EQUIPO §4.6).
  - Migración 0017 aplicada en la base real: no verificado en esta revisión.
  - Mapeo de roles del compendio contra el código.
- **Fuentes**: auditoría de 27/10/2026 (`AUDITORIA-MODULOS.md`, el nombre pedido no existe), `PLAN-EQUIPO.md` §4 y código de `/tmp/qh-review`. No se ejecutaron pruebas.

## Checklist de aceptación
- [x] Login con límite por IP y por correo
- [x] Sesión verificada con getUser en el middleware
- [x] Rutas /api sin sesión responden 401 JSON
- [x] Permisos decididos en servidor; solo admin concede
- [x] Login de evaluación solo en desarrollo y localhost
- [x] Vista "ver como" de solo lectura, limitada a admin o gerente
- [x] Rol gerente con alcance de equipo (migración 0017)
- [ ] Límite de intentos en recuperación de contraseña
- [ ] Enlace de recuperación con dominio fijo
- [ ] MFA obligatorio para administradores
- [ ] Baja de broker con reasignación de cartera
- [ ] Pruebas E2E de matriz y de "ver como"

## Dependencias
- Supabase Auth (credenciales y correo de recuperación) y Postgres con RLS.
- Configuración: pantalla de usuarios y permisos.
- Brokers y equipos: perfil, cartera y supervisión.
- Leads, Negocios, Contactos, Metas: alcances `own`, `team` y `all`.
- Academy, Documentos, Posventa: recursos propios pendientes.
- Auditoría: `audit_log`.
- Código: `src/middleware.ts`, `infrastructure/limites.ts`, `infrastructure/env.ts`, `infrastructure/auth/actor.ts`.
