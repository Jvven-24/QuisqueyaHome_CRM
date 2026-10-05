---
id: I02
sistema: Moodle LMS
repo: https://github.com/moodle/moodle
licencia: GPL-3.0 (verificar versión y complementos fijados antes de integrar)
modo: RUN
puerto: AprendizajePort (propuesto; no existe hoy)
estado: DRAFT
riesgo: R3
owner: D19
revisores: [D12, D14]
actualizado: 2026-10-04
---

# I02 · Moodle para Quisqueya Academy C1 M10

**Nivel L1.** Esta ficha prepara una PoC local con datos sintéticos. C1 compromete capacitación y certificación del broker; Wilber confirmó que el **certificado inicial requiere que un administrador apruebe el curso** (`questions.md` Q-C1-03). C1 no prescribe Moodle, SCORM, LTI, SSO, quiz ni embedding. El inventario `academy.moodle_sync` es aspiracional como tecnología. Moodle se adopta si demuestra curso/matrícula/progreso sin ceder al LMS la autorización comercial ni la aprobación de certificado del CRM.

## 1. Para qué lo usamos y para qué no

Moodle sería dueño de cursos publicados, lecciones, matrícula educativa e historial educativo disponible. **El CRM es dueño del acto de aprobación Admin y del estado del certificado inicial.** La Academy actual conserva checklists operativos y progreso histórico. Un porcentaje manual de finalización, nota alta o quiz aprobado no certifica automáticamente. No se comparte base de datos ni sesión, no se exponen tokens Moodle al navegador y no se asume que cada función de su UI tenga External Service equivalente.

## 2. Fuente de verdad

El CRM local es dueño de identidad comercial, rol/broker, acceso a Academy, asignación, **decisión Admin aprobar/rechazar/revocar**, actor/fecha y certificado inicial verificable. Moodle, tras PoC y selección, sería dueño de curso y evidencia educativa; el CRM guarda referencia externa por ID, programa/versión, resumen autorizado, `synced_at` y origen. D11/D12 deben fijar la forma del certificado, su revocación y retención. No se condiciona el primer certificado a un plugin Moodle no seleccionado. Una baja o pérdida de rol en el CRM debe impedir el lanzamiento inmediatamente y suspender la matrícula con reintento auditable.

## 3. Contrato del puerto

`src/application/academy/puertos.ts` hoy declara `RepositorioAcademy` local, no `AprendizajePort`. D03 debe separar lectura histórica local del nuevo puerto sin obligar al dominio a importar clases PHP/Moodle. Operaciones externas mínimas candidatas: `listarProgramasPublicados(actor)`, `asegurarMatricula(brokerId, programaId, claveIdempotencia)`, `crearLanzamiento(actor, recursoId)`, `consultarExpediente(brokerId, programaId)`, `suspenderAcceso(brokerId)` y `salud()`. Son **contratos conceptuales**, no endpoints existentes acreditados. La aprobación/certificado va en caso de uso y repositorio propios del CRM, con `requireFullScope` Admin y auditoría; ninguna operación de Moodle puede autoaprobar. D03/D12 decidirán lanzamiento seguro sin URL adivinable.

## 4. Mapeo de datos

| CRM | Moodle | Regla pendiente de validar en instancia fijada |
|---|---|---|
| Broker `users.id` y rol actual | user ID | Enlace por `external_refs`, identidad estable; email no es clave de unión ni prueba de acceso. |
| Programa Academy versión | course ID/cohort/grupo | Un programa publicado y su audiencia se mapean explícitamente; cambios de versión no borran expediente anterior. |
| Asignación de programa | enrolment | Alta idempotente y baja efectiva; roles mínimos de Moodle. |
| Progreso/nota/intento | completion + grade/attempt | Tres conceptos separados; no derivar aprobación de `progressPercent`. |
| Aprobación y certificado inicial | CRM local; Moodle solo referencia educativa | Admin autorizado aprueba curso tras revisar evidencia; estado, actor, fecha y versión quedan auditados. PDF/plugin Moodle es opcional y no valida la aprobación. |

## 5. Eventos

Salida CRM → Moodle: `BrokerAcademyAsignado` y `BrokerAccesoRevocado`, emitidos en la misma transacción local hacia outbox, procesados fuera de lock HTTP y con idempotencia durable. Entrada Moodle → CRM: **ningún webhook supuesto**. La PoC empieza con lectura/reconciliación autorizada por API y marca `synced_at`; si la versión ofrece eventos confiables, D03/D12 definirán autenticación, inbox, orden y minimización antes de habilitarlos. Una caída de Moodle no restaura acceso revocado desde el CRM.

## 6. Catálogo de fallos

Timeout/resultado incierto: reconciliar por IDs; no duplicar matrícula. 401/403: cerrar circuito y alertar a operador; no usar credencial admin como atajo. 404: programa retirado o ID obsoleto → estado explícito sin reasignación automática. 409/duplicado: confirmar expediente existente antes de dar éxito. 429/5xx: reintento acotado con misma clave y `Retry-After` cuando exista. Payload inválido/nota faltante: `UNKNOWN`, nunca aprobado. Evento fuera de orden o revocación tardía: prevalece autorización actual del CRM. **Progreso 100%, nota, quiz o `isCertified` histórico nunca sustituyen la aprobación Admin auditada.** Registrar correlación sin PII en logs.

## 7. Despliegue local

