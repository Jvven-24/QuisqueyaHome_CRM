# R · Hallazgos de la reestructuración

Registro de lo que se encuentra **mientras** se migra. No es la lista de tareas
del milestone (esa es la §7 de `docs/R_ANALISIS_Y_PLAN.md`) ni el guion de
pruebas (`docs/R_REGRESION.md`): es lo que aparece de paso y no se arregla en el
momento.

Existe porque durante el milestone las funciones nuevas están congeladas
(decisión 4) y porque arreglar cada cosa en cuanto se ve alarga la migración e
hincha los diffs. Lo que se encuentra se anota aquí con su tamaño real, y se
decide cuándo se toca según la política de la **decisión #42**:

- **Bloqueante** — se arregla antes de seguir. Rompe datos, seguridad o el
  comportamiento que el usuario ve.
- **Sesión propia** — no bloquea la migración, pero es demasiado grande o
  demasiado delicado para colarlo en el commit de otro issue.
- **Al cerrar la migración** — menor y de arreglo conocido. Se agrupa al final,
  cuando toda la migración esté hecha.
- **Cerrado** — arreglado, con el commit que lo cerró.

Dónde va cada cosa: los fallos del **entorno de desarrollo** (Windows, `.next/`,
Codex) siguen en `docs/contexto/errores-conocidos.md`. Las **decisiones** van en
`docs/contexto/decisiones.md`. Aquí solo hallazgos de esta reestructuración.

---

## Resumen

| # | Hallazgo | Dónde | Tamaño | Estado |
|---|---|---|---|---|
| H1 | El orden de capas CSS no lo protege nada: si se descuadra, se descoloca el CRM entero | `src/app/tokens.css`, `src/app/globals.css` | **Sesión propia** | Abierto |
| H2 | `globals.css` es un punto único de fallo de 500 líneas con selectores globales | `src/app/globals.css` | **Sesión propia** (misma que H1) | Abierto |
| H3 | `http.ts` no se puede probar: su `import` de valores usa el alias `@/` | `src/infrastructure/http.ts` | Al cerrar la migración | Abierto |
| H4 | La traducción de `ForbiddenError` a HTTP 403 no tiene prueba automática | `src/infrastructure/http.ts` | Al cerrar la migración | Abierto (depende de H3) |
| H5 | `--muted` significa cosas distintas en `globals.css` y en shadcn | `src/app/tokens.css` | Al cerrar la migración (R5.8) | Abierto, desactivado a propósito |
| H6 | `contactosParaEscritura()` construye el pool aunque la respuesta sea 403 | `src/infrastructure/contenedor/contactos.ts` | Al cerrar la migración | Abierto, sin efecto observable |
| H7 | Las referencias `archivo:línea` de la documentación caducan solas | `src/application/README.md` | Al cerrar la migración | Abierto |
| H8 | Credenciales de prueba en el repositorio | `scripts/crear-usuario-prueba.mjs` | Antes de la entrega | Abierto desde la decisión #39 |
| H9 | Sin línea base de regresión en 12 de los 13 módulos | `docs/R_REGRESION.md` | Durante la migración | Abierto por diseño |
| H10 | Datos de prueba dejados en la base | base de datos de desarrollo | Al cerrar la migración | Abierto |
| H11 | `arquitectura.md` afirmaba tres cosas falsas desde F1 | `docs/contexto/arquitectura.md` | — | **Cerrado** en `b0b4660` |
| H12 | Cuatro referencias del README apuntaban a archivos de antes de migrar | `src/application/README.md` | — | **Cerrado** en `b0b4660` |
| H15 | **Un broker podía sobrescribir la «próxima acción» del negocio de otro** | `src/app/api/actividades/route.ts` | **Bloqueante** | **Cerrado en parte**: la escritura entre alcances, arreglada; `assigneeId`, `contactId` y `projectId` siguen abiertos para R3.3 |
| H16 | Reasignar un lead propio no exige alcance `all`; reasignar un contacto sí | `src/app/api/leads/[id]/route.ts` | Decisión de producto | Abierto |
| H17 | El correo de recuperación apunta a una ruta que no existe | `src/app/api/auth/recuperar/route.ts` | Al cerrar la migración | Abierto |
| H18 | Una invitación recién enviada se muestra como «Aceptada» | `src/app/api/usuarios/route.ts` | Al cerrar la migración | Abierto |
| H19 | El historial muestra el texto crudo de `asignar` y `descartar` | `src/app/(crm)/_ui/historial.tsx` | Al cerrar la migración | Abierto |
| H20 | Ocho desajustes menores entre el código, el glosario y los scripts | varios | Al cerrar la migración | Abierto |
| H21 | **El cambio simple de etapa no bloquea la fila: una pérdida concurrente puede pisar un cierre ya hecho** | `src/application/pipeline/casos-de-uso.ts` | **Sesión propia** | Abierto |
| H22 | El candado de arquitectura exigía las dos mitades de un módulo a la vez | `src/infrastructure/arquitectura.test.ts` | — | **Cerrado** en R3.1 |
| H23 | `isPrimary` con `z.coerce.boolean()` convierte la cadena `"false"` en `true` | `src/app/api/pipeline/[id]/propiedades/route.ts` | Al cerrar la migración | Abierto |
| H24 | `expectedCloseDate` no valida formato: una fecha inválida da 500 | `src/app/api/pipeline/[id]/route.ts` | Al cerrar la migración | Abierto |
| H25 | El paso 7 cancela las actividades futuras pero no limpia `deals.next_activity_id` | `src/application/pipeline/cierre.ts` | Al cerrar la migración | Abierto |
| H26 | Cinco comentarios citan `_cierre.ts`, archivo que R3.1 eliminó | `domain/`, `api/metas`, `api/comisiones`, `(crm)/comisiones` | Al cerrar la migración | Abierto |
| H27 | **El webhook repetido sin teléfono ni correo deja contactos huérfanos y audita de más** | `src/app/api/leads/externo/route.ts` | **Sesión propia** (con H21 y H29) | Abierto |
| H28 | El `SELECT` de respaldo del webhook no filtra `deleted_at` | `src/infrastructure/db/repos/leads.ts` | Al cerrar la migración | Abierto |
| H29 | La conversión de lead no bloquea la fila: dos conversiones simultáneas, dos negocios | `src/application/leads/conversion.ts` | **Sesión propia** (con H21 y H27) | Abierto |
| H30 | Dos rutas validan la entrada antes de autenticar: 422 donde debería haber 401 | `api/leads/[id]/descartar`, `api/leads/[id]` | Al cerrar la migración | Abierto |
| H31 | Los contactos que entran por el webhook nacen sin responsable ni autor | `src/app/api/leads/externo/route.ts` | Decisión de producto | Abierto |
| H32 | Editar una actividad puede reapuntarla al negocio de otro broker | `src/application/actividades/casos-de-uso.ts` | Al cerrar la migración | Abierto |
| H33 | **Nuestra red de pruebas no ve si un bloqueo de fila desaparece** | `src/infrastructure/db/repos/{pipeline,leads}.ts` | **Sesión propia** (pequeña) | Abierto en pipeline y leads; **cerrado en comisiones** (R3.6) |
| H34 | La auditoría de metas lee el estado anterior fuera del upsert | `src/application/metas/casos-de-uso.ts` | Al cerrar la migración | Abierto |
| H35 | Asignar proyectos a un broker no bloquea filas: gana el último | `src/application/brokers/casos-de-uso.ts` | Al cerrar la migración | Abierto |
| H36 | La consulta del CSV carga todas las propiedades principales, no las filtradas | `src/app/(crm)/comisiones/_consulta.ts` | Al cerrar la migración | Abierto |
| H37 | Los montos del CSV salen como texto, contra lo que `csv.ts` documenta | `src/application/comisiones/casos-de-uso.ts` | Al cerrar la migración | Abierto |
| H38 | Se puede fijar meta a un broker inactivo o borrado | `src/application/metas/casos-de-uso.ts` | Al cerrar la migración | Abierto |
| H13 | El CLI de shadcn no funciona en el contenedor: `ui.shadcn.com` da 403 | entorno | Entorno, con rodeo conocido | Abierto |
| H14 | Las 15 primitivas de shadcn entran sin prueba ni revisión visual | `src/components/ui/` | Revisión visual pendiente | Abierto |

