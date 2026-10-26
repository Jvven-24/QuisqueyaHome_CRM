"use client";
import { EstadoError } from "../../_ui/estados";
export default function ErrorFinanzas({reset}:{reset:()=>void}){return <EstadoError mensaje="No se pudo cargar esta pantalla. Conserva tus datos y vuelve a intentar." reset={reset}/>;}
