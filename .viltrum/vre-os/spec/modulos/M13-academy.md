---
id: M13
contract_id: C1:M10
nombre: Quisqueya Academy
estado: DRAFT
riesgo: R3
owner: D03
revisores: [D11, D12, D14, D07]
fuente_de_verdad: PostgreSQL local para identidad, autorizaciones y certificacion; LMS solo para evidencia educativa
depende_de: [I02, G04, G05, G10]
actualizado: 2026-10-04
---

# Spec M13 · Academy (C1 M10)

**Nivel L1, propuesta para revisión; ningún código queda autorizado por esta ficha.** `M13` es el identificador del Spec Pack; el módulo **M10 del contrato C1** es Academy. `C1:M13` designa auditoría, no Academy. Fuentes: `.viltrum/commercial.md` §1, `.viltrum/questions.md` Q-C1-03 (respuesta humana: **curso aprobado por administrador**), inventario P0 `inventario/crm-as-is.md` y `inventario/crm-mapa-modulos.md` §M13, e integración `integraciones/I02-moodle.md`. Los detalles aquí propuestos requieren revisión D11/D12/D14 y no equivalen a un acuerdo humano nuevo.

## 1. Propósito, actores y límites

Academy permite que un broker complete formación y que un administrador decida explícitamente si aprueba su curso para emitir una **constancia CRM verificable por broker, curso y versión**. La evidencia educativa (progreso, finalización, nota, intento o quiz) puede venir de Moodle; el acto de aprobación y el estado de la constancia pertenecen al CRM. Ninguna regla calcula `certificado=true` a partir de un porcentaje, checklist, calificación o evento del LMS. Un certificado PDF/plugin de Moodle no sustituye la decisión local.

| Actor | Trabajo | Límite propuesto |
|---|---|---|
| Broker activo | Ver sus cursos, abrir formación asignada, consultar su evidencia, solicitar revisión y ver su constancia | Solo expediente propio; nunca decide ni revoca. |
| Administrador activo | Asignar curso, revisar evidencia, aprobar/rechazar/revocar con motivo y consultar cola | Verificación de rol Admin **y** `requireFullScope` en servidor; se requiere permiso de decisión dedicado, separado de `academy:view`. |
| Asistente | Ver catálogo y datos que autorice su alcance | Sin decisión ni consulta de expediente ajeno por defecto; D12/D03 validarán necesidad de lectura delegada. |
| LMS/Moodle | Servir curso y reportar evidencia educativa | No firma decisiones comerciales ni eleva permisos CRM. |

El usuario pidió trabajar localmente: sin nube, VPS, push ni datos reales enviados al LMS antes de resolver Q-C1-05 y revisión de D12. C1 no obliga a SCORM, LTI, SSO, ranking, gamificación, PDF firmado ni vigencia automática; esas variantes quedan fuera del primer corte.

## 2. AS-IS verificable y brecha

- `/academy` presenta contenido/checklist y progreso desde PostgreSQL mediante `src/app/(crm)/academy/page.tsx:17`, `src/application/academy/consultas.ts:11` y `src/infrastructure/db/repos/academy.ts`. El inventario P0 registra **cero filas** locales en `academy_items` y `academy_progress`; no acredita contenido ni flujo de certificación reales.
- El resumen `ResumenProgresoAcademy.isCertified` existe en `src/application/academy/puertos.ts:30`. `src/infrastructure/db/repos/academy.ts` deriva `isCertified` de `completedItems >= totalItems`; `src/application/academy/en-memoria.ts:202` lo deriva de `percent === 100`; la vista vuelve a calcularlo en `src/app/(crm)/academy/vista.tsx:89-99` y muestra «Broker Certificado» en `:499-524`. `src/application/academy/casos-de-uso.test.ts:83-95` codifica esa regla antigua. **Debe tratarse como defecto contractual, no como certificado heredado.**
- Las escrituras actuales `/api/academy/[id]/progreso` y `/api/academy/checklist/[id]` solo requieren `academy:view` (`route.ts:23` y `route.ts:22` respectivamente) y operan sobre `actor.userId`; no hay caso de aprobación, revocación, tabla de decisiones ni ruta de constancia. Los tipos `session|checklist|material` son contenidos locales, no equivalen necesariamente a un curso LMS.
- `I02-moodle.md` es DRAFT y Moodle no está conectado. Los wireframes exploratorios de `D05-ux-modulos-B.md` §3 suponen certificado al completar curso y ranking; **esa animación y esa regla se sustituyen por estados de revisión/aprobación**, y el ranking no se acepta por defecto.

