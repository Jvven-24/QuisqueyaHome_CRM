---
id: M13-CORE
contract_id: C1:M10
parent_spec: .viltrum/vre-os/spec/modulos/M13-academy.md
nombre: Nucleo local de certificacion Academy
estado: DRAFT
nivel: L1
riesgo: R3
owner: D03
revisores: [D11, D12, D14, D07]
actualizado: 2026-10-04
---

# M13-CORE · Certificación Academy local con datos sintéticos

**Subficha técnica separable, DRAFT.** ID `M13-CORE` evita colisión con `Spec:M13` Academy y `C1:M10` Academy. Esta ficha permite revisar un núcleo CRM antes de instalar/conectar Moodle; el contrato completo M13/I02 permanece DRAFT. Origen: decisión humana Q-C1-03, revisión D12 `.viltrum/reviews/D12-revision-M13-academy-C1-2026-10-04.md` S1–S6 y hallazgo AS-IS de `isCertified` derivado. El subcontrato [CORE-0](CORE-0.md) fija la salida de progreso y se revisa por separado. No autoriza código hasta revisión independiente y registro READY.

## 1. Objetivo y límite

Eliminar la afirmación falsa «Broker Certificado» que aparece al completar 100% de contenidos y habilitar una decisión local Admin auditada **por broker, curso y versión** con evidencia local sintética. El broker puede completar/solicitar, pero no aprobar. El LMS no participa en este lote: sin matrícula, API, token, notas Moodle, URL de lanzamiento, PDF, webhook, outbox hacia Moodle, PII real, nube ni push. Se conserva el progreso histórico como progreso y no se le inventa aprobación.

El núcleo se verifica con brokers sintéticos A/B y Admin C. Un Admin que coincide con broker A por `users.id` no puede aprobar, rechazar ni revocar A. La constancia solo queda vigente por decisión Admin explícita, con actor/fecha/programa/versión, y se invalida al revocar o desactivar el broker en CRM. No existe indicador global «Broker Certificado» sin programa global definido; la UI muestra estado por curso.

## 2. Seguridad y oráculo de decisión

Recurso dedicado `academy_certification` con acciones `approve`, `reject`, `revoke`; cada comando requiere `requireFullScope(..., "academy_certification", accion)` **y** rol Admin activo. La solicitud usa el actor broker autenticado; no acepta broker ID arbitrario en JSON. Una acción `academy:view` o `academy:edit` no concede decisión. Por defecto no hay filas de permiso para rol no Admin. El servidor vuelve a comprobar ID de actor, asignación activa, solicitud pendiente, curso y versión, evidencia local y revisión esperada dentro de una transacción. Evidencia local mínima: `academy_item_id`, usuario, progreso/completado, fecha, revisión o digest de snapshot y origen `crm_local`. Admin confirma que revisó esa evidencia; no hay umbral de 100% como requisito técnico ni como aprobación automática. Evidencia ausente, de B, alterada o obsoleta → 422/409, sin decisión. **No existe excepción manual en este lote.**

Decisión y auditoría se guardan en la misma transacción. `command_id` durable hace idempotente el reintento: mismo comando/cuerpo devuelve resultado previo, mismo ID con cuerpo distinto 409. Dos Admin que compiten por una solicitud generan un solo resultado y el segundo recibe 409. Una revocación no puede ser anulada por completar progreso después. No enviar motivo libre a logs ni outbox. El ID público de constancia no habilita acceso anónimo.

## 3. Matriz de acceso y API mínima

| Actor | Leer cursos/expediente | Solicitar | Aprobar/rechazar/revocar | Leer constancia |
|---|---|---|---|---|
| Broker A activo | A | A | 403 | A |
| Broker B activo | B; A devuelve 404 uniforme | B | 403 | B; A devuelve 404 uniforme |
| Admin C activo/pleno | A/B para revisar | No suplanta al broker | Sí, salvo expediente propio | A/B |
| Admin que es broker A | Propio y acceso administrativo según permiso | Propio como broker | **403 sobre A** | Propio |
| Asistente | Catálogo permitido, no expediente ajeno | 403 | 403 | Ajena 404 |
| Anónimo | 401/redirect | 401 | 401 | 401 |

Rutas **propuestas**: `GET /api/academy/expedientes/:id`, `POST /api/academy/solicitudes`, `POST /api/academy/revisiones/:id/decision`, `POST /api/academy/constancias/:id/revocacion`, `GET /api/academy/constancias/:id`. Lecturas por ID ajeno o inexistente responden 404 con cuerpo uniforme. Zod en entradas, alcance en servidor, asignación campo a campo y `requireActor` antes de tocar datos. La ruta de progreso existente puede seguir como evidencia educativa, pero ya no proyecta certificado desde porcentaje. La API/cliente no inventan una constancia cuando hay error, 409 o falta de conexión.

