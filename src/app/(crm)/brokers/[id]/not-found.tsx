import Link from "next/link";

export default function BrokerNoEncontrado() {
  return <div className="empty" role="status">
    <strong>Asesor no encontrado</strong>
    <p>La ficha no existe o no está disponible para tu alcance.</p>
    <Link className="button secondary" href="/brokers">Volver a brokers</Link>
  </div>;
}
