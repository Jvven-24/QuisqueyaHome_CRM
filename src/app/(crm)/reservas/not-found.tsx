import { Empty, FinanceLink } from "./_componentes/kit";
export default function ReservaNoEncontrada() { return <Empty title="Reserva no encontrada"><p>La reserva no existe o no está disponible en tu alcance.</p><FinanceLink href="/reservas">Volver a reservas</FinanceLink></Empty>; }
