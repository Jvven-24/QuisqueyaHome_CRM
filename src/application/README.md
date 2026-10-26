# application/

Los casos de uso y consultas del CRM, y los puertos (interfaces) que necesitan.
Aquí vive la lógica de negocio que antes estaba en las rutas y en las páginas,
y se prueba **sin base de datos**.

Este README es una receta: si lo sigues en orden puedes migrar un módulo nuevo
sin preguntar. El módulo piloto, **Contactos** (`contactos/`), es el ejemplo
trabajado; todas las referencias `archivo:línea` de abajo son suyas. El porqué
de la estructura está en la decisión #41 de `docs/contexto/decisiones.md` y el
plan del milestone en `docs/R_ANALISIS_Y_PLAN.md` (§4 y §7).

## 1. Qué hay aquí y qué no

```
application/
  compartido/     puertos transversales, los mismos para todos los módulos
  testing/        dobles en memoria de esos puertos y sus suites de contrato
  <modulo>/       todo lo de un módulo: puertos, casos de uso, consultas,
                  doble en memoria de su repositorio y sus pruebas
```

- **`compartido/`** — cuatro puertos que casi todo módulo necesita:
  `unidad-de-trabajo.ts` (la transacción), `auditoria.ts`, `almacenamiento.ts`
  (archivos, hoy las fotos de obra) y `admin-auth.ts` (invitaciones por correo).
  Es de solo lectura para quien migra un módulo: no se edita en paralelo.
- **`testing/`** — los dobles en memoria de esos cuatro puertos
  (`unidadDeTrabajoEnMemoria`, `auditoriaEnMemoria`, `almacenamientoEnMemoria`,
  `adminAuthEnMemoria`), la interfaz `Reversible` y las suites de contrato
  (`contratos.ts`).
- **`<modulo>/`** — `puertos.ts`, `casos-de-uso.ts`, `consultas.ts`,
  `en-memoria.ts` y los `*.test.ts` del módulo. Los nombres de módulo son los del
  plan (§4): `contactos`, `leads`, `pipeline`, `actividades`, `proyectos`,
  `usuarios`, `comisiones`, `metas`, `brokers`, `catalogos`, `etapas`,
  `papelera`, `roles`.

**El doble en memoria del repositorio de un módulo vive en el módulo, NO en
`testing/`** (`contactos/en-memoria.ts`). `testing/` es solo para lo transversal:
si cada módulo metiera ahí el suyo, se volvería el archivo compartido que varios
agentes editan a la vez, que es justo lo que la §4 del plan quiere evitar.

