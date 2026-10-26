import { contextoFinanzas } from "../_lectura";
import { FacturacionVista } from "./vista";
export default async function FacturacionPage(){await contextoFinanzas();return <FacturacionVista/>}
