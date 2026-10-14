# Expediente de evolución · Leads (G1 · Comercial)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21 + D03 + D05 (Claude Sonnet), solo lectura de código y web; sin cambios en `src/`.
> Reglas: misma tecnología primero; copiar o portar solo MIT / Apache-2.0 / BSD / ISC con LICENSE leído y commit fijado; AGPL/GPL solo RUN o referencia.
> Ficha vigente: `.viltrum/vre-os/spec/modulos/M01-leads.md` (estado **REVIEW**, riesgo R3; Codex la lleva a `READY`, `EN-CURSO.md` §4). Este expediente **no la sustituye**: la complementa con lo que M01 dejó «fuera de alcance» (importación, E.164 avanzado, SLA, IA) y lo que Wilber pide ahora. Cada lote dice si cae dentro del «tramo construible» de M01 §9.3 o si necesita enmienda.
> Lotes compartidos citados: `CT-1`, `CT-2`, `CT-3`, `CT-E`, `CT-8`, `CT-11` (definidos en `G1-contactos.md`) y `TA-5` (recordatorios, `G1-tareas.md`).

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia (archivo:línea o captura) |
|---|---|---|
| Funciones | 3 | Alta manual con aviso de duplicados, asignar, convertir a negocio, descartar con motivo, captura externa idempotente (`application/leads/casos-de-uso.ts`, `conversion.ts`; rutas en `src/app/api/leads/**`). Sin importación, SLA, scoring, reglas de distribución ni análisis. |
| Datos reales y reglas de negocio | 3 | Esquema rico: presupuesto min/max con CHECK, zona, campaña, UTM, mensaje original, `external_id` único parcial (`schema.ts:605-670`). Pero `first_contacted_at` no se escribe nunca y los estados `assigned`/`contacted` no se alcanzan (§2.1, §2.2). |
| Diseño y componentes | 3 | `DataTable` + inspector lateral + tabs por estado (`leads/vista.tsx:213-298`); `loading.tsx`/`error.tsx` propios. Mezcla `prototipo-ui` y componentes shadcn; sin timeline ni chips de filtro. |
| Experiencia de uso (flujos, atajos, móvil) | 2 | Filtros solo `q`, `source_id`, `status`, `page` (`leads/page.tsx:40-50`); tabs con contadores calculados sobre la página (§2.3); sin vistas guardadas, sin acciones masivas, sin registro de contacto. |
| Calidad (pruebas, seis estados, accesibilidad) | 3 | `casos-de-uso.test.ts`, `conversion.test.ts`, `asignacion-lead.test.ts`, `lecturas.db.test.ts`; estados de carga/error/vacío. Seis estados completos por bloque no demostrados (M01 §2, fila «Estados»). |

