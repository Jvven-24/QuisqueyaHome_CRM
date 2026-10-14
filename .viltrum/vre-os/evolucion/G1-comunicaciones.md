# Expediente de evolución · Comunicaciones (bandeja unificada) (G1 · Comercial)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026). Autor: D21 + D03 + D05 (Claude Sonnet), solo lectura de código y web; sin cambios en `src/`.
> Reglas: misma tecnología primero; copiar o portar solo MIT / Apache-2.0 / BSD / ISC con LICENSE leído y commit fijado; AGPL/GPL solo RUN o referencia.
> Estado de fichas: **no existe ficha de Comunicaciones (M11)** en `.viltrum/vre-os/spec/modulos/`; M01, M03 y M22 la citan como consumidor futuro (`M22-cobros.md`: «M11 consume `CuotaVencida` y decide plantilla/canal»). Todo lote funcional requiere ficha nueva `READY` y D12 (R3: datos personales y envío a terceros).
> Lotes compartidos citados: `CT-1`, `CT-2`, `CT-3`, `CT-E` (en `G1-contactos.md`), `TA-5` (en `G1-tareas.md`).

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia (archivo:línea o captura) |
|---|---|---|
| Funciones | 2 | CRUD de plantillas con variables `{nombre}` y despacho manual a un destinatario escrito a mano (`comunicaciones/vista.tsx`, `application/comunicaciones/casos-de-uso.ts`). No hay bandeja, hilo, historial ni mensajes entrantes. |
| Datos reales y reglas de negocio | 1 | No existe tabla de mensajes: cada envío deja solo una fila de auditoría con destinatario enmascarado (`casos-de-uso.ts:despacharMensajeAuditado`). `webhook_inbox` sin uso (D21 inventario §5). El estado de los canales está escrito a mano (§2.3). |
| Diseño y componentes | 2 | Editor de plantilla + vista previa + selector de canal en una sola vista de 647 líneas con clases del prototipo; sin conversación, sin burbujas, sin lista virtualizada. |
| Experiencia de uso (flujos, atajos, móvil) | 2 | Flujo «escribir destinatario → pegar texto → enviar»; no se envía desde la ficha del contacto, lead o negocio. |
| Calidad (pruebas, seis estados, accesibilidad) | 2 | `casos-de-uso.test.ts`, `domain/comunicaciones.test.ts`, `proveedor-despacho.test.ts`; sin `error.tsx` ni `loading.tsx` de módulo (D21 inventario §2); sin pruebas con BD. |

