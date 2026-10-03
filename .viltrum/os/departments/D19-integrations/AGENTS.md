# D19 — Método operativo

## Contrato de entrada

De **D21** exijo, y es **bloqueante** si falta:
- Expediente de investigación cerrado para la capacidad externa: candidatos evaluados,
  puntuación, decisión, plan de salida.
- Si el puntaje fue < 50 y se decidió construir: la razón escrita de por qué integrar
  salía peor.

De **D03** exijo, y es **bloqueante** si falta:
- Puerto definido: qué necesita el dominio, en su propio lenguaje, sin nombre de
  proveedor.
- Responsabilidad del adaptador declarada en una frase sin "y".
- Catálogos que toca la integración (estados de un pedido, tipos de evento) con su fuente.
- Si la integración es R2 o superior: modelo de amenazas de D03/D12 para esa entrada.

**Sin puerto de D03, no implemento adaptador.** Un adaptador sin puerto previo es el
proveedor filtrándose directo al dominio — el antipatrón que existo para evitar.

De **D01/D02** heredo: qué pasa cuando el dato de ambos lados diverge (regla de negocio,
no técnica), volumen esperado de eventos, tiempo de respuesta aceptable.

---

## Procedimiento

### 1. Webhooks firmados y verificados

Ningún evento entrante se procesa sin verificar su origen. Regla dura, sin excepción de
entorno de desarrollo.

**Verificación de firma:**
1. Leer el **cuerpo crudo** de la petición, antes de cualquier `JSON.parse`. Volver a
   serializar el JSON parseado produce bytes distintos a los que el proveedor firmó
   (escapes de caracteres no-ASCII, orden de claves) y la firma no valida — esto rompe
   integraciones en producción de forma silenciosa si el middleware parsea antes.
2. Calcular el HMAC (SHA-256 u otro esquema del proveedor) sobre esos bytes crudos, con el
   secreto compartido guardado fuera del repositorio (P7).
3. Comparar contra la firma recibida en el header con **comparación en tiempo constante**
   (nunca `===` ni `strcmp` directo — filtra tiempo y permite ataque de temporización).
4. Si no valida: responder rechazo, no procesar, registrar el intento con IP y timestamp.
   No dar pista de qué parte de la firma falló.

**Ventana de tiempo (anti-replay):**
- Todo evento entrante trae o se le asigna un timestamp de recepción.
- Se rechaza un evento cuya firma es válida pero cuyo timestamp excede la ventana
  aceptada (ej. 5 minutos) — evita que un payload interceptado se reproduzca más tarde.
- La verificación de firma sola no basta: una firma válida de hace tres días sigue siendo
  válida si no hay control de ventana.

**Handshake de suscripción** (patrón Meta y similares): si el proveedor exige verificar
la URL del webhook antes de enviar tráfico (reto `hub.challenge` u homólogo), ese
intercambio también vive en el adaptador, nunca hardcodeado en una ruta genérica.

### 2. Reintentos con backoff exponencial y jitter

Nunca reintentar de inmediato ni a intervalo fijo. Fórmula base:

```
espera = min(cap, base * 2^intento) 
espera_con_jitter = random(0, espera)      # "full jitter"
```

- `base`: 1–2 segundos.
- `cap`: techo explícito (ej. 60–120 segundos) — sin techo, el último reintento de un
  fallo largo tarda más que la paciencia de cualquier operación humana.
- `intento`: empieza en 0, incrementa por cada fallo.
- El jitter completo (no solo un pequeño ruido) evita que reintentos sincronizados de
  múltiples eventos golpeen al proveedor al mismo tiempo ("thundering herd").

**Límite de reintentos y cuándo desistir:**
- Máximo de intentos declarado por integración (típico: 5–8), no infinito.
- Se desiste antes del máximo si el proveedor responde un código que indica que reintentar
  no va a cambiar el resultado (ej. 4xx de validación, credencial inválida) — reintentar
  un error permanente solo retrasa saber que falló.
- Se agota el máximo y pasa a dead-letter si el error es transitorio (timeout, 5xx,
  conexión rota) y sigue fallando.
- Si el proveedor envía `Retry-After`, ese valor manda sobre el cálculo propio.

### 3. Idempotencia

**Llamadas salientes que mutan estado externo** (cobrar, facturar, enviar un mensaje):
- Toda llamada que cambia estado en el proveedor lleva una **clave de idempotencia**
  propia, generada antes del primer intento y reutilizada en cada reintento del mismo
  evento de negocio — nunca una clave nueva por reintento, eso anula el propósito.
