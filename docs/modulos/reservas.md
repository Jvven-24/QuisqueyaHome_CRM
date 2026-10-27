# Reservas

## Propósito
Proteger la disponibilidad de una unidad durante la negociación (hold), convertir esa protección en una reserva con partes, unidades, precio y condiciones versionadas, y registrar la confirmación con evidencia. El cobro (plan de pagos, conciliación, facturación) depende de esta base y hoy es vista previa.

Buenas prácticas de referencia (preventa y proyectos en RD):
- Un hold tiene vigencia corta, motivo obligatorio y prórrogas limitadas y auditadas; al vencer libera la unidad sin intervención manual.
- Una reserva no confirma la venta hasta tener depósito o evidencia de pago verificada.
- Cada reserva guarda un snapshot de condiciones (versión, documento y hash) para no cambiar términos después de firmar.
- Titular y representante deben estar identificados; un representante exige evidencia de representación.
- Cambio de unidad conserva el compromiso original y libera el anterior con motivo; nunca deja dos compromisos sobre la misma unidad.
- Los montos se guardan en centavos y en la moneda pactada (USD o DOP), sin conversión implícita.

## Roles y permisos
Recursos RBAC: `holds` y `reservations` (view, create, edit, delete). Todas las rutas exigen además `deals:view` en el layout.

| Rol | `holds` | `reservations` | Alcance |
|---|---|---|---|
| Administrador | view, create, edit, delete: `all` (0014) | view, create, edit, delete: `all` (0014) | Toda la cartera |
| Asistente | view, create, edit: `all` (0014) | view, create, edit: `all` (0014) | Toda la cartera; sin borrar |
| Broker | view, create, edit: `own` (0014) | view, create: `own` (0014) | Solo sus negocios; no edita reservas |
| Gerente | sin concesión | view: `team` (0017) | Solo lectura de su equipo |

- Alcance `own` y `team` se aplican en SQL (`visibleRows`) y en los route handlers con `requireScope`.
- Extender y liberar un hold requieren `holds:edit`; en la UI solo aparecen si el hold está activo.
- Propuesta: confirmar y cambiar unidad con un permiso propio (no `reservations:edit`), y que el gerente pueda crear holds de su equipo.
- Migración `0014_m40_permisos_reservas_holds.sql` existe en el repositorio. La auditoría del 27/10/2026 dice que la base no tenía esas filas; verificar si está aplicada.

## Flujos principales
1. **Solicitar hold.** `POST /api/holds` (`holds:create`). Entradas: negocio abierto, unidades, motivo y vigencia. El servidor fija `policy_version` y `expires_at`. La UI es "Solicitar hold".
2. **Extender hold.** `POST /api/holds/[id]/extensiones` (`holds:edit`). Motivo obligatorio; incrementa `extension_count` y exige la versión actual (`expectedVersion`).
3. **Liberar o cancelar hold.** `POST /api/holds/[id]/cancelacion` (`holds:edit`). Estado final `cancelado`; no se puede deshacer.
4. **Convertir hold en reserva.** `POST /api/reservas` (`reservations:create`). Entradas: partes (titular o representante con evidencia), unidades con precio y moneda, depósito requerido (≤ total), versión de condiciones, documento y hash, vigencia y motivo.
5. **Confirmar reserva.** `POST /api/reservas/[id]/confirmacion`. Exige evidencia (archivo) y registra quién confirmó y cuándo.
6. **Cambiar unidad.** `POST /api/reservas/[id]/cambio-unidad`. Libera el componente original con motivo y crea el nuevo compromiso.
7. **Cancelar reserva.** `POST /api/reservas/[id]/cancelaciones`. Pasa por `cancelacion_solicitada` antes de `cancelada`.
8. **Consultar y filtrar.** /reservas y /reservas/holds listan por estado, moneda, búsqueda y vencimiento; paginan de 15 en 15. El expediente abre en /reservas/[publicId].
9. **Plan de pagos, cartera, conciliación, excepciones, facturación y documentos.** Solo vista previa (ver Estado actual).

