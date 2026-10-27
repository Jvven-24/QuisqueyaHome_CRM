# Plan del equipo de desarrollo y diseño: CRM Quisqueya Home
Fecha: 26/10/2026, 11:30 PM hora RD. Rama: `codex/wilber-crm-20261026` (nunca `main`, nunca force).

## 1. Equipo (agentes) y herramientas
| Rol | Herramienta | Estado |
|---|---|---|
| Orquestador, revisión y despliegue | Grok Bot | activo |
| Productor de código (backend, vistas, pruebas) | Codex CLI 0.164.0 (box y VPS) | instalado, la última versión |
| Revisor independiente / segunda opinión | Gemini CLI 0.65.0 (box y VPS) | instalado, la última versión |
| Antigravity | IDE de escritorio de Google, sin CLI en npm (el paquete `antigravity` de npm es un placeholder) | no instalable por CLI; se usa desde el escritorio si Wilber lo quiere |
| QA E2E / capturas | Playwright 1.63 (Python, box) | instalado |
| Accesibilidad | axe-core (WCAG 2 A/AA) | instalado en /workspace/crm-plan |
| Rendimiento / buenas prácticas | Lighthouse 12.8.2 | instalado en /workspace/crm-plan |

**Codex se negaba a editar.** `AGENTS.md` exige leer `.viltrum/vre-os/EN-CURSO.md`, `FLUJO-PASADAS.md` y `M-20261004-VRE.md`, y esos archivos no existen en el repo (solo está `spec/`).
- Arreglo local: creé `.viltrum/vre-os/EN-CURSO.md`, que no se versiona (está en `.git/info/exclude`).
- Propuesta (pendiente del OK de Wilber): versionar un `EN-CURSO.md` mínimo y simplificar `AGENTS.md` para quitar las referencias a archivos que faltan.

**Flujo del equipo.**
1. Codex produce en un worktree con un `TAREA.md` que lista los archivos permitidos.
2. Gemini o Grok revisan, porque quien produce no revisa su propio trabajo.
3. Se pasa la puerta de calidad: `typecheck`, `lint`, `test`, `build` y el barrido Playwright + axe.
4. Commit en la rama de trabajo y `sh remoto.sh desplegar`.

## 2. Despliegue sin caída (hecho)
`/opt/qh-dev/remoto.sh` (respaldo en `remoto.sh.bak-20261027-0327`), versionado en `ops/vps-dev/remoto.sh`:
- `desplegar [repo]`: hace `git archive HEAD` hacia `app-next`, compila ahí mientras `app` sigue sirviendo, cambia `app` por `app-next`, recrea el contenedor (el corte medido fue de unos 2 s, con un solo 502 en el sondeo de cada 2 s), comprueba `/api/health` y revierte solo si falla.
- `revertir`: vuelve a `app-old`.
- Antes de cualquier migración: `pg_dump` de `crm` en `/opt/qh-dev/backups`.

## 3. Auditoría (barrido de 58 pantallas × escritorio y móvil, admin.prueba)
Resultado: las 116 vistas responden 200, ninguna muestra "No se pudo cargar" y ninguna tiene scroll horizontal en móvil. La más lenta es /brokers/mi-espacio en móvil (4.7 s).

### Backlog priorizado
| # | Sev. | Hallazgo | Dónde | Estado |
|---|---|---|---|---|
| 1 | Alta | React #418: un `<button>` dentro de otro `<button>` en la ficha móvil de DataTable | /metas, /reservas/facturacion (y cualquier DataTable con botón en la columna título) | **Arreglado** en cabb771 y desplegado. 12 recargas posteriores salieron limpias; queda 1 #418 intermitente en /metas móvil (ver #4) |
| 2 | Alta | El despliegue compilaba encima de la versión en vivo y tumbaba el CRM | remoto.sh | **Arreglado** en afc7ea9 |
| 3 | Alta | No hay suite E2E de flujo con escritura (lead → negocio → reserva → comisión → meta, tarea → agenda). Hoy solo se valida la carga de pantallas | QA | Pendiente: suite Playwright con datos semilla y limpieza |
| 4 | Media | React #418 intermitente en el barrido de producción, que no se reprodujo en modo dev | /brokers/onboarding, /academy/administracion y una vez /metas en móvil (además `Cannot read properties of null (reading 'parentNode')`) | Investigar: posible carrera con la extensión/script de limpieza de atributos del layout |
| 5 | Media | Contraste de color insuficiente (WCAG AA): 206 nodos | las 58 pantallas (tokens de texto atenuado y dorado sobre blanco) | Ajustar tokens en `tokens.css`/DESIGN.md |
| 6 | Media | `<dl>` mal formado: 120 nodos | /brokers | Corregir el marcado |
| 7 | Media | Selects y inputs sin etiqueta (crítico en axe) | /comunicaciones, /propiedades | Añadir `aria-label`/`<label>` |
| 8 | Baja | Recharts "width(-1) height(-1)" porque el gráfico se monta en un contenedor sin tamaño | /comisiones/liquidaciones, /comisiones/reglas, /reservas/cartera, /conciliacion, /documentos, /excepciones | `minWidth={0}`/altura fija o montar al ser visible |
| 9 | Media | Aspecto básico: muchas pantallas son "VistaPrevia" con datos de ejemplo (`_ejemplo`) | Reservas (facturación, cartera, documentos), Portal, Comunidad | Rediseño por módulo según DESIGN.md; marcar claramente "demo" |
| 10 | Media | El rol `team` se comporta como `own` porque `scopeCondition` no usa equipos | rbac-filter.ts | Se resuelve con el plan RBAC (§4) |
| 11 | Baja | Rendimiento: /brokers/mi-espacio tarda 4.7 s en móvil | — | Perfilar con Lighthouse |
| 12 | Info | Los archivos `.viltrum/vre-os` que menciona AGENTS.md no existen | repo | Ver §1 |