---

## H1 · El orden de capas CSS no lo protege nada

**Qué pasa.** R5.1 mete Tailwind conviviendo con el CSS antiguo. Funciona porque
`src/app/tokens.css` importa `globals.css` dentro de `@layer legado`, la capa de
menor prioridad, y así las utilidades de Tailwind ganan a los selectores de
elemento del CSS viejo. En CSS, lo que está **fuera** de una capa gana a lo que
está **dentro** de `@layer`, sin importar la especificidad; sin ese `layer()`, un
`<Input>` de shadcn heredaría el borde, el alto y el ancho que `globals.css`
impone a `input, select, textarea`, y ninguna clase podría corregirlo.

**Por qué es frágil.** Tailwind **no conserva** en el CSS generado la sentencia
`@layer legado, theme, base, components, utilities;`. El orden real lo fija la
primera aparición de cada capa, o sea **el orden de los `@import`**. Hoy sale
bien porque `globals.css` se importa primero. Si alguien reordena esas líneas:

- el CSS viejo pasa a ganar a las utilidades,
- todas las vistas migradas se descolocan a la vez,
- `typecheck`, `lint`, `npm test` y `npm run build` siguen **en verde**, porque
  ninguno mira el CSS generado.

Un fallo que no rompe ninguna comprobación y sale en todas las pantallas es la
peor combinación posible.

**Tamaño real, sin inflarlo.** Es de frontend. No afecta a la arquitectura por
capas: los casos de uso, los puertos y los adaptadores no dependen del CSS, y
`src/infrastructure/arquitectura.test.ts` sigue impidiendo que se rompa la
dirección de las dependencias. Lo que sí es cierto es que un descuadre aquí deja
el CRM inusable aunque todo el backend esté perfecto.

**Hoy está mitigado solo con un comentario** en la cabecera de `tokens.css`, con
el comando de comprobación manual. Un comentario no es un candado.

**Propuesta para la sesión dedicada:**

1. **Un candado automático.** Un script (`scripts/verificar-capas-css.mjs`) que
   lea el CSS generado en `.next/static/css/` y falle si `legado` no aparece
   antes de `utilities`, o si hay reglas de preflight mientras `globals.css`
   exista. Se engancha al workflow de CI después de `npm run build`, no a
   `npm test`, porque `npm test` no compila. Es el mismo criterio que la decisión
   #40: las reglas comprobables las comprueba CI, no la memoria.
2. **Decidir si se adelanta R5.8.** El problema desaparece por completo cuando
   `globals.css` deja de existir. Merece la pena valorar si conviene adelantar la
   retirada en vez de arrastrar la convivencia durante todo R5.
3. Si no se adelanta, **separar los selectores de elemento** (ver H2).

**Verificación manual mientras no exista el candado:**
`grep -o "@layer [a-z]*{" .next/static/css/*.css | head` debe listar `legado`
antes de `utilities`, y no debe aparecer preflight.

## H2 · `globals.css` es un punto único de fallo

**Qué pasa.** Son 500 líneas sin una sola capa (`grep -c "@layer"` da 0) que
estilan con **selectores de elemento globales**: `*`, `html, body`,
`button, input, select, textarea`, `input, select, textarea` con borde, alto,
padding y ancho, `table { min-width: 880px }`, `th`, `td`, `label`, `h1-h3`.
Cualquier componente nuevo del CRM, en cualquier vista, hereda eso sin pedirlo.

**Por qué importa más allá de H1.** Es acoplamiento global: un archivo que nadie
importa explícitamente y del que dependen catorce vistas. Contradice la
modularidad que el resto del milestone está construyendo —cada módulo con sus
propios archivos, sin un archivo central que todos editen— y es un punto único de
fallo: tocarlo mal afecta a todo el CRM a la vez, y no hay forma de saber qué
vista dependía de qué regla.

