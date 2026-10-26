import { Empty, FinanceLink } from "../reservas/_componentes/kit";
export default function MissingCommission() { return <Empty title="Expediente de comisión no encontrado"><p>El expediente no existe o no está disponible en tu alcance.</p><FinanceLink href="/comisiones">Volver al libro</FinanceLink></Empty>; }
