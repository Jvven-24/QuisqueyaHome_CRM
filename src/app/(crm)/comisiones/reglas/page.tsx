import { leerComisionesVisibles } from "../_datos";
import { ObservedRules } from "../_componentes/observed";
import { PreviewDesk } from "../../reservas/_componentes/preview-desk";
import { rulesExample } from "../_ejemplo";
import { requireActor } from "@/infrastructure/auth/actor";
import { rulesConfigFor } from "./permisos";
import s from "../../reservas/_componentes/finanzas.module.css";
export const metadata = { title: "Reglas de comisión y reparto · Quisqueya Home" };
export default async function ReglasPage() {
  const actor = await requireActor();
  const { rows } = await leerComisionesVisibles();
  const config = rulesConfigFor(actor, rulesExample);
  return <div className={s.desk}><PreviewDesk config={config}/><ObservedRules rows={rows}/></div>;
}
