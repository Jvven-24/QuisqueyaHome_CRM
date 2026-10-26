import type { ReactNode } from "react";
import { requireActor } from "@/infrastructure/auth/actor";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { FinanceShell } from "./_componentes/kit";
export default async function ReservasLayout({ children }: {
    children: ReactNode;
}) { const actor = await requireActor(); requireScopeInPage(actor, "deals", "view"); return <FinanceShell>{children}</FinanceShell>; }