## 3. Modelo de decisión y transiciones

La unidad de decisión propuesta es `(broker_id, programa_id, version_programa)`, independiente de los `academy_items` antiguos. Para el primer corte, **una aprobación Admin explícita por curso y versión** genera una constancia CRM. Un indicador global «Broker Certificado» requiere que D02 defina un programa obligatorio/versionado; hasta entonces la UI muestra constancias por curso y nunca el badge global basado en 100% de contenidos.

| Estado de revisión | Entrada | Salida permitida | Invariante |
|---|---|---|---|
| `sin_asignar` | No hay asignación CRM | Admin asigna → `en_curso` | Sin acceso al lanzamiento ni solicitud. |
| `en_curso` | Asignación activa | Broker solicita revisión → `pendiente`; Admin retira asignación → acceso suspendido | Progreso no altera la decisión. |
| `pendiente` | Solicitud con evidencia referenciada | Admin aprueba → `aprobado` solo si cumple S2; rechaza → `rechazado` | Evidencia incompleta/UNKNOWN permanece pendiente o se rechaza; nunca habilita aprobación. |
| `rechazado` | Decisión Admin motivada | Nueva solicitud → `pendiente` | Conservar cada intento y motivo; sin constancia vigente. |
| `aprobado` | Decisión Admin persistida | Admin revoca → `revocado` | Constancia vigente solo con decisión no revocada y autorización actual; no puede crearse por reconciliación Moodle. |
| `revocado` | Decisión Admin motivada | Nueva solicitud → `pendiente` sobre nuevo intento/version | La constancia anterior sigue consultable como revocada, no válida. |

**S1 · Separación de funciones:** el actor Admin no puede aprobar, rechazar ni revocar un expediente cuyo `broker_user_id` sea su propio `actor.userId`, aunque tenga permisos administrativos. Se compara el ID de usuario vinculado al broker en la misma transacción, nunca email o texto de rol. Decidir exige recurso dedicado `academy_certification` y acción dedicada `approve`, `reject` o `revoke` con alcance `all` más rol Admin activo; `academy:view` y `academy:edit` nunca conceden decisión. D03/D11 deben incorporar estas acciones al catálogo y mantener denegación por defecto antes de READY. Cambio de rol/baja impide inmediatamente abrir cursos **por el CRM** y consultar constancia vigente; el registro auditado permanece. Cambios de versión no transfieren aprobación a la nueva versión.

**S2 · Predicado de aprobación:** dentro de una transacción se comprueban asignación activa, solicitud `pendiente`, coincidencia de `(broker_user_id, programa_id, version_programa)` entre solicitud/asignación/evidencia, evidencia presente identificada por origen, ID, digest/revisión e instante, y Admin distinto del broker. La evidencia CRM local se relee con revisión vigente; snapshot alterado/obsoleto causa 409. La evidencia Moodle exige política de frescura y versión validada por I02; mientras no exista, **no se aprueba con evidencia Moodle**. Evidencia ausente, `UNKNOWN`, ajena o aportada solo por cliente causa 422/409. El primer corte no ofrece excepción manual. No se inventa umbral de porcentaje o nota: Admin revisa la evidencia atribuible y decide.

**Concurrencia:** cada comando lleva ID de solicitud y revisión/version esperada. Dos administradores que decidan el mismo expediente compiten por una transición atómica; uno gana y el otro recibe 409 con el estado vigente. Reintentar el mismo comando devuelve la misma decisión sin segunda constancia/evento/auditoría. Reintentar con igual clave y cuerpo distinto recibe conflicto. Un Admin no puede aprobar sobre evidencia o asignación ya revocadas sin refrescar. Nunca hay actualización parcial de decisión sin auditoría.

