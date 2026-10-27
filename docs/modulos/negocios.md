# Negocios

## Propósito
Gestionar las oportunidades comerciales desde que un lead se convierte en negocio hasta que se cierra como ganado o perdido. Es el centro operativo del CRM: muestra el pipeline por etapa, el valor ponderado, la próxima acción obligatoria y el motivo de cada pérdida. Alimenta comisiones (atribución) y metas.

Código de referencia: `app/(crm)/negocios/` (`page.tsx`, `vista.tsx`, `tablero.tsx`, `lista.tsx`, `inspector.tsx`, `analisis.tsx`); API en `app/api/pipeline/` y `app/api/etapas/`; reglas en `application/pipeline/`.

## Roles y permisos
Recursos: `deals:view`, `deals:create`, `deals:edit`, `deals:export`. No hay `deals:delete` en ningún rol.

| Rol | Alcance | Puede |
|---|---|---|
| admin | all | Todo, incluido exportar y ver análisis |
| manager | team | Ver, crear y editar negocios de su equipo |
| assistant | all | Operar el ciclo completo; exportar; **no ve análisis de negocios ni montos en el resumen** (`puedeVerAnalisis`) |
| broker | own | Solo sus negocios; sin exportar |

- Página: `requireScopeInPage(actor, "deals", "view")`; sin permiso, 403.
- Cambio de etapa: `requireScope(actor, "deals", "edit")` en `PATCH /api/pipeline/[id]/etapa`.
- Montos internos de unidades: solo con `unit_real_price`.
- Ver como: admin y manager pueden simular la vista de un broker en solo lectura.

## Flujos principales
1. **Crear negocio.** Solo desde un lead: `POST /api/leads/[id]/convertir` crea el negocio en la etapa "Nuevo" y vincula `lead_id`. No hay alta libre de negocio.
2. **Ver pipeline.** Tablero (columnas por etapa) o lista, con filtros de `filtros.tsx` y vistas guardadas (`vistas-guardadas.ts`).
3. **Mover de etapa.** Arrastrar una tarjeta o cambiarla en la ficha. El servidor valida: "Contactado" exige una actividad de contacto (409 si no existe, según la auditoría); "Perdido" exige motivo y comentario.
4. **Registrar próxima acción.** El modelo prevé una actividad abierta como próxima acción obligatoria (`next_activity_id`); verificar en la UI que se exige antes de avanzar.
5. **Editar valores.** Monto y moneda, comisión en puntos básicos (450 = 4,5 %), probabilidad 0–100, fecha de cierre esperada (`/api/pipeline/[id]`).
6. **Asociar unidades.** Las rutas `/api/pipeline/[id]/propiedades` vinculan una o varias unidades de interés antes de preseleccionar.
7. **Perder.** Mover a "Perdido" pide motivo de catálogo (`loss_reasons`) y comentario obligatorio (restricción en base).
8. **Ganar.** Mover a "Cierre" congela la versión de la regla de atribución (`attribution_rule_version`) y genera los datos para comisiones.
9. **Analizar.** Valor ponderado, conteo y antigüedad por etapa (`analisis.tsx`, `logica.ts`). Asistente no accede.
10. **Propuesta, descuento y acciones masivas.** Hoy son vistas previas (ver Estado actual).

## Datos
Tabla `deals` (campos clave):
- Relaciones: `contact_id`, `lead_id`, `stage_id`, `source_id`, `broker_id`, `attributed_project_id`, `attributed_team_id`, `loss_reason_id`.
- Negocio: `title`, `operation_type` (sale/rent), `currency`, `amount_cents` (≥ 0), `probability` (0–100), `commission_basis_points`, `expected_close_date`, `notes`.
- Estado: `next_activity_id` (sin FK por ciclo), `stage_changed_at`, `closed_at`, `loss_comment`, `attribution_rule_version`.
- Auditoría: timestamps, `created_by`, `updated_by`, `deleted_at`.

