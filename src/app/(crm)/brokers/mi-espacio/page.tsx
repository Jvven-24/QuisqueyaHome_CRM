import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { brokerProfiles } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";

/**
 * «Mi espacio» lleva a la ficha propia. Quien no tiene perfil de asesor (un
 * administrador o asistente) no tiene ficha: antes caía en «Asesor no
 * encontrado»; ahora va al directorio de brokers.
 */
export default async function MiEspacio() {
  const actor = await requireActor();
  requireScopeInPage(actor, "brokers", "view");
  const [perfil] = await getDb()
    .select({ userId: brokerProfiles.userId })
    .from(brokerProfiles)
    .where(eq(brokerProfiles.userId, actor.userId))
    .limit(1);
  redirect(perfil ? "/brokers/" + actor.userId : "/brokers");
}
