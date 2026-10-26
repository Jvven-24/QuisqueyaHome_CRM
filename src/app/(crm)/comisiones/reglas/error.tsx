"use client";
import { EstadoError } from "../../_ui/estados";
export default function ErrorVista({reset}:{reset:()=>void}){return <EstadoError mensaje="No se pudo cargar el registro de comisiones. Reintenta." reset={reset}/>;}
