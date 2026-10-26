import Link from "next/link";
export default function ProyectoNoEncontrado() {
  return <section className="panel p-6 space-y-3" role="status">
    <h1>Proyecto no encontrado o sin acceso</h1>
    <p>No encontramos un proyecto disponible para tu cuenta. Comprueba la dirección o solicita acceso a administración.</p>
    <Link className="button" href="/propiedades">Volver a propiedades</Link>
  </section>;
}
