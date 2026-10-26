import {z} from "zod";
import {requireActor} from "@/infrastructure/auth/actor";
import {requireScopeInPage} from "@/infrastructure/page-guard";
import {can} from "@/domain/rbac";
import {fechaSantoDomingo,medianocheSantoDomingo,sumarDias} from "@/domain/zona-horaria";
import {consultarAgendaOperativa} from "@/application/actividades/agenda-operativa";
import {agendaOperativa} from "@/infrastructure/contenedor/agenda-operativa";
import {diasDelMes} from "../_componentes/operaciones";
import {CalendarioMensual} from "../_componentes/calendario-mensual";
export default async function CalendarioPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const actor=await requireActor();requireScopeInPage(actor,"activities","view");
 const raw=(await searchParams).mes;const parsed=z.iso.date().safeParse(typeof raw==="string"?raw:undefined);const anchor=parsed.success?parsed.data:fechaSantoDomingo(new Date());const days=diasDelMes(anchor);
 const events=await consultarAgendaOperativa(agendaOperativa(),actor,medianocheSantoDomingo(days[0]!),medianocheSantoDomingo(sumarDias(days[41]!,1)));
 return <CalendarioMensual citas={events} anchor={anchor} puedeEditar={can(actor,"activities","edit")}/>;
}
