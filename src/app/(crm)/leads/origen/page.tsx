import { analizar, rangoDeFiltros } from "@/application/seguimiento/analitica";
import { requireActor } from "@/infrastructure/auth/actor";
import { analiticaOrigenDatos } from "@/infrastructure/contenedor/seguimiento";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { AnaliticaOrigen } from "./analitica-vista";

const primero = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const iso = (d: Date) => new Date(d.getTime() - 4 * 3600 * 1000).toISOString().slice(0, 10);

export default async function OrigenPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const actor = await requireActor();
  const alcance = requireScopeInPage(actor, "leads", "view");
  const sp = await searchParams;
  const modelo = primero(sp.modelo) === "last" ? "last" : "first";
  const rango = rangoDeFiltros({ desde: primero(sp.desde), hasta: primero(sp.hasta) }, new Date());
  const { filas, clics } = await analiticaOrigenDatos({ actor, alcance, modelo, desde: rango.desde, hasta: rango.hasta });
  const datos = analizar(filas, clics, rango);
  return <AnaliticaOrigen datos={datos} modelo={modelo} desde={iso(rango.desde)} hasta={iso(rango.hasta)} veClics={alcance === "all"} hoy={iso(new Date())} />;
}
