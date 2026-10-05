---
id: I01
sistema: Twenty
repo: https://github.com/twentyhq/twenty
licencia: AGPLv3 (núcleo; excepción de aplicaciones; excluir archivos Enterprise; verificar commit fijado)
modo: RUN
puerto: CrmPort
estado: DRAFT
riesgo: R3
owner: D19
revisores: [D12, D14]
actualizado: 2026-10-04
---

# I01 · Twenty como espejo del CRM

Esta ficha es **L1 / DRAFT**. No autoriza código ni cambio de fuente de verdad. El CRM conserva PostgreSQL local como dueño de contactos, leads, negocios y actividades, según la decisión #43 y `ARQ-VRE-002-integraciones.md`. La instancia local y la instantánea `fuentes/twenty-openapi-core.json` sirven para preparar el contrato; falta una prueba de extremo a extremo del adaptador.

## 1. Para qué lo usamos y para qué no

Twenty puede recibir un espejo de contactos, negocios y actividad mediante su API. Sus capacidades ampliadas (tareas, notas, workflows, vistas y campañas) se incorporan solo cuando la ficha del módulo correspondiente defina el caso de uso y los permisos. No se copia código AGPL ni Enterprise al CRM, no se usa Twenty como fuente de datos canónica en esta fase y la UI del CRM nunca llama a Twenty directamente.

## 2. Fuente de verdad

PostgreSQL local es la única fuente de verdad de las entidades de negocio. Twenty es réplica reconstruible. `external_refs` enlaza por ID local y externo, nunca por nombre, correo o teléfono. El cambio de dueño requerirá PoC de mapeo, ensayo de migración, decisión humana y plan de reversión.

## 3. Contrato del puerto

El contrato existente en `src/application/compartido/crm.ts` expone `reflejarContacto`, `reflejarNegocio`, `registrarActividad` y `salud`, con `ContextoCrm` (clave de idempotencia, correlación y versión). Actualmente solo existe un adaptador `local`; `CRM_MOTOR` no selecciona Twenty. Antes de `READY`, D03 debe decidir si estos tres métodos y sus tipos mínimos permiten un espejo útil sin transmitir información sensible o si se necesita una lectura autorizada de la entidad en el adaptador.

## 4. Mapeo de datos

| Entidad local | Objeto Twenty | Clave de enlace | Estado |
|---|---|---|---|
| Contacto | person | `external_refs(contact, local_id, twenty)` | Pendiente: campos, consentimiento y deduplicación |
| Negocio | opportunity | `external_refs(deal, local_id, twenty)` | Wilber confirmó seis etapas activas: Nuevo, Contactado, Presentación, Preselección, Negociación, Cierre. Perdido es resultado archivado; preservar registros históricos. D03/D11 aún deben fijar slug/transiciones y mapeo reversible antes de enviar etapa. |
| Actividad | timeline activity / task / note | `external_refs(activity, local_id, twenty)` | Pendiente: semántica por tipo |

La instantánea OpenAPI local contiene `GET/POST/PATCH/DELETE` en `/people`, `/opportunities` y `/timelineActivities`, además de rutas `/companies`, `/tasks` y `/notes`. Esto acredita la forma de la API capturada, no la semántica de cada campo ni su vigencia tras actualizar Twenty. Los campos exactos, la API de metadatos y la autoría aún no están verificados.

## 5. Eventos

Salida prevista: `LeadCreado`, `NegocioCambioEtapa`, `ActividadRegistrada` en el outbox **dentro de la misma transacción** que el cambio local. El worker y el puerto ya existen, pero `outboxDrizzle.emitir` no tiene llamadas productivas; esta conexión es requisito previo. Su UUID nuevo en cada emisión tampoco deduplica la repetición del mismo comando: hay que definir identidad durable del comando y replay. No se habilitan webhooks entrantes hasta especificar firma, idempotencia, orden y caso de uso receptor. No se acepta sincronización bidireccional genérica.

