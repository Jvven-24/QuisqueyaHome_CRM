# D19 — Casos de evaluación

> Casos donde una IA genérica falla porque resuelve el caso feliz y no el proveedor real.

## Caso 1 — Webhook de pago duplicado por reintento del proveedor

**Escenario:** la pasarela de pago envía el webhook de confirmación de un cobro. La
petición tarda en responder (el servidor está bajo carga) y el proveedor, al no recibir
200 a tiempo, reintenta el mismo evento con el mismo `event.id` unos segundos después.

**Qué debe detectar/producir D19:**
- El adaptador persiste el evento en un inbox con UNIQUE `(proveedor, cuenta, event.id)` y
  estado `received` antes de ejecutar el efecto de negocio (crear el registro de pago).
- El registro de pago y el paso a `processed` ocurren en la misma transacción.
- El segundo envío consulta el estado: si es `processed`, responde 200 sin crear otro
  registro; si quedó `received` (caída a mitad), el efecto se completa una sola vez.
- Pruebas automatizadas: mismo payload dos veces (también en concurrencia) y caída
  simulada entre la recepción y el commit del efecto.

**Criterio de aprobado:** dos entregas del mismo evento producen un único efecto de
negocio, y una caída tras la recepción no pierde el pago. Una respuesta que trate "ID
duplicado" como "ya procesado" sin mirar el estado **falla** el caso.

---

## Caso 2 — Envío de WhatsApp fuera de la ventana de 24 horas sin plantilla aprobada

**Escenario:** el sistema intenta notificar a un cliente por WhatsApp sobre el estado de
su pedido, dos días después de la última interacción del cliente con el negocio. El
mensaje se construye como un mensaje de sesión libre, no como plantilla.

**Qué debe detectar/producir D19:**
- El adaptador de WhatsApp verifica si el destinatario está dentro de la ventana de 24
  horas **antes** de decidir el tipo de mensaje a enviar.
- Fuera de ventana, el adaptador exige el uso de una plantilla pre-aprobada por Meta; si
  no existe una plantilla aplicable, el envío falla de forma explícita y visible (no un
  rechazo silencioso de Meta que el sistema interpreta como "enviado").
- El resultado (enviado, requiere plantilla, rechazado) queda trazado con el ID de
  correlación del evento de negocio que lo originó.

**Criterio de aprobado:** ningún envío fuera de ventana sin plantilla llega a "éxito" sin
verificación previa de la ventana; el caso de fallo es visible en el log de trazabilidad,
no un mensaje que el sistema cree enviado y Meta descartó.

---

## Caso 3 — Cliente HTTP que reintenta sin backoff y termina bloqueado por límite de tasa

**Escenario:** una integración empieza a fallar de forma transitoria (5xx del proveedor).
El código reintenta cada llamada fallida de inmediato, sin espera. En minutos, el volumen
de reintentos supera el límite de tasa del proveedor y el proveedor empieza a rechazar
también las llamadas que antes funcionaban.

**Qué debe detectar/producir D19:**
- El adaptador implementa backoff exponencial con jitter completo y un techo máximo de
  espera, no reintento inmediato ni intervalo fijo.
- Existe un número máximo de reintentos, después del cual el evento pasa a la cola de
  mensajes muertos en vez de seguir insistiendo indefinidamente.
- Si el proveedor responde con código de límite de tasa (429) o header `Retry-After`, el
  adaptador respeta ese valor en vez de su propio cálculo.

**Criterio de aprobado:** una prueba que simula fallos consecutivos muestra esperas
crecientes entre intentos, no una ráfaga de llamadas inmediatas; el volumen de llamadas en
un minuto de fallo continuo se mantiene bajo el límite documentado del proveedor.

---

## Caso 4 — Nombre del proveedor filtrado a una función de dominio

**Escenario:** durante una revisión de código, aparece una función de la lógica de
negocio (ej. `procesarPedido()`) que importa directamente el SDK de una pasarela de pago
específica y construye el payload propio de esa pasarela, en vez de invocar un puerto
propio del dominio.

**Qué debe detectar/producir D19:**
- Una búsqueda del nombre del proveedor en el repositorio, fuera de `adapters/`, no
  produce resultados.
- La función de dominio depende de una interfaz propia (`ProcesadorDePagos` o
  equivalente), y el adaptador concreto de la pasarela se inyecta desde afuera.
- Existe al menos una prueba del dominio que sustituye el adaptador real por uno falso,
  demostrando que el dominio no conoce al proveedor.

**Criterio de aprobado:** cero coincidencias del nombre del proveedor fuera de
`adapters/`; cambiar de pasarela de pago requeriría tocar solo el adaptador, verificado
con la prueba de sustitución.

## Evaluación de entrega — Dedupe que pierde eventos

Webhook válido se guarda en inbox, luego worker cae antes de aplicar efecto. Segunda entrega encuentra mismo event id.

Esperado: recepción y procesamiento son estados distintos; UNIQUE evita múltiples consumidores pero permite lease/reanudación. Efecto local y marca procesado son atómicos; externo requiere idempotencia/reconciliación. Ack depende de persistencia durable y contrato del proveedor.

Aprobado: crash/replay produce un efecto eventual sin pérdida; devolver 200 y omitir cualquier evento ya registrado falla.

## Evaluación de entrega — Firma válida, cuenta equivocada y orden inverso

Proveedor firma correctamente evento de otra cuenta/tenant. Además una actualización vieja llega después de cancelación.

Esperado: asociar cuenta/tenant verificados a instalación autorizada, no aceptar tenant del payload por comodidad; schema/aggregate/version y resolución de conflicto evitan resucitar estado cancelado. Firma acredita origen y no permisos de negocio.

Aprobado: fixtures muestran rechazo de cuenta ajena y transición atrasada controlada; validar solo firma falla.
