import {and,or,gt,gte,isNull,lt,type AnyColumn} from "drizzle-orm";
/** Intervalos [inicio, fin); sin fin solo pertenece al día de inicio. */
export function solapamientoAgenda(columns:{startsAt:AnyColumn;endsAt:AnyColumn},desde:Date,hasta:Date){
 return and(lt(columns.startsAt,hasta),or(gt(columns.endsAt,desde),and(isNull(columns.endsAt),gte(columns.startsAt,desde))));
}
