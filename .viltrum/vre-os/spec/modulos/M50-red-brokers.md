---
id: M50
nombre: Red de brokers para Quisqueya Home
estado: READY
riesgo: R3
owner: D10
productor: D03
colaboracion: [D01, D11]
revisores: [D12, D14, Wilber]
fuente_de_verdad: PostgreSQL local del CRM
depende_de: [M01, M03, M40, M47]
actualizado: 2026-10-18
tarea: Corrección R1 del despacho D03 20261018T153335Z
---

> **Compuerta D00 (2026-10-18).** Revisión independiente (`reviews/M50-revision-R1.md`, Antigravity) tras el
> recorte a alcance mínimo de una empresa (decisión #51): APROBADO CON CONDICIONES. Las condiciones se resuelven dentro de
> las rebanadas que las tocan. Las rebanadas con esquema se ejecutan en serie con las de M40 (un solo escritor de migraciones).


# M50 · Red de brokers para una empresa

Propuesta documental para revisión independiente; L1, sin aprobación propia ni autorización de construcción. Sustituye el diseño sobredimensionado anterior. Autoridad: decisión #51 (docs/contexto/decisiones.md:348) y TAREA.md del despacho 20261018T153335Z-D03-codex-7e664809e5c241c4a17361a555955afe:5. La fuente maestra clasifica UI-034/035/036/037/039 como P0 y UI-038 como P1 (fuentes/backlog-Pantallas.csv:38). Las referencias relativas a fuentes, reviews y spec parten de .viltrum/vre-os/.

## 1. Propósito y usuarios

**Verbos:** incorporar, acreditar, conceder, consultar, registrar, revisar, suspender, transferir. Una empresa incorpora intermediarios, limita su alcance, protege prospectos y continúa cartera al salir. Agencia es entidad; persona es usuario con membresía. Directorio nunca concede inventario.

Admin gestiona red/salida; ejecutivo revisa expedientes asignados; Legal/Finanzas revisan documentación/balance con permiso explícito; broker externo opera solo su espacio. El asesor interno conserva broker_profiles/rol broker. Los cargos no crean roles. El mapping de §4 es **propuesta pendiente de ratificación Wilber/D01**, previa a activar salida; no se atribuye aprobación comercial.

M50 administra habilitación comercial; M47 inventario/precios; M40 compromisos/finanzas; M01/M03 contactos/leads/negocios. Proveedor de identidad no decide autorización. Mantener topología/motor e identificadores actuales: PostgreSQL, UUID público/entero interno, UTC con presentación America/Santo_Domingo, bigint centavos y USD/DOP separados. Sin decisión irreversible nueva.

## 2. Estado actual (AS-IS)

Lectura estática local 18-oct-2026; base viva, migraciones aplicadas e interfaz **no verificadas**.

| Evidencia | Consecuencia |
|---|---|
| src/infrastructure/db/schema.ts:151, :165, :218, :238, :358 | Existen roles/users/broker_profiles/permissions/agencies. Identidad CRM entera, auth_user_id externa; ampliar agencies, no duplicarla. |
| src/application/brokers/puertos.ts:18; src/app/api/brokers/[id]/proyectos/route.ts:30 | Asignación existente modifica projects.broker_id, no concesiones M:N. Conservar responsable interno. |
| src/application/usuarios/casos-de-uso.ts:44, :129; compartido/admin-auth.ts:11 | Alta/reenvío simple reutilizables, sin tokens públicos M50 propios. |
| src/infrastructure/auth/actor.ts:25, :66 | Consulta users activo/no borrado por petición; falta demostrar salida completa. |
| drizzle/0007_m40_compromisos_reservas.sql:27, :114, :147, :394 | Holds/reservas/comandos reales; holder/atribución histórica inmutables. |
| drizzle/0008_m40_planes_pagos_aplicaciones.sql:193; 0009_m40_comisiones_liquidaciones.sql:63, :87, :233, :375 | Pagos con verificación; comisiones/eventos/líneas restringidos. No evento financiero libre dispute_opened. |
| src/infrastructure/integraciones/outbox/consumidores.ts:41; registro.ts:9; runtime.ts:7; scripts/outbox-worker.mjs:44 | Registro/contexto actual solo CRM; dos efectos de salida requieren nueva inyección/consumidores en mismo runtime. |
| Búsqueda schema.ts y drizzle/*.sql | Sin broker_project_grants/price_list_versions/broker_claims/share_links: son diseño pendiente, no tablas existentes. |

Sin herramientas GitNexus expuestas; lectura de rutas/migraciones concretas por búsqueda local, sin editar símbolos. Código G3 reservado por EN-CURSO.md; este despacho permite solo ficha y respuesta.

## 3. Pantallas P0

**Común a las cinco pantallas:** shell interno /brokers y shell de socios independiente /socios, sin navegación al CRM interno. Usar docs/DESIGN.md y layout compacto D04 (auditoria-2026-10-18/D04-arquitectura-ui.md:253), tabla/inspector/diálogo/formulario existentes; sin nueva librería. Wireframes 390/1440 y capturas corresponden a los cortes UI, aún no verificados.

**Seis estados en cada pantalla:** carga con esqueleto; vacío con causa y CTA autorizado; error traducido/reintento; desconexión con aviso y envío bloqueado; éxito confirmado por servidor; permiso insuficiente 403 (401 sin sesión, 404 objeto ajeno). Cada control explica un bloqueo, marca obligatorios y asocia errores a sus campos. En 320/390: tarjetas, filtros en hoja, formularios por pasos cuando crezcan, foco visible, targets ≥44px y sin desborde. Datos privados con Cache-Control: private, no-store; sin persistencia en navegador/service worker.

### 3.1 UI-034 · Directorio y onboarding

**Rutas:** /brokers y /brokers/:id. Tabs Directorio, Pendientes, Documentos/acuerdos por vencer, Historial. Tabla paginada: agencia/persona, ejecutivo, contacto, jurisdicción, idiomas, estado, convenio/vencimiento. Filtros por agencia, proyecto, estado, vencimiento, idioma y ejecutivo. Datos/contadores desde agencies + membresías + acuerdos filtrados.

**Acciones:** alta/invitación simple, solicitar información con nota persistida, acreditar/rechazar con motivo, asociar miembro, suspender, renovar acuerdo por versión. Reusar Usuarios: si falla correo, mostrar “Invitación pendiente de envío” y reenvío; sin autorregistro ni tokens propios M50. Captura por pasos: identidad/contacto; checklist documental; acuerdo/ejecutivo. Bancos solo referencia enmascarada M40, sin capturarlos aquí.

Acreditado = checklist interno versionado y documento firmado privado con hash, fecha y revisor distinto del solicitante. No certifica licencia/DGII, no exige nombre C4 ni tasa base. Cada persona se acredita explícitamente; aprobar agencia no habilita miembros futuros ni inventario. Móvil: tarjetas/detalle en hoja, revisión con resumen. Vacío distingue filtros de directorio vacío; error junto al adjunto; offline sin revisión/descarga de documentos.

### 3.2 UI-035 · Proyectos y alcance

**Ruta:** /brokers/:id/proyectos. Tabs Activos/futuros, Exclusiones, Historial, Comparar acceso. Matriz de proyecto, etapas/unidades, vigencia, material, lista de precios, regla de comisión y ejecutivo. Beneficiario agencia o persona; mostrar miembros individualmente elegibles.

**Acciones:** conceder, programar vigencia, renovar versión, copiar a borrador con revisión, revocar, excluir etapa/unidad y comparar usando el mismo resolver de socios. Derechos separados read_inventory, register_claim, request_hold, download_marketing; hold inicialmente false. co_broker visible como evolución, no habilitado en P0. Sin copia de cartera.

Alcance = usuario activo + miembro individual acreditado/activo + acuerdo firmado vigente + concesión/derecho/vigencia + objeto permitido. Deny prevalece entre todas las concesiones aplicables. Revocación afecta búsqueda, detalle, exportación, nuevos holds/reservas/enlaces; no cancela historia económica. Filtros activos/futuros/vencidos/suspensiones/exclusiones y beneficiario. Móvil: acordeones/derechos etiquetados/fechas/resumen. Vacío explica falta de inventario; conflicto de versión 409 exige recargar; borrador solo en memoria, no disco.

### 3.3 UI-036 · Espacio privado

**Ruta:** /socios/inicio; accesos Inventario, Registros, Comisiones, sin colaboración activa P0. Control de contexto visible, no modificable: “Quisqueya Home — Una empresa”.

Inicio muestra proyectos concedidos, inventario/precio desde calculados solo sobre unidades autorizadas, claims/vigencias, visitas, material, ejecutivo y comisiones propias M40. /socios/inventario y /socios/comisiones usan DTO sanitizado: sin compradores globales, notas/precios internos, bancos ni splits ajenos. Identidad viene del actor, no del filtro enviado. Precio ausente = “Por confirmar”; hora de consulta y próxima actualización/configuración visibles, sin inventar datos.

**Acciones:** registrar prospecto; pedir confirmación al ejecutivo (activity persistida); solicitar hold mediante M40 con derecho/idempotencia; descargar/enviar kit co-branded con material autorizado y datos consentidos del broker; contactar al ejecutivo desde su ficha. Envío básico por enlace compartible, sin servicio de mensajería nuevo. Filtros proyecto/disponibilidad/tipología/precio/registro vigente/pendientes propios. Móvil: tarjetas y dock con labels. Vacío: bienvenida/contacto ejecutivo. Offline: reconectar, sin inventario/precios cacheados ni confirmaciones locales.

### 3.4 UI-037 · Prospecto y protección

**Rutas:** /socios/registros, /socios/registros/:id y cola interna /brokers/registros. Tabs Pendientes, Protegidos, Conflictos, Historial; filtros proyecto/estado/vencimiento/visitas. Folio, identidad propia mínima, origen, evidencia, recepción y vigencia; sin contraparte.

**Obligatorios:** nombre, al menos teléfono válido o correo válido, proyecto concedido, origen, consentimiento de transferencia y evidencia privada; demanda opcional. El acuerdo versionado fija protection_days obligatorio sin default inventado. Acciones: registrar, completar evidencia, revisar/aprobar/rechazar, pedir extensión con motivo y decisión interna, asociar visita autorizada o solicitarla al ejecutivo.

pending_review con prioridad del servidor; protected solo tras revisión; conflict/rejected/expired/converted auditables. Coincidencia exacta de canal+proyecto conserva ambos expedientes y responde 409 genérico confirmado en transacción (§5.2); no gana el primer importado. Mismo actor/reintento reconoce folio previo; otro proyecto es independiente. “En disputa” P0 es conflicto de claim bajo revisión, sin arbitraje financiero UI-038. El ejecutivo valida consentimiento/vínculo canónico; no buscador global de contactos. Móvil: formulario/adjunto y estado textual; error por campo, conflicto sin PII ajena. Offline: no borrador persistido ni prioridad prometida.

### 3.5 UI-039 · Suspensión, salida y transferencia

**Ruta:** /brokers/:id/salida. Pasos Impacto, Continuidad, Balance, Confirmación/constancia; filtros pendientes/proyecto/obligaciones/recursos. Simulación enumera leads/contactos/negocios abiertos, tareas, claims, holds/reservas, concesiones/enlaces, identidad externa y obligaciones M40. Si no se pueden contar sesiones: “Revocación requerida”, sin cifra inventada.

Suspensión bloquea nuevas operaciones, conserva consulta propia de trámites. Terminación desactiva miembro/usuario externo; sin borrado, cancelación de reservas ni pérdida de comisiones ganadas. Salida de agencia enumera personas incluidas, nunca desactiva usuarios ajenos.

Ejecución exige motivo, destinatarios activos, hash/versiones del plan y confirmación con nombre. Transacción: lock del broker → revalidar cartera → transferir seguimiento → terminar membresía/revocar concesiones y enlaces/inactivar usuario → snapshot/audit → dos eventos outbox. Cartera cambiada = 409 sin cambios; fallo SQL revierte la transacción completa. Mutaciones concurrentes de cartera/concesiones toman el mismo lock antes de escribir/releen habilitación.

Se transfieren leads/contactos/negocios abiertos del plan y activities.assignee_id; cerrados conservan atribución. Claims conservan originador y cambian ejecutivo. Holds conservan holder_id y reservas sus partes/condiciones/pagos; case_assignments transfiere solo seguimiento (§5). Beneficiarios/comisiones no se sobrescriben.

Revocación externa/PDF asíncronos; desde el commit la sesión antigua queda denegada al releer usuario/membresía. Mostrar “Continuidad aplicada; revocación/constancia pendientes” hasta confirmar ambos. PDF = constancia operativa con snapshot/balance fechado, no finiquito legal ni pago supuesto. Sin acceso web residual P0; entrega por canal autorizado. Móvil: pasos/confirmación/resumen con foco. Offline: ejecución bloqueada.

## 4. Funciones y permisos

Mutaciones: actor servidor, Zod estricto/campos explícitos, Idempotency-Key UUID, versión esperada y motivo. Reusar transaction_commands UNIQUE(actor_id,operation,idempotency_key), request_hash normalizado y resultado durable (0007:147; schema.ts:1378). Misma clave/hash repite resultado; distinto contenido 409; concurrencia espera comando único. Revalidar acceso antes de repetir, reconstruir DTO seguro; sin PII en result_code, respetar retain_until. Adaptador traduce IDs públicos.

| Caso / entrada | Permiso servidor | Salida/error y efecto |
|---|---|---|
| Alta/información/asociación: identidad/agencia/checklist/ejecutivo | brokers:create:all o edit:all; users:create:all al provisionar | Folio pendiente; 422 campos/409 email-versión; audit, invitación simple/reenvío |
| Acreditar/renovar: versión, documento firmado, checklist/vigencia | brokers:edit:all, revisor distinto | 422 sin evidencia/409 obsoleto; versión/audit, sin concesión implícita |
| Conceder/copiar/renovar/revocar: beneficiario/proyecto/derechos/scopes/precios/regla/vigencia | brokers:edit:all + projects:edit:all | Versión/borrador; 422 lista ajena/409 duplicada; audit y aviso persistido |
| Consultar socios: filtros/página | broker_portal:view:own + resolver por objeto | DTO privado; 404 objeto ajeno |
| Hold/confirmación/kit: objeto/derecho/versión | broker_portal:create:own + request_hold/download_marketing según caso; confirmación exige pertenencia | Comando M40/activity/enlace; 403 derecho/409 disponibilidad |
| Claim/evidencia/extensión/visita: canales/proyecto/consentimiento/archivos/versión | broker_claims:create:own o edit:own; registrar exige register_claim | Folio o 409 privado persistido/422 campos; audit/evento |
| Revisar/conversión: estado/vigencia/contacto/operación/motivo | brokers:edit:all + asignación, sin autoaprobación | Protección/rechazo/vínculo; 409 conflicto; audit, sin finanzas |
| Simular/suspender/preparar: broker/destinatarios/motivo | brokers:view:all; edit:all al mutar; commissions:view:all para balance | Plan/hash/suspensión; audit |
| Ejecutar salida: plan/hash/versiones/confirmación | brokers:delete:all + users:edit:all y lectura de objetos del plan | Job pendiente; 409 cartera cambió; audit/outbox atómicos |

Catálogo nuevo: broker_portal y broker_claims. Nuevo rol protegido broker_externo: portal view/create own, claims view/create/edit own; ningún permiso interno contacts/deals/projects/commissions/users/roles/settings. Comisiones propias por portal y predicado M40. admin recibe capacidades internas; assistant/broker conservan permisos actuales sin escritura nueva/salida. Revisión exige expediente asignado. Wilber/D01 ratifican delegación: Legal/Finanzas/Director no son slugs sembrados.

Páginas requireScopeInPage; API requireActor + requireScope/requireFullScope antes de datos, también archivos/exportación/detalle. visibleRows/reaches para responsables y resolver central de concesiones para inventario. Salida integra bloqueo/revalidación en rutas de cartera afectadas. Sin autorización desde body/user_metadata.

## 5. Datos y garantías

Contrato propuesto salvo AS-IS §2. D11 genera migraciones aditivas con el siguiente número real, sin reescribir 0007–0009 ni duplicar tablas compartidas. Toda tabla nueva: .enableRLS(), UUID público único, PK/FK internas compatibles, UTC, autores y row_version cuando mutable. Historia/evidencia con FK RESTRICT.

### 5.1 Entidades P0

| Entidad | Campos y restricciones mínimas |
|---|---|
| agencies existente | Ampliar contacto/jurisdicción/idiomas/estado/ejecutivo, conservar IDs. Agencia no es usuario ni concede acceso. |
| broker_memberships | user_id, agency_id nullable (independiente), status pending/active/suspended/terminated, documento/checklist, reviewed_by/at, account_manager_id, vigencia, versión. Una membresía actual por persona; historial durable. Activación individual explícita. |
| partner_agreements | Beneficiario agencia XOR user, version, valid_from/to, document_id FK files, hash, protection_days >0, checklist/política, revisor/fecha, status draft/active/superseded/revoked. Activar exige firma documental y revisión completa, distinta del solicitante. Renovar crea versión; activo inmutable. Sin C4/tasa obligatoria. |
| broker_project_grants compartida M47 | project_id, broker_id XOR agency_id, version, status active/suspended/revoked/superseded, valid_from/to, rights, price_list_version_id, commission_rule_version_id, ejecutivo/material. Índices únicos parciales (broker_id,project_id) y (agency_id,project_id) WHERE status='active', sin version en clave. Identidad/términos activos inmutables. |
| grant_scopes | grant_id/project_id, phase_id XOR unit_id, effect allow/deny; DB comprueba pertenencia de padre/objeto al proyecto. Sin allow específico cubre proyecto; con allow limita al conjunto; deny resta entre todas las concesiones aplicables. |
| broker_claims | broker_id originador, ejecutivo, proyecto/acuerdo/version, nombre/canales normalizados, origen, consentimiento/evidencia, prioridad servidor, status, protected_until, competing_claim_id privado, contact_id/deal_id/reservation_id con FK. Al menos un canal; converted exige contacto + negocio o reserva coherentes. |
| claim_evidence / claim_events | claim_id FK RESTRICT, archivo/actor/hora/tipo/motivo. Append-only; corrección añade versión. Extensión = solicitud/decisión; visita FK activities validada por contacto/proyecto. Solo comandos internos cambian estados de revisión. |
| case_assignments | hold_id XOR reservation_id FK RESTRICT, responsible_user_id, version, status active/superseded, job_id/motivo. Una asignación activa por caso; delega seguimiento sin cambiar titular económico. |
| share_links canónica nueva | UUID, token_hash único, issuer_id, grant_id/version, proyecto/unidad opcional/material, expires_at/revoked_at. Sin token persistido en claro ni PII comprador. Cada uso revalida alcance/usuario. Si otro módulo la crea primero, ampliar la misma. |
| reassignment_jobs | broker/ejecutor, command_id único, plan/snapshot/hash/destinatarios, estado local aplicado, estados de efectos, archivo/hash de constancia. Una terminación por membresía; efectos repetidos no transfieren otra vez. |

valid_from < valid_to; comprobar reloj en cada petición, no confiar en cron. Una concesión futura active sustituye explícitamente a la anterior; advertir al usuario el intervalo sin acceso. Nunca dos versiones active para el mismo beneficiario/proyecto.

**M47:** FK (price_list_version_id,project_id) → price_list_versions(id,project_id), prevista en M47:601, aún no implementada. Regla de comisión: FK a commission_rule_versions → commission_rules; project_id coincidente o NULL (general), vigencia/moneda compatibles. Activar tras construir dependencia. M47:908 propone hold true: **contradicción pendiente D00/D11 fuera de este despacho**. Aquí rights es autoritativo; can_request_holds compatibilidad derivada de request_hold, DEFAULT false + CHECK equivalencia. Omitir ambos no concede hold; max_active_holds desde CFG-054 obligatoria, sin literal 3. Integración exige migración compartida/prueba del default.

### 5.2 Claims: identidad y concurrencia

Normalizador único: teléfono E.164, correo recortado/minúsculas; al menos uno válido. Lock transaccional por proyecto y cada canal presente, en orden estable, sin clave NULL. Bajo locks, expirar protecciones vencidas antes de decidir y capturar prioridad con reloj de servidor. Actor/estado/revisor/prioridad nunca vienen del body.

Coincidencia exacta por cualquiera de los canales reúne expedientes para revisión; no fusionar por nombre ni proteger automáticamente al primero. Índices únicos parciales por proyecto/teléfono y proyecto/correo WHERE status='protected' (canales no nulos) impiden duplicados. Aprobar usa los mismos locks y comprueba pendientes/conflictos/evidencia: no dos protecciones incompatibles. Canales distintos sin coincidencia no demuestran identidad común; revisión humana sin consulta global expuesta.

Mismo actor/proyecto/canal vigente devuelve folio existente, incluso con otra clave. Idempotency-Key/hash conserva resultado/prioridad. Conflicto confirma ambos expedientes/evidencias y resultado 409 en la transacción; responder después del commit, sin excepción que lo revierta.

Validar consentimiento antes de enlazar/crear contacto canónico mediante operación interna autorizada M01 y actualizar claim atómicamente. converted exige operación real del mismo contacto/proyecto. No duplicar contacto ni exponer competing_claim_id o referencias/PII ajenas en DTO. Transferencia conserva broker originador, cambia ejecutivo.

### 5.3 Autorización y conservación

Único modelo: servidor media negocio. Sin roles SQL ficticios authenticated_staff/authenticated_broker, SET LOCAL de identidad ni helpers SECURITY DEFINER. Tablas nuevas con RLS, revocación de tablas/secuencias a PUBLIC/anon/authenticated y sin políticas de DML cliente. Data API no inserta claims ni aprueba estados.

La conexión privada existente no conoce al actor por auth.uid(): el servidor revalida permiso/membresía/concesión/derecho/deny/responsable dentro de la transacción. Triggers protegen transiciones y activación con evidencia; no se presenta RLS como aislamiento de actores de la conexión privilegiada. D12 prueba cliente SQL denegado y API legítima/hostil.

KYC/claims: autor o revisor asignado con permiso, sin comodín staff/agencia; las descargas aplican el mismo predicado. Bucket privado, no-store, revalidación por solicitud, sin URL duradera que eluda revocación; MIME/tamaño del catálogo, nombre servidor, sin HTML ni URL externa suministrada por cliente.

Sin DELETE/TRUNCATE ordinario de claims/evidencia/acuerdos/jobs/historia: privilegios y triggers, FK RESTRICT y protección de archivos en papelera genérica. Archivo lógico con motivo; corrección append-only. No purga automática hasta política Legal; legal hold bloquea purga futura. Auditoría: actor, acción, motivo, versiones/snapshot protegido y correlation_id; sin PII en logs operativos. Ampliar catálogo tipado de entidades.

### 5.4 Contrato físico M40

| Objeto real | Contrato P0 de lectura/preservación |
|---|---|
| holds.holder_id/deal_id; reservations.deal_id; reservation_parties | Seguimiento por case_assignments, no cambiar holder/autoría/partes (0007:416, :430). No existe reservations.broker_id. |
| commission_entries agreement_id/split_id/gross_cents/status/row_version | Estados esperada/devengada/aprobada/exigible/pagada/retirada (0009:83). Beneficiario por JOIN commission_splits, no columna de entry. |
| commission_splits beneficiary_user_id/beneficiary_agency_id | Filtrar obligación propia; membresía no permite ver comisiones de toda agencia. No reasignar beneficiario al salir. |
| payout_lines gross_cents/withholding_cents/adjustment_cents/net_cents/status/row_version | net = gross − withholding + adjustment (firmado); estados activa/instruida/desconocida/conciliada/cancelada. Sin paid/unpaid ni settled_amount_cents. |
| payout_batches status/row_version | Mostrar lote vinculado, no instruir/retener/liquidar; desconocida no equivale a pago confirmado. |
| commission_events / commission_adjustments | Inmutables, transiciones/compensaciones restringidas (0009:104, :416, :445, :476). Sin evento dispute_opened ni UPDATE de importes de payout_lines desde M50. |
| payments/aplicaciones de 0008 | Intactos; salida no confirma ni revierte pagos/reservas. |

Resumen por moneda/estado; distinguir proyección, derecho devengado y conciliación. No calcular “saldo disputable” sobre campos inexistentes. Disputa/retención = evolución UI-038, requiere otro contrato D11/D12 compatible con guardas reales. No se añade MFA/AAL2 a M50 ni se debilitan controles financieros existentes.

## 6. Integraciones y puertos

Monolito modular: HTTP → aplicación → puertos → adaptadores, sin ciclos ni proveedor en dominio. Puertos/casos en application/brokers, reglas puras en domain, repos/composición en infrastructure. Reusar UnidadDeTrabajo/Auditoria; SQL falla = rollback. Dobles prueban reglas; DB prueba locks/constraints.

Puertos: RepositorioRed (habilitación), AccesoBroker (resolver único), operaciones autorizadas M01/M03/M40 (vínculos canónicos/hold), ObligacionesBroker (lectura §5.4), AdminAuth existente (invitación), SesionesBroker (revocación), ConstanciaSalida (snapshot/PDF/Almacenamiento privado) y NormalizadorContacto (identidad de canal). Fallo identidad/PDF no reactiva usuario ni revierte cartera: deja efecto pendiente. Normalización reutilizada; posible libphonenumber-js encapsulado según propuesta D21, sin decidir atribución.

**Un solo outbox:** registrar broker.session_revoke y broker.generate_exit_certificate v1 en infrastructure/integraciones/outbox/consumidores.ts. Ampliar ContextoConsumo de registro.ts con puertos de salida e inyectarlos en runtime.ts. Scheduler único scripts/outbox-worker.mjs; procesarOutbox solo reclama tipos registrados. No basta encolar.

Eventos con aggregateId=jobId y payload mínimo jobPublicId, versión/correlationId/idempotencyKey; sin PII/JWT/credenciales. Unicidad job/tipo/versión. Consumidor relee job: revocar ya revocado = éxito; PDF determinista por snapshot/hash, unicidad job/tipo y misma referencia. Persistir efecto y ResultadoConsumo compatible antes de enviado; caída entre efecto y marcado repite sin duplicación. Política existente de reintento/clasificación/DLQ, estado visible y reparación acotada. Ambos confirmados para completar salida externa.

Cambio de concesión guarda notificación interna; sin correo/WhatsApp automático nuevo ni evento sin consumidor. D21 es investigación/propuesta (auditoria-2026-10-18/D21-ensamblaje-oss.md:5), no instalación/licencia acreditada; D12 verifica artefacto antes de añadir dependencia.

## 7. Métricas y construcción

Consultas filtradas: miembros por estado, concesiones vigentes, claims/vencimientos, recepción→decisión, casos transferidos, efectos pendientes y obligaciones por beneficiario/moneda/estado. Sin cifras fijas ni sumar USD+DOP.

Supuestos heredados **no ratificados/medidos**: 50 agencias, 300 brokers, 1.500 claims/mes, pico 25 transacciones/s; p95 inventario <200ms, claims <150ms, directorio <180ms/página 50. D01/D15 deben validarlos. Implican paginación/índices por beneficiario/proyecto/canal/estado/fecha y locks acotados; sin Redis/cache/servicio nuevo. Disponibilidad 99,5% y revisión 48h eran propuestas sin aprobación, no compromisos ni disparadores automáticos. Retención por Legal.

### 7.1 Rebanadas propuestas ≤45 min

D00 despacha tras READY independiente, archivos exactos/liberación G3. Topes estimados, no mediciones; dividir antes de despachar si no cabe. Cada corte incluye evidencia y revisión D14 distinta del productor.

| Corte / minutos | Entrega y dependencia | CA |
|---|---|---|
| a1 / 30 | Ratificar mapping/checklist/acuerdo; confirmar M47/M40 | 01–03 |
| a2 / 45 | agencies + membresías, backfill sin permisos | 01 |
| a3 / 45 | Acuerdos/evidencia/constraints de acreditación | 01,09 |
| a4 / 30 | Rol externo/catálogos/seed/guardas shell | 02 |
| a5 / 45 | Alta/invitación/revisión con dobles, reusar Usuarios | 01,02 |
| a6 / 45 | UI-034 directorio/filtros/inspector | 01,12 |
| a7 / 45 | UI-034 acciones/documentos/renovación/estados | 01,09,12 |
| b1 / 45 | Tras M47: concesiones/FK/únicos/defaults | 03 |
| b2 / 45 | Scopes/deny/constraints de pertenencia | 03,04 |
| b3 / 45 | Resolver efectivo/dobles/predicados integrados | 03,04 |
| b4 / 45 | UI-035 acciones/copia/vigencia/comparación | 03,12 |
| c1 / 45 | DTO socios/métricas/comisión propia por split | 04,10 |
| c2 / 45 | UI-036 shell/contexto/inicio/filtros/visitas | 04,12 |
| c3 / 45 | Tras M40: autorización→hold e idempotencia | 04,11 |
| c4 / 45 | Kit/enlaces/descarga/revocación por concesión | 04,09 |
| d1 / 45 | Claims/evidencia/eventos/constraints sin API | 05,06,09 |
| d2 / 45 | Comando/locks/colisión/409 durable | 05,06 |
| d3 / 45 | Revisión/vínculos/extensión/visita | 06,07 |
| d4 / 45 | UI-037 registro/estado/adjuntos/errores | 05,12 |
| d5 / 45 | Cola interna revisión/conflicto/conversión | 06,07 |
| e1 / 45 | case_assignments/jobs/simulación/balance real | 08,10 |
| e2 / 45 | Locks comunes/revalidación en cartera | 08,11 |
| e3 / 45 | Transferencia SQL/desactivación/audit/outbox | 08,10,11 |
| e4 / 45 | Revocación: puerto/adaptador/registro/inyección | 11 |
| e5 / 45 | Constancia: snapshot/PDF/idempotencia/consumidor | 11 |
| e6 / 45 | UI-039 pasos/efectos/confirmación/constancia | 08,11,12 |
| q1 / 45 | D14: DB claims/concesiones/archivo/reintentos | 03,05,06,09 |
| q2 / 45 | D14: rollback/concurrencia/worker con dobles | 08,10,11 |
| q3 / 45 | D14/D07: recorrido/estados/teclado 320/390 | 12 |
| q4 / 45 | D14: 768/1440 + revisión D12 del diff | 02,04,09,12 |

b1/c1/c3 dependen de listas de precios/consultas/comandos M47/M40 implementados: DDL no acredita casos de uso. D00 programa primero los cortes de sus fichas dueñas, sin stubs. Expansión/backfill conservador/activación tras pruebas; no convertir projects.broker_id en concesión externa automáticamente. Reversión desactiva superficie/consumidores nuevos, preserva historia y corrige hacia delante; sin DOWN destructivo. Este despacho no migra ni despliega.

## 8. Criterios de aceptación verificables

Oráculos futuros, no resultados ejecutados. Revisor distinto del productor debe aportar comando/salida y evidencia.

1. **CA-M50-01 · Acreditación (contrato/DB/UI).** Alta, fallo/reenvío de invitación, información, rechazo y renovación persisten sin duplicar usuario. Sin checklist/documento firmado o con autoaprobación no se activa miembro/agencia. Aprobar agencia no habilita personas futuras ni inventario.
2. **CA-M50-02 · Autoridad (HTTP).** Probar admin, assistant, broker y broker_externo. Sin permiso explícito 403, objeto ajeno 404; externo no accede CRM interno. Cargo/user_metadata/body no conceden autoridad. Salida exige facultades ratificadas.
3. **CA-M50-03 · Concesiones (DB/contrato).** Rechazar lista/etapa/unidad de otro proyecto, dos versiones active y desfase rights/hold. Omitir hold = false/403. Probar vigencias, suspensión, deny individual/de agencia, copia revisada, renovación histórica y aviso persistido.
4. **CA-M50-04 · Alcance (HTTP/E2E).** Un proyecto concedido produce idéntico conjunto en inicio, búsqueda, detalle, móvil, exportación, hold y links; precio/conteo derivan de él. Revocar etapa bloquea nuevas reservas/holds y enlaces antiguos. Confirmación/visita/contacto/kit funcionan sin PII ni precios internos ajenos.
5. **CA-M50-05 · Claim hostil/reintento (DB/HTTP).** anon/authenticated no leen ni hacen DML privado; API permite solo correo o solo teléfono con evidencia/consentimiento; sin canal 422. Rechazar protected/prioridad/reviewer manipulados, proyecto no concedido y deny. Doble envío mismo actor/clave crea un comando/folio/prioridad; hash distinto 409; nueva clave reconoce claim vigente del mismo actor.
6. **CA-M50-06 · Competencia (dos conexiones PostgreSQL).** Mismo canal/proyecto entre brokers conserva expedientes/evidencias y 409 privado durable/repetible. Probar ambos canales y coincidencia por uno cuando se aportan dos. Dos aprobaciones no crean protecciones incompatibles; doble en memoria no basta.
7. **CA-M50-07 · Conversión (contrato/DB).** Consentimiento aprobado enlaza/crea contacto canónico autorizado sin duplicación. converted sin contacto/operación válida o con proyecto ajeno falla. Extensión requiere decisión, visita debe pertenecer al expediente. Referencias persisten al transferir, sin revelar contactos ajenos.
8. **CA-M50-08 · Continuidad (DB).** Reasignar seguimiento, tareas y cases; preservar originador/holder/partes. Mutación concurrente invalida hash o queda serializada sin huérfanos. Inyectar fallo en cada fase: cartera, membresía, grants, links, usuario, job, comando, audit y outbox quedan sin cambios.
9. **CA-M50-09 · Evidencia (DB/HTTP).** Autor/revisor asignado acceden; otro broker o staff no asignado no, también al descargar. DELETE/TRUNCATE/papelera no borran historia ni adjuntos. Archivo lógico/legal hold preservan evidencia; corrección añade versión. Sin persistencia privada en navegador ni caché pública.
10. **CA-M50-10 · M40 (contrato/DB 0007–0009).** Balance usa entry→split, statuses reales, moneda y gross−withholding+adjustment. Comparar huellas antes/después: pagos/aplicaciones/reservas/partes/comisiones/splits/eventos/líneas intactos. No UPDATE holder_id ni importes de payout_lines ni evento financiero inventado; continuidad por case_assignments.
11. **CA-M50-11 · Salida completa (integración).** Pasar por scripts/outbox-worker.mjs/runtime con puertos falsos: registrar/reclamar ambos tipos, éxito, fallos antes/después del efecto, reintento, DLQ y duplicado; una constancia/transferencia. Sin consumidor no activar salida. Con revocador caído, sesión antigua no crea hold ni lee inventario; mostrar pendiente hasta éxito. Enlaces quedan revocados, comisiones ganadas preservadas.
12. **CA-M50-12 · UX (E2E/capturas 320/390/768/1440).** Recorrer las cinco pantallas con seis estados, filtros, formularios, confirmaciones, teclado/foco/labels/targets ≥44px, sin desborde. Contexto fijo visible; offline bloquea escrituras sin persistir PII/evidencia/precios. Sin controles ni números simulados.

## 9. Fuera de alcance y preguntas abiertas

### 9.1 Evolución

**Todas las funciones P1**, incluida UI-038 completa (fuentes/backlog-Pantallas.csv:42): colaboración, partes/splits versionados, firmas del co-broker, disputas financieras, árbitro/laudo/apelación, retenciones/compensaciones. Sin tablas/rutas/permisos activos de collaboration_deals, collaboration_parties, broker_disputes ni dispute_events en estos cortes. Conflicto de claim P0 no escribe ledger.

También: multiempresa/tenant_id, sucursales, MFA/AAL2 nuevo, invitaciones complejas/tokens públicos propios, cachés públicas/offline privado, firmas avanzadas, perfiles públicos, rankings, exportación masiva de directorio, SLA automático/fuzzy matching y acceso residual web después de salir. Kit/enlace y exportación de inventario P0 conservan autorización por solicitud.

Al retomar UI-038: acceso por versión actual e histórico separado; evidencia confidencial **solo al revisor designado**, sin staff global; escrituras mediadas con pruebas positivas; acuerdo/partes inmutables tras aceptación de términos completos y suma de splits verificada al activar/cambiar versión. Contrato financiero nuevo debe respetar 0009, versiones, signos, aprobaciones y líneas inmutables. El SQL defectuoso anterior no sigue como receta.

### 9.2 Ratificaciones/dependencias

| Pendiente | Responsable/efecto |
|---|---|
| Checklist, acuerdo firmado y protección CFG-043/048/049 | D01/Wilber/Legal ratifican contenido. protection_days/documentos obligatorios antes de activar acuerdo; sin default C4/tasa/plazo inventado. |
| Autoridad de salida/revisión (Q-M50-10) | Wilber/D01 ratifican §4/designan usuarios antes de ejecución irreversible. Cargos no equivalen a slugs sembrados. |
| M47/M40 | D00/D11 sincronizan concesiones/default hold/listas y disponibilidad de consultas/comandos antes de b1/c1/c3. DDL no demuestra API. Cambios fuera del despacho. |
| Retención/PII/legal hold (Q-M50-08) | Legal/D12 deciden antes de purga; plazos legales previos **no verificados**, retirados como afirmación. |
| Volumen/SLO/SLA (Q-M50-07/09) | D01/D15 validan supuestos §7; sin escalamiento automático ni infraestructura adicional. |
| Etiqueta hold ajeno | D01/D04 en M47; disponibilidad sin identidad ni acceso al expediente. |
| Revisión | Otro proveedor + ratificación humana R3. spec:check solo comprueba estructura. |

### 9.3 Respuesta a la revisión R1

17 hallazgos de reviews/M50-revision-R3.md:13–147. Corrección documental, no cierre de pruebas ni aprobación.

| Hallazgo R3 | Respuesta R1 / evidencia |
|---|---|
| 01 · Claim hostil | Sin DML cliente; servidor verifica register_claim/deny, fija estado/prioridad. §4, §5.2–5.3, CA-05/06. |
| 02 · Participante histórico | UI-038 P1 → §9.1; retirado helper defectuoso. Evolución exige permiso por versión/histórico separado. |
| 03 · Staff/evidencia | UI-038 diferida; solo revisor designado en §9.1. Claim P0 autor/revisor asignado, también descarga (§5.3/CA-09). |
| 04 · Escritura co-broker | Promesa/GRANT incompletos retirados con UI-038. Evolución mediada y prueba positiva; claim P0 sí tiene permiso/camino positivo §4/CA-05. |
| 05 · Firma/inmutabilidad | UI-038/firma avanzada diferidas; sin SQL vulnerable. Acreditación P0 exige evidencia documental firmada revisada (§3.1/§5.1). |
| 06 · Contrato M40 | Disputa fuera P0. §5.4 corrige campos/joins/estados/fórmula/guardas reales 0007–0009; solo lectura/preservación, CA-10. |
| 07 · Outbox sin consumidores | Ausencia declarada §2; §6 fija registro/contexto/inyección/runtime único; e4/e5 y CA-11 prueban éxito/fallo/duplicado antes de activar. |
| 08 · Lista/versiones | FK compuesta y únicos por beneficiario sin version en clave, §5.1/CA-03. M47 sigue dependencia, no instalación supuesta. |
| 09 · Default hold | rights autoritativo; compatibilidad false + CHECK, §5.1/CA-03. Divergencia M47:908 pendiente D00/D11 antes de activar. |
| 10 · Identidad/reintento | Un canal mínimo, locks ordenados/no NULL, comando idempotente/mismo actor reconoce folio; §3.4/§4/§5.2, CA-05/06. |
| 11 · Borrado de evidencia | RESTRICT, sin DELETE/TRUNCATE/papelera destructiva, archivo/hold; §5.3/CA-09. Retención Legal pendiente. |
| 12 · Firma/C4 | Documento/hash/revisión obligatorios; sin C4 ni tasa impuesta. §3.1/§5.1, CA-01; términos por ratificar §9.2. |
| 13 · Roles inexistentes | §1/§4 mapean permisos a admin existente/delegación explícita. Sin facultad por cargo ni escritura nueva assistant/broker; ratificar antes de salida. |
| 14 · Offline privado | Sin persistencia; no-store/sin service worker privado, escritura online. §3/§5.3, CA-09/12. |
| 15 · Token no atómico | Tokens propios → evolución. P0 reutiliza Usuarios (casos-de-uso.ts:44, :129), sin broker_invitations/ruta pública nueva; CA-01 prueba reenvío sin duplicar usuario. |
| 16 · Conversión huérfana | contact_id + deal_id/reservation_id válidos/auditados, §5.1–5.2/CA-07; sin descubrimiento de contactos ajenos. |
| 17 · Contexto invisible | Control fijo visible “Quisqueya Home”, explicación de una empresa, §3.3/CA-12. |

## Handoff

D03 entrega REVIEW. Revisor de otro proveedor: evaluar cinco pantallas P0, permisos/claims, continuidad compatible con M40, consumidores reales y dependencias. D12 revisa autorización/descargas/retención; D11 confirma M47 y case_assignments; D14 ejecutará criterios tras implementación. Wilber/D01 ratifican facultades/términos; D00 sincroniza archivos ajenos antes de READY y despacha cortes ≤45 min. Sin gate/issue/capacidad aprobada por este productor. Comandos/tamaño/límites en reviews/M50-respuesta-R1.md.
