# D10 — Casos de evaluación

> Casos donde una IA genérica falla porque produce el endpoint "que funciona" sin cubrir lo
> que solo se nota cuando alguien lo ataca o lo reintenta. Cada caso: escenario → qué debe
> producir/detectar D10 → criterio de aprobado.

## Caso 1 — BOLA/IDOR en borrado de factura

**Escenario:** El módulo de facturación expone `DELETE /invoices/:id`. El endpoint verifica
que el usuario esté autenticado y que su rol permita borrar facturas, pero borra la factura
por el `:id` de la URL sin comprobar que esa factura pertenezca al tenant o al cliente del
usuario autenticado.

**Qué debe detectar/producir D10:**
- Identificar que la autorización por rol no sustituye la verificación de pertenencia del
  recurso (BOLA/IDOR, `AGENTS.md` punto 3)
- Reescribir la consulta de borrado para que filtre por `tenant_id`/`owner_id` del usuario
  autenticado, no solo por el `id` recibido
- Cambiar la respuesta cuando el recurso no pertenece al solicitante a `404`, no `403`
- Escribir la prueba que autentica como Usuario/Tenant A e intenta borrar una factura de
  Tenant B, confirmando rechazo

**Criterio de aprobado:** existe una prueba automatizada que ejecuta el intento de cruce y
falla en rojo contra la versión sin corregir, y pasa en verde contra la versión corregida.
Sin esa prueba ejecutada, el caso no está cerrado (`checklists/authorization.md`, sección D).

---

## Caso 2 — Cobro duplicado por reintento de red

**Escenario:** El endpoint `POST /payments` procesa un cobro contra la pasarela de pagos.
El cliente móvil pierde conexión justo después de enviar la petición y no recibe respuesta;
la app reintenta automáticamente el mismo `POST` a los cinco segundos. El backend no tiene
ninguna defensa contra la repetición y ejecuta el cobro dos veces.

**Qué debe detectar/producir D10:**
- Identificar la ausencia de clave de idempotencia como la causa raíz, no "hay que agregar
  un botón deshabilitado" en el cliente (eso no protege contra un reintento automático de
  red ni contra un segundo dispositivo)
- Diseñar el endpoint para aceptar `Idempotency-Key`, asociarla al resultado de la primera
  ejecución, y devolver ese mismo resultado ante una repetición con la misma clave
  (`AGENTS.md` punto 4)
- Resolver la condición de carrera: dos requests simultáneos con la misma clave no deben
  ejecutar el cobro dos veces (restricción de unicidad o lock en la tabla de idempotencia)

**Criterio de aprobado:** una prueba que envía el mismo `POST /payments` con la misma clave
de idempotencia dos veces (secuencial y también en paralelo) confirma un solo cargo
ejecutado y la misma respuesta en ambas llamadas.

---

## Caso 3 — Fuga de información interna en error 500

**Escenario:** Una consulta a `GET /reports/:id` falla porque el `:id` no tiene el formato
esperado por Postgres. La excepción no controlada llega hasta el cliente con el mensaje
completo del driver: `invalid input syntax for type uuid: "abc"` junto con el stack trace y
la ruta del archivo del servidor.

**Qué debe detectar/producir D10:**
- Reconocer que un mensaje de error del motor de base de datos expuesto al cliente es una
  fuga de información (revela tecnología, estructura interna, y en otros casos puede
  revelar nombres de tabla o columna)
- Capturar la excepción, registrar el detalle completo **en el log del servidor** con un
  identificador de referencia
- Responder al cliente en formato RFC 9457 Problem Details: `type`, `title` genérico y
  estable, `status` 400 o 500 según corresponda, `detail` humano sin información interna,
  `instance` con el identificador de referencia para soporte (`AGENTS.md` punto 7)

**Criterio de aprobado:** una prueba que envía un `:id` con formato inválido recibe una
respuesta Problem Details sin ningún fragmento del mensaje del driver, del stack trace ni
de rutas de archivo; el log del servidor sí contiene el detalle completo con el mismo
identificador de referencia devuelto al cliente.

---

## Caso 4 — Primer administrador con contraseña por defecto