**Objetivo: 4 (avanzado)** en los cinco ejes. Escala: 0 ausente · 1 maqueta · 2 básico · 3 completo · 4 avanzado · 5 referente.

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **El despacho devuelve éxito falso.** `src/infrastructure/comunicaciones/proveedor-despacho.ts`: sin `TELEGRAM_BOT_TOKEN` responde `ok: true` con `mensajeId: tg_sim_…` (líneas 57-65); sin credenciales de WhatsApp, `ok: true` con `wa_sim_…` (líneas 109-115); los canales `email`, `sms` y cualquier otro caen en la rama `default` que devuelve `ok: true` con `sim_…` **sin enviar nada** (líneas 40-47). La API responde `{ ok: true }`, la auditoría registra `ok: true` y la UI muestra éxito. Efecto: un broker cree que el cliente recibió una oferta y no salió un solo byte. **Contradice** el inventario D21 del 14-oct (§3, «sin token configurado devuelve error de canal»), que no leyó estas ramas. Es el hallazgo más grave del grupo.
2. **No hay registro de mensajes ni historial por contacto.** `despacharMensajeAuditado` guarda quién, canal, destinatario enmascarado y resultado en `audit_log`, pero no el texto, el contacto, el lead ni el negocio. Nadie puede responder «¿qué se le mandó a este cliente?». Tampoco se actualiza `last_interaction_at` (ver `G1-contactos.md` §2.1).
3. **Estado de canales inventado.** `src/infrastructure/db/repos/comunicaciones.ts:204-246` devuelve `webhookRegistrado: true` para Telegram y webhook, un costo fijo `0.045` USD por conversación de WhatsApp, y el nombre `@QuisqueyaHome_Bot` por defecto. Ninguno proviene de una comprobación real. La tarjeta de canales de la vista presenta esos valores como estado.
4. **Sin bandeja de entrada.** No existe ruta de webhook para WhatsApp ni Telegram; `webhook_inbox` (`schema.ts:1203`) tiene la estructura (`system`, `account_id`, `event_id` único) pero ningún escritor. Las respuestas de los clientes llegan al teléfono del broker o al runtime externo, nunca al CRM.
5. **WhatsApp se envía como texto libre.** `proveedor-despacho.ts:130` usa `type: "text"`. La plataforma de Meta solo admite texto libre dentro de las 24 horas posteriores al último mensaje del cliente; para un lead nuevo exige una plantilla aprobada. Con credenciales reales, los primeros contactos fallarán con error de Meta que hoy se muestra como fallo genérico.
6. **Dos proveedores posibles sin decisión de arquitectura aplicada.** `MAPA-SISTEMAS-OSS.md` §1 y §5 fijan el **runtime propio** (YCloud / Meta, `E:/VILTRUM/VILTRUM META Y AUTOMATIZACIONES`) como proveedor de `MensajeriaPort`; el CRM, en cambio, llama directo a `graph.facebook.com/v21.0` (`proveedor-despacho.ts:119`). Hay que decidir cuál de los dos es el camino antes de construir la bandeja; si no, se duplica la lógica de entrega y de webhooks.
7. **Datos de ejemplo como valores iniciales reales.** `comunicaciones/vista.tsx:101-102` precarga `+18095550199` y `cliente_prospecto`; `vista.tsx:92-99` fija las variables de la vista previa (`Carlos Gómez`, `Cap Cana Luxury Lofts`, `Juan Pérez`). Un envío rápido sin cambiar el campo sale a ese número.
8. **Sin consentimiento ni opt-out antes de enviar.** `contacts.consent_at` existe (`schema.ts:~588`) pero el despacho no lo mira (catálogo A1.9 ESENCIAL, A18.9). Riesgo regulatorio y de bloqueo del número por quejas.
9. **Plantillas sin idioma, versión ni estado de aprobación.** `message_templates` (`schema.ts:1042-1053`) tiene `name`, `category`, `channel`, `body`, `variables` y `is_active`; no `language` (A2.3) ni equivalente de la plantilla aprobada de Meta. `PUT` existe, `DELETE` no.
10. **Permiso de envío cerrado al broker.** Corrección del 14-oct: `POST /api/comunicaciones/despachar` exige `communications:create:all` (`api/comunicaciones/despachar/route.ts`); lo tienen admin y asistente. El broker, que es quien habla con sus leads, no puede enviar. Es pregunta abierta de Wilber (`PLAN-INTEGRAL` §7.5).
11. **Sin `error.tsx` ni `loading.tsx` propios** del módulo (D21 inventario §2).

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo (A.x) | Hoy |
|---|---|---|---|---|
| CM-F1 | Despacho honesto: sin proveedor configurado o canal no implementado = error visible, nunca éxito | ESENCIAL | A2.2 | ROTA |
| CM-F2 | Registro persistente de cada mensaje (dirección, canal, texto, contacto/lead/negocio, autor, plantilla, estado) | ESENCIAL | A2.2 | AUSENTE |
| CM-F3 | Bandeja unificada: conversaciones por contacto con no leídos, canal, responsable y filtros | ESENCIAL | A2.2 | AUSENTE |
| CM-F4 | Mensajes entrantes por webhook firmado (WhatsApp, Telegram), con recepción durable y reintento | ESENCIAL | A2.2 | AUSENTE |
| CM-F5 | Estado real de entrega: en cola, enviado, entregado, leído, fallido con causa | ESENCIAL | A2.2 | AUSENTE |
| CM-F6 | Enviar desde la ficha (contacto, lead, negocio) con plantilla y variables resueltas con datos reales | ESENCIAL | A2.3 | AUSENTE |
| CM-F7 | Ventana de 24 h de WhatsApp: aviso y obligación de usar plantilla aprobada fuera de ella | ESENCIAL | A2.3 | AUSENTE |
| CM-F8 | Consentimiento y opt-out verificados antes de cada envío, con motivo de bloqueo visible | ESENCIAL | A1.9, A18.9 | AUSENTE |
| CM-F9 | Plantillas por idioma (ES/EN), etapa y proyecto, versionadas, con vista previa sobre un contacto real | IMPORTANTE | A2.3 | PARCIAL |
| CM-F10 | Secuencias (planes de acción): mensajes y tareas programados que se detienen al responder | IMPORTANTE | A2.1 | AUSENTE |
| CM-F11 | Asignación de conversaciones, notas internas y tiempo de primera respuesta | IMPORTANTE | A13.4 | AUSENTE |
| CM-F12 | Correo: envío real con plantilla de marca y registro; recepción por reenvío (BCC) como nota | IMPORTANTE | A2.2 | SIMULADO |
| CM-F13 | Registro de llamadas (resultado, duración, siguiente paso) | DESEABLE | A2.6 | AUSENTE |
| CM-F14 | Avisos automáticos de obra y de cobro (consumen `AvanceObraPublicado`, `CuotaVencida`) | IMPORTANTE | A2.7, A7.4 | AUSENTE |
| CM-F15 | Notificaciones dentro del CRM (campana) de mensaje nuevo y conversación sin respuesta | IMPORTANTE | A21.3 | AUSENTE |

