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
