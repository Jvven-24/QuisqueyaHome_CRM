# Expediente de evolución · Agenda (G1 · Comercial)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21 + D03 + D05 (Claude Sonnet), solo lectura de código y web; sin cambios en `src/`.
> Reglas: misma tecnología primero; copiar o portar solo MIT / Apache-2.0 / BSD / ISC con LICENSE leído y commit fijado; AGPL/GPL solo RUN o referencia.
> Estado de fichas: **no existe ficha de Agenda**; M03 la cita como «M06 / Agenda» (`M03-negocios.md:317`: «Visita/seguimiento calendarizado: M06 local; Cal.com/Schedule-X por contrato de Agenda»). Decisiones vigentes: #23 (agenda y tareas son dos vistas de `activities`), #24 (fechas con `Intl`, sin librería de fechas), #25 (`.ics` en servidor sin dependencia).
> Lotes compartidos citados: `CT-3`, `CT-E` (en `G1-contactos.md`), `TA-5` (en `G1-tareas.md`), `CM-3` (en `G1-comunicaciones.md`).
> **Corrección a una decisión previa:** `PLAN-INTEGRAL` §1 (A12) y `MAPA-SISTEMAS-OSS.md` §3/§7 fijan «Schedule-X + ical» y descartan FullCalendar por «una sola librería». El 14-oct se comprobó en el repositorio de Schedule-X que desde la versión 4 el arrastre y el redimensionado son de pago (§4). La recomendación de este expediente cambia; D03 debe confirmarla.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia (archivo:línea o captura) |
|---|---|---|
| Funciones | 2 | Rejilla semanal, crear cita y exportar `.ics` de la semana (`agenda/vista.tsx`, `api/actividades/ics/route.ts`). No se puede editar, reprogramar ni cancelar desde la UI aunque la API tiene `PATCH` y `DELETE` (`D21 inventario` §2). |
| Datos reales y reglas de negocio | 2 | Tabla `activities` con `starts_at`, `ends_at`, `location`, `meeting_url`, `status` (`schema.ts:801-837`); `activity_sync` sin uso. La UI solo envía título, responsable, inicio y lugar (`vista.tsx:160-166`): sin duración, contacto, negocio ni proyecto. Sin resultado de visita ni recordatorio. |
| Diseño y componentes | 2 | Clases del prototipo (`.calendar`, `.calendar-row`, `.calendar-event`) y `Modal` propio; sin `Dialog`/`Sheet` de shadcn; sin vistas día/mes; sin colores por tipo ni por persona. |
| Experiencia de uso (flujos, atajos, móvil) | 1 | Las citas fuera de 9:00–16:59 y de lunes a viernes no se ven (§2.1); cada cita abre Google Calendar en otra pestaña en lugar de abrir su ficha; no hay arrastre. |
| Calidad (pruebas, seis estados, accesibilidad) | 2 | Pruebas de `domain/ics.test.ts`, `zona-horaria.test.ts` y `casos-de-uso.test.ts`; sin `error.tsx` ni `loading.tsx` (D21 inventario §2); rejilla hecha con `div`/`a`, sin roles de tabla ni navegación por teclado. |