- La clave se deriva de algo estable del lado del dominio (ej. id de la orden + tipo de
  operación), no de un timestamp o un UUID generado en cada llamada.
- Si el proveedor no soporta clave de idempotencia nativa, el adaptador implementa su
  propia deduplicación antes de llamar: verificar si esa operación ya se ejecutó con
  éxito antes de reintentar.

**Eventos entrantes (webhooks):**
- Todo evento trae un identificador único emitido por el proveedor.
- Ese identificador se guarda con restricción **UNIQUE** antes de ejecutar cualquier
  efecto del evento. El intento de insertar un ID duplicado es la señal de "ya procesado":
  se responde éxito sin repetir el efecto.
- **Nunca deduplicar solo por contenido del payload.** Dos eventos legítimos pueden tener
  el mismo contenido (dos cobros idénticos de dos clientes distintos); el identificador de
  evento es la única clave confiable.
- La deduplicación vive en una tabla propia con el ID del evento, su origen, timestamp de
  recepción y resultado del procesamiento — es evidencia, no solo un filtro.

### 4. Cola de mensajes muertos (dead-letter queue)

- Un evento que agota todos los reintentos **no desaparece**: se mueve a una cola de
  mensajes muertos con el payload completo, el historial de cada intento (timestamp,
  código de respuesta, error) y el motivo del abandono.
- **Quién la revisa:** el dueño del adaptador (D19 en el ciclo de guardia, o quien opere
  el sistema en producción) revisa la cola de forma activa, no pasiva. Una cola que nadie
  mira es un cementerio de datos perdidos con pasos extra.
- **Cómo se reprocesa:** reproceso manual explícito después de corregir la causa (secreto
  rotado, esquema actualizado, cuota restaurada) — nunca un reintento automático infinito
  disfrazado de dead-letter.
- Alertar cuando un evento entra a la cola, no esperar a que alguien la revise por rutina.

### 5. Límites del proveedor

- Todo adaptador documenta el límite real del proveedor: peticiones por segundo, eventos
  por día, cuota mensual — con fuente y fecha de verificación, no de memoria.
- **Backpressure, no fuerza bruta:** si el sistema genera eventos más rápido de lo que el
  proveedor acepta, se encola y se drena al ritmo permitido — no se dispara todo a la vez
  y se absorbe el 429 con más reintentos.
- Diseñar para el límite conocido, con margen. Un adaptador que opera al 95% del límite
  del proveedor no tiene margen para un pico normal de tráfico.
- Cuando el proveedor sube o baja el límite dinámicamente (por calidad, por plan), el
  adaptador lee el límite vigente cuando esté disponible, no asume el valor con el que se
  diseñó originalmente.

### 6. Sincronización y conflictos

Cuando el mismo dato puede cambiar en ambos lados (el sistema propio y el proveedor
externo):

| Estrategia | Cuándo aplica |
|---|---|
| Última escritura gana | El dato es de bajo riesgo y el negocio acepta perder la versión anterior |
| Versión / marca de tiempo comparada | Se necesita saber cuál cambio es más reciente antes de sobrescribir |
| Resolución manual | El conflicto implica dinero, estado legal o dato irreversible — nunca se resuelve solo |

**La estrategia se decide antes de escribir código, no se descubre en producción.** Si
D01/D02 no definieron qué gana en un conflicto, escalo — no invento la regla en el
adaptador.

Todo conflicto detectado se registra: qué versión ganó, cuál se descartó, cuándo.

### 7. Trazabilidad

- Todo evento, entrante o saliente, lleva un **ID de correlación** único que lo sigue
  desde que entra o sale del sistema hasta que termina de procesarse.
- Cuando una acción del dominio dispara una llamada saliente y esa llamada genera un
  webhook de confirmación, ambos comparten el ID de correlación — permite reconstruir la
  historia completa de una operación sin adivinar.
- **Cada intento se registra**, no solo el resultado final: timestamp, código de
  respuesta, latencia, cuerpo de error (sin datos sensibles en claro).
- El registro de auditoría de una integración nunca contiene secretos, tokens ni datos de
  tarjeta — eso aplica también aquí, no solo en D11.

### 8. Casos concretos

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
| Patrón recomendado | Verificar firma → insertar el ID del evento con restricción UNIQUE → responder 200 rápido → procesar el efecto de negocio en segundo plano si es pesado |

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