Moodle RUN se aloja separado, con PostgreSQL y almacenamiento de archivos propios. D16 verifica recursos, PHP, cron, versión de PostgreSQL, respaldo/restauración, puerto no colisionante de `9300–9399` y licencia de cada plugin. Fijar etiqueta de versión e imagen, nunca `main/latest`. La URL y credenciales de servicio se leen solo desde `src/infrastructure/env.ts`; el documento no contiene secretos. No se conectan brokers ni datos reales antes de D12 y pruebas de aislamiento. No VPS, nube ni push.

## 8. Pantallas nuestras

Referencia Spec M13 Academy (que corresponde a **C1 M10**, numeraciones distintas) y G04/G10. La vista CRM muestra catálogo y expediente autorizado, y abre experiencia educativa de Moodle mediante lanzamiento seguro solo tras verificación de acceso. El acceso directo al LMS no debe permitir consultar el expediente de otro broker. Las seis variantes carga, vacío, error, sin conexión, éxito y permiso insuficiente se prueban en CRM a 320/390/768/1440. No se promete una UI Moodle incrustada.

## 9. Pruebas y criterios de aceptación

Se verifica un recorrido mínimo completo con dos brokers sintéticos y pruebas negativas de acceso, certificado y repetición. Una respuesta documental de External Services no cuenta como prueba de integración; D14 debe observar el resultado en la instancia local fijada y en la UI del CRM.

### Precondiciones de READY

1. La regla humana inicial es **aprobación de curso por administrador** (`questions.md` Q-C1-03). D03/D11 especifican solicitud, evidencia, permiso Admin, transiciones aprobar/rechazar/revocar, auditoría, versión y visualización; D12 revisa imposibilidad de aprobación por Broker. Nota mínima, cantidad de intentos y plugin de PDF no se incorporan por suposición.
2. D03/D12 fijan identidad, provisión, revocación, RBAC por broker y versión Moodle; prueban External Services exactos para **matricular, leer evidencia educativa disponible y suspender** con usuario técnico mínimo. Plugin de certificado Moodle es opcional; si se adopta, licencia y API requieren ficha/extensión.
3. D11 define enlace de IDs, proyección, retención y export neutral de expediente. D14 define pruebas positivas y negativas con brokers A/B, aprobación Admin versus Broker, progreso completo sin aprobación, repetición, caída y restauración; quiz solo si el programa seleccionado lo exige.
4. D16 acredita instancia local versionada con datos sintéticos, cron, recursos y backup restaurado. D03 decide tras PoC si Moodle satisface M10 o si se compara Frappe Learning/otra alternativa; la investigación D21 no equivale a selección final.

### Lotes pequeños de implementación tras READY (no despachados)

| Lote | Entrega y prueba | Archivos permitidos propuestos | Revisor |
|---|---|---|---|
| I02-A | `AprendizajePort` y doble para identidad/asignación/expediente; caso CRM separado de aprobación Admin y certificado, que ignora `isCertified` histórico. | `src/application/academy/**`, pruebas de contrato; `src/domain/**` solo tras impacto D03 | D12 + D14 |
| I02-B | Adaptador Moodle HTTP con versión fijada, mapeo, timeout, errores y secretos en servidor; mismo contrato que el doble. | `src/infrastructure/integraciones/moodle/**`, `src/infrastructure/contenedor/academy.ts`, `src/infrastructure/env.ts`, guardas y pruebas específicas | D12 + D14 |
| I02-C | Alta/baja por outbox e IDs externos; lectura reconciliada del expediente sin aprobar por `progressPercent`; dos brokers aislados. | Casos de uso/repositorios precisados por D03/D11; `src/infrastructure/integraciones/outbox/**` solo si I01-A ya aprobó base común | D11 + D12 + D14 |
| I02-D | Vertical Academy local: curso → matrícula → evidencia revisable → aprobación Admin auditada → certificado CRM; baja corta acceso. Progreso completo sin aprobación no certifica. Seis estados, cuatro anchos y restauración. | `src/app/(crm)/academy/**`, rutas `src/app/api/academy/**` acotadas, evidencias `.viltrum/` | D07 + D12 + D14 |

Un lote cita esta ficha solo después de `READY`, va a worktree aislado con `TAREA.md`, ≤45 minutos por agente y revisión de otro proveedor. La PoC no declara certificación funcional hasta probar el recorrido completo en la UI y la API local.

## 10. Riesgos, licencia y salida

Moodle LMS se distribuye bajo GPL; revisar licencia del commit y cualquier plugin opcional antes de descargar código o redistribuir. Riesgos: identidad/sesiones separadas, lectura cruzada de expediente, certificado falso por progreso manual, ausencia de auditoría de aprobación, cron pendiente, almacenamiento/backup, APIs incompletas y operación de PHP. Salida: conservar la aprobación/certificado del CRM, exportar programas y expediente educativo neutral versionado, retirar tokens, suspender matrícula y cambiar adaptador. El backup nativo del LMS no demuestra portabilidad semántica a otro LMS.

## Evidencia

- `.viltrum/commercial.md` M10; `.viltrum/crm-ux/D21-academy-opensource.md` §§3, 9–12; `.viltrum/research/D02-alcance-funcional-integral-2026-10-04.md`.
- `src/application/academy/puertos.ts`, `src/application/academy/casos-de-uso.ts`, `src/infrastructure/contenedor/academy.ts`; inventario P0 `spec/inventario/crm-as-is.md`.
- [Moodle External Services](https://moodledev.io/docs/5.0/apis/subsystems/external), [funciones externas](https://moodledev.io/docs/5.1/apis/subsystems/external/functions) y [repositorio/licencia](https://github.com/moodle/moodle). La documentación general no sustituye prueba de versión/función habilitada.
