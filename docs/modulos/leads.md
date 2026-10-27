# Leads

## Propósito
Recibir, calificar, asignar y convertir prospectos antes de que sean negocio. Un lead nace de un contacto y de un origen (portal, YouTube, WhatsApp, campaña, alta manual). Su objetivo es que ningún interesado se pierda, que llegue al broker adecuado y que se mida el tiempo hasta el primer contacto.

Código de referencia: `app/(crm)/leads/` (`page.tsx`, `vista.tsx`, `inspector.tsx`, `nota-de-voz-modal.tsx`); API en `app/api/leads/`; casos de uso en `application/leads/`.

## Roles y permisos
Recursos: `leads:view`, `leads:create`, `leads:edit`, `leads:import`, `leads:export`.

| Rol | Alcance | Puede |
|---|---|---|
| admin | all | Ver, crear, editar, reasignar, exportar. Sin "Tomar" |
| manager | team (`leads:view/create/edit` = team) | Ver y reasignar dentro de su equipo. Sin "Tomar" |
| assistant | all (sin `delete`) | Ver, crear, editar, importar, exportar. Sin "Tomar" |
| broker | own | Ver y editar lo suyo; "Tomar" de la cola (solo rol broker) |

- Lectura de la lista: `visibleRows(actor, scope, leads.brokerId)`. El broker ve sus leads y, con `?cola=1`, los disponibles (sin broker, estado `new` o `assigned`).
- Reasignar requiere `leads:edit` con alcance que cubra el lead (`asignarResponsableDeLead`).
- Un supervisor solo reasigna dentro de su equipo (`manager_scopes`).
- Webhook `POST /api/leads/externo`: sin sesión; autenticado por la cabecera `x-webhook-token` (comparación en tiempo constante). No tiene límite de tasa ni de tamaño (auditoría).

## Flujos principales
1. **Alta manual.** El asesor escribe nombre, teléfono y correo. Si ya existe un contacto con el mismo teléfono (E.164) o correo, el sistema responde 409 con candidatos. El asesor elige reutilizar el contacto; solo con `crear_igual: true` se crea de todos modos.
2. **Captura externa.** El webhook recibe el lead con `externalId`, UTM, campaña y mensaje original. Si el `externalId` ya existe (índice único parcial), la petición es idempotente y devuelve el lead existente.
3. **Sugerencia de broker.** La regla de especialidad propone `suggestedBrokerId` por zona o proyecto. Aún no es asignación: el coordinador la acepta o la cambia.
4. **Asignación.** `PATCH /api/leads/[id]` con `brokerId` y motivo opcional. Sin `brokerId` responde 400 "Elige un broker." (corregido en código; la auditoría lo reportó abierto).
5. **Tomar de la cola.** Un broker toma un lead disponible; el sistema verifica que siga sin responsable (`/tomar`). Buena práctica de preventa: el registro del prospecto con vigencia de protección (quién lo presentó primero) evita que dos brokers disputen la misma oportunidad; hoy no existe esa protección.
6. **Primer contacto.** El primer registro de actividad de contacto fija `firstContactedAt`; ese dato alimenta el SLA.
7. **Calificación.** `/calificacion` guarda presupuesto mín./máx. (en centavos, moneda, mín. ≤ máx.), zona, horizonte de entrega, tipo de operación y proyecto de interés.
8. **Descarte.** `/descartar` cambia el estado a `discarded`; el motivo es obligatorio y se valida antes de tocar la base.
9. **Conversión.** `/convertir` crea un negocio en la etapa "Nuevo", marca el lead `converted` y guarda `convertedDealId`.
10. **Nota de voz.** El audio se transcribe y propone un lead. Hoy fuerza `crear_igual` y no revisa duplicados (pendiente).

## Datos
Tabla `leads` (campos clave):
- Identidad: `contact_id` (FK a `contacts`), `external_id` (único entre no borrados).
- Origen: `source_id` (`lead_sources`), `campaign_id`, `campaign`, `utm_source`, `utm_medium`, `utm_campaign`, `source_video_url`, `original_message`.
- Interés: `project_id`, `project_interest_text`, `zone_interest`, `zone_interest_id`, `operation_type` (sale/rent), `currency`, `budget_min_cents`, `budget_max_cents`, `bedrooms`, `delivery_horizon_months`, `payment_method_id`, `confotur_interest`.
- Gestión: `status` (`new`, `assigned`, `contacted`, `converted`, `discarded`), `broker_id`, `suggested_broker_id`, `received_at`, `first_contacted_at`, `discard_reason`, `converted_deal_id` (sin FK a propósito).
- Auditoría: `created_by`, `updated_by`, timestamps, `deleted_at`.

