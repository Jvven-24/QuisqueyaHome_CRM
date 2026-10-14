# Expediente de evolución · i18n (español/inglés para la diáspora) y PWA/offline

> Programa «cada módulo a nivel avanzado» (Wilber, 14-oct-2026) · G4 Plataforma · D21 + D03 + D12 · 2026-10-14.
> Reglas: misma tecnología primero; copiar/portar solo MIT, Apache-2.0, BSD o ISC (LICENSE leído, commit fijado, cabecera de procedencia); AGPL/GPL solo como servicio aparte o referencia. Nada se incrusta.
> Diseño transversal: `G4-00-arquitectura-centralizacion.md`. Dos temas en un expediente porque comparten la misma pieza: el `locale`/zona horaria del usuario y del contacto, y el Service Worker.

## 1. Nivel actual (0–5) y evidencia
| Eje | Nivel | Evidencia |
|---|---|---|
| Funciones | 1 | i18n: ninguna. PWA: `public/manifest.json` (start_url `/inicio`, `display: standalone`, 3 iconos que sí existen en `public/brand/`) y `appleWebApp` en `layout.tsx:36-40`; **no hay Service Worker** (`src/app` y `public/` sin `sw`). |
| Datos reales y reglas de negocio | 1 | Cadenas en español en el código de los componentes; formato `Intl.DateTimeFormat("es-DO", { timeZone: "America/Santo_Domingo" })` fijo en cada vista (`historial.tsx`, `reportes/vista.tsx`, `outbox-estado.ts`). Hay un diccionario por módulo (`_ui/analitica-copy.ts`), pero no un sistema. `contacts.country` existe (`schema.ts:579`); **no hay idioma preferido ni zona horaria** en `contacts` ni en `users`. |
| Diseño y componentes | 2 | Dock móvil (`mobile-dock.tsx`), menú lateral y shell responsivos. |
| Experiencia de uso | 1 | El banner de Academy afirma «Los cambios locales se sincronizarán al recuperar la red» (`academy/vista.tsx:249`) y **no existe ninguna cola**: el cambio se pierde. Reportes solo avisa `!online`. |
| Calidad | 1 | Sin pruebas de i18n ni de PWA. Lighthouse PWA nunca medido. |

## 2. Puntos críticos (arreglar antes de evolucionar)
1. **Promesa falsa de sincronización offline** (`academy/vista.tsx:249`): peor que no tener offline. Hasta que exista cola, el banner debe decir la verdad («Sin conexión: los cambios no se guardarán»).
2. **`Permissions-Policy: camera=(), microphone=(), geolocation=()`** (`next.config.ts:28`, cabeceras globales) **prohíbe** grabar notas de voz (asistente IA), tomar fotos de obra desde la cámara (Avances) y ubicar visitas. La interfaz de nota de voz es imposible mientras tanto. Debe abrirse por ruta (`microphone=(self)` solo en Leads/Comunicaciones; `camera=(self)` solo en Avances).
3. **`maximumScale: 1`** en el viewport (`layout.tsx:27`): impide el zoom con pellizco, incumpliendo WCAG 1.4.4 (Cambio de tamaño del texto) en un CRM que se usa en móvil. Un broker con baja visión no puede ampliar.
4. **Sin `<html lang>` dinámico**: `lang="es"` fijo (`layout.tsx:53`); en inglés los lectores de pantalla pronunciarían mal.
5. **Zona horaria fija a Santo Domingo**: un broker de Miami o Madrid ve las citas en hora de RD sin saberlo; el módulo `domain/zona-horaria.ts` existe pero no se parametriza por usuario. Un contacto en Madrid recibe una cita con hora ambigua.
6. **Datos sensibles y Service Worker**: si el SW cachea HTML o JSON autenticados, otro usuario del mismo dispositivo (tablet compartida en una oficina de ventas) vería datos del anterior. Regla: el SW nunca cachea respuestas autenticadas de navegación/API y se borra todo al cerrar sesión.
7. **Moneda y números**: USD y DOP conviven; formatear con `Intl.NumberFormat(locale, { style: "currency", currency })` por registro y no un símbolo fijo.

