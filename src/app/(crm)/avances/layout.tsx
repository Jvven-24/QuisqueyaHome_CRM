import { EstadoConexion } from "../propiedades/_estado-conexion";
export default function LayoutModulo({ children }: { children: React.ReactNode }) {
  return <div className="min-w-0 max-w-full"><EstadoConexion />{children}</div>;
}
