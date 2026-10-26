import { cache } from "react";
import { notFound } from "next/navigation";
import ContactosPage from "../page";

export const metadata = { title: "Ficha de contacto · CRM Quisqueya Home" };

const resolverFicha = cache(async (id: string) => {
  if (!/^\d{1,10}$/.test(id) || Number(id) <= 0 || Number(id) > 2147483647) notFound();
  return ContactosPage({ searchParams: Promise.resolve({ contacto: id, ficha: "1" }) });
});

// El viewport bloquea el primer envío incluso bajo el loading del shell.
export async function generateViewport({ params }: { params: Promise<{ id: string }> }) {
  await resolverFicha((await params).id);
  return {};
}

export default async function FichaContactoPage({ params }: { params: Promise<{ id: string }> }) {
  return resolverFicha((await params).id);
}
