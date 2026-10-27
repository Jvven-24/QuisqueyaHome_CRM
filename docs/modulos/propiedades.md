# Propiedades

## Propósito
Inventario de proyectos (sobre planos y terminados) y de sus unidades: disponibilidad en tiempo real, precios públicos y confidenciales, avance de obra y fichas para el cliente. Es la base de la oferta que se presenta en leads, negocios y el portal público. Su regla central: el precio real interno nunca sale del servidor hacia quien no tenga `unit_real_price`.

Código de referencia: `app/(crm)/propiedades/` (`page.tsx`, `vista.tsx`, `[slug]/`, `_formulario-proyecto.tsx`, `_componentes/`, `presentacion.ts`, `holds-read-model.ts`); API en `app/api/proyectos/` (incluye fases y fotos de obra) y `app/api/brokers/[id]/proyectos`.

## Roles y permisos
Recursos: `projects:view|create|edit`, `units:view|create|edit`, `unit_real_price`, `construction_phases:view|edit`.

| Rol | Proyectos | Unidades | Precio real | Avance de obra |
|---|---|---|---|---|
| admin | all | all | sí | all |
| manager | team (0017) | team (create/edit) | no | no (sin fila) |
| assistant | all (create/edit) | all (create/edit) | no | view + edit |
| broker | own (solo los asignados) | own | no; ve el rango público | view own |

- Página: `requireScopeInPage(actor, "projects", "view")`; sin permiso, `forbidden.tsx`.
- Precio real: `stripRestrictedPrices` lo pone a `null` en el servidor antes de enviar el payload; la vista solo lo pinta si llega. Un broker nunca recibe `internal_price_cents` ni `real_price_cents`.
- Consulta de disponibilidad: `COUNT(*) FILTER (WHERE status = 'available')` agrupado por proyecto; respeta `visibleRows(actor, scope, projects.broker_id)`.
- Decisión pendiente: si un broker con `own` debe ver todo el inventario publicable o solo sus proyectos asignados. Hoy aplica lo segundo.

## Flujos principales
1. **Ver inventario.** Rejilla de proyectos con zona, tipo, estado, avance (`progress_percent`) y disponibilidad ("12/40"). Filtros por zona, tipo y estado en la URL.
2. **Abrir ficha.** `/propiedades/[slug]` muestra datos, galería y video, unidades, fases y el dossier (`project-dossier.tsx`). Un slug inexistente responde 404.
3. **Crear proyecto.** Formulario con nombre, slug único (entre no borrados), zona, tipo, operación, desarrollador, fechas de inicio y entrega, moneda y rango público. El precio interno solo lo rellena el admin.
4. **Editar proyecto.** `PATCH /api/proyectos/[id]`, incluido `isPublished` (publicar al portal). Requiere `projects:edit`.
5. **Agregar unidades.** `POST /api/proyectos/[id]/unidades` con código único dentro del proyecto, tipo, habitaciones, baños, áreas, torre, nivel, estado, operación (venta o alquiler) y periodo de precio (único o mensual).
6. **Cambiar estado de unidad.** Disponible, apartada (hold), reservada o vendida. El modelo incluye `row_version` para detectar cambios concurrentes; verificar que la API lo exige antes de escribir.
7. **Registrar avance de obra.** Buena práctica de preventa en RD: el comprador de planos compra con fe en el avance, así que cada fase debe llevar fecha, porcentaje y evidencia fotográfica verificable. Fases numeradas por proyecto, con porcentaje, hito, resumen y fotos (`/api/proyectos/[id]/fases` y `fotos`). El porcentaje del proyecto se deriva de las fases.
8. **Exportar inventario público.** CSV con BOM desde la matriz de pisos (`publicInventoryCsv`), con rango público, nunca el precio real.
9. **Vincular a negocio.** Desde Negocios se asocian unidades de interés; las reservas y holds se gestionan en el módulo Reservas.

## Datos
Tabla `projects`:
- Identidad: `name`, `slug` (único entre no borrados), `zone`, `zone_id`, `project_type`, `operation_type`, `developer`, `description`, `video_url`.
- Fechas y avance: `start_date`, `estimated_delivery_date`, `progress_percent` (0–100, derivado).
- Precio: `currency`, `internal_price_cents` (restringido), `public_range_min_cents`, `public_range_max_cents`.
- Control: `broker_id`, `is_published`, `is_active`, `deleted_at`, timestamps, autoría.