## 3. Funciones objetivo de nivel avanzado
| ID | Función | Prioridad | Catálogo | Hoy |
|---|---|---|---|---|
| I18N-01 | Infraestructura de idioma sin rutas localizadas (cookie + preferencia del usuario) y `messages/es.json`, `messages/en.json` por módulo | ESENCIAL | A21.3 | ausente |
| I18N-02 | Idioma preferido y zona horaria en `users` y en `contacts` (con país), editables y usados por Agenda, Comunicaciones y Cobros | ESENCIAL | A12, A2 | ausente |
| I18N-03 | Plantillas de mensaje y correo por idioma (`message_templates.locale`), con respaldo al idioma del contacto y, si falta, al de la empresa | ESENCIAL | A2 | una sola versión |
| I18N-04 | Fechas, números y monedas por `locale` y moneda del registro; hora mostrada en la zona del usuario con la zona de la cita visible | ESENCIAL | A12 | fijo |
| I18N-05 | Candado de CI: paridad de claves es/en, sin cadenas literales nuevas en módulos migrados | IMPORTANTE | A21.3 | ausente |
| I18N-06 | Traducción de documentos generados (cotización PDF, estado de cuenta, contrato) por idioma del comprador | IMPORTANTE | A4, A7 | ausente (coordinar G1/G3) |
| PWA-01 | Service Worker con precache del shell estático, página `/offline` y caché de fuentes/imágenes; **nada autenticado se cachea** | ESENCIAL | A21.3 | ausente |
| PWA-02 | Instalación guiada (botón «Instalar», `beforeinstallprompt`; instrucciones para iOS) y manifiesto completo (`id`, `scope`, `lang`, `shortcuts`, capturas) | IMPORTANTE | A21.3 | manifiesto mínimo |
| PWA-03 | Cola offline **solo de altas** idempotentes (nota, tarea, actividad, foto de avance, nota de voz) con `Idempotency-Key`, estado visible «pendiente de enviar» y reintento al volver la red | ESENCIAL | A12, A3 | ausente |
| PWA-04 | Lectura sin conexión de «Mi día» (agenda y tareas de hoy) cifrada y borrada al cerrar sesión, opcional por usuario | DESEABLE | A12 | ausente |
| PWA-05 | Permisos de dispositivo por ruta (cámara, micrófono, ubicación) y zoom habilitado (WCAG) | ESENCIAL | A21.3 | bloqueados |
| PWA-06 | Notificaciones push (ver G4-notificaciones) | IMPORTANTE | A21.3 | ausente |
| PWA-07 | Presupuesto de rendimiento medido en móvil gama media (LCP, INP) y auditoría Lighthouse PWA en CI manual | IMPORTANTE | A21.3 | sin medir (coordinar D15) |