## 4. Open source que aporta (verificado)
Verificación del 14-oct-2026: LICENSE leído en el commit citado; versiones y licencias npm del registro; fechas desde `commits.atom`; rutas confirmadas con clones sin checkout.

| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta que aporta | Modo | Encaje con nuestro stack | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **Chatwoot** | `chatwoot/chatwoot` @ `ab0c81a` (2026-10-14) | MIT salvo carpeta `enterprise/` (`LICENSE`, leído) | Rails + Vue + PostgreSQL + Redis | **Modelo de datos** a imitar: `app/models/{conversation,message,inbox,contact_inbox,canned_response,label,macro,automation_rule,assignment_policy}.rb` y `app/models/channel/{whatsapp,telegram,email}.rb`. Responde a **CM-F2, F3, F11**. | REF (esquema e ideas); RUN solo si se decide bandeja multiagente | Rails: no se porta código. Servicio aparte pesado (Redis, workers). MAPA §5: «solo si hace falta bandeja compartida multiagente». Evitar `enterprise/`. | S (REF) |
| **Atomic CRM · correo entrante** | `marmelab/atomic-crm` @ `ec21c1c` | MIT (`LICENSE.md`) | Deno edge functions | `supabase/functions/postmark/{forwardedParser.ts,extractMailContactData.ts,addNoteToContact.ts,getExpectedAuthorization.ts}`: recibe correo reenviado, extrae el contacto y crea una nota (**CM-F12**). | PORT de funciones puras (parseo), REF del resto | Corren en Deno/Supabase; el parseo es TypeScript puro. Se reescriben como caso de uso + ruta Next. | M |
| **postal-mime** | npm `postal-mime@4.0.6` | MIT-0 (campo `license` del registro npm) | JS sin dependencias | Parseo de correo MIME crudo (adjuntos, cabeceras) para **CM-F12** | APP | Sustituye a `mailparser` (MIT, más pesado). | S |
| **react-email** | `resend/react-email` @ `1531a39` (2026-10-08); npm `@react-email/components@1.0.12`, `@react-email/render@2.1.0` | MIT (`LICENSE.md`, © 2024 Plus Five Five) | React 18/19 | Componentes de plantilla de correo (`Html`, `Section`, `Button`) y `render()` a HTML en servidor. | APP | Mismo stack; `MAPA` §1 capa C ya lo prevé. Solo para correo; WhatsApp y Telegram son texto. | S |
| **Tiptap** | `ueberdosis/tiptap` @ `1f93f61` (2026-10-14); npm `@tiptap/react@3.32.0`, `@tiptap/starter-kit`, `@tiptap/extension-mention` | MIT (`LICENSE.md`, © 2025 Tiptap GmbH) | React | Editor de plantilla con chips de variable (extensión `Mention` configurada para `{nombre}`) y vista previa. Las extensiones «Pro» son de pago: usar solo núcleo, `starter-kit` y `mention`. | APP | Hoy la plantilla es un `textarea` con botones que insertan texto (`vista.tsx:147-165`). Tiptap solo si las plantillas de correo necesitan formato; para WhatsApp/Telegram basta el `textarea`. | M |
| **Dice UI** | `sadmann7/diceui` @ `040e842` | MIT | React + Radix | `docs/registry/bases/radix/ui/mention.tsx` (alternativa ligera a Tiptap para menciones de variables), `editable.tsx`, `timeline.tsx` | PORT | Una sola pieza, sin dependencia adicional pesada. | S |
| **TanStack Virtual** | `TanStack/virtual` @ `3c61b6e`; npm `3.14.19` | MIT (`LICENSE`) | React | `useVirtualizer` para el hilo de mensajes y la lista de conversaciones | APP | Evita pintar miles de mensajes. | S |
| **libphonenumber-js** | `catamphetamine/libphonenumber-js` @ `54c0209`; npm `1.13.15` | MIT | TS | Normalizar el número entrante al E.164 para casar con el contacto y armar `wa.me` (lote `CT-2`) | APP | Ver `G1-contactos.md` §4 | S |
| **Novu** | `novuhq/novu` @ `8179a06` (2026-10-14, rama `next`); npm `@novu/react@3.19.2` | **Doble**: `LICENSE-MIT` (núcleo) y `LICENSE-ENTERPRISE` (carpeta `enterprise`), leídos; npm `ISC` | Node + Mongo + Redis | `@novu/react` `<Inbox />` (campana de notificaciones) | REF / diferido | Aclaración: el MAPA decía «licencia raíz no encontrada»; sí existe `LICENSE-MIT`. Aun así necesita el servidor de Novu (Mongo, Redis, workers): para una campana alcanza una tabla `notifications` y Realtime (lote `TA-5`). No adoptar. | — |
| **Twenty** | `twentyhq/twenty` @ `a573e84` | AGPL-3.0 + archivos comerciales (`LICENSE`) | React + NestJS | Módulos de mensajes y campañas (`/messages`, `/messageCampaigns` según `MAPA` §3) | REF / RUN (espejo) | No se copia. | — |
| **@chatscope/chat-ui-kit-react** | npm `2.1.1` | MIT | React | Burbujas de chat, lista de conversaciones | REF | Estilos propios que chocan con nuestros tokens; mejor componer con Tailwind. | — |
| **Cal.diy** | `calcom/cal.diy` @ `54343aa` (2026-09-20) | MIT (`LICENSE`) | Next.js | Recordatorios por correo de reservas | REF | Según `MAPA` (aviso de vigencia) es solo para uso personal no productivo. No relevante. | — |
| **Evolution API / Baileys** | — | Evolution: Apache-2.0 con condiciones (`MAPA` §2) | Node | — | **Descartado** | WhatsApp no oficial: riesgo de baneo del número del cliente (`MAPA` §5). | — |

