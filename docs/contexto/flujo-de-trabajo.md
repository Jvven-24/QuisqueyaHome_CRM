# Flujo de trabajo — CRM Quisqueya Home

Cómo se trabaja en el **repositorio de producción**. Si buscas cómo funcionaba
el prototipo (vinext, Cloudflare Workers, D1), eso vive en
`referencia-prototipo/` y ya no aplica a nada de aquí.

## 1. Al abrir una sesión: orientarse rápido

Antes de tocar código, una lectura rápida de orientación (no una auditoría
completa del repo — esa llega en el punto 2, cuando se recibe una fase
concreta):

- `docs/contexto/decisiones.md` explica **por qué** el código es como es. Si algo
  parece raro, probablemente hay una decisión ahí que lo explica.
- `docs/contexto/errores-conocidos.md` — gotchas ya confirmados, para no
  redescubrirlos.
- `MAPEO_FRONTEND_CRM.md` es el documento vinculante: §10 tiene las reglas de
  negocio, §12 el inventario por módulo, §18 las fronteras de cada uno.
- `git status` y `git log --oneline -10` de la rama actual — en qué quedó la
  sesión anterior, antes de asumir nada.
- `docs/SUPABASE.md` si todavía no tienes base de datos configurada.

## 2. Cuando se indica una fase de trabajo (ej. «trabaja en F2»)

Antes de escribir una sola línea de código:

1. **Buscar todo lo que ya existe sobre esa fase**: `MAPEO_FRONTEND_CRM.md`,
   `AUDITORIA_FUNCIONAL_CRM.md`, cualquier `docs/F<n>_ANALISIS_Y_PLAN.md`
   anterior, y las entradas de `decisiones.md` / `errores-conocidos.md` que la
   mencionen.
2. **Revisar el repo real** contra esos documentos: qué de lo que se supone que
   existe ya está construido, qué falta, qué quedó a medias.
3. **Crear los issues correspondientes en GitHub** (`gh issue create`, uno por
   defecto o unidad de trabajo identificada) — no se empieza a codear sin
   issue.
4. **Escribir el plan de implementación de la fase**
   (`docs/F<n>_ANALISIS_Y_PLAN.md`, mismo patrón que `F0_ANALISIS_Y_PLAN.md` y
   `F1_ANALISIS_Y_PLAN.md`), antes de tocar código.

Recién con issues y plan escritos se empieza a construir.

## Poner en marcha

```bash
npm install                # Node >=22.13.0
cp .env.example .env       # y rellenar — ver docs/SUPABASE.md
npm run db:migrate
npm run db:seed
npm run dev
```

## 3. Construcción: ponytail es obligatorio

Todo el código de este repo se escribe y se revisa con ponytail, issue por
issue:

- **Al escribir código**: skill `ponytail` — evita sobre-ingeniería,
  dependencias innecesarias, abstracciones especulativas.
- **Al revisar el diff de cada issue**: skill `ponytail-review` antes de darlo
  por cerrado.
- **Auditoría del repo**: `ponytail-audit` **no es opcional ni se omite**,
  aunque el cambio parezca chico — es lo que atrapa lo que `ponytail-review`,
  por mirar solo el diff, no ve.

Un atajo deliberado que ponytail deja a propósito se marca en el código con un
comentario `ponytail:` (ya en uso, ver decisión #22 — mocks explícitos de
módulos sin backend todavía), para que quede rastreable y no se pierda.

## Pasos para un cambio

```bash
git checkout develop && git pull
git checkout dev/<tu-nombre>        # tu rama personal, creada desde develop
# … trabajar …
npm run typecheck && npm run lint && npm test && npm run build
```

Los cuatro comandos son los mismos que corre la CI en cada PR. Si pasan en
local, pasan allí.

Después: PR contra `develop`, **siempre desde la misma rama `dev/<tu-nombre>`**
en la que se trabajó. Cuando `develop` esté estable, PR contra `main`.
**`main` y `develop` están protegidas**: no se comitea directo a ninguna.

### Prohibido: crear ramas nuevas para fixes puntuales

**No se crean ramas `fix/<issue-o-descripcion>`, `chore/<algo>` ni ninguna rama
nueva para arreglos de auditoría, regresiones o fixtures de prueba**, aunque la
guardia de ramas las acepte. Todo eso se trabaja y se sube **sobre la rama
personal ya existente** (`dev/<tu-nombre>`), en commits separados si hace falta
distinguirlos.