Evidencia: `/workspace/crm-plan/audit.json`, `audit.log` y las capturas en `shots/` (d_ = escritorio, m_ = móvil).

## 4. RBAC: rol Manager/Supervisor y matriz de permisos por broker (diseño; NO implementado hasta recibir el documento de Wilber)
**Lo que ya existe.**
- Tablas `roles(slug, is_protected)`, `users.role_id` y `permissions(role_id, resource, action, scope)` con `scope ∈ none|own|team|all`.
- Lógica pura en `src/domain/rbac.ts` (`requireScope`, `requireFullScope`, `reaches`) y filtro SQL en `src/infrastructure/rbac-filter.ts`.
- Tablas `teams(leader_id)` y `team_members` (un broker pertenece a un solo equipo), recién creadas para Metas.
- Filas en `permissions`: admin 126, assistant 35, broker 22.
- Hay una API `/api/roles`.

**Cambios propuestos.**
1. **Migración 0014 (pg_dump antes):**
   - sembrar el rol `manager` ("Gerente/Supervisor") con permisos `team` en leads, contacts, deals, activities, projects, units y goals; `view` en commissions y reservations; nada en users ni roles;
   - crear la tabla `user_permission_overrides(user_id, resource, action, scope, granted_by, reason, created_at)` con RLS y una fila única por (user, resource, action), que permite **subir o bajar** el permiso de un broker concreto respecto a su rol;
   - crear la tabla `manager_scopes(manager_id, team_id)` para supervisar varios equipos, y mantener `teams.leader_id` como predeterminado;
   - auditar cada cambio en la tabla de auditoría que ya existe.
2. **Resolución del permiso efectivo** (en un solo sitio, en `infrastructure/auth/actor`): la sobrescritura del usuario, si existe, gana sobre el permiso del rol; si no hay ninguno, `none`. El admin protegido no admite sobrescrituras.
3. **`scope=team` real:** `scopeCondition` filtra con `owner IN (miembros de los equipos que lidera o supervisa el actor) OR owner = actor`. Se cubre con pruebas puras y de base de datos.
4. **Recursos nuevos o separados** si el documento lo pide: `tasks` (hoy `activities`), `projects.manage`, `goals.edit`, `reports.view` y `view_as_broker` (un admin o manager filtra cualquier vista "como el broker X" en solo lectura).
5. **Interfaz (Configuración → Usuarios y permisos):**
   - una matriz recurso × acción con un selector de alcance por celda (Ninguno, Propio, Equipo, Todo);
   - una pestaña por rol y otra "por broker", que muestra lo heredado y lo sobrescrito con un badge "personalizado" y un botón "restablecer al rol";
   - un selector "Ver como broker" en la barra superior para admin y manager;
   - asignación de equipos y supervisores.
6. **Pruebas:**
   - de dominio para la precedencia de sobrescrituras y el alcance `team`;
   - de contrato para que cada ruta de `/api` llame a `requireScope` (ya existe y se amplía);
   - `test:db` con 3 usuarios (admin, manager, broker) para comprobar que el manager ve su equipo y no otro, y que un broker con sobrescritura `view all` en proyectos ve todos los proyectos pero solo sus leads;
   - E2E Playwright de la matriz y de "ver como".
7. **Despliegue:** migración → `remoto.sh desplegar` → barrido de 58 pantallas con los 3 roles.

Estimación: 2–3 pasadas, de 1–2 días de agente cada una, después de recibir el documento.

## 5. Siguientes pasos
1. Recibir el documento de requisitos de Wilber y ajustar el §4.
2. Construir la suite E2E de flujos con escritura (backlog #3).
3. Lote de accesibilidad y diseño (#5–#9) con Codex como productor y Gemini como revisor.
4. Dar el OK para versionar `.viltrum/vre-os/EN-CURSO.md`.