Tablas relacionadas: `deal_properties` (varias unidades por negocio), `deal_stage_history`, `pipeline_stages`, `loss_reasons`, `unit_sales`, `activities`.

Etapas (seed): Nuevo 10 % · Contactado 25 % · Presentación 40 % · Preselección 60 % · Negociación 80 % · Cierre (ganado) 100 % · Perdido (salida lateral, 0 %).

Restricciones: `loss_comment` obligatorio si hay `loss_reason_id`; monto y probabilidad dentro de rango.

## Estados de UI (D06)
- **Vacío:** tablero sin tarjetas: "Sin negocios en esta etapa" con acción para cambiar filtros; lista sin resultados con "Limpiar filtros".
- **Cargando:** `loading.tsx` con columnas esqueleto.
- **Error:** `error.tsx`; si falla el movimiento de etapa, la tarjeta vuelve a su columna y se muestra el motivo.
- **Sin permiso:** 403 de página; el análisis no aparece para asistente.
- **Éxito:** la tarjeta cambia de columna y se recalculan los totales de la columna.
- **Parcial:** asistente ve negocios pero sin montos en el resumen; si falla el análisis, el tablero sigue visible.
- **No encontrado:** `not-found.tsx` para `?negocio=` inexistente.

## Estado actual vs PRD
**Existe (código real):**
- Tablero, lista, filtros e inspector.
- Transiciones de etapa validadas en servidor (regla R1) con historial.
- Motivo y comentario de pérdida obligatorios.
- Análisis de valor ponderado y antigüedad, con pruebas (`logica.test.ts`, `tablero.test.ts`).
- Negocio creado al convertir un lead.

**Demo o faltante:**
- `comercial-preview.tsx` y `_ejemplo.ts`: propuestas, versiones, enlaces públicos y descuentos de ejemplo.
- `acciones-masivas.tsx`: "Vista previa sin mutaciones"; falta endpoint transaccional por lotes.
- Aprobaciones de descuento: la lógica por niveles (agente, gerente, director, comité) existe en `negociacion.ts`, pero la bandeja de aprobaciones es de ejemplo.
- No se puede borrar ni archivar un negocio por API (auditoría).
- Reapertura de negocios cerrados: sin flujo.

**PRD:** el compendio no especifica el negocio como módulo; lo sitúa en la Fase 4 (CRM ligero) y lo deja fuera del alcance inicial (PRD §4). Las "buenas prácticas" aplicadas en este módulo son: etapas con probabilidad por defecto, próxima acción obligatoria, motivo de pérdida estructurado y precios en centavos.

## Checklist de aceptación
- [x] Tablero y lista con seis etapas abiertas
- [x] Cambio de etapa validado en servidor
- [x] Pérdida exige motivo y comentario
- [x] Historial de cambios de etapa
- [x] Análisis de valor ponderado y antigüedad
- [x] Negocio creado al convertir un lead
- [ ] Plantillas de propuesta en PDF
- [ ] Bandeja real de aprobación de descuentos
- [ ] Acciones masivas transaccionales con auditoría
- [ ] Archivar o eliminar negocio desde API o UI
- [ ] Reabrir negocio cerrado con motivo

## Dependencias
- **Leads:** origen del negocio y conversión.
- **Contactos:** cliente del negocio.
- **Agenda (actividades):** próxima acción y validación de "Contactado".
- **Propiedades y Reservas:** unidades de interés; la reserva confirma la venta (`unit_sales`).
- **Comisiones:** atribución congelada al cierre, reglas y liquidaciones.
- **Aprobaciones:** descuentos por nivel (pendiente de bandeja real).
- **Metas:** cumplimiento por equipo y broker.
- **Reportes e Inicio:** embudo y cifras.
- **Comunicaciones:** envío de propuestas por correo o WhatsApp.
- **Configuración:** nombres y probabilidades de etapas, motivos de pérdida y roles.
