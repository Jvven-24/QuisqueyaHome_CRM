# Inicio

## Propósito
Pantalla de entrada del CRM. Muestra al usuario, según su rol, lo que necesita hoy: KPIs de leads, negocios, actividades, proyectos, metas y academia, el embudo comercial y los pendientes. Cada cifra respeta el alcance del usuario (`own`, `team`, `all`). No es una pantalla de captura: sirve para decidir qué abrir.

Código de referencia: `app/(crm)/inicio/page.tsx`, `vista.tsx`; cálculo en `application/dashboard/consultas.ts`.

## Roles y permisos
Recurso RBAC principal: `dashboard:view`. Cada tarjeta exige además el permiso de su recurso (`leads`, `deals`, `activities`, `projects`, `goals`, `academy`).

| Rol | `dashboard:view` | Alcance efectivo | Vista |
|---|---|---|---|
| admin | all | todo | Supervisión global |
| manager (Gerente/Supervisor) | team (migración 0017) | equipo propio | Supervisión del equipo |
| assistant (Asistente) | all | cartera completa, sin análisis de negocios ni precios internos | Carga operativa del día |
| broker | own | solo lo suyo | Acciones de su cartera |

- La función `dashboardScopes` usa el menor alcance entre el permiso del recurso y el alcance de la página: un `team` nunca se convierte en `all`.
- Sin `dashboard:view` la página responde 403 (`requireScopeInPage` → `forbidden()`).
- Botón "Crear lead": solo si `can(actor, "leads", "create")`.
- Ver como (`/ver-como`): admin y manager pueden simular el inicio de un broker en solo lectura.

## Flujos principales
1. El usuario abre `/inicio`. El sistema resuelve el actor y el alcance de `dashboard:view`; si es `none`, muestra 403.
2. El sistema calcula KPIs y el embudo en zona horaria America/Santo_Domingo (hoy, semana y mes).
3. El usuario ajusta filtros de periodo y zona vía parámetros de URL (mismo contrato que Reportes, `leerFiltros`).
4. El usuario pulsa una tarjeta (p. ej. "Leads nuevos") y pasa al módulo con el filtro ya aplicado.
5. Un asistente ve tareas del día y leads sin primer contacto; un broker ve su cola y sus negocios por etapa; un admin o manager ve el rendimiento del equipo.
6. Si una tarjeta no tiene permiso, no se renderiza: la pantalla sigue útil con lo que sí puede ver (vista parcial).
7. Pulsar "Revisar aprobaciones" hoy abre una vista de ejemplo: debe ocultarse hasta que exista la bandeja real.

## Datos
Inicio no tiene tabla propia; agrega sobre:

- `leads` (`status`, `broker_id`, `received_at`, `first_contacted_at`).
- `deals` + `pipeline_stages` (`stage_id`, `amount_cents`, `probability`, `stage_changed_at`, `closed_at`).
- `activities` (próximas y vencidas, por responsable).
- `projects`, `units` (disponibilidad por estado).
- `goals`, `teams`, `team_members`, `manager_scopes`.
- `academy_items`, `academy_progress`.

Reglas: montos en `bigint` (centavos); porcentajes calculados en la aplicación; las fechas de corte salen de `dashboardQuery` (hoy, lunes de la semana, inicio y fin de mes).

## Estados de UI (D06)
- **Vacío:** cada tarjeta muestra "Sin datos en este periodo" con enlace a crear o cambiar el filtro. Falta homogeneizar el texto.
- **Cargando:** `loading.tsx` del módulo; esqueleto de tarjetas (no spinner global).
- **Error:** `error.tsx` con reintento; `estado-conexion.tsx` avisa si se perdió la conexión, sin borrar lo ya mostrado.
- **Sin permiso:** 403 de página si falta `dashboard:view`; tarjetas sin permiso ocultas, no deshabilitadas.
- **Éxito:** KPIs con cifra, variación contra el periodo anterior (pendiente) y enlace al detalle.
- **Parcial:** si `deals` es `none` no se muestra el embudo y la pantalla lo indica; si falla una consulta, las demás tarjetas siguen visibles.

## Estado actual vs PRD
**Existe (código real):**
- KPIs y embudo calculados con alcance por rol, con pruebas en `consultas.test.ts`.
- Vistas distintas para asistente, broker y supervisión.
- Filtros por URL y zona horaria de Santo Domingo.
- Estados de carga y error del módulo.

**Demo o incompleto (auditoría 27/10/2026):**
- "Revisar aprobaciones" lleva a una pantalla de ejemplo.
- Faltan los widgets de "mi día" (tareas vencidas, citas de hoy).
- No hay comparativa contra el periodo anterior.
- Aunque existe `leerFiltros`, la auditoría no encontró un selector visible de periodo y broker: verificar en la UI.
- Metas y academia muestran cifras vacías porque no hay contenido cargado.

**Compendio (PRD):** el compendio no especifica el Inicio del CRM. Su PRD (§4) deja fuera de alcance inicial el "CRM propietario completo"; los dashboards aparecen en el nivel avanzado de la propuesta por niveles y en la Fase 4 (CRM ligero, analítica y BI). Esta pantalla es, por tanto, una extensión operativa, no un requisito del PRD.

## Checklist de aceptación
- [x] KPIs filtrados por alcance del usuario
- [x] Vista distinta para asistente, broker y supervisión
- [x] Embudo reutiliza el cálculo de Reportes
- [x] 403 de página si falta dashboard:view
- [x] Zona horaria Santo Domingo en semana y mes
- [ ] Quitar "Revisar aprobaciones" mientras sea demo
- [ ] Widget "Mi día" con tareas vencidas
- [ ] Selector de periodo y broker visible
- [ ] Comparativa contra el periodo anterior
- [ ] Estado vacío explícito en cada tarjeta

## Dependencias
- **Leads:** fuente de KPIs de captación y cola de brokers.
- **Negocios:** embudo y valor ponderado; depende de `pipeline_stages`.
- **Agenda (actividades):** pendientes y vencidas.
- **Propiedades:** disponibilidad por proyecto.
- **Metas y Comisiones:** cumplimiento de metas por equipo y broker.
- **Academia:** progreso de formación (sin contenido, la tarjeta queda vacía).
- **Reportes:** embudo canónico y filtros compartidos (`reportes/filtros`).
- **Aprobaciones (pendiente):** tarjeta de descuentos y liquidaciones aún no real.
- **Configuración (roles y permisos, `ver-como`):** define el alcance de cada tarjeta.
