import LeadsPage from "../page";
export const metadata = { title: "Distribución de leads · Quisqueya Home" };
export default async function AsignacionPage({ searchParams }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) { const params = await searchParams; return LeadsPage({ searchParams: Promise.resolve({ ...params, vista: "asignacion", lead: undefined }) }); }