## 4. Modelo de datos pendiente de cierre D11

D11 debe escoger esquema físico, índices, CHECK/UNIQUE/FK, relación con `academy_items` legacy y tabla o proyección canónica de constancia. Entidades lógicas: curso/version local, asignación, solicitud, snapshot de evidencia, decisión inmutable y constancia verificable. `academy_items`/`academy_progress` anteriores permanecen. La respuesta D11 debe enumerar rol SQL efectivo de API y worker, políticas RLS y si hace falta `FORCE RLS` con prueba A/B; `.enableRLS()` sin política efectiva no acredita aislamiento. No crear un `isCertified` calculado alternativo en la nueva tabla. Versiones de curso quedan inmutables para una solicitud decidida. Al primer despliegue, ningún registro legacy se convierte en aprobación.

La migración tiene que probarse en DB temporal antes de cualquier base local existente: snapshot de conteos de `academy_items`, `academy_progress`, `academy_checklist_progress` y sus IDs; fixture con 0/100%; esquema nuevo con **cero** decisiones/constancias iniciales; mismas filas/progreso después; rollback preserva legacy. Revalidar conteos y siguiente número de migración justo antes de ejecutar. `drizzle/0004_*` es el siguiente número observado al escribir esta ficha, **no permiso para generarlo sin D11** ni garantía de que seguirá libre. En el mismo corte de despliegue se retira cualquier badge basado en `isCertified` derivado; si no es atómico, se instala primero una compuerta que muestra «Contenido completado» y nunca «Certificado».

## 5. Flujo UI y seis estados

Broker: contenido y progreso separados del estado «Pendiente de revisión / Aprobado / Rechazado / Revocado». Admin: cola local, detalle de evidencia `crm_local`, botón de decisión con confirmación, motivo obligatorio en rechazo/revocación. **Carga:** esqueleto sin acciones; **vacío:** sin solicitudes/curso; **error:** retener datos y motivo, sin éxito falso; **sin conexión:** lectura anterior marcada, no decidir; **éxito:** recarga del servidor muestra actor/fecha/versión; **permiso insuficiente:** 403/404 uniforme según operación, sin PII. Conflicto 409 se muestra aparte. Verificar 320/390/768/1440, teclado, foco y texto no desbordado. No dibujar confeti por progreso 100%.

## 6. Tareas secuenciales acotadas (cada una ≤45 min)

**Todos los archivos son una lista máxima de permiso por tarea, no un mandato de modificarlos.** D00 emite `TAREA.md` con subconjunto exacto y comprueba GitNexus impact antes de cualquier cambio de símbolo. Worktree aislado; código solo tras READY; productor distinto de D11/D12/D14/D07 revisores.

| ID / objetivo | Archivos de producto permitidos | Prueba positiva y negativa | Revisor independiente |
|---|---|---|---|
| CORE-0 · Suprimir autocertificación falsa, sin DDL; ver [subcontrato](CORE-0.md) y tareas CORE-0A/B/C | `src/application/academy/puertos.ts`, `src/application/academy/en-memoria.ts`, `src/application/academy/casos-de-uso.test.ts`, `src/infrastructure/db/repos/academy.ts`, `src/app/(crm)/academy/vista.tsx`, `src/app/api/academy/route.ts`; prueba de ruta solo bajo condición de CORE-0C | `isCertified` desaparece del tipo y del JSON `resumen`; 100% es solo contenido completado. 0%, 100%, vacío, interacción y recarga no afirman aprobación. Sin migración de filas. | D14 + D12 |
| CORE-1 · Catálogo y caso de uso puro | `src/domain/catalogs.ts`, `src/domain/rbac.ts`, `src/application/academy/puertos.ts`, `src/application/academy/casos-de-uso.ts`, `src/application/academy/casos-de-uso.test.ts`, `src/application/academy/en-memoria.ts` | Admin C aprueba A con evidencia válida; Broker/Asistente/Admin-broker propio 403; evidencia ausente/ajena/alterada 422/409; reintento idem. | D12 + D14 |
| CORE-2 · DDL y migración reversible | `src/infrastructure/db/schema.ts`, nuevo `drizzle/0004_*.sql` y metadatos Drizzle **solo con nombre exacto aprobado D11**, pruebas `src/infrastructure/db/academy-certificacion.test.ts` | DB temporal legacy 0/100 preservada, cero constancias retroactivas; FK/UNIQUE/CHECK/RLS efectivos, A/B y rollback. Si número 0004 ocupado, detener y replanificar. | D11 + D12 + D14 |
| CORE-3 · Repositorio/auditoría transaccional | `src/infrastructure/db/repos/academy.ts`, `src/infrastructure/contenedor/academy.ts`, `src/infrastructure/db/academy-certificacion.test.ts` | Decisión+auditoría atómicas, dos Admin compiten, replay idéntico produce una constancia, motivo no sale a log. | D11 + D12 + D14 |
| CORE-4 · API de solicitud/decisión/consulta | Nuevas rutas bajo `src/app/api/academy/solicitudes/**`, `revisiones/**`, `expedientes/**`, `constancias/**`; pruebas de rutas en esos directorios; `src/infrastructure/seguridad.test.ts` si la guarda lo exige | Admin decide, broker A lee propio, B obtiene 404 uniforme, Admin-broker propio 403, JSON inválido 400, conflicto 409, anónimo 401. | D12 + D14 |
| CORE-5 · UI local de revisión y constancia | `src/app/(crm)/academy/page.tsx`, `vista.tsx`, nuevas `src/app/(crm)/academy/revisiones/**`, estilos del módulo si existen; capturas `.viltrum/vre-os/capturas/academy-core/**` | Estados/roles/capturas 320/390/768/1440; tras recarga solo aprobación C muestra constancia; 100% sin aprobación sigue pendiente. | D07 + D12 + D14 |