Qué se adapta y qué no: de Chatwoot se copia la **forma** (conversación → mensajes → canal, bandeja asignable), no código. De Atomic CRM, el parseo de correo reenviado. Riesgos: dependencia de un proveedor de WhatsApp aún no decidido (§2.6); las plantillas aprobadas de Meta y las tarifas cambian y se verifican en la documentación oficial de Meta al implementar (no se leyó aquí).

## 5. Diseño y componentes a elevar
| Patrón | Componente concreto | Dónde se usa |
|---|---|---|
| Bandeja en tres paneles (escritorio) / lista → hilo (móvil) | `Tabs` (Bandeja · Plantillas · Canales) + lista de conversaciones + hilo con `useVirtualizer` (TanStack Virtual) + compositor; en móvil el hilo ocupa pantalla completa con `Drawer` | `/comunicaciones` |
| Burbujas con estado de entrega | Componente propio con iconos de estado y texto («Entregado 10:42»), nunca solo icono (WCAG) | Hilo |
| Banner de ventana de 24 h | `Alert` con tono semántico: «Pasaron más de 24 h: usa una plantilla aprobada» y selector de plantilla | Compositor |
| Compositor con plantilla | `Command` (shadcn/cmdk) para buscar plantilla por nombre; variables resueltas visibles antes de enviar | Compositor y «Enviar mensaje» en fichas |
| Editor de plantilla | `textarea` con chips de variable (`mention.tsx` de Dice UI) o Tiptap si hay correo con formato; vista previa con un contacto real elegido | Pestaña Plantillas |
| Estado de canales | Tarjeta por canal con **estado comprobado** (último webhook recibido, último envío OK, última falla) en lugar de cifras fijas; si no se pudo comprobar, «Sin verificar» | Pestaña Canales |
| Seis estados | `error.tsx` y `loading.tsx` del módulo; vacío «Sin conversaciones»; permiso insuficiente; sin conexión bloquea el compositor; éxito con aviso `role=status` | Todo el módulo |
| Móvil | Objetivos ≥48 px, texto ≥13 px, compositor pegado al borde inferior con safe area | 320/390 |