## 4. Pantallas y experiencia

### `/academy` · Broker

Tabs iniciales propuestos: **Mis cursos**, **Catálogo**, **Mis constancias**. Cada tarjeta separa «progreso educativo» de «revisión administrativa»: `En curso`, `Pendiente de revisión`, `Rechazado`, `Aprobado` o `Revocado`. El CTA «Solicitar revisión» confirma curso/versión y evidencia disponible; no promete certificado hasta la aprobación. «Continuar» abre Moodle solo mediante lanzamiento seguro autorizado en servidor, sin URL estable adivinable ni token en cliente. El historial local de checklists se mantiene como progreso anterior. El catálogo vacío ofrece explicación, no un 100% implícito.

### `/academy/revisiones` · Administrador (ruta propuesta, no existente)

Cola con broker, curso/versión, estado, fecha de solicitud, evidencia y procedencia/frescura. Detalle muestra evidencia educativa resumida y fecha de última sincronización; `UNKNOWN` o LMS caído son explícitos. Acciones **Aprobar**, **Rechazar** y **Revocar** requieren confirmación, razón para rechazo/revocación y respuesta posterior del servidor. La aprobación registra qué evidencia y versión se vio. La vista ofrece filtros por estado sin mostrar PII adicional innecesaria. Sin expediente válido según S2, botón deshabilitado con motivo, no decisión silenciosa. Si confirmar devuelve 409/422, refrescar expediente y exigir nueva decisión.

### Seis estados obligatorios, por vista y rol

| Estado UX | Broker | Administrador |
|---|---|---|
| Carga | Esqueleto de tarjetas y progreso con `aria-busy` | Esqueleto de cola/detalle sin acciones habilitadas |
| Vacío | Sin cursos asignados / sin constancias, CTA informativo | Sin solicitudes pendientes, historial accesible |
| Error | Mensaje y reintento; conserva formulario y selección | Error de lectura/decisión, motivo intacto, ningún éxito simulado |
| Sin conexión | Evidencia cacheada marcada con `synced_at`; sin nuevo lanzamiento LMS; constancia local no cambia | Decisión no se envía si el CRM está desconectado; Moodle caído muestra evidencia `UNKNOWN`, nunca aprobación automática |
| Éxito | Tras nueva lectura del servidor aparece estado de solicitud o constancia con ID/verificación | Confirmación de decisión con actor/fecha/versión e historial actualizado; sin confeti por completar contenido |
| Permiso insuficiente | Broker deshabilitado, sin matrícula o intentando expediente ajeno: 403, sin datos filtrados | Actor sin Admin/permiso pleno: 403 y ninguna decisión registrada |

Conflicto 409 y sesión expirada se distinguen del error genérico. A 320/390 px: tabs desplazables y tarjetas apiladas, detalle/confirmación en hoja inferior con foco atrapado; a 768/1440 px: cola y detalle accesibles, tablas con encabezados y scroll horizontal contenido. Las cuatro anchuras, teclado, foco visible, etiquetas y texto sin desborde requieren capturas y prueba D07/D14. El componente concreto de Viltrum Design y wireframes finales se fijan en P3; no se importan por suposición los IDs exploratorios de D05.

## 5. Casos de uso/API propuestos

Los nombres/rutas son contrato de diseño, **no endpoints acreditados**. JSON de entrada validado con Zod, asignación campo a campo, `requireActor`, `requireScope` y alcance por broker en servidor. La decisión requiere `requireFullScope` sobre `academy_certification:approve|reject|revoke:all`, rol Admin activo y autoprohibición S1. Esas acciones aún no existen en el catálogo técnico: su alta/revisión es parte del lote, con denegación por defecto. `academy:view`/`edit` no bastan.

| Actor | Cursos/expediente | Solicitud | Decisión/revocación | Constancia |
|---|---|---|---|---|
| Broker activo | Solo propios y asignados | Solo propia | Denegada | Solo propia |
| Admin activo pleno | Expedientes necesarios para revisión | No suplanta al broker | Permitida salvo expediente propio; acciones dedicadas | Según alcance pleno |
| Asistente | Catálogo autorizado; expediente ajeno denegado en este corte | Denegada | Denegada | Ajena denegada |
| Anónimo/tercero | Denegado | Denegada | Denegada | Denegada |

