import { redirect } from "next/navigation";
import { getActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { ApprovalsPreview } from "./vista";

export const metadata = { title: "Aprobaciones · Quisqueya Home" };

export default async function ApprovalsPage() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  requireScopeInPage(actor, "dashboard", "view");
  return <ApprovalsPreview />;
}
