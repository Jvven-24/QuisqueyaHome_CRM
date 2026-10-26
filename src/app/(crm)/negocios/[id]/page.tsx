import { cache } from "react";
import { notFound } from "next/navigation";
import PipelinePage from "../page";

export const metadata = { title: "Ficha de negocio · CRM Quisqueya Home" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const resolverFicha = cache(async (id: string, consulta: string) => {
  if (!/^\d{1,10}$/.test(id) || Number(id) <= 0 || Number(id) > 2147483647) notFound();
  return PipelinePage({ searchParams: Promise.resolve({ ...JSON.parse(consulta), deal: id, ficha: "1" }) });
});

// generateMetadata puede transmitirse; el viewport debe resolverse antes del shell.
export async function generateViewport({ params, searchParams }: Props) {
  await resolverFicha((await params).id, JSON.stringify(await searchParams));
  return {};
}

export default async function FichaNegocioPage({ params, searchParams }: Props) {
  return resolverFicha((await params).id, JSON.stringify(await searchParams));
}
