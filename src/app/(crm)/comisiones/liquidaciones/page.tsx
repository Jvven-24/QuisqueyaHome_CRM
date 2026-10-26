import { leerComisionesVisibles } from "../_datos";
import { ObservedSettlements } from "../_componentes/observed";
import { PreviewDesk } from "../../reservas/_componentes/preview-desk";
import { settlementsExample } from "../_ejemplo";
import s from "../../reservas/_componentes/finanzas.module.css";
export const metadata = { title: "Liquidaciones y pago a brokers · Quisqueya Home" };
export default async function LiquidacionesPage() { const { rows } = await leerComisionesVisibles(); return <div className={s.desk}><PreviewDesk config={settlementsExample}/><ObservedSettlements rows={rows}/></div>; }