## 6. Comunicación con el resto (centralización)
- **Es el motor de mensajería del CRM**: Contactos, Leads, Negocios, Cobros, Avances y Tareas piden enviar mediante un único caso de uso `enviarMensaje` (lote `CM-3`) y no llaman al proveedor. Eso evita que cada módulo reimplemente consentimiento, ventana de 24 h y registro.
- **Emite**: `MensajeEnviado`, `MensajeRecibido`, `EstadoMensajeCambiado`, `ConversacionAsignada`. Requieren `CT-E` (ampliar `TIPOS_EVENTO_CRM` y `outbox_type_check`).
- **Consume**: `CuotaVencida` y `PagoRegistrado` (Cobros: `M22-cobros.md` §Eventos), `AvanceObraPublicado` (Avances), `LeadSinContactar` (Leads LD-5), `VisitaProgramada` (Agenda AG-5) para recordatorios, `RecordatorioVencido` (Tareas TA-5).
- **Puertos**: `MensajeriaPort` (ARQ-VRE-002; hoy el símbolo TS es `ProveedorDespachoCanal`, `application/comunicaciones/puertos.ts:60`), con adaptadores intercambiables: directo a Meta/Telegram (actual) o runtime propio. `ContactosPort` (canales, consentimiento), `registrarInteraccion` (CT-3).
- **Datos que comparte**: `messages.contact_id`, `messages.lead_id`, `messages.deal_id` (nuevas), `contact_channels` (CT-1), `webhook_inbox`, `outbox`.
- **Seguridad**: webhooks verifican firma antes de parsear (`PLAN-INTEGRAL` §2); secretos solo en `env.ts`; el cuerpo del mensaje es dato personal: acceso por alcance (broker ve solo sus conversaciones), exportación auditada, nunca en logs ni en eventos del outbox (payload mínimo, `crm.ts:7`).

## 7. Lotes asignables
Cada lote ≤ 45 min con prueba. Productor Claude; revisor de otro proveedor; **D12 en todo lo que envía o recibe** (R3).