**Por qué (14 de septiembre de 2026):** se crearon 3 ramas `fix/*` para
corregir defectos puntuales de la auditoría de F1, y eso hizo que **2 workflows
de GitHub Actions no recibieran el evento del PR correctamente** (los workflows
están configurados esperando los PR contra `develop` desde las ramas de trabajo
habituales, no desde ramas nuevas creadas al vuelo). Ver decisión #30 en
`decisiones.md`.

Si de verdad hace falta una rama nueva y separada (ej. un cambio de esquema que
exige su propio PR, §"Cambios de esquema" más abajo), **se lo pide
explícitamente el usuario primero** — no es una decisión que tome el agente por
su cuenta.

### Cambios de esquema

`src/infrastructure/db/schema.ts` está **congelado** (§18.1): todo cambio va en
su propio PR, con su migración generada (`npm run db:generate`) y revisado
aparte. Nunca dos migraciones en dos ramas a la vez — los conflictos en el
journal de Drizzle son caros.

### Detalle que muerde: `Closes #N` no cierra al mergear a `develop`

GitHub solo cierra issues automáticamente cuando el PR se mergea a la **rama por
defecto** (`main`). Como aquí se mergea a `develop`, hay que **cerrar los issues
a mano** tras el merge. Escribir `Closes #N` en la descripción igualmente vale la
pena: enlaza el issue con el PR y deja el rastro.

## 4. Commits: uno por issue

Cada issue de la fase se comitea por separado — no se agrupan varios issues en
un mismo commit aunque se hayan resuelto en la misma sesión. Conventional
Commits (ver `convenciones.md`), referenciando el issue en el mensaje.

## 5. Cierre de fase: pruebas antes del PR

Cuando todos los issues de la fase tienen su commit:

1. **Prueba unitaria**: `npm run typecheck && npm run lint && npm test && npm run build` en verde.
2. **Prueba desde interfaz**: recorrer el flujo a mano (o con el navegador de
   la sesión) — una prueba unitaria no sustituye ver el módulo funcionando de
   verdad.
3. **Si se encuentra un error en cualquiera de las dos**, se anota (en el issue
   correspondiente, o en `errores-conocidos.md` si es un gotcha reutilizable) y
   se le da **prioridad sobre seguir avanzando**: se arregla antes de tocar el
   siguiente issue o de pedir el PR.

### Regla dura: no hay PR si algo falla

**No se abre pull request mientras algo esté fallando** — typecheck, lint,
test, build, o un error encontrado en la prueba de interfaz. El trabajo no se
detiene por eso: **se puede seguir comiteando igual**, pero el mensaje del
commit **debe decir explícitamente qué está fallando**, por ejemplo:

```
fix(M4): recalcula el rango semanal

pendiente: la prueba de interfaz falla al cambiar de semana con el teclado
```

El PR se abre solo cuando la fase completa está en verde.

## 6. Seguridad: checklist por tipo de cambio

Nació de un incidente real: el 29/09/2026 Supabase avisó que las 29 tablas de
`public` no tenían RLS y cualquiera con la anon key podía leerlas y borrarlas
por PostgREST. La norma existía de palabra, no en el código. Por eso lo que se
puede comprobar solo, lo comprueba `npm test`; el resto va en esta lista.

### Lo que CI ya bloquea (`src/infrastructure/seguridad.test.ts`)

- Una tabla creada en `drizzle/*.sql` sin `ENABLE ROW LEVEL SECURITY`.
- Una ruta en `src/app/api/**/route.ts` que no llama a `requireScope` ni a
  `requireFullScope`. Las rutas públicas a propósito se declaran en
  `RUTAS_PUBLICAS` junto con lo que las protege (token, Supabase Auth).

Si una de estas pruebas falla, no se "arregla" la prueba: se arregla el código.

### Según lo que toques

