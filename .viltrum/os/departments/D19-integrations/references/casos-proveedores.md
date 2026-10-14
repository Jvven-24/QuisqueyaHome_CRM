# D19 — Casos concretos por proveedor

> Referencia bajo demanda del método de D19 (`../AGENTS.md`, §8). Cárgala solo cuando la
> integración toque uno de estos proveedores. Movida sin cambios de contenido el 2026-10-05,
> salvo el patrón de pasarelas, alineado con el inbox de §3.


#### WhatsApp Business Cloud API (Meta)

| Particularidad | Detalle | Fuente |
|---|---|---|
| Verificación de firma | Header `X-Hub-Signature-256: sha256=<hex>`. HMAC-SHA256 sobre el cuerpo crudo con el secreto de la app. Comparación en tiempo constante | developers.facebook.com, consultado 2026-09-24 |
| Handshake de suscripción | GET con `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`. Responder 200 con el valor crudo de `hub.challenge` si el token coincide | developers.facebook.com, consultado 2026-09-24 |
| Ventana de 24 horas | Dentro de la ventana (usuario inició o respondió), se puede enviar cualquier mensaje de sesión sin plantilla. Fuera de la ventana, **solo** plantillas pre-aprobadas por Meta | developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages, consultado 2026-09-24 |
| Plantillas | Requieren aprobación previa de Meta; la revisión puede tardar hasta 24 horas. Enviar fuera de ventana sin plantilla aprobada falla — el adaptador debe distinguir ambos casos antes de enviar, no dejar que Meta lo rechace en silencio | developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview, consultado 2026-09-24 |
| Límites de mensajería | Cuenta nueva: 250 destinatarios únicos/24h fuera de ventana. Escala a 2,000 con verificación de negocio o 2,000 mensajes entregados en 30 días con plantillas de calidad. Desde 2,000, escalado automático a 10,000/100,000/ilimitado si se usa ≥50% del límite vigente en 7 días y la calidad se mantiene | developers.facebook.com/documentation/business-messaging/whatsapp/messaging-limits, consultado 2026-09-24 |
| Throughput | ~80 mensajes/segundo en cuentas estándar | fuentes de terceros (Meta no publica el número exacto en la página consultada) — **tratar como orientativo, no contractual** |
| Cambio de precios | Meta anunció cobro de mensajes de utilidad dentro de la ventana de 24h a partir del 1 de octubre de 2026 — verificar vigencia antes de presupuestar | developers.facebook.com/documentation/business-messaging/whatsapp/pricing, consultado 2026-09-24 |

**Consecuencia de diseño:** el adaptador de WhatsApp debe saber, antes de enviar, si el
destinatario está dentro de la ventana de 24 horas. Si no lo está, debe forzar el uso de
una plantilla aprobada — nunca intentar un mensaje de sesión y confiar en que Meta avise
del rechazo de forma clara.

#### Pasarelas de pago (patrón genérico, referencia Stripe)

| Particularidad | Detalle |
|---|---|
| Confirmación asíncrona | El cobro se confirma por webhook, no por la respuesta síncrona de la llamada de cobro — la llamada inicial puede dar timeout mientras el cobro sí se procesó |
| Idempotencia de cobro | Toda llamada de cobro lleva clave de idempotencia propia del lado del comercio, reutilizada en reintentos del mismo intento de compra |
| Verificación de firma | Con el SDK oficial del proveedor, nunca HMAC hecho a mano — el SDK maneja versión de firma, tolerancia de reloj y formato exacto del payload |
| Entrega garantizada al menos una vez | El proveedor puede reintentar el mismo webhook durante horas o días. El mismo `event.id` puede llegar varias veces — deduplicar por ese ID antes de aplicar el efecto es obligatorio, no opcional |
| Patrón recomendado | Verificar firma → persistir el evento en el inbox (UNIQUE, estado `received`) → responder 200 rápido → procesar y marcar `processed` en la misma transacción que el efecto (§3) |

Fuente: documentación y guías de implementación de Stripe como referencia de la industria
para el patrón webhook + idempotencia, consultadas 2026-09-24. El nombre del proveedor
real de cada proyecto (Stripe, Azul, CardNet u otro) vive solo en su adaptador.

#### Facturación electrónica e-CF (DGII, República Dominicana)