**S3 · Consulta:** para expediente/constancia por ID inexistente o ajeno, responder 404 uniforme sin diferencia de cuerpo o datos observables por existencia; D12 comprobará respuesta y tiempo. Verificación pública/anónima fuera de este corte hasta ficha separada con consentimiento y respuesta minimizada. ID opaco no autoriza. Ninguna respuesta a actor sin acceso incluye URL/token de lanzamiento, broker, curso, fechas o revocación.

| Comando/consulta | Entrada/salida | Error y permiso | Evento/idempotencia |
|---|---|---|---|
| `listarMisCursos` / `GET /api/academy/cursos` | Asignaciones, curso/versión, progreso separado de revisión, `synced_at` | `academy:view` y alcance propio; 403/503 | Solo lectura |
| `consultarExpediente` / `GET /api/academy/expedientes/:id` | Evidencia, decisiones y estado actual proyectado | Propio o Admin pleno; ID ajeno/inexistente 404 uniforme | Solo lectura, sin URL de token |
| `solicitarRevision` / `POST /api/academy/solicitudes` | `programaId`, `version`, `requestId`; retorna solicitud y estado `pendiente` | Broker asignado/activo; 400, 403, 409 | Una solicitud por clave; auditoría |
| `decidirRevision` / `POST /api/academy/revisiones/:id/decision` | `approve|reject`, motivo cuando reject, versión esperada, `commandId`, referencias de evidencia vista; retorna decisión | Admin pleno y distinto del broker; 403, 409, 422 | Evento de decisión, constancia solo `approve`; clave durable |
| `revocarConstancia` / `POST /api/academy/constancias/:id/revocacion` | Motivo no vacío, versión esperada, `commandId`; retorna estado revocado | Admin pleno distinto del broker; 403, 409 | Evento de revocación, misma transacción; una vez por comando |
| `verificarConstancia` / `GET /api/academy/constancias/:id` | ID público opaco, estado vigente/revocado, curso/versión, fechas permitidas | Solo broker propio o Admin pleno; tercero/anónimo denegado, ID ajeno/inexistente 404 uniforme | Solo lectura, consulta siempre contra CRM |

Las rutas actuales de progreso/checklist conservan propósito educativo y **dejan de devolver `isCertified` como derivación**. La finalización manual de un ítem sigue siendo editable por el broker y queda separada del expediente usado en aprobación. No se introduce un webhook del LMS hasta que I02 pruebe autenticación, contrato y orden. Si Moodle falla, las consultas pueden mostrar la última evidencia **con marca de antigüedad**; el estado de aprobación CRM no se altera.

## 6. Datos, permisos y auditoría

**Modelo lógico para D11 (aún sin DDL):** `academy_programs` (ID estable, versión, nombre, estado), `academy_assignments` (broker, programa/versión, asignador, fecha, estado), `academy_evidence` (origen, ID externo, tipo, resumen minimizado, recibido/sincronizado, versión y digest), `academy_review_requests` (solicitante, evidencia capturada, estado, versión), `academy_decisions` inmutables (tipo approve/reject/revoke, actor, instante, razón, evidencia/versión vista, `command_id`), `academy_certificates` o proyección verificable con ID público opaco y estado; `external_refs` para IDs Moodle. D11 decide tablas/índices/FK/UNIQUE/CHECK, RLS y si la constancia es tabla o proyección; no duplicar fuente de verdad. **Nunca almacenar tokens LMS ni PII adicional en eventos/URLs/logs.**

Invariantes de DB propuestas: una decisión final por solicitud; una constancia vigente por broker/programa/versión; `command_id` único por emisor/operación; revocación referida a aprobación existente; FK a usuario/programa; `approved_by` no coincide con broker; auditoría transaccional con antes/después sin secretos. Cada tabla nueva declara `.enableRLS()` y políticas efectivas por rol; D12 prueba lectura/escritura con el rol real de conexión y niega cross broker incluso si la UI oculta controles. Conservar evidencia y decisiones anteriores al cambiar versión. Retención y minimización con datos reales dependen de Q-C1-05; PoC usa sintéticos.

