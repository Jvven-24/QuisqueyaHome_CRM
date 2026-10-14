# D10 — Método operativo

## Contrato de entrada

De D03 exijo antes de empezar:
- Módulos con responsabilidad única y contrato explícito (qué expone, qué no sabe)
- Puertos y adaptadores para cada pieza reemplazable (auth, pagos, correo, almacenamiento,
  mensajería, IA) — yo implemento contra el puerto, nunca contra el proveedor
- Catálogos identificados con su fuente declarada
- Decisiones irreversibles con su ADR (multi-tenencia, formato de identificador público,
  estrategia de auditoría, borrado lógico o físico, zona horaria, moneda)
- Clasificación de riesgo R0–R4 del proyecto (`core/routing.md`)

De D11 exijo:
- Modelo de datos con restricciones declaradas en la base
- Diccionario de datos: tabla, columna, tipo, significado
- Catálogos materializados con su código estable

**Bloqueante:** sin contratos de módulo de D03 no implemento — un endpoint que inventa su
propio límite es deuda desde el día uno. Sin modelo de datos de D11 no implemento contra
una tabla que todavía no existe de forma estable. Si falta cualquiera de los dos, escalo en
vez de improvisar.

---

## Procedimiento

### 1. Contratos de API — OpenAPI 3.2

La versión estable vigente del OpenAPI Specification es **3.2.0** (OpenAPI Initiative,
Linux Foundation, publicada 2025-09-19 — verificado 2026-09-24 en
`spec.openapis.org/oas/v3.2.0.html`). Sustituye a 3.1 como la versión activa; 3.1 sigue
siendo válida y ampliamente soportada por herramientas, pero todo contrato nuevo se escribe
en 3.2.

Para cada endpoint, antes de escribir una línea de implementación:

```
RECURSO: <nombre en plural, sustantivo, no verbo>
MÉTODO + RUTA: <verbo HTTP + ruta>
QUIÉN PUEDE LLAMARLO: <roles del catálogo>
ENTRADA: <schema con tipos, requeridos, formatos>
SALIDA ÉXITO: <schema + código de estado>
SALIDA ERROR: <Problem Details por cada clase de error posible>
IDEMPOTENTE: <sí/no y por qué>
PAGINADO: <sí/no, estrategia>
EFECTOS SECUNDARIOS: <qué más cambia — correo, cola, auditoría>
```

- [ ] El contrato se escribe **antes** que el código, no se documenta después
- [ ] Versionado explícito de la API (`/v1/`, cabecera o negociación — decisión de D03)
- [ ] Ningún campo de salida expone más de lo que el rol que consulta necesita

### 2. Validación en servidor — siempre

La validación de cliente es UX. La de servidor es la única que cuenta para efectos de
integridad y seguridad.

- [ ] Todo campo de entrada se valida en el servidor, exista o no validación en cliente
- [ ] Tipo, formato, longitud, rango y pertenencia a catálogo, verificados
- [ ] Reglas de negocio (no solo forma del dato) validadas en servidor: fechas coherentes,
      montos dentro de límite, transición de estado permitida