Restricciones: presupuesto mínimo ≤ máximo; horizonte ≥ 0. Tablas relacionadas: `contacts`, `lead_sources`, `projects`, `zones`, `users`, `marketing_campaigns`, `payment_methods`, `audit_log`.

## Estados de UI (D06)
- **Vacío:** "Sin leads con estos filtros" con botón para limpiar filtros; en la cola, "No hay leads disponibles para tomar".
- **Cargando:** `loading.tsx` con filas esqueleto; búsqueda con `aria-busy`.
- **Error:** `error.tsx` con reintento; la búsqueda conserva el texto escrito.
- **Sin permiso:** 403 de página (`requireScopeInPage(actor, "leads", "view")`); el botón "Tomar" solo aparece al rol broker.
- **Éxito:** toast con el nuevo estado y el responsable; la fila se actualiza sin recargar la página.
- **Parcial:** si hay leads pero no hay permiso de exportar, el botón de exportar se oculta; si falla la carga de catálogos (orígenes, proyectos), la lista sigue y los filtros muestran "No disponible".

## Estado actual vs PRD
**Existe y funciona (código real):**
- Lista paginada (20 por página) con búsqueda, origen, estado y ficha en `?lead=`.
- Alta manual con detección de duplicados (409).
- Webhook externo idempotente por `externalId`.
- Tomar de la cola (solo broker), descartar, calificar y convertir a negocio.
- Asignación de broker con validación corregida.

**Demo o faltante:**
- `asignacion/`: reglas de asignación en vista previa; sin motor persistente, cursor round-robin ni horario.
- `duplicados/`: usa `_ejemplo.ts`; no hay índice ni fusión transaccional.
- `importaciones/`: vista previa con `IMPORT_EXAMPLE`; no hay ruta de importación en `app/api`.
- `_componentes/sla-preview`: política de SLA de ejemplo; el tiempo a primer contacto no se mide en pantalla.
- Nota de voz: fuerza `crear_igual` y el presupuesto mínimo se iguala al máximo (auditoría).

**PRD:**
- RF-12 (captura de leads con trazabilidad mínima de origen e interés) está cubierto por el modelo.
- La entidad Lead del PRD (§6: origen, proyecto, zona, contacto, estado, notas) está cubierta, salvo "notas" (hoy solo `original_message` y `discard_reason`).
- El compendio sitúa el CRM propio en la Fase 4 y lo deja fuera del alcance inicial (PRD §4). Este módulo es, por tanto, una extensión ya construida.

## Checklist de aceptación
- [x] Alta manual con detección de duplicados (409)
- [x] Webhook externo idempotente por externalId
- [x] Lista con búsqueda, origen, estado y paginación
- [x] Broker toma leads de la cola (solo rol broker)
- [x] Conversión de lead a negocio
- [x] PATCH de asignación sin brokerId responde 400 claro
- [ ] Importación CSV con validación y reporte
- [ ] Deduplicación y fusión transaccional
- [ ] Asignación por reglas (zona, turno, carga)
- [ ] SLA de primer contacto medido en pantalla
- [ ] Nota de voz sin forzar crear_igual

## Dependencias
- **Contactos:** identidad, teléfono y correo; consentimiento (ver Contactos).
- **Negocios:** la conversión crea el negocio y usa las etapas del pipeline.
- **Agenda (actividades):** la actividad de contacto fija el primer contacto.
- **Brokers y Configuración:** candidatos de asignación, especialidad y capacidad.
- **Propiedades y zonas:** proyecto de interés y zona.
- **Integraciones:** WhatsApp (YCloud), portal, YouTube y webhook externo.
- **Comunicaciones:** plantillas de primer mensaje.
- **Reportes:** embudo por fuente y costo por lead.
- **Automatizaciones (pendiente):** reglas como "lead sin actividad en 24 h".
- **Auditoría y outbox:** cada cambio de responsable o estado queda registrado.