**S5 · Corte atómico y rol SQL por acreditar:** D11 debe elegir tabla o proyección canónica, restricciones/índices y rol SQL efectivo que ejecuta handlers/worker; D12 verifica políticas RLS, `FORCE` o justificación de acceso exclusivamente servidor, y prueba con las credenciales/roles efectivos sin `BYPASSRLS`. No se presume que `.enableRLS()` por sí solo proteja las lecturas. El despliegue que introduzca constancias debe cambiar **todos** los consumidores de `isCertified` derivado (repositorio, doble, tipos/API, recalculadora cliente, badge y prueba antigua) en el mismo corte o activar una compuerta que suprima la etiqueta de certificado hasta terminar la migración. Ninguna ventana puede mostrar el badge falso. D11 prueba DB temporal con progreso legacy 0/100%, conserva conteos, cero aprobaciones nuevas y rollback ensayado; se revalida el conteo real antes de aplicar.

**S6 · Matriz provisional de minimización, solo sintéticos hasta Q-C1-05:**

| Dato | Origen/dueño | Finalidad/lectores | Destino/retención/borrado-exportación | Auditoría/log/outbox |
|---|---|---|---|---|
| ID interno broker y rol | CRM | Autorización; broker propio, Admin pleno | CRM; plazo real pendiente Q-C1-05; export/baja por política D11 | Solo ID/correlación, sin email |
| ID curso/versión/asignación | CRM; futuro mapeo LMS en I02 | Vincular solicitud y constancia; broker propio/Admin | CRM; LMS solo ID mínimo de matrícula tras aprobación Q-C1-05; no purga hasta política | IDs y transición, sin título libre |
| Progreso, nota, intento y digest | CRM local o Moodle (dueño educativo) | Evidencia de revisión; broker propio/Admin | Resumen mínimo CRM; plazo y derecho de acceso/exportación pendientes Q-C1-05; sin copia masiva | Digest/origen/fecha, nunca respuesta completa de quiz |
| Decisión, actor, fecha y motivo | CRM | Trazabilidad; broker propio y Admin según proyección | CRM inmutable; plazo, rectificación y exportación pendientes Q-C1-05 | Tipo/IDs/fecha; motivo sensible solo en expediente protegido, no log/outbox |
| Token/URL de lanzamiento LMS | LMS/BFF | Acceso puntual del broker autorizado | No persistir ni exportar; vida corta a fijar en I02 | Prohibido en auditoría/log/outbox |

Hasta que Wilber resuelva Q-C1-05, esta matriz es **restricción de PoC sintética**, no política ratificada de PII real. D11/D12 deben fijar retención, acceso, borrado/exportación y destino final antes de flujo real; no se inventa plazo ni consentimiento. Las razones libres no viajan en outbox ni telemetría.

**Migración de registros previos:** (1) respaldo/restauración ensayados en base temporal; (2) inventario de `academy_items`, `academy_progress` y `academy_checklist_progress` por usuario, sin volcar PII a informes; (3) copiar o referenciar como `origen=legacy_local`, sin inventar curso/version/nota/aprobador; (4) inicializar nuevas decisiones/constancias en **ninguna** para todos los registros antiguos, incluso 100%; (5) retirar la exposición del booleano `isCertified` derivado y renombrar «100%» como «contenido completado»; (6) reconciliar los casos que alguien consideraba certificados mediante **revisión administrativa individual**, con fecha nueva y evidencia atribuible, nunca backfill automático; (7) poder revertir el despliegue sin borrar los datos legacy y sin reactivar badge falso. La base inventariada tenía cero filas; volver a medir antes de migrar. D11 debe definir SQL reversible y prueba de no pérdida para una base con datos sintéticos heredados.

## 7. Integraciones, eventos y operación

