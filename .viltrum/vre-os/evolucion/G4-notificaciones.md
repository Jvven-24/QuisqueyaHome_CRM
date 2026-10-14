# Expediente de evolución · Notificaciones (in-app, correo, push)

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026) · G4 Plataforma · D21 + D03 + D12 · 2026-10-14.
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia); AGPL/GPL solo como servicio aparte o referencia. Nada se incrusta.
> Diseño transversal: `G4-00-arquitectura-centralizacion.md`. Notificaciones es el **consumidor más suscrito** del bus: convierte hechos de todos los módulos en avisos a personas.
> Alcance: avisos **a usuarios internos** (brokers, asistentes, admin, oficial de cumplimiento). Mensajes a clientes son Comunicaciones (M11, `MensajeriaPort`).

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 1 | Campana en el header (`crm-header.tsx:54-110`) lee `GET /api/notificaciones` **una vez al montar** y marca leídas con `PATCH`. |
| Datos reales y reglas de negocio | 0–1 | Tabla `notifications` (`schema.ts:1078-1094`): `notification_type` es texto libre, sin plantilla, sin canal, sin deduplicación. **Nada del sistema escribe notificaciones** (grep en `src`: solo la ruta, el header y el esquema). |
| Diseño y componentes | 2 | Popover de lista con iconos por tipo y estados de carga/vacío. |
| Experiencia de uso | 1 | Sin tiempo real, sin enlace a la entidad, sin preferencias, sin agrupar, sin «silenciar», sin contador fiable. |
| Calidad | 0 | Sin pruebas (`api/notificaciones` no tiene `*.test.ts`). |

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **La ruta inventa datos.** `GET /api/notificaciones` (`route.ts`, bloque «poblar 3 de bienvenida operativas») inserta tres notificaciones **falsas** («Nuevo Lead desde Portal Web — Elena Ramirez asignada a tu cartera», «Cita programada hoy…», «Actualización de obra… Bávaro Beach Lofts») para **cualquier usuario real que aún no tenga ninguna**. Cada usuario nuevo vería actividad que no existe. Es el mismo defecto que el banner «se sincronizarán al recuperar la red» de Academy (`academy/vista.tsx:249`): la interfaz afirma algo que el sistema no hizo.
2. **Marcar leída es una IDOR.** `PATCH` con `id` actualiza `where(eq(notifications.id, datos.id))` **sin filtrar por `userId`** (`route.ts`, rama `if (datos.id)`). Cualquier usuario autenticado puede marcar como leídas las notificaciones de otro; con ids secuenciales, todas.
3. **El contador de no leídas es incorrecto**: `unreadCount` se calcula sobre las últimas 20 filas (`rows.filter(!isRead)`), no sobre el total del usuario.
4. **Permiso equivocado**: ambas rutas piden `dashboard:view`. Quien ve el dashboard ve «sus» notificaciones, pero el recurso no existe como tal; no se puede dar o quitar.
5. **Sin productores.** Los eventos que importan (lead asignado, cita próxima, cuota vencida, aprobación pendiente, KYC por vencer, avance publicado) no llegan a ningún lado. Es el punto en que la centralización se vuelve visible para el usuario.
6. **Mensajes que filtran datos.** Si los productores se escriben sin regla, una notificación como «Pago de US$40 000 de Juan Pérez» se guarda en claro; el texto debe ser genérico y el detalle se lee tras abrir la entidad con el alcance del usuario.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| NOT-01 | Corregir la ruta: sin semillas falsas, `PATCH` con `userId`, contador total, permiso propio `notifications` | ESENCIAL | A21.3 | defectos 1–4 |
| NOT-02 | Catálogo de **tipos** (cerrado, con plantilla `es`/`en`, severidad, canal por defecto, enlace a la entidad) | ESENCIAL | A21.3 | texto libre |
| NOT-03 | Consumidor `notificaciones` del bus: regla evento → destinatarios (responsable, admin, oficial de cumplimiento, broker del proyecto) → notificación, con deduplicación (`dedupe_key`) y agrupación | ESENCIAL | A21.3 | ausente |
| NOT-04 | Tiempo real en la campana (SSE con `LISTEN/NOTIFY` o sondeo cada 30 s como respaldo) | IMPORTANTE | A21.3 | carga única |
| NOT-05 | Bandeja completa `/notificaciones`: filtros, leídas/no leídas, archivar, acciones rápidas desde la fila («Aprobar», «Abrir lead») | IMPORTANTE | A21.3 | popover de 20 |
| NOT-06 | Preferencias por usuario y tipo (en la app / correo / push), horario silencioso, resumen diario, zona horaria del usuario (diáspora) | ESENCIAL | A21.3 | ausente |
| NOT-07 | Correo transaccional con plantillas versionadas (react-email) y registro de entrega | IMPORTANTE | A21.3 | ausente |
| NOT-08 | Push web (VAPID) con Service Worker: instalación como PWA, suscripción por dispositivo, baja al cerrar sesión | IMPORTANTE | A21.3 | ausente |
| NOT-09 | Notificaciones **críticas** no silenciables (alerta PLAFT, aprobación por caducar, bus caído) con escalado a un suplente | ESENCIAL | A18, A19.2 | ausente |
| NOT-10 | Recordatorios programados: cita en 1 h, tarea vencida, lead sin contacto a los N minutos (SLA), cuota por vencer | ESENCIAL | A1, A7, A12 | ausente |
| NOT-11 | Retención y limpieza (90 días leídas) y exportación en el derecho de acceso | DESEABLE | A18.9 | ausente |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **Novu** | `novuhq/novu` @ `8179a0647b` (rama `next`) | Raíz: **MIT** (`LICENSE-MIT`, © Noti-fire Apps Ltd). Además `EE-PACKAGES-LICENSE` y `LICENSE-ENTERPRISE`: carpeta `enterprise/` bajo **licencia propietaria** («Approval Required… may not provide commercial hosting») | TS (monorepo NestJS + React) | Modelo de **workflows con canales, plantillas, preferencias por canal, digest y un `<Inbox/>`** | **REF** (no RUN, no PORT) | Autoalojado exige API + Worker + WS + Dashboard + **2 Redis (uno con AOF) + MongoDB + S3** (docs.novu.co, «Self-hosting overview»; consultadas hoy) y pierde funciones de la nube. Desproporcionado para ~10–50 usuarios internos, y rompe «misma tecnología» (Mongo). Se toma la idea (preferencias, digest, plantilla por canal) | — |
| Knock / Courier / SuprSend | — | SaaS cerrados (no OSS; **no se leyó LICENSE: no existe repositorio de servidor**) | — | — | **DESCARTADOS** | Contradicen la regla OSS y enviarían datos de compradores a terceros | — |
| **Nodemailer** | `nodemailer/nodemailer` @ `e58217ca27`, npm | **MIT-0** (npm; texto MIT en `LICENSE` leído) | Node | `createTransport({ host, port, secure, auth })` hacia SMTP del proveedor; `sendMail` | **APP** | Estándar de facto; sin servicio propio | S |
| **react-email** | `resend/react-email` @ `1531a395bf`, `@react-email/components` | MIT | React/TSX | `render()` de plantillas a HTML/texto; componentes `Html`, `Button`, `Section` | **APP** | Ya elegido en `MAPA-SISTEMAS-OSS.md` §1 (capa C); plantillas en el mismo repo y con `i18n` | S |
| **web-push** | `web-push-libs/web-push` @ `b34d7d4ba1`, npm 3.6.7 (última publicación 2024-01-16) | **MPL-2.0** (LICENSE leído; copyleft **por archivo**) | Node | `sendNotification(subscription, payload, { vapidDetails })` | **APP sin modificar** (como dependencia npm, no se copia código) | MPL no contagia a nuestro código si no se modifica ni se redistribuye modificado; **la regla del programa solo permite copiar MIT/Apache/BSD/ISC → solo como dependencia**. Última publicación hace ~21 meses: riesgo de mantenimiento; alternativa de salida: VAPID con `node:crypto` | S |
| **Serwist** | `serwist/serwist` @ `1b2ea2b397`, `@serwist/next` 9.5.13 | MIT | TS | Service Worker con `push` y `notificationclick` (ver G4-i18n-pwa) | APP | Compartido con PWA | S |
| `postgres` (porsager) | ya en `package.json` | Unlicense/Public domain (**NO LEÍDO aquí; ya adoptado**) | Node | `sql.listen(canal)` / `sql.notify` para LISTEN/NOTIFY | APP | Misma conexión del proyecto; LISTEN no funciona tras pgbouncer en modo transacción | S |

