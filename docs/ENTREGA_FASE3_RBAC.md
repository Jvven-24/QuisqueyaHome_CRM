# Entrega local · Fase 3 RBAC

Fecha: 2026-10-27. Rama: `codex/wilber-crm-20261026`. Ficha: `specs/fase3-rbac/spec.md`.
Implementación L3/BUILT; validación de BD/interfaz y revisión independiente pendientes. Sin push ni migración aplicada.
La autorización explícita del usuario permite producción, pruebas locales y commits en esta rama; sustituye las restricciones históricas incompatibles del relevo.

## Resultado

- Migración **0017_rbac_supervision.sql**, siguiente número libre (0016 ya era de cuentas Google). Crea `user_permission_overrides` y `manager_scopes` con RLS, FK e índices únicos; journal actualizado. CREATE/índices/seed idempotentes. No se ejecutó contra ninguna base.
- Siembra `manager` / **Gerente/Supervisor**: alcance `team` en vistas y operaciones comerciales seleccionadas de leads/contactos/negocios/actividades/proyectos/unidades/metas; consulta de comisiones/reservas y acceso al selector de brokers. No concede users/roles/settings, precios internos, importación/exportación ni borrado. No modifica concesiones existentes al reejecutarse.
- `effectivePermissions`, invocado al construir el actor, aplica **override > rol > none**. Un override `none` revoca expresamente esa celda. El admin y los roles protegidos ignoran excepciones; la API también rechaza crearlas o restablecerlas sobre ellos.
- `team` incluye al propio usuario y los miembros activos de equipos activos que lidera o supervisa. El actor carga esos IDs una vez por petición; `reaches` y `scopeCondition` usan el mismo conjunto. Ni un equipo del que es solo miembro ni un equipo inactivo otorgan supervisión.
- Solo admin con settings:edit all puede modificar excepciones, matrices de rol y asignaciones de equipos/supervisores. Cada cambio personal y de equipos se audita con antes/después dentro de su transacción. Autor y motivo de la excepción los decide el servidor. Restablecer elimina la excepción de configuración, conservando la evidencia en audit_log.
- Configuración → **Usuarios y permisos** tiene pestañas por rol, por broker y por equipos/supervisores. La matriz muestra herencia, alcance, badge Personalizado, cambios pendientes y restablecimiento al rol. Incluye motivo, bloqueo durante envío, error accesible, éxito y comprobación sin conexión. Controles de 44–48px y desplazamiento contenido en la matriz; reutiliza Button/Badge y tokens existentes.
- La barra superior ofrece **Ver como broker** a admin/manager. La cookie es de sesión, httpOnly y SameSite strict; solo expresa intención y no concede identidad. El servidor revalida rol, broker activo y equipos en cada petición. Solo quedan acciones view; se bloquean escrituras, exports y GET de OAuth/ICS con efectos. Manager conserva el perímetro de sus equipos y no obtiene recursos que tenga denegados o solo propios. Una vista caducada/revocada ofrece salida sin devolver la cartera del broker.
- La concesión explícita **leads:edit all** permite reasignar a un manager/broker. `team` y `own` no bastan; manager no recibe esa concesión por defecto. Se refleja en la ficha y en la bandeja de asignación, y mantiene validación del broker destino y auditoría. Es la capacidad disponible en el catálogo actual, sin inventar una acción nueva.

## Verificación observada

Node **22.23.4**. El Node predeterminado del contenedor era 20, por eso se usó:

```sh
npx --yes --package=node@22 -c 'npm run typecheck && npm run lint && npm test'
```

Resultado: salida **0**; typecheck y lint limpios; **1128 pruebas totales, 1126 aprobadas, 2 omitidas, 0 fallos**.
Evidencia temporal local: `/tmp/qh-f3-final.log`. También `git diff --check` limpio.

Pruebas nuevas: precedencia y revocaciones, protección admin, alcance propio/equipos/ajenos, límites de la simulación, bloqueo transversal del middleware, validación de cuerpo/IDs, contratos de rutas, protocolo ORM de overrides/auditoría y consulta real declarada de miembros/supervisores. Las pruebas de persistencia usan dobles de Drizzle; no acreditan ejecución de SQL ni concurrencia PostgreSQL.

## Revisión de seguridad del cambio

Revisión estática propia, sin hallazgos nuevos sin corregir en el diff:

- `src/application/permisos/administracion.ts:27`: un manager con override settings all sigue sin poder conceder permisos. La matriz de roles tiene la misma restricción en ruta y caso de uso.
- `src/infrastructure/db/repos/permisos.ts:30`: bloqueo del usuario, rechazo de admin protegido y escritura/auditoría en la misma transacción. Un cuerpo con grantedBy extra se rechaza; se asignan columnas explícitamente.
- `src/infrastructure/db/repos/permisos.ts:51`: líderes/supervisores/miembros validados, destino activo, membresía única y auditoría del traslado. No se crea una segunda membresía para el mismo usuario.
- `src/infrastructure/auth/actor.ts:102`: solo miembros activos y no borrados de equipos supervisados activos. Revocaciones se reflejan en la petición siguiente.
- `src/domain/rbac.ts:162`: la vista de manager no amplía recursos/perímetro usando los overrides del broker; tampoco puede seleccionar otro admin.
- `src/middleware.ts:44`: una escritura directa durante ver-como responde 403, incluso en endpoints que no expresan su mutación como permiso edit. También se bloquean OAuth y descargas GET identificadas.
- Nuevas tablas con `.enableRLS()` y ALTER RLS en migración; sin políticas públicas. Ninguna variable de entorno, credencial o contenido de la transcripción fue añadido.

GitNexus no disponible: sustituido por rg, lectura de llamadas/filtros, tsc, diff y pruebas según autorización. Impacto central: actores autenticados, filtros por responsable, autorizaciones, shell/configuración y reasignación de leads. No se comparó con remoto ni se cerraron issues.

## Pendientes de entorno y revisión

1. Antes de desplegar este código, respaldar y aplicar **0017** en el entorno autorizado. El código consulta las tablas nuevas desde la autenticación: no desplegar sin esa migración.
2. Ejecutar test:db con admin/manager/brokers de dos equipos: pertenencia, liderazgo, supervisión múltiple, baja/inactividad, traslado, override de proyectos all sin ampliar leads y rechazo del admin protegido. Verificar idempotencia SQL y rollback real si falla audit_log.
3. Recorrido Playwright/manual de matrices, guardado/restablecimiento, supervisores y ver-como; intentos directos de escritura y revocación durante una vista abierta. Capturas/axe a 320/390/768/1440. No se arrancó dev ni se ejecutó build por la restricción del repositorio.
4. Revisión independiente por otro proveedor. Se intentó Gemini CLI en solo lectura con diff de código, sin credenciales ni transcripción; salió con código 41 sin autenticación disponible. No hubo informe y no se declara aprobada la revisión.
5. La edición de múltiples celdas se guarda por celda, con transacción/auditoría individual. Si falla una intermedia, la UI informa cuántas se guardaron y conserva pendientes; no es un guardado atómico de toda la matriz personal.

## Commits locales

- `88fd49d` · datos, migración y resolución/filtro de permisos.
- `fa4c183` · administración, auditoría y contratos de API.
- `70bf483` · interfaz de permisos y selector de solo lectura.
- Este commit · reasignación por concesión, ficha y evidencia final.