`AprendizajePort` de I02 es candidato para catálogo, matrícula, lanzamiento y lectura de evidencia; Moodle sería dueño de curso/intentos/notas y el CRM dueño de permiso/solicitud/decisión/constancia. `BrokerAcademyAsignado` y `BrokerAccesoRevocado` salen por outbox después de la transacción local, con identidad e idempotencia de I01-A; el worker HTTP no mantiene lock de BD durante red. Una decisión de aprobación/revocación se persiste localmente y se audita aunque Moodle esté caído; cualquier reflejo en Moodle es proyección posterior, nunca autoridad.

**S4 · Frontera de revocación:** la denegación del BFF/CRM y la invalidez de la constancia son inmediatas al commit local. La suspensión de matrícula, cuenta y **sesión LMS ya abierta** es remota y eventual; I02/D16 deben definir plazo medible, reintento y alerta antes de anunciar un SLA. Mientras no se pruebe invalidación de sesión Moodle o bloqueo de acceso directo, no se promete corte inmediato global. Prueba futura: usuario con sesión LMS abierta pierde acceso CRM, se procesa baja en Moodle, se comprueba sesión existente y se detecta/alerta cualquier fallo; evento tardío de alta no revierte baja. El núcleo local independiente no declara esta parte verificada.

Métricas locales por rol: matrículas activas, solicitudes pendientes, decisiones aprobadas/rechazadas/revocadas por periodo y certificados vigentes; desglose por curso/versión. Los porcentajes de progreso se reportan por separado. No contar 100% como aprobado. Registrar `synced_at`, fallo/antigüedad de integración, tiempo de revisión y reintentos de suspensión sin exponer PII en telemetría. Ranking comparativo de brokers queda excluido hasta justificar privacidad y necesidad comercial.

## 8. Criterios de aceptación y pruebas futuras

1. **CA-01 (C1 M10/Q-C1-03):** broker A completa 100% de contenidos, checklist y/o quiz; sigue sin constancia aprobada. Prueba unitaria de dominio, contrato de repositorio real y E2E. La prueba actual `casos-de-uso.test.ts:83-95` cambia de expectativa.
2. **CA-02:** Admin autorizado revisa evidencia de A, aprueba un curso/version; decisión, actor, fecha, fuente de evidencia, solicitud y constancia verificable aparecen tras recarga. Prueba de API+DB transaccional y UI.
3. **CA-03:** Broker, Asistente y Admin sin acción dedicada reciben 403 al aprobar/rechazar/revocar; Admin-broker propio también 403 por ID de usuario vinculado, Admin distinto con permiso puede decidir. A no accede expediente ni curso asignado a B por GET directo, URL de lanzamiento o manipulación de IDs; ID ajeno/inexistente devuelve 404 uniforme. Pruebas negativas con dos brokers sintéticos.
4. **CA-04:** rechazo y revocación exigen motivo, conservan historial; revocación invalida de inmediato consulta de constancia y lanzamiento **CRM**, aun si Moodle está caído. La sesión Moodle ya abierta se prueba por separado y debe suspenderse según SLA de I02, con alerta/reintento si falla; nunca se afirma revocación remota instantánea sin evidencia.
5. **CA-05:** dos aprobaciones concurrentes y doble clic con el mismo `commandId` producen una sola decisión/constancia/evento; comando conflictivo recibe 409 sin efectos parciales. Prueba `test:db` con dos transacciones y contrato de idempotencia.
6. **CA-06:** evidencia ausente, ajena, obsoleta, `UNKNOWN` o solo aportada por cliente bloquea aprobación (422/409); aprobación relee evidencia/versión/asignación en transacción. Evidencia Moodle tardía, repetida, incompleta o fuera de orden no cambia decisión local; token/credencial no sale a cliente ni log. Pruebas de contrato/adaptador y seguridad D12.
7. **CA-07:** curso versión 2 no hereda constancia de versión 1; baja/cambio de rol corta lanzamiento; la constancia anterior queda en historial con validez claramente delimitada. Prueba de transición y E2E.
8. **CA-08:** migración con datos legacy sintéticos 0%, 100% y checklists preserva progreso, crea **cero** aprobaciones retroactivas, tiene rollback ensayado. Todos los consumidores de `isCertified` derivado dejan de mostrar certificado en un mismo corte o quedan detrás de compuerta segura; sin ventana de badge falso. Prueba de migración y conteos antes/después.
9. **CA-09:** seis estados de las dos vistas, 320/390/768/1440, teclado/foco y ausencia de desborde; estado de éxito se confirma con recarga y proveedor caído no anuncia certificado nuevo por progreso. Capturas locales y revisión D07/D14.
10. **CA-10:** `typecheck`, `lint`, `npm test`, `test:db`, `build` en worktree y flujo autenticado local por rol pasan; D12 revisa RLS/alcance y D14 observa pruebas. Estos comandos son **plan de verificación, no corridas acreditadas por esta ficha**.