**Objetivo: 4 (avanzado)** en los cinco ejes. Escala: 0 ausente · 1 maqueta · 2 básico · 3 completo · 4 avanzado · 5 referente.

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **No existe ninguna transición a `contacted` ni a `assigned`, y `first_contacted_at` jamás se escribe.** Grep de `"contacted"` / `"assigned"` en `src/` (sin pruebas): solo aparecen las etiquetas de la vista (`leads/vista.tsx:267-268`) y el color en `components/ui/tone.ts:56`. `leads.first_contacted_at` (`schema.ts:644`) solo lo toca el generador del seed. Efecto: las pestañas «Asignados» y «Contactados» están siempre vacías en producción; no se puede medir tiempo hasta el primer contacto ni aplicar SLA (catálogo A1.3, A2.5). M01 acepta que «asignar no cambia status» por decisión (Q-1002, Decisión #47), pero entonces las pestañas deben ser Activos/Convertidos/Descartados (M01 §3.1) y `contacted` debe poder alcanzarse con una acción explícita («Registré contacto»), que es el lote `LD-3`.
2. **`activities.lead_id` existe pero ningún camino lo escribe.** El esquema lo declara (`schema.ts:810`, «Timeline del lead exacto») y M01 §3.2 lo exige, pero `POST /api/actividades` no acepta `leadId` (`api/actividades/route.ts:23-38`) ni `crearActividad` lo propaga (`application/actividades/casos-de-uso.ts:42-60`). Efecto: la ficha de lead no puede mostrar su seguimiento.
3. **Contadores de pestaña sobre la página, no sobre el universo.** `leads/vista.tsx:267-268` cuenta con `leads.filter(...)` sobre las 20 filas cargadas. Con 648 leads sembrados el número mostrado es engañoso (M01 §2, fila «Tabla y tabs»).
4. **Búsqueda y filtros pobres.** `ilike '%q%'` sobre nombre/teléfono/correo (`leads/page.tsx:64-70`): «Jose» no encuentra «José»; no hay filtro por broker, zona, campaña ni rango de fechas aunque el inventario P0 los mencionaba (M01 §2).
5. **Capas rotas en la página.** SQL Drizzle dentro de `leads/page.tsx:37-101` y un import desde `src/app/api/leads/_broker-candidatos.ts` (`page.tsx:20`). Falta `application/leads/consultas.ts` (M01 §2, fila «Entrada»). Sin esa capa no se pueden añadir contadores, vistas ni analítica con pruebas.
6. **Webhook de captura con token estático.** `api/leads/externo/route.ts:65-70` compara `x-webhook-token` contra `LEADS_WEBHOOK_TOKEN`; el token del Portal está en GitHub desde el 3-oct (`PLAN-INTEGRAL` §5, P0). Sin HMAC, sin tope de tamaño del cuerpo visible, sin registro en `webhook_inbox` (tabla sin uso, D21 inventario §5). Es hallazgo de seguridad, no función nueva.
7. **Reasignación por `own`.** H16 documentado: un actor con alcance `own` puede reasignar a otro broker (M01 §2, fila «Asignación»); la Decisión #47 dice que solo admin reasigna. Debe cerrarse antes de añadir reglas de distribución.
8. **API de IA sin UI.** `POST /api/ai/audio-transcribe` + `procesarNotaDeVozLead` (`application/ai/casos-de-uso.ts`) no tiene ningún llamador en `(crm)` (D21 inventario, «Módulos sin vista propia»). Trabajo hecho y sin uso.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo (A.x) | Hoy |
|---|---|---|---|---|
| LD-F1 | Bandeja Activos · Convertidos · Descartados con contadores de universo y filtros URL completos (estado, fuente, broker, zona, campaña, rango de recepción) | ESENCIAL | A1.4 | PARCIAL |
| LD-F2 | Ficha 360 con línea de tiempo (actividades del lead, cambios de estado, mensajes) y pestaña «Negocios vinculados» | ESENCIAL | A2.2 | AUSENTE |
| LD-F3 | Acción «Registré contacto» (llamada, WhatsApp, visita) que fija `first_contacted_at` y alimenta la última interacción del contacto | ESENCIAL | A1.3, A2.5 | AUSENTE |
| LD-F4 | SLA de primer contacto **configurable** (sin umbral fijo, M01 Q-1007), indicador en la fila y alerta al responsable | IMPORTANTE | A1.3, A2.5 | AUSENTE |
| LD-F5 | Pool de leads sin dueño y reasignación por incumplir SLA (reglas «first to claim» y respaldo) | IMPORTANTE | A1.2, A1.3 | AUSENTE (requiere decisión de Wilber, ver §8) |
| LD-F6 | Calificación (puntuación) con reglas visibles: presupuesto, país, plazo, financiamiento, interés Confotur, canal | IMPORTANTE | A1.7 | AUSENTE |
| LD-F7 | Atribución de origen, campaña y UTM visible y filtrable; análisis de leads por canal y conversión por periodo | ESENCIAL | A1.4, A11.1 | PARCIAL (datos sí, vista no) |
| LD-F8 | Importación CSV con mapeo, vista previa, dedup y bitácora (permiso `import`) | IMPORTANTE | A1.10 | AUSENTE (excluida en M01 §9) |
| LD-F9 | Captura por nota de voz con revisión humana (UI sobre la API existente) | DESEABLE | A1.1 | API sin UI |
| LD-F10 | Webhook endurecido: HMAC con ventana de tiempo, `webhook_inbox`, reintentos del lado emisor, captura de Meta/Google lead ads | ESENCIAL | A1.1 | PARCIAL (token) |
| LD-F11 | Titularidad de leads de brokers externos (registro, ventana de atribución, conflicto con evidencia) | ESENCIAL | A1.5 | AUSENTE |
| LD-F12 | Matching lead ↔ inventario disponible (por presupuesto, zona, tipología) | IMPORTANTE | A1.8 | AUSENTE |
| LD-F13 | Vistas guardadas por usuario y acciones masivas (asignar, descartar con motivo) | IMPORTANTE | A2.4 | AUSENTE (M01 §3.1 las deja como extensión) |
| LD-F14 | Reactivación del mismo lead descartado conservando motivo e historia | IMPORTANTE | A2.5 | AUSENTE (M01 Q-1006 la deja fuera) |

## 4. Open source que aporta (verificado)
Misma metodología de verificación que `G1-contactos.md` §4 (LICENSE leído en el commit citado, npm para versiones, `commits.atom` para fechas).

| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta que aporta | Modo | Encaje con nuestro stack | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **GoRules Zen** | `gorules/zen` @ `c8a7d89` (2026-10-13); npm `@gorules/zen-engine@2.1.7` | MIT (`LICENSE`, © 2023 GoRules.io) | Rust con binding Node | Paquete `@gorules/zen-engine`: evalúa tablas de decisión JSON. Responde a **LD-F6** (puntuación) y **LD-F5** (reglas de distribución) detrás de un `ReglasPort`. | APP (dependencia) | El `PLAN-INTEGRAL` y el `MAPA` ya lo nombran para cotizaciones. Binario nativo en Windows/Node 22: **probar la instalación** antes de comprometer. Para una puntuación de 6 criterios una función pura en `domain/` basta; Zen se justifica solo si el administrador debe editar las reglas. | M |
| **libphonenumber-js** | `catamphetamine/libphonenumber-js` @ `54c0209`; npm `1.13.15` | MIT | TS | Lote `CT-2`: E.164 internacional que desbloquea el enlace `wa.me` y la deduplicación de la diáspora | APP | Ver `G1-contactos.md` §4 | S |
| **Atomic CRM** | `marmelab/atomic-crm` @ `ec21c1c` | MIT (`LICENSE.md`) | React 19 + shadcn + Supabase, Vite + ra-core | `supabase/functions/postmark/{forwardedParser,extractMailContactData,addNoteToContact}.ts`: recibe un correo reenviado (BCC) y crea nota/contacto → idea para **captura por correo** del broker en `LD-F10`. `src/components/atomic-crm/dataImport/{parseCell.ts,DataImportDialog.tsx}` → guía de **LD-F8**. | REF + PORT de funciones puras | No tiene entidad Lead (parte de contactos y negocios): sirve de referencia de importación y captura, no del modelo. | S |
| **Chatwoot** | `chatwoot/chatwoot` @ `ab0c81a` (2026-10-14) | MIT salvo carpeta `enterprise/` (`LICENSE`, leído) | Ruby on Rails + Vue | `app/services/auto_assignment/{round_robin_selector.rb,rate_limiter.rb,assignment_service.rb}` y `app/models/{assignment_policy,inbox_assignment_policy,automation_rule}.rb`: modelo de política de asignación con límite de carga por agente | REF (idea y esquema de reglas) | Es Rails: no se porta código; se copian las **ideas** (cupo por agente, rotación, ventana). Evitar `enterprise/`. | S |
| **Frappe CRM** | `frappe/crm` @ `ba2a6bb` (2026-10-14) | AGPL-3.0 (`LICENSE`) | Python + Vue | Modelo de lead → deal, reglas de asignación y SLA | REF (solo ideas, no copiar) | AGPL: prohibido copiar. | — |
| **Twenty** | `twentyhq/twenty` @ `a573e84` | AGPL-3.0 + archivos comerciales (`LICENSE`) | React + NestJS | `packages/twenty-front/src/modules/{views,object-record,spreadsheet-import}`: vistas guardadas, tablero y flujo de importación | REF / RUN (espejo) | No se copia (AGPL). | — |
| **Krayin CRM** | `krayin/laravel-crm` @ `f6c6d68` (2026-10-13) | MIT (`LICENSE`, © Webkul) | PHP / Laravel | Modelo de lead, pipeline y cotización | REF | Stack distinto: solo ideas de modelo. | — |
| **nuqs** | npm `nuqs@2.10.2` | MIT | Next ≥14.2 | Estado de los filtros en la URL con tipos (`LD-F1`) | APP | Sustituye el parseo manual de `leads/page.tsx:40-50`. | S |
| **react-hook-form** | `react-hook-form/react-hook-form` @ `a713da3`; npm `7.90.0` | MIT (`LICENSE`) | React | Formulario de captura en pasos (Persona · Interés y origen · Revisar, M01 §3.3) con `@hookform/resolvers@5.9.1` y el mismo esquema Zod 4 del servidor | APP | Hoy cada formulario usa `FormData` a mano (`agenda/vista.tsx`, `tareas/vista.tsx`); RHF reduce errores de estado en un flujo de pasos. Opcional. | S |
| **Papa Parse** | npm `papaparse@5.7.0` | MIT | JS | Parseo del CSV de `LD-F8` | APP | Ver `G1-contactos.md` | S |
| **Dice UI** | `sadmann7/diceui` @ `040e842` | MIT (`LICENSE`) | React + Radix | `docs/registry/bases/radix/ui/timeline.tsx`: línea de tiempo de la ficha | PORT | Recolorear con tokens. | S |

## 5. Diseño y componentes a elevar
| Patrón | Componente concreto | Dónde se usa |
|---|---|---|
| Chips de filtros con contador | Chips + `Popover` de shadcn (ya instalado); referencia de la receta D05 «filter chips» 35042 citada en M01 §3.1 | Barra superior de la bandeja |
| Tabla de bandeja | `DataTable` existente; si se necesitan columnas configurables, `@tanstack/react-table` (ver `G1-contactos.md` §4) | Bandeja |
| Indicador de SLA | `Badge` con tono semántico (`components/ui/tone.ts`) + texto («Sin contactar hace 3 h»); nunca solo color (WCAG, regla de `docs/DESIGN.md`) | Fila y ficha |
| Ficha 360 | `Tabs` (Seguimiento · Datos · Negocios vinculados) en `Sheet`/`Drawer` móvil, como define M01 §3.2 | Inspector |
| Captura en pasos | `Dialog`/`Drawer` con 3 pasos; `react-hook-form` opcional | «Registrar lead» |
| Importación | Pasos: subir · mapear · vista previa · resultado, con tabla de errores por fila | `LD-F8` |
| Análisis | `ChartCard` + `MetricChart` (Recharts) ya usados en `negocios/analisis.tsx`: leads por canal, conversión por periodo; tabla alterna accesible | Pestaña «Análisis» bajo permiso |
| Móvil | Tarjetas con nombre, fuente, estado, responsable y próxima acción; filtros en `Drawer`; acciones ≥48 px (M01 §3.1) | Bandeja a 320/390 |

## 6. Comunicación con el resto (centralización)
- **Emite**: `LeadCreado` (existe), `LeadAsignado` v1 (M01 Q-1009: `leadId`, `previousBrokerId`, `brokerId`, `actorId`, `occurredAt`, `commandId`; no existe en el catálogo ni en el `CHECK`), `LeadContactado`, `LeadDescartado`, `LeadConvertido`. Todos requieren el lote `CT-E` (ampliar `TIPOS_EVENTO_CRM` y `outbox_type_check`).
- **Consume**: `MensajeRecibido` (Comunicaciones, CM-2) para crear o enlazar el lead de un mensaje entrante y fijar la primera respuesta; `RecordatorioVencido` (Tareas, TA-5) para alertar SLA.
- **Puertos**: `ContactosPort` (CT-1: canales), `ReglasPort` (nuevo, solo si se adopta Zen), `AgendaPort` para programar visita desde la ficha (G1-agenda AG-5), `MensajeriaPort` para el enlace `wa.me` y, más adelante, envío (G1-comunicaciones CM-6). Hoy `wa.me`/`tel:` son enlaces explícitos y no acreditan contacto (M01 Q-1008).
- **Datos que comparte**: `contact_channels`, `saved_views`, `activities.lead_id`, `messages.lead_id` (CM-1).
- **Con Negocios**: `convertirLead` crea el negocio y hoy no emite `NegocioCambioEtapa` de la etapa inicial ni escribe historial (M01 §2, fila «Conversión»): el lote `LD-7` lo cierra.
- **Con el Portal**: contrato `POST /api/leads/externo` (token). Evolución a HMAC es acuerdo bilateral (lado Portal fuera de este repo, `D19-enlace-portal-crm-2026-10-14.md`).

## 7. Lotes asignables
Cada lote ≤ 45 min con prueba. Productor Claude; revisor de otro proveedor (Antigravity o Codex); D12 en R3.

| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| **LD-0** | Cerrar H16: `asignarResponsableDeLead` rechaza a `own` reasignar a otro broker; prueba que falle sin el candado | `src/application/leads/casos-de-uso.ts`, `casos-de-uso.test.ts` | M01 §4 (tramo construible) | Sonnet | Antigravity + D12 | — |
| **LD-1** | `application/leads/consultas.ts` + puerto de lectura: lista paginada, **contadores de universo por estado**, filtros `status`, `source_id`, `broker_id`, `zone_id`, `campaign_id`, `from`, `to`; búsqueda sin tildes; la `page.tsx` deja de usar Drizzle ni importar de `app/api`; guarda `arquitectura.test.ts` verde | `src/application/leads/consultas.ts`, `puertos.ts`, `en-memoria.ts`, `src/infrastructure/db/repos/leads-lectura.ts`, `src/infrastructure/contenedor/leads.ts`, `src/app/(crm)/leads/page.tsx` | M01 §3.1 / §9.3 (tramo construible) | Sonnet | Antigravity | — |
| **LD-2** | Interfaz de la bandeja: tabs Activos · Convertidos · Descartados, chips de filtro con `nuqs`, tarjetas móviles 320/390, seis estados | `src/app/(crm)/leads/{vista,filtros}.tsx`, `package.json` | M01 §3.1 | Haiku | Codex | LD-1 |
| **LD-3** | Caso de uso `registrarContactoLead` (llamada, WhatsApp, visita): crea actividad con `lead_id`, fija `first_contacted_at` una sola vez, mueve el lead a `contacted`, llama a `registrarInteraccion` y emite `LeadContactado`; ruta `POST /api/leads/[id]/contacto`; pruebas de idempotencia y de alcance | `src/application/leads/casos-de-uso.ts`, `src/app/api/leads/[id]/contacto/route.ts`, `src/app/api/actividades/route.ts` (aceptar `leadId` con validación de alcance), `repos/leads.ts` | Enmienda de M01 (Q-1002/Q-1003: estado `contacted`) | Sonnet | Antigravity + D12 | CT-3, CT-E |
| **LD-4** | Ficha 360: consulta `consultarFichaLead` (actividades del lead, cambios de estado, negocios vinculados visibles) y pestañas Seguimiento · Datos · Negocios vinculados; componente de línea de tiempo | `src/application/leads/consultas.ts`, `repos/leads-lectura.ts`, `src/app/(crm)/leads/inspector.tsx`, `linea-tiempo.tsx` | M01 §3.2 | Sonnet | Antigravity | LD-1, LD-3, CT-4 |
| **LD-5** | SLA configurable: tabla `lead_sla_config` (minutos, por fuente), cálculo puro en `domain/`, indicador en bandeja, evento `LeadSinContactar` consumido por Tareas; sin umbrales en código | `schema.ts`, `drizzle/`, `src/domain/sla-lead.ts` y test, `repos/leads-lectura.ts`, `leads/vista.tsx` | Enmienda de M01 (Q-1007 hoy prohíbe publicar SLA; requiere objetivo aprobado por Wilber) | Sonnet | Antigravity + D12 | LD-1, LD-3, TA-5 |
| **LD-6** | Calificación: función pura `puntuarLead` en `src/domain/calificacion-lead.ts` con criterios y pesos en constantes visibles + explicación («+20 presupuesto > 200 000 USD»); columna `score` y etiqueta en bandeja; pruebas de tabla | `src/domain/calificacion-lead.ts` y test, `schema.ts`, `drizzle/`, `repos/leads.ts`, `leads/vista.tsx` | Ficha nueva «Calificación de leads» (A1.7) | Sonnet | Codex | LD-1 |
| **LD-7** | `convertirLead` escribe historial de etapa inicial y emite `NegocioCambioEtapa`/`LeadConvertido` en la misma transacción | `src/application/leads/conversion.ts`, `repos/leads.ts`, `conversion.test.ts` | M01 §2 fila «Conversión» (tramo construible) | Sonnet | Antigravity | CT-E |
| **LD-8a** | Importación CSV: `importarLeads` con `dry-run`, límite de filas, mapeo, dedup por E.164/correo (usa `CT-2`), bitácora y permiso `import`; prueba de que `broker` sin `import` recibe 403 | `src/application/leads/importacion.ts`, `src/app/api/leads/importar/route.ts`, `repos/leads.ts` | Ficha nueva «Importación» (M01 §9 la excluye) | Sonnet | Antigravity + D12 | CT-2 |
| **LD-8b** | Interfaz de importación por pasos | `src/app/(crm)/leads/importar.tsx`, `package.json` (`papaparse`) | Ficha nueva «Importación» | Haiku | Codex | LD-8a |
| **LD-9** | Webhook endurecido: firma HMAC-SHA256 con marca de tiempo (ventana de 5 min), registro en `webhook_inbox`, tope de tamaño de cuerpo, compatibilidad temporal con token | `src/app/api/leads/externo/route.ts` y test, `src/infrastructure/env.ts` (variable nueva), `repos/webhook-inbox.ts` | Ficha de integración Portal (I04) + decisión de rotar el token | Sonnet | Antigravity + D12 | acuerdo con el Portal |
| **LD-10** | UI de nota de voz: grabar/subir audio en el inspector, mostrar la transcripción editable y crear lead tras confirmar | `src/app/(crm)/leads/nota-de-voz.tsx`, `inspector.tsx` | Ficha nueva «Nota de voz» (M02 del contrato C1) | Haiku | Codex | LD-4 |
| **LD-11** | Vistas guardadas (solo privadas) y acciones masivas asignar/descartar con motivo | `src/app/(crm)/leads/{vista,vistas}.tsx` | Ficha «Vistas guardadas» (CT-8) | Sonnet | Codex | LD-2, CT-8 |
| **LD-12** | Análisis de leads: `consultarMetricasLeads` (por canal, por periodo, conversión, tiempo a primer contacto) bajo permiso, con `ChartCard` | `src/application/leads/metricas.ts`, `repos/leads-lectura.ts`, `src/app/(crm)/leads/analisis.tsx` | M01 §3.1 «Gráficas» | Sonnet | Codex | LD-1, LD-3 |
| **LD-13** | Reglas de distribución (rotación con cupo por broker y ventana «first to claim») y pool de sin dueño; preferiblemente por `ReglasPort` con tabla de decisión | `src/application/leads/distribucion.ts`, `src/domain/distribucion-lead.ts` y test, `schema.ts`, `drizzle/` | **Decisión de Wilber** que enmiende #21 («el broker se sugiere, no se asigna solo») y #47 | Sonnet | D12 + Antigravity | LD-0, LD-5 |
| **LD-14** | Titularidad de leads de brokers externos | `schema.ts`, `src/application/leads/**` | Ficha nueva «Titularidad» (A1.5), depende de Brokers y Portal | Sonnet | D12 + Antigravity | LD-9 y G2-brokers |

## 8. No verificado
- No se ejecutó la aplicación: «Diseño» y «Experiencia» salen del código y de las fichas, no de capturas.
- Qué hacen exactamente los botones «Llamar» y «WhatsApp» de la fila (M01 afirma que son enlaces `wa.me`/`tel:` que no registran contacto): verificado en la ficha, no se leyó cada línea de `vista.tsx`.
- La instalación de `@gorules/zen-engine` (binario nativo) en Windows con Node 22 no se probó.
- El estado real de la tabla `lead_sources` y de `marketing_campaigns` (sin uso fuera del esquema) no se consultó en BD.
- Si Wilber acepta reglas de distribución automática (LD-13): contradice la decisión #21 vigente. No se asumió.
- Los umbrales de SLA no están aprobados (M01 Q-1007): el lote LD-5 los deja como configuración, sin valores por defecto.
- Cobertura de Formbricks y de Meta/Google lead ads: no investigada aquí; el MAPA los marca como diferidos.
