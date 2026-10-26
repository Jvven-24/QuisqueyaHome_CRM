import {NavegacionRed} from "./_ui/navegacion-red";
import type { ReactNode } from "react";
import { EstadoConexion } from "./estado-conexion";

export default function BrokersLayout({ children }: { children: ReactNode }) {
  return <><EstadoConexion /><NavegacionRed />{children}</>;
}