## 9. Tareas ≤45 minutos y camino a READY

| Lote sugerido | Dependencia y archivos tentativos | Revisión |
|---|---|---|
| A · Cerrar contrato | D03/D11 fijan modelo, permisos, invariantes, versionado y migración; D12 verifica autoprohibición y PII. Solo ficha/ADR. | D11 + D12 |
| B · Caso de decisión CRM | Tras READY: tipos/casos de uso/pruebas `src/application/academy/**`; sin adaptador LMS. | D14 + D12 |
| C · Persistencia/auditoría | Tras B y DDL revisado: `schema.ts`, migración, repositorio, pruebas DB y rollback. | D11 + D12 + D14 |
| D · API/UX de decisión | Tras C: rutas concretas, página/confirmación, seis estados y cuatro anchos. | D07 + D12 + D14 |
| E · Moodle local | Depende de I02 READY y PoC sintética; adaptador y E2E A/B, suspensión. | D12 + D14 + D16 |

Cada despacho requiere ficha `READY`, `TAREA.md` de perfil con lista cerrada de archivos, impacto GitNexus previo sobre símbolos, trabajo en worktree aislado y revisión de otro proveedor. El núcleo local se especifica aparte en `../../../../specs/002-academy-certificacion-local/spec.md`: puede alcanzar READY con datos sintéticos y sin Moodle cuando D11/D12/D14 cierren sus propios oráculos. **M13 completo permanece DRAFT** hasta I02 revisada, identidad/revocación LMS probadas y Q-C1-05 para PII real. D07 revisa UX antes de completar M13.

## 10. Preguntas y bloqueos reales

- **D02/decisión de producto, no necesariamente humana para primera entrega:** ¿hay un programa obligatorio que justifique badge global «Broker Certificado»? Hasta definirlo, solo constancias por curso. La certificación por curso sí está confirmada por Wilber.
- **D03/D11/D12:** recurso/acciones `academy_certification:approve|reject|revoke:all` y autoprohibición quedan fijados por S1; faltan modelo físico tabla/proyección, rol SQL/RLS efectivos y contrato de evidencia local para la subficha. Consulta de tercero está excluida por S3. Son decisiones técnicas para revisión independiente; no pedir otra confirmación humana del principio ya acordado.
- **D03/D21/D16:** versión exacta de Moodle y External Services o alternativa que demuestre matrícula, evidencia y baja en PoC local; I02 sigue DRAFT.
- **Q-C1-05 requiere a Wilber antes de datos reales:** minimización, consentimiento, retención y acceso por rol de PII hacia Moodle/Twenty local. La ficha puede probarse con datos sintéticos antes.

## 11. Evidencia de esta especificación

Lectura local del 2026-10-04: `.viltrum/commercial.md` M10; `.viltrum/questions.md` Q-C1-03; `src/application/academy/{puertos.ts,casos-de-uso.ts,en-memoria.ts,casos-de-uso.test.ts}`; `src/infrastructure/db/{schema.ts,repos/academy.ts}`; `src/app/(crm)/academy/{page.tsx,vista.tsx}`; rutas `/api/academy`; inventarios P0; `integraciones/I02-moodle.md`; `.viltrum/reviews/D14-revision-fichas-I01-I02-2026-10-04.md`. No se ejecutaron pruebas ni se cambió producto para redactar este documento. La observación de cero filas procede del inventario P0 y debe revalidarse antes de migrar.
