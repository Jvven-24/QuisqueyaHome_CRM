import {requireActor} from "@/infrastructure/auth/actor";
import {requireScopeInPage} from "@/infrastructure/page-guard";
import {consultarAgendaOperativa} from "@/application/actividades/agenda-operativa";
import {agendaOperativa} from "@/infrastructure/contenedor/agenda-operativa";
import {fechaSantoDomingo,medianocheSantoDomingo,sumarDias} from "@/domain/zona-horaria";
import {RegistroActividad} from "../_componentes/registro-actividad";
export default async function ActividadPage(){const actor=await requireActor();requireScopeInPage(actor,"communications","view");requireScopeInPage(actor,"activities","view");const hoy=fechaSantoDomingo(new Date());const rows=await consultarAgendaOperativa(agendaOperativa(),actor,medianocheSantoDomingo(sumarDias(hoy,-30)),medianocheSantoDomingo(sumarDias(hoy,1)));return <RegistroActividad filas={rows.filter(r=>["call","email","whatsapp"].includes(r.activityType))}/>;}
