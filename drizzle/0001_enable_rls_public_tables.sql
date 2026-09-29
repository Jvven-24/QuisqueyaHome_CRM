-- Habilita Row Level Security en las 29 tablas de `public`, sin políticas.
--
-- Supabase marcó las 29 como "Table publicly accessible" (rls_disabled_in_public):
-- sin RLS, cualquiera con la URL del proyecto y la anon key (pública por diseño,
-- viaja al navegador) puede leer/editar/borrar todo por PostgREST, saltándose
-- el RBAC del servidor.
--
-- RLS sin políticas = deny-by-default para los roles `anon`/`authenticated` de
-- PostgREST. No rompe la app: toda la lógica de negocio pasa por Drizzle con
-- `DATABASE_URL` (rol `postgres` vía el session pooler), que ignora RLS. El
-- único uso de la anon key es auth (`src/infrastructure/auth/supabase.ts`),
-- que no toca estas tablas.
ALTER TABLE "academy_checklist_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "academy_checklist_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "academy_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "academy_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activity_sync" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_log" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "broker_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "commissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "construction_phases" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deal_properties" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deal_stage_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "files" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "integration_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_sources" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "leads" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "loss_reasons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "message_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "permissions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "pipeline_stages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "projects" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "units" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