Tabla `units`:
- Identidad: `project_id`, `code` (único por proyecto entre no borrados), `unit_type`, `tower`, `floor_level`, `bedrooms`, `bathrooms` (real), `built_area_m2`, `yard_area_m2`.
- Comercial: `inventory_state_id`, `status` (disponible, apartada, reservada, vendida), `operation_type`, `price_period` (one_time/monthly), `currency`, `real_price_cents` (restringido), `public_range_*`, `broker_id`, `internal_notes` (solo interno).
- Concurrencia: `row_version` (> 0).

Tablas `construction_phases` (número parametrizable por proyecto) y `files` (fotos). Relacionadas: `zones`, `unit_inventory_states`, `holds`, `reservations`, `unit_sales`, `deals`.

## Estados de UI (D06)
- **Vacío:** "Aún no hay proyectos" con acción "Crear proyecto" (solo si `projects:create`); con filtros sin resultados, "Limpiar filtros".
- **Cargando:** `loading.tsx` con tarjetas esqueleto.
- **Error:** `error.tsx` y `_estado-conexion.tsx` (aviso sin borrar lo mostrado).
- **Sin permiso:** `forbidden.tsx` (403) si falta `projects:view`; el precio real no aparece (la vista muestra "Precio interno: reservado a administración").
- **Éxito:** ficha actualizada y toast. Pendiente: aviso de conflicto con recarga cuando `row_version` no coincide.
- **Parcial:** para el broker, rango público sin precio interno; si fallan las fotos, la ficha sigue sin galería y lo indica.

## Estado actual vs PRD
**Existe (código real):**
- Rejilla y ficha con disponibilidad calculada por consulta, no por campo.
- Filtros por zona, tipo y estado.
- Doble esquema de precios con filtro en servidor (`stripRestrictedPrices`, con prueba).
- Alta y edición de proyecto y unidad; código único por proyecto; control de concurrencia.
- Fases de obra con fotos.
- Exportación CSV del inventario público.

**Demo o faltante:**
- Partes del workspace y del dossier son de ejemplo (`_ejemplo.ts`, `preview-workspace.tsx`).
- No hay filtro por rango de precio.
- No hay mapa de proyectos por zona (PRD RF-06).
- Ficha PDF para el cliente: no existe.
- Disponibilidad en vivo en el portal público: sin conectar (el portal está en vista previa).
- Galería, amenidades y FAQs del PRD (§6): verificar cobertura completa en el formulario.

**PRD:** RF-02 (filtros por zona, tipo, precio, estado y atributos) está cubierto salvo precio; RF-03 (detalle con galería, amenidades, precio base, metros, ubicación, CTA) cubierto parcialmente; RF-05 (avance de obra con hitos y porcentaje) cubierto con fases; RF-06 (mapa) falta; RF-08 (CMS para crear, editar, publicar y archivar) cubierto salvo archivar desde UI (`is_active` existe). El compendio ubica la web pública en la Fase 1 y el CMS y el cronograma de obra en la Fase 2.

## Checklist de aceptación
- [x] Rejilla con disponibilidad calculada por proyecto
- [x] Filtros por zona, tipo y estado
- [x] Precio real oculto a quien no tenga unit_real_price
- [x] Alta y edición de proyecto y unidad
- [x] Código de unidad único por proyecto
- [x] Fases de obra con porcentaje y fotos
- [x] Exportación CSV del inventario público
- [ ] Filtro por rango de precio
- [ ] Mapa de proyectos por zona
- [ ] Ficha PDF para el cliente
- [ ] Archivar proyecto desde la interfaz
- [ ] Disponibilidad en vivo en el portal público

## Dependencias
- **Leads:** proyecto e intereses de presupuesto.
- **Negocios:** unidades de interés y atribución de proyecto.
- **Reservas (holds, reservas, planes de pago):** cambian el estado de las unidades; el inventario se bloquea por `inventory_commitments`.
- **Brokers:** proyectos asignados y protección de cliente.
- **Avances y fotos (tabla `files`):** fotos de obra; el PRD prevé almacenamiento en Supabase Storage.
- **Portal público y SEO:** publicación (`is_published`) y disponibilidad en vivo.
- **Comisiones:** `unit_sales` y reglas por proyecto.
- **Configuración:** precios internos, roles y permisos `unit_real_price`.
- **Compendio (PRD):** catálogo, filtros, CMS y cronograma de obra (Fases 1 y 2).