**Dónde va un puerto:** en `<modulo>/puertos.ts`. Las carpetas vacías
`application/ports/` y `application/use-cases/` (las de la decisión #16) se
retiraron al cerrar R1.4, porque la estructura real es por módulo, no por tipo
de archivo. Quien busque "dónde va un puerto" lo encuentra ahí.

## 2. Las reglas de la capa

`application/` puede importar:

- `domain/` (reglas, errores, catálogos, `rbac`),
- otros archivos de `application/` (los puertos de `compartido/`, los de su
  módulo, `testing/` desde las pruebas),
- módulos de `node:` (las pruebas usan `node:test` y `node:assert/strict`).

`application/` **no puede** importar `infrastructure/`, `app/`, `next`,
`drizzle-orm` ni `@supabase/*`. Lo comprueba `src/infrastructure/arquitectura.test.ts`
(la prueba "application/ no conoce la infraestructura ni el framework",
`arquitectura.test.ts:79`), que corre con `npm test` y por tanto rompe el CI.
Consecuencia directa: `application/` no puede importar `db/schema.ts`, y por eso
los tipos de fila se declaran a mano en `puertos.ts` (paso 1).

El mismo archivo vigila las otras capas: `domain/` no importa nada fuera de
`domain/`, e `infrastructure/` no importa `app/`.

### La trampa de las extensiones

`npm test` es `node --test "src/**/*.test.ts"`: Node ejecuta el TypeScript sin
compilar y **exige la extensión** en cada import de valores, y no entiende el
alias `@/`. De ahí dos formas distintas de importar según la capa:

| Capa | Import de valores | Import de tipos |
|---|---|---|
| `application/` y `domain/` | ruta relativa **con `.ts`**: `../../domain/errors.ts` (`contactos/casos-de-uso.ts:12`) | relativa con `.ts` por costumbre (`contactos/puertos.ts:15`); `@/...` solo valdría aquí porque el `import type` se borra antes de ejecutar |
| `infrastructure/` y `app/` | **sin extensión**, como sus vecinos: `@/application/contactos/casos-de-uso` (`app/api/contactos/route.ts:10`) | sin extensión (`infrastructure/db/repos/contactos.ts:15-24`) |

Regla práctica: si un archivo lo carga `node --test`, lleva `.ts`; si solo lo
compila Next, no. Los repos y contenedores de `infrastructure/` no los carga
ninguna prueba (abren la conexión al importarse), así que van sin extensión
(el comentario de `infrastructure/db/repos/compartido.ts:10-13` lo explica).
La regla general está en `src/domain/README.md` ("La regla de los imports").

## 3. Cómo migrar un módulo, paso a paso

Con Contactos como ejemplo. Sustituye `contactos` por tu módulo.

**Antes de empezar, una advertencia:** el candado de `src/app/` se activa solo
cuando **existe** la carpeta `src/application/<modulo>/`
(`arquitectura.test.ts:100-113`). Desde el instante en que la creas (paso 1),
ninguna ruta de `src/app/api/<modulo>/` ni página de `src/app/(crm)/<modulo>/`
puede importar `@/infrastructure/db/*`, y `npm test` falla hasta que adelgaces la
ruta y la página (paso 7). Es normal: trabaja hasta el paso 8 antes de mirar el
resultado. Dos matices: el candado solo mira carpetas que se llamen igual que el
módulo (por ejemplo `agenda/` y `tareas/` no cuentan como `actividades`), y solo
prohíbe `infrastructure/db/`, no el contenedor.

Antes de escribir nada, lee la ruta o la página actual del módulo: todo lo que
hace hoy (validación, permisos, SQL, transacción, auditoría, mensajes) es lo que
tienes que conservar. El flujo de ramas y entrega de cada issue está en el plan
(§5 y §9).

Toca solo los archivos de tu issue (plan §7). Si necesitas cambiar algo de
`compartido/`, `testing/` o `arquitectura.test.ts`, para y coméntalo en el issue
(plan §9, paso 6).

### Paso 1 · `puertos.ts`

Crea `src/application/<modulo>/puertos.ts` con tres cosas:

1. **Los tipos de fila, declarados a mano.** `Contacto` (`contactos/puertos.ts:19-38`)
   no se importa del esquema —`application/` no puede— y debe coincidir **columna
   por columna** con la tabla `contacts`, porque la fila entera viaja en la
   respuesta HTTP y en `antes`/`despues` de la auditoría. Si el esquema cambia y
   el tipo no, el adaptador deja de compilar. Declara también las entradas de
   escritura (`DatosNuevoContacto`, `CambiosContacto`, `puertos.ts:49-71`) y, si
   alguna respuesta lleva un subconjunto, su tipo propio (`CandidatoDuplicado`,
   `puertos.ts:41-47`).
2. **El repositorio, con solo los métodos que el módulo necesita**
   (`RepositorioContactos`, `puertos.ts:73-82`): `candidatosDuplicados`,
   `buscarVisible`, `crear`, `actualizar`, `marcarBorrado`. Nada de un CRUD
   genérico por tabla. Un método que busca por id a nombre de un actor recibe
   `actor` y `alcance` (`buscarVisible(actor, alcance, id)`): el filtro por
   alcance es cosa del adaptador.
3. **El juego transaccional:** `ReposContactos = { contactos: RepositorioContactos; auditoria: Auditoria }`
   (`puertos.ts:85`). Es lo que la unidad de trabajo entrega al caso de uso. Si
   tu módulo necesita otro repositorio dentro de la misma transacción, va en el
   mismo objeto.

Las lecturas de las páginas llevan su propio puerto, separado del de
escritura: `LecturaContactos` (`puertos.ts:130-136`) con los tipos de lo que
devuelve (`FilaListadoContacto`, `ListadoContactos`, `puertos.ts:105-128`).

### Paso 2 · `casos-de-uso.ts`

Una función por operación de escritura (`crearContacto`, `editarContacto`,
`borrarContacto`). Forma fija:

- **Dependencias en el primer parámetro, datos en el segundo.**
  `crearContacto(deps, actor, entrada)`; `editarContacto(deps, actor, alcance, id, entrada)`
  (`casos-de-uso.ts:28-32` y `92-98`). `deps` lleva lo mínimo que la función usa:
  `{ unidad }`, y `{ contactos, unidad }` solo cuando hay una lectura fuera de la
  transacción.
- **El actor y el alcance son parámetros.** El caso de uso no autoriza (eso lo
  hizo la ruta con `requireScope`); recibe el alcance que resultó para decidir
  lo que dependa de él y para pasárselo al repositorio.
- **Las escrituras van dentro de `deps.unidad.ejecutar(async ({ contactos, auditoria }) => { … })`**
  (`casos-de-uso.ts:53`, `108`, `147`), y la auditoría se registra allí mismo,
  con la fila completa que devolvió el repositorio en `antes` y `despues`.
- Las entradas del caso de uso son tipos propios (`EntradaCrearContacto`,
  `EntradaEditarContacto`), sin Zod ni `Request`.
- Un fallo de negocio **se lanza** con las clases de `domain/errors.ts`
  (`NotFoundError` en `casos-de-uso.ts:113`, `ForbiddenError` en `105`,
  `ConflictError` en `46`), nunca `{ ok: false }`.

### Paso 3 · `consultas.ts`

Las lecturas de las páginas (`contactos/consultas.ts`): una función que recibe el
puerto de lectura, el actor, el alcance y los filtros, y delega
(`consultarListadoContactos`, `consultas.ts:16-23`). Las reglas de la consulta que
no son de la URL viven aquí: por ejemplo `TAMANIO_PAGINA_CONTACTOS = 20`
(`consultas.ts:14`), para que el `LIMIT` de la consulta y el "página X de Y" de la
vista no puedan desalinearse.

### Paso 4 · Doble en memoria y pruebas

1. **`en-memoria.ts`**: un doble de tu repositorio (`contactosEnMemoria`,
   `en-memoria.ts:22`) que además implementa `Reversible` (`instantanea()`,
   `en-memoria.ts:100`), para que `unidadDeTrabajoEnMemoria` pueda deshacer lo
   escrito si el caso de uso lanza. Sin eso, "si falla no queda nada" pasaría
   siempre. **El doble imita a `visibleRows`** (`buscarVisible`,
   `en-memoria.ts:55-65`: papelera y alcance): si devolviera cualquier fila, las
   pruebas de alcance se ejecutarían contra nada.
2. **`casos-de-uso.test.ts`**: monta el caso de uso con los dobles
   (`montar`, `casos-de-uso.test.ts:45-50`) y prueba, como mínimo, por cada
   operación: el camino feliz con su fila de auditoría (`actorId` incluido), cada
   regla de negocio (el duplicado, `casos-de-uso.test.ts:71`; la reasignación solo
   con `all`, `154`), el `NotFoundError` fuera de alcance (`174`, `200`) y que un
   fallo dentro de la transacción no deja fila ni auditoría (`208`). Los mensajes
   se comparan **literalmente** (`MENSAJE_DUPLICADO`, `casos-de-uso.test.ts:17`).

Si el módulo usa almacenamiento o admin de Auth, esos dobles ya existen en
`testing/` (`almacenamientoEnMemoria`, `adminAuthEnMemoria`) y se pasan en `deps`:
ambos puertos quedan **fuera** de la unidad de trabajo a propósito (una subida o
una invitación es una llamada de red que no cabe en el `BEGIN`); el caso de uso
es quien compensa si el `INSERT` falla después (ver `compartido/almacenamiento.ts`
y `compartido/admin-auth.ts`).

### Paso 5 · `infrastructure/db/repos/<modulo>.ts`

El adaptador Drizzle (`infrastructure/db/repos/contactos.ts`). Es el SQL **calcado
del que vivía en la ruta o en la página**, sin "mejorarlo" en el camino.

- `repositorioContactos(ejecutor)` (`repos/contactos.ts:37`) devuelve el
  repositorio. Acepta la transacción o la conexión suelta (`Ejecutor`,
  `repos/contactos.ts:35`) porque la detección de duplicados corre fuera del
  `BEGIN`.
- **`visibleRows` es el único filtro por alcance**
  (`repos/contactos.ts:62`, `120`). Ningún método escribe su propio
  `WHERE broker_id`.
- **El `set` de un `update` se arma campo por campo**, nunca `...cambios`
  (`repos/contactos.ts:88-97`): un campo de más que llegara por error al
  repositorio no se escribe sin que nadie lo decida.
- `lecturaContactos(db)` (`repos/contactos.ts:116`) implementa el puerto de
  lectura.
- `reposContactos(tx)` (`repos/contactos.ts:201-203`) arma el juego
  transaccional: el repositorio del módulo más `auditoriaDrizzle(tx)` de
  `repos/compartido.ts:34`.
- La unidad de trabajo la da `unidadDeTrabajoDrizzle(reposContactos)`
  (`repos/compartido.ts:27`), que recibe un constructor de repos en vez de
  exponer el `tx`.

### Paso 6 · `infrastructure/contenedor/<modulo>.ts`

Funciones fábrica, una por superficie (`contenedor/contactos.ts`):

- `contactosParaEscritura()` devuelve las `deps` que pide el caso de uso:
  `{ contactos: repositorioContactos(getDb()), unidad: unidadDeTrabajoDrizzle(reposContactos) }`
  (`contenedor/contactos.ts:17-24`).
- `contactosParaLectura()` devuelve el puerto de lectura (`contenedor/contactos.ts:26-28`).
- **`getDb()` se llama DENTRO de la fábrica, no al cargar el archivo**
  (`contenedor/contactos.ts:6-8`): `next build` importa todas las rutas para
  descubrirlas y ahí todavía no hay variables de base de datos.

### Paso 7 · Adelgazar la ruta y la página

La ruta (`app/api/contactos/route.ts`, `app/api/contactos/[id]/route.ts`) y la
página (`app/(crm)/contactos/page.tsx`) dejan de importar la base. Qué queda
en cada una está en la tabla de la §4. Todas las importaciones de `@/infrastructure/db/*`
desaparecen; se usa `@/infrastructure/contenedor/<modulo>`.

### Paso 8 · Verificar

```bash
npm run typecheck && npm run lint && npm test
```

Las tres en verde, con el número de pruebas de antes más las tuyas (el
candado de arquitectura y el de seguridad ya corren dentro de `npm test`).
Después, recorrer el flujo del módulo en la interfaz según `docs/R_REGRESION.md`
si ya existe. Codex **no** corre `npm run build` ni `npm run dev` (`AGENTS.md`).
Al terminar, revisión de seguridad del diff (`AGENTS.md` y
`docs/contexto/flujo-de-trabajo.md` §6).

## 4. Qué se queda en la ruta y qué sube al caso de uso

| En la ruta o la página | En el caso de uso o la consulta |
|---|---|
| Validar con Zod (`parseInput`) | Las reglas de negocio |
| `limpiarVacios` / `vaciosANull`: traducir lo que manda un formulario | Normalizar datos: `normalizarTelefono` (`casos-de-uso.ts:33` y `118`) |
| `requireActor` (`route.ts:54`) | Decisiones que dependen del alcance: solo `all` reasigna responsable (`casos-de-uso.ts:104-106`) |
| `requireScope` / `requireFullScope` **antes de tocar datos** (`route.ts:55`); lo exige `seguridad.test.ts` | La transacción (`deps.unidad.ejecutar`) |
| Traducir el nombre HTTP al del caso de uso: `crear_igual` pasa a `crearIgual` (`route.ts:64`) | La auditoría, dentro de esa transacción |
| Armar la entrada del caso de uso **campo por campo** (`route.ts:58-65`, `[id]/route.ts:56-62`) | Lanzar `NotFoundError`/`ForbiddenError`/`ConflictError` |
| Validar el id de la URL (`[id]/route.ts:41` en `PATCH`, `76` en `DELETE`) | Las reglas de la consulta (tamaño de página, `consultas.ts:14`) |
| Traducir el error con `errorResponse` y responder `Response.json({ ok: true, contacto })` | |
| En la página: leer `searchParams`, `requireScopeInPage`, pintar (`page.tsx:41-66`) | |

`requireScope` se queda en la ruta porque `seguridad.test.ts` lo busca en cada
archivo de `src/app/api/` (las rutas públicas se declaran a propósito en
`RUTAS_PUBLICAS`) y porque el plan fija que el permiso vive ahí y el alcance se
pasa hacia dentro (§4, "Dónde va el permiso"). El alcance que devuelve se pasa al
caso de uso (`[id]/route.ts:64` en `PATCH` y `81` en `DELETE`).

## 5. Las trampas que ya nos costaron caro

### La edición parcial distingue "ausente" de `null`

`null` borra el campo; ausente lo deja como está. El caso de uso lo decide con
`"campo" in entrada` (`casos-de-uso.ts:117-124`). Por eso la ruta debe copiar
**solo las claves presentes** (`[id]/route.ts:56-62`):

```ts
const entrada: EntradaEditarContacto = {};
if (datos.fullName !== undefined) entrada.fullName = datos.fullName;
if ("phone" in datos) entrada.phone = datos.phone;
```

Nunca `...datos` ni `entrada.phone = datos.phone` a secas: `{ phone: undefined }`
tiene la clave presente, `"phone" in entrada` es `true` y el teléfono se
borraría. Zod ya omite las claves que no llegaron. Hay una prueba de esto:
"editar con phone null borra phone y phoneDisplay; sin la clave los deja igual"
(`casos-de-uso.test.ts:142`).

### La auditoría viaja dentro del juego transaccional

`auditoria` es parte de `ReposContactos` (`puertos.ts:85`), no una dependencia
suelta del caso de uso. Así el tipo impide auditar fuera de la transacción del
cambio, que dejaría el dato cambiado sin rastro o el rastro sin dato
(`compartido/auditoria.ts:1-15`, y `infrastructure/audit.ts`). El caso de uso
recibe `{ contactos, auditoria }` del callback de `ejecutar` y usa ese.

### Los puertos lanzan errores de dominio

Nunca `{ ok: false }` ni un `Error` genérico. Las clases son las de
`domain/errors.ts`, y `errorResponse` las traduce a HTTP en un solo sitio. Un
"no existe" lo decide el caso de uso a partir de un `undefined` del repositorio
(`buscarVisible` → `NotFoundError`, `casos-de-uso.ts:112-113`: cubre a la vez
"no existe" y "existe fuera de tu alcance", sin distinguirlos al usuario). Un
fallo de una llamada externa lo lanza el adaptador como `ConflictError` con el
mensaje que verá el usuario (`contenedor/compartido.ts:36`:
`No se pudo subir "<nombreVisible>": <motivo>`).

### Una lectura que era un aviso, no una garantía, se queda fuera de la transacción

La detección de duplicados de Contactos (decisión #19) consulta **antes** de
abrir `ejecutar` (`casos-de-uso.ts:35-51`), como hacía la ruta. `contacts` no
tiene índice único en `phone` ni en `email` (solo índices normales), así que es un
aviso y no una garantía, y meterla en el `BEGIN` sugeriría una exclusividad que la
base no da. Por eso `contactosParaEscritura()` entrega también el repositorio
"suelto" sobre la conexión (`contenedor/contactos.ts:19-21`). Antes de mover una
lectura dentro de la transacción, pregúntate qué garantía da realmente la base.

### Conservar el comportamiento

Migrar es mover, no mejorar. Mismo comportamiento, otra estructura:

- los mismos **códigos HTTP**,
- los mismos **mensajes literales** (el del duplicado está en
  `casos-de-uso.ts:47` y en `casos-de-uso.test.ts:17`; si lo "arreglas", cambias
  lo que ve el usuario),
- los mismos **campos de respuesta** (`{ ok: true, contacto }`, con la fila
  entera del repositorio),
- las mismas **filas de auditoría** (acción, entidad, y la fila completa en
  `antes`/`despues`).

No se añaden funciones nuevas mientras dure el milestone (`AGENTS.md`). Si ves un
bug en el código que migras, anótalo en el issue; arréglalo solo si el plan lo
dice.

## 6. Qué NO hay

- **No hay contenedor central.** Un archivo por módulo
  (`infrastructure/contenedor/<modulo>.ts`) y las rutas importan solo el suyo. Es
  a propósito: un archivo central que todos editaran haría chocar a dos agentes
  que migran módulos distintos a la vez (plan §4).
- **No hay librería de inyección de dependencias.** Las fábricas son funciones
  simples (`contenedor/compartido.ts:1-17`).
- **No hay repositorio genérico por tabla.** El nivel de SOLID es pragmático
  (decisión #41): puerto y caso de uso donde hay reglas de negocio. Los catálogos
  y la papelera sí usarán un repositorio genérico (R3.7), sin un caso de uso por
  tabla.
- **No hay puertos de módulo sin consumidor.** Un puerto de módulo nace con el
  caso de uso que lo usa, como pedía la decisión #16. Los de `compartido/` son la
  excepción, porque son transversales: Contactos ya usa la unidad de trabajo y la
  auditoría, y almacenamiento y admin de Auth esperan a sus módulos (plan R3.4 y
  R3.5).

Ver también: `docs/contexto/arquitectura.md` (mapa de carpetas y el estado del
milestone) y `docs/contexto/convenciones.md` (nombres e imports).
