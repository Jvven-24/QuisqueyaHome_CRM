import type { ReactNode } from "react";
import { EstadoConexion } from "../brokers/estado-conexion";

export default function MetasLayout({ children }: { children: ReactNode }) {
  return <><EstadoConexion />{children}</>;
}
