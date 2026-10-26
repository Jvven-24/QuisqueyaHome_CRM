import { leerComisionesVisibles } from "../_datos";
import { ObservedRules } from "../_componentes/observed";
import { PreviewDesk } from "../../reservas/_componentes/preview-desk";
import { rulesExample } from "../_ejemplo";
import s from "../../reservas/_componentes/finanzas.module.css";
export const metadata = { title: "Reglas de comisión y reparto · Quisqueya Home" };
export default async function ReglasPage() { const { rows } = await leerComisionesVisibles(); return <div className={s.desk}><PreviewDesk config={rulesExample}/><ObservedRules rows={rows}/></div>; }