| Lote | Entrega verificable | Archivos permitidos | Ficha que lo habilita | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| **CM-0a** | Despacho honesto: sin token o canal no implementado (`email`, `sms`, `default`) devuelve `ok: false` con código `CANAL_NO_CONFIGURADO`; sin ramas `*_sim_*`; pruebas que fallan si reaparece un éxito simulado | `src/infrastructure/comunicaciones/proveedor-despacho.ts`, `proveedor-despacho.test.ts`, `src/domain/comunicaciones.ts` (+ test) | Hallazgo de integridad (no es función nueva) | Sonnet | Antigravity + D12 | — |
| **CM-0b** | Estado de canales comprobado: `configurado` por variables de entorno y sin `webhookRegistrado`, costo ni nombre de bot inventados; la vista muestra «Sin verificar» cuando no hay evidencia | `src/infrastructure/db/repos/comunicaciones.ts`, `src/application/comunicaciones/{puertos,consultas}.ts`, `comunicaciones/vista.tsx` | Hallazgo de integridad | Sonnet | Codex | — |
| **CM-0c** | Quitar `+18095550199`, `cliente_prospecto` y variables de ejemplo como valores iniciales; `error.tsx` y `loading.tsx` del módulo; texto de «Sin configurar» | `src/app/(crm)/comunicaciones/{vista,error,loading}.tsx` | Hallazgo de calidad (D21 inventario §2) | Haiku | Codex | — |
| **CM-1** | Migración `0012`: `conversations`, `messages` (dirección, canal, `external_message_id`, `contact_id`, `lead_id`, `deal_id`, `template_id`, `status`, `error_code`, `sent_by`, `body`), `message_status_events`; RLS; índice único `(channel, external_message_id)`; `test:db` sobre copia | `schema.ts`, `drizzle/0012_*.sql`, `src/infrastructure/db/repos/mensajes.ts`, `scripts/test-db/comunicaciones.ts` | **Ficha nueva M11 Comunicaciones** (cambio de esquema, R3) | Sonnet | Antigravity + D12 | CT-1 |
| **CM-2** | Entrada: `POST /api/comunicaciones/webhook/whatsapp` y `.../telegram` con verificación de firma (cabecera `X-Hub-Signature-256` de Meta, `secret_token` de Telegram) **antes de parsear**, escritura en `webhook_inbox`, y procesamiento idempotente que crea el mensaje, casa o crea contacto por E.164 y emite `MensajeRecibido` | `src/app/api/comunicaciones/webhook/**`, `src/application/comunicaciones/recepcion.ts`, `src/infrastructure/integraciones/outbox/consumidores.ts`, `src/infrastructure/env.ts` | Ficha M11 + decisión del proveedor (§2.6) | Sonnet | Antigravity + D12 | CM-1, CT-2, CT-3, CT-E |
| **CM-3** | `enviarMensaje`: comprueba permiso y alcance sobre el contacto, consentimiento, ventana de 24 h; persiste en cola, despacha, registra estado; clave de idempotencia; llama a `registrarInteraccion`; sustituye a `despacharMensajeAuditado` para envíos ligados a contacto | `src/application/comunicaciones/casos-de-uso.ts`, `puertos.ts`, `src/app/api/comunicaciones/enviar/route.ts` | Ficha M11 | Sonnet | Antigravity + D12 | CM-0a, CM-1, CT-3 |
| **CM-4** | Estados de entrega: el webhook de Meta/Telegram actualiza `status` (enviado, entregado, leído, fallido con causa saneada) y emite `EstadoMensajeCambiado` | `src/application/comunicaciones/recepcion.ts`, `repos/mensajes.ts`, prueba | Ficha M11 | Sonnet | Codex | CM-2 |
| **CM-5a** | Pestaña Bandeja: lista de conversaciones (filtros por canal, no leídos, responsable), hilo virtualizado y compositor; seis estados | `src/app/(crm)/comunicaciones/{bandeja,hilo,compositor}.tsx`, `src/application/comunicaciones/consultas.ts`, `package.json` (`@tanstack/react-virtual`) | Ficha M11 | Sonnet | Antigravity | CM-3, CM-4 |
| **CM-5b** | Componente `EnviarMensajeDialog` reutilizable y botón «Enviar mensaje» en las fichas de contacto, lead y negocio | `src/app/(crm)/comunicaciones/enviar-mensaje.tsx` (nuevo), `contactos/inspector.tsx`, `leads/inspector.tsx`, `negocios/inspector.tsx` | Ficha M11 | Haiku | Codex | CM-3 |
| **CM-6** | Plantillas v2: columnas `language`, `version`, `approval_status`, `external_template_name`; borrado lógico; vista previa con un contacto elegido; chips de variable | `schema.ts`, `drizzle/`, `repos/comunicaciones.ts`, `comunicaciones/plantillas.tsx` | Ficha M11 | Sonnet | Codex | CM-1 |
| **CM-7** | Correo real: adaptador de salida (SMTP o el proveedor que decida Wilber) + plantilla de marca con react-email y `render()`; registro en `messages` | `src/infrastructure/comunicaciones/correo.ts`, `src/emails/**` (nuevo), `package.json`, `env.ts` | Ficha M11 + **decisión de proveedor de correo (Wilber)** | Sonnet | Antigravity + D12 | CM-3 |
| **CM-8a** | Secuencias: tablas `sequences`, `sequence_steps`, `sequence_enrollments`; el worker avanza pasos, respeta consentimiento y se detiene ante respuesta | `schema.ts`, `drizzle/`, `src/application/secuencias/**`, `scripts/outbox-worker.mjs` (o planificador nuevo) | Ficha nueva «Secuencias» (A2.1) | Sonnet | Antigravity + D12 | CM-3, CM-4, TA-5 |
| **CM-8b** | UI de secuencias (constructor lineal de pasos) | `src/app/(crm)/comunicaciones/secuencias.tsx` | Ficha «Secuencias» | Haiku | Codex | CM-8a |
| **CM-9** | Consentimiento y opt-out en el envío (consulta `contact_channels.consent_at`, palabra «BAJA» entrante marca opt-out) | `src/application/comunicaciones/consentimiento.ts` y test | Ficha M11 | Sonnet | D12 | CM-2, CT-1 |
| **CM-10** | Correo entrante por reenvío a una dirección del CRM → nota en el contacto, portando el parseo de `forwardedParser.ts` (cabecera de procedencia MIT, commit `ec21c1c`) con `postal-mime` | `src/app/api/comunicaciones/correo-entrante/route.ts`, `src/application/comunicaciones/correo-entrante.ts` | Ficha M11 | Sonnet | D12 | CM-2 |
| **CM-11** | Permiso de envío del broker acotado a su cartera (`communications:create:own`) | `src/domain/rbac.ts`, `src/app/api/comunicaciones/**`, seed de permisos | **Decisión de Wilber** (`PLAN-INTEGRAL` §7.5) | Sonnet | D12 | CM-3 |
| **CM-12** | Registro de llamadas (resultado, duración) como interacción | `src/app/(crm)/comunicaciones/llamada.tsx`, `registrarInteraccion` | Ficha M11 | Haiku | Codex | CT-3 |

## 8. No verificado
- No se leyó el runtime propio (`E:/VILTRUM/VILTRUM META Y AUTOMATIZACIONES`): su API, firma de webhooks y plantillas aprobadas son supuestos tomados del MAPA, no verificados.
- Reglas vigentes de Meta (ventana de 24 h, plantillas, tarifas) tomadas de conocimiento general, no de la documentación oficial leída hoy; deben verificarse en `developers.facebook.com` al escribir la ficha.
- No se comprobó con credenciales reales qué ocurre al enviar; solo se leyó el código del adaptador.
- No se revisaron los workflows del runtime ni la tarjeta «Integraciones» de Configuración (`configuracion/_integraciones.tsx`), que también afirma estados fijos.
- No se midió el volumen de mensajes esperado; el uso de virtualización es preventivo.
- Proveedor de correo, número de WhatsApp Business y cuenta de Telegram no están definidos en el repositorio; los lotes `CM-2` y `CM-7` quedan condicionados a que Wilber los defina.
- Licencia raíz de Novu: ahora leída (`LICENSE-MIT`, `LICENSE-ENTERPRISE`); queda por confirmar qué carpetas exactas cubre la licencia comercial (el README nombra `enterprise`).
