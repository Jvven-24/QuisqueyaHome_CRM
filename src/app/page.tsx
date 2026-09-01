import { redirect } from "next/navigation";

/** La raíz no tiene contenido propio: el CRM empieza en Inicio. */
export default function Home() {
  redirect("/inicio");
}
