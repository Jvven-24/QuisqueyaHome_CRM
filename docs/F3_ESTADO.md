# F3 · Estado — qué quedó hecho y qué falta

Corte del **18 de septiembre de 2026**, tras probar contra el Supabase real desde
la interfaz. Rama `dev/jvven`, siete commits sobre `develop` (`ffe7549`..`7f9c1b5`),
PR pendiente de abrir.

Milestone **F3 · Inventario y equipo**: M8 Metas, M9 Comisiones, M6 Avances de
obra, M7 Brokers. Issues #30–#33, los cuatro cerrados.

---

## Estado por módulo

| Módulo | Estado | Verificado con |
|---|---|---|
| **M8** Metas | ✅ **Terminado** | Meta de compañía y de broker fijadas en navegador; cumplimiento calculado desde cierres reales |
| **M9** Comisiones | ✅ **Terminado** | Ciclo pendiente → aprobada → pagada en navegador; CSV descargado y comparado con la tabla |
| **M6** Avances de obra | ✅ **Terminado** | 8 fases creadas, fase editada, foto subida a Storage y vista con URL firmada, fase publicada |
| **M7** Brokers | ✅ **Terminado** | Tarjetas y perfil con datos reales; proyecto asignado y visto por el broker en la petición siguiente |

**F3 está cerrada.** Los cuatro issues están comiteados, con
`npm run typecheck && npm run lint && npm test && npm run build` en verde en cada
uno — **122 pruebas**, ninguna fallando.

Cada issue pasó por dos revisiones antes de darse por cerrado: **cumplimiento de
la especificación** y **calidad de código**, cada una con su ronda de
correcciones. Lo que encontraron está en §"Lo que las revisiones atraparon".

---

## Lo que se verificó, y cómo

Todo con dos cuentas reales (`admin.prueba@` y `broker.prueba@`) contra el
proyecto de Supabase de desarrollo, no con datos de muestra.

### M8 · Metas — la meta la fija la pantalla, lo logrado lo escribe el cierre

| Comprobación | Resultado |
|---|---|
| Meta de la compañía fijada en 10 | El anillo pasó a **2 de 10 negocios logrados (20%)**, contando cierres reales |
| Meta del broker fijada en 4 | Su fila pasó a **4 / 1 / 25%**, con su nivel (Junior) desde `broker_profiles` |
| `achieved_*` tras fijar metas | Intactos — los escribe solo el cierre (prueba que compila el `ON CONFLICT` y falla si alguien los agrega) |
| Fila de `goals` creada por un cierre | Nace con la meta del perfil del broker, no en 0 (el defecto que encontró el plan) |
| Gráfico anual | La barra de septiembre sale de `goals`, sin marca `hit` porque 2 < 10 |
| Cuenta broker | Ve «Mis metas» y solo su fila; nunca la de la compañía |

### M9 · Comisiones — dinero, así que transiciones y no ediciones

| Comprobación | Resultado |
|---|---|
| Aprobar una comisión pendiente | Pasó a **Aprobada**, con `approved_by` y `approved_at` en la base |
| Marcar pagada | Pasó a **Pagada**; la fila se quedó **sin botones** (estado final) |
| Indicadores | Se recalcularon solos: pendientes US$11,250 · pagadas US$8,325 |
| CSV exportado | Coincide con la tabla filtrada; `attachment; filename="comisiones-2026-09.csv"`; **BOM UTF-8** (`EF BB BF`) para que Excel muestre los acentos |
| Cuenta broker | Ve **solo la suya**, sin botones de acción y sin enlace de exportar |

### M6 · Avances de obra — fases reales, fotos reales

| Comprobación | Resultado |
|---|---|
| «Crear las 8 fases estándar» | Las ocho fases creadas y auditadas, en orden |
| Editar la fase 1 (En curso, 60%, nota, fecha) | Persistió; la línea de tiempo pasó a «En curso 60%» |
| Avance del proyecto | Recalculado solo a **8%** (60 ÷ 8 fases) y visible así en `/propiedades` |
| Subir una foto PNG | 200; objeto en el bucket, fila en `files`, imagen visible con **URL firmada** |
| Subir un SVG | **400** — «Solo se permiten imágenes JPEG, PNG, WEBP o GIF» |
| «Publicar en el portal» | `is_published` y `published_at` escritos; el botón pasó a «Retirar del portal» |
| Cuenta broker | Ve las fases de su proyecto con **los ocho campos deshabilitados**; un `PATCH` directo responde **403** |

### M7 · Brokers — lo que otros módulos producen, mostrado

| Comprobación | Resultado |
|---|---|
| Tarjeta del broker | Nivel, ventas del año (US$250,000), negocios activos (1) y meta mensual (25%), todo de consultas |
| Perfil `/brokers/[id]` | Proyectos asignados, negocios abiertos y metas de los últimos meses |
| Asignar un proyecto | `projects.broker_id` escrito y auditado como `asignar`, **solo el proyecto que cambió** |
| Efecto en el broker | El proyecto recién asignado aparece en **su** `/propiedades` en la petición siguiente |
| «Invitar broker» | Es el formulario de M13, con el rol broker ya elegido — no hay un segundo camino para crear usuarios |

---

## Lo que solo apareció al probar de verdad

**1. El nombre del mes retrocedía uno.** El selector mostraba «Agosto 2026» sobre
`?periodo=2026-09`. `Intl` formateaba la medianoche UTC del día 1 en la zona del
proceso, y en GMT-4 eso cae en el mes anterior. No lo veía ninguna prueba porque
las cuatro pantallas tenían **su propia copia** del helper y ninguna estaba
probada. Ahora `nombreMes` vive en `domain/metas.ts` con `timeZone: "UTC"` y
prueba propia (commit `b9e781f`).