## Datos
Tablas existentes (esquema Drizzle, con RLS habilitado):
- `holds`: `public_id`, `deal_id`, `holder_id`, `status` (activo, convertido, cancelado, expirado), `expires_at`, `policy_version`, `extension_count`, `reason`, `resolved_at`, `row_version`. Restricciones: vigencia posterior a creación; estado activo sin fecha de resolución.
- `hold_units`: unidad, proyecto, `price_version`, `price_cents`, moneda (USD o DOP), `component_role`. Único por hold y unidad.
- `reservations`: `public_id`, `deal_id`, `hold_id` (único si existe), `status` (borrador, pendiente_pago, en_verificacion, confirmada, expirada, cancelacion_solicitada, cancelada), `currency`, `total_cents`, `adjustment_cents`, `deposit_required_cents`, `conditions_version`, `conditions_document_id`, `conditions_hash`, `confirmation_evidence_id`, `confirmed_by`, `confirmed_at`, `expires_at`, `reason`.
- `reservation_parties`: contacto, rol (titular o representante), `representation_evidence_id`.
- `reservation_units`: unidad, precio, moneda, `released_at`, `release_reason`.
- `inventory_commitments`: compromiso sobre la unidad (evita doble venta).
- Existen en esquema, sin UI real: `payment_plan_templates`, `payment_plans`, `payment_plan_versions`, `payment_installments`, `payments`, `payment_events`, `payment_allocations`, `payment_reversals`, `fx_rates`.
- Soporte: `http_idempotency`, `transaction_commands`, `outbox`.

## Estados de UI (D06)
Implementados en `Operations` (listado con API real):
- **Cargando:** componente `Loading` mientras se consulta `/api/holds` o `/api/reservas`.
- **Vacío:** "Aún no hay holds/reservas" o "No hay coincidencias" con "Limpiar filtros".
- **Error:** alerta con "Reintentar"; conserva los últimos datos recibidos.
- **Sin permiso:** si la API responde 401 o 403, muestra "Sin permiso para consultar este listado".
- **Éxito:** "Operación confirmada y guardada por el servidor" tras guardar; métricas y tabla.
- **Parcial:** contador de vigencia "Plazo cumplido · pendiente de actualizar" cuando vence y el listado aún no se refresca; sin conexión se reintenta al volver `online`.

Pendiente: estados D06 en las vistas previas (cartera, plan, conciliación, excepciones, facturación y documentos).

## Estado actual vs PRD
El compendio (`ref/compendio.txt`) no tiene PRD para Reservas. El alcance inicial lo excluye ("CRM propietario completo", "ERP"). La Fase 4 solo menciona "CRM propio ligero o integraciones" y BI.

Qué existe y funciona (código real):
- Holds: crear, extender, liberar o cancelar, con versión de fila y restricciones en base.
- Reservas: crear con idempotencia por clave, confirmar con evidencia, cambiar unidad y cancelar.
- Listado y expediente reales con filtros, orden por vencimiento y contador de vigencia.
- Validación de entrada con Zod y errores HTTP por tipo.

Qué bloquea o falta:
- **Crítico (auditoría 27/10/2026):** el administrador ve "Sin permiso" porque la base no tenía `holds` ni `reservations` en `permissions`. Sembrar la migración 0014 y probar hold → reserva de punta a punta.
- Idempotencia: si el cliente no envía `Idempotency-Key`, el servidor genera un UUID nuevo y no deduplica. Verificar que el formulario envía la clave.
- Plan de pagos, cartera, conciliación, excepciones, facturación y documentos son vistas previas con datos de ejemplo. `reservas/[id]/plan` muestra una muestra que no corresponde a la reserva.
- Código sin uso: `_lectura.ts` (`leerReservas`, `leerHolds`) y `reservas/vista.tsx`. `_lectura.ts` devuelve filas de ejemplo cuando no hay permiso; conviene eliminarlo antes de producción.
- Facturación fiscal (comprobantes e-CF de la DGII) no existe.

## Checklist de aceptación
- [x] Holds con vigencia, prórroga y liberación
- [x] Reserva con partes, unidades y depósito validados
- [x] Confirmación exige evidencia y registra responsable
- [x] Cambio de unidad conserva el compromiso original
- [x] Control de concurrencia por versión de fila
- [x] Acepta Idempotency-Key en altas
- [ ] Permisos holds y reservations sembrados en la base
- [ ] Plan de pagos y cuotas con datos reales
- [ ] Conciliación de pagos contra extractos bancarios
- [ ] Facturación fiscal e-CF por reserva cobrada

## Dependencias
- **Negocios (pipeline):** solo negocios abiertos pueden tener hold o reserva; `dealOptions` alimenta el formulario.
- **Propiedades (inventario):** precio de la unidad, compromisos y disponibilidad.
- **Contactos:** titular y representante.
- **Documentos y archivos:** documento de condiciones y evidencias de confirmación y representación.
- **Aprobaciones:** prórrogas o descuentos que requieran decisión (hoy de ejemplo).
- **Comisiones:** comisiones ligadas al negocio de la reserva.
- **Reportes:** totales pactados por moneda.
- **RBAC y configuración:** `holds`, `reservations`, `deals`.
- **Auditoría y outbox:** cambios de estado y eventos.
- **Integraciones:** ninguna en producción; futuro: conciliación bancaria y pasarela de pago (por definir).
