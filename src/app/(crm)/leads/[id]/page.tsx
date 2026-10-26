import { cache } from "react";
import { notFound } from "next/navigation";
import LeadsPage from "../page";

export const metadata = { title: "Ficha de lead · CRM Quisqueya Home" };

const resolverFicha = cache(async (id: string) => {
  if (!/^\d{1,10}$/.test(id) || Number(id) <= 0 || Number(id) > 2147483647) notFound();
  return LeadsPage({ searchParams: Promise.resolve({ lead: id, ficha: "1" }) });
});

// Next 15 transmite metadata, pero espera el viewport antes de emitir el shell.
// La misma lectura autorizada queda memorizada solo durante esta petición React.
export async function generateViewport({ params }: { params: Promise<{ id: string }> }) {
  await resolverFicha((await params).id);
  return {};
}

export default async function FichaLeadPage({ params }: { params: Promise<{ id: string }> }) {
  return resolverFicha((await params).id);
}
