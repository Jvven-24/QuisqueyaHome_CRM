import type { ReactNode } from "react";
import { EstadoConexion } from "../brokers/estado-conexion";

import { NavegacionFinanzas } from "../reservas/_finanzas/navegacion";
export default function ComisionesLayout({ children }: { children: ReactNode }) {
  return <><EstadoConexion /><NavegacionFinanzas />{children}</>;
}
