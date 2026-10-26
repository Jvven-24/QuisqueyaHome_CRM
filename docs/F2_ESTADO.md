# F2 · Estado — qué quedó hecho y qué falta

Corte del **15 de septiembre de 2026**, tras verificar contra la base de datos
real. Rama `dev/jvven`, seis commits (`b844ffb`..`58c8d8d`) sobre `develop`, PR
pendiente de abrir.

Milestone **F2 · Operación diaria**: M4 Actividades/Agenda, M5 Propiedades,
M13 Configuración, y la deuda que F1 dejó anotada para cuando M5 y M13
existieran. Issues #18–#21, los cuatro cerrados.

---

## Estado por módulo

| Módulo | Estado | Verificado con |
|---|---|---|
| **M5** Propiedades y unidades | ✅ **Terminado** | Flujo completo en navegador, con las cuentas admin y broker |
| **M4** Actividades, tareas y agenda | ✅ **Terminado** | Flujo completo en navegador + `.ics` verificado por `fetch` |
| **M13** Configuración, usuarios y permisos | ✅ **Terminado** | Las seis pestañas probadas en navegador con datos reales |
| Deuda de F1 (edición de negocio, unidades de interés, reasignación) | ✅ **Terminado** | Prueba de fase completa: lead → cierre, en Postgres real |

**F2 está cerrada.** Los cuatro issues de la fase están comiteados, con
`npm run typecheck && npm run lint && npm test && npm run build` en verde en
cada uno — **74 pruebas**, sin una sola de infraestructura fallando.

---

## Lo que se verificó, y cómo

### M5 · Propiedades — precio real por permiso, no por render

| Comprobación | Resultado |
|---|---|
| Crear proyecto con broker asignado | Aparece en `/propiedades` con disponibilidad `0/0` |
| Crear unidad, marcarla "Reservada" | Disponibilidad recalcula a `0/1` sin recargar campo a mano |
| Precio real, cuenta admin | Visible en rejilla y detalle |
| Precio real, cuenta broker | Columna **ausente del todo** — no oculta con CSS, no llega al HTML |
| Broker ve proyectos ajenos | No — `visibleRows` sobre `projects.brokerId` filtra correctamente |
| Editar proyecto (avance de obra) | Persiste tras `router.refresh()` |

### M4 · Actividades, tareas y agenda — una tabla, dos vistas

| Comprobación | Resultado |
|---|---|
| Cita creada en `/agenda` | Aparece en la celda día+hora correcta, y también en la cola de `/tareas` (misma tabla) |
| Completar tarea | Desaparece de la cola; "Carga del equipo" se recalcula |
| `.ics` exportado (`GET /api/actividades/ics`) | `DTSTART:20260914T140000Z` para las 10:00 de Santo Domingo — offset correcto |
| Alcance `own` (broker) | No ve la tarea de otro; "Carga del equipo" no se pinta |
| `deals.next_activity_id` | Se escribe solo al crear una actividad `pending` ligada a un negocio |

### M13 · Configuración — la matriz real, no las 8 casillas

| Comprobación | Resultado |
|---|---|
| Invitar usuario, sin `SUPABASE_SERVICE_ROLE_KEY` | Usuario creado, invitación marcada "Pendiente", botón "Reenviar" visible — el estado reparable de la decisión #28 |
| Matriz de permisos, rol Asistente | Valores reales del seed (`Leads · Ver = all`, coincide con `db/seed.sql`) |
| Guardar un cambio en la matriz | Persiste tras `router.refresh()` — se lee de la base, no del estado de cliente |
| Rol Administrador | 126 selects deshabilitados, nota de protección visible |
| Etapa "Nuevo" → "Nuevo Lead" → revertido | Ambos cambios persistieron |
| Catálogos (motivos, canales) | 7 y 8 filas reales, "Meta Lead Ads" inactivo tal como lo siembra `seed.sql` |
| Papelera: eliminar y restaurar un usuario | Aparece en la papelera con fecha real; tras "Restaurar", vuelve a la lista activa |
| Integraciones | 6 tarjetas, todas "Sin configurar" — estado real de `integration_accounts`, vacía |

### Deuda de F1 — la prueba de fase completa

La que exige el criterio de terminado: un lead entra, se convierte, recorre las
seis etapas cumpliendo cada requisito de §10.1 **desde la interfaz**, y se
cierra una sola vez.

| Paso | Resultado |
|---|---|
| Lead → Contacto → Negocio | Convertido, `brokerId` heredado del lead |
| Editar negocio (monto, probabilidad, comisión, fecha) | US$185,000 · 60% · 4.50% · 2026-11-30 — el `%` se convirtió a puntos básicos correctamente (450) |
| → Contactado | Requiere actividad de contacto completada — cumplido |
| → Presentación | Requiere próxima acción — la actividad creada escribió `next_activity_id` sola |
| → Preselección | Requiere ≥1 `deal_properties` — unidad A1 asociada y marcada principal |
| Agregar una segunda propiedad, marcarla principal | La primera se desmarcó sola — nunca dos principales |
| → Negociación → Cierre | Cierre transaccional de 8 pasos ejecutado |
| **Resultado en Postgres** | 1 comisión (`$832,500` = 4.5% de `$18,500,000`), unidad `sold`, meta del broker +1/+`$18,500,000`, actividad futura cancelada |
| Editar el negocio ya cerrado | **409** — "Este negocio ya está cerrado; no se puede editar" |
| Agregar propiedad al negocio cerrado | **409**, mismo guardia |
| Reasignar responsable de un contacto | `PATCH` con `brokerId`, aplicado; bloqueado con 403 si el alcance no es `all` |

---

