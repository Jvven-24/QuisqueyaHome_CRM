import Link from "next/link";
export default function ProyectoSinPermiso() {
  return <main className="page"><section className="empty">
    <h1>No tienes acceso a este proyecto</h1>
    <p>No hay un proyecto disponible para tu cuenta en esta dirección. Solicita acceso a administración.</p>
    <Link className="button" href="/propiedades">Volver a propiedades</Link>
  </section></main>;
}