- [ ] Rechazo explícito con detalle de qué campo falló y por qué — nunca un 500 genérico
- [ ] La validación de servidor es independiente de la del cliente: no importa su resultado
      ni se salta si "el cliente ya validó". Reglas compartidas solo desde el mismo
      esquema/catálogo, evaluadas otra vez en el servidor (R5 de "Contrato de retroalimentación
      de acciones y formularios", `core/doctrine/ux-states.md`)
- [ ] Un rechazo de validación responde 422 con `errors[]` por campo (punto 7); el texto
      sale de claves de catálogo, nunca incrustado en el handler (P2)
- [ ] La restricción que importa también vive en la base (coordinación con D11) — el
      servidor es la segunda capa, no la única

### 3. Autorización por recurso — BOLA/IDOR

**Qué es:** Broken Object Level Authorization (a veces llamado IDOR — Insecure Direct
Object Reference) ocurre cuando un endpoint devuelve o modifica un recurso identificado por
un ID que llega del cliente, sin verificar que ese recurso le pertenece a quien hace la
petición. Es la falla más común y más cara en APIs REST: el endpoint funciona, pasa las
pruebas felices, y dos años después alguien cambia el número en la URL y ve la factura de
otro tenant.

**Cómo se previene sistemáticamente, no caso por caso:**

- [ ] Cada endpoint que recibe un ID de recurso verifica pertenencia/membresía contra el
      usuario autenticado — nunca contra el ID crudo del payload o de la URL
- [ ] La verificación de pertenencia vive en una capa común (middleware, política, función
      de dominio reutilizada), no copiada y pegada en cada handler
- [ ] El filtro de tenant/propietario se aplica en la consulta misma (`WHERE tenant_id = ?`
      del usuario autenticado), no se filtra después en memoria
- [ ] Un 404 se devuelve cuando el recurso no pertenece al solicitante — nunca un 403 que
      confirma que el recurso existe pero es de otro (evita enumeración)
- [ ] Existe al menos una prueba automatizada por recurso mutable que **intenta activamente**
      acceder o modificar el recurso de otro usuario/tenant y confirma que falla
- [ ] Los identificadores públicos no son secuenciales adivinables (coordinación con D11) —
      esto reduce superficie, pero **nunca sustituye** la verificación de pertenencia

**Antipatrón que esto reemplaza:** "el frontend nunca manda un ID que no sea del usuario".
Eso es una suposición sobre el cliente, y el cliente no es de confianza.

### 4. Idempotencia

Toda operación que muta estado y puede repetirse por reintento de red (pagos, creación de
recursos, envío de notificación) necesita una defensa contra la doble ejecución.

- [ ] Endpoints de creación y de pago aceptan una **clave de idempotencia** provista por el
      cliente (cabecera `Idempotency-Key` o equivalente del contrato)
- [ ] La clave se asocia al resultado de la primera ejecución; un reintento con la misma
      clave devuelve el mismo resultado sin repetir el efecto
- [ ] La clave tiene expiración definida y documentada
- [ ] Operaciones de pago o cobro **nunca** dependen solo de que el cliente no reintente —
      la idempotencia es responsabilidad del servidor, no cortesía del cliente
- [ ] Concurrencia: dos requests simultáneos con la misma clave no ejecutan el efecto dos
      veces (lock o restricción de unicidad en la tabla de idempotencia)

### 5. Paginación

| Estrategia | Cuándo |
|---|---|
| **Cursor** | Listas que crecen, se leen en tiempo real, o donde el offset puede saltar/repetir filas por inserciones concurrentes. Es la opción por defecto para listas de negocio activas |
| **Offset** | Conjuntos pequeños y estables, paneles administrativos con "ir a la página N", reportes donde el total exacto importa más que la consistencia bajo escritura concurrente |

- [ ] Límite máximo de tamaño de página, fijado en el contrato, no dejado al cliente
- [ ] Respuesta indica si hay más resultados y cómo pedir el siguiente lote
- [ ] Ninguna lista sin límite implícito — "traer todo" no es una opción de API pública

### 6. Límites de peticiones (rate limiting)

- [ ] Límite por usuario autenticado, por IP y por API key, según qué identidad aplica al
      endpoint
- [ ] Límites más estrictos en endpoints sensibles: login, recuperación de contraseña,
      creación de recursos costosos
- [ ] Respuesta de límite excedido usa Problem Details (ver punto 7), con `Retry-After`
      cuando aplica
- [ ] El límite no depende solo del cliente (no confiar en que el frontend "no deja
      spamear el botón")

### 7. Errores seguros — RFC 9457 Problem Details

El estándar vigente para errores de API HTTP es **RFC 9457, "Problem Details for HTTP
APIs"** (IETF, julio de 2023 — verificado 2026-09-24 en `rfc-editor.org/rfc/rfc9457.html`).
RFC 9457 **obsoleta** a RFC 7807, que definía el mismo formato base; la diferencia principal
es que 9457 relaja la obligatoriedad de algunos campos y agrega un registro IANA de tipos
de problema comunes. Todo endpoint nuevo responde errores en este formato.

Estructura mínima de una respuesta de error:
```
type:     URI que identifica la clase de problema (o "about:blank" si no hay una específica)
title:    resumen corto, legible, constante por tipo
status:   código HTTP, coherente con el status real de la respuesta
detail:   explicación específica de esta instancia del problema
instance: URI que identifica esta ocurrencia (útil para soporte/trazabilidad)
```

**Errores de validación (422) — extensión `errors[]`.** RFC 9457 permite extender el objeto
con miembros propios del tipo de problema y exige que el cliente ignore los que no
reconozca (sección 3.2, verificado 2026-10-06); su ejemplo de validación usa `errors` con
`detail` y `pointer`. Nuestra forma, que consume el cliente (R4 de "Contrato de
retroalimentación de acciones y formularios", `core/doctrine/ux-states.md`), es una
extensión propia, no parte del estándar:
```
type/title/status(422)/detail/instance + errors: [ { field, code, messageKey, params } ]
```
`field` es una ruta PÚBLICA del contrato (JSON Pointer o nombre del DTO), nunca una columna,
tabla o campo interno; ausente si el error no es de un campo. `code` es estable y
documentado en OpenAPI; `messageKey` es una clave del catálogo de mensajes y `params` sus
valores (`{ "min": 3 }`). Ni `code`, `messageKey` ni `params` filtran datos internos, repiten
el valor enviado ni revelan una restricción de base de datos (un unique que se traduce a
"el email existe"). La regla anti-enumeración del `detail` aplica igual a `errors[]`: donde
distinguir "existe" de "no existe" ayude a un atacante, ambos casos devuelven el mismo
elemento. El servidor no envía texto localizado incrustado: el texto lo resuelve el
catálogo (P2). Se devuelven todos los errores de la petición, no solo el primero. Media type
`application/problem+json`. JSON no parseable o `Content-Type` inválido sigue siendo 400/415,
no 422.

- [ ] Ningún error expone stack trace, mensaje interno del motor de base de datos, ruta de
      archivo del servidor ni nombre de librería interna
- [ ] El `detail` es humano y específico sin filtrar información que ayude a un atacante
      (ej. no decir "la contraseña es incorrecta" vs "el usuario no existe" — ver checklist
      de autenticación, enumeración de usuarios)
- [ ] Cada clase de error de negocio tiene un `type` estable y documentado en el contrato
      OpenAPI
- [ ] Prueba de contrato por endpoint que muta, que puede fallar de forma verificable: una
      petición inválida devuelve 422 y, por cada elemento de `errors[]`, (a) `code` y
      `messageKey` pertenecen a un catálogo cerrado (la prueba lo carga, no lo copia) y
      `field` a las rutas públicas del contrato OpenAPI; (b) `params` no contiene el valor
      enviado; (c) ninguna cadena de la respuesta casa con una expresión de SQL, nombre de
      tabla/columna o stack (`SELECT|INSERT|constraint|relation "|at .*\(.*:\d+`); (d) dos
      entradas que no deben distinguirse (p. ej. email existente y nuevo) producen
      respuestas idénticas salvo `instance`
- [ ] El error interno no planeado (excepción no controlada) se captura, se registra con
      su detalle completo **en el log del servidor**, y al cliente se le devuelve una
      versión genérica con código de referencia para soporte

### 8. Transacciones y concurrencia

- [ ] Cada operación que toca más de una tabla o más de un agregado va dentro de una
      transacción — o se documenta explícitamente por qué no
- [ ] **Control optimista** (columna de versión / `updated_at` comparado) por defecto para
      recursos editados por humanos desde una UI — barato, y el conflicto es raro pero real
- [ ] **Control pesimista** (bloqueo explícito) solo donde el conflicto es frecuente y
      costoso de resolver después (ej. asignación de turno único, descuento de inventario
      límite) — se documenta por qué el optimista no alcanza
- [ ] Nivel de aislamiento de la transacción declarado cuando el default del motor no
      alcanza para la regla de negocio (ej. lecturas fantasma en reportes financieros)
- [ ] Ninguna decisión de negocio se toma sobre un dato leído fuera de la transacción que
      lo va a modificar

### 9. Colas — cuándo delegar en vez de responder síncrono

- [ ] La operación depende de un tercero lento o no garantizado (correo, PDF, webhook
      saliente, IA) → va a cola, el endpoint responde con estado aceptado y un identificador
      consultable
- [ ] La operación es rápida y su resultado es indispensable para la siguiente pantalla →
      se responde síncrono
- [ ] Todo trabajo en cola es **reintentable de forma idempotente** (ver punto 4) — un job
      que corre dos veces no debe duplicar el efecto
- [ ] Los jobs fallidos van a una cola de muertos (dead-letter) visible, no desaparecen
- [ ] El estado de un trabajo en cola es consultable por el cliente que lo disparó

### 10. Auditoría de quién hizo qué

En **cada mutación**, sin excepción de "esto es menor":

- [ ] Quién — usuario o proceso autenticado que ejecutó la acción
- [ ] Qué — acción y recurso afectado, con el valor anterior cuando aplica
- [ ] Cuándo — marca de tiempo con zona horaria
- [ ] Desde dónde — IP y, si aplica, cliente/dispositivo
- [ ] La auditoría no es editable desde la aplicación (coordinación con D11)
- [ ] La auditoría no contiene datos sensibles en claro

### 11. Resiliencia de catálogos públicos — Doctrina Zero-Downtime y Cold-Boot Fallback

La vitrina pública no puede colapsar por un reinicio en frío, intermitencia de red con la base de datos o tablas secundarias no migradas:

- [ ] **Aislamiento de consultas secundarias:** Las consultas a tablas relacionales o enriquecidas (videos, avances, amenidades, taxonomías) deben ejecutarse con tolerancia a fallos individual (`.catch`). Un error en una tabla auxiliar nunca debe abortar la entrega de las entidades principales (proyectos y zonas).
- [ ] **Fallback estático en frío (Cold-Boot Recovery):** Si la base de datos está caída o inaccesible durante el arranque en frío del servidor, el endpoint de catálogo debe cargar el snapshot estático pre-empaquetado en disco (`catalog.json`) y responder HTTP 200 con cabecera `X-Catalog-Fallback: snapshot` y `X-Catalog-Stale: 1`.
- [ ] **Prohibición de 503:** Queda estrictamente prohibido responder 503 Service Unavailable a visitantes en endpoints de catálogo público mientras exista un snapshot estático disponible en el repositorio.
- [ ] **Reintento transparente:** El caché mantiene el estado invalidado tras un fallback para que, en cuanto la base de datos se restablezca, la siguiente petición cargue automáticamente los datos vivos.

---

## Contrato de salida

- [ ] Contrato OpenAPI 3.2 completo, versionado, publicado junto al código
- [ ] Validación en servidor documentada por campo y por regla de negocio
- [ ] Verificación de pertenencia (BOLA/IDOR) implementada y con prueba que la ejerce
- [ ] Idempotencia implementada en toda mutación reintentable
- [ ] Paginación definida por endpoint, con límite máximo fijado
- [ ] Límite de peticiones activo en endpoints sensibles y públicos
- [ ] Errores en formato RFC 9457, sin fuga de información interna; validación en 422 con
      `errors[]` y prueba de contrato de su forma
- [ ] Transacciones y estrategia de concurrencia documentadas por operación crítica
- [ ] Trabajo asíncrono identificado y llevado a cola, con reintento idempotente
- [ ] Auditoría de mutaciones activa desde el primer endpoint, no agregada después
- [ ] Resiliencia de catálogo público con fallback estático y aislamiento de consultas probado con test unitario de desconexión forzada
- [ ] Handoff a D12 con el mapa de endpoints, roles permitidos y superficie de riesgo

---

## Herramientas y skills

| Situación | Skill |
|---|---|
| Modelar y consultar Postgres/Supabase desde el backend | `supabase`, `supabase-postgres-best-practices` |
| Autenticación/autorización con proveedor externo | `auth0:auth0-quickstart`, `auth0:express-oauth2-jwt-bearer` |
| Verificar impacto de un cambio de contrato antes de tocarlo | `viltrum-repo-map` (impacto) |
| Revisión de seguridad del propio código antes de handoff a D12 | `security-review` |
| Revisión de correctitud, reuso y eficiencia | `code-review` |
| Limpieza y simplificación tras implementar | `simplify` |
| Referencia de modelos/API cuando el proyecto usa IA | `claude-api` |

**Regla de uso:** una skill produce material o verifica mecánicamente; el criterio de qué
regla de negocio aplica y qué recurso pertenece a quién lo pone D10. Ninguna skill sustituye
la revisión de D12 en autenticación/autorización.

---

## Antipatrones propios

| Fallo | Corrección |
|---|---|
| Confiar en la validación de cliente | El servidor valida siempre, aunque el cliente ya lo hizo |
| Verificar el ID del payload sin comprobar pertenencia | BOLA/IDOR sistemático — filtro por usuario en la consulta misma |
| 403 en vez de 404 ante recurso ajeno | Confirma existencia a quien no debe saberlo |
| Endpoint de pago sin clave de idempotencia | Reintento de red duplica el cobro |
| "Traer todo" sin límite de página | Ninguna lista sin límite máximo fijado |
| 500 con stack trace o mensaje de Postgres al cliente | RFC 9457 con detalle seguro; el interno va al log |
| Operación lenta respondida síncrono | Cola con estado consultable si depende de un tercero |
| Auditoría agregada "después" | Se decide en el primer endpoint o no existe nunca |
| Job de cola no idempotente | Reintento duplica efecto — se diseña idempotente desde el inicio |
| Aprobar su propio control de acceso | D12 revisa siempre; nunca autoaprobación en auth |
| 503 en catálogo público en cold boot o tablas no migradas | Fallback obligatorio a snapshot estático en disco (HTTP 200) y aislamiento de consultas |

## Protocolo especializado de entrega

Para un mandato de entrega, aplicar [sops/delivery.md](sops/delivery.md) junto con este método. El contrato [delivery.json](delivery.json) define entradas, salidas, checks, capacidades necesarias y tareas delegables. Consultar la skill local indicada en manifest; disponibilidad de herramientas, autorización, C1 y revisión independiente se comprueban para cada proyecto. Las rúbricas de `evals/cases.md` no acreditan ejecución ni cierre de gates.
