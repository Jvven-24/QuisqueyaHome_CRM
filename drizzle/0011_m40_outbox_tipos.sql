-- M40 b1f / TX-44. Generated with drizzle-kit/api from schema.ts.
-- Apply with the official migrator: DROP + ADD run in the same transaction.
-- Expansion only; preserves historical events, RLS and consumer filtering.
-- Rollback to the three historical types requires an exclusive table lock
-- and NO financial rows. Never delete financial history to roll back.
SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
SET LOCAL statement_timeout = '60s';
--> statement-breakpoint
ALTER TABLE "outbox" DROP CONSTRAINT "outbox_type_check";
--> statement-breakpoint
ALTER TABLE "outbox" ADD CONSTRAINT "outbox_type_check" CHECK ("outbox"."event_type" in ('LeadCreado','NegocioCambioEtapa','ActividadRegistrada','UnidadDisponibilidadCambiada','HoldCreado','HoldExtendido','HoldCancelado','HoldExpirado','HoldConvertido','ReservaCreada','ReservaEnVerificacion','ReservaConfirmada','ReservaExpirada','ReservaUnidadCambiada','CancelacionSolicitada','ReservaCancelada','PlanAcordado','PlanReestructurado','PlanCompletado','PlanReabierto','PagoPresentado','PagoConfirmado','PagoRechazado','PagoAplicado','PagoReversado','ContracargoRegistrado','ExtractoImportado','ConciliacionResuelta','ReembolsoSolicitado','ReembolsoAprobado','ReembolsoInstruido','ReembolsoConfirmado','ReglaComisionVersionada','ComisionProyectada','ComisionDevengada','ComisionAprobada','ComisionExigible','ComisionAjustada','ComisionPagada','LiquidacionAprobada','LiquidacionInstruida','LiquidacionConciliada'));