**Propuesta para la sesión dedicada** (junto con H1): separar las líneas 44-64
(los selectores de elemento, que son las peligrosas) del resto, que son clases
(`.filter-bar`, `.table-wrap`, `.split-view`…). Las clases se van retirando vista
por vista conforme R5.2-R5.7 las migran; los selectores de elemento son los que
hay que aislar cuanto antes, porque afectan también a lo ya migrado.

Nota de alcance: `globals.css` es archivo de **R5.8**. Ningún issue anterior lo
toca, y esta sesión dedicada es el sitio donde decidir si esa asignación cambia.

## H3 · `http.ts` no se puede probar

`src/infrastructure/http.ts` importa `@/domain/errors` como **valor**, con el
alias `@/`. `npm test` es `node --test` sobre TypeScript sin compilar, y Node no
resuelve ese alias, así que el archivo no se puede importar desde una prueba. Por
eso no existe `http.test.ts` y no hay ninguna prueba de `errorResponse`, que es
**el único sitio donde el dominio se convierte en códigos HTTP** de todo el CRM.

Arreglo: pasar ese import a ruta relativa con extensión (`../domain/errors.ts`),
como hace `audit.ts` por el mismo motivo. Es una línea. No se hizo en R1.3 porque
`http.ts` está fuera de los archivos de ese issue y tocar el traductor de todos
los códigos HTTP del CRM para habilitar una prueba no es algo que se cuele en un
commit ajeno.

## H4 · El 403 no tiene prueba automática

Consecuencia de H3. La cadena del guardia que R1.3 movió tiene tres eslabones:

1. el caso de uso lanza `ForbiddenError` con el mensaje exacto — **probado**
   (`src/application/contactos/casos-de-uso.test.ts`);
2. `errorResponse` lo traduce a 403 — **sin probar** (H3);
3. la ruta hace `catch (error) { return errorResponse(error) }` — una línea.

El eslabón 2 es código anterior a la reestructuración por el que pasan todos los
403 del CRM, así que no es un riesgo nuevo, pero tampoco está cubierto. Se cierra
solo cuando se cierre H3.

Comprobación manual mientras tanto, con sesión de broker abierta y un contacto
propio, en la consola del navegador:

```js
await fetch('/api/contactos/ID_DE_UN_CONTACTO_PROPIO', {
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ brokerId: 2 }),
}).then(async r => ({ status: r.status, body: await r.json() }));
```

Debe dar `403` y el mensaje de `casos-de-uso.ts`. No se puede provocar desde la
interfaz porque la interfaz no ofrece el control —el selector de responsable solo
se pinta con alcance `all`—, que es justo el comportamiento correcto.

## H5 · `--muted` significa dos cosas distintas

En `globals.css`, `--muted` es un color de **texto** (`#687189`). En shadcn,
`--muted` es un **fondo** (le correspondería `surface-alt`, `#F8F9FB`). Como la
capa `base` gana a `legado`, declarar la variable de shadcn dejaría el texto
atenuado de las vistas viejas casi invisible.

Está **desactivado a propósito**: `tokens.css` no declara `--muted`, `bg-muted`
toma el valor directo y `text-muted-foreground` da el `#646D85` de `DESIGN.md`.
R5.8 lo declara al retirar `globals.css`. Anotado aquí para que no se "arregle"
antes de tiempo.

## H6 · El pool se construye aunque la respuesta sea 403

`contactosParaEscritura()` llama a `getDb()` al armarse, así que un `PATCH` que
responde 403 por reasignación construye el pool donde antes no lo hacía.
`getDb()` está cacheado y `postgres-js` no abre conexión hasta la primera
consulta, así que **no hay efecto observable**. Se anota por si aparece en una
revisión futura, y porque el arreglo (hacer la dependencia perezosa) no vale la
maquinaria que cuesta hasta que algo lo justifique.

## H7 · Las referencias `archivo:línea` caducan solas

`src/application/README.md` tiene 55 referencias del tipo `archivo:línea`. Son
útiles para navegar, pero cada edición de esos archivos las desplaza, y nada
avisa: R3, R4 y R5 van a mover esas líneas durante semanas. Ya pasó una vez
(H12).

Propuesta: al cerrar la migración, cambiar las que apuntan a un símbolo por el
nombre del símbolo (`casos-de-uso.ts` → `editarContacto`), que no se desplaza, y
conservar el número de línea solo donde señale algo que no tiene nombre.

Aprendizaje de proceso que conviene no perder: el primer script con que comprobé
esas referencias tenía la clase de caracteres mal formada y extrajo **cero**
referencias, así que informó "ningún problema" habiendo cuatro. Un verificador
roto y un verificador que no encuentra nada se parecen demasiado: cuando una
comprobación sale limpia a la primera, conviene probarla contra un caso que
sepamos malo.

## H8 · Credenciales de prueba en el repositorio

`scripts/crear-usuario-prueba.mjs` contiene credenciales. Es el único
incumplimiento de la decisión #39 y está **pendiente a propósito** desde el 21 de
septiembre de 2026: se limpia antes de la entrega. No es un hallazgo de esta
reestructuración; se recoge aquí para que no se pierda de vista al cerrarla.

## H9 · Sin línea base de regresión en 12 de 13 módulos

`docs/R_REGRESION.md` necesita una línea base ejecutada a mano por módulo. Hoy
solo **contactos** la tiene (30 de septiembre de 2026). No es un defecto: la
línea base de cada módulo se toma justo antes de migrarlo, que es cuando sirve de
algo. Se anota para que el estado de cobertura sea visible y nadie dé por
verificado un módulo que no lo está.

## H10 · Datos de prueba dejados en la base

La verificación de contactos del 30 de septiembre dejó a propósito el contacto
`Duplicado UI 2026` (teléfono `8095557777`, responsable `Admin de Prueba`), para
no borrar nada sin confirmar. Se limpia al cerrar la migración, junto con lo que
vayan dejando las demás líneas base. La lista viva está en `docs/R_REGRESION.md`.

## H11 · `arquitectura.md` afirmaba tres cosas falsas — **cerrado**

