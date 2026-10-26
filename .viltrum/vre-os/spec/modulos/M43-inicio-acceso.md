---
id: M43
nombre: "Inicio, acceso, búsqueda, avisos y aprobaciones P0"
estado: READY
riesgo: R3
owner: D10
productor: D03
colaboracion: [D01, D11]
revisores: [D12, D14, Wilber]
fuente_de_verdad: PostgreSQL del CRM; identidad en Supabase Auth
depende_de: [M40, M41]
actualizado: 2026-10-18
tarea: 20261018T153329Z-D03-codex-03c54ce33a214ce8b104b0580d696d6d
---

> **Compuerta D00 (2026-10-18).** Revisión independiente (`reviews/M43-revision-R1.md`, Antigravity) tras el
> recorte a alcance mínimo de una empresa (decisión #51): APROBADO CON CONDICIONES. Las condiciones se resuelven dentro de
> las rebanadas que las tocan. Las rebanadas con esquema se ejecutan en serie con las de M40 (un solo escritor de migraciones).


# M43 · Inicio y acceso · mínimo funcional de UI-001 a UI-004

## 1. Propósito y usuarios

Entrar, orientar el trabajo, encontrar expedientes autorizados y decidir propuestas sin confundir aviso con permiso. Corrección R1 sobre M43-revision-R3.md; nivel L1, REVIEW, sin aprobación propia.

Mandato vigente: una empresa Quisqueya Home (#51, docs/contexto/decisiones.md:348); TAREA de este despacho difiere sucursales, MFA/AAL2, invitaciones complejas, cachés públicas, firmas avanzadas y P1 a §9. Sin tenant_id/branches/crm_branch/nuevos roles. Fuente funcional: fuentes/especificacion-maestra-v1.txt:1025–1094; backlog-Pantallas.csv:5–8. #6 conserva roles en tabla; #15 sesiones del proveedor; #47 propuestas del asistente decididas por otro admin, un nivel/siete días (decisiones.md:310–313).

| Rol actual | Trabajo / límite P0 |
|---|---|
| admin | Inicio general, usuarios, propuestas; no autoaprobación ni pago autorizado por ser admin |
| assistant | Trabajo operativo, búsqueda, propuestas sin efecto antes de decisión |
| broker | Cola/contactos/negocios propios; inventario concedido, sin precio real/comisión ajenos |

Director/agente/finanzas son perspectivas por permiso, no roles nuevos. Sin modelo de equipos, team sigue own. Invariantes: autorizar antes de datos/conteos/fragmentos; cifra conciliable con lista; moneda separada; decisión única; credenciales fuera de URL/registros. Mantener guarda local de evaluación.

## 2. Estado actual y compatibilidad

Lectura estática local 18-oct: archivos/restricciones presentes; ejecución DB/proveedor NO VERIFICADA. Sin comparación remota.

| Evidencia | Estado / brecha |
|---|---|
| src/app/api/auth/login/route.ts:27; src/infrastructure/auth/actor.ts:29,65 | Contraseña; actor por authUserId activo/no borrado; conservar sin AAL2 |
| src/application/usuarios/casos-de-uso.ts:12,146; src/infrastructure/contenedor/usuarios.ts:13 | Alta local→invitación; reenvío confunde authUserId con aceptación |
| src/infrastructure/db/schema.ts:165,1205 | users/notifications reales; notifications sin enableRLS declarado |
| src/application/busqueda/consultas.ts:3,43; src/infrastructure/db/repos/busqueda.ts:26 | Cinco grupos, sin unidades/cursor/concesión temporal |
| src/infrastructure/rbac-filter.ts:23–39 | team=own; visibleRows no verifica concesiones |
| src/app/api/notificaciones/route.ts:26–41 | COUNT limitado a página20 |
| src/application/dashboard/consultas.ts:23; src/application/reportes/consultas.ts:61 | Agregaciones paralelas, no paridad acreditada |
| drizzle/0007_m40_compromisos_reservas.sql:27,52,114; 0008_m40_planes_pagos_aplicaciones.sql:38,61,81,169,186 | Compromisos/reservas/aplicaciones/cuotas/pagos/reversos canónicos |
| drizzle/0009_m40_comisiones_liquidaciones.sql:168–194,301–307,438–499,595–609 | Aprobaciones financieras con FK/hash/versión/evidencia/MFA; banco congelado e historia protegida |
| src/domain/catalogs.ts:19–67 | Recursos saved_views/notifications/approvals no existen; no fingirlos |

/login→307/acceso; /organizaciones→307/inicio con autenticación; conservar APIs existentes durante adaptación. DeskSwitcher muestra empresa única o se retira. sessions/password_hash siguen sin uso. broker_project_grants y price_list_versions no están en schema/migraciones leídas; M47 es contrato futuro, no instalación probada. Solo su autorización parcial condiciona S13; sin dependencia circular entre fichas completas.

## 3. Pantallas

### 3.1 UI-001 · Acceso e invitación básica

/acceso, /acceso/invitacion y /acceso/recuperar. Empresa fija; correo/contraseña, visibilidad, entrar, recuperar, aceptar invitación y cerrar otras sesiones. Sin registro público, selector de empresa/sucursal ni MFA.

**Secretos:** correo con OTP y enlace fijo sin credencial. Código solo en cuerpo POST TLS, nunca query/fragmento/ruta; tampoco correo/contraseña/JWT en URL. Plantillas usan OTP, no ConfirmationURL ([documentación](https://supabase.com/docs/guides/auth/auth-email-templates)). Tipos invite/recovery verificados también en node_modules/@supabase/auth-js/src/lib/types.ts:889 y GoTrueClient.ts:2338. Plantillas reales NO VERIFICADAS: probar antes de activar envío.

Páginas/respuestas auth: Cache-Control private,no-store y Referrer-Policy no-referrer; sin analítica/terceros ni almacenamiento web de credenciales. Proxies/CDN/servidor/trazas ingieren solo ruta sin query, código HTTP y correlación; excluir cuerpos, cookies, autorización y respuesta del proveedor incluso en errores. D16 prueba con código sintético sin imprimirlo. replaceState no protege la petición inicial; no emitir enlaces antiguos con secreto.

Invitación simple, sin saga:
1. Admin crea usuario local pendiente con caducidad CFG-012 (tres días), después envía por AdminAuth. Error deja pendiente sin acceso y acción Reenviar; no compensar borrando cuentas.
2. Verificar OTP invite y fijar contraseña en proveedor. Continuación de propósito restringido en cookie firmada HttpOnly/Secure/SameSite=Strict, ligada a identidad/operación, máximo cinco minutos; nunca concede permisos CRM. Una sesión normal/recovery no sirve como prueba invite.
3. Bloquear usuario local; verificar identidad/correo autenticado del proveedor, invitación vigente y rol activo; enlazar authUserId, marcar aceptación y auditar. No aceptar rol/userId del cliente. getActor deniega pendiente aun con sesión externa.
4. Fallo local tras consumir OTP: reintentar finalización mediante continuación vigente; si expiró, nuevo código administrativo. No crear usuario desde correo aportado por cliente. Reenvío sobre misma identidad serializado y con espera configurable; authUserId no significa aceptación. Cuenta externa existente o respuesta perdida exige recuperar/reutilizar identidad mediante proveedor, nunca duplicarla. Si no admite reenvío invite seguro, mostrar incidencia para admin y fallar cerrado; prueba de contrato obligatoria.

Identidad/rol/caducidad solo se muestran tras verificar código, nunca al buscar correo. Recuperación devuelve 202/cuerpo uniforme exista o no; OTP recovery por POST, nueva contraseña, revocar sesiones y borrar cookies CRM. No cambia rol ni reactiva inactivos. Cerrar otras sesiones no recibe userId: opera sobre actor actual. Revocar refresh no invalida instantáneamente JWT emitido: medir límite del proveedor y no prometer inmediatez.

Campos obligatorios marcados, etiquetas/autocomplete, error local y foco al primero; progreso visible, motivo ante acción indisponible. Redirección solo interna permitida; rechazar //host, barra invertida y URL externa. P0 no añade barrera AAL2.

### 3.2 UI-002 · Inicio operativo

/inicio, tabs Resumen/Mi cola; perspectivas de dirección separan Embudo/Cobros/Comisiones por permisos.

| Bloque | Fuente y acción |
|---|---|
| Hoy/visitas | activities pending autorizadas por starts_at en día local; abrir/completar con activities:edit, llamar teléfono autorizado o abrir conversación existente |
| Leads sin atender | leads visibles new/assigned con first_contacted_at NULL; abrir lista equivalente |
| Sin próxima acción | deals abiertos sin actividad pending vinculada vigente; contar negocio una vez |
| Inventario | holds/compromisos canónicos próximos a vencer o pendientes de atención; solo unidades autorizadas |
| Cuotas/cobros | M40: cuotas vencidas con saldo de aplicaciones/reversos; pagos confirmados netos por moneda; abrir detalle |
| Embudo/comisiones | Contrato de agregación compartido M41; comisiones propias, ajenas solo permiso específico |

Filtros: fechas inclusivas, agente/proyecto autorizados, moneda USD/DOP separada; sucursal/equipo diferidos. Vista privada guarda filtros/orden de tarjetas; mover arriba/abajo sin exigir arrastre. Cada tarjeta muestra fecha de actualización y abre lista con idéntico corte, predicado y autorización. Refresco conserva contenido de la misma identidad con indicador; nunca cero falso.

No duplicar filas por JOIN. Vendido es valor contractual elegible una vez por identidad; cobrado son hechos confirmados menos compensaciones confirmadas M40, sin sumarlos como ingreso único. Reserva100/pago20: vendido100, cobrado20, nunca ingreso120. No inferir efectivo desde deals. Widget y detalle concilian bajo mismo corte; no comparar contra lista recargada después.

### 3.3 UI-003 · Búsqueda/vistas

/buscar y paleta común; consulta, chips por entidad, resumen y vistas. Atajos / fuera de edición y Ctrl/Cmd+K; Escape restaura foco. Debounce300ms, abortar respuesta antigua; q≤80 y página≤50, constantes técnicas centralizadas.

dashboard:view permite pantalla; cada categoría exige su recurso:view y visibleRows ANTES de conteos/sugerencias/fragmentos/página. Relaciones también autorizadas. Para broker, proyectos/unidades requieren además EXISTS de concesión M47 vigente/no revocada con reloj servidor; broker_id no basta. Sin adapter real: resultados/conteos/sugerencias de inventario vacíos y capacidad indisponible, sin afirmar P0 completo. Reautorizar cada consulta/vista, sin caché positiva de permisos.

Texto tolerante solo nombres/títulos. IDs internos conocidos, código de unidad+proyecto, slug, teléfono E.164 y email normalizado: coincidencia exacta. Código repetido devuelve varios resultados autorizados. No se inventa public_id en tablas legadas. Documentos/cédula/pasaporte/KYC/cuentas/archivos quedan excluidos incluso de coincidencia exacta general.

Lista blanca v1, sobre campos reales de schema.ts:

| Entidad | Campos de filtro |
|---|---|
| lead | fullName autorizado por contacto,status,brokerId,projectId,receivedAt,sourceId |
| contacto | fullName,brokerId,createdAt; email/phone solo exacto o nulo |
| negocio | title,stageId,brokerId,projectId vía deal_properties,amountCents+currency,expectedCloseDate,updatedAt |
| proyecto | name,projectType,zone,operationType,isActive,createdAt |
| unidad | projectId,status,bedrooms,currency,publicRangeMinCents/publicRangeMaxCents; realPriceCents solo unit_real_price:view |
| actividad | title,activityType,status,assigneeId,startsAt,createdAt |

Zod strict: {entity,name(1..80),audience(private|internal),groups(0..10),sort(1..3),widgetOrder? solo Inicio}. Cada grupo es regla {field,op,value} tipada por entidad/campo; AND entre reglas, OR en multiselección. Sin anidación/SQL/unknown público.
- IDs positivos: eq/in/not_in; estados/tipos contra catálogo; booleano eq. in/not_in: 1..50 valores homogéneos.
- Texto contains solo nombre/título/zone; eq en identificadores. NULL usa is_null/is_not_null sin value solo en columnas anulables; eq:"" solo donde se admite cadena vacía.
- Dinero between {minCents,maxCents,currency}, enteros decimales no negativos como strings bigint, min≤max, USD/DOP obligatoria.
- Fecha between {from,to} YYYY-MM-DD válida inclusiva; instante SQL [inicio(from),inicio(día posterior a to)) America/Santo_Domingo; expectedCloseDate usa date inclusivo.
- sort: createdAt/updatedAt donde existen; receivedAt lead, name proyecto, code unidad, startsAt actividad, amountCents negocio con moneda fija. dir asc|desc, nulls first|last; siempre ID ASC final.
- Cursor opaco firmado: versión, entidad, hash filtro/orden, actor, tupla completa de orden+ID. 400 si no coincide. Conteo/filas mismo snapshot por petición; sin promesa histórica entre páginas.

Vistas privadas del dueño. Compartir "equipo" P0 es publicar definición operativa por admin a internos autorizados, no crear jerarquía ni ampliar team. No compartir búsqueda de persona/teléfono/email/IDs de cliente ni resultados. Reabrir revalida campo/proyecto y oculta incluso etiqueta de proyecto revocado; externamente no visible.

### 3.4 UI-004 · Avisos/decisiones

/notificaciones y /aprobaciones; campana Sheet con tabs y enlaces a páginas. Filtros: no leídas/críticas/vencidas, estado, tipo, proyecto y solicitante; opciones autorizadas.

Avisos propios: marcar uno/todos, posponer hasta hora futura, agrupar tipo+objeto+destinatario conservando fila/auditoría individual. COUNT total, no solo página. Abrir destino reautoriza; contenido/etiqueta se redactan si pierde acceso. Aviso nunca es permiso.

Decisiones: tipo,motivo,objeto,prioridad normal/alta,vencimiento,responsable,estado,evidencia y antes/propuesto. Aprobar/rechazar con razón; autoaprobación denegada servidor/BD. Dos decisores: un efecto, segundo409 actualizado.

**ApprovalInboxPort es contrato común, sin motor financiero duplicado:**
- commercial: propuestas #47, un nivel, FK a negocio o lead (§5); sin precio real, banco, pago ni reembolso.
- m40: financial_approval_requests nativo, sin espejo ni estados inventados; lectura/detalle financiero con permiso específico. CHECK 0009:191 exige mfa_verified_at real para aprobar: M43 no lo rellena ni rebaja. No ofrece su comando commercial; "Resolver en flujo financiero protegido" con motivo si aún indisponible.
- m47: futuro contrato con FK real a versión de precio; no activar referencia objectType/objectId sin integridad.

Elegibilidad commercial: solicita assistant con permiso base; decide admin activo distinto con recurso:edit:all. Responsable = admins elegibles; solicitante ve propias, otros asistentes/brokers no. M40 usa autorización financiera específica: dashboard/commissions:view no bastan. Evidencia files por evidence_id, solicitante requested_by, prioridad derivada del vencimiento; proyectos por lote→líneas→comisión→acuerdo→negocio→deal_properties, sin duplicar lote.

Delegar atención solo entre admins ya elegibles, intervalo/motivo, revocable sin cadena ni traslado de facultades. Solicitante/delegado nunca se autoaprueba. Posponer aviso no altera vencimiento de decisión.

### 3.5 Móvil, estados y componentes

320/390: una columna, filtros Sheet, tarjetas, controles≥44px; 768/1440 lista/detalle y filtros compactos. Reusar Button/Input/Dialog/Sheet/paleta existentes y docs/DESIGN.md; no atribuir IDs de galería/wireframes aprobados no inspeccionados. D05/D07/D14 verifican composición.

| Estado común en las cuatro pantallas | Conducta |
|---|---|
| Carga | Skeleton/aria-busy; refresco conserva datos de misma identidad y antigüedad |
| Vacío | Explicar ausencia real y acción permitida |
| Error | Español saneado, correlación y reintento; sin error DB/proveedor crudo |
| Sin conexión | Mostrar antigüedad; sin canje, decisión ni mutación optimista en cola |
| Éxito | aria-live, actualización servidor y foco conservado |
| Permiso | 401 acceso,403 recurso,404 objeto ajeno; no filtrar existencia |
| Conflicto/vencido | 409 relee sin repetir efecto; expirado no ejecuta, permite nueva solicitud |

## 4. Funciones (casos de uso)

Zod strict en JSON/query, asignación campo a campo; formato en UI, negocio en aplicación, restricciones BD. Páginas requireScopeInPage; APIs requireActor+requireScope/requireFullScope antes de datos. Auth pública declarada con origen permitido y rate limit centralizado IP/identidad seudonimizada. No logs de credenciales. Lecturas sin outbox; hechos externos con payload mínimo, avisos/auditoría locales en misma transacción, sin red dentro.

| Caso | Entrada→salida / errores | Permiso, regla e idempotencia |
|---|---|---|
| Acceder | email,password→ok;401 genérico/429/503 | Público+proveedor; actor activo aceptado, cookie segura, sin JWT en JSON |
| Invitar/reenviar | userId→enviado/pendiente;404/409/503 | users:create/edit:all; misma identidad; evento users.invited sin OTP |
| Aceptar | email,code;continuación+contraseña→ok;400/410/503 | Público, propósito invite; users bloqueado; pendiente→aceptado una vez |
| Recuperar | email→202;code,newPassword→ok;400/410/429/503 | Público/proveedor; sin reactivación/rol; revocar/auditar saneado |
| Cerrar otras | sin userId→ok/503 | Actor actual; reintento seguro, alcance proveedor |
| Inicio/búsqueda | filtro/cursor tipados→bloques/filas/corte;400/403/503 | dashboard:view+permiso por bloque/entidad; concesión antes de toda salida |
| Vista crear/editar/borrar | definición+expectedVersion→vista/204;400/404/409 | dashboard:view+dueño; publicar admin+settings:edit:all; soft delete/UNIQUE |
| Avisos leer/marcar/posponer | filtros/ids/until→lista/COUNT/ok;400/404 | dashboard:view+user_id actor en SQL; marcado idempotente |
| Proponer | kind,FK,patch,motivo,evidenceId?,commandKey→solicitud;404/409/422 | assistant+recurso base; snapshot servidor; sin efecto inmediato |
| Decidir | publicId,expectedHash,decision,motivo,commandKey→estado;403/404/409/410/422 | admin+base:edit:all, distinto; lock objeto→solicitud; caso fuente/paso/aviso/auditoría atómicos |
| Bandeja | source,estado,tipo,prioridad,proyecto,solicitante,cursor→DTO | Cada fuente con permiso propio; sin fallback permisivo |
| Delegar/revocar | destino,desde,hasta,motivo→delegación/204;400/403/404 | admin ya elegible, sin ampliar permisos |

Objeto ajeno/inexistente=404. commandKey único ligado a actor/tipo/hash de entrada; reutilización distinta409, reintento idéntico devuelve resultado previo. No eventos con secretos ni cuenta bancaria.

## 5. Datos

Diseño propuesto, no migración aplicada. D11 genera migración expansiva nueva y meta; no edita 0007–0009 ni sus guardas. Tablas nuevas: enableRLS, ID interno y public_id UUID único, FK restrict. No reforma de identidades legadas ni tabla de sesiones propia.

### 5.1 Tablas/integridad

| Tabla | Contrato mínimo |
|---|---|
| users existente | invitation_pending bool NOT NULL DEFAULT false conserva cuentas previas; invited_until/invitation_accepted_at timestamptz nullable; CHECK pendiente implica vencimiento. Nuevo invitado pending=true; authUserId único existente |
| notifications existente | enableRLS; snoozed_until,group_key,event_key nullable,priority normal/alta; UNIQUE(user_id,event_key) no nulo para deduplicar aviso de decisión; índice user_id/is_read/snoozed_until/created_at. Agrupar conserva eventos; reautorizar/redactar body |
| saved_views nueva | owner_id FK users,name,entity,audience,definition JSONB v1,version>0,fechas,deleted_at; UNIQUE parcial dueño/entidad/nombre normalizado activo |
| approval_requests nueva | kind cerrado; deal_id FK deals o lead_id FK leads (CHECK exactamente una y correspondencia kind); requester_id FK users,object_hash SHA256,before/proposed JSONB tipados,reason,priority,evidence_id FK files opcional,expires_at,status,decided_by FK users,decided_at,version,command_key UUID UNIQUE,created_at |
| approval_steps nueva | request_id FK restrict,actor_id FK users,decision,motivo,object_hash,created_at; UNIQUE(request_id) una decisión; sin UPDATE/DELETE/TRUNCATE |
| approval_delegations nueva | delegator_id/delegatee_id FK users,starts_at,ends_at,reason,revoked_at,created_at; CHECK distintos y ends_at>starts_at; ambos admins elegibles |

Kinds: deal_amount_change solo amountCents/currency; lead_reassignment solo brokerId de usuario activo. Patch discriminado, no JSON arbitrario. Monto congelado por plan/reserva M40 rechaza409 al proponer/decidir; no tocar precio real/comisión/banco.

Estados comerciales pending→approved/rejected/invalidated/expired. CHECK solicitante≠decisor, razón no vacía, expiración>creación; siete días #47. UNIQUE parcial kind+objeto pendiente. Snapshot inmutable; hash canónico incluye identidad/campos relevantes/updated_at con precisión de BD. Paso/decisión/efecto/aviso/auditoría atómicos y trigger diferido valida correspondencia; vencimiento por reloj sin worker.

**M40:** reutilizar financial_approval_requests con batch_id/entry_id, FKs/evidence_id/content_hash/object_version y estados pendiente/aprobada/rechazada. No copiar filas, fabricar mfa_verified_at ni escribir invalidated. ApprovalInboxPort compone lecturas, cada dominio conserva comando. M47 debe reconciliar su referencia genérica al motor antes de activar precios, con FK real; no se crean referencias huérfanas aquí.

### 5.2 Invalidación/concurrencia

Mecanismo elegido: misma transacción, no evento eventual llamado inmediato. Escritores de deals.amount_cents/currency y leads.broker_id/deleted_at bloquean objeto→solicitudes ID ASC; invalidan otras pending con hash distinto y avisan una vez al solicitante. event_key liga evento/solicitud para deduplicar por destinatario. Decisión relee hash/eligibilidad y aplica por caso fuente dentro de esa unidad de trabajo; excluir solicitud propia de invalidación. Fallo revierte la transacción.

Conectar application/pipeline/casos-de-uso.ts + infrastructure/db/repos/pipeline.ts y application/leads/casos-de-uso.ts + repos/leads.ts (S20b). Trigger de datos o denegación de escritura lateral impide eludir el protocolo mediante SQL externo. No segunda conexión oculta.

Precio/banco financieros: conservar congelación/versionado y guardas de 0009:438–499,595–609. Vigencia efectiva de bandeja compara objeto/hash/vencimiento y excluye obsoletos de accionables; no altera estado nativo. Propuestas comerciales P0 no dependen de precio real/banco. Escritores de futuras aprobaciones de esos tipos se entregan con su capacidad, no un hook vacío ahora.

### 5.3 RLS/privilegios/auditoría

Servidor exclusivo, sin acceso navegador/PostgREST a M43. Rol propuesto crm_m43_app NOLOGIN/NOSUPERUSER/NOBYPASSRLS, sin ser propietario ni heredar propietario. Contexto app.actor_id fijado por backend desde requireActor con set_config(...,true) en misma transacción; ausente=denegar. No confiar en user_metadata, app.is_admin libre, body/cookie de rol. El contexto SQL no protege de servidor comprometido.

Contrato SQL base, después de crear tablas/rol:
    
    REVOKE ALL ON saved_views,approval_requests,approval_steps,
      approval_delegations,notifications FROM PUBLIC,anon,authenticated;
    GRANT SELECT,INSERT,UPDATE ON saved_views,approval_requests,
      approval_delegations,notifications TO crm_m43_app;
    GRANT SELECT,INSERT ON approval_steps TO crm_m43_app;
    REVOKE UPDATE,DELETE,TRUNCATE ON approval_steps FROM crm_m43_app;
    -- USAGE de secuencias solo para inserciones autorizadas.
    -- ENABLE y FORCE ROW LEVEL SECURITY en tablas M43.
    CREATE POLICY avisos_propios ON notifications TO crm_m43_app
      USING (user_id=nullif(current_setting('app.actor_id',true),'')::int)
      WITH CHECK (user_id=nullif(current_setting('app.actor_id',true),'')::int);

Políticas separadas por operación, con SQL final obligatorio en despacho D11:
- Vistas: SELECT dueño o internal+actor interno activo; INSERT dueño=actor; UPDATE dueño conservado; publicar además admin. No DELETE físico.
- Propuestas: SELECT solicitante/admin elegible; INSERT assistant solicitante=actor; UPDATE decisor admin distinto o invalidación por escritor autorizado. Trigger conserva identidad/objeto/snapshot; WITH CHECK evita reasignar solicitante.
- Pasos: SELECT solicitud visible; INSERT admin elegible actor_id=actor distinto de solicitante. Sin políticas UPDATE/DELETE; REVOKE + trigger rechaza UPDATE/DELETE/TRUNCATE. FK restrict protege padre, no DELETE directo de hijo.
- Delegación: participantes/admin leen; admin crea con delegante=actor y destino elegible; solo revoked_at modificable; sin cadenas.

Auditoría: actor,acción,tipo/FK,hash,razón,fecha,correlación en transacción, sin OTP/contraseñas/sesiones/PII innecesaria. audit_log con SELECT/INSERT para escritor, sin UPDATE/DELETE/TRUNCATE y trigger append-only. No prometer protección de superusuario que desactive triggers. Conexión real, políticas SQL finales y grants efectivos NO VERIFICADOS: Q43-02/CA-17, antes de READY de esas slices. RLS no sustituye permisos de aplicación.

### 5.4 Índices/migración

Sustituir wrapper IMMUTABLE por columna normalizada persistida en contacts/projects. Trigger BEFORE INSERT/UPDATE del nombre usa unaccent STABLE y diccionario explícito; GIN/pg_trgm indexa columna, no expresión unaccent. Backfill; cambiar diccionario obliga recomputar columna y reconstruir índice con prueba de paridad. Coincidencias exactas usan normalización canónica e índices existentes; no agregar UNIQUE sin revisar duplicados.

Sin índices por volúmenes inventados. EXPLAIN y acentos/erratas con datos sintéticos. Migración columnas→backfill→restricciones→activación; ensayo base vacía/copia sintética y respaldo por operador antes de entorno con datos. Reversión desactiva rutas conservando hechos; no DOWN destructivo.

## 6. Integraciones y puertos

UI→application→puerto propio→adapter infrastructure. Dominio/aplicación no importan SDK/Drizzle.

| Puerto | Contrato / caída |
|---|---|
| AccesoPort/AdminAuth existente | Contraseña, invitación/OTP, clave, revocación; adapter Supabase. 503 saneado, no fallback de identidad ni sesiones duplicadas |
| InicioPort/agregación M41 | Bloques/listas con corte idéntico; fallo indica indisponibilidad, no cero |
| BusquedaPort/ConcesionesProyectoPort | Autorización/concesión en SQL; M47 dueño de grants; falta=deny |
| VistasPort/AvisosPort | Definición privada/compartida, destinatario; sin escritura offline |
| ApprovalInboxPort | DTO commercial/m40; comando pertenece a fuente, sin espejo |
| UoW/Auditoria/Outbox existentes | Transacción compartida, sin red dentro; doble falso de proveedor en pruebas |

DTO bandeja: source,publicId,type,reason,objectLabel,priority,expiresAt,responsible,status,effectiveStatus,evidenceRef,projectIds,requester,canDecide,unavailableReason. Evidencia por descarga autenticada; sin banco/precio protegido.

Fuentes externas: [plantillas OTP](https://supabase.com/docs/guides/auth/auth-email-templates), [verifyOtp](https://supabase.com/docs/reference/javascript/auth-verifyotp). SMTP/plantillas/entrega/revocación/rol DB NO VERIFICADOS; D16 solo comprueba campos no secretos/booleanos. Changelog.md falló por formato; HTML consultado sin acreditar compatibilidad del entorno. Sin compra/proveedor/despliegue nuevo.

## 7. Métricas y reportes que alimenta

Inicio/M41 comparten definiciones, moneda, corte y listas. Medir latencia por ruta/estado, antigüedad, pendientes/vencidas, búsquedas fallidas sin guardar q/PII.

Escala de referencia: 3–10 internos (#5, decisiones.md:24–27). Volúmenes/concurrencia medidos NO VERIFICADOS; retirar 50 usuarios/20req/s/50.000 registros inventados. Medir p50/p95 antes de SLO/índices. Disponibilidad de fuente: 99.5% mensual pendiente, no SLA ni horario comercial (maestra:6309). Sin purga P0 ni mínimo legal de cinco años/archivo fijo90d; retención por Wilber/D12.

### 7.1 Rebanadas ≤45 min

Estimaciones propuestas, no código autorizado/tiempo medido. D00 despacha después de READY y coordina reservas. Una fila se divide si supera45min. Alias: A=src/application; I=src/infrastructure; P=src/app. Cada unidad incluye prueba indicada y revisión de otro proveedor; D11 serializa schema/migraciones+meta. Rutas nuevas son propuestas.

| Slice / depende | Archivos/resultado delimitado | Prueba/CA |
|---|---|---|
| S01 / — | I/db/schema.ts, drizzle/migración nueva+meta; I/auth/actor.ts: pendiente sin acceso | scripts/test-db/m43-invitaciones.mjs;01/03 |
| S02 / S01 | A/usuarios/puertos.ts,casos-de-uso.ts; I/contenedor/usuarios.ts: envío/reintento | usuarios/casos-de-uso.test.ts;02 |
| S03 / S02 | A/acceso/, I/auth/acceso.ts; P/api/auth/invitacion/verificar y completar/route.ts | A/acceso/invitacion.test.ts;01/02 |
| S04 / S03 | P/acceso/page,formulario.tsx; invitacion/page.tsx; login/page.tsx; organizaciones/page.tsx; api/auth/login/route.ts | e2e/m43-acceso.spec.ts;03/04 |
| S05 / S01 | A/acceso/,I/auth/acceso.ts; P/api/auth/recuperacion y revocar/route.ts | A/acceso/recuperacion.test.ts;04/05 |
| S06 / S05 | P/acceso/recuperar/page.tsx; D16 plantillas proveedor en contrato aparte | e2e/m43-auth-seguro.spec.ts;01/04/05 |
| S07 / — | A/dashboard/consultas.ts,reportes/consultas.ts,metricas-comerciales.ts | A/dashboard/paridad.test.ts;06 |
| S08 / S07 | I/db/repos/dashboard.ts; A/dashboard/puertos,consultas.ts: cola/visitas | scripts/test-db/m43-inicio.mjs;06/07 |
| S09 / S08 + M40 aplicado | mismos archivos S08: cobros/cuotas/inventario/comisiones sin ledger nuevo | mismo script;08/09 |
| S10 / S09 | P/(crm)/inicio/page,vista.tsx; listas fuente vía filtro/corte | e2e/m43-inicio.spec.ts;06..09/18 |
| S11 / — | I/db/schema.ts,drizzle/migración+meta: normalización/índices | scripts/test-db/m43-busqueda.mjs;10 |
| S12 / S11 | A/busqueda/filtros,cursor,consultas.ts | A/busqueda/filtros.test.ts;11/12 |
| S13 / S12 + concesión M47 | I/db/repos/busqueda.ts,concesiones-proyecto.ts | scripts/test-db/m43-busqueda.mjs;10/13 |
| S14 / S12 | I/db/schema.ts,drizzle/migración+meta,I/db/repos/vistas.ts | scripts/test-db/m43-rls.mjs;12/17 |
| S15 / S13,S14 | A/busqueda/vistas.ts; P/api/busqueda y vistas-guardadas/route.ts; I/contenedor/busqueda.ts | A/busqueda/vistas.test.ts;12/13 |
| S16 / S15 | P/(crm)/buscar/page,vista.tsx; _ui/command-palette.tsx | e2e/m43-busqueda.spec.ts;10..13/18 |
| S17 / — | I/db/schema.ts,drizzle/migración+meta; A/avisos/,I/db/repos/avisos.ts | A/avisos/avisos.test.ts;14 |
| S18 / S17 | P/api/notificaciones/route.ts; (crm)/notificaciones/page,vista.tsx y campana delimitada por D00 | e2e/m43-avisos.spec.ts;14/18 |
| S19a / — | I/db/schema.ts,drizzle/migración+meta: propuestas/pasos | scripts/test-db/m43-aprobaciones.mjs;15/17 |
| S19b / S19a | migración nueva: SQL RLS/grants/append-only M43 y audit_log | scripts/test-db/m43-rls.mjs;17 |
| S20a / S19b | A/aprobaciones/,I/db/repos/aprobaciones.ts; UoW de pipeline/leads | A/aprobaciones/decision.test.ts;15 |
| S20b / S20a | A/pipeline y leads/casos-de-uso.ts; I/db/repos/pipeline,leads.ts; migración trigger/privilegios | scripts/test-db/m43-invalidacion.mjs;16 |
| S20c / S19b | A/aprobaciones/delegaciones.ts,I/db/repos/aprobaciones.ts; migración tabla delegaciones | A/aprobaciones/delegaciones.test.ts;15 |
| S21a / S20b,S20c | P/api/aprobaciones/route.ts,[id]/resolucion/route.ts; I/contenedor/aprobaciones.ts | P/api/aprobaciones/route.test.ts;15/16 |
| S21b / S21a + M40 lectura | A/aprobaciones/bandeja.ts,I/db/repos/aprobaciones-financieras-lectura.ts; src/domain/catalogs.ts,db/seed.sql: declarar financial_approvals:view:all solo para admin, recurso propuesto en M40-transaccion.md:558 | A/aprobaciones/bandeja.test.ts;19 |
| S22a / S21b | P/(crm)/aprobaciones/page,vista.tsx | e2e/m43-aprobaciones.spec.ts;15/18/19 |
| S22b / S04,06,10,16,18,22a | D05/D07/D14 capturas y QA; correcciones bajo despacho | CA-18 |
| S23 / todas | D12/D14 aceptación; D00 índice | CA-01..19 |

S13 sin concesión real solo entrega denegación segura: CA-13 y P0 brokers siguen pendientes. S09/S21b requieren M40 aplicado y permiso financiero específico, no solo DDL presente. S06 exige contrato D16 de configuración externa. Ninguna fila habilita producir fuera de reservas/TAREA vigente.

## 8. Criterios de aceptación (verificables)

Criterios futuros para revisor independiente; no afirman ejecución ni aprobación.

1. **CA-01 Tokens:** OTP invite/recovery solo POST; vencido/usado no activa. Ausencia de código en URL/historial/Referer/logs servidor-proxy-CDN-trazas/analítica, incluso errores. Contrato+E2E con código generado en memoria, salida solo booleana.
2. **CA-02 Invitación/fallos:** inyectar error antes/después de envío, enlace authUserId, OTP y commit; reintentar continuación/reenvío/cuenta existente sin duplicar ni dar acceso pendiente. Error persistente ofrece acción administrativa. Dobles+BD.
3. **CA-03 Actor:** admin/assistant/broker aceptados acceden sin AAL2; pendiente/inactivo/borrado denegados por página/RSC/API; cookie rol/branch manipulada no autoriza. Integración.
4. **CA-04 Recovery:** existente/inexistente mismo202/cuerpo; rate limit sin enumerar; no rol/reactivación. Redirecciones sin bucle/open redirect; medir revocación proveedor. Contrato+E2E.
5. **CA-05 Sesiones:** cerrar otras solo identidad actual; fallo no promete éxito; logout limpia memoria/cookies, volver atrás no muestra datos privados. Contrato+E2E.
6. **CA-06 Paridad:** Inicio/M41/detalle con mismos corte/filtros/permisos concilian conteos/sumas; embudo acotado/sin dividir cero. Fixtures de integración.
7. **CA-07 Inicio:** cola/leads sin atender/negocios sin acción/visitas/alertas con registros esperados, actualización y acciones autorizadas; filtros/orden persisten. BD+E2E.
8. **CA-08 Cobros:** reserva100,pago20,reverso5→vendido100/cobrado15, por moneda; sin duplicar joins ni pagos pendientes; cuota refleja aplicaciones/reversos M40. Integración BD.
9. **CA-09 Privacidad:** sin precio real/comisión ajenos ni bloques financieros por dashboard:view; filtros manipulados no amplían acceso en agregado/detalle. API.
10. **CA-10 Búsqueda:** seis categorías; acentos/errata leve; ID/código/slug/teléfono/email exactos autorizados; documentos/KYC/banco excluidos. Backfill/edición/diccionario mantienen normalización; índice sin wrapper IMMUTABLE. BD+EXPLAIN.
11. **CA-11 Gramática:** rechazar campos/tipos/operadores/SQL extra, dinero sin moneda, fechas inválidas y cursor ajeno/cambiado. NULL/vacío/fechas inclusivas y orden+nulos+ID sin perder empates en conjunto estático. Contrato+BD.
12. **CA-12 Vistas:** CRUD propio, ajena404; publicación admin solo definición operativa; reabrir reautoriza/oculta etiquetas revocadas, sin resultados/PII compartidos. API+BD.
13. **CA-13 Grants:** vigente muestra; vencido/revocado oculta resultado/sugerencia/conteo/fragmento/vista aun conservando broker_id. Puerto ausente falla cerrado; revocar entre peticiones. BD M47 real.
14. **CA-14 Avisos:** COUNT>20 correcto, ajeno404, posposición por reloj, agrupación sin perder filas, destino revocado redactado/reautorizado. BD+E2E.
15. **CA-15 Propuestas:** assistant sin efecto; admin distinto decide/motiva una vez; paso/aviso/auditoría atómicos. Dos conexiones con barrera: éxito+409; caduca7d; delegación no amplía facultad. BD/API/E2E.
16. **CA-16 Invalidación:** cada escritor monto/moneda/responsable/borrado invalida y avisa al commit, sin esperar decisión; rollback sin aviso, SQL lateral protegido. Obsoleto/congelado M40 rechaza409. BD/escritores.
17. **CA-17 RLS/auditoría:** migrar base vacía/copia sintética; SELECT/INSERT/UPDATE/DELETE/TRUNCATE con rol efectivo app,anon/authenticated,auditor,propietario ordinario. Contexto vacío/ajeno deniega; append-only por privilegios+trigger, FK solo padre. Salida current_user/booleanos, sin conexión.
18. **CA-18 UX:** cuatro pantallas/seis estados+conflicto; teclado/foco/errores/44px; sin cero falso/respuesta vieja. E2E+D05/D07/D14, capturas320/390/768/1440.
19. **CA-19 M40/M47:** DTO financiero con permiso específico/FK/hash/estado0009, sin espejo, invalidated o MFA ficticio; comando commercial rechaza source financiero/price_list_version. Sin activar precios por aviso. Adapter+BD.

## 9. Fuera de alcance y preguntas abiertas

### 9.1 Evolución

Multiempresa/G12/tenant_id; sucursales; equipos jerárquicos; MFA/AAL2 y factores; saga/worker de invitaciones; firmas avanzadas; cachés públicas de datos privados; funciones P1 completas. Sin workflows multinivel, delegación a no elegibles ni reembolsos/banco desde M43.

UI-004 resuelve propuestas comerciales de un nivel. M40 conserva aprobación financiera con MFA preexistente; su desbloqueo no entra aquí ni se falsea mfa_verified_at. Wilber/D00 ratifican límite entre fichas.

### 9.2 Pendientes y propietarios

| ID / dueño / plazo | Acción / efecto |
|---|---|
| Q43-01 · Wilber/D00 · antes de READY | Ratificar límite comercial/financiero; exigir aprobar finanzas ahora contradice diferir MFA y CHECK0009:191; no decidir excepción aquí |
| Q43-02 · D11/D12 · antes de S19b | Completar SQL de políticas/grants/append-only y probar rol efectivo/audit_log. NO VERIFICADO; enableRLS no acredita aislamiento |
| Q43-03 · M47/D11/D00 · antes de S13 brokers | Entregar concesión/revocación real y reconciliar referencia genérica M47→motor M43; deny no completa P0 broker |
| Q43-04 · D16/D12 · antes de S03/S06 | Probar OTP invite/recovery, cuenta existente/reenvío, revocación; configuración efectiva NO VERIFICADA |
| Q43-05 · Wilber/D12/D11 · antes de purga/SLO | Ratificar retención/disponibilidad/línea base; sin afirmación legal inventada |
| Q43-06 · D00 · integración documental | Añadir M43 REVIEW/revisión al índice; no autorizado editarlo aquí. spec:check enumera ficha, sin --md no lo actualiza |

Solo dos archivos autorizados: esta ficha y reviews/M43-respuesta-R1.md; no escribir reclamo EN-CURSO ni índice. Despacho ya asigna alcance; transferir coordinación a D00. Sin subagentes, migraciones, pruebas de producto, UI, dev/build, commit/push.

### Respuesta a la revisión R1

IDs de M43-revision-R3.md. Corrección es propuesta documental; productor no cierra hallazgos.

| Hallazgo | Respuesta / evidencia y límite |
|---|---|
| R3-01 bloqueante | §3.1 OTP sin secreto en URL/redacción antes de ingesta; recuperación incluida. CA-01/04, plantillas/infra pendientes Q43-04 |
| R3-02 mayor | §3.1 reemplaza saga por pendiente/reintento básico, sin compensación destructiva. usuarios/casos-de-uso.ts:12,146; CA-02, reenvío real pendiente |
| R3-03 bloqueante | §1/3.1 difiere AAL2 por TAREA; actor.ts:29, CA-03; no rebaja CHECK financiero0009:191 |
| R3-04 mayor | §1/2/9.1 difiere sucursal y elimina cookie operativa; team sigue own (rbac-filter.ts:23–39); CA-03/09 |
| R3-05 bloqueante | §3.4/5: puerto de bandeja/fuentes tipadas, FK comercial y M40 nativo sin espejo, evidencia/filtros/elegibilidad. 0009:168–194,301–307; CA-15/19; Q43-01/03 pendientes |
| R3-06 mayor | §5.2/S20b productores transaccionales/defensa BD; no invalidated financiero. 0009:438–499; CA-16/19 |
| R3-07 mayor | §5.3 distingue FK/append-only; contexto/grants/RLS/trigger y prueba efectiva. CA-17, SQL final/rol pendientes Q43-02 |
| R3-08 mayor | §3.2 cola/filtros P0/orden/actualización/drilldown/cobro separado; fuenteUI-002:1045–1055; CA-06..09; sucursal/equipo diferidos |
| R3-09 bloqueante | §3.3/6 concesión antes de toda salida, falla cerrada; CA-13. Dependencia real Q43-03, no integración declarada |
| R3-10 mayor | §3.3 lista blanca/tipos/moneda/fechas/nulos/sort/cursor/exclusión documental; CA-10..12 |
| R3-11 mayor | §7 escala3–10/#5:24–27, objetivo99.5% mensual/maestra:6309; sin capacidad/mínimo legal ficticios; Q43-05 |
| R3-12 mayor | §7.1 dependencias/orden y límite45min; índice transferido Q43-06 por restricción del encargo |
| R3-13 menor | §5.4 columna persistida/trigger STABLE, diccionario/recomputación; CA-10. Migración/EXPLAIN futuros |

### Handoff

D03 Codex produce diseño; no se atribuye colaboración/aprobación D01/D11 no obtenida. Otro proveedor revisa con D11/D12/D14; Wilber arquitectura. Estado REVIEW. D00 actualiza índice; propietarios resuelven Q43-01..06 antes de sus despachos. Resultados reales del verificador en reviews/M43-respuesta-R1.md. Ningún perfil aprueba su propio trabajo.
