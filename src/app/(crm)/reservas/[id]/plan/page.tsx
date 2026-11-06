import { visibleReservation } from "../../_visible-reservation";
import { FinanceLink } from "../../_componentes/kit";

export default async function ReservationPlan({ params }: {
    params: Promise<{
        id: string;
    }>;
}) {
    const { row } = await visibleReservation((await params).id);
    // Sin contrato de planes y cuotas (M40) no hay datos reales de esta reserva: se dice así
    // y no se muestran importes de otra cartera que podrían leerse como suyos.
    return (
        <section aria-labelledby="plan-no-disponible">
            <h2 id="plan-no-disponible">Plan de pagos no disponible</h2>
            <p role="status">
                La reserva #{row.id} todavía no tiene un plan de pagos que consultar en el CRM. Cuando el módulo de planes y cuotas esté
                conectado, aparecerá aquí con su total, participantes y saldos.
            </p>
            <FinanceLink href={"/reservas/" + row.publicId}>Volver al expediente</FinanceLink>
        </section>
    );
}