Qué adaptamos: el modelo de preferencias/digest de Novu y las plantillas react-email; nada de su servidor. Riesgos: (a) **PII en push/correo**: el payload lleva título genérico y enlace, nunca montos ni nombres; (b) entregabilidad del correo (SPF/DKIM del dominio de Quisqueya) fuera del código; (c) web-push abandonado → plan de salida documentado.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Campana con contador real y agrupación («3 leads nuevos») | `Popover` + `Badge` existentes, ítem con acción primaria | `crm-header.tsx` |
| Bandeja `/notificaciones` con pestañas Todas · No leídas · Críticas | `Tabs` + `data-table.tsx` | módulo nuevo (recurso `notifications`) |
| Preferencias: matriz tipo × canal con horario silencioso | `Table` + `Switch` (añadir a `components/ui`) | perfil de usuario / Configuración |
| Toasts efímeros para eventos de la sesión | `sonner` (ya instalado) | global |
| Estados | `estados.tsx` (vacío, error con reintento, sin permiso) | todo |

## 6. Comunicación con el resto (centralización)
**Consume** (suscripción del consumidor `notificaciones`): `LeadAsignado`, `NegocioCambioEtapa`, `CuotaVencida`, `CuotaPorVencer`, `PagoRegistrado`, `ComprobanteRechazado`, `SolicitudAprobacionCreada/Aprobada/Rechazada/Caducada`, `AvanceObraPublicado`, `ComisionDevengada`, `KycPorVencer`, `AlertaPlaftGenerada`, `ActividadVencida`, `MetaAlcanzada`, `ImportacionCompletada`, `SaludBusDegradada`, `EntregaEnCuarentena`, `PermisosCambiados`. **Emite**: `NotificacionEntregada`/`NotificacionFallida` (solo métrica). **Puertos**: `NotificacionesPort` (`notificar(destinatario, tipo, entidad)`; los módulos *no* lo llaman, usan eventos; solo las automatizaciones, que ya son consumidoras, pueden invocarlo), `CorreoPort` (adaptador Nodemailer), `PushPort` (adaptador web-push), `BusPort`. **Datos compartidos**: `notifications`, `notification_preferences`, `push_subscriptions`, `users.timezone`/`locale` (G4-i18n-pwa).