## Lo que solo apareció al conectar de verdad

Ninguno se veía con typecheck, lint ni build. Los seis están corregidos.

**1. `.property-card` y `.back-button` heredaban el azul subrayado del
navegador.** Al convertirlos de `<button>` a `<a>` (M5) para que la tarjeta
navegara al detalle, el texto salió con el estilo por defecto de un enlace —
`globals.css` nunca había necesitado `color`/`text-decoration` explícitos en
esas dos clases porque nunca habían sido un enlace real.

**2. Tres checkboxes sin marcar no se enviaban nunca (M13).** `FormData.entries()`
omite un `<input type="checkbox">` sin marcar — desactivar un usuario, desmarcar
"maneja alquileres" o desactivar una etapa no habría tenido efecto jamás sin
leer `.checked` explícitamente antes de enviar.

**3. La ruta `route.ts` de la papelera no podía exportar su propio mapa de
tablas.** Next.js valida en `next build` que un `route.ts` real solo exporte
verbos HTTP y un puñado de nombres reservados — `TABLAS_PAPELERA` tuvo que
salir a un archivo `_tablas.ts` aparte, aunque `next dev` nunca se quejó.

**4. `ENTITY_TYPES` no tenía casillas para etapas, catálogos ni unidades de
interés.** Auditar su edición habría quedado mal etiquetado (`entidad: "role"`
para una etapa) hasta que se extendió la lista — columna `text` sin `CHECK` de
Postgres, cero migración.

**5. El select "Interés general" mandaba `unitId: ""`, no ausencia.** Zod lo
coacciona a `0` y `.positive()` lo rechaza — Postgres nunca llegó a verlo, mismo
patrón de `limpiarVacios` que M1/M2/M5 ya tenían y esta pantalla no.

**6. Una rama huérfana de la sesión anterior nunca llegó a `dev/jvven`.**
`chore/admin-prueba-fixture` existía en git desde el 12 de septiembre con el
script del admin de prueba, pero nadie la fusionó — el archivo simplemente no
estaba en el árbol de trabajo. Recuperada con `cherry-pick` del commit único
que agregaba, la rama borrada después (decisión #30: nada de ramas sueltas).

---

## Ponytail: cómo se construyó y qué dejó la auditoría

Los cuatro issues se escribieron en modo `/ponytail` (nivel `full`), con
`/ponytail-review` sobre cada diff antes de cerrarlo. Ningún módulo de F2
añadió una dependencia nueva: la agenda es `Intl`, el `.ics` es texto, la
invitación de usuarios es la API de Supabase que ya estaba instalada.

`/ponytail-audit` sobre el repositorio completo, al cierre de la fase, encontró
**un archivo muerto real**: `_ui/lead-inspector.tsx` (96 líneas), el inspector
de leads del prototipo, sin un solo import en todo el árbol desde que M1/M2/M3
escribieron los suyos propios en F1 — nadie lo había borrado. Se fue junto con
`stageOrder`, su único consumidor. El resto de lo que el heurístico marcó
"sin uso" (siete tablas de `schema.ts`, `application/ports`,
`application/use-cases`) es esquema congelado de fases futuras y scaffolding
documentado a propósito — no deuda.

`/ponytail-debt` reunió **cuatro marcadores** en todo el repositorio, los
cuatro con disparador explícito (ninguno del tipo que se pudre en silencio):
`team` sin modelo de equipos, la papelera sin permiso por entidad, `auditar()`
sin IP/user-agent, y el mock que alimenta M14 Inicio. Ninguno nació en F2.

---

## Lo que falta

### Nada de F2 propiamente

Los cuatro issues de la fase están cerrados y verificados. Lo único pendiente
es del lado del usuario, no del código:

- **`SUPABASE_SERVICE_ROLE_KEY` en `.env`** (`.env.example` documenta dónde
  sacarla) — sin ella, "Invitar usuario" crea el registro pero no envía el
  correo; con "Reenviar" alcanza una vez esté configurada. No bloquea nada más
  de M13.

### Fricción conocida, no bloqueante

- **`docs/F1_ANALISIS_Y_PLAN.md` §10** ya no tiene pendientes propios — los
  tres que dejó (edición de negocio, unidades de interés, reasignación) se
  cerraron en esta fase. El único pendiente que sigue vivo de esa lista son los
  **umbrales de nivel de broker** (`domain/cierre-negocio.ts`), que es una
  pregunta para el negocio, no código — su sitio es M8 Metas (F3).
- Las automatizaciones §10.3 #1 (lead → tarea sugerida) y #3 (cambio de etapa
  → próxima actividad) quedaron deliberadamente fuera de M4 para no tocar bajo
  presión de tiempo el cierre transaccional de M3b, ya probado. Quedan
  anotadas para un paso aparte, no perdidas.

### Nada de F3

M6 Avances, M7 Brokers, M8 Metas y M9 Comisiones son de F3 y no se tocaron. Las
carpetas de ruta existen con datos de muestra, igual que las de F2 antes de
esta fase.

---

## Lo siguiente, en orden

1. **Abrir el PR** de `dev/jvven` contra `develop`, bundling los cuatro
   issues — mismo criterio que el PR #12 de F1.
2. **Probar de punta a punta antes de mergear** — el usuario ya lo pidió así
   para F1; misma expectativa aquí.
3. **Configurar `SUPABASE_SERVICE_ROLE_KEY`** en el `.env` real, cuando se
   quiera probar el correo de invitación de verdad.
4. **Empezar F3 por M5 → M6 Avances** (única dependencia declarada) o por
   **M8 Metas**, que es donde se resuelven los umbrales de nivel de broker que
   siguen provisionales.