Si una tarea supera 45 min, dividirla antes del despacho; no ampliar archivos sobre la marcha. `CORE-0` se divide en CORE-0A/B/C en su subcontrato y puede promoverse y despacharse separadamente cuando D12/D14 acepten su oráculo aunque CORE-1..5 sigan DRAFT; requiere subcontrato READY o estado por lote registrado por D00. Ningún lote declara M13 completo. El gate de cada lote exige `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:db` cuando toca BD, `npm run build` solo en worktree y evidencia de flujo UI si toca vista. Fallos ajenos se registran, no se atribuyen como verde.

## 7. Criterios de aceptación del núcleo

1. Progreso 100%, checklist o quiz no emite ni muestra certificado sin decisión Admin auditada. Test unitario, DB y UI; el caso antiguo que espera `isCertified=true` se invierte.
2. Admin C con permiso dedicado aprueba A tras revisar evidencia local atribuible; B no puede ver expediente/constancia de A. Admin-broker A no puede decidir A. Pruebas API+DB con actor real.
3. Evidencia faltante, ajena, stale o ID de curso/versión cambiado bloquea aprobación, sin auditoría de éxito. Validación transaccional y concurrencia.
4. Rechazo y revocación requieren motivo, conservan decisiones previas y constancia revocada deja de ser vigente en CRM en la siguiente lectura. Sin Moodle, no se promete suspensión remota.
5. Reintento del mismo `commandId` no crea segunda decisión; mismo ID/cuerpo distinto y dos Admin concurrentes producen conflicto estable. Prueba `test:db`.
6. Migración con legacy sintético 0/100 preserva filas, cero aprobaciones creadas, rollback ensayado y todos los consumidores de `isCertified` corregidos en el corte visible.
7. RLS/rol SQL efectivo y permisos negados por defecto demostrados por D11/D12; ninguna credencial/PII sale a cliente/log; seis estados y cuatro anchos comprobados por D07/D14.

## 8. Precondiciones de READY y dependencias

- **D11:** DDL y migración concreta con nombre libre, constraints, tabla/proyección, rol SQL y prueba RLS efectiva; snapshot/restore temporal. Sin ello CORE-2..5 no pasan READY.
- **D12:** revisar S1–S6, matriz de permisos y predicado local de aprobación, evitar acceso anónimo o autoaprobación. Puede aprobar CORE-0 por separado sin Moodle.
- **D14:** convertir cada oráculo en pruebas positivas y negativas ejecutables, incluida regresión del test actual y caso A/B; observar los comandos, no aceptar informe sin corrida.
- **D07:** revisar estados/móvil del CORE-5. D00 registra revisión de actor distinto y despacho acotado.
- **Q-C1-05:** bloquea datos reales hacia LMS/Twenty, no el núcleo con sintéticos. I02 queda DRAFT; su prueba de sesión/remota es posterior. Nada de esta ficha marca M13 completo como READY.

## 9. Evidencia y decisiones por verificar

Fuentes leídas: `.viltrum/commercial.md`, `.viltrum/questions.md`, `.viltrum/vre-os/spec/modulos/M13-academy.md`, `.viltrum/vre-os/spec/integraciones/I02-moodle.md`, `.viltrum/reviews/D12-revision-M13-academy-C1-2026-10-04.md`; `src/application/academy/**`, `src/infrastructure/db/repos/academy.ts`, `src/app/(crm)/academy/vista.tsx`, `src/app/api/academy/**`. Esta ficha es diseño documental; no se ejecutaron pruebas de producto ni migraciones. Revisar con D11 el conteo de base y número de migración antes de cualquier cambio.