| Si el cambio… | Entonces |
|---|---|
| Crea una tabla | `.enableRLS()` en su `pgTable` de `schema.ts`, para que la migración generada ya lo incluya. Sin políticas mientras solo la lea Drizzle; si algún día el navegador la lee con supabase-js, se escriben políticas antes de exponerla. |
| Crea una vista | `WITH (security_invoker = true)`. Las vistas se saltan RLS por defecto. |
| Crea una función SQL `SECURITY DEFINER` | Nunca en `public` ni en otro esquema expuesto por la API. |
| Crea una ruta de API | `requireActor` + `requireScope` antes de tocar datos. Si recibe un `:id`, releer la fila con `visibleRows`/`reaches` y responder 404 si no la alcanza. Recursos sin responsable por fila (`users`) usan `requireFullScope`. |
| Recibe un cuerpo JSON | Esquema Zod y asignación campo por campo al `insert`/`update`; nunca `...body`. |
| Añade una variable de entorno | Se declara en `infrastructure/env.ts`. `NEXT_PUBLIC_` solo si es pública por diseño. La `service_role` jamás llega a un archivo `"use client"`. |
| Redirige con un parámetro del usuario | Solo rutas internas: `/^\/(?![/\\])/`. Rechaza `//host`, `/\host` y URLs absolutas. |
| Sube o sirve archivos | Nombre generado en servidor (`randomUUID`), MIME en lista blanca, bucket privado y URLs firmadas. |
| Exporta CSV | Pasa por `domain/csv.ts`, que neutraliza fórmulas (`=`, `+`, `-`, `@`). |
| Autoriza con datos del JWT | Nunca `user_metadata`: lo edita el propio usuario. Se usa `app_metadata` o la tabla `users`. |
| Pinta HTML | Nada de `dangerouslySetInnerHTML` con datos de usuario. |

### Al cerrar una tanda de trabajo, antes del PR

1. `/security-review` sobre el diff de la rama. Se revisan los hallazgos; los
   reales se arreglan en la misma tanda.
2. Si se aplicó una migración a un Supabase real: panel → **Advisors →
   Security** sin errores, y comprobar con una consulta que ninguna tabla de
   `public` quedó con `relrowsecurity = false`. `drizzle-kit migrate` puede
   fallar sin mostrar el error (`errores-conocidos.md`).
3. Respaldo antes de migrar un entorno con datos (`DESPLIEGUE.md` §4).

### Hábitos que no dependen del código

- Los correos de seguridad de Supabase se leen y se atienden el mismo día. El
  aviso del RLS llegó varias veces antes de que alguien lo viera.
- Antes de entregar: cerrar la decisión #39 (credenciales de prueba en
  `scripts/crear-usuario-prueba.mjs` y sus cuentas en Supabase).

## El patrón de código

**Lecturas** desde componentes de servidor, **escrituras** por route handlers
(§20.2). Los ejemplos vivos están en `src/infrastructure/README.md`.

Tres reglas que no se negocian:

1. **El permiso se comprueba en servidor, siempre.** `requireScopeInPage` en
   páginas, `requireScope` en route handlers. Ocultar un botón no es seguridad.
2. **Nadie escribe su propio filtro por responsable.** Se usa `visibleRows`. Si
   cada módulo filtra a su manera, la seguridad deja de ser auditable (§18.1).
3. **Nadie abre su propia conexión ni lee `process.env` por su cuenta.**
   `getDb()` e `infrastructure/env.ts`.

## Checklist de "terminado" para un módulo

Derivado de `MAPEO_FRONTEND_CRM.md` §16 y `AUDITORIA_FUNCIONAL_CRM.md` §11:

- [ ] Cada control ejecuta una acción real (no solo un aviso) y respeta permisos.
- [ ] Los cambios persisten y quedan con autor y fecha.
- [ ] Hay prueba automática del flujo (crear, asignar, contactar, mover, perder,
      cerrar, según aplique).
- [ ] Un usuario sin permiso no puede leer ni modificar el dato, **verificado en
      servidor**.
- [ ] Si agrega o cierra un negocio, la operación es transaccional: `transaction()`
      de `infrastructure/db/client.ts`, con los 8 pasos de §10.2.
- [ ] Se registra en `audit_log` cuando la acción modifica datos sensibles (T6).
- [ ] Las métricas que muestra vienen de una consulta, no de una constante.
- [ ] Pasa el checklist de seguridad (§6) para cada tipo de cambio que hizo.

## Entornos y despliegue

Hoy: **desarrollo contra el proyecto de Supabase en la nube y `npm run dev` en
local. No hay staging ni producción, y es deliberado.**

El despliegue y la migración al VPS de Hostinger se hacen **al final, en una sola
operación**, con el programa terminado y funcionando (decisión #17). El
procedimiento y la lista de comprobación para ese día están en
`docs/DESPLIEGUE.md` §5.

## Orden de construcción

Ruta crítica de §13: **T1 → T2 → T3 → T4 → T7 → M1 → M2 → M3**.

F0 está cerrada (todo lo anterior a M1). Lo siguiente es **F1**: T5 estados de
interfaz, T6 auditoría, M1 Contactos, M2 Leads, M3 Pipeline.

Corre en paralelo sin depender del núcleo comercial: M5 Propiedades, M10 Academy
y M13 Configuración. Van obligatoriamente al final, porque agregan lo que los
demás producen: M12 Reportes, M14 Inicio y M15 Notificaciones.
