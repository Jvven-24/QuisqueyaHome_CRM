# Mapa de sistemas open source → CRM principal

> **AVISO DE VIGENCIA — 2026-10-04.** Este mapa conserva decisiones e hipótesis históricas; sus menciones de despliegue en VPS, adopción de sistemas o secuencia E2/E3 **no son instrucciones vigentes de ejecución**. El mandato humano actual es investigación e integración **solo local**: sin nube, VPS, publicación ni `git push`. Que un servicio, endpoint o pantalla exista tampoco acredita que su función esté integrada en la UI propia del CRM. Para el alcance y la evidencia actual, consultar el [catálogo funcional D21](../research/D21-catalogo-funcional-vre-2026-10-04.csv), la [síntesis transversal D21](../research/D21-capacidades-oss-transversales-2026-10-04.md), el [dictamen arquitectónico D03](../research/D03-arquitectura-multi-oss-cobertura-2026-10-04.md) y la [revisión independiente D12](../reviews/D12-revision-cobertura-oss-2026-10-04.md). Ninguna de esas piezas cambia el gate vigente por sí misma.
>
> **Corrección Cal.com / Cal.diy.** [Cal.com anunció el cierre de su código de producción en abril de 2026](https://next.cal.com/blog/cal-diy-open-source-to-closed-source); el antiguo [repositorio `calcom/cal.com` redirige a `calcom/cal.diy`](https://github.com/calcom/cal.com). [Cal.diy](https://github.com/calcom/cal.diy) tiene [licencia MIT](https://github.com/calcom/cal.diy/blob/main/LICENSE), pero su README recomienda estrictamente uso personal no productivo y declara ausentes equipos, organizaciones, workflows y SSO. Por ello las referencias a «Cal.com MIT/OSS» más abajo están obsoletas. Cal.diy solo es candidato a PoC local de reserva pública, sin aptitud productiva ni paridad API demostradas; no se han validado slots, booking, cancelación, conflictos, privacidad o identidad.

> D00 (Claude) · 2026-10-05, a petición de Wilber: «ver los otros sistemas open source y acoplarlos al principal, con todas sus funcionalidades, para cubrir todo».
> **Método de verificación:** licencias leídas del archivo LICENSE real de cada repositorio (no del campo de la API); Twenty verificado contra su OpenAPI **viva**
> (`spec/integraciones/fuentes/twenty-openapi-core.json`, 322 rutas, 522 operaciones); estado local comprobado en disco y en Docker. Lo no verificado está marcado `NO VERIFICADO`.
> El catálogo de capacidades de Gemini es un borrador sin valor probatorio (ver `spec/integraciones/CAPACIDADES.md`).

## 1. Conclusión
Hay **tres cosas que ya existen y no estaban en el plan** (principio P0 «todo está creado») y que cambian qué hay que instalar:

1. **Twenty ya está vivo** y es mucho más grande que un CRM básico: 522 operaciones sobre unos 40 objetos (personas, empresas, oportunidades, tareas, notas, flujos de trabajo
   con ejecuciones, calendario, mensajes y campañas, grabaciones de llamadas, tableros, adjuntos, línea de tiempo, compartir registros, agentes de IA).
2. **Viltrum Automations Runtime ya está en producción** (`E:/VILTRUM/VILTRUM META Y AUTOMATIZACIONES`): WhatsApp (YCloud), Instagram, Discord y un modelo local, con
   webhooks, `/admin/leads` y `/admin/metrics`. Es el proveedor natural de `MensajeriaPort`; montar Evolution API, Baileys o Chatwoot **duplicaría** lo que ya funciona.
3. **ERPNext/Frappe ya fue evaluado** (93/100, GPLv3, `E:/VILTRUM/VILTRUM ERP CRM`) como capa financiera; está parado por la fiscalidad dominicana (DGII, e-CF).

| Capa | Sistemas | Qué significa |
|---|---|---|
| **A · Ya vivo o propio** | Twenty (local, :9320) · Viltrum Automations Runtime (VPS, producción) · PostgreSQL (CRM local, Supabase del Portal) | se conectan ya detrás de su puerto |
| **B · Servicio aparte (RUN) detrás de un puerto** | Moodle (Academy) · Papermark (dossiers) · Activepieces (automatización externa) · Cal.com (reserva pública, opcional) · ERPNext (finanzas, diferido) | se despliegan en la VPS; el CRM los ve por su puerto |
| **C · Librería dentro del código (APP/PORT)** | shadcn/Recharts/vaul · Schedule-X · MapLibre · react-pdf · react-email · GoRules Zen · libphonenumber-js · Pannellum · ical-generator · OpenProperty (portado) | entran al código con su procedencia anotada |
| **D · Referencia, diferido o descartado** | Prolink y Reality CRM (sin licencia: solo ideas) · Chatwoot, Novu, Meilisearch, Formbricks, PostHog, GrowthBook (diferidos: sin necesidad medida) · Evolution API y Baileys (riesgo, ver §5) · n8n (licencia no OSI) · Documenso (excluido por Wilber) · Odoo/EspoCRM/SuiteCRM/Dolibarr (duplicarían el CRM) | no se instalan ahora |

## 2. Licencias reales (leídas del LICENSE) y qué permiten

| Sistema | Licencia real | Parte comercial | Implicación para nosotros |
|---|---|---|---|
| Twenty | AGPLv3 casi todo; archivos marcados `@license Enterprise` comerciales; algunos paquetes MIT | archivos «Enterprise» | RUN aparte y solo por API/webhooks (excepción de aplicaciones); **no tocar su núcleo ni usar archivos Enterprise** |
| Chatwoot | MIT | carpeta `enterprise/` | RUN posible; evitar `enterprise/` |
| Activepieces | MIT | `packages/ee` | RUN posible; evitar `ee` |
| PostHog | MIT | `ee/` | RUN posible; evitar `ee` |
| GrowthBook | MIT | carpetas `enterprise` | RUN posible; evitar `enterprise` |
| Evolution API | Apache-2.0 **con condiciones adicionales** (logo/copyright si se usan sus componentes de interfaz; licencia comercial si se cumplen ciertas condiciones) | — | solo como servicio de fondo; **revisión humana de las condiciones** |
| Meilisearch | MIT **y** BUSL-1.1 (partes Enterprise) | `LICENSE-EE` | núcleo MIT usable; evitar funciones EE |
| Papermark | AGPLv3 | `ee/` | RUN aparte, sin copiar código; evitar `ee` |
| Formbricks | AGPLv3 (salvo paquetes MIT) | `apps/web/modules/ee` | RUN aparte; evitar `ee` |
| **n8n** | **Sustainable Use License (no es OSI)** | archivos `.ee.` | uso interno permitido, pero **no se puede revender como servicio**: incompatible si Viltrum vende este CRM a varias inmobiliarias → **descartado**; revisión humana |
| Novu | LICENSE raíz **no encontrado** | `enterprise/` | `NO VERIFICADO`: no usar hasta leer su licencia |
| Moodle | GPLv3 | — | RUN como servicio aparte (nunca copiar su código) |
| Frappe LMS | AGPLv3 | — | alternativa a Moodle, también aparte |
| ERPNext/Frappe | GPLv3 | — | RUN aparte, solo por API |
| OpenProperty | MIT | — | PORT con cabecera de procedencia |
| Cal.com, Schedule-X, MapLibre, react-pdf, react-email, GoRules Zen, libphonenumber-js, Pannellum, ical-generator, shadcn, Recharts, vaul | MIT / BSD-3 (según la API de GitHub; archivo LICENSE sin leer) | — | APP/librería; confirmar el archivo al instalar |
| Prolink, Reality CRM | **sin licencia** | — | solo referencia de ideas, prohibido copiar |

## 3. Qué cubre cada sistema y dónde aterriza en el CRM principal

«Aterriza» = la función se **ve y se usa en nuestra interfaz** (nunca se incrusta la interfaz del sistema), alimentada por su puerto.
Estado: vivo · por instalar · parcial.

| Pantalla del CRM | Función que migra | Sistema que la cubre | Puerto / modo | Estado | Ola |
|---|---|---|---|---|---|
| Contactos | personas y empresas, detección y fusión de duplicados, restaurar (baja lógica), agrupar | **Twenty** (`/people`, `/companies`, `/people/duplicates`, `/people/merge`, `/people/{id}/restore`, `/people/groupBy`) | `CrmPort` · RUN | vivo | E2.1 |
| Leads | línea de tiempo unificada, dedup por teléfono E.164, captura multicanal | Twenty (`/timelineActivities`) + libphonenumber-js + runtime propio | `CrmPort`, `MensajeriaPort` | vivo / por instalar | E2.1–E2.2 |
| Negocios | oportunidades, etapas editables, reglas de etapa y de comisión | Twenty (`/opportunities`, `/workflows`) + GoRules Zen | `CrmPort` · RUN | vivo / por instalar | E2.1, E2.4 |
| Tareas | tareas y notas ligadas a negocio o contacto | Twenty (`/tasks`, `/notes`, `/taskTargets`) | `CrmPort` | vivo | E2.1 |
| Comunicaciones | WhatsApp, Instagram, plantillas, historial, bandeja | **Runtime propio** (YCloud/Meta) + react-email; Twenty (`/messages`, `/messageCampaigns`) como espejo | `MensajeriaPort` · RUN | vivo | E2.2 |
| Agenda | calendario semanal/mensual, exportar y sincronizar, reserva pública del broker | Schedule-X + ical-generator (APP) · Cal.com (RUN, opcional) · Twenty (`/calendarEvents`) | `AgendaPort` | por instalar | E2.3 |
| Propiedades | catálogo, mapa, recorrido 360, disponibilidad | propio + MapLibre + Pannellum | librerías | parcial | E1.3, E2.7 |
| Rentas | contratos, cobros, mora, mantenimiento | **OpenProperty** (PORT) | repositorio propio | por instalar | E2.6 |
| Cotizaciones y planes de pago | PDF, plan 10/40/50, reglas | react-pdf + GoRules Zen + react-email | librerías / `ReglasPort` | por instalar | E2.4 |
| Documentos y dossiers | envío con seguimiento de lectura | **Papermark** (RUN) | `DocumentosPort` | por instalar | E3 |
| Academy | cursos, matrícula, progreso, certificados por broker | **Moodle** (RUN) | `AprendizajePort` | por instalar | E2.5 |
| Brokers | ranking, perfil, formación | propio + progreso de Moodle | `AprendizajePort` | parcial | E1.4 |
| Comisiones y metas | reparto, retenciones RD, formato 606 | propio + GoRules Zen; **ERPNext** para contabilidad formal | `FinanzasPort` · RUN | parcial / por instalar | E3 (bloqueo DGII) |
| Reportes | gráficas, embudo, ROI | propio (Recharts); PostHog y GrowthBook diferidos | — | vivo | E1 |
| Automatización | flujos entre sistemas | workflows de **Twenty** primero; Activepieces si hace falta | `AutomatizacionPort` | vivo / por instalar | E2.1, E3 |
| Búsqueda global | buscar en todo | PostgreSQL FTS + `pg_trgm` (Meilisearch solo si se mide la necesidad) | — | por instalar | E2.7 |
| Integraciones (Configuración) | salud, cola de salida, `capacidades()` | propio (outbox, `CrmPort`) | todos | parcial | E1.5 |

## 4. Twenty: lo que ofrece de verdad (verificado en la instancia viva)
- **40 grupos de objetos y 522 operaciones**, cada objeto con el mismo patrón: listar, crear, actualizar y borrar uno o varios, buscar duplicados, **fusionar**, **restaurar** (borrado lógico: encaja con la regla firmada «nada se elimina», D-05/D-10) y agrupar.
- **Campos de los objetos clave:** personas (nombre, correos, teléfonos, cargo, empresa), empresas (nombre, dominio, dirección, ingresos, propietario), **oportunidades** (nombre, importe, fecha de cierre, **etapa**, contacto, empresa, propietario), tareas (título, cuerpo, vencimiento, estado, asignado), notas, línea de tiempo (22 campos con destino a persona, empresa, oportunidad, tarea, nota, flujo…).
- **Lo que no cuadra solo** (se resuelve en la ficha de la integración, I01): nuestras 7 etapas canónicas contra el selector de etapas por defecto de Twenty; los campos propios de inversor y el identificador externo requieren **campos personalizados** (`NO VERIFICADO`: `/rest/metadata/objects` devolvió 0 objetos con esta clave, hay que usar su API de metadatos GraphQL); la autoría de cada cambio; el límite de uso.
- **Propiedad de los datos:** hasta que haya prueba de concepto, mapeo y ensayo de migración, la fuente de verdad **sigue siendo PostgreSQL local** y Twenty es espejo (decisión #43).

## 5. Decisiones que necesito de Wilber (con mi recomendación)
1. **Mensajería:** usar el **runtime propio en producción** como proveedor de `MensajeriaPort` (WhatsApp por YCloud, Instagram), en vez de Evolution API o Baileys. Motivo: ya funciona y usa API oficial; Baileys y Evolution usan WhatsApp no oficial (riesgo de baneo del número del cliente) y Evolution añade condiciones de licencia. Chatwoot solo si se necesita una bandeja compartida multiagente.
2. **Academy:** Moodle como servicio aparte, **en la VPS** (no en este equipo; necesita PHP, base de datos y tareas programadas).
3. **Finanzas:** ERPNext queda diferido hasta resolver DGII y e-CF; las comisiones se calculan en el CRM por ahora.
4. **Automatización:** n8n descartado por licencia (no OSI, no permite revenderlo como servicio); primero los workflows de Twenty, Activepieces si hace falta.
5. **Diferidos sin necesidad medida:** Meilisearch, PostHog, GrowthBook, Formbricks, Novu y Chatwoot (la propia arquitectura pide no meter sistemas «porque otro proyecto los usa»).

## 6. Secuencia de integración (E2, después de cerrar E1)
`E2.1` Twenty detrás de `CrmPort` (contactos, negocios, tareas, línea de tiempo) → `E2.2` `MensajeriaPort` sobre el runtime propio → `E2.3` Agenda (Schedule-X + iCal; Cal.com opcional) → `E2.4` Cotizaciones (react-pdf, GoRules Zen, react-email) → `E2.5` Academy (Moodle, prueba de concepto en la VPS) → `E2.6` Rentas (OpenProperty) → `E2.7` búsqueda global y mapas → `E3` Papermark, Activepieces, ERPNext.
Cada paso es un frente con su ficha, `capacidades()`, pruebas de contrato con un doble, prueba viva cuando el sistema esté desplegado y el mismo cierre de 10 condiciones de E1.

## 7. La lista «Lego por Lego» (4-oct): qué se hace con cada sistema
Fuente: `docs/architecture/04-OPEN-SOURCE-LEAP-LEGO-BY-LEGO.md` (commit `f835793`, 12 «legos»). **Sus licencias no estaban verificadas**; las leí del LICENSE real (`spec/integraciones/licencias-lego.json`).

| Sistema del Lego | Licencia real | Decisión | Por qué |
|---|---|---|---|
| Twenty | AGPLv3 + archivos Enterprise | **ADOPTADO** (RUN, ya vivo) | ver §4 |
| Cal.com | MIT (según API) | opcional (RUN) | solo para reserva pública del broker |
| Pannellum | MIT | **ADOPTADO** (APP, E2.7) | recorrido 360 de avances |
| Papermark | AGPLv3 + `ee/` | **ADOPTADO** (RUN, E3) | seguimiento de lectura de dossiers |
| Chatwoot | MIT + `enterprise/` | diferido | solo si hace falta bandeja multiagente |
| Evolution API | Apache-2.0 + condiciones | diferido / riesgo | WhatsApp no oficial; ya hay runtime propio |
| FullCalendar | MIT (plugins premium comerciales) | descartado | una sola librería de calendario: Schedule-X |
| GrowthBook | MIT + `enterprise` | diferido | no hay experimentos que medir aún |
| Leaflet | BSD-2 | descartado | una sola librería de mapas: MapLibre (vectorial) |
| Plane | AGPLv3 | descartado | duplica Negocios y Tareas; pesado |
| Payload CMS | MIT | descartado | el Portal ya tiene su CMS (Studio) |
| Immich | AGPLv3 | descartado | pesado; las fotos de obra van por `AlmacenamientoPort` |
| Kill Bill | Apache-2.0 | descartado | facturación por suscripción; las comisiones inmobiliarias no encajan; ERPNext cubre finanzas |
| OpenBB | Apache-2.0 (según su LICENSE) | descartado | mercados financieros, no aplica |
| Tremor | Apache-2.0 | descartado | sin actividad desde oct-2025; shadcn Charts ya instalados |
| Superset | Apache-2.0 | diferido | BI pesado; los reportes propios cubren E1 |
| Outline | **BSL 1.1 (no libre)** | descartado | licencia no OSI |
| SuperTokens | núcleo libre + `ee/` | descartado | el login ya es Supabase Auth |
| Appwrite | BSD-3 | descartado | BaaS que duplica Supabase |
| TimelineJS | MPL-2.0 | descartado | la línea de tiempo viene de Twenty y de componentes propios |
| **Whisper (whisper.cpp)** | MIT | **ADOPTAR para el módulo M02 del contrato** (E2.2) | transcribir notas de voz de WhatsApp con revisión humana; `TranscripcionPort` local |

**Huecos que esa lista no cubría y el contrato C1 sí exige:** transcripción de notas de voz (M02, resuelto con whisper.cpp) y **Telegram Bot API** (M11; el runtime propio hoy cubre WhatsApp, Instagram y Discord, no Telegram).

## 8. Dónde vive cada investigación (localizador)
| Qué | Dónde | Estado |
|---|---|---|
| Lista «Lego por Lego» (12 módulos, ~25 sistemas) | `docs/architecture/04-OPEN-SOURCE-LEAP-LEGO-BY-LEGO.md` | escrita por otra sesión el 4-oct, licencias sin verificar (verificadas aquí) |
| Estudio del Blueprint (Twenty, Prolink, OpenProperty, PropertyWebBuilder, Reality CRM, Documenso, MapLibre) | `C:/Users/wilbe/Downloads/Viltrum_Real_Estate_OS_Master_Blueprint.md` | su dato «Prolink es MIT» resultó **falso** (sin licencia) |
| Registro de 26 candidatos con modo y prioridad | `.viltrum/vre-os/oss-registry.json` + `D21-oss-intake.md` | licencias de los `NOASSERTION` leídas aquí |
| Cobertura por módulo (35 módulos) | `.viltrum/vre-os/D21-cobertura-modulos.md` | corregida tras rechazo |
| Academy (Moodle 78/100, Frappe LMS) | `.viltrum/crm-ux/D21-academy-opensource.md` | pendiente de decisión de Wilber |
| ERP/finanzas (ERPNext 93/100, Dolibarr, EspoCRM, Odoo…) | `E:/VILTRUM/VILTRUM ERP CRM/research/01-candidatos-open-source.md` | investigación del 29-sep; piloto no aprobado |
| Runtime propio en producción (WhatsApp, Instagram, Discord) | `E:/VILTRUM/VILTRUM META Y AUTOMATIZACIONES` | vivo |
| Twenty verificado (522 operaciones) | `.viltrum/vre-os/spec/integraciones/fuentes/twenty-openapi-core.json` | instantánea de la instancia viva |
| Herramientas de desarrollo del Portal | Obsidian `4-Archive/.../Docs/audits/2026-09-07/OPEN_SOURCE_TOOLCHAIN.md` | otra auditoría (no del CRM) |
| **Este mapa consolidado** | `.viltrum/vre-os/MAPA-SISTEMAS-OSS.md` | fuente única a partir de hoy |

## 9. Qué NO está verificado
Capacidades por endpoint de Moodle, Chatwoot, Cal.com, Evolution y OpenProperty (se verifican en su ficha contra su fuente oficial); requisitos reales de memoria de cada servicio y su encaje en la VPS; licencia raíz de Novu; archivos LICENSE de las librerías MIT; la API de metadatos de Twenty para campos personalizados.