## 6. Catálogo de fallos

**Bloqueo de diseño D12:** el repositorio de outbox actual mantiene una transacción y `SELECT FOR UPDATE` mientras espera `procesar`; al conectar un adaptador HTTP, la llamada remota ocurriría bajo lock y podría bloquear la cola durante un timeout. Antes del adaptador se requiere claim/lease, envío fuera de transacción y finalización condicional idempotente, o un diseño equivalente revisado por D03/D12. Timeout o resultado incierto: conservar clave y pasar a reconciliación; no crear otro evento. 429 y 5xx: respetar `Retry-After` y reintentar con la misma clave. 401/403 y mapeo inválido: intervención humana. 404/409: decidir por operación y referencia externa. Payload inválido, duplicado o fuera de orden: no alterar la entidad local. Confirmar cada caso con pruebas de contrato y de worker; las clases existentes son `RETRYABLE`, `NON_RETRYABLE` y `HUMAN_REQUIRED`.

## 7. Despliegue

La instancia local declarada usa el puerto 9320, separada del CRM. Versionar imagen/commit y esquema OpenAPI antes de implementación; documentar recursos, red, respaldo y responsable operativo. URL y secreto se leen únicamente desde `src/infrastructure/env.ts`; no se copian a esta ficha ni al cliente. La prueba viva usa datos sintéticos. Producción/VPS queda fuera de esta fase.

## 8. Pantallas nuestras

M01 Leads, M03 Negocios, Contactos, Actividades y G10 Integraciones y salud. Cada ficha define seis estados, móvil, alcance por rol y modo degradado. Si Twenty cae, la operación local continúa; G10 todavía debe especificar lectura segura de atraso/DLQ y reintento administrativo. `runtime.ts` solo permite una pasada manual y aún no hay scheduler acreditado.

## 9. Pruebas y criterios de aceptación

### Precondiciones verificables de L2 / READY

1. Alcance humano de **seis etapas activas** y Perdido archivado consta en `questions.md` Q-C1-01; D03/D11 convierten esa respuesta en catálogo de `slug`/identidad estable, transiciones, preservación y ensayo reversible de los registros existentes antes de reflejar negocios. Una ficha posterior no modifica C1 por sí sola.
2. D03 define el payload mínimo de los tres métodos de `CrmPort` y el mapa local↔Twenty por campo y versión, incluidos nulos, autor, propietario/broker, zona horaria, estado terminal y consentimiento. D11 valida propietario del dato, `external_refs`, RLS y retención. D12 aprueba minimización de PII y alcance de credenciales.
3. D03/D19 separan claim transaccional del outbox y llamada HTTP, con lease/fencing, orden por agregado, resultado incierto e idempotencia durable; D14 define pruebas de concurrencia y repetición. No activar `CRM_MOTOR=twenty` mientras el worker invoque HTTP bajo lock.
4. Fijar versión/commit o imagen Twenty, esquema del workspace y OpenAPI de esa instancia; probar solo datos sintéticos. Las rutas del snapshot no bastan como contrato vivo.
5. Existe una ficha G10/M01/M03 revisada para el indicador de sincronización y sus seis estados; la réplica caída no puede bloquear la escritura local. P0/P1 del Spec Pack y gate G2 mantienen su propia revisión.

### Lotes pequeños de implementación tras READY (no despachados)

