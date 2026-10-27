/**
 * Salud pública del CRM para monitoreo (uptime, proxy, despliegue).
 * No requiere sesión y no expone detalles del error: solo dice si la app y la
 * base de datos responden.
 */
import { sql } from "drizzle-orm";
import { getDb } from "@/infrastructure/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const time = new Date().toISOString();
  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true, service: "crm", time }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, service: "crm", time }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
