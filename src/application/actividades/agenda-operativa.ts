import {requireScope,type Actor,type PermissionScope} from "../../domain/rbac.ts";
import {ValidationError} from "../../domain/errors.ts";
export type EventoAgenda={id:number;title:string;description:string|null;activityType:string;startsAt:Date|null;endsAt:Date|null;location:string|null;status:string;assigneeId:number|null;assigneeName:string|null};
export interface LecturaAgendaOperativa {listar(actor:Actor,scope:PermissionScope,desde:Date,hasta:Date):Promise<EventoAgenda[]>;}
export async function consultarAgendaOperativa(repo:LecturaAgendaOperativa,actor:Actor,desde:Date,hasta:Date){
 const scope=requireScope(actor,"activities","view");
 const duration=hasta.getTime()-desde.getTime();
 if(!Number.isFinite(duration)||duration<=0||duration>45*86400000)throw new ValidationError("Selecciona un intervalo válido de hasta 45 días.");
 return repo.listar(actor,scope,desde,hasta);
}
