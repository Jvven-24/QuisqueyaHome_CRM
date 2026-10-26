import {and,eq} from "drizzle-orm";
import type {LecturaAgendaOperativa} from "../../../application/actividades/agenda-operativa";
import {getDb} from "../client";
import {activities,users} from "../schema";
import {solapamientoAgenda} from "./agenda-rango";
import {visibleRows} from "../../rbac-filter";
export function repositorioAgendaOperativa():LecturaAgendaOperativa {
 return {async listar(actor,scope,desde,hasta){return getDb().select({id:activities.id,title:activities.title,description:activities.description,activityType:activities.activityType,startsAt:activities.startsAt,endsAt:activities.endsAt,location:activities.location,status:activities.status,assigneeId:activities.assigneeId,assigneeName:users.fullName}).from(activities).leftJoin(users,eq(users.id,activities.assigneeId)).where(and(visibleRows(actor,scope,activities.assigneeId,activities.deletedAt),solapamientoAgenda(activities,desde,hasta))).orderBy(activities.startsAt);}};
}
