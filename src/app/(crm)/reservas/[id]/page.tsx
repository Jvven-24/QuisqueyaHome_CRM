import { visibleReservation } from "../_visible-reservation";
import { ReservationDetail } from "../_componentes/reservation-detail";
export const metadata = { title: "Expediente de reserva · Quisqueya Home" };
export default async function ReservationPage({ params }: {
    params: Promise<{
        id: string;
    }>;
}) { return <ReservationDetail {...await visibleReservation((await params).id)}/>; }
