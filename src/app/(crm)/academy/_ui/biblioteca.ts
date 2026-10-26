type CursoBuscable={codigo:string;nombre:string;categoria:string;matriculado:boolean};
const normalizar=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("es");
export function filtrarBiblioteca<T extends CursoBuscable>(rows:readonly T[],query:string,categoria:string,soloMatriculados:boolean):T[]{const term=normalizar(query.trim());return rows.filter(row=>(!categoria||row.categoria===categoria)&&(!soloMatriculados||row.matriculado)&&normalizar(row.codigo+" "+row.nombre).includes(term));}
export function cursoSeleccionadoValido(id:number,rows:readonly {id:string|number}[]):boolean{return Number.isSafeInteger(id)&&id>0&&rows.some(row=>Number(row.id)===id);}
