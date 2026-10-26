export type Intervalo = { id: number; assigneeId: number | null; startsAt: Date | string | null; endsAt: Date | string | null; status?: string | null };
export function diasDelMes(fecha: string): string[] {
 if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) throw new Error("Indica una fecha válida.");
 const first=new Date(fecha.slice(0,7)+"-01T12:00:00Z");
 if (!Number.isFinite(first.getTime())) throw new Error("Indica una fecha válida.");
 const start=new Date(first);start.setUTCDate(1-(first.getUTCDay()+6)%7);
 return Array.from({length:42},(_,i)=>{const date=new Date(start);date.setUTCDate(start.getUTCDate()+i);return date.toISOString().slice(0,10);});
}
export function cambioDeHorario(cita: Intervalo, day: string, time: string) {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error("Indica una fecha y hora válidas.");
 const startsAt=new Date(day+"T"+time+":00-04:00");
 if(!Number.isFinite(startsAt.getTime())||new Date(day+"T12:00:00Z").toISOString().slice(0,10)!==day)throw new Error("Indica una fecha y hora válidas.");
 if(!cita.startsAt)throw new Error("La cita no tiene hora de inicio; complétala en la agenda.");
 const duration=cita.endsAt?new Date(cita.endsAt).getTime()-new Date(cita.startsAt).getTime():null;
 if(duration!==null&&(!Number.isFinite(duration)||duration<=0))throw new Error("Corrige la duración de esta cita antes de moverla.");
 return {startsAt:startsAt.toISOString(),endsAt:duration===null?null:new Date(startsAt.getTime()+duration).toISOString()};
}
export function conflictosVisibles(cita: Intervalo, rows: readonly Intervalo[], start: string, end: string | null): number[] {
 const from=Date.parse(start);const to=end?Date.parse(end):from+1;
 return rows.filter(row=>row.id!==cita.id&&row.status!=="cancelled"&&row.assigneeId===cita.assigneeId&&row.startsAt&&new Date(row.startsAt).getTime()<to&&(row.endsAt?new Date(row.endsAt).getTime():new Date(row.startsAt).getTime()+1)>from).map(row=>row.id);
}
export function ordenParadas<T>(rows: readonly T[], from: number, direction: -1 | 1): T[] {
 const result=[...rows];const to=from+direction;if(from<0||to<0||from>=rows.length||to>=rows.length)return result;
 [result[from],result[to]]=[result[to]!,result[from]!];return result;
}
export function validarCampana(input: {name:string;consentimiento:boolean;exclusiones:boolean;fecha:string}): Record<string,string> {
 const errors:Record<string,string>={};if(!input.name.trim())errors.name="Escribe un nombre para el borrador.";
 if(!input.consentimiento)errors.consentimiento="Incluye consentimiento acreditado como condición del segmento.";
 if(!input.exclusiones)errors.exclusiones="Excluye las bajas y oposiciones antes de preparar el envío.";
 if(!input.fecha||!Number.isFinite(Date.parse(input.fecha)))errors.fecha="Indica cuándo revisar la campaña.";return errors;
}

export function eventoEnDia(cita:Intervalo,day:string):boolean {
 if(!cita.startsAt)return false;
 const from=Date.parse(day+"T00:00:00-04:00"),to=from+86400000;
 const start=new Date(cita.startsAt).getTime();
 return start<to&&(cita.endsAt?new Date(cita.endsAt).getTime()>from:start>=from);
}