**2. Un proyecto inactivo asignado se quedaba sin responsable solo.** El modal de
asignación solo lista proyectos activos, pero el endpoint miraba todos los no
borrados: cualquier proyecto inactivo del broker caía en «quitar» en cada
guardado, sin que nadie lo pidiera. El universo del endpoint es ahora el mismo
que el de la pantalla.

**3. El precio real y los permisos aguantan, pero hay que probarlos como broker.**
Deshabilitar los campos no es seguridad; lo que vale es el 403 del `PATCH`
directo, y por eso se probó así y no solo mirando la pantalla.

---

## Lo que las revisiones atraparon

Ninguno de estos lo detectaban `typecheck`, `lint`, `test` ni `build`.

- **M8** · `PUT /api/metas` no comprobaba de quién era la meta: se apoyaba en que
  hoy solo el administrador tiene `goals:edit`. Ahora lo comprueba con `reaches`.
  Además, guardar sin monto borraba el monto que hubiera.
- **M9** · Las comisiones de negocios **en la papelera** seguían apareciendo en la
  tabla, en los indicadores y en el CSV. Y un nombre que empiece por `=`, `+`, `-`
  o `@` se abría como fórmula en Excel — ahora se neutraliza.
- **M6** · La subida aceptaba **SVG** (puede llevar script y se sirve por una URL
  que el navegador abre como documento), tomaba la extensión del nombre que manda
  el cliente, y leía el cuerpo entero antes de mirar el tamaño. Los tres cerrados.
  También faltaba validar la URL de video y el formato de la fecha.
- **M6** · Dos creaciones simultáneas de la plantilla de fases daban 500 en vez de
  409; ahora la fila del proyecto se bloquea antes de leer sus fases.

---

## Ponytail: cómo se construyó y qué dejó la auditoría

Los cuatro issues se escribieron en modo `/ponytail` (nivel `full`), con
`/ponytail-review` sobre cada diff. **F3 no añadió ni una dependencia**: el CSV es
texto, las fechas son `Intl`, y el almacenamiento de fotos es Supabase Storage,
que ya venía con `@supabase/supabase-js`.

`/ponytail-audit` sobre el repositorio completo, al cierre, encontró **cuatro
duplicaciones reales** y ninguna dependencia sobrante. Las cuatro se aplicaron
(commit `7f9c1b5`, **−103 líneas netas**):

| Corte | Dónde estaba |
|---|---|
| `vaciosANull` | 7 route handlers; ahora uno en `infrastructure/http.ts` |
| `formatearMonto` | 4 pantallas (3 nuevas de F3); ahora uno en `_ui/formato.ts` |
| Lectura de ids de la ruta | 3 copias; ahora una en `infrastructure/http.ts` |
| Scripts de usuarios de prueba | 3 archivos casi idénticos → `scripts/crear-usuario-prueba.mjs [admin\|asistente\|broker]` |

`/ponytail-debt` reúne **cinco marcadores** en todo el repositorio, todos con
disparador explícito:

| Marcador | Techo declarado |
|---|---|
| `domain/rbac.ts` | `team` se comporta como `own` hasta que exista modelo de equipos |
| `infrastructure/audit.ts` | No se guarda IP ni user-agent |
| `api/papelera/restaurar` | Exige `settings:edit` en vez de permiso por entidad |
| `api/…/fotos/[fileId]` | **Nuevo en F3**: al borrar la foto se borra la fila, no el objeto de Storage (bucket privado, solo ocupa espacio) |
| `domain/avance-obra.ts` | **Nuevo en F3**: las 8 fases estándar son una lista fija, no una tabla de plantillas |

Los datos de muestra que quedan (`_ui/datos-muestra.ts` y las vistas de Academy,
Comunicaciones, Reportes e Inicio) son de módulos que todavía no toca construir —
M10, M11, M12 y M14, de F4 en adelante.

---

## Lo que falta

### Nada de F3

Los cuatro issues están cerrados y verificados. Lo que sigue abierto no es código
de esta fase:

- **Umbrales de nivel de broker** (`domain/cierre-negocio.ts`): solo el corte a
  Senior (US$500K) sale del prototipo; Senior+, Top Producer y Top Leader siguen
  siendo una progresión razonable sin respaldo del negocio. Es una pregunta para
  el cliente, no código: cambiarlos es editar una constante.
- **Issue #25** (milestone F1) sigue abierto a propósito — es una decisión de
  alcance.
- **Automatizaciones §10.3 #1 y #3** (lead → tarea sugerida, cambio de etapa →
  próxima actividad) siguen anotadas desde F2 como paso aparte.

### Detalle que conviene recordar

- `projects.progress_percent` solo se recalcula cuando cambian las fases. Un
  proyecto **sin fases** conserva el avance que se le haya escrito a mano desde
  M5 — es el caso de «Jardines de Verificación M5», con 35% y cero fases.
- El bucket `avances-obra` ya existe en el Supabase de desarrollo. En cualquier
  entorno nuevo lo crea `npm run db:seed`.

---

## Lo siguiente, en orden

1. **Abrir el PR** de `dev/jvven` contra `develop` con los cuatro issues, mismo
   criterio que los PR #12 (F1) y #29 (F2).
2. **Cerrar a mano los issues #30–#33** tras el merge — `Closes #N` no los cierra
   al mergear contra `develop`.
3. **Confirmar con el cliente los umbrales de nivel de broker**.
4. **Empezar F4** (M10 Academy, M11 Comunicaciones, M12 Reportes, M14 Inicio,
   M15 Notificaciones): son los módulos que agregan lo que los demás producen, y
   con F3 cerrada ya existe todo lo que tienen que agregar.
