import { visibleReservation } from "../../_visible-reservation";
import { PreviewDesk } from "../../_componentes/preview-desk";
import { FinanceLink } from "../../_componentes/kit";
import { portfolioExample } from "../../_ejemplo";
export default async function ReservationPlan({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { const { row } = await visibleReservation((await params).id); return <><p>Reserva #{row.id}: aún no se puede consultar su plan. Los importes siguientes son una muestra independiente y no corresponden a esta reserva.</p><FinanceLink href={"/reservas/" + row.publicId}>Volver al expediente</FinanceLink><PreviewDesk config={portfolioExample} portfolio/></>; }
