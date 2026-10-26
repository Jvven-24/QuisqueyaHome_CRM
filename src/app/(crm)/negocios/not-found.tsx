import Link from "next/link";

export default function NoEncontrado() {
  return <section role="status" className="empty"><h1>Negocio no encontrado</h1><p>El registro no existe o no está disponible para tu usuario.</p><Link className="button" href="/negocios">Volver a negocios</Link></section>;
}
