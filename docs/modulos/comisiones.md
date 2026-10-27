# Comisiones

## Propósito
Registro y control de la comisión interna de cada negocio ganado: montos, reparto entre broker y agencia, estado (pendiente, aprobada, pagada, anulada), exportación y, a futuro, reglas versionadas y liquidaciones con aprobación. Las liquidaciones y reglas de hoy son vistas previas de ejemplo.

Buenas prácticas de industria (preventa y proyectos, RD):
- Comisión por hito de cobro, no por firma: separación, firma del contrato y cada cuota cobrada. Así se evita pagar sobre dinero no recibido.
- Retención o devengo: la comisión queda pendiente hasta que el hito tiene evidencia (recibo, contrato firmado).
- Reversión (clawback) automática si el negocio se cancela o se reversa el pago.
- Aprobación en dos pasos: gerente propone y administración aprueba; pagos con comprobante en PDF.
- Montos en centavos y puntos básicos (450 = 4,5 %); nunca porcentajes en punto flotante.
- Moneda explícita (USD o DOP) con la tasa de cambio fechada al momento del hito.
- Retenciones fiscales de terceros según asesoría contable del cliente; confirmar antes de construir.

## Roles y permisos
Recursos RBAC: `commissions` (view, edit, export) y, para el modelo financiero, `commission_rules`, `commission_entries`, `payouts`.

| Rol (slug) | Acciones | Alcance | Efecto |
|---|---|---|---|
| Administrador (`admin`) | view, edit, export | all | Ve, aprueba, paga, anula y exporta |
| Asistente (`assistant`) | view | all | Solo consulta |
| Gerente (`manager`) | view | team | Comisiones de su equipo |
| Broker (`broker`) | view | own | Solo sus comisiones |

- Editar (`PATCH /api/comisiones/[id]`): exige `edit` y que el alcance llegue al broker del registro (`reaches`). Usa bloqueo de fila y auditoría en la misma transacción.
- Exportar CSV (`GET /api/comisiones/export`): exige `export`; hoy solo el administrador. Exporta lo que la tabla muestra, con los mismos filtros.
- Reglas y liquidaciones: solo visibles para quien tiene acceso a `commissions`; la aprobación final no está construida.

## Flujos principales
1. Ver el listado con KPI, filtro por estado, periodo (`closed_date`) y broker (solo con alcance total).
2. Ver el detalle de una comisión: negocio, monto de venta, base, reparto y estado.
3. Aprobar una comisión pendiente (`PATCH` con `status: approved`): registra quién aprobó y cuándo.
4. Marcar como pagada (`status: paid`): registra la fecha de pago.
5. Anular (`status: void`): la comisión deja de contar en KPI y reportes.
6. Exportar a CSV con los filtros activos.
7. Reglas por proyecto y versión: vista previa de ejemplo (`comisiones/reglas`). Hoy no hay motor de reglas.
8. Liquidaciones: vista previa de ejemplo (`comisiones/liquidaciones`). El detalle `[id]` muestra datos de ejemplo.

## Datos
Tabla `commissions` (modelo activo, una fila por negocio, `deal_id` único):
- `deal_id`, `broker_id`, `currency` (USD por defecto).
- `sale_amount_cents`, `commission_basis_points`, `total_commission_cents`.
- `broker_share_basis_points` y `agency_share_basis_points` (suman 10000; por defecto 5000/5000), `broker_amount_cents`, `agency_amount_cents`.
- `status`: pending, approved, paid, void. `closed_date`, `approved_by`, `approved_at`, `paid_at`.

Modelo financiero M40, en esquema pero sin UI operativa: `commission_rules`, `commission_rule_versions`, `commission_agreements`, `commission_splits`, `commission_entries` (esperada → devengada → aprobada → exigible → pagada → retirada), `commission_events`, `commission_adjustments`, `payout_batches`, `payout_lines`, `beneficiary_accounts`, `financial_approval_requests`, `fx_rates`.

Nota: la comisión es interna. La tabla excluye expresamente el reparto con agencias externas.

## Estados de UI
| Estado | Situación en código | Qué debe mostrar |
|---|---|---|
| Vacío | No verificado en `comisiones/vista.tsx` (`not-found.tsx` cubre solo el detalle inexistente) | "Sin comisiones con estos filtros" |
| Cargando | Sí: `comisiones/loading.tsx` | Esqueleto de KPI y tabla |
| Error | Sí: `comisiones/error.tsx` | Aviso con reintento |
| Sin permiso | Sí: `requireScopeInPage` y `can(commissions, view)` | Aviso de permiso; el broker ve solo las propias |
| Éxito | Parcial: cambio de estado sin verificar la respuesta visual | "Comisión aprobada" con fecha y responsable |
| Parcial | Sí en API: transacción con bloqueo; conflicto de estado devuelve error | "La comisión cambió; recarga antes de reintentar" |

## Estado actual vs PRD
Fuentes: código en `/tmp/qh-review` y `AUDITORIA-MODULOS.md` (27/10/2026, Comisiones: severidad Alta).

- **Existe y funciona:** listado con KPI y filtros; cambio de estado con bloqueo de fila y auditoría; `Idempotency-Key` en el PATCH (`conIdempotencia`); exportación CSV para administrador.
- **Discrepancia:** la auditoría dice que se ignora `Idempotency-Key`. El código actual lo aplica en `PATCH /api/comisiones/[id]`. Confirmar en el entorno desplegado.
- **Es demo:** liquidaciones y reglas (`_ejemplo.ts`, `PreviewDesk`). La ruta `/comisiones/liquidaciones/ejemplo` sirve datos falsos.
- **Falta:** reglas versionadas con aprobación real; liquidaciones con aprobación dual; clawback; comisión por hito de cobro; PDF de comprobante de pago.
- **PRD (compendio):** no define comisiones. El compendio excluye el CRM propietario completo del alcance inicial.

## Checklist de aceptación
- [x] Listado con KPI y filtro por estado
- [x] Aprobar, pagar o anular con bloqueo de fila
- [x] Exportar CSV solo para quien tiene export
- [x] Idempotency-Key aplicado en el PATCH
- [x] Broker ve solo sus comisiones
- [ ] Reglas versionadas con aprobación real
- [ ] Liquidaciones con aprobación dual
- [ ] Clawback al cancelar o reversar negocio
- [ ] Comisión por hito de cobro (cuotas)
- [ ] PDF de comprobante de pago
- [ ] Quitar datos de ejemplo de liquidaciones

## Dependencias
- **Negocios:** origen de cada comisión (`deal_id`); cierre que la genera.
- **Reservas y pagos (M40):** hitos de cobro y reversas; hoy no conectados a la vista de comisiones.
- **Metas y Brokers:** cumplimiento y cartera del broker.
- **Reportes:** KPI de comisiones.
- **Documentos:** comprobante de pago y evidencia del hito (pendiente; sin repositorio privado).
- **Auditoría y RBAC:** `audit_log`, `requireScope`, `reaches`.
- **Idempotencia HTTP:** `http_idempotency` para el PATCH.
