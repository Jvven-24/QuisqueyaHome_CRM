"use client";
import { ModuleTabs } from "@/components/modulo";
const enlaces = [["/reservas/holds","Holds"],["/reservas","Reservas"],["/reservas/cartera","Cartera y planes"],["/reservas/conciliacion","Conciliación"],["/reservas/excepciones","Excepciones"],["/reservas/facturacion","Facturación"],["/comisiones","Libro"],["/comisiones/reglas","Reglas"],["/comisiones/liquidaciones","Liquidaciones"],["/metas","Metas"]] as const;
export function NavegacionFinanzas(){return <ModuleTabs label="Finanzas y Cobros" items={enlaces.map(([href,label])=>({href,label,match:href!=="/reservas"&&href!=="/comisiones"?"prefix" as const:undefined}))} className="mb-4"/>;}
