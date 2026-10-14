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

**Eventos entrantes (webhooks) — recibir no es procesar:**
- Todo evento trae un identificador único emitido por el proveedor.
- Orden obligatorio: verificar firma sobre los bytes crudos y que la cuenta/tenant sea la
  autorizada → **persistir** el evento en una bandeja de entrada (inbox) con restricción
  **UNIQUE** sobre `(proveedor, cuenta, event_id)` y estado `received` → acusar recibo
  según el contrato del proveedor → procesar → marcar `processed` solo cuando el efecto
  está confirmado.
- Un ID duplicado **no** significa "ya procesado". Significa "ya recibido". Al llegar un
  duplicado se mira el estado: `processed` → responder éxito sin repetir; `received` o
  `failed` → el trabajador lo retoma; mismo ID con payload distinto → conflicto a revisión,
  nunca se mezcla en silencio.
- Si el efecto vive en la misma base de datos, efecto y cambio a `processed` van en
  **una sola transacción**. Si el sistema cae antes del commit, el evento sigue pendiente
  y se reprocesa; si cae después, el duplicado ve `processed`.
- Si el efecto es remoto (cobrar, enviar), se guarda intento y clave de idempotencia
  antes de llamar. Un timeout deja el estado en `unknown`: primero se **reconcilia**
  consultando al proveedor, después se decide; no se repite a ciegas. No se promete
  "exactamente una vez" global: efectos idempotentes, reconciliación y compensación.
- Eventos viejos no resucitan estados: un `pago.pendiente` que llega después de
  `pedido.cancelado` se resuelve por versión del agregado o reconciliación.
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

Detalle por proveedor en `references/casos-proveedores.md` — **cárgalo cuando la integración
toque uno de estos**: WhatsApp Business Cloud API (firma, ventana de 24 h, plantillas, límites),
pasarelas de pago tipo Stripe (confirmación asíncrona, idempotencia de cobro), facturación
electrónica e-CF de la DGII (tipos, calendario 2026, formato técnico no verificado) y n8n
(cuándo sí y cuándo adaptador propio). Las reglas generales de §1–§7 aplican siempre.

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
| Medir qué se rompe si cambio un adaptador o un puerto | `viltrum-repo-map` (impacto) |
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
- [ ] Inbox de eventos entrantes con UNIQUE `(proveedor, cuenta, event_id)` y estados
      `received`/`processed`/`failed`; efecto local y `processed` en la misma transacción
- [ ] Probados: duplicado concurrente, caída antes y después del commit, timeout remoto
      (`unknown` + reconciliación), firma inválida, cuenta ajena y evento fuera de orden
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
