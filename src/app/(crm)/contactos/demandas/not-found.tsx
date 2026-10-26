import Link from "next/link";
export default function DemandaNotFound(){return <section role="status" className="empty"><h1>Demanda no encontrada</h1><p>La demanda no existe o no está disponible para tu usuario.</p><Link className="button min-h-12" href="/contactos/demandas">Volver a demandas</Link></section>;}