Decía que no hay estilos, que nadie escribe en `audit_log` y que no existen
consultas reales de negocio: las tres dejaron de ser ciertas en F1-F3. También
decía que las altas de usuario son manuales hasta M13, cuando `api/usuarios` las
hace por invitación desde F2. Corregido en `b0b4660` (R1.4).

## H12 · Referencias del README a archivos de antes de migrar — **cerrado**

Cuatro de las 55 referencias apuntaban a líneas de los archivos previos a la
migración: `page.tsx:192-238` en un archivo de 81 líneas, y tres de
`[id]/route.ts` por encima de sus 87. Corregidas y revalidadas las 55 en
`b0b4660` (R1.4). La causa de fondo sigue abierta como H7.

## H13 · El CLI de shadcn no funciona en el contenedor

`npx shadcn@latest add …` falla: `ui.shadcn.com` responde **403** a través del
proxy del contenedor de Claude Code. No es un fallo del proyecto ni de la
configuración de `components.json`.

Rodeo que sí funciona, y con el que entraron las 15 primitivas de R5.1: bajar el
código oficial del registro `new-york-v4` desde `raw.githubusercontent.com`
(ese host sí responde) y ajustar las rutas de import a `@/lib/utils`,
`@/components/ui/*` y `@/hooks/*`. Es el mismo código del registro, no escrito a
mano.

Quien añada una primitiva nueva en R5.2-R5.7 se va a topar con esto: por eso
queda anotado. En una máquina local con red normal el CLI funciona y es la vía
preferible.

## H14 · Las primitivas entran sin prueba ni revisión visual

`src/components/ui/` tiene 15 primitivas de terceros, adaptadas (foco a
`ring-2 ring-ring`, alturas de 44/48 px, ancho de barra lateral de 248 px,
`sonner` sin `next-themes`). Nada las verifica: `npm test` no renderiza
componentes y en este entorno no hay credenciales para levantar la aplicación.

No es un defecto conocido, es **cobertura que falta**, y se anota para que no se
confunda "compila y las pruebas pasan" con "se ve bien y es accesible". Se cierra
con la revisión visual completa que pide la decisión #42, comprobando lo que el
propio `DESIGN.md` §Accesibilidad exige: foco visible en todo lo interactivo,
contraste AA y navegación por teclado.

Cambios visibles del shell de R5.1 que hay que mirar en esa revisión, todos
deliberados:

- el lockup de marca pierde un detalle decorativo;
- la etiqueta «Panel de trabajo» deja de ser dorada y pasa a
  `text-muted-foreground`. **No es un arreglo de contraste**: el `gold-700`
  anterior (`#9B7300`) sobre fondo claro ronda 4,6:1 y sí pasa AA. Es aplicar la
  regla de `DESIGN.md` de que el dorado se reserva para una acción primaria, la
  navegación activa, el foco y los datos financieros — una etiqueta de cabecera
  no es ninguna de esas cosas;
- el botón de cierre de sesión usa el icono `LogOut` de lucide en vez del «↗»;
- en móvil aparece un disparador de barra lateral (`Sheet`) que antes no existía.

La navegación se dejó **plana**, con los 15 enlaces en el mismo orden y sin
grupos colapsables, aunque `collapsible-05` los contemple: no hay una agrupación
definida en el plan ni en `DESIGN.md`, y `DESIGN.md` dice que el orden de la
navegación no cambia entre roles. Agrupar sería inventar una taxonomía, y las
funciones nuevas están congeladas. Si se quiere agrupar, es una decisión de
diseño que hay que tomar antes, no de paso.

---

## H15 · Un broker podía sobrescribir la «próxima acción» del negocio de otro — **BLOQUEANTE, arreglado en parte**

Encontrado al escribir el guion de regresión (R2.1) y **verificado leyendo el
código**, no solo reportado.

`POST /api/actividades` (`src/app/api/actividades/route.ts`):

1. Llama a `requireScope(actor, "activities", "create")`, pero **descarta el
   alcance que devuelve**: no lo asigna a ninguna variable.
2. Acepta `dealId` sin comprobar que ese negocio esté dentro del alcance del
   actor.
3. Y al final del `transaction`, cuando la actividad se crea como pendiente:
   `tx.update(deals).set({ nextActivityId: actividad.id }).where(eq(deals.id, datos.dealId))`
   — **escribe en cualquier fila de `deals`**, sin `visibleRows` ni `reaches`.

Escenario concreto: un broker con alcance `own` manda
`POST /api/actividades { "title": "x", "activityType": "call", "dealId": N }` con
el id de un negocio de otro broker. La actividad se crea y el
`next_activity_id` del negocio ajeno queda apuntando a ella. El dueño del
negocio ve como «próxima acción» algo que no agendó y sobre lo que no puede
actuar.

Por qué no lo atrapó nada: `src/infrastructure/seguridad.test.ts` comprueba que
cada ruta **llame** a `requireScope`, y esta lo llama. Lo que falta es **usar**
el alcance, que es precisamente la regla de `AGENTS.md` («las rutas por `:id`
filtran con `visibleRows`/`reaches`»). Una comprobación de presencia no puede
detectar un alcance que se pide y se tira.

Tamaño: es escritura entre alcances, o sea corrupción de datos de otro usuario,
así que entra en la casilla **bloqueante** de la decisión #42. Con dos matices
honestos: todos los actores son empleados autenticados, no internet anónimo; y no
hay fuga de lectura —el broker no llega a ver el negocio ajeno—, solo escritura.

Arreglo mínimo y claro: si viene `dealId`, releer el negocio dentro de la
transacción filtrando con `visibleRows`/`reaches` y lanzar `NotFoundError` si no
está en el alcance, que es lo que ya hacen `api/contactos/[id]` y
`api/leads/[id]`.

Dos partes del mismo endpoint que **no** son un arreglo obvio y no deben colarse
en ese commit, porque son decisiones de producto:

- `assigneeId: datos.assigneeId ?? actor.userId` — ¿puede un broker agendarle
  una actividad a otra persona? Hoy sí. Puede ser deliberado (una asistente
  agenda por un broker), pero nadie lo ha decidido por escrito.
