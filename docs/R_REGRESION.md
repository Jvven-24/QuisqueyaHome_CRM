# R · Guion de regresión por módulo

Red de seguridad del milestone **Reestructuración con metodología SOLID**
(decisión #41, punto 3; `docs/R_ANALISIS_Y_PLAN.md` §3 y el issue R2.1). Rama
`dev/reestructuracion-solid`.

---

## 1. Qué es y por qué existe

El milestone promete **mismo comportamiento, otra estructura**. No hay
Playwright (decisión 3), y las 167 pruebas automáticas son casi todas de
dominio y de casos de uso con dobles en memoria: no cruzan el navegador, la
sesión ni la base real. La garantía de que migrar un módulo no rompió nada es
**este guion, ejecutado a mano en el navegador**.

**Quién lo ejecuta:** el usuario, o Claude cuando tenga entorno. Codex no: no
puede correr `npm run dev` (`AGENTS.md`, "Entorno"), así que entrega la rama a
`estado:verificar` y Claude corre el guion del módulo (plan §5).

**Cuándo:**

| Momento | Para qué |
|---|---|
| **Antes** de migrar un módulo | Tomar la línea base: qué hace hoy, con sus mensajes y sus códigos exactos |
| **Después** de migrarlo | Repetir los mismos pasos y comparar. Cualquier diferencia es una regresión hasta que se demuestre lo contrario |

Un módulo no se da por migrado si un flujo suyo que pasaba antes ya no pasa, o
si pasa con otro mensaje, otro código HTTP u otro efecto en la base. El plan lo
exige así (§7): "toda ruta o página que se migre conserva exactamente su
respuesta: mismos códigos HTTP, mismos mensajes, mismos campos".

Por eso el documento es literal. Los mensajes van copiados del código; si un
mensaje no está en el código, no está aquí. Donde el código no alcanza para
afirmar algo, el paso dice **pendiente de detallar** y por qué (ver §3,
"Huecos conocidos").

---

## 2. Cómo se ejecuta

### 2.1 Qué hace falta

1. **La app en local:** `npm run dev` en la carpeta principal del repositorio.
   Apunta al proyecto de Supabase **de desarrollo**; todo paso marcado
   `ESCRIBE` escribe de verdad en esa base. No se ejecuta contra producción.
2. **Tres sesiones a la vez: admin, asistente y broker.** La sesión vive en
   cookies, y un perfil de navegador solo aguanta una: usa tres perfiles, o una
   ventana normal y dos de incógnito de navegadores distintos. Los tres usuarios
   de prueba los crea `scripts/crear-usuario-prueba.mjs` (las credenciales están
   ahí y se gobiernan por la decisión #39; no se copian a este documento). En el
   texto: "el usuario admin de prueba" es `Admin de Prueba`, el asistente es
   `Asistente de Prueba` y el broker es `Broker de Prueba`.
3. **El broker de prueba tiene que tener perfil de broker.** Ese script no crea
   la fila de `broker_profiles`. Sin ella, el usuario no aparece como tarjeta en
   `/brokers`, no es candidato en "Elegir broker a asignar" de un lead y no
   tiene fila en `/metas`. Compruébalo antes de empezar; si falta, abre
   **Configuración → Usuarios y roles → ✎** sobre `Broker de Prueba` y pulsa
   "Guardar cambios" sin tocar nada: `PATCH /api/usuarios/:id` crea el perfil si
   el rol es broker y no hay fila.
4. **`.env`** con `LEADS_WEBHOOK_TOKEN` (LEA-2) y `SUPABASE_SERVICE_ROLE_KEY`
   (fotos de obra en PRO-6 e invitaciones en USU-1). Sus valores nunca se
   escriben en este documento ni en el historial del terminal compartido.
5. Un PNG pequeño, un SVG cualquiera y una dirección de correo **propia** para
   la invitación de USU-1.

### 2.2 Convenciones del guion

**Etiquetas de la columna "Tipo":**

| Etiqueta | Significa |
|---|---|
| `LEE` | Solo lee. No ensucia la base |
| `ESCRIBE` | Crea, cambia o borra (lógicamente) datos. Anótalo en §6 |
| `INTENTO` | Intenta escribir y el sistema **debe rechazarlo**. Si funciona, es un fallo y hay que limpiar lo que dejó |

**Columna "Rol":** `admin`, `asistente` o `broker`. Si el resultado depende del
alcance, se escriben las dos variantes: `all` (admin y asistente ven toda la
cartera) y `own` (el broker ve solo lo suyo). Los permisos salen de
`db/seed.sql`: el asistente no tiene `delete` en nada, no tiene `settings` ni
`users`, y no puede crear fases de obra; el broker tiene `own` en lo comercial y
solo `view` en metas, comisiones, brokers, proyectos, unidades y avances.

**Cómo se ven los errores** (importa para comparar): en formularios, el texto
rojo bajo el campo o al pie del formulario; en el Kanban, las tareas, las
comisiones, los avances y los catálogos, un cuadro `alert()` nativo del
navegador con el texto literal. Las llamadas por consola devuelven
`{ status, body }`.

**Formas de respuesta de la API** (`src/infrastructure/http.ts`):

| Código | Cuerpo |
|---|---|
| 400 | `{"error":"Revisa los datos enviados.","fields":{"campo":"mensaje"}}` |
| 401 | `{"error":"Necesitas iniciar sesión."}` (o `{"error":"No autenticado."}` si la corta el middleware sin sesión) |
| 403 | `{"error":"Sin permiso para <acción> sobre <recurso>."}` (acción y recurso en inglés técnico: `edit`, `contacts`…) |
| 404 | `{"error":"No se encontró el registro."}` (existe pero fuera de tu alcance responde igual) |
| 409 | `{"error":"…","details":…}` |
| 500 | `{"error":"Ocurrió un error inesperado."}` |

**Consola del navegador.** Para las llamadas directas, pega una vez por
pestaña (Chrome pide escribir `allow pasting` antes la primera vez):

```js
const llamar = async (metodo, ruta, cuerpo) => {
  const r = await fetch(ruta, {
    method: metodo,
    headers: { 'content-type': 'application/json' },
    body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
};
```

Uso: `await llamar('PATCH', '/api/contactos/ID_CONTACTO', { notes: 'x' })`. Hazlo
siempre con la pestaña abierta en la sesión del rol que toca: la consola usa
las cookies de esa pestaña.

**Cómo conseguir un id:**

| Id que hace falta | De dónde sale |
|---|---|
| Contacto, lead, negocio | El parámetro de la URL al abrir su ficha: `?contacto=`, `?lead=`, `?deal=` |
| Broker | La URL del perfil: `/brokers/ID` (botón "Ver perfil") |
| Actividad | La respuesta de la propia llamada que la crea (`actividad.id`) |
| Proyecto, fase, usuario, comisión, rol, etapa | DevTools → Network: guarda algo desde la pantalla y lee el número en la URL de la petición `/api/...`. El rol además sale del `?rol=` de **Configuración → Permisos** al pulsar su botón |

Nota: el plan habla de "URL directa con `?id=`", pero ninguna página usa `?id=`.
Cada módulo tiene su parámetro, el de la tabla de arriba.

**Nombres de los datos de prueba:** empiezan por `Regresion R2` (sin acento) y
llevan el código del flujo, para encontrarlos y limpiarlos: `Regresion R2 CON-1`.
Anota cada uno en §6 en el momento de crearlo. Excepción: el caso de
duplicados de CON-2 usa los datos de la línea base del 30/09/2026.

**Resultado de cada flujo:** `PASS` (todos los pasos coinciden), `FAIL` (algo
difiere: anota el paso, el mensaje obtenido y una captura), `PARCIAL` (parte
ejecutada, parte pendiente, con el motivo) o `N/A` (la precondición no se da, con
el motivo). Un `FAIL` detiene los flujos que dependen de él.

### 2.3 Orden recomendado para una pasada completa

Hay flujos que consumen lo que crearon otros (un negocio sale de un lead, el
cierre necesita un proyecto con unidad, la comisión sale del cierre).

| Orden | Flujos | Por qué en ese punto |
|---|---|---|
| 1 | SEG-2 (login y `destino`) | Exige estar **sin sesión** |
| 2 | CON-1 … CON-11 | No depende de nada |
| 3 | PRO-1, PRO-2 | Crean el proyecto y la unidad que usan PIP y COM |
| 4 | LEA-1 … LEA-7, BRK-2 | BRK-2 asigna el proyecto al broker; LEA-3 asigna el lead al broker para que el cierre le cuente |
| 5 | MET-2, luego PIP-1 … PIP-10 | Con la meta de la compañía fijada, el cierre de PIP-7 se lee bien |
| 6 | COM-1 … COM-7, MET-1 … MET-5 | Consumen el cierre de PIP-7 |
| 7 | ACT-1 … ACT-6 | |
| 8 | PRO-3 … PRO-10 | |
| 9 | USU, CAT, ETA, ROL | |
| 10 | PAP (restaurar lo borrado en CON-10, USU-5 y PRO-10) | |
| 11 | SEG-1, SEG-3, SEG-4, SEG-5 | |

### 2.4 Los 14 flujos que exige el issue R2.1

| # | Flujo exigido | Dónde está |
|---|---|---|
| 1 | Crear contacto con duplicado | CON-2 |
| 2 | Capturar lead externo | LEA-2 |
| 3 | Convertir lead | LEA-4 |
| 4 | Asignar responsable | CON-7 (contacto), LEA-3 (lead), BRK-2 (proyectos) |
| 5 | Mover etapa | PIP-2 a PIP-6 |
| 6 | Cerrar negocio (los 8 pasos) | PIP-7 |
| 7 | Perder negocio | PIP-9 |
| 8 | Aprobar y pagar comisión | COM-3 y COM-4 |
| 9 | Exportar CSV | COM-6 |
| 10 | Crear fase de obra | PRO-4 |
| 11 | Subir foto | PRO-6 |
| 12 | Invitar usuario | USU-1 |
| 13 | Editar permisos | ROL-2 |
| 14 | Restaurar de la papelera | PAP-2 |

Los 14 tienen sus pasos escritos. Dónde el código no permite afirmar el
resultado de alguno de sus pasos, el paso lo dice (USU-1 y PIP-9 tienen pasos
pendientes de detallar; ver §3, "Huecos conocidos").

---

## 3. Estado de la línea base

Una fila por módulo (nombres del plan §4). **Solo contactos tiene línea base**,
y es parcial: el usuario verificó cuatro comprobaciones el 30 de septiembre de
2026 sobre la rama `dev/reestructuracion-solid`. El resto está pendiente.

| Módulo | Fecha de la línea base | Resultado | Quién |
|---|---|---|---|
| contactos | 2026-09-30 | **PASS** en CON-2, CON-5 y CON-9 · **PARCIAL** en CON-8 (el bloqueo visual está confirmado; el 403 por llamada directa sigue pendiente). Resto de flujos de contactos: pendiente | El usuario, a mano en el navegador |
| leads | 2026-10-02 | **PASS de interfaz (smoke):** bandeja, filtros, ficha, asignación y acciones Convertir/Descartar visibles y operables. Captura externa, idempotencia y resultado transaccional quedan pendientes de la variante API/completa | Codex, a mano en el navegador |
| pipeline | 2026-10-02 | **PASS de interfaz (smoke):** tablero, filtros, tarjetas, ficha, propiedades y selector de etapa visibles y operables. Cierre de 8 pasos, pérdida con motivo y efectos en metas/comisiones quedan pendientes de la ejecución completa | Codex, a mano en el navegador |
| actividades | 2026-10-02 | **PASS de interfaz (smoke):** listado, creación y completar tarea verificados; edición, borrado y exportación ICS quedan pendientes de la ejecución completa | Codex, a mano en el navegador |
| proyectos | pendiente | pendiente | pendiente |
| usuarios | pendiente | pendiente | pendiente |
| comisiones | pendiente | pendiente | pendiente |
| metas | pendiente | pendiente | pendiente |
| brokers | pendiente | pendiente | pendiente |
| catalogos | pendiente | pendiente | pendiente |
| etapas | pendiente | pendiente | pendiente |
| papelera | pendiente | pendiente | pendiente |
| roles | pendiente | pendiente | pendiente |

### Detalle de la línea base de contactos (30/09/2026)

Tal como la reportó el usuario:

| Comprobación | Datos | Resultado | Flujo |
|---|---|---|---|
| Alta con teléfono duplicado | Intentó crear `Duplicado UI 2026` con el teléfono `8095557777`. El CRM detectó el duplicado existente (`Cliente Prueba Alcance Proyecto — 8095557777 — sin correo`) y ofreció "Crear de todas formas"; al confirmar, el contacto se creó | **PASS** | CON-2 |
| Borrar correo dejando el campo vacío | En `Contacto Cierre PR24`, que tenía `cierre.pr24@example.com`, vació el campo y guardó; la ficha mostró "Sin correo" y el historial registró la edición por `Admin de Prueba` | **PASS** | CON-5 |
| Broker abriendo un contacto ajeno | Con sesión de broker abrió `/contactos?contacto=19` (contacto de `Asistente de Prueba`); no pudo ver la ficha y la interfaz mostró solo los contactos de su alcance | **PASS** | CON-9 |
| Broker intentando reasignar responsable | El formulario del broker no muestra el campo Responsable, así que no se pudo provocar el 403 desde la interfaz | **PARCIAL**: el bloqueo visual está confirmado; el HTTP 403 queda pendiente de comprobar por llamada directa | CON-8 (el paso 3 lo cierra) |

### Huecos conocidos del guion

Lo que el código no deja afirmar con certeza. No se rellena a ojo: hay que
anotar el resultado real en la primera pasada y ese será el valor de referencia.

| Dónde | Qué falta y por qué |
|---|---|
| LEA-1 (variante broker) | El código dice que un lead que registra un broker nace sin `broker_id` y por eso no aparece en su lista `own`. No está comprobado en el navegador |
| USU-1 | Si el correo de invitación sale o falla depende de la configuración de Supabase del entorno, que el código no determina. El paso describe las dos ramas |
| USU-3 | Que un usuario desactivado ya no puede entrar se sabe por `getActor` (`actor.ts`), pero comprobarlo a mano exige una cuenta con contraseña a la que sí se le pueda hacer eso; con las tres de prueba no se hace |
| USU-6 | "Reenviar" solo existe para un usuario en estado "Pendiente", y eso solo ocurre si una invitación falló. Es condicional |
| PIP-9 | La variante por API (perder sin motivo, 409) necesita el id de la etapa "Perdido", que ninguna pantalla muestra |
| PRO-6 | El mensaje exacto cuando falta `SUPABASE_SERVICE_ROLE_KEY` sale de `env.ts` con la variable concreta; no se cita. Si se quiere cubrir, hay que quitar esa variable de `.env` y anotar el mensaje |
| SEG-2 | El enlace del correo de "Recuperar contraseña" apunta a `/recuperar/nueva-clave`, y esa ruta **no existe** en `src/app`. El guion solo cubre el envío de la solicitud |
| PIP-7 | El doble cierre concurrente (dos peticiones a la vez) no se reproduce a mano; lo cubren el bloqueo `for update` y `commissions_deal_unq` |
| Inicio, Reportes, Academy, Comunicaciones | Quedan fuera: no son módulos del plan §4 y sus vistas usan datos de muestra (`inicio`) o son de solo lectura |

---

## 4. Flujos por módulo

Cada flujo: precondiciones y, por paso, tipo, rol, qué se hace y qué debe pasar.

---

### 4.1 contactos

Rutas: `POST /api/contactos`, `PATCH` y `DELETE /api/contactos/:id`. Páginas:
`/contactos` (parámetros `q`, `source_id`, `page`, `contacto`). Permisos: `contacts`.
Admin y asistente: `all`; broker: `own`. `delete`: solo admin.

#### CON-1 · Crear un contacto

Precondición: sesión admin. Usa un teléfono que no exista; si aparece el aviso
de duplicado, cambia el número.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre `/contactos` | Título "Contactos", botón "Nuevo contacto", contador "N contactos", tabla con Contacto / Canal / Broker / Última interacción |
| 2 | ESCRIBE | admin | "Nuevo contacto" → Nombre completo `Regresion R2 CON-1`, Teléfono `849-555-0199`, Correo `regresion.r2.con1@example.com`, Canal `Referido`, Notas `Creado por el guion R2` → "Crear contacto" | El modal se cierra y el contador sube en 1. En la base: fila en `contacts` con `broker_id` = el usuario que lo creó (así un broker `own` no pierde de vista lo que acaba de crear) y una fila de auditoría `crear` |
| 3 | LEE | admin | Busca `Regresion R2 CON-1` y pulsa Enter | Una fila: el nombre en negrita, debajo el teléfono **tal como se escribió** (`849-555-0199`), Canal `Referido`, Broker = nombre del admin, Última interacción `Sin registrar` |
| 4 | LEE | admin | Pulsa la fila | La URL gana `?contacto=ID`. Ficha "Ficha de contacto" con teléfono, correo, Canal, Responsable (el admin), `Notas: Creado por el guion R2`, botones "Editar contacto", "Abrir WhatsApp" y "Eliminar". El enlace de WhatsApp apunta a `https://wa.me/18495550199` |
| 5 | LEE | admin | Mira "Historial" al pie de la ficha | Una línea `Creación` con el nombre del admin y la fecha/hora (zona Santo Domingo) |

#### CON-2 · Crear contacto con teléfono o correo duplicado

**Línea base 30/09/2026: PASS**, pasos 1 y 2 (los demás pasos están pendientes).
Por qué: la decisión #19 avisa y no bloquea; el aviso busca en **toda** la
cartera, no solo en lo que ve el actor.

Precondición: existe un contacto con el teléfono `8095557777` (en la línea base,
`Cliente Prueba Alcance Proyecto`). En pasadas posteriores, además, `Duplicado UI
2026` ya lo tiene: el aviso listará a los dos.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | INTENTO | admin | "Nuevo contacto" → Nombre `Duplicado UI 2026`, Teléfono `8095557777` → "Crear contacto" | **No se crea.** Aparece el panel "Ya existe un contacto parecido" con una línea por candidato, en la forma `nombre — teléfono tal como se guardó — correo` o `sin correo`/`sin teléfono` (línea base: `Cliente Prueba Alcance Proyecto — 8095557777 — sin correo`) y el botón "Crear de todas formas". Sin cambios en la base |
| 2 | ESCRIBE | admin | Pulsa "Crear de todas formas" | El modal se cierra y el contacto `Duplicado UI 2026` existe (responsable: `Admin de Prueba`). Fila `crear` en auditoría |
| 3 | INTENTO | admin | Por consola: `await llamar('POST', '/api/contactos', { fullName: 'Regresion R2 CON-2 API', phone: '8095557777' })` | `409`, `body.error` = `"Ya existe un contacto con ese teléfono o correo. Confirma si quieres crearlo de todas formas."` y `body.details.candidatos` con los mismos candidatos. No se crea nada |
| 4 | ESCRIBE | admin | Igual que el 3 pero con `crear_igual: true` | `200`, `{ ok: true, contacto }`. Anótalo en §6 |
| 5 | INTENTO | admin | Repite el paso 1 con un **correo** ya existente (en `Correo`) y sin teléfono | Mismo panel "Ya existe un contacto parecido" |
| 6 | INTENTO | broker | Repite el paso 1 con el mismo teléfono | Mismo panel y, **según el código**, **lista también a contactos que no son del broker**: el aviso no filtra por alcance (decisión #19, deliberada; sin comprobar en navegador). Si el resultado cambia tras migrar, es un cambio de comportamiento que hay que decidir aparte |

#### CON-3 · Teléfono que no es dominicano

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | "Nuevo contacto" → Nombre `Regresion R2 CON-3`, Teléfono `+34 600 123 456` → "Crear contacto" | Se crea **sin aviso de duplicado**: solo los códigos de área 809, 829 y 849 se normalizan (`domain/telefono.ts`) |
| 2 | LEE | admin | Abre su ficha | Muestra el teléfono como se escribió (`+34 600 123 456`). **No hay** botón "Abrir WhatsApp" (el teléfono normalizado es nulo) |

#### CON-4 · Validaciones del alta

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | INTENTO | admin | Consola: `await llamar('POST', '/api/contactos', {})` | `400`, `body.fields.fullName` = `"Escribe el nombre del contacto."` |
| 2 | INTENTO | admin | Consola: `await llamar('POST', '/api/contactos', { fullName: 'x', email: 'no-es-correo' })` | `400`, `body.fields.email` = `"Escribe un correo válido."` |
| 3 | INTENTO | admin | Consola: `await llamar('POST', '/api/contactos', { fullName: 'x', sourceId: 'abc' })` | `400` con `error` = `"Revisa los datos enviados."`. **El texto de `fields.sourceId` no está traducido en el código**: anota el obtenido en la primera pasada y úsalo como referencia |
| 4 | LEE | admin | Comprueba que en `/contactos` no apareció ningún contacto `x` | No hay contactos nuevos |

#### CON-5 · Editar un contacto y borrarle el correo

**Línea base 30/09/2026: PASS**, pasos 1 a 3 (con `Contacto Cierre PR24` y su
correo `cierre.pr24@example.com`; los pasos 4 y 5 están pendientes). Por qué: `null` explícito borra el campo; ausente lo
deja como está.

Precondición: un contacto con correo (el de CON-1).

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre la ficha de `Regresion R2 CON-1` | Correo visible bajo el teléfono |
| 2 | ESCRIBE | admin | "Editar contacto" → vacía el campo Correo → "Guardar cambios" | El formulario se cierra. La ficha muestra `Sin correo` |
| 3 | LEE | admin | Mira "Historial" | Nueva línea `Edición` con el nombre del admin (línea base: `Admin de Prueba`) |
| 4 | ESCRIBE | admin | "Editar contacto" → cambia las Notas a `Editado por el guion R2` → "Guardar cambios" | Las notas cambian y **el correo sigue vacío** (un campo ausente no se toca) |
| 5 | INTENTO | admin | "Editar contacto" → vacía Nombre completo | El navegador bloquea el envío (el campo es `required`). Por consola: `await llamar('PATCH', '/api/contactos/ID_CONTACTO', { fullName: '' })` → `400`, `fields.fullName` = `"Escribe el nombre del contacto."` |

#### CON-6 · Buscar, filtrar y paginar

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Escribe `Regresion R2` en el buscador y Enter | La URL gana `?q=Regresion+R2`; solo contactos cuyo nombre, teléfono o correo lo contienen |
| 2 | LEE | admin | Elige Canal `Referido` | La URL gana `source_id=ID` y la lista se acota |
| 3 | LEE | admin | Busca `zzzz-no-existe` | Panel `Sin resultados` con `Ajusta la búsqueda o los filtros para ver más resultados.` |
| 4 | LEE | admin | Con más de 20 contactos, mira el pie de la tabla | `Página 1 de N`, "Anterior" deshabilitado; "Siguiente" lleva a `?page=2` y muestra `Página 2 de N` |

#### CON-7 · Asignar (reasignar) el responsable de un contacto

Por qué solo `all`: un broker `own` podría "regalarse" el contacto de otro con la
misma llamada que corrige un teléfono (deuda de F1, issue #21).

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre la ficha de `Regresion R2 CON-1` → "Editar contacto" | Aparece el campo **Responsable**, con la opción deshabilitada `Sin asignar — elige un broker` y la lista de usuarios con rol Broker activos |
| 2 | ESCRIBE | admin | Elige `Broker de Prueba` → "Guardar cambios" | La ficha muestra `Responsable: Broker de Prueba`; en la lista, columna Broker igual. Historial: línea `Edición` |
| 3 | LEE | broker | Con sesión de broker, abre `/contactos` | Ahora el contacto aparece en su lista (`own`) |
| 4 | ESCRIBE | asistente | Con sesión de asistente, abre la ficha de `Regresion R2 CON-1` (responsable: el broker) → "Editar contacto" → cambia las Notas → "Guardar cambios" | El asistente tiene `contacts:edit` con alcance `all`: ve la ficha aunque no sea suya, **ve el campo Responsable** (con `Broker de Prueba` seleccionado) y el guardado funciona sin cambiar el responsable. La lista del selector solo trae usuarios con rol Broker: no se puede "devolver" un contacto a un admin o asistente desde ahí |

#### CON-8 · Un broker no puede reasignar el responsable

**Línea base 30/09/2026: PARCIAL** (paso 1 confirmado; los pasos 3 y 4 son los
que faltan). El formulario del broker no muestra el campo
Responsable, así que desde la interfaz no se puede provocar el 403. El bloqueo
visual está confirmado; falta el 403 real, que se comprueba por llamada directa.

**Por qué se prueba por consola y no por la interfaz:** la interfaz no ofrece el
control (`puedeReasignar` es falso con alcance `own`), así que ningún clic llega
a provocar el error. El guardia que de verdad protege está en el **servidor**
(`editarContacto` en `src/application/contactos/casos-de-uso.ts`), y la única
forma de ejercitarlo es saltarse la interfaz. Esto es lo que demuestra que
ocultar el campo no es la seguridad: la seguridad es el 403.

Precondición: un contacto cuyo responsable es el broker (CON-7, paso 2). Se usa
**un contacto propio** a propósito: así el 403 sale del guardia y no de un 404
por alcance.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | broker | Abre la ficha del contacto propio → "Editar contacto" | **No** hay campo Responsable (bloqueo visual; ya confirmado el 30/09/2026) |
| 2 | LEE | broker | Anota el `ID_DE_UN_CONTACTO_PROPIO` de la URL `?contacto=` | — |
| 3 | INTENTO | broker | En la consola del navegador, con la sesión de broker abierta (este es el paso que cierra el PARCIAL): `await fetch('/api/contactos/ID_DE_UN_CONTACTO_PROPIO', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ brokerId: 2 }) }).then(async r => ({ status: r.status, body: await r.json() }));` | `status: 403` y `body: { error: "Solo un administrador o asistente puede reasignar el responsable de un contacto." }`. El guardia salta antes de abrir la transacción, así que `2` no necesita ser un broker real |
| 4 | LEE | broker | Recarga la ficha | El responsable **no cambió** y el Historial **no** tiene una línea `Edición` nueva |
| 5 | INTENTO | broker | Consola: `await llamar('PATCH', '/api/contactos/ID_DE_UN_CONTACTO_PROPIO', { notes: 'nota del broker' })` | `200`: editar su propio contacto sin tocar `brokerId` sí está permitido |

#### CON-9 · Un broker no ve ni toca contactos ajenos

**Línea base 30/09/2026: PASS**, pasos 1 y 2 (`/contactos?contacto=19`, contacto
de `Asistente de Prueba`; los pasos 3 a 5, por API, están pendientes).

Precondición: un contacto cuyo responsable **no** es el broker: créalo como
asistente (CON-1 con sesión de asistente, nombre `Regresion R2 CON-9`) y anota su
id.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | broker | Abre `/contactos` | Solo contactos cuyo Broker es el propio. `Regresion R2 CON-9` **no** está. El contador es menor que el del admin |
| 2 | LEE | broker | Abre `/contactos?contacto=ID_AJENO` (línea base: `19`) | **No** se abre la ficha: la página se pinta con el listado de su alcance y sin panel lateral. Ningún dato del contacto ajeno |
| 3 | INTENTO | broker | Consola: `await llamar('PATCH', '/api/contactos/ID_AJENO', { notes: 'x' })` | `404` y `error` = `"No se encontró el registro."` (no `403`: no se le confirma que existe) |
| 4 | INTENTO | broker | Consola: `await llamar('DELETE', '/api/contactos/ID_AJENO')` | `403`, `"Sin permiso para delete sobre contacts."` (el permiso se comprueba antes que el alcance) |
| 5 | LEE | admin | Comprueba el contacto ajeno | Sin cambios: notas vacías, sin nuevas líneas de Historial |

#### CON-10 · Eliminar un contacto

Por qué: el borrado es lógico (`deleted_at`); solo el admin tiene `contacts:delete`.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | Abre la ficha de `Regresion R2 CON-3` → "Eliminar" | Cuadro de confirmación: `¿Eliminar a Regresion R2 CON-3? Podrás verlo en la papelera, no se borra de la base.` |
| 2 | ESCRIBE | admin | Acepta | La ficha se cierra; el contacto desaparece de la lista y el contador baja 1. Fila `eliminar` en auditoría. Aparece en **Configuración → Papelera** (PAP-1) |
| 3 | INTENTO | asistente | En la ficha de otro contacto pulsa "Eliminar" y acepta | El botón **se muestra aunque el rol no puede** (hoy es así). Sale un `alert()`: `Sin permiso para delete sobre contacts.` El contacto sigue en la lista |
| 4 | INTENTO | broker | Igual que el 3 con un contacto propio | Mismo `alert()`: `Sin permiso para delete sobre contacts.` |

---

### 4.2 leads

Rutas: `POST /api/leads`, `POST /api/leads/externo` (pública, con token),
`PATCH /api/leads/:id` (asignar), `POST /api/leads/:id/convertir`,
`POST /api/leads/:id/descartar`. Página: `/leads` (`q`, `source_id`, `status`,
`page`, `lead`). Permisos: `leads` y, para convertir, también `deals:create`.

Estados: `Nuevo`, `Asignado`, `Contactado`, `Convertido`, `Descartado`.

#### LEA-1 · Registrar un lead manual

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre `/leads` | Título "Bandeja de leads", botón "Registrar lead", filtros por origen y estado, contador "N leads". Columnas: Lead / Proyecto / Origen / Responsable / Estado / Presupuesto |
| 2 | ESCRIBE | admin | "Registrar lead" → (modal "Registrar lead manual") Nombre completo `Regresion R2 LEA-1`, Teléfono `849-555-0210`, Correo `regresion.r2.lea1@example.com`, Proyecto de interés `Proyecto Regresion R2`, Zona `Punta Cana`, Canal `Referido`, Operación `Venta` → "Registrar lead" | El modal se cierra. Se crean **dos filas**: un contacto nuevo (con `broker_id` del admin) y el lead, cada uno con su fila de auditoría `crear` |
| 3 | LEE | admin | Mira la fila del lead | Estado con etiqueta `Nuevo`, Origen `Referido`, Proyecto = el texto libre, Presupuesto `Por definir`. Responsable: `Sugerido: <broker>` si la regla de asignación sugirió alguno (`domain/asignacion-lead.ts`) o `Sin asignar`. Nunca un responsable confirmado: decisión #21 |
| 4 | LEE | admin | Abre `/contactos` y busca `Regresion R2 LEA-1` | El contacto existe |
| 5 | INTENTO | admin | Repite el paso 2 con el mismo teléfono y sin confirmar | Panel "Ya existe un contacto parecido" con "Crear de todas formas" (igual que CON-2). Sin cambios en la base |
| 6 | ESCRIBE | broker | Como broker, registra `Regresion R2 LEA-1 broker` (nombre y teléfono distintos) | **Según el código** (sin comprobar en navegador: ver §3): el modal se cierra y el lead **no aparece** en "Mis leads", porque se guarda sin `broker_id` y la lista `own` filtra por ese campo. Si aparece, anótalo: es una diferencia con lo leído en el código |

#### LEA-2 · Capturar un lead externo (webhook)

Por qué: es la única entrada pública del sistema (decisión #20). No usa sesión;
se autentica con el token de la cabecera `x-webhook-token`, y es **idempotente**
por `externalId`.

Precondición: la app en local y `LEADS_WEBHOOK_TOKEN` exportada en tu terminal
(`export LEADS_WEBHOOK_TOKEN=...`, sin pegar su valor en ningún archivo). Los
comandos usan `BASE=http://localhost:3000`.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | INTENTO | (sin sesión) | `curl -i -X POST "$BASE/api/leads/externo" -H "content-type: application/json" -d '{"externalId":"r2-lea2-a","fullName":"Regresion R2 LEA-2"}'` | `401`, `{"error":"No autorizado."}`. No se crea nada |
| 2 | INTENTO | (sin sesión) | Igual con `-H "x-webhook-token: incorrecto"` | `401`, el mismo mensaje (no distingue entre falta y mal token) |
| 3 | INTENTO | (sin sesión) | Con el token correcto (`-H "x-webhook-token: $LEADS_WEBHOOK_TOKEN"`) y cuerpo `{"fullName":"Regresion R2 LEA-2"}` | `400`, `fields.externalId` = `"externalId es obligatorio."` |
| 4 | INTENTO | (sin sesión) | Con el token y cuerpo `{"externalId":"r2-lea2-a"}` | `400`, `fields.fullName` = `"Falta el nombre del contacto."` |
| 5 | ESCRIBE | (sin sesión) | Con el token y cuerpo `{"externalId":"r2-lea2-a","fullName":"Regresion R2 LEA-2","phone":"849-555-0220","email":"regresion.r2.lea2@example.com","projectInterestText":"Proyecto Regresion R2","operationType":"sale"}` | `200`, `{"ok":true,"lead":{...},"creado":true}`. Anota `lead.id` |
| 6 | ESCRIBE | (sin sesión) | **Repite exactamente el paso 5** | `200`, `creado: false` y **el mismo `lead.id`**. No se crea un segundo lead ni una segunda fila de auditoría |
| 7 | ESCRIBE | (sin sesión) | Cuerpo con otro `externalId` (`r2-lea2-b`) y el **mismo teléfono** | `200`, `creado: true`; el lead nuevo se enlaza al **contacto que ya existía** (no crea uno nuevo): un webhook no puede responder "¿de todas formas?" |
| 8 | LEE | admin | Abre `/leads` | Los leads externos aparecen con Estado `Nuevo`, Responsable `Sugerido: …` o `Sin asignar` |
| 9 | LEE | admin | Abre la ficha de `Regresion R2 LEA-2` y mira "Historial" | La línea `Creación` **sin autor propio**: muestra `Usuario eliminado` (la fila de auditoría del webhook tiene `user_id` nulo). Es lo que hace hoy el código |

#### LEA-3 · Asignar el responsable de un lead

Precondición: `Broker de Prueba` con perfil de broker (§2.1, punto 3). El lead es
`Regresion R2 LEA-1`.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre la ficha del lead (`?lead=ID`) | "Ficha de lead" con Interés, Responsable, Estado, Recibido. Bajo Responsable, un selector "Elegir broker a asignar" con `Elegir broker…`, los brokers activos con perfil y ` (sugerido)` junto al sugerido, y el botón "Asignar" (deshabilitado sin elección) |
| 2 | ESCRIBE | admin | Elige `Broker de Prueba` → "Asignar" | La ficha pasa a mostrar `Broker de Prueba` como Responsable; en la lista, columna Responsable igual. **El estado sigue en `Nuevo`.** Fila de auditoría `asignar` |
| 3 | LEE | admin | Mira "Historial" | Una línea nueva cuyo título es el texto crudo `asignar`: el mapa de etiquetas de `_ui/historial.tsx` no tiene esta acción y muestra el valor tal cual. Es lo que hace hoy; lo mismo pasa con `descartar` en LEA-5. Si la migración le pone etiqueta, anótalo como cambio intencional, no como fallo silencioso |
| 4 | INTENTO | admin | Consola: `await llamar('PATCH', '/api/leads/ID_LEAD', { brokerId: ID_DEL_ADMIN })` (un usuario que no es broker) | `400`, `error` = `"Ese usuario no es un broker activo."`, `fields.brokerId` = `"Elige un broker activo."` |
| 5 | LEE | broker | Abre `/leads` | Ahora el lead aparece en "Mis leads" |
| 6 | ESCRIBE | asistente | Repite el paso 2 con otro lead | Mismo resultado: el asistente tiene `leads:edit` `all` |

#### LEA-4 · Convertir un lead en negocio

Por qué: la conversión es transaccional (negocio + estado del lead + enlace) y
exige permiso sobre **dos** recursos: `leads:edit` y `deals:create`.

Precondición: el lead de LEA-3, asignado a `Broker de Prueba`, en estado `Nuevo`.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | En la ficha → "Convertir a negocio" | Cuadro de confirmación: `¿Convertir a Regresion R2 LEA-1 en negocio? Se creará en la primera etapa del embudo.` |
| 2 | ESCRIBE | admin | Acepta | La ficha pasa a Estado `Convertido` y desaparecen "Convertir a negocio" y "Descartar". Anota en §6 que nació un negocio |
| 3 | LEE | admin | Abre `/pipeline` | En la columna "Nuevo" hay una tarjeta `Regresion R2 LEA-1`, con `Por definir`, `Sin próxima acción` y el responsable `Broker` (el broker confirmado del lead, **no** la sugerencia). Anota el `?deal=ID` |
| 4 | LEE | admin | Mira el Historial del lead | Línea `Conversión` |
| 5 | INTENTO | admin | Consola: `await llamar('POST', '/api/leads/ID_LEAD/convertir')` | `409`, `"Este lead ya fue convertido a negocio."` |
| 6 | ESCRIBE | admin | Convierte un lead **sin responsable** (uno del paso LEA-2 o uno nuevo) | El negocio queda con el admin como responsable (quien convierte), no sin dueño |
| 7 | ESCRIBE | broker | Como broker, convierte un lead suyo | Funciona: tiene `leads:edit own` y `deals:create own` |

#### LEA-5 · Descartar un lead

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | En la ficha de un lead `Nuevo` → "Descartar" | Aparece el cuadro "Motivo del descarte" con los botones "Cancelar" y "Confirmar descarte" |
| 2 | INTENTO | admin | "Confirmar descarte" con el motivo vacío | Texto rojo: `Escribe el motivo del descarte.` Sin cambios |
| 3 | ESCRIBE | admin | Escribe `Dejó de responder` → "Confirmar descarte" | Estado `Descartado`; la ficha muestra `Motivo del descarte: Dejó de responder` y desaparecen los botones de acción. Fila de auditoría `descartar` |
| 4 | INTENTO | admin | Consola: `await llamar('POST', '/api/leads/ID_DESCARTADO/convertir')` | `409`, `"Este lead fue descartado; no se puede convertir."` |
| 5 | INTENTO | admin | Consola: `await llamar('POST', '/api/leads/ID_DESCARTADO/descartar', { discardReason: 'otra vez' })` | `409`, `"Este lead ya está descartado."` |
| 6 | INTENTO | admin | Consola: `await llamar('POST', '/api/leads/ID_CONVERTIDO/descartar', { discardReason: 'x' })` | `409`, `"Este lead ya fue convertido a negocio; no se puede descartar."` |
| 7 | INTENTO | admin | Consola: `await llamar('POST', '/api/leads/ID_LEAD/descartar', {})` | `400`, `"Revisa los datos enviados."` con `fields.discardReason` = `"Escribe el motivo del descarte."` |

#### LEA-6 · Filtros del listado

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Filtra por Estado `Descartado` | Solo leads descartados; la URL gana `status=discarded` |
| 2 | LEE | admin | Filtra por origen `Referido` | La URL gana `source_id=ID` y la lista se acota |
| 3 | LEE | admin | Busca un nombre que no existe | `Sin resultados` y `Ajusta la búsqueda o los filtros para ver más resultados.` |
| 4 | LEE | admin | Solo si la base no tiene ningún lead (sin filtros) | `Sin leads todavía` / `Registra el primero con “Registrar lead” o espera a que llegue por el portal.` Si la base ya tiene leads, `N/A` |

#### LEA-7 · Un broker no ve ni toca leads ajenos

Precondición: un lead cuyo responsable **no** es el broker (por ejemplo el de
LEA-2, sin asignar, o uno asignado a otro).

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | broker | Abre `/leads` | Título "Mis leads"; solo leads con Responsable el propio |
| 2 | LEE | broker | Abre `/leads?lead=ID_AJENO` | Sin ficha lateral; ningún dato del lead ajeno |
| 3 | INTENTO | broker | Consola: `await llamar('POST', '/api/leads/ID_AJENO/convertir')` | `404`, `"No se encontró el registro."` |
| 4 | INTENTO | broker | Consola: `await llamar('POST', '/api/leads/ID_AJENO/descartar', { discardReason: 'x' })` | `404`, `"No se encontró el registro."` |
| 5 | INTENTO | broker | Consola: `await llamar('PATCH', '/api/leads/ID_AJENO', { brokerId: ID_BROKER_PRUEBA })` | `404`, `"No se encontró el registro."` |

---

### 4.3 pipeline

Rutas: `PATCH /api/pipeline/:id` (editar monto, probabilidad, comisión, fecha),
`PATCH /api/pipeline/:id/etapa` (mover, cerrar, perder),
`POST /api/pipeline/:id/propiedades`, `PATCH` y `DELETE
/api/pipeline/:id/propiedades/:propId`. Página: `/pipeline` (`deal`). Permisos:
`deals` (admin y asistente `all`; broker `own`).

**Las reglas por etapa** (`domain/transicion-etapa.ts`, por **posición** y no por
nombre): Contactado (2) exige una actividad de contacto **completada**;
Presentación (3), una próxima acción pendiente con responsable y fecha;
Preselección (4), al menos una propiedad de interés; Negociación (5), monto,
probabilidad, comisión y fecha estimada; Cierre exige monto y unidad principal;
Perdido exige motivo. "Nuevo" no exige nada.

**Sobre cómo mover:** usa el selector "Cambiar de etapa" de la ficha; es lo más
reproducible. Repite **una vez** el flujo arrastrando la tarjeta a la columna,
porque el arrastre usa otro camino en la vista. Los errores llegan en un
`alert()` nativo con el texto literal.

**Las actividades que exigen las reglas no se pueden crear desde ninguna
pantalla** (ni "Nueva tarea" ni "Nueva cita" envían `dealId`): se crean por
consola, con `POST /api/actividades`.

#### PIP-1 · Ver el tablero

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre `/pipeline` | Título "Pipeline", "Valor activo" con el total de montos de negocios abiertos, dos filtros ("Todos los brokers", "Todos los proyectos") y `Arrastra para cambiar de etapa` |
| 2 | LEE | admin | Mira las columnas | Siete, en este orden: Nuevo, Contactado, Presentación, Preselección, Negociación, Cierre, Perdido, cada una con su contador. Las vacías muestran `Suelta aquí` |
| 3 | LEE | admin | Mira una tarjeta | Canal (o `Sin canal`), nombre del contacto, proyecto principal (o `Interés general`), monto (o `Por definir`), próxima acción con fecha corta (o `Sin próxima acción`), responsable |
| 4 | LEE | admin / broker | Compara el total de tarjetas | `all` (admin): todos los negocios; `own` (broker): solo los suyos |

#### PIP-2 · Mover a Contactado

Precondición: el negocio de LEA-4 en "Nuevo" (`ID_NEGOCIO`).

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | INTENTO | admin | Ficha → "Cambiar de etapa" → `Contactado` | `alert()`: `Para mover el negocio a esta etapa hace falta registrar al menos una actividad de contacto.` La tarjeta no se mueve |
| 2 | ESCRIBE | admin | Consola: `await llamar('POST', '/api/actividades', { activityType: 'call', title: 'Llamada de regresión', dealId: ID_NEGOCIO, status: 'completed' })` | `200`, `{ ok: true, actividad }`. Fila de auditoría `crear` (actividad) |
| 3 | ESCRIBE | admin | Repite el paso 1 | La tarjeta pasa a "Contactado". En la ficha, Etapa `Contactado`; Historial: línea `Cambio de etapa`. Además se escribe una fila en `deal_stage_history` |
| 4 | INTENTO | admin | Con otro negocio, crea una actividad **pendiente** (no completada) y de tipo `task` o `note`, y prueba mover | Sigue bloqueado con el mismo mensaje: solo cuentan `call`, `meeting`, `whatsapp` o `email` **completadas** |

#### PIP-3 · Mover a Presentación

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | INTENTO | admin | "Cambiar de etapa" → `Presentación` | `alert()`: `Para mover el negocio a esta etapa hace falta una próxima acción con responsable y fecha.` |
| 2 | ESCRIBE | admin | Consola (con `AAAA-MM-DD` = hoy y una hora **posterior a la actual**): `await llamar('POST', '/api/actividades', { activityType: 'meeting', title: 'Presentación de regresión', dealId: ID_NEGOCIO, startsAt: 'AAAA-MM-DDT23:30:00-04:00' })` | `200`. El negocio queda apuntando a esa actividad como próxima acción. La tarjeta muestra `Presentación de regresión · <día mes>` en lugar de `Sin próxima acción`. Anota el título: PIP-7 comprueba que se cancela |
| 3 | ESCRIBE | admin | Repite el paso 1 | La tarjeta pasa a "Presentación"; Historial: `Cambio de etapa` |

#### PIP-4 · Mover a Preselección (y propiedades de interés)

Precondición: existe un proyecto activo con al menos una unidad (PRO-1 y PRO-2).

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | INTENTO | admin | "Cambiar de etapa" → `Preselección` | `alert()`: `Para mover el negocio a esta etapa hace falta al menos una propiedad de interés.` |
| 2 | ESCRIBE | admin | En "Propiedades de interés" → "+ Agregar" → Proyecto `Proyecto Regresion R2`, Unidad `Interés general`, casilla "Marcar como principal" (viene marcada) → "Agregar" | En la lista: `Proyecto Regresion R2 · Principal`. Fila de auditoría `crear` (propiedad) |
| 3 | ESCRIBE | admin | Repite el paso 1 | Pasa a "Preselección" |
| 4 | ESCRIBE | admin | "+ Agregar" → mismo Proyecto, Unidad `R2-01`, casilla desmarcada → "Agregar" | Aparece `Proyecto Regresion R2 · Unidad R2-01`, sin "Principal" |
| 5 | ESCRIBE | admin | En esa fila, "Marcar principal" | `· Principal` pasa a la fila de `R2-01` y **desaparece** de la otra: solo hay una principal |
| 6 | ESCRIBE | admin | "+ Agregar" una tercera fila (mismo Proyecto, Unidad `Interés general`, casilla desmarcada) y pulsa su icono de basura | Cuadro `¿Quitar Proyecto Regresion R2 de los intereses del negocio?` (con unidad, la forma es `proyecto · unidad`). Al aceptar, desaparece la fila. Es un borrado real de `deal_properties`, con fila de auditoría `eliminar` |
| 7 | LEE | admin | Mira la lista | **Estado de salida para PIP-7:** dos filas: `Proyecto Regresion R2` (general, sin principal) y `Proyecto Regresion R2 · Unidad R2-01 · Principal` |

#### PIP-5 · Editar monto, probabilidad, comisión y fecha

Por qué el monto va **en centavos**: decisión #14 (dinero en centavos, nunca coma
flotante). `10000000` son 100 000,00 USD.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | Ficha → "Editar" (arriba a la derecha) → modal "Editar negocio" con `Monto (USD, en centavos)`, `Probabilidad (%)`, `Comisión (%)`, `Fecha estimada de cierre` | El modal se abre con los valores actuales |
| 2 | ESCRIBE | admin | Solo Monto = `10000000` → "Guardar cambios" | Se cierra. La ficha muestra el monto con formato de moneda (100 000) en vez de `Por definir`. Fila de auditoría `editar`. La tarjeta muestra el monto |
| 3 | INTENTO | admin | Consola: `await llamar('PATCH', '/api/pipeline/ID_NEGOCIO', { probability: 150 })` | `400` con `error` = `"Revisa los datos enviados."` (el texto de `fields.probability` no está traducido en el código: anótalo) |
| 4 | LEE | broker | Abre un negocio ajeno (`/pipeline?deal=ID_AJENO`) y prueba `await llamar('PATCH', '/api/pipeline/ID_AJENO', { probability: 10 })` | Sin ficha; la llamada responde `404`, `"No se encontró el registro."` |

#### PIP-6 · Mover a Negociación

Los cuatro requisitos se reportan **de uno en uno**, en este orden: monto,
probabilidad, comisión, fecha.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | INTENTO | admin | Con solo el monto puesto (PIP-5), "Cambiar de etapa" → `Negociación` | `alert()`: `Para mover el negocio a esta etapa hace falta la probabilidad.` |
| 2 | ESCRIBE | admin | "Editar" → Probabilidad `80` → "Guardar cambios"; repite el paso 1 | `alert()`: `Para mover el negocio a esta etapa hace falta el porcentaje de comisión.` |
| 3 | ESCRIBE | admin | "Editar" → Comisión `5` → "Guardar cambios"; repite | `alert()`: `Para mover el negocio a esta etapa hace falta la fecha estimada de cierre.` |
| 4 | ESCRIBE | admin | "Editar" → Fecha estimada de cierre (una fecha futura) → "Guardar cambios"; repite | Pasa a "Negociación". La ficha muestra Probabilidad `80%`, Comisión `5.00%` |
| 5 | INTENTO | admin | Con un negocio **sin monto**, intenta `Negociación` | `alert()`: `Para mover el negocio a esta etapa hace falta el monto.` |

#### PIP-7 · Cerrar el negocio (los 8 pasos)

Por qué es el flujo más importante del milestone: cuando `etapaDestino.kind` es
`won`, el cambio de etapa dispara el cierre transaccional de `_cierre.ts`. Si
cualquiera de los pasos falla, **ninguno** queda escrito. Es lo que R3.1 mueve de
sitio, así que hay que tener la línea base **antes** de tocarlo.

Datos de la prueba: monto `10000000` (USD 100 000,00), comisión `5` % (`500`
puntos básicos) y reparto por defecto 50 % / 50 %. Cálculo esperado: comisión
total `500000` centavos (USD 5 000,00); broker `250000`; agencia `250000`.

Precondiciones:

- El negocio de LEA-4, con responsable `Broker de Prueba` y el estado de salida
  de PIP-4 (propiedad con unidad `R2-01` como principal) y PIP-5/PIP-6 (monto,
  probabilidad, comisión y fecha puestos).
- La actividad pendiente `Presentación de regresión` de PIP-3, con fecha de hoy
  **posterior a la hora actual**. Si la pasada se hace pasada esa hora, el paso 7
  no cancelará nada y saldrá `FAIL`; crea otra con una hora posterior.
- La meta de la compañía del mes fijada (MET-2), para que el anillo se lea.

**Antes de cerrar, anota** (para comparar):

| Dónde | Qué anotar |
|---|---|
| `/metas` (admin, periodo actual) | "N de M negocios logrados" de la compañía; `Logrados` de la fila de `Broker de Prueba` |
| `/brokers` (admin) | `Ventas del año` y nivel de `Broker de Prueba` |
| Proyecto `Proyecto Regresion R2` → unidades | Estado de la unidad `R2-01` (esperado `Disponible`) |
| `/comisiones` (admin, periodo actual) | Número de filas y KPI "por aprobar" |
| `/tareas` (admin) | Que `Presentación de regresión` aparece en la cola (está pendiente y vence hoy) |

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | INTENTO | admin | En el negocio de LEA-4, marca como principal la fila `Proyecto Regresion R2` (la general, sin unidad) con "Marcar principal" y "Cambiar de etapa" → `Cierre` | `alert()`: `Para cerrar el negocio hace falta definir la unidad principal entre las propiedades de interés.` (una propiedad sin unidad no cuenta como unidad principal). La tarjeta no se mueve |
| 2 | ESCRIBE | admin | Marca de nuevo como principal la fila de la unidad `R2-01` | `Principal` vuelve a esa fila |
| 3 | INTENTO | admin | **Negocio auxiliar** (convierte otro lead, LEA-4; añádele `R2-01` como principal): sin monto, "Cambiar de etapa" → `Cierre` | `alert()`: `Para cerrar el negocio hace falta el monto final.` |
| 4 | INTENTO | admin | Mismo negocio auxiliar, tras ponerle monto `10000000` pero **sin comisión** (nunca pasó por Negociación): `Cierre` | `alert()`: `Para cerrar el negocio hace falta el porcentaje de comisión.` (el negocio auxiliar se pierde luego en PIP-9) |
| 5 | ESCRIBE | admin | En el negocio de LEA-4 (monto, comisión y unidad `R2-01` principal), "Cambiar de etapa" → `Cierre` | La tarjeta pasa a la columna "Cierre". **Los ocho pasos de la tabla siguiente ocurren juntos** |

Los ocho pasos de `MAPEO_FRONTEND_CRM.md` §10.2, con dónde verlos:

| Paso | Qué hace el cierre | Cómo se comprueba | Qué debe verse |
|---|---|---|---|
| 1 | Sella `closed_at` y el monto final | Ficha del negocio; SQL `select id, closed_at, amount_cents from deals where id = ID_NEGOCIO;` | Etapa `Cierre`, **sin** botón "Editar" y **sin** "Cambiar de etapa"; `closed_at` con valor; `amount_cents = 10000000` |
| 2 | Escribe `deal_stage_history` | SQL `select from_stage_id, to_stage_id, changed_by from deal_stage_history where deal_id = ID_NEGOCIO order by id;` | Una fila nueva cuya etapa destino es la de Cierre y `changed_by` = el admin |
| 3 | Marca la unidad principal como vendida o reservada | Proyecto → unidades | La unidad `R2-01` pasa de `Disponible` a `Vendida` (operación Venta; sería `Reservada` si fuera Alquiler) |
| 4 | Suma a las metas del broker y de la compañía | `/metas` | El hero de la compañía pasa a "N+1 de M negocios logrados"; `Logrados` del broker sube 1. SQL: `select broker_id, achieved_deals, achieved_amount_cents from goals where year = AAAA and month = MM;` (dos filas: broker y compañía, `achieved_amount_cents` +10000000). Los `target_*` **no cambian** |
| 5 | Recalcula `annual_sales_cents` y el nivel del broker | `/brokers` | `Ventas del año` de `Broker de Prueba` = la **suma de los negocios ganados del año** de ese broker (se recalcula, no se incrementa: si antes había un acumulado de una versión anterior, puede no ser exactamente +100 000). El nivel sale de los umbrales de `domain/cierre-negocio.ts` (Junior por debajo de 500 000) |
| 6 | Crea la comisión en `pending` | `/comisiones` | Fila nueva: contacto, monto de venta 100 000, `5%`, `50% broker / 50% agencia`, `Broker de Prueba`, Estado `Pendiente`. SQL: `select total_commission_cents, broker_amount_cents, agency_amount_cents, status from commissions where deal_id = ID_NEGOCIO;` → `500000`, `250000`, `250000`, `pending`. KPI "por aprobar" +1 |
| 7 | Cancela las actividades futuras pendientes del negocio | `/tareas`; SQL `select title, status from activities where deal_id = ID_NEGOCIO;` | `Presentación de regresión` **desaparece** de la cola y su estado es `cancelled`. La llamada completada de PIP-2 sigue `completed` |
| 8 | Audita | Historial del negocio | Línea `Cierre` con el nombre del admin |

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 6 | LEE | admin | Recorre la tabla de los ocho pasos | Los ocho coinciden |
| 7 | INTENTO | admin | Consola: `await llamar('PATCH', '/api/pipeline/ID_NEGOCIO', { amountCents: 1 })` | `409`, `"Este negocio ya está cerrado; no se puede editar."` |
| 8 | INTENTO | admin | Consola: `await llamar('POST', '/api/pipeline/ID_NEGOCIO/propiedades', { projectId: ID_PROYECTO })` | `409`, el mismo mensaje |
| 9 | INTENTO | admin | Arrastra la tarjeta de "Cierre" a "Negociación" | `alert()`: `Este negocio ya está cerrado (ganado o perdido) y no puede cambiar de etapa.` La tarjeta vuelve a su sitio |

Nota: el cierre **no exige haber pasado por las etapas intermedias**; un negocio
con monto, comisión y unidad principal puede saltar de "Nuevo" a "Cierre".

#### PIP-8 · Un negocio cerrado solo se lee

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre la ficha de un negocio en "Cierre" o "Perdido" | No hay "Editar", "+ Agregar", "Marcar principal", papelera ni "Cambiar de etapa". Se ve `Motivo de pérdida` si fue perdido |

#### PIP-9 · Perder un negocio

Por qué: el motivo es obligatorio **antes** de llamar al servidor, y sale del
catálogo de motivos activos (seed: `Precio fuera de presupuesto`, `Eligió otra
opción`, `No consiguió financiamiento`, `Dejó de responder`, `Zona no deseada`,
`Solo consultaba`, `Otro`).

Precondición: un segundo negocio abierto (el negocio auxiliar de PIP-7, o convierte otro lead, LEA-4).

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Ficha → "Cambiar de etapa" → `Perdido` | Se abre el modal "Marcar negocio como perdido" con `Motivo` (`Selecciona un motivo…`, obligatorio) y `Comentario (opcional)`. "Marcar como perdido" está deshabilitado mientras no haya motivo |
| 2 | ESCRIBE | admin | Motivo `Precio fuera de presupuesto`, Comentario `Regresion R2 PIP-9` → "Marcar como perdido" | La tarjeta pasa a la columna "Perdido". La ficha muestra `Motivo de pérdida: Precio fuera de presupuesto — Regresion R2 PIP-9`. Historial: `Marcado como perdido`. Fila en `deal_stage_history` |
| 3 | LEE | admin | Mira metas y comisiones | **No** cambian (perder no toca metas ni crea comisión) |
| 4 | INTENTO | admin | Arrastra la tarjeta perdida a "Nuevo" | `alert()`: `Este negocio ya está cerrado (ganado o perdido) y no puede cambiar de etapa.` |
| 5 | INTENTO | admin | Por API, `PATCH /api/pipeline/ID/etapa` con `stageId` de Perdido y sin `lossReasonId` | **Pendiente de detallar:** el código responde `409` con `"Para marcar el negocio como perdido hace falta un motivo del catálogo de motivos de pérdida."`, pero hace falta el id de la etapa Perdido y ninguna pantalla lo muestra. Si se quiere ejecutar, sacarlo de DevTools → Network al perder el negocio del paso 2 |
| 6 | ESCRIBE | broker | Con sesión de broker, pierde un negocio propio | Funciona igual (`deals:edit own`) |

#### PIP-10 · Un broker no ve ni toca negocios ajenos

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | broker | Abre `/pipeline` | Solo las tarjetas de negocios con él como responsable; el contador de cada columna lo refleja |
| 2 | LEE | broker | Abre `/pipeline?deal=ID_AJENO` | Sin ficha lateral |
| 3 | INTENTO | broker | Consola: `await llamar('PATCH', '/api/pipeline/ID_AJENO/etapa', { stageId: ID_ETAPA })` (id de etapa cualquiera, por ejemplo uno visible en Network al mover un negocio propio) | `404`, `"No se encontró el registro."` |

---

### 4.4 actividades

Rutas: `POST /api/actividades`, `PATCH` y `DELETE /api/actividades/:id`,
`GET /api/actividades/ics`. Páginas: `/tareas` y `/agenda` (`semana`). Permisos:
`activities`; admin y asistente `all`, broker `own` (el alcance se mide sobre el
**responsable de la actividad**, no sobre el negocio). `delete`: solo admin.

#### ACT-1 · Crear una tarea

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre `/tareas` | Título "Tareas y actividades", botón "Nueva tarea", panel "Prioridades" con `N pendientes` y, para admin, el panel "Carga del equipo" |
| 2 | ESCRIBE | admin | "Nueva tarea" → Título `Regresion R2 ACT-1`, sin fecha, Prioridad `Normal`, Responsable `Quien la crea` → "Crear tarea" | El modal se cierra. La tarea aparece con `Sin fecha límite · <nombre del admin>` y la etiqueta `Pendiente`. Fila de auditoría `crear` |
| 3 | ESCRIBE | admin | Otra tarea con Fecha límite = hoy | Aparece como `Hoy, <hora>` |
| 4 | ESCRIBE | admin | Otra con una fecha pasada | Aparece como `Vencida — AAAA-MM-DD, <hora>` |
| 5 | ESCRIBE | admin | Otra con fecha **futura** | **No** aparece en la cola (la cola es: pendientes sin fecha, de hoy o vencidas); aparece en `/agenda` la semana que corresponde, si cae de lunes a sábado |
| 6 | INTENTO | admin | "Crear tarea" con el título vacío | El navegador bloquea el envío (`required`). Por consola: `await llamar('POST', '/api/actividades', { activityType: 'task' })` → `400`, `fields.title` = `"Escribe el asunto de la actividad."` |

#### ACT-2 · Completar una tarea

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | Marca la casilla de `Regresion R2 ACT-1` | La tarea **sale de la cola** y el contador baja 1. Fila de auditoría `editar`; `completed_at` con valor |

#### ACT-3 · Agendar una cita

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre `/agenda` | Título "Citas y agenda", botones "Exportar .ics" y "Nueva cita", navegación de semana |
| 2 | ESCRIBE | admin | "Nueva cita" → Asunto `Regresion R2 ACT-3`, un Día de la semana, Hora `09:00`, Responsable `Quien la crea`, Ubicación `Oficina` → "Agendar cita" | Se cierra. La cita aparece en ese día con el asunto y `<hora> · <responsable>` |
| 3 | LEE | admin | Cambia de semana con los controles y vuelve | La URL lleva `?semana=AAAA-MM-DD` y la cita aparece solo en su semana |

#### ACT-4 · Exportar `.ics`

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | En la semana de ACT-3, pulsa "Exportar .ics" | Se descarga `agenda-AAAA-MM-DD.ics` (la fecha es el **lunes** de la semana). Tipo `text/calendar` |
| 2 | LEE | admin | Abre el archivo en un editor de texto | Empieza por `BEGIN:VCALENDAR`, `VERSION:2.0`, `PRODID:-//Quisqueya Home CRM//ES`; por cada cita: `BEGIN:VEVENT`, `UID:activity-ID@quisqueyahome.com`, `DTSTART:…Z`, `DTEND:…Z` (una hora después si no hay fin), `SUMMARY:Regresion R2 ACT-3`, `LOCATION:Oficina`, `END:VEVENT`; termina en `END:VCALENDAR` |
| 3 | LEE | broker | Exporta desde su sesión | El archivo trae solo **sus** citas |

#### ACT-5 · Alcance de tareas y agenda

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | broker | Abre `/tareas` y `/agenda` | Solo actividades con él como responsable. **No** ve el panel "Carga del equipo" |
| 2 | LEE | asistente | Abre `/tareas` | Ve las actividades de todos y el panel "Carga del equipo" (alcance `all`) |

#### ACT-6 · Borrar actividad y permisos

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | asistente | Consola: `await llamar('POST', '/api/actividades', { activityType: 'note', title: 'Regresion R2 ACT-6' })` | `200`; anota `body.actividad.id` |
| 2 | INTENTO | asistente | Consola: `await llamar('DELETE', '/api/actividades/ID')` | `403`, `"Sin permiso para delete sobre activities."` |
| 3 | ESCRIBE | admin | Mismo `DELETE` desde la sesión del admin | `200`, `{ ok: true }`. La actividad deja de listarse. Fila `eliminar`. **No** aparece en la papelera (la papelera solo cubre seis entidades) |

---

### 4.5 proyectos

Incluye unidades, fases de obra y fotos. Rutas: `/api/proyectos` (alta),
`/api/proyectos/:id` (editar, borrar), `.../unidades` y `.../unidades/:unitId`,
`.../fases`, `.../fases/:faseId`, `.../fases/:faseId/fotos` y
`.../fotos/:fileId`. Páginas: `/propiedades`, `/propiedades/:slug`, `/avances`
(`proyecto`, `fase`). Permisos: `projects`, `units`, `construction_phases`.
Admin: todo. Asistente: crea y edita proyectos y unidades; en fases, solo ve y
edita (no crea ni borra). Broker: solo ve, y solo los proyectos donde es el
responsable.

#### PRO-1 · Crear un proyecto

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre `/propiedades` | Título "Propiedades internas", botón "Nuevo proyecto" |
| 2 | ESCRIBE | admin | "Nuevo proyecto" → Nombre del proyecto `Proyecto Regresion R2`, Zona `Punta Cana`, Tipo (cualquiera), Precio interno (real) `14000000` → "Crear proyecto" | El modal se cierra. Aparece la tarjeta `Proyecto Regresion R2` con la zona, `Avance de obra` `0%`, `Disponibles` `0/0` y `Precio real` con el valor (`PRO-3` compara esto con los otros roles). Fila de auditoría `crear` |
| 3 | LEE | admin | Pulsa la tarjeta ("Ver detalle →") | La URL es `/propiedades/proyecto-regresion-r2` (el slug sale del nombre; si ya existe uno igual, termina en `-2`). Muestra "Precio interno" con el valor |
| 4 | INTENTO | admin | "Nuevo proyecto" sin nombre | Bloqueado por el navegador. Consola: `await llamar('POST', '/api/proyectos', {})` → `400`, `fields.name` = `"Escribe el nombre del proyecto."` |
| 5 | ESCRIBE | asistente | "Nuevo proyecto" como asistente | Puede crear, pero el formulario **no muestra** "Precio interno (real)" |

#### PRO-2 · Crear una unidad

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre el proyecto | Sección "Unidades"; sin unidades: `Sin unidades todavía` / `Registra la primera con “Nueva unidad”.` |
| 2 | ESCRIBE | admin | "Nueva unidad" → Código `R2-01`, Tipología `Apartamento`, Habitaciones `2`, Baños `2`, Construcción `85` → "Crear unidad" | Aparece la fila `R2-01` con estado `Disponible`. Fila de auditoría `crear` |
| 3 | INTENTO | admin | "Nueva unidad" sin código | Bloqueado. Consola: `await llamar('POST', '/api/proyectos/ID_PROYECTO/unidades', {})` → `400`, `fields.code` = `"Escribe el código de la unidad."` |
| 4 | INTENTO | admin | Consola: `await llamar('POST', '/api/proyectos/999999/unidades', { code: 'X' })` | `404`, `"El proyecto indicado no existe."` |

#### PRO-3 · El precio real está restringido por permiso

Por qué: `unit_real_price` es un permiso aparte; el dato **no sale del servidor**
si no se tiene (decisión #26), no es que la vista lo esconda.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre el proyecto | "Precio interno" con el valor (`14000000` centavos = 140 000) |
| 2 | LEE | asistente | Abre `/propiedades` y el mismo proyecto | En la tarjeta, en vez de `Precio real` dice `Rango asignado` (con el rango público o `Sin definir`). En el detalle, "Precio interno": `Restringido` |
| 3 | INTENTO | asistente | Consola: `await llamar('PATCH', '/api/proyectos/ID_PROYECTO', { name: 'Proyecto Regresion R2', internalPriceCents: 1 })` | `200`, pero el precio **no se toca** (se descarta en silencio): el admin sigue viendo `14000000`. Quien escribe el precio real es solo quien tiene `unit_real_price:edit` |

#### PRO-4 · Crear las fases de obra

Por qué: la plantilla estándar son 8 fases y solo aplica a un proyecto sin
ninguna; `projects.progress_percent` es un caché del promedio de las fases y se
recalcula en cada escritura.

Precondición: `Proyecto Regresion R2` sin fases.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre `/avances?proyecto=proyecto-regresion-r2` | Título "Avances de obra". Panel `Sin fases todavía` / `Empieza con la plantilla estándar de 8 fases.` y el botón "Crear las 8 fases estándar" |
| 2 | ESCRIBE | admin | "Crear las 8 fases estándar" | Aparece la línea de tiempo con 8 fases, en este orden: Movimiento de tierra, Cimientos, Estructura, Muros, Instalaciones, Terminaciones, Áreas comunes, Entrega. Subtítulo `Proyecto Regresion R2 · 8 fases`. Ocho filas de auditoría `crear`. Avance del proyecto 0 % |
| 3 | INTENTO | admin | Consola: `await llamar('POST', '/api/proyectos/ID_PROYECTO/fases', { plantilla: true })` | `409`, `"El proyecto ya tiene fases: la plantilla solo aplica a un proyecto sin ninguna."` |
| 4 | ESCRIBE | admin | "Agregar fase" → en el cuadro `Título de la nueva fase:` escribe `Regresion R2 fase extra` | Aparece una novena fase, al final |
| 5 | INTENTO | asistente | Abre el proyecto sin fases (otro proyecto nuevo) | Panel `Sin fases todavía` con el texto `Este proyecto todavía no tiene fases de obra registradas.` y **sin** botón de plantilla ni "Agregar fase" |
| 6 | INTENTO | asistente | Consola: `await llamar('POST', '/api/proyectos/ID_PROYECTO/fases', { plantilla: true })` | `403`, `"Sin permiso para create sobre construction_phases."` |

#### PRO-5 · Editar una fase

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | Selecciona "Movimiento de tierra" → Estado `En curso`, mueve el deslizador hasta que junto a "Porcentaje de avance" diga `60` (con el deslizador enfocado, ←/→ mueven de 1 en 1), Nota pública `Regresion R2 nota` → "Guardar" | La línea de tiempo muestra `En curso 60%` bajo esa fase. Fila de auditoría `editar` |
| 2 | LEE | admin | Abre `/propiedades` | La tarjeta del proyecto muestra `Avance de obra` `8%` (60 ÷ 8 fases, redondeado) |
| 3 | INTENTO | admin | En "URL de video de YouTube" escribe `ftp://ejemplo.com/v` → "Guardar" | Texto rojo bajo el campo: `Escribe una URL de video válida (http o https).` |
| 4 | ESCRIBE | asistente | Repite el paso 1 en otra fase | Funciona: el asistente tiene `construction_phases:edit` `all` |

#### PRO-6 · Subir una foto

Por qué: bucket privado `avances-obra`, nombre generado en el servidor, tipo en
lista blanca y URL firmada temporal; no se confía en el nombre del cliente.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | En una fase → "Agregar fotos" → elige un PNG pequeño | La imagen aparece en la cuadrícula "Fotos de obra" (con URL firmada). Filas `crear` (archivo) en auditoría; objeto en el bucket |
| 2 | INTENTO | admin | "Agregar fotos" → elige un **SVG** | `alert()`: `Solo se permiten imágenes JPEG, PNG, WEBP o GIF.` No se sube nada |
| 3 | INTENTO | admin | Elige un archivo de más de 10 MB | `alert()`: `Cada foto debe pesar 10 MB o menos.` |
| 4 | ESCRIBE | admin | Sobre la foto, pulsa `×` | Cuadro `¿Eliminar la foto "<nombre>"?`. Al aceptar, desaparece (borrado lógico; el objeto queda en Storage) |
| 5 | INTENTO | broker | Con un proyecto asignado (BRK-2), abre `/avances` | **No** hay "Agregar fotos" ni `×` |

#### PRO-7 · Publicar y retirar del portal

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | Con una fase seleccionada, botón de la cabecera "Publicar en el portal" | El botón pasa a "Retirar del portal". `is_published` = verdadero y `published_at` con fecha |
| 2 | ESCRIBE | admin | "Retirar del portal" | Vuelve a "Publicar en el portal". `is_published` falso y `published_at` nulo |

#### PRO-8 · Eliminar una fase

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | En la fase extra, el icono de basura | Cuadro `¿Eliminar la fase "Regresion R2 fase extra"? Esta acción no se puede deshacer.` |
| 2 | ESCRIBE | admin | Acepta | Desaparece de la línea de tiempo. Las demás **no se renumeran**. El avance del proyecto se recalcula. Es un borrado real (las fotos de la fase quedan borradas lógicamente). Fila `eliminar` |
| 3 | LEE | asistente | Abre la fase | **No** hay icono de basura (sin `delete`) |

#### PRO-9 · Un broker ve solo sus proyectos y no edita fases

Precondición: BRK-2 asignó `Proyecto Regresion R2` a `Broker de Prueba`.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | broker | Abre `/propiedades` | Solo proyectos cuyo responsable es él. Sin botón "Nuevo proyecto" |
| 2 | LEE | broker | Abre `/propiedades/proyecto-regresion-r2` | Se ve. Sin "Nueva unidad", sin "Editar proyecto". "Precio interno": `Restringido` |
| 3 | LEE | broker | Abre `/propiedades/SLUG_DE_UN_PROYECTO_AJENO` | La página 404 estándar de Next.js (no hay `not-found.tsx` propio) |
| 4 | LEE | broker | Abre `/avances` | Las fases del proyecto con los ocho campos **deshabilitados**, sin "Guardar", sin "Publicar en el portal" ni "Agregar fotos" |
| 5 | INTENTO | broker | Consola: `await llamar('PATCH', '/api/proyectos/ID_PROYECTO/fases/ID_FASE', { title: 'x' })` | `403`, `"Sin permiso para edit sobre construction_phases."` |

#### PRO-10 · Eliminar una unidad o un proyecto

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | Crea la unidad `R2-99` y pulsa su botón de eliminar | Cuadro `¿Eliminar la unidad R2-99? Podrás verla en la papelera, no se borra de la base.` |
| 2 | ESCRIBE | admin | Acepta | Desaparece de la lista de unidades. Aparece en Papelera como `Unidad` (PAP-1). Fila `eliminar` |

---

### 4.6 usuarios

Rutas: `POST /api/usuarios`, `PATCH` y `DELETE /api/usuarios/:id`,
`POST /api/usuarios/:id/invitacion`. Página: **Configuración → Usuarios y
roles** (`/configuracion?tab=usuarios`). Permisos: `users` exige alcance `all`
(`requireFullScope`): con `own`, un usuario alcanzaría su propia fila y podría
cambiarse el rol. Solo el admin entra a Configuración.

#### USU-1 · Invitar a un usuario

Por qué tiene dos pasos: primero se crea en el CRM (transacción con auditoría),
después se invita por Supabase Auth (fuera de la transacción). Si la invitación
falla, el usuario queda creado y reparable.

Precondición: una dirección de correo propia. **La invitación envía un correo
real** y crea una cuenta en Supabase Auth que el CRM no puede borrar luego.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre Configuración → "Usuarios y roles" | Tabla con Usuario / Rol / Estado / Invitación y el botón "Invitar usuario" |
| 2 | ESCRIBE | admin | "Invitar usuario" → Nombre completo `Regresion R2 USU-1`, Correo (el propio), Rol `Broker` (viene preseleccionado), Especialidad `Regresion`, Meta mensual `1` → "Invitar" | El modal se cierra y aparece la fila. Se escriben `users`, `broker_profiles` (nivel `junior`) y la fila de auditoría `crear` |
| 3 | LEE | admin | Mira la fila | Rol `Broker`, Estado `Activo`. **Invitación:** si Supabase aceptó el envío, la fila muestra `Aceptada` (el código guarda el id de Auth en cuanto Supabase lo devuelve, aunque la persona no haya aceptado); si falló, `Pendiente` con el botón "Reenviar" y antes salió un `alert()`: `El usuario se creó, pero la invitación no se pudo enviar: <motivo>. Usa "Reenviar" desde la lista.` **Anota cuál de las dos ramas ocurre en tu entorno: es la referencia** (pendiente de detallar, §3) |
| 4 | LEE | admin | Abre `/brokers` | Hay una tarjeta nueva `Regresion R2 USU-1` |
| 5 | INTENTO | admin | Invita de nuevo el mismo correo | Texto rojo al pie del formulario: `Ya existe un usuario activo con ese correo.` |
| 6 | INTENTO | admin | Consola: `await llamar('POST', '/api/usuarios', { fullName: 'x', email: 'no-es-correo', roleId: 1 })` | `400`, `fields.email` = `"Escribe un correo válido."` |
| 7 | INTENTO | admin | Consola con un `roleId` que no existe (`999999`) y un correo válido nuevo | `409`, `"El rol indicado no existe."` |

#### USU-2 · Editar un usuario

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | ✎ en `Regresion R2 USU-1` → título `Editar a Regresion R2 USU-1`; cambia Cargo a `Regresion` → "Guardar cambios" | Se cierra. Fila de auditoría `editar` con el antes y el después |
| 2 | ESCRIBE | admin | ✎ en `Broker de Prueba` → "Guardar cambios" sin tocar nada | Si no tenía perfil de broker, se crea aquí (§2.1, punto 3) |

#### USU-3 · Desactivar y reactivar

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | En `Regresion R2 USU-1`, botón `⏸` (Desactivar) | Badge `Inactivo`; el botón pasa a `▶` |
| 2 | ESCRIBE | admin | `▶` | Badge `Activo` |
| 3 | — | — | Que el usuario inactivo no pueda entrar | **Pendiente de detallar** (§3): el código lo garantiza en `getActor`, pero no se prueba con las cuentas de prueba |

#### USU-4 · No se puede dejar al CRM sin administrador activo

Por qué: sin un administrador activo, nadie puede administrar el CRM. Es una de las
protecciones del 29/09 y **debe conservarse intacta** (R3.5). Detalle en SEG-3.

#### USU-5 · Eliminar un usuario

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | `🗑` en `Regresion R2 USU-1` | Cuadro `¿Eliminar a Regresion R2 USU-1? Podrás verlo en la papelera, no se borra de la base.` |
| 2 | ESCRIBE | admin | Acepta | La fila desaparece de la lista. Aparece en Papelera como `Usuario`. `deleted_at` con valor e `is_active` falso. Fila `eliminar` |

#### USU-6 · Reenviar la invitación

Condicional: solo si la fila está `Pendiente`.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | En una fila `Pendiente`, "Reenviar" | Sin mensaje de error; la fila pasa a `Aceptada` |
| 2 | INTENTO | admin | Sobre un usuario `Aceptada`: `await llamar('POST', '/api/usuarios/ID/invitacion')` | `409`, `"Este usuario ya aceptó su invitación."` |

#### USU-7 · Solo el admin administra usuarios

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | asistente / broker | Mira el menú lateral | No aparece "Configuración" |
| 2 | LEE | asistente / broker | Abre `/configuracion` | Pantalla 403: `No tienes permiso` / `Tu rol no tiene acceso a esta sección. Si crees que deberías tenerlo, pídeselo a un administrador.` y el botón "Volver al inicio" |
| 3 | INTENTO | asistente / broker | Consola: `await llamar('POST', '/api/usuarios', { fullName: 'x', email: 'x@example.com', roleId: 1 })` | `403`, `"Sin permiso para create sobre users."` |
| 4 | INTENTO | asistente / broker | Consola: `await llamar('PATCH', '/api/usuarios/1', { fullName: 'x' })` | `403`, `"Sin permiso para edit sobre users."` |

---

### 4.7 comisiones

Rutas: `PATCH /api/comisiones/:id` (estado y reparto),
`GET /api/comisiones/export`. Página: `/comisiones` (`broker`, `periodo`,
`estado`). Permisos: `commissions`. Admin: ver, editar, exportar. Asistente:
solo ver (`all`). Broker: solo ver, solo las suyas (`own`).

Por qué son transiciones y no ediciones (decisión #36): `pending → approved →
paid`, y `pending | approved → void`; `paid` y `void` son finales. Es dinero.

Precondición: la comisión que generó PIP-7 (Estado `Pendiente`).

**El periodo por defecto es el mes actual**, no "todos": si el cierre fue en otro
mes, elige el periodo en el selector.

#### COM-1 · Ver la lista y los indicadores

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre `/comisiones` | Título "Comisiones", tres indicadores (`Comisiones · <mes año>` con `N negocios cerrados`, `Pendientes de pago` con `N por aprobar`, `Pagadas` con `Ya liquidadas`), filtros de broker / periodo / estado y el botón "Exportar reporte" |
| 2 | LEE | admin | Mira la fila de la comisión | Contacto, monto de venta, `5%`, `50% broker / 50% agencia`, `Broker de Prueba`, Estado `Pendiente`, y en la última columna: aprobar, editar reparto y anular |
| 3 | LEE | admin | Filtra por Estado `Aprobada` | `Sin comisiones` / `No hay comisiones para este filtro.` (si ninguna lo está todavía) |

#### COM-2 · Editar el reparto (solo en `pending`)

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | Icono ✎ (Editar reparto) | Cuadro `Porcentaje del broker (el resto queda para la agencia):` con `50` de valor inicial |
| 2 | INTENTO | admin | Escribe `150` | `alert()`: `Escribe un porcentaje entre 0 y 100.` Sin cambios |
| 3 | ESCRIBE | admin | Escribe `60` | La fila pasa a `60% broker / 40% agencia`. Sobre 5 000,00 de comisión: broker 3 000,00 y agencia 2 000,00 (`brokerAmountCents` `300000`, `agencyAmountCents` `200000`; la agencia es el total menos lo del broker, así la suma siempre cuadra al centavo). Fila `editar` |
| 4 | ESCRIBE | admin | Déjalo en `50` otra vez | Vuelve a `50% broker / 50% agencia` |

#### COM-3 · Aprobar una comisión

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | Icono ✓ (Aprobar comisión) | Estado `Aprobada`. La fila conserva dos acciones: pagar y anular; **desaparece** editar reparto. `approved_by` = el admin, `approved_at` con fecha. Fila `editar` |
| 2 | LEE | admin | Mira los indicadores | "Pendientes de pago" sigue incluyendo la comisión (pendientes y aprobadas); "por aprobar" baja 1 |
| 3 | INTENTO | admin | Consola: `await llamar('PATCH', '/api/comisiones/ID_COMISION', { brokerShareBasisPoints: 6000 })` | `409`, `"El reparto solo se puede editar mientras la comisión está pendiente (esta está aprobada)."` |
| 4 | INTENTO | admin | Consola: `await llamar('PATCH', '/api/comisiones/ID_COMISION', { status: 'approved' })` | `409`, `"No se puede pasar una comisión aprobada a aprobada."` |
| 5 | INTENTO | admin | Consola: `await llamar('PATCH', '/api/comisiones/ID_COMISION', {})` | `400`, `fields._` = `"Indica un nuevo estado o un nuevo reparto."` |

#### COM-4 · Marcar una comisión como pagada

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | Icono 💲 (Marcar pagada) | Estado `Pagada`. **La fila se queda sin acciones** (estado final). `paid_at` con fecha. El indicador `Pagadas` sube y `Pendientes de pago` baja |
| 2 | INTENTO | admin | Consola: `await llamar('PATCH', '/api/comisiones/ID_COMISION', { status: 'approved' })` | `409`, `"No se puede pasar una comisión pagada a aprobada."` |
| 3 | INTENTO | admin | Consola: `await llamar('PATCH', '/api/comisiones/ID_COMISION', { status: 'void' })` | `409`, `"No se puede pasar una comisión pagada a anulada."` |

#### COM-5 · Anular una comisión

Condicional: requiere una segunda comisión `Pendiente` o `Aprobada` (otro cierre).

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | Icono 🚫 (Anular comisión) | Cuadro `¿Anular la comisión de <contacto>? Esta acción no se puede deshacer.` |
| 2 | ESCRIBE | admin | Acepta | Estado `Anulada`; la fila queda sin acciones |

#### COM-6 · Exportar el reporte a CSV

Por qué: el CSV se genera en el servidor con **el mismo filtro y el mismo alcance**
que la pantalla (nunca descarga una fila que la tabla no mostró), con BOM UTF-8
para que Excel muestre los acentos, y neutraliza los campos que empiezan con
`=`, `+`, `-` o `@` (cubierto por `csv.test.ts`; no se repite a mano).

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Con periodo = mes actual y estado "Todos los estados", pulsa "Exportar reporte" | Se descarga `comisiones-AAAA-MM.csv` (con periodo "Todos los periodos" sería `comisiones-todos.csv`). Tipo `text/csv; charset=utf-8` |
| 2 | LEE | admin | `head -c 3 comisiones-AAAA-MM.csv \| xxd` | Empieza por `ef bb bf` (el BOM) |
| 3 | LEE | admin | Abre el archivo en un editor | Primera línea: `Negocio,Proyecto,Monto de venta,Comisión %,Total comisión,Broker %,Agencia %,Monto broker,Monto agencia,Broker,Estado,Fecha de cierre`. Líneas separadas por `\r\n` |
| 4 | LEE | admin | Compara la fila de la comisión con la tabla | `Regresion R2 LEA-1,Proyecto Regresion R2,100000.00,5,5000.00,50,50,2500.00,2500.00,Broker de Prueba,<Pendiente / Aprobada / Pagada>,AAAA-MM-DD` |
| 5 | LEE | admin | Cambia el filtro de estado y exporta otra vez | El CSV contiene **exactamente** las filas de la tabla filtrada |
| 6 | INTENTO | asistente | Abre `/comisiones` | Ve la lista, **sin** "Exportar reporte" y sin acciones |
| 7 | INTENTO | asistente / broker | En la barra de direcciones: `/api/comisiones/export` | `403`, `{"error":"Sin permiso para export sobre commissions."}` |

#### COM-7 · Un broker ve solo su comisión y no la edita

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | broker | Abre `/comisiones` | Solo sus comisiones; sin selector de broker, sin "Exportar reporte", sin acciones |
| 2 | INTENTO | broker | Consola: `await llamar('PATCH', '/api/comisiones/ID_COMISION', { status: 'approved' })` | `403`, `"Sin permiso para edit sobre commissions."` |
| 3 | INTENTO | asistente | La misma llamada | `403`, `"Sin permiso para edit sobre commissions."` |

---

### 4.8 metas

Ruta: `PUT /api/metas`. Página: `/metas` (`periodo=AAAA-MM`). Permisos: `goals`.
Admin: ver y editar. Asistente: ver `all`. Broker: ver `own`.

Por qué: **la pantalla fija la meta (`target_*`); solo el cierre escribe lo logrado
(`achieved_*`)** (decisión #35).

#### MET-1 · Ver metas

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre `/metas` | Título "Metas y desempeño"; selector de periodo; "Meta del negocio" con `N de M negocios logrados` (o `Sin meta fijada` / `Todavía no hay una meta de negocios para este periodo.`); tabla Broker / Meta / Logrados / Cumplimiento / Nivel; y "Cierres por mes" |
| 2 | LEE | broker | Abre `/metas` | Título "Mis metas"; "Meta personal"; solo **su** fila. Nunca la de la compañía |
| 3 | LEE | asistente | Abre `/metas` | Vista completa, **sin** botones de editar (no tiene `goals:edit`) |

#### MET-2 · Fijar la meta de la compañía

Anota el valor original para devolverlo.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | "Editar meta de la compañía" → modal con "Meta de negocios del mes" → `10` → "Guardar" | El hero pasa a `<logrados> de 10 negocios logrados`. Fila `crear` o `editar` en auditoría (entidad `goal`) |
| 2 | LEE | admin | Mira lo logrado | Los logrados **no cambiaron** |

#### MET-3 · Fijar la meta de un broker

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | En la fila de `Broker de Prueba`, ✎ → modal `Editar meta — Broker de Prueba` → `4` → "Guardar" | La fila muestra la meta `4` y su cumplimiento recalculado |

#### MET-4 · El cierre alimenta las metas

Se comprueba dentro de PIP-7, paso 4.

#### MET-5 · Permisos de metas

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | INTENTO | broker | Consola: `await llamar('PUT', '/api/metas', { brokerId: 2, year: 2026, month: 9, targetDeals: 1 })` | `403`, `"Sin permiso para edit sobre goals."` |
| 2 | INTENTO | asistente | La misma llamada | `403`, el mismo mensaje |
| 3 | INTENTO | admin | Consola: `await llamar('PUT', '/api/metas', { brokerId: null, year: 2026, month: 9, targetDeals: -1 })` | `400`, `"Revisa los datos enviados."` |
| 4 | INTENTO | admin | Consola con un `brokerId` de un usuario sin perfil | `404`, `"El broker indicado no tiene perfil de broker."` |

---

### 4.9 brokers

Ruta: `PUT /api/brokers/:id/proyectos` (asignar propiedades). Páginas: `/brokers`,
`/brokers/:id`. Permisos: `brokers` (admin y asistente `all`; broker `own`). Para
asignar propiedades, `projects:edit` con alcance `all` (admin y asistente).
"Invitar broker" reutiliza el formulario de usuarios y exige `users:create`
(solo admin).

#### BRK-1 · Ver brokers y perfil

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Abre `/brokers` | Título "Brokers", escala `Junior → Senior → Senior+ → Top Producer → Top Leader`, una tarjeta por broker con `Ventas del año`, `Negocios activos`, `Meta mensual` (un porcentaje, o `Sin meta`), y "Ver perfil" |
| 2 | LEE | admin | "Ver perfil" en `Broker de Prueba` | `/brokers/ID`; secciones "Proyectos asignados", "Negocios abiertos", "Metas de los últimos meses" (cada una con su estado vacío: `Sin proyectos asignados`, `Sin negocios abiertos`, `Sin metas registradas`) |

#### BRK-2 · Asignar propiedades a un broker

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin / asistente | "Asignar propiedades" en la tarjeta de `Broker de Prueba` | Modal `Asignar propiedades a Broker de Prueba` con una casilla por proyecto activo (`Asignar <proyecto>`) |
| 2 | ESCRIBE | admin | Marca `Proyecto Regresion R2` → "Guardar asignación" | Se cierra. El perfil del broker lista el proyecto en "Proyectos asignados"; en `/propiedades` la tarjeta muestra al broker como responsable. Fila de auditoría `asignar` (entidad proyecto) |
| 3 | LEE | broker | Abre `/propiedades` y `/avances` | Ahora ve ese proyecto |
| 4 | ESCRIBE | admin | Desmarca el proyecto → "Guardar asignación" | El proyecto queda `Sin asignar`; el broker deja de verlo |
| 5 | ESCRIBE | asistente | Repite 2 con otro proyecto | Funciona (tiene `projects:edit` `all`) |
| 6 | ESCRIBE | admin | Vuelve a asignar `Proyecto Regresion R2` al broker | Estado de salida para PRO-9 |

#### BRK-3 · Invitar broker

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Mira la cabecera de `/brokers` | Botón "Invitar broker" (abre el mismo formulario de USU-1 con Rol `Broker`) |
| 2 | LEE | asistente | Mira la cabecera | **No** hay botón "Invitar broker" |

#### BRK-4 · Un broker ve solo su tarjeta

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | broker | Abre `/brokers` | Solo su propia tarjeta; sin "Asignar propiedades" ni "Invitar broker" |
| 2 | LEE | broker | Abre `/brokers/ID_OTRO_BROKER` | La página 404 estándar de Next.js |
| 3 | INTENTO | broker | Consola: `await llamar('PUT', '/api/brokers/1/proyectos', { projectIds: [] })` | `403`, `"Sin permiso para edit sobre projects."` |

---

### 4.10 catalogos

Rutas: `POST /api/catalogos/:tipo`, `PATCH /api/catalogos/:tipo/:id`, con `:tipo`
= `motivos-perdida` o `canales`. Página: Configuración → "Catálogos". Permisos:
`settings` (solo admin). **Un catálogo nunca se borra, solo se desactiva.**

#### CAT-1 · Ver los catálogos

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Configuración → "Catálogos" | Título "Motivos de pérdida y canales de captación" y dos listas ("Motivos de pérdida", "Canales de captación"), cada una con posición, nombre, `Inactivo` si aplica, "Editar" y "+ Nuevo" |

#### CAT-2 · Crear una entrada

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | En "Canales de captación", "+ Nuevo" → Nombre `Regresion R2 Canal`, Posición `99` → "Crear" | Aparece la entrada. Fila de auditoría `crear` (entidad `lead_source`) |
| 2 | LEE | admin | Abre "Nuevo contacto" en `/contactos` | `Regresion R2 Canal` está en el selector de Canal |
| 3 | ESCRIBE | admin | Crea un motivo `Regresion R2 Motivo` en "Motivos de pérdida" | Aparece en el modal "Marcar negocio como perdido" (PIP-9) |
| 4 | INTENTO | admin | Consola: `await llamar('POST', '/api/catalogos/motivos-perdida', {})` | `400`, `fields.name` = `"Escribe el nombre."` |
| 5 | INTENTO | admin | Consola: `await llamar('POST', '/api/catalogos/no-existe', { name: 'x' })` | `404`, `"Catálogo no reconocido."` |

#### CAT-3 · Editar y desactivar

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | "Editar" en `Regresion R2 Canal` → desmarca "Activo" → "Guardar" | Badge `Inactivo`. Deja de ofrecerse en "Nuevo contacto" |
| 2 | ESCRIBE | admin | Márcalo "Activo" otra vez | Vuelve a ofrecerse |
| 3 | INTENTO | asistente | Consola: `await llamar('POST', '/api/catalogos/canales', { name: 'x' })` | `403`, `"Sin permiso para create sobre settings."` |

---

### 4.11 etapas

Ruta: `PATCH /api/etapas/:id`. Página: Configuración → "Etapas del pipeline".
Permisos: `settings` (solo admin). Se edita **nombre, posición, probabilidad
por defecto y activa**; `slug` y `kind` no se pueden tocar: `kind` decide qué es
ganado o perdido, y cambiarlo reescribiría en silencio los negocios ya cerrados.

#### ETA-1 · Ver las etapas

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Configuración → "Etapas del pipeline" | Texto `El nombre y el orden son editables. La naturaleza de la etapa (abierta, ganada o perdida) es fija: de ahí cuelgan las reglas de cierre.` Siete filas: Nuevo, Contactado, Presentación, Preselección, Negociación con la etiqueta `Abierta`; Cierre con `Ganada`; Perdido con `Perdida` |

#### ETA-2 · Renombrar una etapa no rompe las reglas

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | "Editar" en Contactado → Nombre `Primer contacto` → "Guardar" | La fila muestra `Primer contacto`. Fila `editar` (entidad `pipeline_stage`) |
| 2 | LEE | admin | Abre `/pipeline` | La columna se llama `Primer contacto` |
| 3 | INTENTO | admin | Con un negocio en "Nuevo" sin actividad de contacto, muévelo a `Primer contacto` | Sigue saliendo el `alert()` de PIP-2: la regla cuelga de la posición, no del nombre |
| 4 | ESCRIBE | admin | Devuelve el nombre a `Contactado` | Estado de salida restaurado |
| 5 | INTENTO | admin | En el formulario, Nombre vacío | El navegador lo bloquea. Por consola: `await llamar('PATCH', '/api/etapas/ID_ETAPA', { name: '' })` → `400`, `fields.name` = `"Escribe el nombre de la etapa."` |
| 6 | INTENTO | asistente | Consola: `await llamar('PATCH', '/api/etapas/1', { name: 'x' })` | `403`, `"Sin permiso para edit sobre settings."` |

No se ejecuta a mano la desactivación de una etapa: dejaría negocios sin columna
en el Kanban y ensuciaría la base del resto del guion.

---

### 4.12 papelera

Ruta: `POST /api/papelera/restaurar` con `{ entityType, id }`. Página:
Configuración → "Papelera". Entidades: `contact`, `lead`, `deal`, `project`,
`unit`, `user`. Permisos: `settings:edit` (solo admin).

#### PAP-1 · Ver lo eliminado

Precondición: lo borrado en CON-10 (`Regresion R2 CON-3`), PRO-10 (`R2-99`) y
USU-5 (`Regresion R2 USU-1`).

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Configuración → "Papelera" | Texto `Lo borrado desde cualquier módulo aparece aquí — el borrado siempre es lógico, nunca definitivo.` Tabla Tipo / Registro / Eliminado con una insignia por tipo (`Contacto`, `Lead`, `Negocio`, `Proyecto`, `Unidad`, `Usuario`), el nombre (los negocios salen como `Negocio #ID`) y la fecha y hora, del más reciente al más antiguo, y "Restaurar" |

#### PAP-2 · Restaurar un registro

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | ESCRIBE | admin | "Restaurar" en `Regresion R2 CON-3` | La fila desaparece de la papelera |
| 2 | LEE | admin | Abre `/contactos` y busca el contacto | Está de vuelta. Su Historial termina en `Eliminación` seguido de `Restauración` |
| 3 | ESCRIBE | admin | "Restaurar" en la unidad `R2-99` | Vuelve a la lista de unidades del proyecto |
| 4 | ESCRIBE | admin | "Restaurar" en `Regresion R2 USU-1` | Vuelve a la lista de usuarios **como `Inactivo`**: eliminar lo dejó inactivo y restaurar solo quita la marca de borrado. Hay que reactivarlo con `▶` |
| 5 | INTENTO | admin | Consola: `await llamar('POST', '/api/papelera/restaurar', { entityType: 'contact', id: ID_CONTACTO_ACTIVO })` | `404`, `"No se encontró el registro."` (no está en la papelera) |
| 6 | INTENTO | admin | Consola: `await llamar('POST', '/api/papelera/restaurar', { entityType: 'activity', id: 1 })` | `400`, `"Revisa los datos enviados."` (solo seis entidades) |

#### PAP-3 · La papelera vacía y los permisos

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Con la papelera sin registros | `La papelera está vacía` / `Nada se ha eliminado todavía.` (solo si se da; si no, `N/A`) |
| 2 | INTENTO | asistente | Consola: `await llamar('POST', '/api/papelera/restaurar', { entityType: 'contact', id: 1 })` | `403`, `"Sin permiso para edit sobre settings."` |

---

### 4.13 roles

Ruta: `PATCH /api/roles/:id/permisos`, con `{ permisos: [{ resource, action,
scope }] }`. Página: Configuración → "Permisos" (`?tab=permisos&rol=ID`).
Permisos: `settings:edit` (solo admin). El rol administrador está **protegido**:
sus permisos no se editan, y eso lo decide el servidor, no el botón oculto.

**No envíes nunca `{ permisos: [] }` a un rol que no sea el administrador:** la
ruta borra todas las celdas que no vienen en la lista y dejaría al rol sin un
solo permiso.

#### ROL-1 · Ver la matriz

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | admin | Configuración → "Permisos" | Título "Permisos por rol", botones `Administrador`, `Asistente`, `Broker`; se abre el primer rol no protegido por nombre (`Asistente`). Tabla con un recurso por fila (Panel de inicio, Leads, Contactos, Negocios … Integraciones) y una columna por acción (Ver, Crear, Editar, Eliminar, Importar, Exportar); cada celda, un selector con `Ninguno`, `Propio`, `Equipo`, `Todos` |
| 2 | LEE | admin | Pulsa `Administrador` | La URL gana `?rol=ID` (anótalo: es `ID_ROL_ADMIN`). Aviso `Protección del rol administrador` / `Los permisos del administrador no se pueden modificar.` y todos los selectores deshabilitados, sin botón "Guardar cambios" |
| 3 | LEE | admin | Pulsa `Asistente` | Celdas según `db/seed.sql`: por ejemplo Contactos · Ver = `Todos`, Contactos · Eliminar = `Ninguno`, Configuración · Ver = `Ninguno` |
| 4 | LEE | admin | Pulsa `Broker` | Contactos · Ver = `Propio`; Academy · Ver = `Todos` |

#### ROL-2 · Editar permisos

Por qué esta prueba: es la pieza que hace real el RBAC. Un permiso cambiado aquí
debe surtir efecto en la **siguiente petición** del rol, sin reiniciar nada.

Precondición: el asistente con sesión abierta en otro perfil, y el valor original
de **Academy · Ver** del asistente (`Todos`).

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | asistente | Anota que el menú lateral tiene "Academy" y que `/academy` abre | Así sale en la línea base |
| 2 | ESCRIBE | admin | Configuración → "Permisos" → `Asistente` → "Academy · Ver" = `Ninguno` → "Guardar cambios" | Se guarda sin mensaje de error y al recargar la celda sigue en `Ninguno`. Fila de auditoría `editar` (entidad `role`) con el antes y el después. La celda se borró de `permissions` |
| 3 | LEE | asistente | Recarga el CRM | El menú **ya no muestra** "Academy" |
| 4 | LEE | asistente | Abre `/academy` | Pantalla 403: `No tienes permiso` / `Tu rol no tiene acceso a esta sección. Si crees que deberías tenerlo, pídeselo a un administrador.` |
| 5 | ESCRIBE | admin | Devuelve "Academy · Ver" a `Todos` → "Guardar cambios" | Se guarda |
| 6 | LEE | asistente | Recarga | "Academy" está de vuelta y `/academy` abre. Estado restaurado |

#### ROL-3 · El administrador está protegido y los demás no pueden editar

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | INTENTO | admin | Consola: `await llamar('PATCH', '/api/roles/ID_ROL_ADMIN/permisos', { permisos: [] })` | `403`, `"Los permisos del rol administrador no son editables."` Nada se escribe |
| 2 | INTENTO | admin | Consola: `await llamar('PATCH', '/api/roles/999999/permisos', { permisos: [{ resource: 'leads', action: 'view', scope: 'all' }] })` | `404`, `"El rol indicado no existe."` |
| 3 | INTENTO | admin | Consola: `await llamar('PATCH', '/api/roles/ID_ROL_ADMIN/permisos', { permisos: [{ resource: 'no-existe', action: 'view', scope: 'all' }] })` | `400`, `"Revisa los datos enviados."` |
| 4 | INTENTO | asistente | Consola: `await llamar('PATCH', '/api/roles/ID_ROL_ASISTENTE/permisos', { permisos: [{ resource: 'leads', action: 'view', scope: 'all' }] })` | `403`, `"Sin permiso para edit sobre settings."` (**no** se ejecuta nada: el permiso se comprueba antes de la transacción) |

---

## 5. Flujos transversales de seguridad

Protecciones de `AGENTS.md` y del incidente del 29/09/2026
(`flujo-de-trabajo.md` §6). **Deben quedar intactas** en cada migración; si una
de estas falla tras migrar un módulo, se detiene el trabajo.

#### SEG-1 · Una ruta sin permiso responde 403

Por qué: el permiso se decide en el servidor (criterio de terminado #1); ocultar
el botón no es seguridad. `seguridad.test.ts` comprueba que cada ruta llama a
`requireScope`; esto comprueba que el efecto llega al navegador.

Todas estas llamadas son `INTENTO`: deben fallar y no dejar datos. Ejecuta cada
una desde la sesión del rol indicado (el id no necesita existir: el permiso se
comprueba antes de buscar nada).

| # | Rol | Llamada | Debe responder |
|---|---|---|---|
| 1 | asistente | `await llamar('DELETE', '/api/contactos/1')` | `403` · `"Sin permiso para delete sobre contacts."` |
| 2 | broker | `await llamar('DELETE', '/api/contactos/1')` | `403` · el mismo |
| 3 | broker | `await llamar('POST', '/api/usuarios', { fullName: 'x', email: 'x@example.com', roleId: 1 })` | `403` · `"Sin permiso para create sobre users."` |
| 4 | broker | `await llamar('PATCH', '/api/etapas/1', { name: 'x' })` | `403` · `"Sin permiso para edit sobre settings."` |
| 5 | asistente | `await llamar('POST', '/api/papelera/restaurar', { entityType: 'contact', id: 1 })` | `403` · `"Sin permiso para edit sobre settings."` |
| 6 | asistente | `await llamar('PUT', '/api/metas', { brokerId: null, year: 2026, month: 9, targetDeals: 1 })` | `403` · `"Sin permiso para edit sobre goals."` |
| 7 | asistente | `await llamar('PATCH', '/api/comisiones/1', { status: 'approved' })` | `403` · `"Sin permiso para edit sobre commissions."` |
| 8 | broker | `await llamar('POST', '/api/proyectos', { name: 'x' })` | `403` · `"Sin permiso para create sobre projects."` |
| 9 | asistente | `await llamar('POST', '/api/proyectos/1/fases', { plantilla: true })` | `403` · `"Sin permiso para create sobre construction_phases."` |
| 10 | asistente | `await llamar('DELETE', '/api/actividades/1')` | `403` · `"Sin permiso para delete sobre activities."` |
| 11 | broker | `await llamar('PUT', '/api/brokers/1/proyectos', { projectIds: [] })` | `403` · `"Sin permiso para edit sobre projects."` |
| 12 | asistente / broker | Abre `/api/comisiones/export` en la barra de direcciones | `403` · `{"error":"Sin permiso para export sobre commissions."}` |
| 13 | (sin sesión) | Sesión cerrada: `await llamar('POST', '/api/contactos', { fullName: 'x' })` desde `/login` | `401` · `{"error":"No autenticado."}` (lo corta el middleware; las rutas públicas son solo `/api/auth/*` y `/api/leads/externo`) |

Páginas: con el asistente o el broker, `/configuracion` muestra la pantalla 403
(`No tienes permiso` / `Tu rol no tiene acceso a esta sección. Si crees que
deberías tenerlo, pídeselo a un administrador.` / botón "Volver al inicio"). El
broker, además, en `/reportes`. Menú lateral por rol, según `db/seed.sql` y
`modulos.ts`:

| Rol | Entradas del menú |
|---|---|
| admin | Las 15: Inicio, Leads, Contactos, Pipeline, Agenda, Tareas, Propiedades, Avances de obra, Brokers, Metas, Comisiones, Academy, Comunicaciones, Reportes, Configuración |
| asistente | 14: todas menos Configuración |
| broker | 13: todas menos Reportes y Configuración |

#### SEG-2 · El `destino` del login solo acepta rutas internas

Por qué: un `destino` externo convertiría el login en un redireccionamiento
abierto. La regla es `/^\/(?![/\\])/`: rechaza `//host`, `/\host` y URLs
absolutas. Hay que estar **sin sesión** (con sesión, `/login` redirige a
`/inicio` sin leer el `destino`).

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | LEE | (sin sesión) | Abre `/contactos` | Redirige a `/login?destino=%2Fcontactos` |
| 2 | LEE | (sin sesión) | Inicia sesión como admin desde esa URL | Termina en `/contactos` |
| 3 | LEE | (sin sesión) | Cierra sesión (botón de la barra lateral, "Cerrar sesión"); abre `/login?destino=https://example.com` e inicia sesión | Termina en **`/inicio`**, nunca en `example.com` |
| 4 | LEE | (sin sesión) | Cierra sesión; abre `/login?destino=//example.com` e inicia sesión | Termina en `/inicio` |
| 5 | LEE | (sin sesión) | Cierra sesión; abre `/login?destino=%2F%5Cexample.com` e inicia sesión | Termina en `/inicio` |
| 6 | LEE | (sin sesión) | Cierra sesión; abre `/login` sin `destino` e inicia sesión | Termina en `/inicio` |
| 7 | LEE | admin | Con sesión, abre `/login` | Redirige a `/inicio` |
| 8 | INTENTO | (sin sesión) | En `/login`, una contraseña incorrecta de al menos 6 caracteres (el campo tiene `minLength` 6 y el navegador bloquea lo más corto) | Texto rojo: `Correo o contraseña incorrectos.` (el mismo mensaje exista o no el correo); el botón vuelve a "Entrar al CRM" |
| 9 | INTENTO | (sin sesión) | Consola en `/login`: `await llamar('POST', '/api/auth/login', { email: 'abc', password: 'x' })` | `400`, `fields.email` = `"Escribe un correo válido."` |
| 10 | INTENTO | (sin sesión) | `/recuperar` con un correo que no existe | Siempre: `Revisa tu correo` / `Si esa dirección tiene cuenta, le llegará un enlace para cambiar la contraseña.` (no revela si la cuenta existe). **Solo se prueba el envío:** la ruta a la que apunta el enlace, `/recuperar/nueva-clave`, no existe en el código (§3) |

#### SEG-3 · No se puede quedar sin administrador activo

Por qué: sin un administrador activo, nadie puede administrar el CRM. La
protección está en `exigirOtroAdminActivo`, detrás de `requireFullScope`. Afecta
tres caminos: desactivar, quitar el rol de admin y eliminar.

**Precondición:** en Configuración → "Usuarios y roles" hay **exactamente un**
usuario con Rol `Administrador` y Estado `Activo`. Si hay más de uno, el guion es
`N/A` (no se puede reproducir sin cambiar datos). **Riesgo:** si la protección
estuviera rota, el admin quedaría inactivo o eliminado y no podrías volver a
entrar; se repara en la base (`update users set is_active = true, deleted_at =
null where id = ID_ADMIN;`). Por eso este flujo va el último de la sesión.

| # | Tipo | Rol | Qué se hace | Qué debe pasar |
|---|---|---|---|---|
| 1 | INTENTO | admin | En tu propia fila, `⏸` (Desactivar) | `alert()`: `Debe quedar al menos un administrador activo.` La fila sigue `Activo` |
| 2 | INTENTO | admin | ✎ en tu fila → Rol `Asistente` → "Guardar cambios" | Texto rojo en el formulario: `Debe quedar al menos un administrador activo.` El formulario sigue abierto; al cancelar, tu rol no cambió |
| 3 | INTENTO | admin | `🗑` en tu fila → acepta el cuadro `¿Eliminar a <tu nombre>? Podrás verlo en la papelera, no se borra de la base.` | `alert()`: `Debe quedar al menos un administrador activo.` La fila sigue |
| 4 | LEE | admin | Recarga y mira Papelera | Ningún usuario nuevo |
| 5 | LEE | admin | Comprueba que sigues con sesión y entras a Configuración | Sigue funcionando |

#### SEG-4 · Un broker no ve ni toca filas ajenas

Por qué: `visibleRows` y `reaches` se aplican en un solo sitio; una consulta nueva
que olvide el alcance filtra datos de otro broker sin dar error. Hay que probar
las **dos** vías: por listado y por URL directa. Un id ajeno responde como uno
inexistente: nunca se confirma que existe.

Precondición: filas ajenas a `Broker de Prueba` de cada tipo (creadas por el
admin o el asistente, con otro responsable).

| # | Tipo | Módulo | Por listado (broker) | Por URL directa (broker) | Por API (broker) |
|---|---|---|---|---|---|
| 1 | LEE / INTENTO | contactos | `/contactos`: no está | `/contactos?contacto=ID_AJENO`: sin ficha (línea base 30/09/2026, `19`) | `PATCH /api/contactos/ID_AJENO` → `404` `"No se encontró el registro."` |
| 2 | LEE / INTENTO | leads | `/leads`: no está | `/leads?lead=ID_AJENO`: sin ficha | `POST /api/leads/ID_AJENO/convertir` → `404` |
| 3 | LEE / INTENTO | pipeline | `/pipeline`: no está la tarjeta | `/pipeline?deal=ID_AJENO`: sin ficha | `PATCH /api/pipeline/ID_AJENO/etapa` → `404` |
| 4 | LEE | proyectos | `/propiedades`: no está | `/propiedades/SLUG_AJENO`: 404 de Next.js | — |
| 5 | LEE | brokers | `/brokers`: solo su tarjeta | `/brokers/ID_OTRO`: 404 de Next.js | `PUT /api/brokers/1/proyectos` → `403` |
| 6 | LEE | comisiones | `/comisiones`: solo las suyas | — | `PATCH /api/comisiones/ID` → `403` (no tiene `edit`) |
| 7 | LEE | actividades | `/tareas` y `/agenda`: solo las suyas | — | — |
| 8 | LEE | metas | `/metas`: solo su fila | — | `PUT /api/metas` → `403` |

Además, el broker **no puede reasignar el responsable de un contacto** por API:
ver CON-8, paso 3 (`403`, `"Solo un administrador o asistente puede reasignar el
responsable de un contacto."`).

#### SEG-5 · La entrada pública autentica por token

Ver LEA-2, pasos 1 a 4 (`401`, `"No autorizado."` sin token o con un token
incorrecto; nunca llega a tocar la base).

---

## 6. Datos de prueba creados

Anota aquí, en el momento de crearlo, todo lo que un paso `ESCRIBE` deje en la
base de desarrollo. Columnas: fecha · flujo · qué quedó · identificador · quién ·
estado (si se limpió o se dejó a propósito).

**Qué se limpia y qué no.** Los borrados son **lógicos**: un contacto, lead,
negocio, proyecto, unidad o usuario eliminado sigue en la base y en la papelera;
las actividades y las fotos también son borrado lógico; las fases sí se borran.
Los catálogos y las etapas nunca se borran, solo se desactivan. Una invitación
deja una cuenta en Supabase Auth que el CRM no borra. Un negocio cerrado genera
una comisión, cambia metas y deja una unidad `Vendida`: no se deshace desde la
interfaz. Un objeto de foto sigue en Storage. Por eso conviene correr el guion
completo pocas veces y siempre con nombres `Regresion R2`.

| Fecha | Flujo | Qué quedó | Identificador | Quién | Estado |
|---|---|---|---|---|---|
| 2026-09-30 | CON-2 | Contacto `Duplicado UI 2026`, teléfono `8095557777`, responsable `Admin de Prueba` | (el `id` que tenga en `/contactos?contacto=`) | El usuario (línea base) | **Quedó en la base a propósito**: es el segundo candidato del aviso de duplicado |
| 2026-09-30 | CON-5 | `Contacto Cierre PR24` **modificado, no creado**: se le borró el correo `cierre.pr24@example.com` | (contacto existente) | El usuario (línea base) | Sin restaurar el correo |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
| | | | | | |