## 7. Lotes asignables
Ficha nueva: `G07-notificaciones` (D01/D03; D12 por PII y push). NOT-L1 es **corrección de defecto** y no necesita ficha nueva (hallazgo con prueba).
| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| NOT-L1 | Quitar semillas falsas; `PATCH` filtra por `userId`; `unreadCount` = `count(*) where userId and !isRead`; pruebas (usuario B no marca las de A; usuario nuevo recibe lista vacía) | `src/app/api/notificaciones/route.ts` (+`route.test.ts` nuevo) | hallazgo | Haiku | D12 | — |
| NOT-L2 | Recurso `notifications` en el manifiesto de permisos y semilla (todos los roles `view:own`) | `src/domain/catalogs.ts`, `db/seed.sql` | G07 + CFG-L5 | Haiku | D12 | NOT-L1 |
| NOT-L3 | Dominio puro: catálogo de tipos (severidad, canal, plantilla, resolutor de destinatarios), deduplicación y agrupación; tabla de verdad | `src/domain/notificaciones.ts` (+test) | G07 | Haiku | D14 | — |
| NOT-L4 | Migración: `notifications` (+`dedupe_key`, `group_key`, `severity`, `action_url`), `notification_preferences`, `notification_deliveries`, `push_subscriptions` (RLS) | `schema.ts`, `drizzle/0006_*`, `scripts/test-db/**` | G07 + D11 | Sonnet | D11+D12 | NOT-L3 |
| NOT-L5 | Casos de uso `notificar`, `listar`, `marcarLeida`, `preferencias` con `reaches` por usuario | `src/application/notificaciones/**`, `src/infrastructure/db/repos/notificaciones.ts` | G07 | Sonnet | D12 | NOT-L4 |
| NOT-L6 | Consumidor del bus + reglas para 6 eventos iniciales (lead asignado, aprobación creada, cuota vencida, aprobación caducada, KYC por vencer, bus degradado) | `src/infrastructure/integraciones/notificaciones/**` | G07 + G10 | Sonnet | D12 | NOT-L5 + BUS-L4 |
| NOT-L7 | Campana renovada (contador, agrupación, enlace, sondeo 30 s) y `GET /api/notificaciones/stream` (SSE) con `requireScope` | `src/app/(crm)/_ui/crm-header.tsx`, `src/app/api/notificaciones/**` | G07 | Sonnet | D05+D07 | NOT-L5 |
| NOT-L8 | Bandeja `/notificaciones` y preferencias | `src/app/(crm)/notificaciones/**` | G07 | Sonnet | D05+D07 | NOT-L7 |
| NOT-L9 | Adaptador `CorreoPort` (Nodemailer) + 3 plantillas react-email `es/en` + registro de entrega | `src/infrastructure/integraciones/correo/**`, `src/emails/**` | G07 | Sonnet | D12 | NOT-L6 |
| NOT-L10 | Push: `PushPort` (web-push), suscripción desde el cliente, baja al cerrar sesión, `push`/`notificationclick` en el SW | `src/infrastructure/integraciones/push/**`, `src/app/sw.ts` (G4-i18n-pwa) | G07 + PWA | Sonnet | D12 | NOT-L9 + PWA-L2 |
| NOT-L11 | Recordatorios programados (cita 1 h, lead SLA, cuota T-3) por el programador | `src/infrastructure/integraciones/bus/tareas/recordatorios.ts` | G07 | Sonnet | D14 | BUS-L10 |

## 8. No verificado
Que `LISTEN/NOTIFY` funcione con la conexión del proyecto (pooler de Supabase en modo transacción lo rompe); la licencia raíz del paquete `postgres` (adoptado antes, no releído); entregabilidad del correo y proveedor SMTP elegido (decisión de Wilber); que el Service Worker pueda mostrar push en Safari/iOS instalado como PWA (requiere iOS ≥16.4: **no probado**); si los clientes de la diáspora deben recibir también estas alertas (hoy se asume que no: son Comunicaciones).
