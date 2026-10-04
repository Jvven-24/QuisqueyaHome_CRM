# T-I0 · Catálogo de capacidades de los sistemas open source conectados («detectar todas las funcionalidades»)

Perfil: **D21 Research + D19 Integraciones**. Modo: analysis (necesita red). Revisor: Claude (verifica una muestra de citas) y D12 (licencias).
Decisiones: #43 (Twenty detrás de `CrmPort`), #45, #46 (rediseño profundo; todo sistema conectado se ve en el CRM general).
Arquitectura: `.viltrum/vre-os/ARQ-VRE-002-integraciones.md`. Registro y licencias: `.viltrum/vre-os/oss-registry.json`,
`.viltrum/vre-os/D21-cobertura-modulos.md`, `.viltrum/vre-os/D21-rentas-porte.md`, `.viltrum/vre-os/D21-twenty-inventario.md`.

## Para cada sistema entrega una matriz de capacidades
Sistemas: **Twenty**, **Moodle**, **Chatwoot**, **Evolution API** (y Baileys como alternativa), **Cal.com**, **Schedule-X**, **OpenProperty** (ya portado),
**MapLibre GL**, **Meilisearch** (búsqueda global), **react-pdf/GoRules Zen** (cotizaciones y reglas) y el **portal Quisqueya** (captura de leads, ver
`C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb`).
Columnas: **capacidad** (verbo de negocio: «crear contacto», «inscribir en curso», «enviar plantilla de WhatsApp»…) · **endpoint o mecanismo oficial**
(URL de la documentación oficial que lo prueba) · **método del puerto** que lo expondría (nombre en español, tipos del dominio, sin tipos del
proveedor) · **pantalla del CRM** donde se vería (ids del brief `.viltrum/vre-os/design/pantallas-e1.json` cuando aplique) · **evento** al outbox o
webhook entrante · **prioridad** P0/P1/P2 · **modo degradado** si el proveedor no está.

## Además, por sistema
1. **Despliegue**: servicios que necesita, RAM/CPU mínimos, puertos propuestos dentro del bloque 9300–9399 (Twenty ya usa 9320), imagen/compose oficial y
   versión fijable, y si cabe en este equipo (23 GB de RAM, Docker/WSL limitado a 4 GB) o debe ir a la VPS. Carpeta de despliegue: `E:/VILTRUM/<sistema>/`.
2. **Autenticación** hacia el sistema (tipo de clave/OAuth) y **dónde viviría el secreto** (solo `env.ts`; nunca en repo).
3. **Webhooks/eventos** que emite y cómo se verifica su firma.
4. **Contrato de `capacidades()`**: el listado exacto de banderas que el puerto devolvería para ese sistema.
5. **Plan de conexión por pasos** (adaptador con pruebas de contrato contra un doble → prueba viva) y qué falta de acceso o decisión de Wilber.

## Reglas
Cada afirmación con **URL oficial**; sin URL = `UNKNOWN`. No inventes endpoints: abre la documentación. No instales ni cloones nada en el repo del CRM.
Escribe SOLO `.viltrum/vre-os/spec/integraciones/CAPACIDADES.md` y `.viltrum/vre-os/spec/integraciones/capacidades.json` (máquina-legible:
`[{ "sistema","capacidad","fuente_url","puerto_metodo","pantalla","prioridad","degradado","verificado": true|false }]`).
Termina con `## Fuentes` y `## Verificación` (cuántas filas, cuántas con URL).

## Por qué se repite (profundidad)
La entrega anterior tiene **una sola fila por sistema** (12 filas): no detecta funcionalidades. Se pide **una fila por capacidad**. Ejecuta tú
`node scripts/spec/capacidades-check.mjs` (directorio `C:/Users/wilbe/Documents/QuisqueyaHome_CRM`) e itera hasta `OK`. Mínimos: Twenty 12 capacidades,
Moodle 10, Chatwoot 8, Evolution API 8, Cal.com 8, Schedule-X 4, OpenProperty 8, MapLibre 6, Meilisearch 5; ≥ 70 filas y ≥ 30 URLs distintas
(cada capacidad con **su** URL de la documentación oficial, p. ej. la página del endpoint). `verificado: true` solo si hay URL; el Portal Quisqueya, que
es desarrollo propio, va con `verificado: false` y la ruta del archivo del CMS como fuente. Capacidades típicas a cubrir, entre otras: Twenty
(personas, compañías, oportunidades, tareas, notas, campos personalizados, vistas, webhooks, búsqueda, importación, workflows, permisos); Moodle
(crear usuario, matricular, progreso, finalización, certificados, cursos, grupos, calificaciones, webhooks/eventos); Chatwoot (conversaciones, mensajes,
plantillas, etiquetas, asignación, contactos, bandejas, webhooks); Cal.com (tipos de evento, disponibilidad, reservas, cancelación, recordatorios,
webhooks). Sobrescribe el mismo archivo y `capacidades.json`.