### 9. Regla del adaptador, sin excepción

Verificación obligatoria antes de cerrar cualquier integración (P1 de CLAUDE.md):

- [ ] El nombre del proveedor (Meta, Stripe, Azul, DGII, n8n, cualquier otro) **no
      aparece** en ningún archivo fuera de `adapters/` — verificado por búsqueda del
      literal en el repositorio, no por memoria.
- [ ] El dominio invoca el puerto (interfaz propia), nunca el SDK o cliente HTTP del
      proveedor directamente.
- [ ] Cambiar de proveedor implica tocar solo el adaptador — o ningún archivo fuera de él.
- [ ] Existe al menos una prueba que sustituye el adaptador real por uno falso
      (fake/mock) para probar el dominio sin red.

---

## Herramientas y skills

| Situación | Skill / herramienta |
|---|---|
| Revisión de seguridad de webhooks, secretos y superficie expuesta | `security-review` (ejecuta D12, D19 prepara el material) |
| Revisión de código del adaptador antes de PR | `code-review` |
| Medir qué se rompe si cambio un adaptador o un puerto | `gitnexus-impact-analysis` |
| La cola o el estado de idempotencia vive en Postgres/Supabase | `supabase`, `supabase-postgres-best-practices` |

**Hueco real, sin cubrir:** no hay skill instalada específica para WhatsApp Business Cloud
API, pasarelas de pago, e-CF de la DGII ni n8n. El conocimiento de esta sección de
`AGENTS.md` y de `source_manifest` es, hoy, la única cobertura — se investiga a mano con
WebSearch/WebFetch en cada proyecto hasta que exista una skill dedicada. Ver
`known_limits` en `manifest.yaml`.

---

## Contrato de salida

- [ ] Adaptador implementado detrás del puerto que definió D03
- [ ] Verificación de firma de webhook implementada y probada con payload inválido (debe
      rechazar) y válido (debe aceptar)
- [ ] Ventana de replay definida y aplicada
- [ ] Backoff exponencial con jitter implementado, con cap y límite de reintentos
      declarados
- [ ] Clave de idempotencia en toda llamada saliente que muta estado externo
- [ ] Deduplicación de eventos entrantes por ID de evento, con restricción UNIQUE
- [ ] Cola de mensajes muertos con historial de intentos y alerta de entrada
- [ ] Límite del proveedor documentado con fuente y fecha, y backpressure diseñado
- [ ] Estrategia de sincronización y conflicto definida y escrita, no implícita
- [ ] ID de correlación en cada evento entrante y saliente, con log de cada intento
- [ ] Verificado por búsqueda: el nombre del proveedor no aparece fuera de `adapters/`
- [ ] Prueba con adaptador falso que corre sin red
- [ ] Handoff a D12 con la evidencia de firma, secretos y superficie expuesta
- [ ] Handoff a D14 con los casos de reintento, duplicado y fallo total para probar

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Procesar un webhook sin verificar firma "porque total nadie más sabe la URL" | Verificación de firma siempre, sin excepción de "solo en desarrollo" |
| Reintentar en bucle sin espera | Backoff exponencial con jitter y cap, siempre |
| Deduplicar por contenido del payload | Deduplicar solo por ID de evento del proveedor |
| Reintento con clave de idempotencia nueva cada vez | La clave se genera una vez por operación de negocio y se reutiliza |
| Evento fallido que se pierde en un log | Cola de mensajes muertos con historial completo y alerta |
| Nombre del proveedor en una función de dominio | Puerto y adaptador, siempre, verificado por búsqueda |
| Asumir el límite del proveedor sin fuente ni fecha | Documentar el límite real, con enlace y fecha de verificación |
| Inventar el formato técnico de un proveedor que no se confirmó | Declarar "no verificado" y escalar antes de construir sobre un supuesto |
| Resolver un conflicto de sincronización "a ojo" en el código | La estrategia la define el negocio (D01/D02) antes de escribir código |

## Protocolo especializado de entrega

Para un mandato de entrega, aplicar [sops/delivery.md](sops/delivery.md) junto con este método. El contrato [delivery.json](delivery.json) define entradas, salidas, checks, capacidades necesarias y tareas delegables. Consultar la skill local indicada en manifest; disponibilidad de herramientas, autorización, C1 y revisión independiente se comprueban para cada proyecto. Las rúbricas de `evals/cases.md` no acreditan ejecución ni cierre de gates.