- `contactId` y `projectId` entran igual de sin comprobar. En proyectos el
  alcance no es «dueño», sino asignación de proyectos a brokers, así que el
  filtro no es el mismo y merece su propio análisis.

Ambas quedan como preguntas abiertas para **R3.3** (actividades, de Codex), que
es quien reescribe este endpoint. Aviso importante para ese issue: su regla es
conservar el comportamiento, así que **si este hallazgo no se arregla antes, la
migración lo trasladaría fielmente** a la arquitectura nueva y sería más difícil
de ver.

## H16 · Reasignar un lead propio no exige alcance `all`; reasignar un contacto sí

En `PATCH /api/leads/[id]` el alcance **sí** se aplica:
`reaches(actor, scope, lead.brokerId)` (`route.ts:47`) impide que un broker toque
el lead de otro. Lo que puede hacer es **reasignar un lead propio a otro broker**,
es decir quitárselo de encima.

En contactos eso exige alcance `all` desde la deuda de F1 (issue #21): «reasignar
el responsable es una decisión de cartera, no de edición de ficha».

No es un fallo de seguridad —el alcance se respeta—, es que **los dos módulos
aplican reglas distintas a la misma acción**. En leads puede ser deliberado: el
endpoint existe justamente para asignar, y pasar un lead a un compañero puede ser
comportamiento de negocio legítimo. Decisión de producto, no bug: si la regla de
contactos es la buena, leads debería igualarla en R3.2; si la de leads es la
buena, conviene escribirlo para que nadie lo «arregle» creyendo que falta.

## H17 · El correo de recuperación apunta a una ruta que no existe

`src/app/api/auth/recuperar/route.ts:21` envía el enlace a
`/recuperar/nueva-clave`, y esa ruta no existe en `src/app`. Quien pida recuperar
la contraseña recibe un correo que lleva a un 404. Es user-facing y de arreglo
conocido (crear la página o corregir el destino), pero es **una función que
falta**, no un cambio de estructura: se agrupa al cerrar la migración para no
abrir funcionalidad nueva durante el milestone (decisión 4).

## H18 · Una invitación recién enviada se muestra como «Aceptada»

`api/usuarios` guarda `auth_user_id` en el momento de **enviar** la invitación,
no cuando el usuario la acepta, así que la interfaz la muestra como aceptada sin
que nadie haya entrado. «Pendiente» solo aparece si el envío falló, que es justo
al revés de lo que el usuario espera. Toca `api/usuarios` (**R3.5**, de Codex) y
la vista de configuración (**R5.7**).

## H19 · El historial muestra el texto crudo de dos acciones

`src/app/(crm)/_ui/historial.tsx` no tiene etiqueta legible para las acciones
`asignar` ni `descartar`, y pinta el identificador en crudo. Además, los leads que
entran por el webhook público aparecen con autor «Usuario eliminado», porque su
auditoría se guarda con `user_id` nulo: no hay usuario detrás, es una captura
externa, y la interfaz no distingue «nadie» de «borrado». El historial pasa a una
consulta compartida en **R4.3**.

## H20 · Ocho desajustes menores entre el código, el glosario y los scripts

Ninguno rompe nada; se agrupan para tacharlos de una pasada al cerrar la
migración.

1. **Ninguna pantalla envía `dealId`** al crear una actividad, así que las reglas
   de etapa Contactado y Presentación no se pueden cumplir desde la interfaz. El
   guion las ejecuta por consola. (Relacionado con H15: el campo existe en la API
   y nadie lo usa desde la interfaz.)
2. **El usuario broker de prueba** de `scripts/crear-usuario-prueba.mjs` no
   recibe fila en `broker_profiles`, así que no sale en `/brokers` ni `/metas` ni
   es asignable a un lead hasta que se le edita desde la interfaz.
3. **El glosario dice que la asistente no ve** pipeline, propiedades, comisiones
   ni reportes, pero `db/seed.sql` le da `view all` en los cuatro. Uno de los dos
   está mal y hay que decidir cuál.
4. **Restaurar un usuario de la papelera** lo devuelve como «Inactivo»: eliminar
   lo desactiva y restaurar solo quita la marca de borrado.
5. **Los parámetros de URL no son uniformes**: cada módulo usa el suyo
   (`?contacto=`, `?lead=`, `?deal=`), y ninguna página usa `?id=`.
6. **El aviso de duplicado lista contactos de toda la cartera**, también los que
   un broker no puede ver. Es la decisión #19 y es deliberado, pero conviene
   comprobar en navegador qué datos del contacto ajeno se enseñan.
7. **Un lead registrado por un broker** no aparece en su propia lista, según el
   código. Sin comprobar en navegador.
8. **El doble cierre concurrente de un negocio** no tiene resultado fijado por el
   código, así que el guion no puede exigir uno.

### H15 · Qué se arregló y qué sigue abierto

**Arreglado** (commit de este mismo cambio, en `api/actividades/route.ts`): el
alcance que devuelve `requireScope` se guarda y **se usa**. Si llega `dealId`, el
negocio se relee dentro de la transacción filtrando con `visibleRows` y se lanza
`NotFoundError` si no está en el alcance del actor — el mismo patrón de
`api/contactos/[id]` y `api/leads/[id]`. Con eso, la escritura de
`deals.nextActivityId` ya no puede caer en un negocio ajeno.

Se arregló ahora, y no en R3.3, por dos razones: es escritura entre alcances, o
sea la casilla bloqueante de la decisión #42; y la regla de R3.3 es conservar el
comportamiento, así que migrar primero habría trasladado el fallo fielmente a la
arquitectura nueva, donde cuesta más verlo. La decisión 4 del plan permite
expresamente «arreglos urgentes, que se traen a la rama de integración».

**Sigue abierto, para R3.3, porque son decisiones de producto y no se deciden de
paso:**

- `assigneeId`: hoy cualquiera puede agendarle una actividad a otra persona. El
  docblock de la ruta dice que «un administrador con alcance `all` puede agendar
  una tarea para un broker», lo que sugiere que con alcance `own` no debería,
  pero no lo dice explícitamente y el código no lo impide. Igualarlo a la regla
  de contactos (reasignar exige `all`) es lo coherente, pero es una decisión, no
  un arreglo.
- `contactId` y `projectId` entran igual de sin comprobar. En contactos el filtro
  es el mismo `visibleRows`; en proyectos el alcance no es «dueño» sino
  asignación de proyectos a brokers, así que necesita su propio análisis.

**Lo que sigue sin cubrir: la prueba.** No hay prueba automática de este arreglo.
El patrón de la casa (`api/metas/route.test.ts`) evita importar un `route.ts`
porque arrastra `requireActor` y `transaction`, que abren conexión. La prueba
llega con R3.3, cuando la lógica pase a un caso de uso que se puede montar con
dobles en memoria: ahí hay que escribir «un actor con alcance `own` no puede
adjuntar una actividad al negocio de otro». Anotado para que ese issue no lo
olvide.

## H21 · El cambio simple de etapa no bloquea la fila

Encontrado al migrar R3.1. **Es del código original, no lo introduce la
migración**, y es el hallazgo más serio de los abiertos.

El cierre (`kind === "won"`) tiene tres defensas contra el doble cierre:
`validarTransicion`, el `SELECT ... FOR UPDATE` y el índice `commissions_deal_unq`.
La rama del **cambio simple de etapa, incluida la pérdida**, no tiene ninguna: lee
el negocio sin bloquearlo.

Escenario: dos peticiones casi simultáneas sobre el mismo negocio, una cerrándolo
como ganado y otra marcándolo como perdido. Las dos leen el negocio cuando todavía
está `open`, las dos pasan `validarTransicion`, y la pérdida escribe después. El
negocio queda marcado como perdido **conservando su `closedAt`, su monto y su fila
en `commissions`**: una comisión pendiente de pago sobre un negocio perdido. Es
corrupción de datos financieros.

Probabilidad baja —hacen falta dos operaciones a la vez sobre el mismo negocio—,
impacto alto.

**El arreglo es de una línea**: usar `bloquearNegocio` en lugar de la lectura
normal también en la rama simple. Pero **no se hizo en R3.1 a propósito**, por dos
razones:

1. La regla de R3.1 es conservar el comportamiento, y añadir un bloqueo lo cambia.
   Mezclarlo con la migración hace que una revisión no pueda distinguir «esto lo
   moví» de «esto lo cambié», que es justo lo que esa regla evita.
2. Tiene una dimensión que no es solo correctitud: el cambio de etapa es la
   operación más frecuente del CRM (arrastrar una tarjeta en el kanban), así que
   bloquear la fila en cada cambio introduce contención donde hoy no la hay. Eso
   es una decisión, no un arreglo obvio.

Recomendación para la sesión dedicada: aplicarlo, porque la contención sobre una
fila que se está editando es precisamente lo que se quiere, pero medirlo antes con
el kanban abierto por dos usuarios. Y escribir la prueba: hoy ninguna cubre esta
rama, porque en memoria no hay concurrencia (la de `won` se prueba con una perilla
del doble que simula la carrera; se puede hacer lo mismo aquí).

## H22 · El candado de arquitectura exigía las dos mitades a la vez — **cerrado**

`arquitectura.test.ts` consideraba un módulo migrado en cuanto existía
`src/application/<modulo>/`, y desde ese momento prohibía el acceso a la base
tanto en `app/api/<modulo>` como en `app/(crm)/<modulo>`.

Pero el plan migra cada módulo en **dos tiempos**: escrituras en R3 (las rutas) y
lecturas en R4 (las páginas), en issues distintos y a veces de agentes distintos.
Al terminar R3.1, el candado empezó a exigir la página de pipeline, que es de R4.1
y además depende de un issue de Codex. Resultado: `npm test` y el build en rojo
sin nada que un solo issue pueda arreglar.

Un candado que obliga a romper el build para avanzar se acaba desactivando, así que
se corrigió en R3.1: ahora mira **qué archivo existe**, no solo la carpeta —
`casos-de-uso.ts` cierra `app/api/<modulo>`, `consultas.ts` cierra
`app/(crm)/<modulo>`—, y se endurece en los mismos dos tiempos que el plan. R6.1
lo pone en modo estricto para todo `src/app/` cuando no quede ninguna mitad sin
migrar.

Comprobado en los dos sentidos: con un import prohibido plantado en
`api/pipeline`, la prueba falla; al quitarlo, las 205 vuelven a verde.

## H23 · `isPrimary` convierte la cadena `"false"` en `true`

`z.coerce.boolean()` aplica la conversión de JavaScript: cualquier cadena no vacía
es `true`, así que `"false"` pasa a `true`. Con un cuerpo JSON que manda un
booleano de verdad no ocurre, y hoy la vista manda JSON, así que no está
explotado. Se agrupa al cerrar la migración.

## H24 · `expectedCloseDate` no valida formato

Es `z.string()` sin más, y va a una columna `date`. Una fecha con formato inválido
llega a Postgres y da un 500 genérico en vez de un 400 con el campo señalado. De
arreglo conocido (un `z.string().date()` o equivalente); se agrupa al cerrar.

## H25 · El paso 7 no limpia `deals.next_activity_id`

Al cerrar un negocio, el paso 7 cancela sus actividades futuras pendientes, pero
`deals.next_activity_id` sigue apuntando a una de ellas, ahora cancelada. La
lectura de la próxima acción ya exige `status === "pending"`, así que la interfaz
no la muestra como vigente y no hay error visible; queda un puntero muerto. Se
agrupa al cerrar la migración.

## H26 · Cinco comentarios citan un archivo que ya no existe

R3.1 movió `api/pipeline/[id]/etapa/_cierre.ts` a `src/application/pipeline/cierre.ts`
y lo eliminó. Cinco docblocks siguen citando la ruta vieja:
`src/domain/cierre-negocio.ts`, `src/domain/zona-horaria.ts`,
`src/app/api/metas/route.ts`, `src/app/api/comisiones/[id]/route.ts` y
`src/app/(crm)/comisiones/page.tsx`.

No rompe nada, pero manda a quien lea a un archivo inexistente. No se arregló en
R3.1 porque dos de los cinco están en `domain/`, que ese issue no puede tocar, y
cambiar comentarios de dominio dentro del commit de una migración ensucia
precisamente el diff que más falta hace poder leer. Se agrupan al cerrar la
migración, junto con H7 (las referencias `archivo:línea` que caducan): son el mismo
problema, documentación que apunta a código que se movió.

---

## El patrón que dibujan H21, H27 y H29

Los tres salieron de migrar pipeline y leads, y los tres son del código original.
Vistos juntos dicen algo que ninguno dice por separado:

**El CRM tiene una sola operación defendida contra la concurrencia, y varias de
la misma forma sin defender.** El cierre de negocio ganado tiene tres defensas
—`validarTransicion`, `SELECT ... FOR UPDATE` y el índice `commissions_deal_unq`—
y están documentadas con esmero. Pero el cambio simple de etapa (H21), la
conversión de lead (H29) y la captura externa sin teléfono ni correo (H27) hacen
lo mismo: leen, deciden y escriben sin bloquear, en operaciones que crean filas
financieras o de cartera.

No es descuido de quien escribió el cierre: es que **la defensa se añadió donde
alguien se paró a pensar en la carrera**, y las demás nunca tuvieron ese momento.
Ese es el hallazgo real, y es de diseño, no de una línea.

Recomendación para la sesión dedicada: tratarlos como un solo trabajo, no como
tres arreglos. Decidir una regla —«toda operación que crea una fila de negocio
bloquea antes la fila de la que depende»— y aplicarla a las tres, con la medida de
contención que H21 pide. Un arreglo suelto en cada sitio deja el mismo problema
esperando en el siguiente módulo que se migre.

## H27 · El webhook repetido sin teléfono ni correo deja contactos huérfanos

`externo/route.ts` crea o reutiliza el contacto **antes** del upsert del lead. Si
la entrega trae teléfono o correo, la reutilización hace que una segunda entrega
no cree contacto nuevo. Pero **si no trae ninguno de los dos** —y ambos son
opcionales; solo `fullName` y `externalId` son obligatorios— no hay por dónde
reutilizar: cada entrega crea un contacto nuevo con su fila de auditoría, y solo
después el upsert descarta el lead duplicado.

Consecuencia: entregar dos veces el mismo `externalId` sin teléfono ni correo deja
**un contacto huérfano y una fila de auditoría por entrega**, aunque el lead no se
duplique. Contradice la idempotencia que promete la decisión #20, que es la razón
de ser de este endpoint, y ocurre en la **única entrada pública** del sistema.

Arreglo propuesto: al principio de la transacción, comprobar si ya existe un lead
vivo con ese `externalId` y, si existe, devolverlo con `creado: false` sin tocar
contactos. El upsert se queda igual: sigue siendo quien cubre la carrera de dos
primeras entregas simultáneas. Con eso la entrega repetida —el caso real, un
reintento del portal— pasa a ser idempotente de verdad.

No se arregló en R3.2 porque reordena la transacción y cambia el comportamiento en
el commit que promete no cambiarlo. Va con H21 y H29.

## H28 · El `SELECT` de respaldo del webhook no filtra `deleted_at`

Cuando el upsert no inserta (ya había un lead vivo con ese `externalId`), el
respaldo busca por `externalId` sin excluir los borrados. Como
`leads_external_id_unq` es parcial (`WHERE deleted_at IS NULL`), pueden coexistir
un lead borrado y uno vivo con el mismo `externalId`, y el `limit(1)` podría
devolver el borrado. La respuesta llevaría entonces un lead de la papelera.
Arreglo conocido: añadir `isNull(leads.deletedAt)` a ese `SELECT`.

## H29 · La conversión de lead no bloquea la fila

`[id]/convertir` lee el lead sin `FOR UPDATE`, así que dos conversiones
simultáneas del mismo lead podrían pasar las dos sus guardas y crear **dos
negocios** para un lead. Misma clase que H21. Va en la sesión conjunta.

## H30 · Dos rutas validan la entrada antes de autenticar

- `[id]/descartar` valida el motivo antes de `requireActor`: una petición **sin
  sesión** y sin motivo recibe 422 en vez de 401. Le dice a quien no está
  autenticado algo sobre la forma del cuerpo que espera el endpoint.
- `[id]` (asignar) valida el broker contra `candidatosBroker()` antes de leer el
  lead: un broker inválido da 422 aunque el lead no exista ni esté en el alcance.

Ninguno filtra datos de negocio, pero el orden correcto es autenticar, autorizar y
después validar. Se conserva tal cual en R3.2 (hay una prueba que lo documenta) y
se agrupa al cerrar la migración, porque cambiar el orden cambia códigos de
respuesta y eso hay que hacerlo a la vista, no de paso.

## H31 · Los contactos del webhook nacen sin responsable ni autor

Un contacto creado por la captura externa tiene `brokerId` y `createdBy` nulos, así
que un broker con alcance `own` **no lo ve** hasta que alguien lo asigne. Puede ser
deliberado —el lead trae `suggestedBrokerId`, y el reparto es una decisión humana—
pero no está escrito en ninguna decisión, y explica el «Usuario eliminado» del
historial que recoge H19.

Nota relacionada: **no existe una edición general de leads**. `api/leads/[id]`
solo tiene el `PATCH` de asignar responsable. No es un defecto, es funcionalidad
que no se construyó, y las funciones nuevas están congeladas (decisión 4); se
anota porque quien busque «editar lead» no lo va a encontrar.

## H32 · Editar una actividad puede reapuntarla al negocio de otro broker

Encontrado al revisar R3.3 (Actividades, de Codex) antes de integrarlo.
**Preexistente: no lo introduce la migración.**

`crearActividad` sí comprueba el alcance sobre el negocio — es el arreglo de H15,
y la migración lo conservó citando el hallazgo por su nombre. Pero `editarActividad`
hace `if ("dealId" in entrada) cambios.dealId = entrada.dealId;` sin releer el
negocio nuevo con el alcance del actor. Comprobado contra el original: la línea 82
del `PATCH` anterior hacía exactamente lo mismo, así que Codex conservó el
comportamiento, que es lo que se le pidió.

Escenario: un broker toma una actividad propia y la reapunta al negocio de otro
broker. La actividad queda asociada a un negocio que él no puede leer, y aparecerá
en la ficha de ese negocio cuando R4 migre esas lecturas.

Es más estrecho que H15: la edición **no** escribe `deals.next_activity_id`, así
que no pisa la próxima acción del otro. Impacto: una asociación cruzada de alcance,
no corrupción de la fila ajena.

Arreglo: el mismo patrón que ya tiene `crearActividad` —
`buscarNegocioVisible(actor, alcance, nuevoDealId)` y `NotFoundError` si no está—
aplicado también cuando la edición cambia `dealId`. Y lo mismo merecen `contactId`
y `projectId`, que siguen sin comprobar en las dos rutas (es la parte de H15 que
quedó abierta por ser decisión de producto: en proyectos el alcance no es «dueño»
sino asignación).

Va al cierre de la migración, con H15: son el mismo arreglo en dos sitios, y
conviene hacerlos juntos con una regla común, como pide el patrón de H21/H27/H29.

---

## H33 · Nuestra red de pruebas no ve si un bloqueo de fila desaparece

Este hallazgo no es del CRM: es **de nuestro método de verificación**, y lo
encontramos apuntándonos a nosotros mismos.

Al migrar comisiones (R3.6) se hizo la prueba de mutación de rigor: quitar el
`{ of: commissions }` del bloqueo de fila del adaptador y ver qué caía. **No cayó
nada.** Las 300 pruebas siguieron en verde.

Y es lógico: los dobles en memoria no tienen concurrencia, así que no pueden
distinguir entre bloquear la fila correcta, bloquear dos tablas o no bloquear
nada. Una prueba de caso de uso con dobles **nunca** va a ver un `FOR UPDATE`
que falta. Lo grave es que durante seis módulos creímos que sí, porque las
mutaciones que probamos antes sí caían — pero caían por otra razón: el doble
tenía una perilla (`alBloquear`) que simulaba la carrera, y lo que la prueba
observaba era esa simulación, no el bloqueo real.

**Qué se hizo en R3.6:** una prueba que **lee el código del adaptador** y exige
exactamente un `.for("update", { of: commissions })`. Es la misma técnica que
`seguridad.test.ts` usa para exigir `requireScope` en cada ruta y
`arquitectura.test.ts` para la dirección de las capas: cuando una propiedad no se
puede observar por comportamiento, se vigila el texto que la produce. Verificado
por mutación en los dos sentidos.

**Qué sigue abierto, y es concreto.** Las mismas garantías de los módulos ya
migrados no tienen esa guarda:

| Adaptador | Garantía sin vigilar |
|---|---|
| `repos/pipeline.ts` | el `for("update")` del cierre; el `targetWhere` del índice parcial de la meta de compañía |
| `repos/leads.ts` | el `onConflictDoNothing` del webhook y su `where: isNull(leads.deletedAt)`, que repite el predicado del índice parcial |

Lo de leads ya se sabía y está dicho en el informe de R3.2 con estas palabras:
«si alguien rompe el `where` o el `onConflictDoNothing` del adaptador, ninguna
prueba cae; solo lo cubre el grep de la verificación». Un grep que se corre a
mano una vez no es una red.

**Propuesta:** extender la guarda de lectura de código a esos dos adaptadores.
Es trabajo de pruebas, sin riesgo de comportamiento, y cierra el agujero en los
tres sitios donde hoy una garantía de concurrencia depende de que nadie borre una
línea. Hacerlo **antes** de R4 y R5, porque cada módulo nuevo añade otra línea
así.

Nota de criterio: esta guarda es fea —una prueba que hace `grep` sobre código
fuente— y hay que decir por qué se acepta. Porque la alternativa honesta es una
prueba de integración con dos transacciones concurrentes contra Postgres real, y
este proyecto decidió no tener esa infraestructura (decisión 3 del milestone: sin
Playwright, red de seguridad por guion manual). Entre vigilar el texto y no
vigilar nada, se vigila el texto, y se documenta que es un sustituto.

## H34 · La auditoría de metas lee el estado anterior fuera del upsert

`fijarMetaMensual` lee el estado previo antes del upsert, para el `antes` de la
auditoría. Dos `PUT` simultáneos sobre un periodo que aún no tiene fila pueden
auditarse **ambos** como creación, o con un `antes` ya obsoleto.

**Los datos quedan bien**: el upsert es atómico y esa parte no tiene carrera. Lo
que puede mentir es el rastro. Es de la familia de H21/H27/H29 y va con ellos.

## H35 · Asignar proyectos a un broker no bloquea filas

La selección y el `UPDATE` de proyectos asignados no bloquean. Dos asignaciones
simultáneas del mismo proyecto a brokers distintos acaban con «gana el último» y
un `antes` obsoleto en la auditoría. Tampoco se vuelve a comprobar, al escribir,
que el proyecto siga activo y sin borrar. Misma familia.

## H36 · La consulta del CSV carga todas las propiedades principales

`consultarFilas` trae todas las propiedades principales de la tabla, no solo las
de los negocios que pasaron el filtro. Es un problema de escala, no de
corrección: hoy no se nota, y con unos miles de negocios sí. R4.3 toca ese
archivo, así que es el sitio natural para arreglarlo.

## H37 · Los montos del CSV salen como texto

Salen como cadenas de `toFixed(2)` en vez de números, aunque el docblock de
`domain/csv.ts` documente lo contrario. Consecuencia real, aunque hoy
inalcanzable: un monto negativo recibiría el prefijo `'` de neutralización de
fórmulas que `csv.ts` aplica a las cadenas. Hoy no hay montos negativos.

## H38 · Se puede fijar meta a un broker inactivo o borrado

Para `brokerId` solo se exige que exista el perfil, no que el broker esté activo
ni sin borrar. El módulo de brokers sí lo valida al asignar proyectos, así que
los dos módulos aplican criterios distintos a la misma pregunta. Decisión de
producto más que fallo: puede tener sentido conservar la meta histórica de alguien
que se fue.
