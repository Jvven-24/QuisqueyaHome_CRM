# Fase 3 · Permisos individuales y supervisión
estado: BUILT
Nivel: L3. Autorización: solicitud explícita del usuario de 2026-10-27.
Fuente completa: /workspace/crm-plan/PLAN-EQUIPO.md §4 y REQUISITOS-ENTREGA.md (RQ-01 a RQ-04).

## Alcance y aceptación
- Sembrar manager Gerente/Supervisor con permisos team comerciales conservadores; reasignación no se concede por defecto. Sin administración de usuarios/roles.
- Overrides positivos/negativos únicos por usuario/recurso/acción, con autor, motivo y auditoría transaccional. Admin protegido no admite overrides. Solo admin administra permisos personales y supervisores.
- Resolver override > rol > none una vez al construir actor. Team incluye propio y miembros activos de equipos activos liderados/supervisados. Misma lista en SQL y comprobaciones de dominio.
- Matriz existente por rol y nueva pestaña por persona, herencia explícita, badge personalizado y restablecimiento al rol. Asignar membresía, líder y supervisores con auditoría.
- Ver como broker para admin/manager: identidad real conserva control del selector, identidad visual usa permisos del broker, solo view; manager solo brokers de sus equipos y visibilidad limitada a su perímetro. Nunca escrituras ni exportación durante simulación.
- Migración 0017 idempotente con RLS y journal, sin aplicar.
- Dominio y contratos de rutas; typecheck, lint y npm test observados. Sin build/dev por restricción de entorno. BD y E2E tras aplicar migración, pendientes explícitos.

## UX y estados
Configuración → Usuarios y permisos: roles, personas y equipos; tokens y componentes UI existentes, controles >=44px, matriz desplazable dentro del panel en móvil. Vacío explícito, error accesible, envío pendiente bloqueado, éxito persistido, sin conexión y solo lectura. Selector visible en barra superior con aviso de solo lectura y salida.

## Datos, eventos e integraciones
Reutilizar roles/permissions/users/teams/team_members/audit_log. Nuevas user_permission_overrides y manager_scopes con RLS sin políticas públicas. Auditoría de antes/después en misma transacción. Sin integración externa ni telemetría nueva. Métrica: conteo de celdas personalizadas derivado de los datos.

## Tareas / archivos permitidos
1. Dominio, schema, auth, filtro SQL, middleware, migración/journal y sus pruebas.
2. application/permisos, infrastructure/db/repos/permisos, api/permisos y api/ver-como; pruebas de contrato.
3. Configuración, shell/header y componentes nuevos de esas vistas.
4. Evidencia, índice y relevo. Commits pequeños en español; sin push ni cambios en main.

## Verificación independiente
Pendiente de otro proveedor. No declarar VERIFIED ni cerrar issues remotos. No existe servidor autorizado para captura; validar 320/390/768/1440 al desplegar en entorno de prueba.

## Evidencia de construcción
`docs/ENTREGA_FASE3_RBAC.md`: typecheck/lint y 1126 pruebas aprobadas, 2 omitidas con Node 22. Migración no aplicada; BD, UI y revisión independiente pendientes. No VERIFIED.