| Punto | Estado | Fuente |
|---|---|---|
| Qué es | El e-CF es el comprobante fiscal electrónico dominicano, validado por la DGII, con la misma validez legal que el comprobante físico | dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscales, consultado 2026-09-24 |
| Marco legal | Ley 32-23 de Facturación Electrónica (2023) y su reglamento de aplicación, Decreto 587-24. El e-CF como figura técnica se originó con la Norma General 05-2019 | fuentes secundarias (KPMG, Alegra) citando la DGII, consultado 2026-09-24 — **verificar el texto legal directo en dgii.gov.do antes de tomarlo como definitivo** |
| Formato del comprobante | Estructura de 13 caracteres: letra "E" (serie electrónica) + 2 dígitos de tipo + 10 dígitos secuenciales | dgii.gov.do, consultado 2026-09-24 |
| Tipos de comprobante | 31 Factura de crédito fiscal · 32 Factura de consumo · 33 Nota de débito · 34 Nota de crédito · 41 Comprobante de compras · 43 Gastos menores · 44 Regímenes especiales · 45 Comprobante gubernamental | dgii.gov.do, consultado 2026-09-24 |
| Autorización para emitir | Solo contribuyentes autorizados por la DGII pueden emitir e-CF. Proceso de certificación previo con casos de prueba antes de emitir en real | dgii.gov.do, consultado 2026-09-24 |
| Validación | El receptor puede verificar un e-CF con el RNC del emisor y el número de comprobante en el portal de consulta de la DGII | dgii.gov.do, consultado 2026-09-24 |
| Calendario de obligatoriedad 2026 | Grandes contribuyentes locales y medianos: exclusivamente e-CF desde el 1 de noviembre de 2026 (secuencias "B" no electrónicas válidas solo hasta el 31 de octubre). Pequeñas empresas, microempresas y no clasificados: 15 de noviembre de 2026 | fuentes secundarias citando anuncio de la DGII del 26 de agosto de 2026 (KPMG, Alegra) — **verificar directamente en dgii.gov.do antes de comprometerse con una fecha de corte para un cliente** |
| Formato técnico exacto (XML, esquema, endpoints de envío) | **No verificado.** No se confirmó el esquema XML exacto, los endpoints de envío/aprobación ni los códigos de rechazo en la documentación pública consultada. Antes de construir el adaptador, se debe descargar la documentación técnica oficial de la DGII (`dgii.gov.do/cicloContribuyente/facturacion/comprobantesFiscalesElectronicosE-CF/Paginas/documentacionSobreE-CF.aspx`) y, si el proyecto lo requiere, contratar o consultar a un proveedor certificado |

**Por qué es un caso especial de idempotencia y trazabilidad:** una factura fiscal
electrónica no se puede duplicar (dos e-CF por la misma venta es una irregularidad fiscal)
ni perder (una venta sin comprobante válido es una obligación tributaria incumplida). El
adaptador de e-CF necesita:
- Clave de idempotencia estricta por transacción de venta, verificada antes de solicitar
  un número de comprobante nuevo.
- Registro completo de cada envío a la DGII y su respuesta (aprobado, en proceso,
  rechazado), conservado como evidencia fiscal, no solo como log técnico.
- Esquema de contingencia para cuando la DGII no responde a tiempo — **no verificado en
  esta investigación; requiere confirmación directa con la DGII o un proveedor
  certificado antes de construir**.

#### n8n

n8n es una herramienta de automatización de flujos visual, autoalojable y de código
abierto. Expone nodos de webhook con una URL de prueba (activa 120 segundos, visible en el
editor) y una URL de producción (requiere publicar el flujo, sin vista en editor). Fuente:
docs.n8n.io, consultado 2026-09-24.

| Usar n8n | Usar adaptador propio en código |
|---|---|
| Automatización interna, de bajo riesgo, que el equipo no técnico necesita poder ajustar | Integración crítica para el negocio (pagos, e-CF) donde el control de reintentos, idempotencia y dead-letter debe ser exacto y auditable |
| Prototipo rápido de una conexión entre servicios antes de comprometerse a construir | Volumen alto o latencia estricta, donde una herramienta visual añade sobrecarga |
| Orquestar varios servicios con poca lógica de negocio propia | La lógica de deduplicación o de conflicto es compleja y necesita pruebas automatizadas versionadas en el repositorio |
| El equipo ya opera n8n y añadir un flujo es más barato que un despliegue nuevo | El cumplimiento (auditoría, R2+) exige que el código viva en el repositorio con revisión de PR |

**El modo túnel de n8n es solo para desarrollo local.** No es seguro para producción — un
flujo productivo necesita una instancia con webhook expuesto de forma estable y con
verificación de firma igual que cualquier otro adaptador (fuente: docs.n8n.io, consultado
2026-09-24).

Cuando D19 opera n8n, el flujo en sí es el adaptador: el nombre del proveedor conectado
vive dentro del flujo (nodo de credenciales), no se filtra a código de dominio que dependa
de la salida del flujo con nombre propio de proveedor incrustado.