| Lote | Entrega y criterio comprobable | Archivos permitidos propuestos | Revisor |
|---|---|---|---|
| I01-A | Base outbox independiente de Twenty: claim/lease, envío fuera de transacción, finalización condicional e idempotencia. Subficha `lotes/I01-A-outbox.md` descompone criterios y tareas ≤45 min. | Lista cerrada por microtarea en la subficha; no activar proveedor | D12 + D14; D11 para esquema |
| I01-B | Adaptador HTTP de `CrmPort` contra servidor simulado con mapeo explícito, límite de tiempo, error tipado y misma suite que el doble local; ausencia de import del proveedor en `app/`, `domain/`, `application/`. | `src/infrastructure/integraciones/twenty/**`, `src/infrastructure/contenedor/crm.ts`, `src/infrastructure/env.ts`, pruebas de contrato y guarda de arquitectura | D12 + D14 |
| I01-C | Emisión transaccional de `LeadCreado`, `NegocioCambioEtapa`, `ActividadRegistrada` en casos de uso aprobados, referencias externas sin colisiones, reintento y reconstrucción del espejo. Un evento viejo no pisa una revisión nueva. | Casos de uso/repositorios afectados que D03 enumere tras impacto GitNexus; `external_refs`/pruebas específicas | D11 + D12 + D14 |
| I01-D | PoC local de creación, actualización, caída, reanudación y reconciliación por rol con datos sintéticos; capturas 320/390/768/1440 de G10 y vistas afectadas; decisión de mantener Twenty o ensayar alternativa. | Configuración local fuera de secretos versionados, scripts de prueba aprobados, fichas de evidencia `.viltrum/` | D14 + D12; decisión D03/humana |

Cada lote cita esta ficha al alcanzar READY, se despacha por `TAREA.md` a worktree aislado, dura como máximo 45 minutos por agente y no presume que una ruta API equivalga a una funcionalidad terminada. La revisión de productor y revisor son sesiones/proveedores distintos. Ningún lote autoriza cambio de propietario ni push.

1. Contrato idéntico contra doble y adaptador HTTP simulado para los tres métodos; cero llamadas de red desde vistas o `application/`.
2. Emisión transaccional e idempotente de los tres eventos en los casos de uso; identidad durable del comando, replay y rollback conjunto probados.
3. `external_refs` persiste enlace estable y rechaza colisiones; recreación del espejo desde datos sintéticos demostrada.
4. Fallos 401, 403, 404, 409, 429, 5xx, timeout, duplicado, fuera de orden y respuesta inválida comprobados sin perder datos locales.
5. Prueba viva local con versión fijada y datos sintéticos; revisión D12 de secretos, permisos, licencia y PII; D14 comprueba regresión.
6. `typecheck`, `lint`, `test`, `spec:check` y build en worktree limpio verdes; revisión independiente antes de marcar `READY` y antes de integrar código.

## 10. Riesgos, licencia y salida

Twenty contiene núcleo AGPLv3 con una excepción para aplicaciones que usen las interfaces publicadas, paquetes MIT separados y archivos Enterprise comerciales, según su [LICENSE oficial](https://github.com/twentyhq/twenty/blob/main/LICENSE). Usar solo API de servicio separado y revisar la licencia exacta del commit desplegado. Riesgos abiertos: mapeo de etapas, campos personalizados, identidad del autor, permisos de la clave, límites de API, divergencia del espejo, clasificación/consentimiento de PII y política de retención y borrado. Salida: detener el worker, conservar PostgreSQL local y sus referencias, sustituir el adaptador detrás de `CrmPort`, reconciliar eventos pendientes y retirar la réplica externa cuando proceda.

## Evidencia y siguientes decisiones

- `MAPA-SISTEMAS-OSS.md` §4: inventario de la instancia y huecos de metadatos.
- `ARQ-VRE-002-integraciones.md` §§2–5: límites, fuente de verdad, outbox y orden.
- `src/application/compartido/crm.ts`, `src/infrastructure/contenedor/crm.ts`, `src/infrastructure/integraciones/outbox/`: contrato y estado real.
- `spec/integraciones/fuentes/twenty-openapi-core.json`: instantánea local, no garantía de versión futura.
- D03/D12/D14 deben cerrar mapeo, privacidad, contrato y pruebas para promover esta ficha de DRAFT a READY. P0/P1 del Spec Pack y el gate correspondiente siguen pendientes de evidencia.