## 4. Open source que aporta (verificado)
| Proyecto | Repo + commit/tag | Licencia (LICENSE leído) | Stack | Pieza exacta | Modo | Encaje | Esfuerzo |
|---|---|---|---|---|---|---|---|
| **next-intl** | `amannn/next-intl` @ `b9fc98a814`, npm 4.14.9 (modificado 2026-10-02) | MIT | TS; peer `next ^12…^16`, `react` hasta 19 | `getRequestConfig` (idioma por cookie/usuario, **modo sin rutas localizadas**), `NextIntlClientProvider`, `useTranslations`/`getTranslations`, `useFormatter` (ICU: plurales, fechas, números, monedas por zona) | **APP** | Es la librería de i18n más usada para App Router; el modo sin prefijo de ruta encaja con un CRM tras login. El Portal público es otro repo | M |
| **Serwist** | `serwist/serwist` @ `1b2ea2b397`, `@serwist/next` 9.5.13 (modificado 2026-10-04) | MIT | TS; peer `next >=14`, `react >=18` | `withSerwist` (plugin de build), `sw.ts` con `Serwist`, estrategias `NetworkOnly`/`StaleWhileRevalidate`, `BackgroundSyncQueue`, `fallbacks` de offline | **APP** | Fork mantenido de Workbox; es la vía recomendada para Next. Compatibilidad exacta con el modo de build de este proyecto (webpack por defecto de `next build` vs `@serwist/turbopack`) **NO VERIFICADA**: lote de PoC | M |
| **idb** | `jakearchibald/idb` @ `654c746bef`, npm (modificado 2026-10-06) | ISC | TS | envoltorio de IndexedDB con promesas para la cola de altas y el borrado al cerrar sesión | **APP** | Evita escribir IndexedDB a mano | S |
| `libphonenumber-js` | npm 1.13.15 | MIT | TS | país/E.164 de números de la diáspora | APP | Ver decisión pendiente en G4-import-export (#19) | S |
| `Intl` (nativo) | — | — | — | `DateTimeFormat`, `NumberFormat`, `RelativeTimeFormat`, `Temporal` cuando esté disponible | APP | Sin dependencia | S |
| Lighthouse CI | `GoogleChrome/lighthouse-ci` (**LICENSE no leído en esta sesión**) | NO VERIFICADO | — | medición PWA | REF | Solo si D15 lo adopta | — |

Qué adaptamos: next-intl en modo sin rutas, con un namespace por módulo para migrar de a uno; Serwist solo para precache estático, fallback offline y cola de altas. Qué no: caché de datos autenticados; sincronización bidireccional (edición offline de importes o cuotas es peligrosa). Riesgos: (a) coste de traducción de las ~15 vistas (mucho texto ya en `analitica-copy.ts` y componentes); (b) un SW mal escrito deja usuarios con una versión vieja pegada → estrategia `skipWaiting` + aviso «Hay una versión nueva» y botón de recarga; (c) iOS solo permite push y almacenamiento persistente en PWA instalada.

## 5. Diseño y componentes a elevar
| Patrón | Componente | Dónde |
|---|---|---|
| Selector de idioma y zona horaria en el menú de usuario | `DropdownMenu` + `Select` | `broker-footer.tsx` / perfil |
| Indicador de red y cola «3 cambios pendientes de enviar» | `Badge` + `Sheet` con la lista y «Reintentar ahora» | header |
| Página `/offline` con seis estados y accesos permitidos sin red | `estados.tsx` | raíz |
| Aviso de nueva versión | `sonner` con acción «Actualizar» | global |
| Botón «Instalar aplicación» | `Button` en el menú de usuario | shell |

## 6. Comunicación con el resto (centralización)
**Emite**: `PreferenciaIdiomaCambiada` (opcional), `CambioEncoladoOffline` solo como métrica local. **Consume**: nada de dominio. **Puertos**: `PreferenciasPort` (idioma/zona del usuario y del contacto, usado por Comunicaciones, Agenda, Cobros y Notificaciones al elegir plantilla), `AlmacenamientoPort` (fotos y notas de voz encoladas al subir). **Datos compartidos**: `users.locale`, `users.timezone`, `contacts.preferred_language`, `contacts.timezone`, `message_templates.locale`, `notification_templates.locale`. La cola offline envía al **mismo** endpoint con `Idempotency-Key` (el contrato de I00 ya lo exige para comandos: `command_receipts`).

## 7. Lotes asignables
Ficha nueva: `G13-i18n-pwa` (D01/D03; D07 por zoom y lenguaje; D12 por caché y permisos de dispositivo). PWA-L1 es corrección de defecto.
| Lote | Entrega verificable | Archivos permitidos | Ficha | Modelo | Revisor | Depende de |
|---|---|---|---|---|---|---|
| PWA-L1 | Corregir el banner falso de Academy; quitar `maximumScale: 1`; `Permissions-Policy` por ruta (micrófono en Leads/Comunicaciones, cámara en Avances); prueba que lee `next.config.ts` y verifica la cabecera de rutas | `src/app/(crm)/academy/vista.tsx` (solo el banner), `src/app/layout.tsx` (viewport), `next.config.ts`, `src/infrastructure/seguridad.test.ts` | hallazgo | Haiku | D12+D07 | — |
| PWA-L2 | PoC Serwist en el modo de build del proyecto: `sw.ts` con precache estático, `/offline`, `NetworkOnly` para navegación y `/api`; informe; **sin cachear datos autenticados** (prueba que lo asegura) | `next.config.ts`, `src/app/sw.ts` (nuevo), `src/app/offline/page.tsx`, `package.json` | G13 | Sonnet | D12+D16 | PWA-L1 |
| PWA-L3 | Manifiesto completo (`id`, `scope`, `lang`, `shortcuts`) + botón «Instalar» | `public/manifest.json`, `src/app/(crm)/_ui/instalar-app.tsx` | G13 | Haiku | D05 | PWA-L2 |
| PWA-L4 | Cola offline de altas con `idb` + `BackgroundSyncQueue` + `Idempotency-Key`; borrado al cerrar sesión; UI de pendientes | `src/app/(crm)/_ui/cola-offline.ts`, `cola-offline-ui.tsx` | G13 | Sonnet | D12 | PWA-L2 + comando idempotente en el servidor |
| I18N-L1 | `users.locale`/`timezone`, `contacts.preferred_language`/`timezone`, `message_templates.locale` (migración con valores por defecto `es`, `America/Santo_Domingo`) | `schema.ts`, `drizzle/0006_*`, `scripts/test-db/**` | G13 + D11 | Sonnet | D11 | — |
| I18N-L2 | `next-intl` sin rutas: `i18n/request.ts`, `messages/{es,en}.json` con shell y login, `<html lang>` dinámico | `src/i18n/**`, `messages/**`, `src/app/layout.tsx`, `src/app/(crm)/layout.tsx`, `package.json` | G13 | Sonnet | D07 | I18N-L1 |
| I18N-L3 | Formateadores por zona y moneda (`formatoFecha`, `formatoMonto`) reemplazan los `Intl` repetidos; prueba | `src/app/(crm)/_ui/formato.ts` (+test) y vistas que lo usan, una por lote | G13 | Haiku | D14 | I18N-L2 |
| I18N-L4 | Migración de módulos a mensajes, **un lote por módulo** (Inicio, Leads, Contactos, Negocios, Propiedades, Avances, Brokers, Comisiones, Comunicaciones, Academy, Agenda, Tareas, Metas, Reportes, Configuración) | `messages/*.json`, `src/app/(crm)/<modulo>/**` | G13 | Haiku | D14 | I18N-L2 |
| I18N-L5 | Candado de CI: paridad de claves es/en y detector de literales JSX en módulos ya migrados | `src/app/(crm)/i18n.test.ts` | G13 | Haiku | D14 | I18N-L4 (primer módulo) |
| I18N-L6 | Plantillas de mensaje por idioma y elección por idioma del contacto | `src/application/comunicaciones/**`, `comunicaciones/vista.tsx` | M11 + G13 | Sonnet | D14 | I18N-L1 |
| I18N-L7 | Selector de idioma/zona en el menú de usuario y en la ficha del contacto | `_ui/broker-footer.tsx`, `contactos/inspector.tsx` | G13 | Sonnet | D05 | I18N-L2 |

## 8. No verificado
Compatibilidad de `@serwist/next` con el modo de build exacto de este Next 15 (el sitio de documentación consultado no responde a esa pregunta); comportamiento de push en iOS instalado; si el Portal público (otro repo) ya tiene i18n y qué librería usa; cuántas cadenas literales hay hoy (no se contaron); los textos de WhatsApp aprobados por Meta se traducen por plantilla aprobada y no por el sistema (regla de Meta, **no investigada aquí**).
