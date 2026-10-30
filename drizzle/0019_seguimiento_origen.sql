-- Seguimiento de origen por video/anuncio: enlaces cortos, clics y atribución first/last touch.
-- NO aplicar en producción sin pg_dump previo y OK de Wilber. Reejecutable.
CREATE TABLE IF NOT EXISTS "tracking_links" (
  "id" serial PRIMARY KEY NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "destination" text NOT NULL,
  "portal_path" text,
  "whatsapp_phone" text,
  "whatsapp_text" text,
  "video_url" text,
  "video_title" text,
  "campaign" text,
  "utm_source" text DEFAULT 'facebook' NOT NULL,
  "utm_medium" text DEFAULT 'video' NOT NULL,
  "utm_campaign" text,
  "utm_content" text,
  "utm_term" text,
  "ad_id" text,
  "creative_id" text,
  "ad_name" text,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_by" integer REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "tracking_links_destination_check" CHECK ("destination" IN ('portal','whatsapp')),
  CONSTRAINT "tracking_links_whatsapp_check" CHECK ("destination" <> 'whatsapp' OR "whatsapp_phone" IS NOT NULL)
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "tracking_links_code_unq" ON "tracking_links" ("code");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tracking_links_ad_idx" ON "tracking_links" ("ad_id");--> statement-breakpoint
ALTER TABLE "tracking_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tracking_clicks" (
  "id" serial PRIMARY KEY NOT NULL,
  "link_id" integer NOT NULL REFERENCES "tracking_links"("id") ON DELETE CASCADE,
  "visitor_id" text NOT NULL,
  "clicked_at" timestamp with time zone DEFAULT now() NOT NULL,
  "referrer" text,
  "user_agent" text,
  "is_bot" boolean DEFAULT false NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tracking_clicks_link_idx" ON "tracking_clicks" ("link_id","clicked_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tracking_clicks_visitor_idx" ON "tracking_clicks" ("visitor_id","clicked_at");--> statement-breakpoint
ALTER TABLE "tracking_clicks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_attributions" (
  "id" serial PRIMARY KEY NOT NULL,
  "lead_id" integer NOT NULL REFERENCES "leads"("id") ON DELETE CASCADE,
  "model" text NOT NULL,
  "link_id" integer REFERENCES "tracking_links"("id") ON DELETE SET NULL,
  "code" text,
  "video_url" text,
  "campaign" text,
  "utm_source" text,
  "utm_medium" text,
  "utm_campaign" text,
  "utm_content" text,
  "ad_id" text,
  "creative_id" text,
  "channel" text NOT NULL,
  "matched_by" text NOT NULL,
  "touched_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "lead_attributions_model_check" CHECK ("model" IN ('first','last')),
  CONSTRAINT "lead_attributions_channel_check" CHECK ("channel" IN ('portal','whatsapp','meta_lead_ads','otro')),
  CONSTRAINT "lead_attributions_matched_check" CHECK ("matched_by" IN ('codigo_whatsapp','clic_visitante','meta_form','utm'))
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "lead_attributions_lead_model_unq" ON "lead_attributions" ("lead_id","model");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "lead_attributions_link_idx" ON "lead_attributions" ("link_id");--> statement-breakpoint
ALTER TABLE "lead_attributions" ENABLE ROW LEVEL SECURITY;
