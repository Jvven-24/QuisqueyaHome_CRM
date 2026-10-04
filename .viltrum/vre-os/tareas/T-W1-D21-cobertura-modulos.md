# T-W1-D21b · Barrido de cobertura: cada módulo del CRM → qué tenemos, qué falta y qué repositorio lo cubre

Perfil: **D21 Research**. Modo: analysis (necesita web). Revisor: D03 (otro proveedor).
Mandato padre: `.viltrum/vre-os/M-20261004-VRE.md` (§3 matriz OSS, decisiones #43/#44). Arquitectura de conexión:
`.viltrum/vre-os/ARQ-VRE-002-integraciones.md`. Contrato comercial de módulos: `.viltrum/commercial.md` (M01–M15).
Entradas ya hechas (no las repitas, cítalas): `.viltrum/vre-os/D21-oss-intake.md`, `.viltrum/vre-os/D21-twenty-inventario.md`,
`.viltrum/crm-ux/D21-academy-opensource.md` (Academy: Moodle 78/100).

## Alcance: TODOS estos módulos (uno por fila)
Rutas reales en `src/app/(crm)/`: inicio, leads, pipeline, contactos, propiedades, avances (obra), agenda, tareas,
**brokers**, metas, comisiones, **comunicaciones (conexiones)**, reportes, **academy**, configuración.
Más los del Blueprint que aún no existen: cotizaciones, reservas (motor de concurrencia), planes de pago 10/40/50,
**rentas** (aprobado), Client Room, Deal Room, mapas, IA/asistente, notificaciones, automatizaciones/workflows,
captura de leads desde el portal, documentos/dossiers, búsqueda, auditoría, PWA/offline, i18n, importación/exportación,
deduplicación E.164, portal del broker / co-broking, certificación y seguimiento de brokers.

## Para cada módulo, entrega
1. **Qué tiene hoy el CRM** (ruta + `src/application/<modulo>/` si existe; una línea, verificada leyendo el código).
2. **Qué le falta para "fase pro"** (3–5 puntos concretos para una inmobiliaria de RD: diáspora, Confotur, USD).
3. **Candidatos open source** (1–3): repo, **licencia verificada en la API de GitHub**
   (`curl -s https://api.github.com/repos/<owner>/<repo>` → `license.spdx_id`; si no hay, `NONE`), fecha del último
   push, estrellas, stack, modo (RUN / APP / PORT / REFERENCE según ARQ-VRE-002) y puerto que usaría
   (`CrmPort`, `MensajeriaPort`, `AprendizajePort`…). Pistas a evaluar (verifica, no asumas): Evolution API, Chatwoot,
   Baileys, Telegram Bot API, Cal.com, Schedule-X, FullCalendar, ical-generator, Novu, Activepieces, n8n (ojo licencia),
   GoRules Zen, react-email, Papermark, Pannellum, libphonenumber-js, Meilisearch, Formbricks, GrowthBook, PostHog,
   Moodle, Frappe LMS, Twenty, OpenProperty, @react-pdf/renderer.
4. **Decisión sugerida**: construir / integrar / portar / referencia, prioridad P0–P3 y oleada (W1–W5).

## Salidas
- `.viltrum/vre-os/D21-cobertura-modulos.md`: tabla resumen (módulo · hoy · falta · candidato · licencia · modo ·
  prioridad) y una sección por módulo.
- `.viltrum/vre-os/oss-registry.json`: registro máquina-legible, un objeto por candidato:
  `{"id","repo","url","license_spdx","license_verified_at","last_push","stars","stack","mode","port","modules":[],
  "priority","wave","status":"CANDIDATE|PROTOTYPE|APPROVED|REJECTED|REFERENCE_ONLY","notes"}`.
  Prolink y Reality CRM van como `REFERENCE_ONLY` (sin licencia, verificado el 4-oct).

## Reglas
- Licencia sin verificar = `UNKNOWN`, nunca supuesta. Repo sin licencia = solo REFERENCE.
- AGPL/GPL solo como servicio aparte (RUN) detrás de un puerto; nunca código copiado al CRM.
- No modifiques nada fuera de los dos archivos de salida. No instales ni clones en el repo.

## Entregable
Los dos archivos anteriores, con una sección final `## Fuentes` (URL por afirmación).