**Objetivo: 4 (avanzado)** en los cinco ejes. Escala: 0 ausente · 1 maqueta · 2 básico · 3 completo · 4 avanzado · 5 referente.

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **Citas que se crean y no se ven.** La rejilla solo pinta las horas `[9…16]` (`agenda/vista.tsx:22`), solo lunes a viernes (`vista.tsx:55`: `[0,1,2,3,4]`) y la consulta corta en el sábado a medianoche (`agenda/page.tsx:38,58`). Pero el formulario acepta cualquier hora (`<input type="time">`) y el `.ics` exporta todo. Una visita a las 8:00, a las 17:30 o un sábado en obra (habitual en preventa) queda guardada, cuenta en «citas hoy» (`vista.tsx:64`) si cae hoy, y no aparece en la rejilla. Efecto: el broker cree que no la agendó, la crea otra vez y hay doble cita.
2. **Cada cita fuga datos del cliente a Google.** `vista.tsx:30-44` arma una URL de `calendar.google.com` con el título (el placeholder del campo es «Cliente y proyecto», `vista.tsx:~211`), el lugar y el responsable; `vista.tsx:112-117` la abre en otra pestaña con `target="_blank"`. Los datos del comprador salen del CRM por la barra de direcciones y la cita nunca abre su ficha.
3. **No se puede corregir nada.** Sin editar, reprogramar ni cancelar en UI, una cita mal puesta se queda. `crearActividad`/`editarActividad`/`borrarActividad` ya existen (`application/actividades/casos-de-uso.ts`) y están probados; falta la pantalla. Los estados `cancelled` y `completed` existen (`catalogs.ts:184`) y la rejilla no los distingue.
4. **La agenda mezcla todo.** La consulta no filtra por `activity_type` (`agenda/page.tsx:54-60`): tareas, notas y registros de WhatsApp con `starts_at` aparecen como «cita» con el mismo aspecto.
5. **Cita sin cliente.** El formulario no envía `contactId`, `dealId` ni `projectId` aunque `POST /api/actividades` los acepta (`api/actividades/route.ts:27-29`); por eso una visita agendada desde Agenda nunca actualiza la «próxima acción» del negocio (`crearActividad` solo lo hace con `dealId`) ni el historial del contacto.
6. **Sin duración, sin choques.** No se envía `endsAt` (la URL de Google asume +1 h, `vista.tsx:31`); no hay detección de dos citas del mismo broker a la misma hora ni de la misma unidad.
7. **Sin recordatorios ni notificaciones.** Nada avisa de la visita de mañana (catálogo A12.1, brecha `agenda.reminder`); `activity_sync` (`schema.ts:843-865`) no tiene escritor.
8. **Sin resultado de visita.** La visita termina sin interés, objeciones ni siguiente paso (A12.2, ESENCIAL en el flujo de ventas): no hay dato para el embudo ni para Negocios.
9. **Zona horaria incrustada en la cadena.** `startsAt: ${dia}T${hora}:00-04:00` (`vista.tsx:164`). Es correcto para Santo Domingo (sin horario de verano) pero la diáspora cita desde otro huso y la hora mostrada es siempre la dominicana sin rotularse.
10. **Capas y estados.** `agenda/page.tsx` ejecuta SQL de Drizzle directo (existe `application/actividades/consultas.ts` y `actividadesParaLectura()`, que la página no usa). Sin `error.tsx` ni `loading.tsx` propios.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo (A.x) | Hoy |
|---|---|---|---|---|
| AG-F1 | Calendario con vistas día, semana, mes y lista; fines de semana y horas configurables; pestaña «fuera de horario» | ESENCIAL | A12.1 | ROTA (9–16, lun–vie) |
| AG-F2 | Abrir la cita en una ficha propia; editar, reprogramar (arrastre y formulario), cancelar con motivo | ESENCIAL | A12.1 | AUSENTE |
| AG-F3 | Visita ligada a contacto, lead, negocio y proyecto/unidad; efecto sobre la próxima acción | ESENCIAL | A12.2 | AUSENTE en UI |
| AG-F4 | Duración y detección de choques por responsable y por recurso (sala, unidad) | IMPORTANTE | A12.3 | AUSENTE |
| AG-F5 | Resultado de visita: asistió/no asistió, nivel de interés, objeciones, siguiente paso (crea tarea) | ESENCIAL | A12.2 | AUSENTE |
| AG-F6 | Modalidad: sala de ventas, obra, videollamada (enlace) | IMPORTANTE | A12.2 | PARCIAL (`location`, `meeting_url` sin campo en UI) |
| AG-F7 | Recordatorios al broker y al cliente (WhatsApp/correo) con plantilla | IMPORTANTE | A12.1 | AUSENTE |
| AG-F8 | Zonas horarias: hora del cliente visible, selector, `.ics` con `VTIMEZONE` | IMPORTANTE | A12.1, A9.4 | PARCIAL |
| AG-F9 | Suscripción privada `.ics` (Google/Apple/Outlook) con token revocable | IMPORTANTE | A12.1 | AUSENTE (solo descarga semanal) |
| AG-F10 | Vista de equipo (admin): colores por broker, filtro por proyecto, carga por día | IMPORTANTE | A13.4 | AUSENTE |
| AG-F11 | Reserva pública de visita por enlace del broker con disponibilidad | DESEABLE | A12.1, A12.3 | AUSENTE |
| AG-F12 | Sincronización de dos vías con Google Calendar (`activity_sync`) | DESEABLE | A12.1 | AUSENTE (decisión #25 la difiere) |
| AG-F13 | Citas recurrentes (reunión semanal de equipo) | DESEABLE | A12.1 | AUSENTE |

## 4. Open source que aporta (verificado)
Verificación del 14-oct-2026: LICENSE leído en el commit citado; versiones, licencias y peer dependencies del registro npm; la política de pago de Schedule-X leída en `website/app/blog/schedule-x-v4/page.mdx` del repositorio (clon sin checkout).

| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta que aporta | Modo | Encaje con nuestro stack | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **FullCalendar (línea 6.1.21)** — **recomendado** | `fullcalendar/fullcalendar` @ `5160c2c` (2026-10-12) | MIT (`LICENSE.md`, © 2026 Adam Shaw); npm `@fullcalendar/{core,react,daygrid,timegrid,list,interaction,multimonth}@6.1.21` con campo `license: MIT` y peers `react ^19` | TypeScript, React 19 | `@fullcalendar/react` + `daygrid` + `timegrid` + `list` + `interaction` (arrastre, redimensionado y selección para crear, **gratis**) + `multimonth`. Responde a **AG-F1, F2, F4**. | APP (dependencia) | Mismo stack. Se tematiza con variables CSS `--fc-*` apuntando a nuestros tokens. Pesa más que Schedule-X. Atención: `@fullcalendar/core` y `react` ya publican **7.x** (7.1.2) mientras los plugins `latest` siguen en 6.1.21 (7.x en `rc`): **usar la línea 6.1.21 completa** (`core@~6.1.21` es el peer de `react@6.1.21`). Las vistas «resource» (timeline, scheduler) son de pago: no se usan. | M |
| **Schedule-X** | `schedule-x/schedule-x` @ `f651e76` (push 2026-10-13) | MIT (`LICENSE`, © 2023 Tom Österlund; README: «License MIT»); npm `@schedule-x/calendar@4.9.1`, `react@4.1.0`, `theme-shadcn@4.9.1`, `event-modal`, `event-recurrence`, `ical`, `timezone-select`, `current-time`, `scroll-controller`: todos MIT | Preact internamente, envoltorio React; `temporal-polyfill 0.3.2` | Mostrar: vistas día/semana/mes/agenda, tema shadcn, recurrencia, importar ICS. **El arrastre (`@sx-premium/drag-and-drop`) y el redimensionado (`@sx-premium/resize`) pasaron a Premium en la v4** (blog `schedule-x-v4/page.mdx`: «no longer supported in the open source version»; `drag-to-create` también es premium según su página de documentación). El último `@schedule-x/drag-and-drop` libre es `3.7.3` (MIT en npm), compatible con calendar 3.x, línea sin soporte. | APP si no hace falta arrastrar; si no, **descartado** frente a FullCalendar | Para el nivel avanzado pedido (reprogramar arrastrando) obliga a comprar Premium (precio no verificado) o a fijar la v3. | M |
| **react-big-calendar** | `bigcalendar/react-big-calendar` (antes `jquense`) @ `183783a`; npm `1.20.0`; último push 2026-06-01 | MIT (`LICENSE`, © 2015 Jason Quense); peers `react ^19` | React | Calendario con complemento `withDragAndDrop` incluido en el paquete | APP (alternativa) | Más simple y sin tema propio; mantenimiento más lento que FullCalendar (4 meses sin push). Plan B. | M |
| **ical.js** | npm `ical.js@2.2.1` | **MPL-2.0** (campo npm) | JS | Dependencia de `@fullcalendar/icalendar` y `@schedule-x/ical` para leer ICS | APP (dependencia, sin modificarla) | MPL-2.0 es copyleft a nivel de archivo: se acepta como dependencia sin tocar sus fuentes. Solo si se importan calendarios externos. | S |
| **ical-generator** | npm `ical-generator@11.1.2` | MIT | Node | Generación de `.ics` con `VTIMEZONE`, `VALARM`, `STATUS:CANCELLED`, `SEQUENCE` | APP | `src/domain/ics.ts` (decisión #25) escribe el `VEVENT` a mano; la decisión se reevalúa solo si se añaden husos, alarmas y suscripción. | S |
| **rrule** | npm `rrule@2.8.1` | BSD-3-Clause | TS | Expansión de recurrencia (`AG-F13`) | APP | Solo si se acepta recurrencia. | S |
| **react-day-picker** | npm `react-day-picker@10.0.2` | MIT | React | Selector de fecha del formulario (es el que usa el `Calendar` de shadcn; `DESIGN.md:149`) | APP | Reemplaza `<input type="date">` y el selector de día de `FormularioCita`. | S |
| **date-fns / @date-fns/tz** | npm `date-fns@4.4.0`, `@date-fns/tz@1.5.0` | MIT | TS | `TZDate` para mostrar la hora del cliente en su huso | APP | Decisión #24 prefirió `Intl`; con una diáspora de varios husos puede reabrirse. `Intl.DateTimeFormat` cubre mostrar; `@date-fns/tz` solo ayuda a construir. | S |
| **Cal.diy** | `calcom/cal.diy` @ `54343aa` (2026-09-20) | MIT (`LICENSE`, © Cal.com) | Next.js monorepo | Disponibilidad y reserva pública | REF (según el aviso del MAPA: sin equipos/workflows y recomendado solo para uso personal) | No apto para producción multiusuario. La reserva pública (`AG-11`) se construye propia con ideas de su modelo de disponibilidad. | — |
| **Twenty** | `twentyhq/twenty` @ `a573e84` | AGPL-3.0 + comerciales (`LICENSE`) | React + NestJS | `/calendarEvents` (espejo de eventos) | REF / RUN | Solo espejo detrás de `CrmPort`. | — |

Riesgos: peso de FullCalendar (medir antes de adoptar; carga diferida con `next/dynamic`); su línea 7 todavía no tiene plugins estables; temas y accesibilidad requieren revisión de D07 (la v7.1.2 corrige varios fallos de lectores de pantalla, `CHANGELOG.md`, lo que sugiere que la línea 6 conserva algunos).

## 5. Diseño y componentes a elevar
| Patrón | Componente concreto | Dónde se usa |
|---|---|---|
| Calendario | `Calendario` (envoltorio nuestro) sobre `@fullcalendar/react` con vistas Día / Semana / Mes / Lista, hoy marcado, línea de hora actual, colores por tipo (visita, reunión, llamada) con texto además del color | `/agenda` |
| Lista accesible equivalente | Vista «Lista» (`@fullcalendar/list`) como alternativa a la rejilla para lectores de pantalla y teclado | `/agenda`, móvil por defecto |
| Ficha de la cita | `Sheet` (escritorio) / `Drawer` (móvil): datos, cliente enlazado, mapa o enlace de reunión, historial, acciones Editar · Reprogramar · Cancelar · Registrar resultado | Al pulsar un evento |
| Formulario de cita | `Dialog` + `react-day-picker` (fecha) + campo de hora y duración + selector de contacto con `Command` (cmdk) + modalidad + responsable | «Nueva cita» y «Programar visita» desde fichas |
| Resultado de visita | Formulario corto en `Dialog`: asistió, interés (frío/tibio/caliente), objeciones (etiquetas), siguiente paso (crea tarea con fecha) | Tras la hora de la cita |
| Choques | Aviso en línea («Ya tienes una cita de 10:00 a 11:00») con acción «Agendar igual» | Formulario y arrastre |
| Hora del cliente | Etiqueta «10:00 (Nueva York 10:00)» usando `Intl.DateTimeFormat` con `timeZone` del contacto | Ficha de la cita |
| Seis estados | `loading.tsx` con esqueleto de rejilla, vacío «Sin citas esta semana», error con reintento, sin conexión (solo lectura), permiso (`AvisoPermiso`) | Módulo |
| Móvil | Vista Día/Lista por defecto, botón flotante «Nueva cita», objetivos ≥48 px | 320/390 |

## 6. Comunicación con el resto (centralización)
- **Agenda y Tareas son dos vistas de `activities`** (decisión #23): no se crea un módulo nuevo ni una tabla de eventos. Lo que Agenda añade son columnas de visita y una ficha.
- **Emite**: `VisitaProgramada`, `VisitaReprogramada`, `VisitaCancelada`, `VisitaRealizada` (con resultado), además de `ActividadRegistrada` (existe). Requiere `CT-E`.
- **Consume**: `NegocioCambioEtapa` (al pasar a «Presentación» sugiere agendar visita), `LeadAsignado` (Leads), `RecordatorioVencido` (TA-5) para disparar recordatorios.
- **Puertos**: `AgendaPort` (MAPA §3, aún no existe como símbolo) con adaptador local y, más adelante, Google Calendar; `registrarInteraccion` (CT-3) para que la visita realizada actualice última interacción y próxima acción; `MensajeriaPort` (CM-3) para el recordatorio al cliente.
- **Datos que comparte**: `activities` (con `contact_id`, `lead_id`, `deal_id`, `project_id`), `activity_sync` (hoy sin uso), `saved_views`, `unit_id` si se agenda por unidad (G2).
- **Seguridad**: `visibleRows` por `assignee_id` se conserva (un broker ve su agenda, no la del equipo, `agenda/page.tsx` comentario de cabecera); el feed `.ics` privado usa token con hash, revocable y auditado; la reserva pública es la única entrada sin sesión del módulo y necesita límite de uso y verificación de origen.

## 7. Lotes asignables
Cada lote ≤ 45 min con prueba. Productor Claude; revisor de otro proveedor.

| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| **AG-0a** | Corregir la invisibilidad: rejilla con sábado y domingo, rango de horas 7–21 (constante visible y documentada), bloque «Fuera de horario» para lo que no cabe, conteo de «citas hoy» coherente; prueba de que una cita a las 8:00 y otra el sábado aparecen | `src/app/(crm)/agenda/{page,vista}.tsx`, prueba nueva | Hallazgo de calidad (no es función nueva) | Sonnet | Codex | — |
| **AG-0b** | Quitar la fuga a Google: la tarjeta abre la ficha de la cita; el botón «Añadir a mi calendario» usa título genérico («Cita Quisqueya Home») sin cliente, lugar ni responsable | `src/app/(crm)/agenda/vista.tsx` | Hallazgo de privacidad | Haiku | Codex + D12 | — |
| **AG-0c** | La agenda muestra solo reuniones/visitas por defecto (`activity_type in ('meeting')`) con filtro para ver llamadas y tareas | `agenda/page.tsx`, `vista.tsx` | Hallazgo de calidad | Haiku | Codex | AG-1 |
| **AG-1** | `consultarAgenda(actor, alcance, {desde, hasta, tipos, responsable})` en `application/actividades/consultas.ts`; `page.tsx` deja de usar Drizzle; `error.tsx` y `loading.tsx`; guarda `arquitectura.test.ts` verde | `src/application/actividades/{consultas,puertos,en-memoria}.ts`, `src/infrastructure/db/repos/actividades.ts`, `src/app/(crm)/agenda/{page,error,loading}.tsx` | Ficha nueva «Agenda y visitas» | Sonnet | Antigravity | — |
| **AG-2** | Migración `0013`: columnas de visita en `activities` (`outcome`, `interest_level`, `objections`, `visit_mode`, `cancelled_reason`, `lead_id` ya existe), CHECKs de valores; `PATCH` y esquemas Zod ampliados; `npm run test:db` verde sobre copia | `schema.ts`, `drizzle/0013_*.sql`, `src/application/actividades/**`, `src/app/api/actividades/**` | Ficha «Agenda y visitas» (cambio de esquema) | Sonnet | Antigravity + D12 | AG-1 |
| **AG-3a** | `detectarConflictos(responsable, desde, hasta, excluirId)` y respuesta 409 `CONFLICTO_AGENDA` con opción de forzar; pruebas de borde (cita contigua no choca) | `src/application/actividades/{casos-de-uso,conflictos}.ts`, `src/domain/agenda.ts` y test | Ficha «Agenda y visitas» | Sonnet | Codex | AG-1 |
| **AG-3b** | Ficha de la cita en `Sheet`/`Drawer` con editar, reprogramar por formulario y cancelar con motivo; `completar` | `src/app/(crm)/agenda/{ficha-cita,formulario-cita}.tsx` | Ficha «Agenda y visitas» | Sonnet | Antigravity | AG-2, AG-3a |
| **AG-4** | Resultado de visita: formulario + caso de uso `registrarResultadoVisita` que usa `registrarInteraccion`, crea tarea de seguimiento y emite `VisitaRealizada` | `src/application/actividades/visita.ts`, `agenda/resultado-visita.tsx` | Ficha «Agenda y visitas» | Sonnet | Antigravity + D12 | AG-2, CT-3, CT-E |
| **AG-5** | `ProgramarVisitaDialog` reutilizable (contacto, lead, negocio, proyecto/unidad) y botón en las fichas de Contactos, Leads y Negocios | `src/app/(crm)/agenda/programar-visita.tsx` (nuevo), `contactos/inspector.tsx`, `leads/inspector.tsx`, `negocios/inspector.tsx` | Ficha «Agenda y visitas» | Haiku | Codex | AG-3a |
| **AG-6a** | Instalar FullCalendar 6.1.21 y crear `src/components/calendario/calendario.tsx` con tema por variables `--fc-*`, vistas Día/Semana/Mes/Lista, carga diferida, anuncio accesible; prueba de guarda de versiones fijadas en `package.json` | `package.json`, `src/components/calendario/**`, `src/app/globals.css` (solo variables `--fc-*`) | Ficha «Agenda y visitas» + **decisión de D03/Wilber que sustituye Schedule-X** | Sonnet | Antigravity + D07 | AG-0a |
| **AG-6b** | `agenda/vista.tsx` usa el calendario: arrastrar y redimensionar llaman a `PATCH` con rollback si el servidor rechaza o hay choque; alternativa por teclado vía ficha | `src/app/(crm)/agenda/vista.tsx` | Ficha «Agenda y visitas» | Sonnet | Antigravity | AG-3a, AG-3b, AG-6a |
| **AG-7** | Recordatorios: tabla `activity_reminders` (minutos antes, canal, estado) + trabajo del worker que emite `RecordatorioVencido`; consumidor que notifica al broker y, con plantilla, al cliente | `schema.ts`, `drizzle/`, `src/application/actividades/recordatorios.ts`, `src/infrastructure/integraciones/outbox/consumidores.ts` | Ficha «Alertas y recordatorios» | Sonnet | Antigravity + D12 | TA-5, CM-3 |
| **AG-8** | Suscripción `.ics` privada: ruta `GET /api/agenda/feed/[token]`, token aleatorio guardado como hash, revocable; `STATUS:CANCELLED`, `SEQUENCE` y `VTIMEZONE` | `src/app/api/agenda/feed/[token]/route.ts`, `src/domain/ics.ts` y test, `schema.ts` | Ficha «Agenda y visitas» | Sonnet | Antigravity + D12 | AG-2 |
| **AG-9** | Vista de equipo (administrador): filtro por broker y proyecto, colores por responsable, carga por día | `agenda/{page,vista,filtros}.tsx` | Ficha «Agenda y visitas» | Haiku | Codex | AG-6b |
| **AG-10** | Hora del cliente en la ficha y selector de huso del contacto (`contacts.timezone`) | `schema.ts`, `drizzle/`, `agenda/ficha-cita.tsx` | Ficha «Agenda y visitas» | Haiku | Codex | AG-3b |
| **AG-11** | Reserva pública de visita (`/reservar/[slug]`): disponibilidad del broker, anti-abuso, crea lead y cita | `src/app/reservar/**`, `src/application/agenda/reserva-publica.ts` | Ficha nueva «Reserva pública» (R3) | Sonnet | D12 + Antigravity | AG-3a, LD-9 |
| **AG-12** | Google Calendar de dos vías con `activity_sync` | `src/infrastructure/integraciones/google-calendar/**` | Ficha de integración nueva (decisión #25 la difiere) | Sonnet | D12 | AG-8 |

## 8. No verificado
- Tamaño real del paquete de FullCalendar 6.1.21 con los cinco plugins en nuestro build (no se midió; se carga diferida por defecto).
- Precio y términos de Schedule-X Premium: solo se leyó que el arrastre y el redimensionado pasaron a ser de pago.
- Que `@fullcalendar/react@6.1.21` se comporte bien con React 19 y Next 15 (peers declarados `^19`, sin ejecutar).
- Compatibilidad entre `@schedule-x/drag-and-drop@3.7.3` y calendar 3.x: inferida del número de versión, no probada.
- Calidad de accesibilidad de la rejilla de FullCalendar 6 (el changelog de 7.1.2 lista correcciones de lectores de pantalla); requiere revisión D07 con lector real.
- Nadie ha mirado la agenda en un navegador para este expediente: las afirmaciones de §2.1 salen de leer `vista.tsx` y `page.tsx`.
- Si el negocio realmente agenda en sábado y fuera de 9–17 no está documentado; es hipótesis razonable de preventa (visitas a obra).
