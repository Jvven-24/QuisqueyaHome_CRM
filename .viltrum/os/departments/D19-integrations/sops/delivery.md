# D19 — Entrega de integraciones recuperables

F4; revisor **D12**. C1, expediente D21 y puerto D03 habilitan implementación. Automatizaciones que envían, cobran, publican o cambian terceros requieren autorización del mandato. Producción necesita autorización humana explícita.

## Entrada

Caso de uso, alcance y exclusiones; proveedor/version y restricciones D21, puerto D03, reglas D10, modelo de estado/idempotencia D11 y amenaza D12. Inspeccionar adaptadores, workflows/exports versionados, webhooks, workers y ambiente sandbox existentes. Verificar documentación oficial de firma, OAuth/scopes, rate limits, payload, timeout/retry, precios y retención pertinentes con fecha. Detalle no accesible queda no verificado; fuentes de una pasarela no son contrato de otra.

## Procedimiento

1. Contrato propio de integración: entrada/salida normalizadas, estados y errores estables, capacidades y límites. SDK y payload proveedor viven en adaptador; domain no importa SDK. Mapper valida schema/version y tolerancia a campos nuevos de manera deliberada. Eventos propios documentados (AsyncAPI si aporta valor), correlation/causation/tenant y versión.
2. Secretos solo server/secret manager del entorno; scopes mínimos, token expiry/refresh, rotación y revocación. Verificar instalación/organización/tenant a partir de configuración autenticada. Error OAuth no provoca ampliar scopes silenciosamente. Logs, DLQ y exports de workflows no guardan tokens ni datos personales completos.
3. Webhook: verificar firma sobre bytes originales conforme al proveedor antes de parsear/actuar; timestamp/replay cuando exista y rotación de claves. Payload/tamaño/control de acceso, tipos permitidos y ambiente de origen. Firma válida autentica origen, no decide permiso de negocio. Rechazar eventos de cuentas/tenants no asociadas; no depender de que el proveedor mande un tenant correcto.
4. Persistir recepción durable e identidad `(proveedor,cuenta/tenant,event_id)` con UNIQUE; responder según contrato y límite de timeout. Estado `recibido` no equivale a `procesado`: caída después de registrar evento debe permitir reanudar. Consumer aplica efecto y transición `procesado` de forma atómica cuando comparten DB. Si efecto remoto, registro de intento/resultado y reconciliación; la deduplicación no se cierra antes del efecto confirmado.
5. Llamadas salientes: idempotency key estable por operación de negocio, payload hash y scope; conservar request/result seguro. Timeout deja resultado desconocido, no prueba fracaso. Consultar status/reconcile o repetir con misma clave si el proveedor lo garantiza. Si no soporta idempotencia, diseñar compensación/single executor/reconciliación y declarar límite; no inventar exactamente una vez.
6. Retry policy distingue error transitorio, permanente, autorización y throttling; max intentos/tiempo, backoff con jitter, `Retry-After` y límite de concurrencia/circuito. No reintentar indefinidamente un 4xx ni sumar retries en todas las capas. DLQ registra razón, attempt history, owner y reproceso seguro; credenciales reparadas no autorizan replay masivo de cobros.
7. Orden/consistencia: event version/aggregate, eventos fuera de orden y replays; recurso ya cancelado no vuelve activo por mensaje atrasado. Definir fuente de verdad por campo, conflictos, timezone, eventual consistency, cursor/watermark y checkpoints. Sync batch parcial reanuda sin saltarse datos; deletions/retención propagan según contrato.
8. Automatizaciones: versionar workflow/config/export sin secretos; triggers, branching, schedules/timezone, dedupe, errores, run id y aprobación. Webhook sandbox distinto de URL productiva. n8n u otro runtime es opción investigada, no nueva dependencia automática. Evitar loops entre dos sistemas mediante source/causation/version y condición idempotente.
9. Operación y NFR: objetivos aprobados de end-to-end delay, fallos, throughput/cuotas, backlog, recuperación y costo; dataset y ambiente. Traces/métricas/logs con IDs correlacionados, sin cardinalidad excesiva/PII. Runbook: proveedor caído, OAuth revoked, DLQ, evento desconocido, freeze/reconcile/rollback y soporte. Restore D11/D16 no debe reemitir efectos externos previamente completados.

## Evidencias y aceptación

En sandbox simular firma válida/inválida y bytes modificados, replay/duplicado concurrente, crash tras recepción, antes/después del efecto, timeout remoto, 429, out of order, schema nuevo y tenant ajeno. Usar adaptador falso cuando credencial no esté autorizada; declarar qué escenarios no representan comportamiento real del proveedor. NFR medidos se comparan con contratos vigentes; planes no ejecutados quedan pendientes.

Entregar adaptador/contratos, fuentes con fecha/version, fichas de permisos, estado durable/idempotencia, pruebas/fixtures redaccionados, runbook y riesgos. D12 revisa firma/secretos/aislamiento; D10 reglas; D11 estado; D14 flujo completo; D16/D17 release/operación. Productor no firma su propio resultado.

Subagente de payloads trabaja con fixtures autorizados y ambiente aislado, devuelve casos/version y repro. Subagente de fallos puede simular caída/rate limit en falso, sin ejercer carga sobre un proveedor vivo. Si no existe sandbox no probar mutaciones reales para obtener evidencia.

Fuentes verificadas 2026-09-29: [Stripe webhooks como patrón de ese proveedor](https://docs.stripe.com/webhooks), [AsyncAPI oficial](https://github.com/asyncapi/spec), [OpenTelemetry](https://opentelemetry.io/docs/), [Context7](https://github.com/upstash/context7).
