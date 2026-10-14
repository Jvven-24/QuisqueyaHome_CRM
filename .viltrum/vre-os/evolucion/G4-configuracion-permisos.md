# Expediente de evolución · Configuración (usuarios, roles y permisos granulares, catálogos, etapas, papelera)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026) · G4 Plataforma · D21 + D03 + D12 · 2026-10-14.
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia); AGPL/GPL solo como servicio aparte o referencia. Nada se incrusta.
> Diseño transversal: `G4-00-arquitectura-centralizacion.md`. Los permisos de **todos** los módulos nuevos nacen aquí (recurso, acción, alcance).

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 3 | Altas/ediciones/bajas de usuario e invitación (`api/usuarios/**`), matriz recurso×acción×alcance (`_permisos.tsx`), catálogos de motivos y canales (`api/catalogos/[tipo]`), etapas (`api/etapas/[id]`), papelera con restaurar (`api/papelera/restaurar`). |
| Datos reales y reglas de negocio | 3 | `permissions(role_id, resource, action, scope)` con `scope ∈ {none, own, team, all}` (`schema.ts:233-257`, `domain/rbac.ts`). Ausencia de fila = `none` (cierra por defecto). Rol admin protegido (`roles.is_protected`, `roles/casos-de-uso.ts:20-25`). Cambios auditados. |
| Diseño y componentes | 3 | Matriz usable; pestañas por `?tab=` consultando solo lo necesario (`configuracion/page.tsx`). |
| Experiencia de uso | 2 | Sin crear/clonar roles, sin vista «qué ve este usuario», sin comparar roles, papelera truncada a 30 por tipo (`page.tsx:128-133`), sin buscador en usuarios. |
| Calidad | 3 | Pruebas por casos de uso (`usuarios|roles|catalogos|etapas|papelera/casos-de-uso.test.ts`); candados `requireScope` en CI. Falta `error.tsx`/`loading.tsx` del módulo (inventario D21 §2). |

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **Rutas administrativas con `requireScope` en vez de `requireFullScope`**: `api/roles/[id]/permisos/route.ts:29`, `api/papelera/restaurar/route.ts:35`, `api/etapas/[id]/route.ts:38` y `api/catalogos/[tipo]/route.ts:30` usan `requireScope(actor,"settings",…)` (`edit`, y `create` en catálogos). `settings` no tiene responsable por fila; un rol con `settings:edit:own` pasaría. `domain/rbac.ts:93` (`requireFullScope`) documenta exactamente por qué los recursos administrativos exigen alcance `all`. Escenario: se concede por error `settings:edit:own` a un asistente y este edita la matriz de permisos. Corrección de una línea + prueba en `seguridad-rutas-id.test.ts`.
2. **`team` se comporta como `own`** (`rbac.ts:123`, `rbac-filter.ts:32`): no existe el modelo de equipos. La pantalla ofrece «Equipo» como opción real; elegirla restringe sin avisar.
3. **No se pueden crear roles** (solo `PATCH …/permisos`): `marketing` está «previsto» en el esquema, pero faltan los de Contador y Oficial de cumplimiento que PLAFT y la capa financiera necesitan (G4-cumplimiento-plaft, M22). Hoy solo hay 3 roles sembrados (`seed.sql:18`).
4. **Lista cerrada de recursos** (`catalogs.ts:34-56`, 21 valores): los módulos nuevos (cobros, cotizaciones, contratos, KYC, cumplimiento, notificaciones, automatizaciones, importación, búsqueda, aprobaciones) no tienen recurso; un recurso sin fila queda cerrado (correcto), pero nadie puede abrirlo. M22 ya lo pide (`payments`).
5. **La acción `import` no la usa ninguna ruta** (inventario D21 §2); `export` solo comisiones.
6. **Papelera**: `limit(30)` por tipo y orden en memoria; restaurar exige `settings:edit` y no el permiso del recurso (comentario `ponytail` en `restaurar/route.ts`); sin vencimiento ni vaciado; usuarios en papelera sin ver quién los borró. No cubre actividades, comisiones ni mensajes.
7. **Sin política de cuenta**: ni MFA, ni lista de sesiones, ni caducidad de invitación visible. `sessions` (`schema.ts:259`) está sin uso. Para un CRM con datos de compradores y (pronto) KYC es el hueco de seguridad más grande de esta pestaña.
8. **Sin parámetros del sistema**: zona horaria, moneda base, tasa de cambio, horario laboral, plazos de SLA, caducidad de reserva y de propuestas (7 días, decisión #47) están dispersos en código o por definir.
9. **Layering**: `configuracion/page.tsx` ejecuta SQL directo (~10 consultas con `getDb()`); el patrón de capas del programa pide casos de uso de consulta.
10. **Cada petición recompone los permisos desde la BD** (`auth/actor.ts` `actorFor`, con `cache` solo dentro de la petición): correcto para seguridad, pero cada módulo nuevo añade consultas; medir antes de cachear.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| CFG-01 | `requireFullScope` en todas las rutas administrativas + candado de CI | ESENCIAL | A21.2 | `requireScope` |
| CFG-02 | Crear, clonar y desactivar roles; plantillas de rol (Admin, Asistente, Broker, Marketing, Contador, Oficial de cumplimiento) | ESENCIAL | A21.2 | ausente |
| CFG-03 | Registro de recursos por módulo (cada módulo declara los suyos en un manifiesto; el catálogo se compone, no se edita a mano) | ESENCIAL | A21.2 | lista fija |
| CFG-04 | Alcance por **proyecto/entidad legal** (`project`), y `team` real con equipos (`teams`, `team_members`) | ESENCIAL | A21.1, A21.2 | `team = own` |
| CFG-05 | Permisos por **campo** declarativos (precio real, comisión, KYC, nota interna) en lugar de funciones ad hoc (`stripRestrictedPrices`) | IMPORTANTE | A21.2 | solo precios |
| CFG-06 | Vista «¿qué puede hacer X?» (simulador de permisos efectivos de un usuario) y comparador de roles | IMPORTANTE | A21.2 | ausente |
| CFG-07 | Delegación temporal con vencimiento (vacaciones, cobertura) auditada | DESEABLE | A21.2 | ausente |
| CFG-08 | Cambios de permisos críticos con doble aprobación (otorgar `export`, `unit_real_price`, `kyc`) | IMPORTANTE | A19.2 | un solo admin |
| CFG-09 | Política de cuenta: MFA TOTP obligatorio para admin/oficial, sesiones activas con cierre remoto, caducidad de invitación | ESENCIAL | A18.9, A19 | ausente |
| CFG-10 | Parámetros del sistema tipados y versionados (zona horaria, moneda, SLA, caducidades) con historial | IMPORTANTE | A21 | disperso |
| CFG-11 | Catálogos configurables completos (tipos de documento, zonas, métodos de pago, tipos de proyecto, fuentes) con orden, activar/desactivar, uso (en cuántos registros) | IMPORTANTE | A3, A21 | 2 catálogos |
| CFG-12 | Etapas: crear, ordenar, reglas de transición por etapa (prerrequisitos) | IMPORTANTE | A1/A5 | solo PATCH/DELETE |
| CFG-13 | Papelera completa: paginada y filtrable, quién borró y cuándo, vencimiento configurable, restaurar con permiso del recurso, y **bloqueo de borrado** de lo sujeto a PLAFT (10 años) | ESENCIAL | A18.7 | 30 por tipo |
| CFG-14 | Registro de entidades legales (RNC, nombre, tipo: sociedad/fideicomiso) base de la multientidad | ESENCIAL | A21.1 | ausente (coordinar G3) |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **CASL** | `stalniy/casl` @ `9ed3261697`, `@casl/ability` 7.0.1 (npm, modificado 2026-07-06) | MIT (npm `@casl/ability`, `@casl/react`) | TS isomórfico | Conceptos: **permisos por campo** (`permittedFieldsOf`, `subject` con `fields`) y condiciones sobre el objeto; `@casl/react` `Can` para ocultar UI | **REF** (+ APP opcional solo de `@casl/react`) | Nuestro modelo ya es `rol×recurso×acción×alcance` en BD y el filtrado vive en SQL (`rbac-filter.ts`); el adaptador de consultas de CASL es para Prisma/Mongoose, no Drizzle. **No sustituir** `domain/rbac.ts`: duplicaría la fuente de verdad. Se toma la idea de campos y se implementa como tabla `field_permissions` leída por `domain/rbac.ts` | S (idea) |
| Cerbos | `cerbos/cerbos` @ `12618bd113` | Apache-2.0 | Go, servicio aparte (PDP) | políticas YAML + decisión por API | **REF** (diferido) | Otro proceso que operar y sincronizar con la BD; solo se justificaría si el Portal y el CRM necesitaran un mismo punto de decisión | — |
| Oso (biblioteca) | `osohq/oso` último push 2025-02-26 | Apache-2.0 | lenguaje Polar | — | **DESCARTADO** | Sin actividad en 12 meses; **estado de mantenimiento NO VERIFICADO**; lenguaje nuevo para el equipo | — |
| Supabase Auth MFA | docs `auth/auth-mfa` (consultadas 2026-10-14) | servicio ya usado | TS (`@supabase/supabase-js`) | TOTP y teléfono; claim `aal` (`aal1/aal2`) para exigir segundo factor en servidor y RLS | **APP** (ya en el stack) | Directo: `getActor` exige `aal2` para roles privilegiados. Disponibilidad por plan NO VERIFICADA | S |
| shadcn/ui `Command` + `Table` | ya en el repo | MIT | React | selector de usuarios, tabla de permisos efectivos | APP | ya se usa shadcn | S |

Qué adaptamos y qué no: de CASL, el concepto de permiso por campo y la comprobación en UI; **no** su motor de condiciones ni su adaptador. Riesgo: reinventar mal el motor de campos; mitigación: tabla pequeña (`role_id, entity, field, access ∈ {none, read}`) y una sola función en `rbac.ts` que sustituye a `stripRestrictedPrices` sin cambiar su contrato.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Matriz de permisos con diff antes de guardar y confirmación con motivo | `Table` + `Dialog` + resumen «Vas a conceder: …/quitar: …» | pestaña Permisos |
| Simulador «ver como» (solo lectura, sin cambiar de sesión) | `Sheet` con lista de pantallas visibles/botones, generada con `can()` | ficha de usuario |
| Alta guiada de rol: plantilla → ajustes → vista previa | `Tabs` + `Stepper` simple | pestaña Roles |
| Estados vacío/error/carga del módulo | `error.tsx` y `loading.tsx` en `configuracion/` | raíz del módulo |
| Papelera con filtros, selección múltiple, vencimiento | `data-table.tsx` + `Badge` de días restantes | pestaña Papelera |

## 6. Comunicación con el resto (centralización)
Emite `UsuarioCreado`, `UsuarioDesactivado` (→ Moodle `AprendizajePort`, Notificaciones), `PermisosCambiados` (→ Auditoría reforzada, Notificaciones al admin), `ParametroCambiado`. Consume `SolicitudAprobada` para aplicar cambios críticos (CFG-08, vía G4-auditoria-aprobaciones). **Es el registro maestro** de recursos/acciones: cada módulo del programa declara aquí sus recursos (`payments`, `quotes`, `kyc`, `compliance`, `notifications`, `automations`, `imports`, `approvals`, `search`); sin declaración no hay permiso. Puertos: `Auditoria`, `AdminAuth` (`application/compartido/admin-auth.ts`), `BusPort`. Datos compartidos: `roles`, `permissions`, `legal_entities` (consumida por Cobros/Facturación/Cumplimiento).

## 7. Lotes asignables
Fichas: la matriz actual está en M13 (config) del Spec Pack; los lotes con esquema nuevo (equipos, campos, parámetros, entidades) requieren **ficha nueva** `G05-configuracion-avanzada` (D01/D03) y ficha de migración (D11).
| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| CFG-L1 | `requireFullScope` en `roles/[id]/permisos`, `papelera/restaurar`, `etapas/[id]`, `catalogos/**`; prueba de CI que lista rutas con `settings`/`roles` y exige `requireFullScope` | `src/app/api/roles/**`, `papelera/**`, `etapas/**`, `catalogos/**` (solo la línea de permiso), `src/infrastructure/seguridad-rutas-id.test.ts` | hallazgo (no es función nueva) | Haiku | D12 | — |
| CFG-L2 | `error.tsx` + `loading.tsx` de `configuracion/` con seis estados | `src/app/(crm)/configuracion/{error,loading}.tsx` | — | Haiku | D14 | — |
| CFG-L3 | Papelera completa: caso de uso `listarPapelera` paginado/filtrable + UI; la página deja de usar `getDb()` | `src/application/papelera/**`, `src/infrastructure/db/repos/papelera.ts`, `configuracion/_papelera.tsx`, `configuracion/page.tsx` (rama papelera) | G05 | Sonnet | D14 | CFG-L2 |
| CFG-L4 | Roles: crear/clonar/desactivar (caso de uso + `POST /api/roles`, `PATCH /api/roles/[id]`), plantillas, auditoría | `src/application/roles/**`, `src/app/api/roles/**`, `configuracion/_permisos.tsx` | G05 | Sonnet | D12 | CFG-L1 |
| CFG-L5 | Manifiesto de recursos (`domain/recursos.ts`) que compone `PERMISSION_RESOURCES`; migración del `enum` a texto validado + semilla; candado «todo recurso usado en una ruta está declarado» | `src/domain/catalogs.ts`, `src/domain/recursos.ts`, `db/seed.sql`, `src/infrastructure/seguridad.test.ts` | G05 + D11 | Sonnet | D12 | CFG-L1 |
| CFG-L6 | Simulador de permisos efectivos (lectura) y comparador de roles | `src/application/roles/consultas.ts`, `configuracion/_permisos.tsx` | G05 | Sonnet | D05 | CFG-L4 |
| CFG-L7 | Parámetros del sistema: tabla `system_settings` (clave tipada, valor jsonb, versión, quién), caso de uso, pestaña | `schema.ts`, `drizzle/0006_*`, `src/application/parametros/**`, `configuracion/_parametros.tsx` | G05 + D11 | Sonnet | D11+D12 | CFG-L5 |
| CFG-L8 | MFA TOTP para admin/oficial: `getActor` exige `aal2` si el rol lo requiere; pantalla de enrolamiento | `src/infrastructure/auth/**`, `src/app/(crm)/configuracion/_seguridad.tsx` | G05 | Sonnet | D12 | CFG-L7 |
| CFG-L9 | Permisos por campo: `field_permissions` + función en `rbac.ts` que reemplaza `stripRestrictedPrices` sin cambiar su contrato; pruebas centinela | `schema.ts`, `src/domain/rbac.ts`, `src/domain/rbac.test.ts`, `precios-respuestas.test.ts` | G05 + D11 | Sonnet | D12 | CFG-L5 |
| CFG-L10 | Equipos reales (`teams`, `team_members`) y `team` en `reaches`/`scopeCondition` en un solo sitio | `schema.ts`, `src/domain/rbac.ts`, `src/infrastructure/rbac-filter.ts` | G05 + D11 | Sonnet | D12 | CFG-L9 |
| CFG-L11 | Catálogos genéricos configurables + conteo de uso | `src/application/catalogos/**`, `configuracion/_catalogos.tsx` | G05 | Sonnet | D14 | CFG-L5 |
| CFG-L12 | `legal_entities` (RNC, tipo, activa) y alcance `project/entidad` | `schema.ts`, `drizzle/0006_*`, `src/application/entidades/**` | G05 + G3 | Sonnet | D11+D12 | CFG-L10 |

## 8. No verificado
Disponibilidad de MFA TOTP en el plan de Supabase de Wilber; cuántas consultas añade `actorFor` por módulo nuevo (no medido); que `team`/`project` como alcance no rompa el seed de permisos existente (`seed.sql:33-80`); licencia y actividad de `@casl/react` (se leyó `@casl/ability` y `@casl/prisma`, no `@casl/react`); estado de mantenimiento de Oso (solo la fecha del último push).