**Escenario:** El README del proyecto documenta: "para crear el primer admin, ejecuta la
migración inicial; el usuario queda como `admin@empresa.com` con contraseña `Admin123!`".
El equipo asume que alguien la cambiará antes de producción.

**Qué debe detectar/producir D10:**
- Señalar que una credencial fija documentada en el repositorio es una puerta de entrada
  conocida y buscable (queda en el historial de git, en forks, en capturas de pantalla) —
  no es un detalle menor de setup, es un hallazgo de severidad alta
- Reemplazar el procedimiento por uno de `checklists/authentication.md` sección N: el
  primer admin se aprovisiona por script/CLI fuera de la app pública, con contraseña
  temporal de un solo uso que fuerza cambio inmediato, o por invitación firmada
- Activar MFA en el mismo flujo de aprovisionamiento, no como paso posterior opcional
- Verificar que la migración inicial no contenga ningún hash de contraseña fijo reutilizado
  entre ambientes (dev, staging, producción no comparten la misma credencial)

**Criterio de aprobado:** no existe ninguna contraseña, hash o token fijo para el primer
admin en el repositorio ni en la documentación; el procedimiento de aprovisionamiento está
descrito, es ejecutable, y una prueba confirma que el login con la credencial documentada
en versiones anteriores del README ya no funciona.

## Evaluación de entrega — Clave idempotente concurrente y caída

Dos peticiones de tenants distintos comparten clave, y dos del mismo tenant/operación llegan simultáneamente. Worker cae tras guardar resultado de negocio.

Esperado: scope tenant/actor/operación, hash de carga, reserva durable UNIQUE y efecto atómico; conflicto para payload distinto, mismo resultado para carga igual. Consumidor reanuda sin duplicar ni perder efecto; retry de transacción no reemite acción externa.

Aprobado: pruebas relevantes de carrera/crash demuestran invariantes o quedan pendientes con entorno faltante. Cache en memoria por clave global falla.

## Evaluación de entrega — Endpoint seguro, export y jobs abiertos

GET individual verifica pertenencia; exportación, lista y worker aceptan tenant del payload sin verificar.

Esperado: matriz de acción/recurso/campo/tenant aplicada a todos los caminos y deny por defecto; contexto autenticado, query limitada, job ligado a principal/tenant y scopes. RLS como defensa adicional con D11.

Aprobado: intentos cross-tenant en esos caminos se ejercen y rechazan; revisar solo endpoint feliz no cierra hallazgo.

## Evaluación de entrega — Guardar rechazado sin decir qué campo (caso Quisqueya)

Reproducción ilustrativa (la ruta y el cuerpo del 400 son un ejemplo, no un log de Quisqueya): `POST /v1/properties` con nombre vacío y teléfono con formato inválido. El handler devuelve 400 con `{"error":"Datos inválidos"}` (o un 422 con un único string); el cliente, que además deshabilitaba Guardar sin explicar, solo puede mostrar un aviso efímero. El cliente validaba el teléfono, pero una llamada directa con curl pasa sin validar.

Esperado: validación servidor independiente del cliente; 422 `application/problem+json` con `errors[]` de dos elementos `{field, code, messageKey, params}` (p. ej. `name`/`required`, `phone`/`format`), `messageKey` existentes en el catálogo de mensajes y sin texto incrustado, todos los errores en una sola respuesta; OpenAPI documenta los `code`; prueba de contrato que verifica la forma y una prueba por API directa. Referencia R4/R5 de "Contrato de retroalimentación de acciones y formularios".

Aprobado: la prueba de contrato corre y se demuestra que falla (mutando la respuesta) si falta `field`/`code`/`messageKey`, si `code`/`messageKey` no están en el catálogo cerrado, si `field` no es ruta pública, si `params` trae el valor enviado, si hay SQL/tabla/stack por expresión, o si dos entradas indistinguibles (email existente vs nuevo) dan respuestas distintas. Un `field` que sea columna interna o un unique traducido a "el email existe" reprueba. JSON no parseable sigue siendo 400. Reprobado: 400/422 genérico, solo el primer error, texto localizado en el handler, o confiar en que el cliente validó.
