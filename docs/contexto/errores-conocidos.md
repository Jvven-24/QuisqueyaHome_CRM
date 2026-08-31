# Errores conocidos / gotchas — CRM Quisqueya Home

Todo lo listado aquí está confirmado en código o documentado explícitamente en `AUDITORIA_FUNCIONAL_CRM.md` / `MAPEO_FRONTEND_CRM.md`. No incluye especulación.

## Persistencia y datos
- **Nada persiste.** Leads, citas, avance de obra, permisos y progreso de Academy viven en `useState` del componente raíz. Recargar la página borra todo.
- **`db/schema.ts` y su migración no están comiteados.** `git status` los marca como modificado/untracked (`db/schema.ts`, `drizzle/meta/_journal.json`, `drizzle/0000_adorable_forge.sql`, `drizzle/meta/0000_snapshot.json`). No asumir que reflejan lo desplegado.
- **D1 no está enlazado.** `.openai/hosting.json` tiene `"d1": null`. Cualquier trabajo que dependa de la base de datos está bloqueado hasta resolver esto (marcado como riesgo de "primera semana").
- **Mezclar formatos de fecha rompe el orden.** `CURRENT_TIMESTAMP` de SQLite escribe `"2026-08-30 12:00:00"` (espacio) y la aplicación escribe formato con `"T"` (`"2026-08-30T12:00:00.000Z"`). En texto, el espacio ordena antes que la `T` — mezclar ambos formatos rompe `ORDER BY` y rangos de fecha **sin lanzar error**. Ver convención de fechas en convenciones.md.
- **`updated_at` se congela si no se usa `$onUpdate`.** SQLite no tiene `ON UPDATE` nativo.

## Auth y permisos (todo simulado hoy)
- El login no valida nada: `setLoggedIn(true)` se llama directo al enviar el formulario.
- El selector de rol es un dropdown en el header — cualquier usuario puede "ser" admin cambiando el selector. No hay identidad real detrás.
- Los permisos solo **ocultan componentes en cliente**; no hay verificación en servidor. Precios reales, comisiones y métricas no están protegidos.
- El filtrado por rol de broker compara **strings de nombre** (`broker === "Yostar Medina"`), no una referencia — frágil ante typos o cambios de nombre.
- La matriz de permisos de Configuración cubre **8 filas de recurso frente a 15 módulos reales** — no hay fila para Agenda, Brokers, Academy, Metas, Tareas, Comunicaciones, Reportes ni Avances.

## Modal y flujos declarados pero no implementados
- El modal tiene tipo `"lead" | "appointment" | "lost" | null`, pero **`"lost"` nunca se renderiza**. Marcar un negocio como `Perdido` no pide motivo en ninguna parte del flujo actual.
- El Kanban de Pipeline **no tiene columna para `Perdido`** — un negocio marcado como perdido desaparece de la vista sin dejar rastro visual.
- Filtros de Leads, Contactos, Pipeline, Propiedades, Comisiones, Academy: existen visualmente pero **son inertes**, no alteran los datos mostrados.
- Botones sin acción real (solo disparan un `toast`): exportar reporte, exportar a Excel, nuevo contacto, nuevo proyecto, invitar broker, ver perfil, asignar propiedades, nueva tarea, nueva plantilla, "Abrir en WhatsApp" en Comunicaciones, "Publicar en el portal" en Avances.
- El atajo `Ctrl K` se muestra en el buscador global pero no está implementado.

## Estructura y escalabilidad
- **`app/page.tsx` es un único componente cliente sin rutas** (956 líneas). No hay URL por módulo — la navegación es un `useState`. Esto significa que dos personas trabajando en dos módulos distintos **van a chocar en el mismo archivo** hasta que se separe en rutas (T7).
- `phaseProgress` (avance de obra) es **un único número compartido en el estado raíz** — todas las fases y todos los proyectos comparten el mismo porcentaje. Cada fase debería ser una fila independiente por proyecto.
- Contacto y Lead son **el mismo objeto** — no hay forma de que un contacto tenga dos oportunidades ni de conservar su historial tras cerrarse un negocio.
- Proyecto es un **campo de texto** en el lead, no una relación real con la tabla de proyectos. Broker es texto, no referencia.
- Tareas y citas son **estructuras separadas sin vínculo** entre sí ni con un contacto/negocio.
- No existen estados de carga, error ni "sin permiso" en la interfaz — solo existe un estado `Empty` (vacío).

## Campos que la interfaz muestra pero no existen como dato real
Motivo de pérdida (catálogo inexistente), probabilidad y fecha estimada de cierre, presupuesto con mínimo/máximo/moneda reales (hoy texto libre como `"Por definir"`), disponibilidad de unidades (`"12/40"` es literal, no calculado), última interacción (literal `"Hoy"`), zona del interés del lead (el lead solo guarda proyecto).

## Riesgos de calendario / integraciones
- Las citas usan un índice de día (`1..5`) y hora entera, no fecha real — `appointmentDates()` construye la fecha con un offset fijo hardcodeado (`2026-07-{19+day}`, `-04:00`). Esto es solo para la demo; una agenda real necesita fechas reales.
- El `UID` del evento `.ics` se genera como `{day}-{time}@quisqueyahome.com` — sirve como prueba de que se necesita un identificador estable por evento para no duplicar en sincronización futura con Google Calendar.
- Nota explícita en la UI de Integraciones: "No se guardarán tokens OAuth en el navegador" — restricción de diseño a respetar cuando se implemente OAuth real.

## Pruebas
- El único archivo de test (`tests/rendered-html.test.mjs`) corre contra el **build compilado** (`dist/server/index.js`), no contra el código fuente directamente — si el build falla o está desactualizado, el test no refleja el estado real de `app/page.tsx` más allá del regex de módulos presentes.
- No hay cobertura de los flujos críticos de negocio (cierre transaccional, validación por etapa) porque esos flujos **todavía no existen** en el backend.

[PENDIENTE: bugs de UI/CSS específicos (responsive, accesibilidad) — no se auditó visualmente `globals.css` línea por línea; solo se confirmó su tamaño (~478–635 líneas según el commit) y que carece de scoping por módulo].
