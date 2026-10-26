import { NavegacionOperativa } from "../agenda/_componentes/navegacion";
import { EstadoConexion } from "../propiedades/_estado-conexion";
export default function LayoutModulo({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 max-w-full pb-28 md:pb-0"><EstadoConexion /><NavegacionOperativa grupo="agenda" />{children}</div>;
}
