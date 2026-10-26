import {NavegacionRed} from "../brokers/_ui/navegacion-red";
import {EstadoConexion} from "../brokers/estado-conexion";
export default function ComunidadLayout({children}:{children:React.ReactNode}){return <div className="min-w-0 max-w-full pb-28 md:pb-0"><EstadoConexion/><NavegacionRed comunidad/>{children}</div>;}
